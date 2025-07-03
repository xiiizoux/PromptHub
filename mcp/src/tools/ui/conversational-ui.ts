/**
 * 对话界面优化工具 - 新基类版本
 * 专为第三方AI客户端对话窗口设计的简洁高效呈现方式
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt, PromptContentJsonb } from '../../types.js';

/**
 * 简洁搜索工具类
 */
export class ConversationalSearchTool extends BaseMCPTool {
  readonly name = 'search';
  readonly description = '🔍 智能搜索提示词 - 简洁对话界面，快速选择使用';

  /**
   * 从 PromptContentJsonb | string 类型中提取字符串内容
   */
  private extractStringContent(content: PromptContentJsonb | string): string {
    if (typeof content === 'string') {
      return content;
    }
    
    // 如果是 JSONB 对象，按优先级提取内容
    if (content.static_content) {
      return content.static_content;
    }
    
    if (content.legacy_content) {
      return content.legacy_content;
    }
    
    return '';
  }

  // 缓存最近的搜索结果，供用户选择使用
  private static searchCache = new Map<string, {
    results: any[];
    timestamp: number;
    query: string;
  }>();

  // 提供公共方法访问缓存
  static getLatestCachedResults(): any[] | null {
    let latest: any = null;
    let latestTime = 0;
    
    for (const cache of ConversationalSearchTool.searchCache.values()) {
      if (cache.timestamp > latestTime) {
        latestTime = cache.timestamp;
        latest = cache.results;
      }
    }
    
    return latest;
  }

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索需求，例如："写道歉邮件"、"分析代码"、"创意文案"',
          required: true,
        } as ToolParameter,
        mode: {
          type: 'string',
          description: '展示模式：quick（快速3个）、normal（常规5个）、detailed（详细8个）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['query']);

    const { query, mode = 'normal' } = params;
    
    this.logExecution('开始对话式搜索', context, { 
      query: query.substring(0, 30), 
      mode 
    });

    try {
      // 执行搜索
      const searchResults = await this.performOptimizedSearch(query, context.userId);
      
      // 根据模式限制结果数量
      const limitedResults = this.limitResultsByMode(searchResults, mode);
      
      // 缓存结果供后续使用
      const sessionId = this.generateSessionId();
      this.cacheSearchResults(sessionId, limitedResults, query);
      
      // 生成对话友好的响应
      const response = this.formatConversationalResponse(limitedResults, query, mode, sessionId);
      
      return {
        success: true,
        data: {
          results: limitedResults,
          session_id: sessionId,
          mode,
          formatted_response: response
        },
        message: `找到 ${limitedResults.length} 个匹配结果`
      };

    } catch (error) {
      return {
        success: false,
        message: '搜索遇到问题，请尝试更简单的关键词'
      };
    }
  }

  /**
   * 优化搜索算法
   */
  private async performOptimizedSearch(query: string, userId?: string) {
    const storage = this.getStorage();
    const results = await storage.searchPrompts(query, userId);
    
    // 按相关性和实用性排序
    return Array.isArray(results) ? results
      .map(prompt => ({
        ...prompt,
        score: this.calculateSimpleScore(prompt, query)
      }))
      .sort((a, b) => b.score - a.score) : [];
  }

  /**
   * 简化评分算法
   */
  private calculateSimpleScore(prompt: Prompt, query: string): number {
    let score = 0;
    const queryWords = query.toLowerCase().split(/\s+/);
    const promptText = `${prompt.name} ${prompt.description}`.toLowerCase();
    
    // 名称匹配得分更高
    queryWords.forEach(word => {
      if (prompt.name?.toLowerCase().includes(word)) score += 3;
      if (prompt.description?.toLowerCase().includes(word)) score += 1;
      if (prompt.tags?.some(tag => tag.toLowerCase().includes(word))) score += 2;
    });
    
    return score;
  }

  /**
   * 根据模式限制结果数量
   */
  private limitResultsByMode(results: any[], mode: string): any[] {
    const limits = {
      'quick': 3,
      'normal': 5, 
      'detailed': 8
    };
    
    const limit = limits[mode as keyof typeof limits] || 5;
    return results.slice(0, limit);
  }

  /**
   * 格式化对话响应
   */
  private formatConversationalResponse(results: any[], query: string, mode: string, sessionId: string): string {
    if (results.length === 0) {
      return `🔍 未找到"${query}"相关结果\n💡 建议：\n• 尝试更简单的关键词\n• 使用 browse() 查看所有分类`;
    }

    let response = `🎯 "${query}" 搜索结果 (${results.length}个):\n\n`;
    
    results.forEach((prompt, index) => {
      const num = index + 1;
      const name = prompt.name || '未命名';
      const desc = this.getTruncatedDescription(prompt.description, 50);
      
      response += `${num}. **${name}**\n`;
      if (desc) response += `   ${desc}\n`;
      response += `   🎯 评分: ${prompt.score || 0}\n\n`;
    });

    response += `💡 使用方式：\n• 直接使用: use("编号或名称")\n• 继续搜索: search("新关键词")`;
    
    return response;
  }

  private getTruncatedDescription(desc: string | undefined, maxLength: number): string {
    if (!desc) return '';
    return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private cacheSearchResults(sessionId: string, results: any[], query: string) {
    // 清理过期缓存 (5分钟)
    const now = Date.now();
    for (const [key, cache] of ConversationalSearchTool.searchCache.entries()) {
      if (now - cache.timestamp > 5 * 60 * 1000) {
        ConversationalSearchTool.searchCache.delete(key);
      }
    }

    // 添加新缓存
    ConversationalSearchTool.searchCache.set(sessionId, {
      results,
      timestamp: now,
      query
    });
  }
}

