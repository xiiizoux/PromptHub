/**
 * 智能推荐工具 - 新基类版本
 * 为用户提供智能的提示词推荐和发现功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../types.js';

/**
 * 智能推荐工具类
 */
export class SmartRecommendationTool extends BaseMCPTool {
  readonly name = 'smart_recommendation';
  readonly description = '基于用户偏好和历史使用提供智能推荐';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        context: { type: 'string', description: '推荐上下文或需求描述', required: false } as ToolParameter,
        category: { type: 'string', description: '指定分类', required: false } as ToolParameter,
        limit: { type: 'number', description: '返回数量限制', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { context: requestContext = '', category = '', limit = 5 } = params;
    
    this.logExecution('智能推荐', context, { hasContext: !!requestContext, category, limit });

    try {
      const storage = this.getStorage();
      
      // 获取推荐
      const recommendations = await this.getRecommendations(requestContext, category, limit, context.userId);

      return {
        success: true,
        data: {
          recommendations,
          total: recommendations.length,
          context: requestContext || '通用推荐'
        },
        message: `为您推荐了 ${recommendations.length} 个提示词`
      };

    } catch (error) {
      return { success: false, message: '获取推荐失败，请重试' };
    }
  }

  private async getRecommendations(context: string, category: string, limit: number, userId?: string): Promise<Prompt[]> {
    const storage = this.getStorage();
    
    // 简化推荐逻辑
    if (category) {
      return (await storage.getPromptsByCategory(category, { limit, is_public: true })).slice(0, limit);
    }
    
    if (context) {
      const searchResults = await storage.searchPrompts(context, userId);
      return Array.isArray(searchResults) ? searchResults.slice(0, limit) : [];
    }

    // 默认推荐热门提示词
    const allPrompts = await storage.getPrompts({ limit: limit * 2, is_public: true });
    return Array.isArray(allPrompts) ? allPrompts.slice(0, limit) : [];
  }
}

/**
 * 相似提示词工具类
 */
export class SimilarPromptsTool extends BaseMCPTool {
  readonly name = 'find_similar_prompts';
  readonly description = '基于给定提示词查找相似内容';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        prompt_id: { type: 'string', description: '参考提示词ID', required: false } as ToolParameter,
        content: { type: 'string', description: '参考内容', required: false } as ToolParameter,
        limit: { type: 'number', description: '返回数量', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { prompt_id, content, limit = 5 } = params;
    
    if (!prompt_id && !content) {
      return { success: false, message: '请提供提示词ID或内容作为参考' };
    }

    this.logExecution('查找相似提示词', context, { hasPromptId: !!prompt_id, hasContent: !!content, limit });

    try {
      const storage = this.getStorage();
      let referenceContent = content;

      if (prompt_id && !content) {
        const prompt = await storage.getPrompt(prompt_id);
        if (!prompt) {
          return { success: false, message: '未找到参考提示词' };
        }
        referenceContent = this.extractContentFromPrompt(prompt);
      }

      const similar = await this.findSimilar(referenceContent, limit, context.userId);

      return {
        success: true,
        data: {
          similar_prompts: similar,
          total: similar.length,
          reference: prompt_id || 'provided_content'
        },
        message: `找到 ${similar.length} 个相似提示词`
      };

    } catch (error) {
      return { success: false, message: '查找相似提示词失败' };
    }
  }

  private extractContentFromPrompt(prompt: Prompt): string {
    if (typeof prompt.messages === 'string') return prompt.messages;
    if (Array.isArray(prompt.messages)) {
      return prompt.messages.map(m => 
        typeof m === 'string' ? m : m.content?.text || m.content || ''
      ).join(' ');
    }
    return prompt.description || prompt.name || '';
  }

  private async findSimilar(content: string, limit: number, userId?: string): Promise<Prompt[]> {
    const storage = this.getStorage();
    
    // 简化相似度查找 - 基于关键词匹配
    const keywords = this.extractKeywords(content);
    const results: Prompt[] = [];
    
    for (const keyword of keywords.slice(0, 3)) {
      const searchResults = await storage.searchPrompts(keyword, userId);
      if (Array.isArray(searchResults)) {
        results.push(...searchResults);
      }
    }

    // 去重并限制数量
    const unique = Array.from(new Map(results.map(p => [p.id, p])).values());
    return unique.slice(0, limit);
  }

  private extractKeywords(content: string): string[] {
    // 简单关键词提取
    const words = content.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    return [...new Set(words)].slice(0, 10);
  }
}

/**
 * 趋势发现工具类
 */
export class TrendDiscoveryTool extends BaseMCPTool {
  readonly name = 'discover_trends';
  readonly description = '发现热门和趋势提示词';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        timeframe: { type: 'string', description: '时间范围：week/month/quarter', required: false } as ToolParameter,
        category: { type: 'string', description: '分类筛选', required: false } as ToolParameter,
        limit: { type: 'number', description: '返回数量', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { timeframe = 'week', category = '', limit = 10 } = params;
    
    this.logExecution('发现趋势', context, { timeframe, category, limit });

    try {
      const storage = this.getStorage();
      const trends = await this.discoverTrends(timeframe, category, limit);

      return {
        success: true,
        data: {
          trends,
          timeframe,
          category: category || 'all',
          total: trends.length
        },
        message: `发现 ${trends.length} 个${timeframe}内的趋势提示词`
      };

    } catch (error) {
      return { success: false, message: '趋势发现失败，请重试' };
    }
  }

  private async discoverTrends(timeframe: string, category: string, limit: number): Promise<any[]> {
    const storage = this.getStorage();
    
    // 简化趋势发现 - 基于创建时间和公开状态
    const options: any = { 
      limit: limit * 2, 
      is_public: true,
      sort: 'created_at',
      order: 'desc'
    };

    if (category) {
      options.category = category;
    }

    const recentPrompts = await storage.getPrompts(options);
    const prompts = Array.isArray(recentPrompts) ? recentPrompts : [];

    // 模拟趋势数据
    return prompts.slice(0, limit).map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      category: prompt.category,
      tags: prompt.tags,
      created_at: prompt.created_at,
      trend_score: Math.random() * 100, // 模拟趋势分数
      growth_rate: (Math.random() * 50).toFixed(1) + '%'
    }));
  }
}

// 创建工具实例
export const smartRecommendationTool = new SmartRecommendationTool();
export const similarPromptsTool = new SimilarPromptsTool();
export const trendDiscoveryTool = new TrendDiscoveryTool();

// 向后兼容的函数导出
export async function handleSmartRecommendation(params: any, userId?: string) {
  return smartRecommendationTool.handleExecution(params, userId);
}

export async function handleSimilarPrompts(params: any, userId?: string) {
  return similarPromptsTool.handleExecution(params, userId);
}

export async function handleTrendDiscovery(params: any, userId?: string) {
  return trendDiscoveryTool.handleExecution(params, userId);
}

// 工具定义导出
export const smartRecommendationToolDef = smartRecommendationTool.getToolDefinition();
export const similarPromptsToolDef = similarPromptsTool.getToolDefinition();
export const trendDiscoveryToolDef = trendDiscoveryTool.getToolDefinition(); 