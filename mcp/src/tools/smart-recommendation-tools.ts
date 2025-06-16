/**
 * 智能分类推荐系统
 * 基于用户行为、偏好和上下文提供个性化提示词推荐
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt } from '../types.js';

const storage = StorageFactory.getStorage();

/**
 * 智能推荐工具定义
 */
export const smartRecommendationTool: ToolDescription = {
  name: 'smart_recommendations',
  description: '基于用户画像和使用历史的智能提示词推荐系统',
  schema_version: 'v1',
  parameters: {
    context_hint: {
      type: 'string',
      description: '当前工作上下文提示，例如："正在写邮件"、"需要分析数据"、"准备演讲"',
      required: false,
    } as ToolParameter,
    user_preference: {
      type: 'object',
      description: '用户偏好设置：{style: "formal/casual", domain: "tech/business", complexity: "simple/advanced"}',
      required: false,
    } as ToolParameter,
    recent_used: {
      type: 'array',
      description: '最近使用的提示词ID列表',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
    recommendation_type: {
      type: 'string',
      description: '推荐类型：trending（热门）、personalized（个性化）、similar（相似）、complementary（补充）',
      required: false,
    } as ToolParameter,
    limit: {
      type: 'number',
      description: '推荐数量，默认5个',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 快速分类工具定义
 */
export const quickCategoryTool: ToolDescription = {
  name: 'quick_category_access',
  description: '快速访问热门分类和相关提示词',
  schema_version: 'v1',
  parameters: {
    view_type: {
      type: 'string',
      description: '视图类型：overview（概览）、detailed（详细）、compact（紧凑）',
      required: false,
    } as ToolParameter,
    include_stats: {
      type: 'boolean',
      description: '是否包含使用统计信息',
      required: false,
    } as ToolParameter,
    filter_by_user: {
      type: 'boolean',
      description: '是否只显示用户相关的分类',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 上下文感知推荐工具定义
 */
export const contextAwareRecommendationTool: ToolDescription = {
  name: 'context_aware_recommendations',
  description: '基于当前对话上下文的智能推荐',
  schema_version: 'v1',
  parameters: {
    conversation_history: {
      type: 'array',
      description: '对话历史片段',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
    current_task: {
      type: 'string',
      description: '当前任务描述',
      required: false,
    } as ToolParameter,
    time_context: {
      type: 'string',
      description: '时间上下文：morning（上午）、afternoon（下午）、evening（晚上）、urgent（紧急）',
      required: false,
    } as ToolParameter,
    workspace_type: {
      type: 'string',
      description: '工作环境：office（办公室）、home（家庭）、meeting（会议）、mobile（移动）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 处理智能推荐
 */
export async function handleSmartRecommendations(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      context_hint = '',
      user_preference = {},
      recent_used = [],
      recommendation_type = 'personalized',
      limit = 5
    } = params;

    console.log('[智能推荐] 生成推荐:', { context_hint, recommendation_type, userId: userId ? 'authenticated' : 'anonymous' });

    // 分析用户画像
    const userProfile = await buildUserProfile(userId, recent_used, user_preference);
    
    // 基于推荐类型生成推荐
    let recommendations: any[] = [];
    
    switch (recommendation_type) {
      case 'trending':
        recommendations = await getTrendingPrompts(limit, userProfile);
        break;
      case 'similar':
        recommendations = await getSimilarPrompts(recent_used, limit, userId);
        break;
      case 'complementary':
        recommendations = await getComplementaryPrompts(recent_used, userProfile, limit, userId);
        break;
      default: // personalized
        recommendations = await getPersonalizedRecommendations(userProfile, context_hint, limit, userId);
    }

    // 增强推荐信息
    const enhancedRecommendations = await enhanceRecommendations(recommendations, userProfile, context_hint);

    return {
      content: [{
        type: 'text',
        text: formatRecommendations(enhancedRecommendations, recommendation_type, context_hint)
      }]
    };

  } catch (error) {
    console.error('[智能推荐] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 推荐生成失败，请重试'
      }]
    };
  }
}

/**
 * 处理快速分类访问
 */
export async function handleQuickCategory(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      view_type = 'overview',
      include_stats = true,
      filter_by_user = false
    } = params;

    console.log('[快速分类] 获取分类信息:', { view_type, filter_by_user });

    // 获取分类统计
    const categories = await getCategoryStatistics(userId, filter_by_user);
    
    // 获取每个分类的推荐提示词
    const categoryRecommendations = await Promise.all(
      categories.map(async (category: any) => ({
        ...category,
        recommendations: await storage.getPromptsByCategory(category.name, userId, true, 3)
      }))
    );

    return {
      content: [{
        type: 'text',
        text: formatCategoryOverview(categoryRecommendations, view_type, include_stats)
      }]
    };

  } catch (error) {
    console.error('[快速分类] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 分类信息获取失败'
      }]
    };
  }
}

/**
 * 处理上下文感知推荐
 */
export async function handleContextAwareRecommendations(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      conversation_history = [],
      current_task = '',
      time_context = '',
      workspace_type = ''
    } = params;

    console.log('[上下文推荐] 分析上下文:', { current_task, time_context, workspace_type });

    // 分析对话上下文
    const contextAnalysis = analyzeConversationContext(conversation_history, current_task);
    
    // 基于时间和工作环境调整推荐
    const contextualRecommendations = await getContextualRecommendations(
      contextAnalysis, 
      time_context, 
      workspace_type, 
      userId
    );

    return {
      content: [{
        type: 'text',
        text: formatContextualRecommendations(contextualRecommendations, contextAnalysis)
      }]
    };

  } catch (error) {
    console.error('[上下文推荐] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 上下文推荐失败'
      }]
    };
  }
}

