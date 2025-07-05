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
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const trendingPrompts = await getTrendingPrompts(limitNum);

    res.status(200).json({
      success: true,
      recommendations: trendingPrompts,
      algorithm: 'trending',
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('获取热门推荐失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取热门推荐失败', 
    });
  }
}

async function getTrendingPrompts(limit: number) {
  try {
    // 获取提示词基本信息和统计数据
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        is_public,
        created_at,
        updated_at,
        user_id,
        users (
          display_name,
          email
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit * 3); // 获取更多数据以便筛选

    if (promptsError) {
      throw promptsError;
    }

    // 获取使用统计
    const { data: usageStatsRaw, error: usageError } = await supabase
      .from('prompt_usage')
      .select('prompt_id');
    if (usageError) throw usageError;
    const usageStats = usageStatsRaw?.reduce((acc, cur) => {
      acc[cur.prompt_id] = (acc[cur.prompt_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 获取社交互动统计
    const { data: socialStatsRaw, error: socialError } = await supabase
      .from('social_interactions')
      .select('prompt_id, type');
    if (socialError) throw socialError;
    const socialStats = {} as Record<string, { likes: number; bookmarks: number }>;
    socialStatsRaw?.forEach(stat => {
      if (!socialStats[stat.prompt_id]) socialStats[stat.prompt_id] = { likes: 0, bookmarks: 0 };
      if (stat.type === 'like') socialStats[stat.prompt_id].likes++;
      if (stat.type === 'bookmark') socialStats[stat.prompt_id].bookmarks++;
    });

    // 获取评分统计
    const { data: ratingStatsRaw, error: ratingError } = await supabase
      .from('ratings')
      .select('prompt_id, rating');
    if (ratingError) throw ratingError;
    const ratingStats = {} as Record<string, { sum: number; count: number }>;
    ratingStatsRaw?.forEach(stat => {
      if (!ratingStats[stat.prompt_id]) ratingStats[stat.prompt_id] = { sum: 0, count: 0 };
      ratingStats[stat.prompt_id].sum += stat.rating;
      ratingStats[stat.prompt_id].count++;
    });

    // 计算平均分
    const ratingMap = new Map<string, { avg: number; count: number }>();
    Object.entries(ratingStats).forEach(([prompt_id, { sum, count }]) => {
      ratingMap.set(prompt_id, {
        avg: count > 0 ? sum / count : 0,
        count,
      });
    });

    // 构建统计映射
    const usageMap = new Map<string, number>();
    Object.entries(usageStats || {}).forEach(([prompt_id, count]) => {
      usageMap.set(prompt_id, count);
    });

    const socialMap = new Map<string, { likes: number; bookmarks: number }>();
    Object.entries(socialStats || {}).forEach(([prompt_id, obj]) => {
      socialMap.set(prompt_id, obj);
    });

    // 计算热门分数并排序
    const scoredPrompts = prompts?.map(prompt => {
      const usage = usageMap.get(prompt.id) || 0;
      const social = socialMap.get(prompt.id) || { likes: 0, bookmarks: 0 };
      const rating = ratingMap.get(prompt.id) || { avg: 0, count: 0 };
      
      // 热门度算法：加权计算使用量、点赞、收藏、评分
      const usageScore = Math.log(usage + 1) * 0.3;
      const likeScore = Math.log(social.likes + 1) * 0.25;
      const bookmarkScore = Math.log(social.bookmarks + 1) * 0.2;
      const ratingScore = (rating.avg * Math.log(rating.count + 1)) * 0.2;
      
      // 时间衰减：较新的内容获得加成
      const daysSinceCreated = (Date.now() - new Date(prompt.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const timeDecay = Math.exp(-daysSinceCreated / 30) * 0.05; // 30天衰减周期

      const totalScore = usageScore + likeScore + bookmarkScore + ratingScore + timeDecay;

      return {
        prompt: {
          ...prompt,
          author: (prompt.users as any)?.display_name || (prompt.users as any)?.email || '匿名用户',
          likes: social.likes,
          bookmarks: social.bookmarks,
          usage_count: usage,
          average_rating: rating.avg,
          rating_count: rating.count,
        },
        score: Math.min(totalScore / 2, 1), // 归一化到0-1
        reason: generateTrendingReason(usage, social, rating),
        algorithm: 'trending_weighted',
      };
    }) || [];

    // 按分数排序并返回前N个
    return scoredPrompts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('计算热门推荐失败:', error);
    throw error;
  }
}

function generateTrendingReason(
  usage: number, 
  social: { likes: number; bookmarks: number }, 
  rating: { avg: number; count: number },
): string {
  const reasons = [];
  
  if (usage > 50) reasons.push('高使用频率');
  if (social.likes > 20) reasons.push('深受喜爱');
  if (social.bookmarks > 15) reasons.push('广泛收藏');
  if (rating.avg > 4 && rating.count > 5) reasons.push('高质量评分');
  
  if (reasons.length === 0) {
    return '新兴热门';
  }
  
  return reasons.slice(0, 2).join(' • ');
} 