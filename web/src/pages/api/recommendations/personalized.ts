import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = '10' } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID不能为空', 
      });
    }

    const limitNum = parseInt(limit as string, 10);
    const recommendations = await getPersonalizedRecommendations(userId as string, limitNum);

    res.status(200).json({
      success: true,
      recommendations,
      algorithm: 'personalized',
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('获取个性化推荐失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取个性化推荐失败', 
    });
  }
}

async function getPersonalizedRecommendations(userId: string, limit: number) {
  try {
    // 获取用户历史行为
    const userBehavior = await getUserBehavior(userId);
    
    // 获取候选提示词
    const candidates = await getCandidatePrompts(userId, limit * 3);
    
    // 计算个性化分数
    const scoredRecommendations = await scorePrompts(candidates, userBehavior);
    
    // 排序并返回top N
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('生成个性化推荐失败:', error);
    throw error;
  }
}

async function getUserBehavior(userId: string) {
  // 获取用户使用历史
  const { data: usageHistory, error: usageError } = await supabase
    .from('prompt_usage')
    .select(`
      prompt_id,
      created_at,
      prompts (
        category,
        tags
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (usageError) throw usageError;

  // 获取用户收藏
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('social_interactions')
    .select(`
      prompt_id,
      created_at,
      prompts (
        category,
        tags
      )
    `)
    .eq('user_id', userId)
    .eq('type', 'bookmark');

  if (bookmarksError) throw bookmarksError;

  // 获取用户评分
  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select(`
      prompt_id,
      rating,
      prompts (
        category,
        tags
      )
    `)
    .eq('user_id', userId);

  if (ratingsError) throw ratingsError;

  // 分析用户偏好
  const preferences = analyzeUserPreferences(usageHistory || [], bookmarks || [], ratings || []);
  
  return {
    usageHistory: usageHistory || [],
    bookmarks: bookmarks || [],
    ratings: ratings || [],
    preferences,
  };
}

function analyzeUserPreferences(usageHistory: any[], bookmarks: any[], ratings: any[]) {
  const categoryCount = new Map<string, number>();
  const tagCount = new Map<string, number>();
  let totalRating = 0;
  let ratingCount = 0;

  // 分析使用历史
  usageHistory.forEach(usage => {
    if (usage.prompts?.category) {
      categoryCount.set(usage.prompts.category, (categoryCount.get(usage.prompts.category) || 0) + 1);
    }
    if (usage.prompts?.tags) {
      usage.prompts.tags.forEach((tag: string) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    }
  });

  // 分析收藏（权重更高）
  bookmarks.forEach(bookmark => {
    if (bookmark.prompts?.category) {
      categoryCount.set(bookmark.prompts.category, (categoryCount.get(bookmark.prompts.category) || 0) + 2);
    }
    if (bookmark.prompts?.tags) {
      bookmark.prompts.tags.forEach((tag: string) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 2);
      });
    }
  });

  // 分析评分
  ratings.forEach(rating => {
    totalRating += rating.rating;
    ratingCount++;
    
    if (rating.rating >= 4 && rating.prompts) {
      // 高评分的内容加权
      if (rating.prompts.category) {
        categoryCount.set(rating.prompts.category, (categoryCount.get(rating.prompts.category) || 0) + 3);
      }
      if (rating.prompts.tags) {
        rating.prompts.tags.forEach((tag: string) => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 3);
        });
      }
    }
  });

  // 转换为偏好数组
  const favoriteCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, weight: count }));

  const favoriteTags = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, weight: count }));

  return {
    favoriteCategories,
    favoriteTags,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    activityLevel: usageHistory.length + bookmarks.length,
    recentActivity: usageHistory.slice(0, 10),
  };
}

async function getCandidatePrompts(userId: string, limit: number) {
  // 获取公开的、用户未使用过的提示词
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select(`
      id,
      name,
      description,
      category,
      tags,
      created_at,
      updated_at,
      user_id,
      users (
        display_name,
        email
      )
    `)
    .eq('is_public', true)
    .neq('user_id', userId) // 排除用户自己的提示词
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return prompts || [];
}

async function scorePrompts(candidates: any[], userBehavior: any) {
  const { preferences } = userBehavior;
  
  const scoredPrompts = await Promise.all(candidates.map(async (prompt) => {
    let score = 0;

    // 基础分数
    score += 0.1;

    // 类别匹配分数
    const categoryMatch = preferences.favoriteCategories.find(
      (fav: any) => fav.category === prompt.category,
    );
    if (categoryMatch) {
      score += Math.min(categoryMatch.weight * 0.1, 0.3);
    }

    // 标签匹配分数
    if (prompt.tags) {
      let tagScore = 0;
      prompt.tags.forEach((tag: string) => {
        const tagMatch = preferences.favoriteTags.find((fav: any) => fav.tag === tag);
        if (tagMatch) {
          tagScore += Math.min(tagMatch.weight * 0.05, 0.2);
        }
      });
      score += Math.min(tagScore, 0.4);
    }

    // 获取社交统计
    const socialStats = await getPromptSocialStats(prompt.id);
    
    // 流行度分数
    const popularityScore = Math.log(socialStats.likes + 1) * 0.05 + 
                           Math.log(socialStats.usage_count + 1) * 0.05;
    score += Math.min(popularityScore, 0.2);

    // 质量分数（基于评分）
    if (socialStats.average_rating > 0) {
      score += (socialStats.average_rating / 5) * 0.15;
    }

    // 新鲜度分数
    const daysSinceCreated = (Date.now() - new Date(prompt.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.exp(-daysSinceCreated / 30) * 0.1;
    score += freshnessScore;

    // 协同过滤分数（简化版）
    const collaborativeScore = await getCollaborativeScore(prompt.id, userBehavior.preferences);
    score += collaborativeScore;

    const reason = generateRecommendationReason(prompt, preferences, socialStats);

    return {
      prompt: {
        ...prompt,
        author: prompt.users?.display_name || prompt.users?.email || '匿名用户',
        likes: socialStats.likes,
        usage_count: socialStats.usage_count,
        average_rating: socialStats.average_rating,
      },
      score: Math.min(score, 1),
      reason,
      algorithm: 'personalized_ml',
    };
  }));

  return scoredPrompts;
}

async function getPromptSocialStats(promptId: string) {
  // 获取点赞数
  const { count: likes } = await supabase
    .from('social_interactions')
    .select('*', { count: 'exact' })
    .eq('prompt_id', promptId)
    .eq('type', 'like');

  // 获取使用量
  const { count: usage_count } = await supabase
    .from('prompt_usage')
    .select('*', { count: 'exact' })
    .eq('prompt_id', promptId);

  // 获取平均评分
  const { data: ratingData } = await supabase
    .from('ratings')
    .select('rating')
    .eq('prompt_id', promptId);

  const ratings = ratingData?.map(r => r.rating) || [];
  const average_rating = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : 0;

  return {
    likes: likes || 0,
    usage_count: usage_count || 0,
    average_rating: Math.round(average_rating * 10) / 10,
  };
}

async function getCollaborativeScore(promptId: string, userPreferences: any): Promise<number> {
  // 简化的协同过滤：查找有相似偏好的用户喜欢的内容
  try {
    const { data: similarUsers } = await supabase
      .from('social_interactions')
      .select('user_id')
      .eq('prompt_id', promptId)
      .eq('type', 'like');

    if (!similarUsers || similarUsers.length === 0) {
      return 0;
    }

    // 简单返回一个基于相似用户数量的分数
    return Math.min(Math.log(similarUsers.length + 1) * 0.05, 0.1);
  } catch (error) {
    console.error('计算协同过滤分数失败:', error);
    return 0;
  }
}

function generateRecommendationReason(prompt: any, preferences: any, socialStats: any): string {
  const reasons = [];

  // 类别匹配
  const categoryMatch = preferences.favoriteCategories.find(
    (fav: any) => fav.category === prompt.category,
  );
  if (categoryMatch) {
    reasons.push('符合偏好类别');
  }

  // 标签匹配
  if (prompt.tags) {
    const hasMatchingTag = prompt.tags.some((tag: string) =>
      preferences.favoriteTags.some((fav: any) => fav.tag === tag),
    );
    if (hasMatchingTag) {
      reasons.push('标签匹配');
    }
  }

  // 高质量
  if (socialStats.average_rating >= 4) {
    reasons.push('高评分内容');
  }

  // 受欢迎
  if (socialStats.likes > 10) {
    reasons.push('深受欢迎');
  }

  if (reasons.length === 0) {
    return '为您发现';
  }

  return reasons.slice(0, 2).join(' • ');
} 