/**
 * 直接使用工具类
 */
export class DirectUseTool extends BaseMCPTool {
  readonly name = 'use';
  readonly description = '📋 直接使用提示词 - 输入编号或名称，立即获得可用格式';

  /**
   * 从 PromptContentJsonb | string 类型中提取字符串内容
   */
  private extractStringContent(content: PromptContentJsonb | string): string {
    if (typeof content === 'string') {
      return content;
    }
    
    // 如果是 JSONB 对象，按优先级提取内容
    if (content.static_content) {
      return content.static_content;
    }
    
    if (content.legacy_content) {
      return content.legacy_content;
    }
    
    return '';
  }

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        selection: {
          type: 'string',
          description: '选择方式：编号(1-8)、提示词名称、或ID',
          required: true,
        } as ToolParameter,
        vars: {
          type: 'object',
          description: '变量值，例如：{"name":"张三","topic":"项目进度"}',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['selection']);

    const { selection, vars = {} } = params;
    
    this.logExecution('直接使用提示词', context, { 
      selection: selection.substring(0, 20), 
      has_vars: Object.keys(vars).length > 0 
    });

    try {
      // 解析用户选择
      const prompt = await this.resolveUserSelection(selection, context.userId);
      
      if (!prompt) {
        return {
          success: false,
          message: '未找到该提示词，请检查编号或名称'
        };
      }

      // 生成可直接使用的格式
      const readyFormat = this.generateDirectUseFormat(prompt, vars);
      
      return {
        success: true,
        data: {
          prompt_name: prompt.name,
          ready_content: readyFormat,
          variables_applied: Object.keys(vars).length > 0
        },
        message: `已准备好提示词: ${prompt.name}`
      };

    } catch (error) {
      return {
        success: false,
        message: '获取失败，请重试'
      };
    }
  }

  /**
   * 解析用户选择
   */
  private async resolveUserSelection(selection: string, userId?: string): Promise<Prompt | null> {
    const storage = this.getStorage();
    
    // 尝试数字编号 (从缓存获取)
    if (/^\d+$/.test(selection)) {
      const num = parseInt(selection);
      const cachedResults = this.getLatestCachedResults();
      if (cachedResults && num > 0 && num <= cachedResults.length) {
        return cachedResults[num - 1];
      }
    }

    // 尝试直接按ID或名称获取
    try {
      let prompt = await storage.getPrompt(selection, userId);
      if (!prompt) {
        // 尝试搜索匹配
        const searchResults = await storage.searchPrompts(selection, userId);
        prompt = Array.isArray(searchResults) ? searchResults.find(p => 
          p.name?.toLowerCase() === selection.toLowerCase() ||
          p.id === selection
        ) : null;
      }
      return prompt;
    } catch (error) {
      console.error('[直接使用] 解析选择失败:', error);
      return null;
    }
  }

  /**
   * 生成直接使用格式
   */
  private generateDirectUseFormat(prompt: Prompt, vars: any): string {
    let content = '';
    
    // 提取消息内容
    content = this.extractStringContent(prompt.content || '');

    // 应用变量替换
    if (Object.keys(vars).length > 0) {
      content = this.replaceVariables(content, vars);
    }

    let result = `📋 **${prompt.name}**\n\n`;
    result += `${content}\n\n`;
    
    if (prompt.variables?.length && Object.keys(vars).length === 0) {
      result += `💡 提示：此提示词包含变量，可使用 use("${prompt.name}", {"变量名":"值"}) 来替换变量`;
    }

    return result;
  }

  private replaceVariables(content: string, variables: any): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\$\\{${key}\\}|\\[${key}\\]`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private getLatestCachedResults() {
    // 使用公共方法获取缓存结果
    return ConversationalSearchTool.getLatestCachedResults();
  }
}

/**
 * 快速浏览工具类
 */
export class BrowseTool extends BaseMCPTool {
  readonly name = 'browse';
  readonly description = '👀 浏览提示词 - 按分类或热度快速发现';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        type: {
          type: 'string',
          description: '浏览类型：hot（热门）、new（最新）、business（商务）、tech（技术）、creative（创意）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { type = 'hot' } = params;
    
    this.logExecution('快速浏览', context, { type });

    try {
      const browseResults = await this.getBrowseContent(type, context.userId);
      const response = this.formatBrowseResponse(browseResults, type);
      
      return {
        success: true,
        data: {
          browse_type: type,
          results: browseResults,
          formatted_response: response
        },
        message: `浏览 ${type} 类型内容`
      };

    } catch (error) {
      return {
        success: false,
        message: '浏览失败，请重试'
      };
    }
  }

  /**
   * 获取浏览内容
   */
  private async getBrowseContent(type: string, userId?: string) {
    const storage = this.getStorage();
    
    switch (type) {
      case 'hot': {
        // 简化：获取所有并按某种热度排序
        const allPrompts = await storage.getPrompts({ userId });
        return Array.isArray(allPrompts) ? allPrompts.slice(0, 6) : [];
      }
        
      case 'new': {
        const newPrompts = await storage.getPrompts({ userId });
        return Array.isArray(newPrompts) ? newPrompts
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 6) : [];
      }
        
      case 'business':
      case 'tech':
      case 'creative':
        try {
          const categoryPrompts = await storage.getPromptsByCategory(type, userId);
          return Array.isArray(categoryPrompts) ? categoryPrompts.slice(0, 6) : [];
        } catch {
          return [];
        }
        
      default: {
        const defaultPrompts = await storage.getPrompts({ userId });
        return Array.isArray(defaultPrompts) ? defaultPrompts.slice(0, 6) : [];
      }
    }
  }

  /**
   * 格式化浏览响应
   */
  private formatBrowseResponse(results: any[], type: string): string {
    const typeNames = {
      'hot': '🔥 热门',
      'new': '✨ 最新',
      'business': '💼 商务',
      'tech': '🔧 技术',
      'creative': '🎨 创意'
    };

    const typeName = typeNames[type as keyof typeof typeNames] || '📂 全部';
    
    if (results.length === 0) {
      return `${typeName} 提示词\n\n暂无内容，请尝试其他分类`;
    }

    let response = `${typeName} 提示词 (${results.length}个):\n\n`;
    
    results.forEach((prompt, index) => {
      const num = index + 1;
      const name = prompt.name || '未命名';
      const desc = prompt.description?.substring(0, 40) || '';
      
      response += `${num}. **${name}**\n`;
      if (desc) response += `   ${desc}${desc.length >= 40 ? '...' : ''}\n`;
      response += '\n';
    });

    response += `💡 使用方式：use("编号或名称")\n`;
    response += `🔍 搜索：search("你的需求")`;
    
    return response;
  }
}

// 创建工具实例
export const conversationalSearchTool = new ConversationalSearchTool();
export const directUseTool = new DirectUseTool();
export const browseTool = new BrowseTool();

// 向后兼容的函数导出（保持现有API不变）
export async function handleConversationalSearch(params: any, userId?: string) {
  return conversationalSearchTool.handleExecution(params, userId);
}

export async function handleDirectUse(params: any, userId?: string) {
  return directUseTool.handleExecution(params, userId);
}

export async function handleBrowse(params: any, userId?: string) {
  return browseTool.handleExecution(params, userId);
}

// 工具定义导出（用于注册）
export const conversationalSearchToolDef = conversationalSearchTool.getToolDefinition();
export const directUseToolDef = directUseTool.getToolDefinition();
export const browseToolDef = browseTool.getToolDefinition(); 