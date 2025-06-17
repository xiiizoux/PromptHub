/**
 * 增强搜索工具 - 新基类版本
 * 提供高级搜索、过滤和排序功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../types.js';

/**
 * 高级搜索工具类
 */
export class AdvancedSearchTool extends BaseMCPTool {
  readonly name = 'advanced_search';
  readonly description = '提供多维度的高级搜索功能，支持复杂过滤条件';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: { type: 'string', description: '搜索查询', required: true } as ToolParameter,
        filters: { type: 'object', description: '过滤条件', required: false } as ToolParameter,
        sort_by: { type: 'string', description: '排序字段', required: false } as ToolParameter,
        limit: { type: 'number', description: '结果数量限制', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['query']);

    const { query, filters = {}, sort_by = 'relevance', limit = 10 } = params;
    
    this.logExecution('高级搜索', context, { 
      queryLength: query.length, 
      hasFilters: Object.keys(filters).length > 0,
      sort_by,
      limit 
    });

    try {
      const storage = this.getStorage();
      
      // 执行基础搜索
      let results = await storage.searchPrompts(query, context.userId);
      if (!Array.isArray(results)) results = [];

      // 应用过滤器
      results = this.applyFilters(results, filters);

      // 应用排序
      results = this.applySorting(results, sort_by);

      // 限制结果数量
      results = results.slice(0, limit);

      return {
        success: true,
        data: {
          results,
          total: results.length,
          query,
          filters_applied: filters,
          sort_by
        },
        message: `找到 ${results.length} 个匹配的提示词`
      };

    } catch (error) {
      return { success: false, message: '高级搜索失败，请重试' };
    }
  }

  private applyFilters(prompts: Prompt[], filters: any): Prompt[] {
    let filtered = prompts;

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.tags && Array.isArray(filters.tags)) {
      filtered = filtered.filter(p => 
        filters.tags.some((tag: string) => p.tags?.includes(tag))
      );
    }

    if (filters.is_public !== undefined) {
      filtered = filtered.filter(p => p.is_public === filters.is_public);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filtered = filtered.filter(p => 
        p.created_at && new Date(p.created_at) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filtered = filtered.filter(p => 
        p.created_at && new Date(p.created_at) <= toDate
      );
    }

    return filtered;
  }

  private applySorting(prompts: Prompt[], sortBy: string): Prompt[] {
    const sorted = [...prompts];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'created_at':
        return sorted.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case 'category':
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      case 'relevance':
      default:
        return sorted; // 保持搜索引擎的相关性排序
    }
  }
}

/**
 * 多字段搜索工具类
 */
export class MultiFieldSearchTool extends BaseMCPTool {
  readonly name = 'multi_field_search';
  readonly description = '在多个字段中同时搜索，提供更精确的结果';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        name_query: { type: 'string', description: '名称搜索', required: false } as ToolParameter,
        content_query: { type: 'string', description: '内容搜索', required: false } as ToolParameter,
        tag_query: { type: 'string', description: '标签搜索', required: false } as ToolParameter,
        description_query: { type: 'string', description: '描述搜索', required: false } as ToolParameter,
        match_mode: { type: 'string', description: '匹配模式：all/any', required: false } as ToolParameter,
        limit: { type: 'number', description: '结果数量', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { 
      name_query, 
      content_query, 
      tag_query, 
      description_query,
      match_mode = 'any',
      limit = 10 
    } = params;

    const queries = [name_query, content_query, tag_query, description_query].filter(Boolean);
    
    if (queries.length === 0) {
      return { success: false, message: '请提供至少一个搜索条件' };
    }

    this.logExecution('多字段搜索', context, { 
      queries_count: queries.length, 
      match_mode, 
      limit 
    });

    try {
      const storage = this.getStorage();
      const results = await this.performMultiFieldSearch(
        { name_query, content_query, tag_query, description_query },
        match_mode,
        limit,
        context.userId
      );

      return {
        success: true,
        data: {
          results,
          total: results.length,
          search_fields: {
            name: !!name_query,
            content: !!content_query,
            tags: !!tag_query,
            description: !!description_query
          },
          match_mode
        },
        message: `多字段搜索找到 ${results.length} 个结果`
      };

    } catch (error) {
      return { success: false, message: '多字段搜索失败，请重试' };
    }
  }

  private async performMultiFieldSearch(
    queries: any, 
    matchMode: string, 
    limit: number, 
    userId?: string
  ): Promise<Prompt[]> {
    const storage = this.getStorage();
    const allResults: Set<Prompt> = new Set();
    const fieldMatches: Map<string, Set<Prompt>> = new Map();

    // 对每个字段执行搜索
    for (const [field, query] of Object.entries(queries)) {
      if (!query) continue;

      const results = await storage.searchPrompts(query as string, userId);
      const prompts = Array.isArray(results) ? results : [];
      
      // 字段特定的过滤
      const filtered = this.filterByField(prompts, field, query as string);
      fieldMatches.set(field, new Set(filtered));
      
      if (matchMode === 'any') {
        filtered.forEach(p => allResults.add(p));
      }
    }

    if (matchMode === 'all' && fieldMatches.size > 1) {
      // 找到所有字段都匹配的结果
      const intersectionResults = this.findIntersection([...fieldMatches.values()]);
      return Array.from(intersectionResults).slice(0, limit);
    }

    return Array.from(allResults).slice(0, limit);
  }

