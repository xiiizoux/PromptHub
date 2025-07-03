/**
 * 用户上下文API端点 - Context Engineering核心功能
 * 为登录用户提供个性化的上下文信息
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { databaseService } from '@/lib/database-service';

// 用户上下文响应接口
interface UserContextResponse {
  userPreferences: Record<string, any>;
  promptRules: Array<any>;
  recentInteractions: Array<{
    timestamp: string;
    input?: string;
    output?: string;
    feedback?: 'positive' | 'negative' | null;
    context_applied?: Record<string, any>;
  }>;
  learningInsights: {
    usagePatterns: Record<string, any>;
    preferredStyles: string[];
    improvementSuggestions: string[];
  };
  contextStats: {
    totalInteractions: number;
    successRate: number;
    avgSatisfaction: number;
    personalizedSince: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 认证检查
    const supabase = createServerSupabaseClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: promptId } = req.query;
    const userId = session.user.id;

    if (typeof promptId !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    // 并行获取所有需要的数据
    const [
      userProfile,
      prompt,
      recentInteractions,
      contextStats
    ] = await Promise.all([
      getUserProfile(supabase, userId),
      getPromptInfo(supabase, promptId),
      getRecentInteractions(supabase, userId, promptId),
      getContextStats(supabase, userId, promptId)
    ]);

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // 构建智能化的学习洞察
    const learningInsights = generateLearningInsights(userProfile, recentInteractions);

    const responseData: UserContextResponse = {
      userPreferences: userProfile?.preferences || {},
      promptRules: extractPromptRules(prompt),
      recentInteractions: recentInteractions,
      learningInsights,
      contextStats
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error fetching user context for prompt ${req.query.id}:`, error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: '获取用户上下文信息失败，请稍后重试'
    });
  }
}

/**
 * 获取用户上下文档案
 */
async function getUserProfile(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_context_profiles')
      .select('preferences, context_data, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // 忽略"no rows"错误
      console.warn('获取用户档案时发生错误:', error);
    }

    return data;
  } catch (error) {
    console.error('获取用户档案失败:', error);
    return null;
  }
}

/**
 * 获取提示词信息和适应规则
 */
async function getPromptInfo(supabase: any, promptId: string) {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, name, content, adaptation_rules, category, category_type')
      .eq('id', promptId)
      .maybeSingle();

    if (error) {
      console.warn('获取提示词信息失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取提示词信息失败:', error);
    return null;
  }
}

/**
 * 获取用户最近的交互记录
 */
async function getRecentInteractions(supabase: any, userId: string, promptId: string) {
  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('created_at, interaction_data, feedback_score')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.warn('获取交互记录失败:', error);
      return [];
    }

    return (data || []).map((interaction: any) => {
      const interactionData = interaction.interaction_data || {};
      return {
        timestamp: interaction.created_at,
        input: interactionData.input || interactionData.user_input,
        output: interactionData.output || interactionData.ai_response,
        feedback: getFeedbackType(interaction.feedback_score),
        context_applied: interactionData.context_applied || {}
      };
    });
  } catch (error) {
    console.error('获取交互记录失败:', error);
    return [];
  }
}

/**
 * 获取用户上下文统计信息
 */
