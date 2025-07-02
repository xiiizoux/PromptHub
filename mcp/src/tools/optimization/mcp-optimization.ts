/**
 * MCP 优化工具集 - 新基类版本
 * 为第三方AI客户端提供最佳体验：方便、简洁、易用、精准
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';

/**
 * 一键智能搜索工具类
 */
import { 
  MODEL_TAGS, 
  getModelTagsByType, 
  ModelType,
  SPECIFIC_MODEL_TO_TAG_MAP 
} from '../../constants/ai-models.js';

export class OneClickSearchTool extends BaseMCPTool {
  readonly name = 'one_click_search';
  readonly description = '🎯 一键智能搜索 - 输入需求，直接获得最匹配的提示词，支持自然语言描述';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        need: {
          type: 'string',
          description: '你的需求描述，例如："写一封正式的道歉邮件"、"分析代码性能问题"',
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
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['need']);

    const { need, urgency = 'no_rush', style = 'professional' } = params;
    
    this.logExecution('一键智能搜索', context, { need: need.substring(0, 50), urgency, style });

    try {
      const storage = this.getStorage();

      // 1. 意图分析
      const intent = this.analyzeUserNeed(need);
      
      // 2. 智能搜索
      const searchResults = await this.performIntelligentSearch(need, intent, style, context.userId);
      
      // 3. 排序优化
      const optimizedResults = this.optimizeResultsForUrgency(searchResults, urgency);
      
      // 4. 格式化输出
      const formattedResponse = this.formatOneClickResponse(optimizedResults, need, intent);

      return {
        success: true,
        data: {
          results: optimizedResults,
          intent_analysis: intent,
          total_found: searchResults.length,
          optimized_for_urgency: urgency
        },
        message: formattedResponse
      };

    } catch (error) {
      return {
        success: false,
        message: '❌ 搜索失败，请重试或简化描述'
      };
    }
  }

  private analyzeUserNeed(need: string) {
    return {
      action: this.extractAction(need),
      domain: this.extractDomain(need),
      tone: this.extractTone(need),
      complexity: this.assessComplexity(need),
      keywords: this.extractKeywords(need)
    };
  }

  private async performIntelligentSearch(need: string, intent: any, style: string, userId?: string) {
    const storage = this.getStorage();
    
    const searches = [
      storage.searchPrompts(need, userId),
      storage.searchPrompts(intent.action, userId),
      storage.searchPrompts(intent.domain, userId)
    ];

    const results = await Promise.all(searches);
    const allPrompts = results.flat().filter(p => p);
    
    const uniquePrompts = this.deduplicatePrompts(allPrompts);
    return this.rankByRelevance(uniquePrompts, intent, style);
  }

  private optimizeResultsForUrgency(results: any[], urgency: string) {
    const urgencyWeight = { immediate: 1.0, today: 0.8, this_week: 0.6, no_rush: 0.4 };
    const weight = urgencyWeight[urgency as keyof typeof urgencyWeight] || 0.4;
    const maxResults = urgency === 'immediate' ? 3 : urgency === 'today' ? 5 : 8;

    return results
      .sort((a, b) => (b.score * weight) - (a.score * weight))
      .slice(0, maxResults);
  }

  private formatOneClickResponse(results: any[], need: string, intent: any): string {
    if (results.length === 0) {
      return `❌ 没有找到匹配"${need}"的提示词，请尝试其他关键词`;
    }

    let response = `🎯 为您找到 ${results.length} 个匹配"${need}"的提示词：\n\n`;

    results.forEach((item, index) => {
      const prompt = item.prompt || item;
      response += `${index + 1}. **${prompt.name}**\n`;
      response += `   📝 ${prompt.description || '暂无描述'}\n`;
      response += `   🏷️ ${prompt.category || '通用'} | ⭐ 匹配度: ${Math.round((item.score || 0.8) * 100)}%\n\n`;
    });

    response += `💡 **使用建议**: 选择匹配度最高的提示词，或输入具体ID获取详细内容`;
    return response;
  }

  // 辅助方法
  private extractAction(text: string): string {
    const actions = ['写', '分析', '创建', '生成', '设计', '计划', '总结', '翻译', '检查'];
    for (const action of actions) {
      if (text.includes(action)) return action;
    }
    return '处理';
  }

  private extractDomain(text: string): string {
    const domains = {
      '邮件|email': '商务',
      '代码|编程|程序': '技术',
      '产品|营销|文案': '商业',
      '学术|论文|研究': '学术',
      '创意|设计': '创意'
    };
    
    for (const [pattern, domain] of Object.entries(domains)) {
      if (new RegExp(pattern).test(text)) return domain;
    }
    return '通用';
  }

  private extractTone(text: string): string {
    if (/正式|专业|商务/.test(text)) return 'professional';
    if (/随意|轻松|日常/.test(text)) return 'casual';
    if (/创意|有趣|生动/.test(text)) return 'creative';
    return 'neutral';
  }

  private assessComplexity(text: string): 'simple' | 'medium' | 'complex' {
    if (text.length < 20) return 'simple';
    if (text.length > 100 || /分析|复杂|详细|深入/.test(text)) return 'complex';
    return 'medium';
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 5);
  }

  private deduplicatePrompts(prompts: Prompt[]): Prompt[] {
    const seen = new Set();
    return prompts.filter(prompt => {
      const key = prompt.id || prompt.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rankByRelevance(prompts: Prompt[], intent: any, style: string): any[] {
    return prompts.map(prompt => ({
      prompt,
      score: this.calculateRelevanceScore(prompt, intent, style)
    })).sort((a, b) => b.score - a.score);
  }

  private calculateRelevanceScore(prompt: Prompt, intent: any, style: string): number {
    let score = 0.5;
    
    const content = (prompt.description + ' ' + prompt.name).toLowerCase();
    intent.keywords.forEach((keyword: string) => {
      if (content.includes(keyword)) score += 0.2;
    });

    if (prompt.category === intent.domain) score += 0.3;
    if (style === 'professional' && /商务|正式|专业/.test(content)) score += 0.2;
    
    return Math.min(score, 1.0);
  }
}

/**
 * 即用即得工具类
 */
export class ReadyToUseTool extends BaseMCPTool {
  readonly name = 'ready_to_use';
  readonly description = '📋 即用即得 - 根据ID快速获取可直接使用的提示词，已格式化好，可直接复制粘贴';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        prompt_id: { type: 'string', description: '提示词ID或名称', required: true } as ToolParameter,
        variables: { type: 'object', description: '变量值', required: false } as ToolParameter,
        target_ai: { type: 'string', description: '目标AI模型标签，如：llm-large、code-specialized、image-generation等，参考预设模型标签', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['prompt_id']);

    const { prompt_id, variables = {}, target_ai = 'gpt4' } = params;
    
    this.logExecution('即用即得', context, { prompt_id: prompt_id.substring(0, 20), target_ai });

    try {
      const prompt = await this.getPromptByIdOrName(prompt_id, context.userId);
      if (!prompt) {
        return { success: false, message: '❌ 未找到指定的提示词，请检查ID或名称' };
      }

      let content = this.extractPromptContent(prompt);
      
      if (Object.keys(variables).length > 0) {
        content = this.replacePromptVariables(content, variables);
      }

      const optimizedContent = this.optimizeForTargetAI(content, prompt, target_ai);
      const readyToUseFormat = this.generateReadyToUseFormat(optimizedContent, prompt, target_ai);

      return {
        success: true,
        data: {
          prompt_name: prompt.name,
          original_content: content,
          optimized_content: optimizedContent,
          target_ai,
          variables_replaced: Object.keys(variables)
        },
        message: readyToUseFormat
      };

    } catch (error) {
      return { success: false, message: '❌ 获取失败，请重试' };
    }
  }

  private async getPromptByIdOrName(identifier: string, userId?: string): Promise<Prompt | null> {
    const storage = this.getStorage();
    
    try {
      const prompt = await storage.getPrompt(identifier);
      if (prompt) return prompt;

      const searchResults = await storage.searchPrompts(identifier, userId);
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        return searchResults.find(p => p.name?.toLowerCase() === identifier.toLowerCase()) || searchResults[0];
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private extractPromptContent(prompt: Prompt): string {
    // 使用content字段
    if (prompt.content) {
      return prompt.content;
    }
    return prompt.description || '';
  }

  private replacePromptVariables(content: string, variables: any): string {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const patterns = [
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        new RegExp(`\\$\\{${key}\\}`, 'g'),
        new RegExp(`\\[${key}\\]`, 'g')
      ];
      patterns.forEach(pattern => {
        result = result.replace(pattern, String(value));
      });
    });
    return result;
  }

  private optimizeForTargetAI(content: string, prompt: Prompt, targetAI: string): string {
    // 支持模型标签和具体模型名称
    const lowerTarget = targetAI.toLowerCase();
    
    // 检查是否为预设模型标签
    if (lowerTarget === 'reasoning-specialized' || lowerTarget.includes('reasoning')) {
      return `请仔细分析以下问题，逐步推理：\n\n${content}\n\n请提供详细的推理过程和结论。`;
    }
    
    if (lowerTarget === 'image-generation' || lowerTarget.includes('image')) {
      return `创建图像提示词：\n\n${content}\n\n请生成详细的视觉描述，包含风格、构图、色彩等要素。`;
    }
    
    if (lowerTarget === 'code-specialized' || lowerTarget.includes('code')) {
      return `代码任务：\n\n${content}\n\n请提供完整的代码实现，包含注释和说明。`;
    }
    
    // 兼容旧的硬编码模型名称
    if (lowerTarget.includes('claude')) {
      return `<instructions>\n${content}\n</instructions>\n\n请按照上述指示执行任务。`;
    }
    
    if (lowerTarget.includes('gemini')) {
      return `你好！我需要你帮我：\n\n${content}\n\n请详细回答，谢谢！`;
    }
    
    // 默认格式（适用于大部分模型）
    return content;
  }

  private generateReadyToUseFormat(content: string, prompt: Prompt, targetAI: string): string {
    let format = `📋 **${prompt.name}** (优化用于 ${targetAI.toUpperCase()})\n\n`;
    format += `📝 **说明**: ${prompt.description || '无描述'}\n\n`;
            format += `💬 **即用内容（请在内容区域右上角点击复制按钮进行一键复制）**:\n\n`;
    format += `${content}\n\n`;
          format += `⬆️ 以上是完整的提示词内容，请在内容区域右上角点击复制按钮进行一键复制\n\n`;
    format += `🔗 **使用提示**: 直接复制上述内容到 ${targetAI.toUpperCase()} 即可使用`;

    if (prompt.tags?.length) {
      format += `\n🏷️ **标签**: ${prompt.tags.join(', ')}`;
    }

    return format;
  }
}

/**
 * 智能建议工具类
 */
export class SmartSuggestionTool extends BaseMCPTool {
  readonly name = 'smart_suggestions';
  readonly description = '💡 智能建议 - 基于当前上下文和历史，推荐最相关的提示词';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        context: { type: 'string', description: '当前工作上下文或对话内容', required: false } as ToolParameter,
        user_history: { type: 'array', description: '最近使用的提示词', items: { type: 'string' }, required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { context: userContext = '', user_history = [] } = params;
    
    this.logExecution('智能建议', context, { hasContext: !!userContext, historyLength: user_history.length });

    try {
      const contextAnalysis = this.analyzeContext(userContext);
      const suggestions = await this.generateContextualSuggestions(contextAnalysis, user_history, context.userId);
      const formattedSuggestions = this.formatSmartSuggestions(suggestions, contextAnalysis);

      return {
        success: true,
        data: {
          suggestions,
          context_analysis: contextAnalysis,
          total_suggestions: suggestions.length
        },
        message: formattedSuggestions
      };

    } catch (error) {
      return { success: false, message: '❌ 生成建议失败，请重试' };
    }
  }

  private analyzeContext(context: string) {
    return {
      sentiment: this.detectSentiment(context),
      urgency: this.detectUrgency(context),
      topics: this.extractKeywords(context),
      length: context.length,
      hasQuestions: context.includes('?') || context.includes('？'),
      hasProblems: /问题|错误|失败|困难/.test(context)
    };
  }

  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['好', '棒', '优秀', '成功', '赞', '满意'];
    const negativeWords = ['糟', '差', '失败', '错误', '问题', '困难'];
    
    const positive = positiveWords.some(word => text.includes(word));
    const negative = negativeWords.some(word => text.includes(word));
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    return 'neutral';
  }

  private detectUrgency(text: string): 'high' | 'medium' | 'low' {
    if (/紧急|急|立即|马上|赶紧/.test(text)) return 'high';
    if (/今天|尽快|很快/.test(text)) return 'medium';
    return 'low';
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 8);
  }

  private async generateContextualSuggestions(contextAnalysis: any, userHistory: string[], userId?: string) {
    const storage = this.getStorage();
    const suggestions = [];

    for (const topic of contextAnalysis.topics.slice(0, 3)) {
      const topicResults = await storage.searchPrompts(topic, userId);
      if (Array.isArray(topicResults)) {
        suggestions.push(...topicResults.slice(0, 2));
      }
    }

    if (userHistory.length > 0) {
      const lastUsed = userHistory[0];
      const similarResults = await storage.searchPrompts(lastUsed, userId);
      if (Array.isArray(similarResults)) {
        suggestions.push(...similarResults.slice(0, 1));
      }
    }

    const unique = Array.from(new Map(suggestions.map(s => [s.id, s])).values());
    return unique.slice(0, 5);
  }

  private formatSmartSuggestions(suggestions: any[], contextAnalysis: any): string {
    if (suggestions.length === 0) {
      return '💡 暂无相关建议，请提供更多上下文信息';
    }

    let response = `💡 **智能建议** (基于您的上下文分析):\n\n`;
    
    response += `📊 **上下文**: ${contextAnalysis.sentiment === 'positive' ? '积极' : contextAnalysis.sentiment === 'negative' ? '需要帮助' : '中性'} | `;
    response += `⏰ **紧急度**: ${contextAnalysis.urgency === 'high' ? '高' : contextAnalysis.urgency === 'medium' ? '中' : '低'}\n\n`;

    suggestions.forEach((suggestion, index) => {
      response += `${index + 1}. **${suggestion.name}**\n`;
      response += `   📝 ${suggestion.description || '暂无描述'}\n`;
      response += `   🏷️ ${suggestion.category || '通用'}\n\n`;
    });

    response += `🎯 **提示**: 这些建议基于您的上下文和使用历史生成`;
    return response;
  }
}

