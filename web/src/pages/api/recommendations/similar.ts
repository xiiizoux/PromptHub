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
    const { promptId, limit = '10' } = req.query;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空', 
      });
    }

    const limitNum = parseInt(limit as string, 10);
    const recommendations = await getSimilarPrompts(promptId as string, limitNum);

    res.status(200).json({
      success: true,
      recommendations,
      algorithm: 'content_similarity',
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('获取相似推荐失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取相似推荐失败', 
    });
  }
}

async function getSimilarPrompts(promptId: string, limit: number) {
  try {
    // 获取源提示词信息
    const { data: sourcePrompt, error: sourceError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (sourceError) throw sourceError;
    if (!sourcePrompt) throw new Error('提示词不存在');

    // 获取候选提示词
    const { data: candidates, error: candidatesError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        content,
        created_at,
        updated_at,
        user_id,
        users (
          display_name,
          email
        )
      `)
      .eq('is_public', true)
      .neq('id', promptId) // 排除自身
      .limit(limit * 5); // 获取更多候选以便筛选

    if (candidatesError) throw candidatesError;

    // 计算相似度分数
    const scoredPrompts = await Promise.all(
      (candidates || []).map(async (candidate) => {
        const similarity = calculateSimilarity(sourcePrompt, candidate);
        const socialStats = await getPromptSocialStats(candidate.id);
        
        // 安全地获取作者信息
        let authorName = '匿名用户';
        try {
          if (candidate.users) {
            if (Array.isArray(candidate.users) && candidate.users.length > 0) {
              const user = candidate.users[0] as any;
              authorName = user?.display_name || user?.email || '匿名用户';
            } else {
              const user = candidate.users as any;
              authorName = user?.display_name || user?.email || '匿名用户';
            }
          }
        } catch (error) {
          // 如果出错就使用默认值
          authorName = '匿名用户';
        }

        return {
          prompt: {
            ...candidate,
            author: authorName,
            likes: socialStats.likes,
            usage_count: socialStats.usage_count,
            average_rating: socialStats.average_rating,
          },
          score: similarity.total,
          reason: similarity.reason,
          algorithm: 'content_similarity',
        };
      }),
    );

    // 按相似度排序并返回top N
    return scoredPrompts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('生成相似推荐失败:', error);
    throw error;
  }
}

function calculateSimilarity(source: any, candidate: any) {
  let totalScore = 0;
  const reasons = [];

  // 1. 类别匹配 (权重: 30%)
  if (source.category === candidate.category) {
    totalScore += 0.3;
    reasons.push('同类别');
  }

  // 2. 标签相似度 (权重: 25%)
  const tagSimilarity = calculateTagSimilarity(source.tags || [], candidate.tags || []);
  totalScore += tagSimilarity * 0.25;
  if (tagSimilarity > 0.5) {
    reasons.push('标签相似');
  }

  // 3. 内容相似度 (权重: 20%)
  const contentSimilarity = calculateContentSimilarity(
    source.content || '', 
    candidate.content || '',
  );
  totalScore += contentSimilarity * 0.2;
  if (contentSimilarity > 0.3) {
    reasons.push('内容相关');
  }

  // 4. 描述相似度 (权重: 15%)
  const descriptionSimilarity = calculateTextSimilarity(
    source.description || '', 
    candidate.description || '',
  );
  totalScore += descriptionSimilarity * 0.15;
  if (descriptionSimilarity > 0.3) {
    reasons.push('用途相似');
  }

  // 5. 名称相似度 (权重: 10%)
  const nameSimilarity = calculateTextSimilarity(
    source.name || '', 
    candidate.name || '',
  );
  totalScore += nameSimilarity * 0.1;

  // 生成推荐理由
  const reason = reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : '内容相关';

  return {
    total: Math.min(totalScore, 1),
    reason,
    breakdown: {
      category: source.category === candidate.category ? 0.3 : 0,
      tags: tagSimilarity * 0.25,
      content: contentSimilarity * 0.2,
      description: descriptionSimilarity * 0.15,
      name: nameSimilarity * 0.1,
    },
  };
}

function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0;
  if (tags1.length === 0 || tags2.length === 0) return 0;

  // 转换为小写进行比较
  const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
  const set2 = new Set(tags2.map(tag => tag.toLowerCase()));

  // 计算交集
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  // Jaccard相似度
  return intersection.size / union.size;
}

function calculateContentSimilarity(content1: string, content2: string): number {
  if (!content1 || !content2) return 0;

  // 简单的词汇重叠度计算
  const words1 = extractKeywords(content1);
  const words2 = extractKeywords(content2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  return intersection.size / union.size;
}

function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  // 简单的字符串相似度计算
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  return intersection.size / union.size;
}

function extractKeywords(text: string): string[] {
  // 提取关键词（简化版）
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !isStopWord(word),
    );

  // 计算词频
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // 返回高频词汇
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'as', 'are', 'was', 'will', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may',
    'might', 'must', 'shall', 'need', 'dare', 'ought', 'used', 'able', 'like', 'want',
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
  ]);
  
  return stopWords.has(word);
}

async function getPromptSocialStats(promptId: string) {
  try {
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
  } catch (error) {
    console.error('获取社交统计失败:', error);
    return {
      likes: 0,
      usage_count: 0,
      average_rating: 0,
    };
  }
} 