async function getContextStats(supabase: any, userId: string, promptId: string) {
  try {
    // 获取总交互次数
    const { count: totalInteractions } = await supabase
      .from('user_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('prompt_id', promptId);

    // 获取平均满意度
    const { data: feedbackData } = await supabase
      .from('user_interactions')
      .select('feedback_score')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .not('feedback_score', 'is', null);

    const avgSatisfaction = feedbackData && feedbackData.length > 0
      ? feedbackData.reduce((sum: number, item: any) => sum + (item.feedback_score || 0), 0) / feedbackData.length
      : 0;

    // 获取成功率（正面反馈的比例）
    const positiveCount = feedbackData ? feedbackData.filter((item: any) => item.feedback_score > 3).length : 0;
    const successRate = feedbackData && feedbackData.length > 0 ? (positiveCount / feedbackData.length) * 100 : 0;

    // 获取最早的交互时间作为个性化开始时间
    const { data: firstInteraction } = await supabase
      .from('user_interactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: true })
      .limit(1);

    return {
      totalInteractions: totalInteractions || 0,
      successRate: Math.round(successRate * 10) / 10,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      personalizedSince: firstInteraction?.[0]?.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('获取上下文统计失败:', error);
    return {
      totalInteractions: 0,
      successRate: 0,
      avgSatisfaction: 0,
      personalizedSince: new Date().toISOString()
    };
  }
}

/**
 * 提取提示词的适应规则
 */
function extractPromptRules(prompt: any): Array<any> {
  if (!prompt) return [];
  
  try {
    // 处理 JSONB 内容结构
    if (prompt.content && typeof prompt.content === 'object') {
      const content = prompt.content;
      if (content.dynamic_context?.adaptation_rules) {
        return Array.isArray(content.dynamic_context.adaptation_rules) 
          ? content.dynamic_context.adaptation_rules 
          : [content.dynamic_context.adaptation_rules];
      }
    }

    // 处理传统的 adaptation_rules 字段
    if (prompt.adaptation_rules) {
      return Array.isArray(prompt.adaptation_rules) 
        ? prompt.adaptation_rules 
        : [prompt.adaptation_rules];
    }

    return [];
  } catch (error) {
    console.warn('提取提示词规则失败:', error);
    return [];
  }
}

/**
 * 生成智能化的学习洞察
 */
function generateLearningInsights(userProfile: any, interactions: any[]): {
  usagePatterns: Record<string, any>;
  preferredStyles: string[];
  improvementSuggestions: string[];
} {
  const insights = {
    usagePatterns: {},
    preferredStyles: [],
    improvementSuggestions: []
  };

  if (!interactions || interactions.length === 0) {
    insights.improvementSuggestions = [
      '开始使用这个提示词来建立您的个性化档案',
      '尝试不同的输入方式以获得更好的效果',
      '使用反馈功能帮助系统学习您的偏好'
    ];
    return insights;
  }

  // 分析使用模式
  const timeDistribution = analyzeTimePatterns(interactions);
  const inputLengthPattern = analyzeInputPatterns(interactions);
  
  insights.usagePatterns = {
    mostActiveTime: timeDistribution.peak,
    averageInputLength: inputLengthPattern.average,
    interactionFrequency: calculateFrequency(interactions)
  };

  // 分析偏好风格
  insights.preferredStyles = inferPreferredStyles(interactions, userProfile);

  // 生成改进建议
  insights.improvementSuggestions = generateImprovementSuggestions(interactions, userProfile);

  return insights;
}

/**
 * 分析时间使用模式
 */
function analyzeTimePatterns(interactions: any[]) {
  const hourCounts: Record<number, number> = {};
  
  interactions.forEach(interaction => {
    const hour = new Date(interaction.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  const timeRanges = {
    morning: '早上 (6-12点)',
    afternoon: '下午 (12-18点)', 
    evening: '晚上 (18-24点)',
    night: '深夜 (0-6点)'
  };

  const hour = parseInt(peakHour || '12');
  let range = 'afternoon';
  if (hour >= 6 && hour < 12) range = 'morning';
  else if (hour >= 18 && hour < 24) range = 'evening';
  else if (hour >= 0 && hour < 6) range = 'night';

  return {
    peak: timeRanges[range as keyof typeof timeRanges],
    peakHour: hour
  };
}

/**
 * 分析输入模式
 */
function analyzeInputPatterns(interactions: any[]) {
  const inputLengths = interactions
    .filter(i => i.input)
    .map(i => i.input.length);

  const average = inputLengths.length > 0 
    ? Math.round(inputLengths.reduce((a, b) => a + b, 0) / inputLengths.length)
    : 0;

  return { average };
}

/**
 * 计算交互频率
 */
function calculateFrequency(interactions: any[]): string {
  if (interactions.length < 2) return '首次使用';
  
  const timestamps = interactions.map(i => new Date(i.timestamp).getTime()).sort((a, b) => b - a);
  const intervals = [];
  
  for (let i = 0; i < timestamps.length - 1; i++) {
    intervals.push(timestamps[i] - timestamps[i + 1]);
  }
  
  const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const days = averageInterval / (1000 * 60 * 60 * 24);
  
  if (days < 1) return '高频使用';
  if (days < 7) return '常规使用';
  return '偶尔使用';
}

/**
 * 推断偏好风格
 */
function inferPreferredStyles(interactions: any[], userProfile: any): string[] {
  const styles = [];
  
  // 基于用户偏好设置
  if (userProfile?.preferences?.style) {
    styles.push(userProfile.preferences.style);
  }
  
  // 基于交互模式推断
  const avgInputLength = interactions
    .filter(i => i.input)
    .reduce((sum, i) => sum + i.input.length, 0) / interactions.length;
    
  if (avgInputLength > 100) {
    styles.push('详细描述型');
  } else {
    styles.push('简洁明了型');
  }
  
  // 基于反馈分析
  const positiveInteractions = interactions.filter(i => i.feedback === 'positive');
  if (positiveInteractions.length > interactions.length * 0.7) {
    styles.push('效果导向型');
  }
  
  return [...new Set(styles)]; // 去重
}

/**
 * 生成改进建议
 */
function generateImprovementSuggestions(interactions: any[], userProfile: any): string[] {
  const suggestions = [];
  
  // 基于使用频率的建议
  const frequency = calculateFrequency(interactions);
  if (frequency === '偶尔使用') {
    suggestions.push('增加使用频率可以帮助系统更好地了解您的偏好');
  }
  
  // 基于反馈的建议
  const feedbackCount = interactions.filter(i => i.feedback).length;
  if (feedbackCount < interactions.length * 0.5) {
    suggestions.push('提供更多反馈可以改善个性化效果');
  }
  
  // 基于上下文设置的建议
  if (!userProfile?.preferences || Object.keys(userProfile.preferences).length === 0) {
    suggestions.push('完善个人偏好设置以获得更好的个性化体验');
  }
  
  // 基于交互质量的建议
  const avgSatisfaction = interactions
    .filter(i => i.feedback)
    .reduce((sum, i) => sum + (i.feedback === 'positive' ? 5 : 2), 0) / 
    interactions.filter(i => i.feedback).length;
    
  if (avgSatisfaction < 4) {
    suggestions.push('尝试调整输入方式或添加更多上下文信息');
  }
  
  return suggestions.length > 0 ? suggestions : [
    '您的使用情况很好，继续保持！',
    '可以尝试探索更多高级功能'
  ];
}

/**
 * 将数字评分转换为反馈类型
 */
function getFeedbackType(score: number | null): 'positive' | 'negative' | null {
  if (score === null || score === undefined) return null;
  return score > 3 ? 'positive' : 'negative';
}