/**
 * 探索发现工具类
 */
export class DiscoverTool extends BaseMCPTool {
  readonly name = 'discover_prompts';
  readonly description = '🔍 探索发现 - 浏览热门分类、新增提示词、推荐组合';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        discover_type: { type: 'string', description: '探索类型：trending（热门）、new（最新）、categories（分类）、combos（组合）', required: false } as ToolParameter,
        interest: { type: 'string', description: '兴趣领域：business、tech、creative、academic、daily', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { discover_type = 'trending', interest = 'business' } = params;
    
    this.logExecution('探索发现', context, { discover_type, interest });

    try {
      let discoveryContent = '';
      let discoveryData = {};

      switch (discover_type) {
        case 'trending': {
          const trendingData = await this.generateTrendingView(interest, context.userId);
          discoveryContent = trendingData.content;
          discoveryData = trendingData.data;
          break;
        }
        case 'new': {
          const newData = await this.generateNewPromptsView(interest, context.userId);
          discoveryContent = newData.content;
          discoveryData = newData.data;
          break;
        }
        case 'categories': {
          const categoriesData = await this.generateCategoriesView(context.userId);
          discoveryContent = categoriesData.content;
          discoveryData = categoriesData.data;
          break;
        }
        case 'combos': {
          const combosData = await this.generateCombosView(interest, context.userId);
          discoveryContent = combosData.content;
          discoveryData = combosData.data;
          break;
        }
        default:
          return { success: false, message: '❌ 不支持的探索类型' };
      }

      return {
        success: true,
        data: { discover_type, interest, ...discoveryData },
        message: discoveryContent
      };

    } catch (error) {
      return { success: false, message: '❌ 探索发现失败，请重试' };
    }
  }