/**
 * 构建用户画像
 */
async function buildUserProfile(userId?: string, recentUsed: string[] = [], userPreference: any = {}) {
  const profile = {
    preferredStyle: userPreference.style || 'professional',
    preferredDomain: userPreference.domain || 'general',
    complexityLevel: userPreference.complexity || 'medium',
    recentCategories: [] as string[],
    frequentTags: [] as string[],
    usagePatterns: {} as any
  };

  if (userId && recentUsed.length > 0) {
    // 分析最近使用的提示词模式
    const recentPrompts = await Promise.all(
      recentUsed.slice(0, 10).map(async (id: string) => {
        try {
          return await storage.getPrompt(id, userId);
        } catch {
          return null;
        }
      })
    );

    const validPrompts = recentPrompts.filter(Boolean) as Prompt[];
    
    // 提取常用分类
    profile.recentCategories = [...new Set(validPrompts.map(p => p.category).filter(Boolean))];
    
    // 提取常用标签
    const allTags = validPrompts.flatMap(p => p.tags || []);
    profile.frequentTags = getTopItems(allTags, 5);
  }

  return profile;
}

/**
 * 获取热门提示词
 */
async function getTrendingPrompts(limit: number, userProfile: any) {
  try {
    const trendingData = await storage.getPrompts({ 
      sortBy: 'popular', 
      pageSize: limit * 2,
      isPublic: true 
    });
    
    // 基于用户画像过滤
    return trendingData.data
      .filter((prompt: Prompt) => isPromptRelevantToUser(prompt, userProfile))
      .slice(0, limit)
      .map((prompt: Prompt) => ({
        ...prompt,
        reason: '🔥 热门推荐',
        confidence: 0.8
      }));
  } catch (error) {
    console.error('获取热门提示词失败:', error);
    return [];
  }
}

/**
 * 获取相似提示词
 */
async function getSimilarPrompts(recentUsed: string[], limit: number, userId?: string) {
  if (recentUsed.length === 0) return [];

  try {
    const basePrompt = await storage.getPrompt(recentUsed[0], userId);
    if (!basePrompt) return [];

    const searchResults = await storage.searchPrompts(
      basePrompt.tags?.join(' ') || basePrompt.name,
      userId
    );

    return searchResults
      .filter((prompt: Prompt) => !recentUsed.includes(prompt.id!))
      .slice(0, limit)
      .map((prompt: Prompt) => ({
        ...prompt,
        reason: '🔍 相似推荐',
        confidence: 0.7
      }));
  } catch (error) {
    console.error('获取相似提示词失败:', error);
    return [];
  }
}

/**
 * 获取补充提示词
 */
