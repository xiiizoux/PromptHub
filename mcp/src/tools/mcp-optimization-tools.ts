/**
 * MCP 优化工具集 - 为第三方AI客户端提供最佳体验
 * 核心理念：方便、简洁、易用、精准
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt } from '../types.js';

const storage = StorageFactory.getStorage();

/**
 * 🎯 一键智能搜索工具 - 核心功能
 */
export const oneClickSearchTool: ToolDescription = {
  name: 'one_click_search',
  description: '🎯 一键智能搜索 - 输入需求，直接获得最匹配的提示词，支持自然语言描述',
  schema_version: 'v1',
  parameters: {
    need: {
      type: 'string',
      description: '你的需求描述，例如："写一封正式的道歉邮件"、"分析代码性能问题"、"创建产品介绍文案"',
      required: true,
    } as ToolParameter,
    urgency: {
      type: 'string',
      description: '紧急程度：immediate（立即）、today（今天）、this_week（本周）、no_rush（不急）',
      required: false,
    } as ToolParameter,
    style: {
      type: 'string',
      description: '期望风格：professional（专业）、casual（随意）、creative（创意）、technical（技术）',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 📋 即用即得工具 - 快速获取
 */
export const readyToUseTool: ToolDescription = {
  name: 'ready_to_use',
  description: '📋 即用即得 - 根据ID快速获取可直接使用的提示词，已格式化好，可直接复制粘贴',
  schema_version: 'v1',
  parameters: {
    prompt_id: {
      type: 'string',
      description: '提示词ID或名称',
      required: true,
    } as ToolParameter,
    variables: {
      type: 'object',
      description: '变量值，例如：{"name": "张三", "company": "ABC公司"}',
      required: false,
    } as ToolParameter,
    target_ai: {
      type: 'string',
      description: '目标AI：gpt4、claude、gemini、custom',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 💡 智能建议工具 - 推荐系统
 */
export const smartSuggestionTool: ToolDescription = {
  name: 'smart_suggestions',
  description: '💡 智能建议 - 基于当前上下文和历史，推荐最相关的提示词',
  schema_version: 'v1',
  parameters: {
    context: {
      type: 'string',
      description: '当前工作上下文或对话内容',
      required: false,
    } as ToolParameter,
    user_history: {
      type: 'array',
      description: '最近使用的提示词（自动记录）',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
  },
};

/**
 * 🔍 探索发现工具 - 浏览模式
 */
export const discoverTool: ToolDescription = {
  name: 'discover_prompts',
  description: '🔍 探索发现 - 浏览热门分类、新增提示词、推荐组合',
  schema_version: 'v1',
  parameters: {
    discover_type: {
      type: 'string',
      description: '探索类型：trending（热门）、new（最新）、categories（分类）、combos（组合）',
      required: false,
    } as ToolParameter,
    interest: {
      type: 'string',
      description: '兴趣领域：business、tech、creative、academic、daily',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 处理一键智能搜索
 */
export async function handleOneClickSearch(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { need, urgency = 'no_rush', style = 'professional' } = params;
    
    console.log('[一键搜索] 处理需求:', { need, urgency, style });

    // 1. 意图分析
    const intent = analyzeUserNeed(need);
    
    // 2. 智能搜索
    const searchResults = await performIntelligentSearch(need, intent, style, userId);
    
    // 3. 排序优化
    const optimizedResults = optimizeResultsForUrgency(searchResults, urgency);
    
    // 4. 格式化输出
    const response = formatOneClickResponse(optimizedResults, need, intent);
    
    return {
      content: [{
        type: 'text',
        text: response
      }]
    };

  } catch (error) {
    console.error('[一键搜索] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 搜索失败，请重试或简化描述'
      }]
    };
  }
}

/**
 * 处理即用即得
 */
export async function handleReadyToUse(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { prompt_id, variables = {}, target_ai = 'gpt4' } = params;
    
    console.log('[即用即得] 获取提示词:', { prompt_id, target_ai });

    // 获取提示词
    const prompt = await getPromptByIdOrName(prompt_id, userId);
    if (!prompt) {
      return {
        content: [{
          type: 'text',
          text: '❌ 未找到指定的提示词，请检查ID或名称'
        }]
      };
    }

    // 处理变量替换
    let content = prompt.content || '';
    if (Object.keys(variables).length > 0) {
      content = replacePromptVariables(content, variables);
    }

    // 针对目标AI优化
    const optimizedContent = optimizeForTargetAI(content, prompt, target_ai);
    
    // 生成即用格式
    const readyToUseFormat = generateReadyToUseFormat(optimizedContent, prompt, target_ai);
    
    return {
      content: [{
        type: 'text',
        text: readyToUseFormat
      }]
    };

  } catch (error) {
    console.error('[即用即得] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 获取失败，请重试'
      }]
    };
  }
}

/**
 * 处理智能建议
 */
export async function handleSmartSuggestions(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { context = '', user_history = [] } = params;
    
    console.log('[智能建议] 生成建议:', { hasContext: !!context, historyCount: user_history.length });

    // 分析上下文
    const contextAnalysis = analyzeContext(context);
    
    // 基于历史生成建议
    const suggestions = await generateContextualSuggestions(contextAnalysis, user_history, userId);
    
    // 格式化建议
    const formattedSuggestions = formatSmartSuggestions(suggestions, contextAnalysis);
    
    return {
      content: [{
        type: 'text',
        text: formattedSuggestions
      }]
    };

  } catch (error) {
    console.error('[智能建议] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 建议生成失败'
      }]
    };
  }
}

/**
 * 处理探索发现
 */
export async function handleDiscover(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const { discover_type = 'trending', interest = 'general' } = params;
    
    console.log('[探索发现] 浏览:', { discover_type, interest });

    let discoverContent = '';
    
    switch (discover_type) {
      case 'trending':
        discoverContent = await generateTrendingView(interest, userId);
        break;
      case 'new':
        discoverContent = await generateNewPromptsView(interest, userId);
        break;
      case 'categories':
        discoverContent = await generateCategoriesView(userId);
        break;
      case 'combos':
        discoverContent = await generateCombosView(interest, userId);
        break;
      default:
        discoverContent = await generateTrendingView(interest, userId);
    }
    
    return {
      content: [{
        type: 'text',
        text: discoverContent
      }]
    };

  } catch (error) {
    console.error('[探索发现] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 探索失败'
      }]
    };
  }
}