  private filterByField(prompts: Prompt[], field: string, query: string): Prompt[] {
    const lowerQuery = query.toLowerCase();
    
    return prompts.filter(prompt => {
      switch (field) {
        case 'name_query':
          return prompt.name?.toLowerCase().includes(lowerQuery);
        case 'description_query':
          return prompt.description?.toLowerCase().includes(lowerQuery);
        case 'tag_query':
          return prompt.tags?.some(tag => (tag as string).toLowerCase().includes(lowerQuery));
        case 'content_query':
          return this.searchInContent(prompt, lowerQuery);
        default:
          return true;
      }
    });
  }

  private searchInContent(prompt: Prompt, query: string): boolean {
    // 简化内容搜索，绕过复杂的类型检查
    const promptStr = JSON.stringify(prompt.messages || '').toLowerCase();
    return promptStr.includes(query.toLowerCase());
  }

  private findIntersection<T>(sets: Set<T>[]): Set<T> {
    if (sets.length === 0) return new Set();
    
    let result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      result = new Set([...result].filter(x => sets[i].has(x)));
    }
    return result;
  }
}

/**
 * 智能过滤工具类
 */
export class SmartFilterTool extends BaseMCPTool {
  readonly name = 'smart_filter';
  readonly description = '智能过滤和分组，基于内容特征自动分类';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: { type: 'string', description: '基础查询', required: false } as ToolParameter,
        auto_group: { type: 'boolean', description: '自动分组', required: false } as ToolParameter,
        complexity_filter: { type: 'string', description: '复杂度过滤：simple/medium/complex', required: false } as ToolParameter,
        language_filter: { type: 'string', description: '语言过滤', required: false } as ToolParameter,
        limit: { type: 'number', description: '结果数量', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { 
      query = '', 
      auto_group = false, 
      complexity_filter = '', 
      language_filter = '',
      limit = 20 
    } = params;

    this.logExecution('智能过滤', context, { 
      hasQuery: !!query, 
      auto_group, 
      complexity_filter, 
      language_filter,
      limit 
    });

    try {
      const storage = this.getStorage();
      
      // 获取基础结果
      let results = query ? 
        await storage.searchPrompts(query, context.userId) : 
        await storage.getPrompts({ isPublic: true });
      
      if (!Array.isArray(results)) results = [];

      // 应用智能过滤
      results = this.applySmartFilters(results, {
        complexity_filter,
        language_filter
      });

      // 限制数量
      results = results.slice(0, limit);

      // 自动分组
      const grouped = auto_group ? this.autoGroup(results) : null;

      return {
        success: true,
        data: {
          results,
          total: results.length,
          grouped,
          filters_applied: {
            complexity: complexity_filter,
            language: language_filter
          }
        },
        message: `智能过滤找到 ${results.length} 个结果${auto_group ? '，已自动分组' : ''}`
      };

    } catch (error) {
      return { success: false, message: '智能过滤失败，请重试' };
    }
  }

  private applySmartFilters(prompts: Prompt[], filters: any): Prompt[] {
    let filtered = prompts;

    if (filters.complexity_filter) {
      filtered = filtered.filter(p => 
        this.getComplexity(p) === filters.complexity_filter
      );
    }

    if (filters.language_filter) {
      filtered = filtered.filter(p => 
        this.detectLanguage(p) === filters.language_filter
      );
    }

    return filtered;
  }

  private getComplexity(prompt: Prompt): string {
    const content = this.extractContent(prompt);
    const length = content.length;
    const hasVariables = prompt.variables && prompt.variables.length > 0;
    
    if (length < 100 && !hasVariables) return 'simple';
    if (length > 500 || (hasVariables && prompt.variables!.length > 3)) return 'complex';
    return 'medium';
  }

  private detectLanguage(prompt: Prompt): string {
    const content = this.extractContent(prompt);
    // 简单的语言检测
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const totalChars = content.length;
    
    return chineseChars / totalChars > 0.3 ? 'chinese' : 'english';
  }

  private extractContent(prompt: Prompt): string {
    if (typeof prompt.messages === 'string') return prompt.messages;
    if (Array.isArray(prompt.messages)) {
      return prompt.messages.map(msg => 
        typeof msg === 'string' ? msg : msg.content?.text || msg.content || ''
      ).join(' ');
    }
    return prompt.description || prompt.name || '';
  }

  private autoGroup(prompts: Prompt[]): any {
    const groups: { [key: string]: Prompt[] } = {};

    prompts.forEach(prompt => {
      const category = prompt.category || 'uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(prompt);
    });

    return Object.entries(groups).map(([category, items]) => ({
      category,
      count: items.length,
      items
    }));
  }
}

// 创建工具实例
export const advancedSearchTool = new AdvancedSearchTool();
export const multiFieldSearchTool = new MultiFieldSearchTool();
export const smartFilterTool = new SmartFilterTool();

// 向后兼容的函数导出
export async function handleAdvancedSearch(params: any, userId?: string) {
  return advancedSearchTool.handleExecution(params, userId);
}

export async function handleMultiFieldSearch(params: any, userId?: string) {
  return multiFieldSearchTool.handleExecution(params, userId);
}

export async function handleSmartFilter(params: any, userId?: string) {
  return smartFilterTool.handleExecution(params, userId);
}

// 工具定义导出
export const advancedSearchToolDef = advancedSearchTool.getToolDefinition();
export const multiFieldSearchToolDef = multiFieldSearchTool.getToolDefinition();
export const smartFilterToolDef = smartFilterTool.getToolDefinition(); 