async function getComplementaryPrompts(recentUsed: string[], userProfile: any, limit: number, userId?: string) {
  try {
    // 查找与最近使用的提示词互补的类型
    const complementaryCategories = getComplementaryCategories(userProfile.recentCategories);
    
    const complementaryPrompts = await Promise.all(
      complementaryCategories.map(async (category: string) => {
        const categoryPrompts = await storage.getPromptsByCategory(category, userId, true, 2);
        return categoryPrompts.map((prompt: Prompt) => ({
          ...prompt,
          reason: `🔗 与${userProfile.recentCategories.join('、')}互补`,
          confidence: 0.6
        }));
      })
    );

    return complementaryPrompts.flat().slice(0, limit);
  } catch (error) {
    console.error('获取补充提示词失败:', error);
    return [];
  }
}

/**
 * 获取个性化推荐
 */
async function getPersonalizedRecommendations(userProfile: any, contextHint: string, limit: number, userId?: string) {
  try {
    const recommendations = [];
    
    // 基于偏好分类
    if (userProfile.recentCategories.length > 0) {
      for (const category of userProfile.recentCategories.slice(0, 2)) {
        const categoryPrompts = await storage.getPromptsByCategory(category, userId, true, 2);
        recommendations.push(...categoryPrompts.map((prompt: Prompt) => ({
          ...prompt,
          reason: `💡 基于你的${category}偏好`,
          confidence: 0.9
        })));
      }
    }
    
    // 基于上下文提示
    if (contextHint) {
      const contextualPrompts = await storage.searchPrompts(contextHint, userId);
      recommendations.push(...contextualPrompts.slice(0, 2).map((prompt: Prompt) => ({
        ...prompt,
        reason: '🎯 匹配当前上下文',
        confidence: 0.85
      })));
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('获取个性化推荐失败:', error);
    return [];
  }
}

/**
 * 增强推荐信息
 */
async function enhanceRecommendations(recommendations: any[], userProfile: any, contextHint: string) {
  return recommendations.map(rec => ({
    ...rec,
    suitability: calculateSuitability(rec, userProfile, contextHint),
    estimatedUsefulnes: estimateUsefulness(rec, userProfile),
    quickActions: generateQuickActions(rec)
  }));
}

/**
 * 分析对话上下文
 */
function analyzeConversationContext(history: string[], currentTask: string) {
  const context = {
    topics: [] as string[],
    intent: 'general',
    urgency: 'normal',
    complexity: 'medium'
  };
  
  const allText = [...history, currentTask].join(' ').toLowerCase();
  
  // 检测主题
  const topicKeywords = {
    'writing': ['写', '编写', '文章', '邮件', 'write', 'email'],
    'analysis': ['分析', '评估', '检查', 'analyze', 'evaluate'],
    'coding': ['代码', '编程', '开发', 'code', 'programming'],
    'presentation': ['演讲', '展示', '汇报', 'presentation', 'demo']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      context.topics.push(topic);
    }
  }
  
  // 检测紧急程度
  if (/紧急|急|urgent|asap|immediately/.test(allText)) {
    context.urgency = 'high';
  }
  
  return context;
}

/**
 * 获取上下文化推荐
 */
async function getContextualRecommendations(contextAnalysis: any, timeContext: string, workspaceType: string, userId?: string) {
  const recommendations = [];
  
  // 基于主题推荐
  for (const topic of contextAnalysis.topics) {
    try {
      const topicPrompts = await storage.searchPrompts(topic, userId);
      recommendations.push(...topicPrompts.slice(0, 2).map((prompt: Prompt) => ({
        ...prompt,
        reason: `📋 适合${topic}任务`,
        contextMatch: 'high'
      })));
    } catch (error) {
      console.error(`获取${topic}相关提示词失败:`, error);
    }
  }
  
  // 基于时间上下文调整
  if (timeContext === 'urgent') {
    return recommendations
      .filter(rec => rec.tags?.includes('quick') || rec.difficulty !== 'advanced')
      .slice(0, 3);
  }
  
  return recommendations.slice(0, 5);
}