// ==================== 核心算法实现 ====================

/**
 * 分析用户需求
 */
function analyzeUserNeed(need: string) {
  const intent = {
    action: extractAction(need),
    domain: extractDomain(need),
    tone: extractTone(need),
    complexity: assessComplexity(need),
    keywords: extractKeywords(need)
  };
  
  return intent;
}

/**
 * 执行智能搜索
 */
async function performIntelligentSearch(need: string, intent: any, style: string, userId?: string) {
  const searchStrategies = [
    // 精确匹配
    () => storage.searchPrompts(need, userId),
    // 关键词搜索
    () => storage.searchPrompts(intent.keywords.join(' '), userId),
    // 分类搜索
    intent.domain ? () => storage.getPromptsByCategory(intent.domain, userId) : null,
  ].filter(Boolean);

  const results = await Promise.all(searchStrategies.map(strategy => strategy!()));
  const allResults = results.flat();
  
  // 去重并按相关性排序
  const uniqueResults = deduplicatePrompts(allResults);
  return rankByRelevance(uniqueResults, intent, style);
}

/**
 * 根据紧急程度优化结果
 */
function optimizeResultsForUrgency(results: any[], urgency: string) {
  switch (urgency) {
    case 'immediate':
      return results
        .filter(r => r.difficulty !== 'advanced')
        .slice(0, 3);
    case 'today':
      return results.slice(0, 5);
    case 'this_week':
      return results.slice(0, 8);
    default:
      return results.slice(0, 10);
  }
}

/**
 * 格式化一键搜索响应
 */
