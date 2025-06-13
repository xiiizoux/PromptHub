import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId } = req.query;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空' 
      });
    }

    const suggestions = await getOptimizationSuggestions(promptId as string);

    res.status(200).json({
      success: true,
      suggestions,
      generated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('获取优化建议失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取优化建议失败' 
    });
  }
}

async function getOptimizationSuggestions(promptId: string) {
  try {
    // 获取提示词基本信息
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (promptError) throw promptError;

    // 获取性能数据
    const performanceData = await getPerformanceData(promptId);
    
    // 生成建议
    const suggestions = generateSuggestions(prompt, performanceData);
    
    return suggestions;
  } catch (error) {
    console.error('分析优化建议失败:', error);
    throw error;
  }
}

async function getPerformanceData(promptId: string) {
  // 获取使用数据
  const { data: usageData, error: usageError } = await supabase
    .from('prompt_usage')
    .select('*')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (usageError) throw usageError;

  // 获取评分数据
  const { data: ratingData, error: ratingError } = await supabase
    .from('ratings')
    .select('*')
    .eq('prompt_id', promptId);

  if (ratingError) throw ratingError;

  // 获取社交互动数据
  const { data: socialData, error: socialError } = await supabase
    .from('social_interactions')
    .select('*')
    .eq('prompt_id', promptId);

  if (socialError) throw socialError;

  return {
    usage: usageData || [],
    ratings: ratingData || [],
    social: socialData || []
  };
}

function generateSuggestions(prompt: any, performanceData: any) {
  const suggestions = [];
  const { usage, ratings, social } = performanceData;

  // 分析响应时间
  const responseTimes = usage.map((u: any) => u.latency_ms).filter((t: any) => t != null);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
    : 0;

  if (avgResponseTime > 2000) {
    suggestions.push({
      title: '优化响应时间',
      description: '当前平均响应时间较长，建议优化提示词长度和复杂度',
      priority: 'high',
      expected_improvement: '减少50%响应时间',
      implementation_effort: 'medium'
    });
  } else if (avgResponseTime > 1000) {
    suggestions.push({
      title: '改进响应速度',
      description: '考虑简化提示词结构，减少不必要的指令',
      priority: 'medium',
      expected_improvement: '提升25%响应速度',
      implementation_effort: 'low'
    });
  }

  // 分析Token使用
  const tokenUsages = usage.map((u: any) => (u.input_tokens || 0) + (u.output_tokens || 0));
  const avgTokens = tokenUsages.length > 0 
    ? tokenUsages.reduce((a: number, b: number) => a + b, 0) / tokenUsages.length 
    : 0;

  if (avgTokens > 3000) {
    suggestions.push({
      title: '优化Token使用',
      description: 'Token消耗过高，建议精简提示词内容和示例',
      priority: 'high',
      expected_improvement: '节省30%Token成本',
      implementation_effort: 'medium'
    });
  }

  // 分析用户满意度
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
    : 0;

  if (avgRating < 3 && ratings.length >= 5) {
    suggestions.push({
      title: '提升内容质量',
      description: '用户评分偏低，建议重新设计提示词逻辑和输出格式',
      priority: 'high',
      expected_improvement: '提高50%用户满意度',
      implementation_effort: 'high'
    });
  } else if (avgRating < 4 && ratings.length >= 3) {
    suggestions.push({
      title: '改善用户体验',
      description: '增加更多示例和使用说明，提升提示词易用性',
      priority: 'medium',
      expected_improvement: '提升用户满意度',
      implementation_effort: 'low'
    });
  }

  // 分析使用频率
  if (usage.length < 10) {
    suggestions.push({
      title: '提高曝光度',
      description: '使用频率较低，建议添加更多相关标签和改进描述',
      priority: 'medium',
      expected_improvement: '增加50%使用量',
      implementation_effort: 'low'
    });
  }

  // 分析社交互动
  const likes = social.filter((s: any) => s.type === 'like').length;
  const bookmarks = social.filter((s: any) => s.type === 'bookmark').length;

  if (usage.length > 20 && likes < 5) {
    suggestions.push({
      title: '增强社交价值',
      description: '使用量不错但点赞较少，考虑改进输出质量和实用性',
      priority: 'medium',
      expected_improvement: '提升社交互动',
      implementation_effort: 'medium'
    });
  }

  // 分析提示词内容
  const promptLength = prompt.content ? prompt.content.length : 0;
  if (promptLength > 2000) {
    suggestions.push({
      title: '精简提示词内容',
      description: '提示词过长可能影响效果，建议保留核心指令',
      priority: 'medium',
      expected_improvement: '提升执行效率',
      implementation_effort: 'medium'
    });
  }

  // 检查标签和分类
  if (!prompt.tags || prompt.tags.length < 3) {
    suggestions.push({
      title: '完善标签信息',
      description: '添加更多相关标签提高发现性',
      priority: 'low',
      expected_improvement: '提升10%发现率',
      implementation_effort: 'low'
    });
  }

  // 检查更新频率
  const lastUpdated = new Date(prompt.updated_at);
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 90 && usage.length > 0) {
    suggestions.push({
      title: '更新内容版本',
      description: '提示词较长时间未更新，建议根据用户反馈优化',
      priority: 'low',
      expected_improvement: '保持内容新鲜度',
      implementation_effort: 'medium'
    });
  }

  // 如果没有具体建议，提供通用建议
  if (suggestions.length === 0) {
    suggestions.push({
      title: '持续优化',
      description: '继续收集用户反馈，定期调整和改进提示词',
      priority: 'low',
      expected_improvement: '长期提升效果',
      implementation_effort: 'low'
    });
  }

  return suggestions;
} 