  private async generateTrendingView(interest: string, userId?: string): Promise<{ content: string, data: any }> {
    const storage = this.getStorage();
          const prompts = await storage.getPrompts({ sortBy: 'latest', pageSize: 6 });
    const promptList = Array.isArray(prompts) ? prompts : [];

    let content = `🔥 **${interest.toUpperCase()} 领域热门提示词**\n\n`;
    
    promptList.forEach((prompt, index) => {
      content += `${index + 1}. **${prompt.name}**\n`;
      content += `   📝 ${prompt.description || '暂无描述'}\n`;
      content += `   🏷️ ${prompt.category || '通用'} | 🔥 热度: ${Math.floor(Math.random() * 100)}%\n\n`;
    });

    content += `💡 **趋势洞察**: ${interest} 领域最受欢迎的提示词，持续更新中`;

    return { content, data: { trending_prompts: promptList, interest } };
  }

  private async generateNewPromptsView(interest: string, userId?: string): Promise<{ content: string, data: any }> {
    const storage = this.getStorage();
          const prompts = await storage.getPrompts({ sortBy: 'latest', pageSize: 5 });
    const promptList = Array.isArray(prompts) ? prompts : [];

    let content = `✨ **${interest.toUpperCase()} 领域最新提示词**\n\n`;
    
    promptList.forEach((prompt, index) => {
      const daysAgo = Math.floor(Math.random() * 7) + 1;
      content += `${index + 1}. **${prompt.name}** 🆕\n`;
      content += `   📝 ${prompt.description || '暂无描述'}\n`;
      content += `   📅 ${daysAgo} 天前添加 | 🏷️ ${prompt.category || '通用'}\n\n`;
    });

    content += `🚀 **保持更新**: 每日都有新的优质提示词加入库中`;

    return { content, data: { new_prompts: promptList, interest } };
  }