function formatOneClickResponse(results: any[], need: string, intent: any): string {
  let response = `🎯 智能搜索结果\n`;
  response += `需求：${need}\n`;
  response += `检测到：${intent.action} | ${intent.domain} | ${intent.tone}\n`;
  response += `${'='.repeat(40)}\n\n`;

  if (results.length === 0) {
    response += '😔 暂未找到完全匹配的提示词\n\n';
    response += '💡 建议：\n';
    response += '• 尝试更简单的描述\n';
    response += '• 使用探索功能浏览分类\n';
    response += '• 查看热门推荐\n';
    return response;
  }

  results.forEach((result, index) => {
    response += `${index + 1}. 🌟 **${result.name}**\n`;
    response += `   📝 ${result.description || '暂无描述'}\n`;
    response += `   🎯 匹配度: ${(result.relevanceScore * 100).toFixed(0)}%\n`;
    response += `   🏷️ ${result.tags?.join(', ') || '无标签'}\n`;
    response += `   💡 使用：调用 ready_to_use("${result.id || result.name}")\n\n`;
  });

  response += '💡 提示：选择一个提示词后，使用 ready_to_use 工具获取可直接使用的格式\n';
  return response;
}

/**
 * 生成即用格式
 */
function generateReadyToUseFormat(content: string, prompt: Prompt, targetAI: string): string {
  let format = `📋 即用格式 (优化为 ${targetAI.toUpperCase()})\n`;
  format += `${'='.repeat(35)}\n\n`;
  
  // AI特定的格式化
  switch (targetAI.toLowerCase()) {
    case 'claude':
      format += `🤖 Claude 优化版本:\n\n`;
      format += `Human: ${content}\n\nAssistant: `;
      break;
    case 'gpt4':
      format += `🤖 GPT-4 优化版本:\n\n`;
      format += content;
      break;
    case 'gemini':
      format += `🤖 Gemini 优化版本:\n\n`;
      format += content;
      break;
    default:
      format += `🤖 通用版本:\n\n`;
      format += content;
  }
  
  format += `\n\n${'─'.repeat(40)}\n`;
  format += `📊 提示词信息:\n`;
  format += `• 名称: ${prompt.name}\n`;
  format += `• 分类: ${prompt.category || '未分类'}\n`;
  format += `• 难度: ${prompt.difficulty || '中等'}\n`;
  
  if (prompt.variables?.length) {
    format += `• 可变参数: ${prompt.variables.map(v => v.name).join(', ')}\n`;
  }
  
  format += `\n💡 使用建议:\n`;
  format += `• 可以直接复制上述内容到AI客户端\n`;
  format += `• 根据具体需求微调细节\n`;
  format += `• 如需修改变量，重新调用此工具\n`;
  
  return format;
}

// ==================== 辅助函数 ====================

function extractAction(text: string): string {
  const actionMap: any = {
    '写': 'write', '编写': 'write', '创建': 'create', '生成': 'generate',
    '分析': 'analyze', '评估': 'evaluate', '检查': 'check',
    '翻译': 'translate', '转换': 'convert', '改写': 'rewrite',
    '总结': 'summarize', '概括': 'summarize',
    '解释': 'explain', '说明': 'explain'
  };
  
  for (const [chinese, english] of Object.entries(actionMap)) {
    if (text.includes(chinese)) return english;
  }
  
  return 'general';
}

function extractDomain(text: string): string {
  const domainMap: any = {
    '邮件': 'email', '信件': 'email', 'email': 'email',
    '代码': 'coding', '编程': 'coding', '程序': 'coding',
    '商业': 'business', '商务': 'business', '销售': 'business',
    '学术': 'academic', '论文': 'academic', '研究': 'academic',
    '创意': 'creative', '设计': 'creative', '艺术': 'creative'
  };
  
  for (const [keyword, domain] of Object.entries(domainMap)) {
    if (text.includes(keyword)) return domain;
  }
  
  return 'general';
}

function extractTone(text: string): string {
  if (/正式|官方|official|formal/.test(text)) return 'formal';
  if (/随意|轻松|casual|informal/.test(text)) return 'casual';
  if (/友好|温暖|friendly/.test(text)) return 'friendly';
  if (/专业|professional/.test(text)) return 'professional';
  
  return 'neutral';
}