// 辅助函数
function getTopItems(items: string[], limit: number): string[] {
  const counts = items.reduce((acc: any, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, limit)
    .map(([item]) => item);
}

function isPromptRelevantToUser(prompt: Prompt, userProfile: any): boolean {
  // 检查分类匹配
  if (userProfile.recentCategories.includes(prompt.category)) return true;
  
  // 检查标签匹配
  if (prompt.tags?.some((tag: string) => userProfile.frequentTags.includes(tag))) return true;
  
  // 检查复杂度匹配
  if (prompt.difficulty === userProfile.complexityLevel) return true;
  
  return false;
}

function getComplementaryCategories(recentCategories: string[]): string[] {
  const complementaryMap: any = {
    'writing': ['analysis', 'research'],
    'coding': ['documentation', 'testing'],
    'business': ['creative', 'technical'],
    'analysis': ['presentation', 'summary']
  };
  
  const complementary = [];
  for (const category of recentCategories) {
    if (complementaryMap[category]) {
      complementary.push(...complementaryMap[category]);
    }
  }
  
  return [...new Set(complementary)];
}

function calculateSuitability(recommendation: any, userProfile: any, contextHint: string): number {
  let score = 0.5;
  
  if (userProfile.recentCategories.includes(recommendation.category)) score += 0.3;
  if (recommendation.tags?.some((tag: string) => userProfile.frequentTags.includes(tag))) score += 0.2;
  if (contextHint && recommendation.name.toLowerCase().includes(contextHint.toLowerCase())) score += 0.3;
  
  return Math.min(score, 1.0);
}

function estimateUsefulness(recommendation: any, userProfile: any): 'high' | 'medium' | 'low' {
  const suitability = calculateSuitability(recommendation, userProfile, '');
  if (suitability > 0.8) return 'high';
  if (suitability > 0.6) return 'medium';
  return 'low';
}

function generateQuickActions(recommendation: any): string[] {
  const actions = ['📋 复制', '👁️ 预览'];
  
  if (recommendation.variables?.length) {
    actions.push('🔧 自定义变量');
  }
  
  if (recommendation.tags?.includes('template')) {
    actions.push('📝 创建副本');
  }
  
  return actions;
}

async function getCategoryStatistics(userId?: string, filterByUser = false) {
  // 简化的分类统计实现
  const defaultCategories = [
    { name: '商业', count: 25, icon: '💼' },
    { name: '技术', count: 18, icon: '💻' },
    { name: '创意', count: 12, icon: '🎨' },
    { name: '学术', count: 8, icon: '📚' },
    { name: '日常', count: 15, icon: '📝' }
  ];
  
  return defaultCategories;
}

function formatRecommendations(recommendations: any[], type: string, contextHint: string): string {
  let output = `🎯 智能推荐 (${type})\n`;
  output += `${'='.repeat(20)}\n\n`;
  
  if (contextHint) {
    output += `💡 基于上下文: ${contextHint}\n\n`;
  }
  
  recommendations.forEach((rec, index) => {
    output += `${index + 1}. **${rec.name}**\n`;
    output += `   ${rec.reason} (置信度: ${(rec.confidence * 100).toFixed(0)}%)\n`;
    output += `   📝 ${rec.description || '暂无描述'}\n`;
    output += `   🏷️ ${rec.tags?.join(', ') || '无标签'}\n`;
    if (rec.quickActions) {
      output += `   🔧 ${rec.quickActions.join(' | ')}\n`;
    }
    output += '\n';
  });
  
  if (recommendations.length === 0) {
    output += '暂无推荐结果，请尝试其他搜索条件\n';
  }
  
  return output;
}

function formatCategoryOverview(categories: any[], viewType: string, includeStats: boolean): string {
  let output = `📂 分类概览\n`;
  output += `${'='.repeat(15)}\n\n`;
  
  categories.forEach(category => {
    output += `${category.icon || '📁'} **${category.name}**`;
    if (includeStats) {
      output += ` (${category.count} 个提示词)`;
    }
    output += '\n';
    
    if (viewType === 'detailed' && category.recommendations?.length) {
      category.recommendations.slice(0, 2).forEach((rec: any, index: number) => {
        output += `   ${index + 1}. ${rec.name}\n`;
      });
    }
    output += '\n';
  });
  
  return output;
}

function formatContextualRecommendations(recommendations: any[], contextAnalysis: any): string {
  let output = `🧠 上下文感知推荐\n`;
  output += `${'='.repeat(20)}\n\n`;
  
  if (contextAnalysis.topics.length > 0) {
    output += `🎯 检测到的主题: ${contextAnalysis.topics.join(', ')}\n`;
    output += `⚡ 紧急程度: ${contextAnalysis.urgency}\n\n`;
  }
  
  recommendations.forEach((rec, index) => {
    output += `${index + 1}. **${rec.name}**\n`;
    output += `   ${rec.reason}\n`;
    output += `   匹配度: ${rec.contextMatch || 'medium'}\n\n`;
  });
  
  return output;
} 