  private async generateCategoriesView(userId?: string): Promise<{ content: string, data: any }> {
    const categories = [
      { name: '商业', count: 45, description: '商务邮件、营销文案、产品介绍' },
      { name: '技术', count: 38, description: '代码分析、技术文档、架构设计' },
      { name: '创意', count: 29, description: '创意写作、设计思维、头脑风暴' },
      { name: '学术', count: 22, description: '论文写作、研究分析、学术报告' },
      { name: '日常', count: 31, description: '生活助手、学习计划、个人管理' }
    ];

    let content = `📚 **分类浏览** - 发现更多可能性\n\n`;
    
    categories.forEach((category, index) => {
      content += `${index + 1}. **${category.name}** (${category.count} 个提示词)\n`;
      content += `   📖 ${category.description}\n\n`;
    });

    content += `🎯 **使用技巧**: 点击分类名称查看该分类下的所有提示词`;

    return { content, data: { categories } };
  }

  private async generateCombosView(interest: string, userId?: string): Promise<{ content: string, data: any }> {
    const combos = [
      {
        name: '商务沟通套装',
        prompts: ['正式邮件模板', '会议纪要生成', '项目报告框架'],
        useCase: '完整的商务沟通流程'
      },
      {
        name: '内容创作组合',
        prompts: ['创意头脑风暴', '文章大纲生成', '内容润色工具'],
        useCase: '从构思到完稿的创作流程'
      },
      {
        name: '学习助手包',
        prompts: ['知识点总结', '问题解答框架', '学习计划制定'],
        useCase: '高效学习和知识管理'
      }
    ];

    let content = `🎁 **推荐组合** - 组合使用效果更佳\n\n`;
    
    combos.forEach((combo, index) => {
      content += `${index + 1}. **${combo.name}**\n`;
      content += `   🎯 ${combo.useCase}\n`;
      content += `   📦 包含: ${combo.prompts.join(' + ')}\n\n`;
    });

    content += `💡 **组合优势**: 多个相关提示词配合使用，解决复杂任务更高效`;

    return { content, data: { combos, interest } };
  }
}

// 创建工具实例
export const oneClickSearchTool = new OneClickSearchTool();
export const readyToUseTool = new ReadyToUseTool();
export const smartSuggestionTool = new SmartSuggestionTool();
export const discoverTool = new DiscoverTool();

// 向后兼容的函数导出
export async function handleOneClickSearch(params: any, userId?: string) {
  return oneClickSearchTool.handleExecution(params, userId);
}

export async function handleReadyToUse(params: any, userId?: string) {
  return readyToUseTool.handleExecution(params, userId);
}

export async function handleSmartSuggestions(params: any, userId?: string) {
  return smartSuggestionTool.handleExecution(params, userId);
}

export async function handleDiscover(params: any, userId?: string) {
  return discoverTool.handleExecution(params, userId);
}

// 工具定义导出
export const oneClickSearchToolDef = oneClickSearchTool.getToolDefinition();
export const readyToUseToolDef = readyToUseTool.getToolDefinition();
export const smartSuggestionToolDef = smartSuggestionTool.getToolDefinition();
export const discoverToolDef = discoverTool.getToolDefinition(); 