function assessComplexity(text: string): 'simple' | 'medium' | 'complex' {
  const wordCount = text.split(/\s+/).length;
  const hasComplexTerms = /高级|复杂|详细|深入|advanced|complex|detailed/.test(text);
  
  if (hasComplexTerms || wordCount > 20) return 'complex';
  if (wordCount > 10) return 'medium';
  return 'simple';
}

function extractKeywords(text: string): string[] {
  return text
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .slice(0, 10);
}

async function getPromptByIdOrName(identifier: string, userId?: string): Promise<Prompt | null> {
  try {
    // 尝试按ID获取
    let prompt = await storage.getPrompt(identifier, userId);
    if (prompt) return prompt;
    
    // 尝试按名称搜索
    const searchResults = await storage.searchPrompts(identifier, userId);
    return searchResults.find(p => p.name === identifier) || searchResults[0] || null;
  } catch (error) {
    console.error('获取提示词失败:', error);
    return null;
  }
}

function replacePromptVariables(content: string, variables: any): string {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const patterns = [
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      new RegExp(`\\$\\{${key}\\}`, 'g'),
      new RegExp(`\\[${key}\\]`, 'g'),
      new RegExp(`{${key}}`, 'g')
    ];
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, String(value));
    });
  });
  
  return result;
}

function optimizeForTargetAI(content: string, prompt: Prompt, targetAI: string): string {
  switch (targetAI.toLowerCase()) {
    case 'claude':
      // Claude喜欢更结构化的指令
      return addStructureForClaude(content);
    case 'gpt4':
      // GPT-4可以处理更复杂的指令
      return content; // 保持原样
    case 'gemini':
      // Gemini适合对话式指令
      return makeConversationalForGemini(content);
    default:
      return content;
  }
}

function addStructureForClaude(content: string): string {
  if (!content.includes('\n\n')) {
    // 添加更多结构
    return content.replace(/。/g, '。\n\n');
  }
  return content;
}

function makeConversationalForGemini(content: string): string {
  if (!content.startsWith('请')) {
    return `请${content}`;
  }
  return content;
}

function deduplicatePrompts(prompts: Prompt[]): Prompt[] {
  const seen = new Set();
  return prompts.filter(prompt => {
    const id = prompt.id || prompt.name;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function rankByRelevance(prompts: Prompt[], intent: any, style: string): any[] {
  return prompts.map(prompt => ({
    ...prompt,
    relevanceScore: calculateRelevanceScore(prompt, intent, style)
  })).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateRelevanceScore(prompt: Prompt, intent: any, style: string): number {
  let score = 0;
  
  // 名称匹配
  if (intent.keywords.some((keyword: string) => prompt.name.toLowerCase().includes(keyword.toLowerCase()))) {
    score += 0.3;
  }
  
  // 分类匹配
  if (prompt.category === intent.domain) {
    score += 0.3;
  }
  
  // 标签匹配
  if (prompt.tags?.some(tag => intent.keywords.includes(tag.toLowerCase()))) {
    score += 0.2;
  }
  
  // 描述匹配
  if (prompt.description && intent.keywords.some((keyword: string) => 
    prompt.description!.toLowerCase().includes(keyword.toLowerCase()))) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}

function analyzeContext(context: string) {
  return {
    topics: extractKeywords(context),
    sentiment: detectSentiment(context),
    urgency: detectUrgency(context)
  };
}

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['好', '棒', '优秀', '成功', '满意'];
  const negativeWords = ['差', '糟', '失败', '问题', '错误'];
  
  const hasPositive = positiveWords.some(word => text.includes(word));
  const hasNegative = negativeWords.some(word => text.includes(word));
  
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
}

function detectUrgency(text: string): 'high' | 'medium' | 'low' {
  if (/紧急|急|立即|马上|urgent|asap/.test(text)) return 'high';
  if (/今天|today|截止|deadline/.test(text)) return 'medium';
  return 'low';
}

async function generateContextualSuggestions(contextAnalysis: any, userHistory: string[], userId?: string) {
  // 基于上下文和历史生成建议的简化实现
  const suggestions = [];
  
  // 基于上下文关键词
  for (const topic of contextAnalysis.topics.slice(0, 3)) {
    try {
      const results = await storage.searchPrompts(topic, userId);
      suggestions.push(...results.slice(0, 2));
    } catch (error) {
      console.error(`搜索${topic}失败:`, error);
    }
  }
  
  return suggestions.slice(0, 5);
}

function formatSmartSuggestions(suggestions: any[], contextAnalysis: any): string {
  let format = `💡 智能建议\n`;
  format += `${'='.repeat(15)}\n\n`;
  
  if (contextAnalysis.topics.length > 0) {
    format += `🎯 基于上下文: ${contextAnalysis.topics.slice(0, 3).join(', ')}\n\n`;
  }
  
  suggestions.forEach((suggestion, index) => {
    format += `${index + 1}. **${suggestion.name}**\n`;
    format += `   📝 ${suggestion.description || '暂无描述'}\n`;
    format += `   💡 使用: ready_to_use("${suggestion.id || suggestion.name}")\n\n`;
  });
  
  return format;
}

async function generateTrendingView(interest: string, userId?: string): string {
  try {
    const trending = await storage.getPrompts({ sortBy: 'popular', pageSize: 8, isPublic: true });
    
    let view = `🔥 热门推荐\n`;
    view += `${'='.repeat(15)}\n\n`;
    
    trending.data.forEach((prompt, index) => {
      view += `${index + 1}. **${prompt.name}**\n`;
      view += `   📝 ${prompt.description || '暂无描述'}\n`;
      view += `   🏷️ ${prompt.tags?.join(', ') || '无标签'}\n`;
      view += `   💡 使用: ready_to_use("${prompt.id || prompt.name}")\n\n`;
    });
    
    return view;
  } catch (error) {
    return '❌ 获取热门内容失败';
  }
}

async function generateNewPromptsView(interest: string, userId?: string): string {
  try {
    const newPrompts = await storage.getPrompts({ sortBy: 'latest', pageSize: 6, isPublic: true });
    
    let view = `✨ 最新提示词\n`;
    view += `${'='.repeat(15)}\n\n`;
    
    newPrompts.data.forEach((prompt, index) => {
      view += `${index + 1}. **${prompt.name}** 🆕\n`;
      view += `   📝 ${prompt.description || '暂无描述'}\n`;
      view += `   💡 使用: ready_to_use("${prompt.id || prompt.name}")\n\n`;
    });
    
    return view;
  } catch (error) {
    return '❌ 获取最新内容失败';
  }
}

async function generateCategoriesView(userId?: string): string {
  const categories = [
    { name: '商业', icon: '💼', desc: '商务邮件、销售文案、商业计划' },
    { name: '技术', icon: '💻', desc: '代码分析、技术文档、问题排查' },
    { name: '创意', icon: '🎨', desc: '创意写作、设计思维、头脑风暴' },
    { name: '学术', icon: '📚', desc: '论文写作、研究分析、学术报告' },
    { name: '日常', icon: '📝', desc: '生活助手、学习计划、个人管理' }
  ];

  let view = `📂 提示词分类\n`;
  view += `${'='.repeat(15)}\n\n`;
  
  categories.forEach((category, index) => {
    view += `${category.icon} **${category.name}**\n`;
    view += `   ${category.desc}\n`;
    view += `   💡 探索: discover_prompts(discover_type="trending", interest="${category.name.toLowerCase()}")\n\n`;
  });
  
  return view;
}

async function generateCombosView(interest: string, userId?: string): string {
  const combos = [
    { name: '邮件写作套装', prompts: ['商务邮件模板', '道歉邮件', '感谢邮件'] },
    { name: '代码分析工具包', prompts: ['代码审查', '性能分析', '错误诊断'] },
    { name: '内容创作组合', prompts: ['文案撰写', '标题生成', 'SEO优化'] },
    { name: '学习助手包', prompts: ['知识总结', '问题分析', '学习计划'] }
  ];

  let view = `🔗 推荐组合\n`;
  view += `${'='.repeat(15)}\n\n`;
  
  combos.forEach((combo, index) => {
    view += `${index + 1}. **${combo.name}**\n`;
    view += `   包含: ${combo.prompts.join(', ')}\n`;
    view += `   💡 适合: 需要完整解决方案的场景\n\n`;
  });
  
  return view;
} 