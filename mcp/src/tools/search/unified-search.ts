/**
 * 统一搜索工具
 * 
 * 将所有搜索功能整合到一个工具中，根据用户输入自动选择最合适的搜索策略
 * - 智能路由：根据参数复杂度自动选择搜索模式
 * - 渐进增强：从简单到复杂的搜索策略
 * - 统一接口：一个工具满足所有搜索需求
 */

import { BaseMCPTool } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter } from '../../types.js';

// 定义本地类型接口
interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
}

interface ToolContext {
  userId?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
}
import { optimizedSemanticSearchTool } from './semantic-optimized.js';
import { advancedSearchTool, multiFieldSearchTool } from './enhanced-search.js';
import { intelligentPromptSelectionTool } from '../ui/intelligent-ui.js';

/**
 * 搜索模式枚举
 */
type SearchMode = 'auto' | 'semantic' | 'advanced' | 'intelligent' | 'basic';

/**
 * 搜索复杂度评估结果
 */
interface SearchComplexity {
  mode: SearchMode;
  confidence: number;
  reason: string;
}

/**
 * 统一搜索参数
 */
interface UnifiedSearchParams {
  query: string;
  mode?: SearchMode;
  
  // 高级搜索参数
  category?: string;
  tags?: string[];
  difficulty?: string;
  date_from?: string;
  date_to?: string;
  
  // 智能选择参数
  context?: string;
  task_type?: string;
  preferences?: any;
  
  // 多字段搜索参数
  name_query?: string;
  content_query?: string;
  tag_query?: string;
  description_query?: string;
  
  // 通用参数
  max_results?: number;
  sort_by?: string;
  include_public?: boolean;
}

/**
 * 统一搜索工具类
 */
export class UnifiedSearchTool extends BaseMCPTool {
  readonly name = 'unified_search';
  readonly description = '🔍 统一搜索 - 智能路由到最适合的搜索方式，一个工具满足所有搜索需求';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索查询，支持自然语言描述',
          required: true,
        } as ToolParameter,
        
        mode: {
          type: 'string',
          description: '搜索模式：auto(自动选择) | semantic(语义) | advanced(高级) | intelligent(智能) | basic(基础)',
          required: false,
        } as ToolParameter,
        
        // 高级搜索选项
        category: {
          type: 'string',
          description: '分类筛选',
          required: false,
        } as ToolParameter,
        
        tags: {
          type: 'array',
          description: '标签筛选',
          required: false,
          items: { type: 'string' },
        } as ToolParameter,
        
        difficulty: {
          type: 'string',
          description: '难度级别：simple | medium | complex',
          required: false,
        } as ToolParameter,
        
        // 智能选择选项
        context: {
          type: 'string',
          description: '使用场景描述',
          required: false,
        } as ToolParameter,
        
        task_type: {
          type: 'string',
          description: '任务类型',
          required: false,
        } as ToolParameter,
        
        // 多字段搜索选项
        name_query: {
          type: 'string',
          description: '在名称中搜索',
          required: false,
        } as ToolParameter,
        
        content_query: {
          type: 'string',
          description: '在内容中搜索',
          required: false,
        } as ToolParameter,
        
        // 通用选项
        max_results: {
          type: 'number',
          description: '最大结果数，默认5个',
          required: false,
        } as ToolParameter,
        
        sort_by: {
          type: 'string',
          description: '排序方式：relevance | name | created_at | category',
          required: false,
        } as ToolParameter,
        
        include_public: {
          type: 'boolean',
          description: '是否包含公开提示词',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['query']);

    const startTime = performance.now();
    
    try {
      // 1. 分析搜索复杂度并确定搜索模式
      const complexity = this.analyzeSearchComplexity(params);
      const selectedMode = params.mode || complexity.mode;

      this.logExecution('统一搜索开始', context, {
        query: params.query.substring(0, 50),
        detectedMode: complexity.mode,
        selectedMode: selectedMode,
        confidence: complexity.confidence,
        hasAdvancedParams: this.hasAdvancedParams(params)
      });

      // 2. 根据模式路由到相应的搜索工具
      const result = await this.routeToSearchEngine(selectedMode, params, context);
      
      // 3. 增强结果信息
      const enhancedResult = this.enhanceSearchResult(result, {
        selectedMode,
        detectedMode: complexity.mode,
        confidence: complexity.confidence,
        reason: complexity.reason,
        executionTime: performance.now() - startTime
      });

      this.logExecution('统一搜索完成', context, {
        mode: selectedMode,
        resultsCount: result.data?.results?.length || 0,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      return enhancedResult;

    } catch (error) {
      console.error('[UnifiedSearch] 搜索失败:', error);
      return {
        success: false,
        message: `统一搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 分析搜索复杂度并确定最适合的搜索模式
   */
  private analyzeSearchComplexity(params: UnifiedSearchParams): SearchComplexity {
    // 检查是否有高级搜索参数
    if (this.hasAdvancedParams(params)) {
      return {
        mode: 'advanced',
        confidence: 0.9,
        reason: '检测到高级筛选参数，使用高级搜索'
      };
    }

    // 检查是否有多字段搜索参数
    if (this.hasMultiFieldParams(params)) {
      return {
        mode: 'advanced',
        confidence: 0.85,
        reason: '检测到多字段搜索参数，使用高级搜索'
      };
    }

    // 检查是否有智能选择参数
    if (params.context || params.task_type || params.preferences) {
      return {
        mode: 'intelligent',
        confidence: 0.8,
        reason: '检测到智能选择参数，使用智能推荐'
      };
    }

    // 分析查询内容复杂度
    const queryComplexity = this.analyzeQueryComplexity(params.query);
    
    if (queryComplexity.isNaturalLanguage && queryComplexity.complexity > 0.6) {
      return {
        mode: 'semantic',
        confidence: 0.9,
        reason: '检测到自然语言查询，使用智能语义搜索'
      };
    }

    if (queryComplexity.isSimpleKeyword) {
      return {
        mode: 'basic',
        confidence: 0.7,
        reason: '检测到简单关键词查询，使用基础搜索'
      };
    }

    // 默认使用语义搜索
    return {
      mode: 'semantic',
      confidence: 0.8,
      reason: '使用默认智能语义搜索'
    };
  }

  /**
   * 检查是否有高级搜索参数
   */
  private hasAdvancedParams(params: UnifiedSearchParams): boolean {
    return !!(
      params.category ||
      params.tags?.length ||
      params.difficulty ||
      params.date_from ||
      params.date_to ||
      params.sort_by
    );
  }

  /**
   * 检查是否有多字段搜索参数
   */
  private hasMultiFieldParams(params: UnifiedSearchParams): boolean {
    return !!(
      params.name_query ||
      params.content_query ||
      params.tag_query ||
      params.description_query
    );
  }

  /**
   * 分析查询内容复杂度
   */
  private analyzeQueryComplexity(query: string): {
    isNaturalLanguage: boolean;
    isSimpleKeyword: boolean;
    complexity: number;
  } {
    const lowerQuery = query.toLowerCase().trim();
    
    // 扩展的自然语言指标（中英文）
    const naturalLanguageIndicators = [
      // 中文自然语言指标
      /^(请|帮|想|需要|希望|能|可以|如何|怎么|什么|为什么|哪个|求)/,
      /^(写|创建|生成|制作|设计|开发|构建|编写)/,
      /^(分析|检查|优化|改进|评估|审查|总结)/,
      /(怎么|如何|什么|为什么|哪些|哪个|多少|何时|在哪)/,
      /(帮我|给我|为我|让我|教我|告诉我)/,
      // 英文自然语言指标
      /^(help|write|create|generate|make|design|develop|build)/,
      /^(analyze|check|optimize|improve|evaluate|review|summarize)/,
      /(how|what|why|which|when|where|who)/,
      /(help me|give me|tell me|show me|teach me)/,
      // 复杂句式指标
      /[，。！？,;.!?]/, // 包含标点符号
      /\s+/g, // 包含空格
      /.{15,}/, // 长查询（15字符以上）
    ];

    const nlScore = naturalLanguageIndicators.reduce((score, pattern) => {
      return score + (pattern.test(lowerQuery) ? 0.15 : 0);
    }, 0);

    // 简单关键词指标（更严格的判断）
    const isSimpleKeyword = (
      lowerQuery.length <= 8 &&
      !lowerQuery.includes(' ') &&
      !/[，。！？,;.!?]/.test(lowerQuery) &&
      !/^(请|帮|想|需要|希望|能|可以|如何|怎么|什么|为什么|哪个|help|write|create|how|what|why)/.test(lowerQuery)
    );

    // 调整复杂度计算
    let complexity = Math.min(1.0, nlScore);
    
    // 长度奖励（适当增加长查询的复杂度）
    if (lowerQuery.length > 10) {
      complexity += 0.1;
    }
    
    // 中文查询奖励（中文往往更倾向于自然语言）
    if (/[\u4e00-\u9fa5]/.test(lowerQuery)) {
      complexity += 0.1;
    }

    return {
      isNaturalLanguage: complexity > 0.3, // 降低阈值，更容易识别为自然语言
      isSimpleKeyword,
      complexity: Math.min(1.0, complexity)
    };
  }

  /**
   * 路由到相应的搜索引擎
   */
  private async routeToSearchEngine(
    mode: SearchMode, 
    params: UnifiedSearchParams, 
    context: ToolContext
  ): Promise<ToolResult> {
    
    switch (mode) {
      case 'semantic':
        return await this.executeSemanticSearch(params, context);
        
      case 'advanced':
        return await this.executeAdvancedSearch(params, context);
        
      case 'intelligent':
        return await this.executeIntelligentSearch(params, context);
        
      case 'basic':
        return await this.executeBasicSearch(params, context);
        
      default:
        // 默认使用语义搜索
        return await this.executeSemanticSearch(params, context);
    }
  }

  /**
   * 执行语义搜索
   */
  private async executeSemanticSearch(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    const semanticParams = {
      query: params.query,
      max_results: params.max_results || 5
    };
    
    return await optimizedSemanticSearchTool.execute(semanticParams, context);
  }

  /**
   * 执行高级搜索
   */
  private async executeAdvancedSearch(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    // 如果有多字段参数，使用多字段搜索
    if (this.hasMultiFieldParams(params)) {
      const multiFieldParams = {
        name_query: params.name_query,
        content_query: params.content_query,
        tag_query: params.tag_query,
        description_query: params.description_query,
        match_mode: 'any',
        limit: params.max_results || 10
      };
      
      return await multiFieldSearchTool.execute(multiFieldParams, context);
    }
    
    // 否则使用高级搜索
    const advancedParams = {
      query: params.query,
      filters: {
        category: params.category,
        tags: params.tags,
        difficulty: params.difficulty,
        date_from: params.date_from,
        date_to: params.date_to,
        is_public: params.include_public
      },
      sort_by: params.sort_by || 'relevance',
      limit: params.max_results || 10
    };
    
    return await advancedSearchTool.execute(advancedParams, context);
  }

  /**
   * 执行智能搜索
   */
  private async executeIntelligentSearch(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    const intelligentParams = {
      context: params.context || params.query,
      task_type: params.task_type,
      preferences: params.preferences || {}
    };
    
    return await intelligentPromptSelectionTool.execute(intelligentParams, context);
  }

  /**
   * 执行基础搜索
   */
  private async executeBasicSearch(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    try {
      const storage = this.getStorage();
      const results = await storage.searchPrompts(
        params.query, 
        context.userId, 
        params.include_public !== false
      );
      
      const limitedResults = Array.isArray(results) ? 
        results.slice(0, params.max_results || 10) : [];
      
      return {
        success: true,
        data: {
          results: limitedResults,
          total: limitedResults.length,
          query: params.query,
          mode: 'basic'
        },
        message: `基础搜索找到 ${limitedResults.length} 个结果`
      };
    } catch (error) {
      return {
        success: false,
        message: '基础搜索失败'
      };
    }
  }

  /**
   * 增强搜索结果信息
   */
  private enhanceSearchResult(result: ToolResult, metadata: any): ToolResult {
    if (!result.success) {
      return result;
    }

    return {
      ...result,
      data: {
        ...result.data,
        search_metadata: {
          ...result.data?.search_metadata,
          unified_search: {
            detected_mode: metadata.detectedMode,
            selected_mode: metadata.selectedMode,
            confidence: metadata.confidence,
            reason: metadata.reason,
            execution_time_ms: Math.round(metadata.executionTime)
          }
        }
      },
      message: `${result.message} (使用${this.getModeDisplayName(metadata.selectedMode)})`
    };
  }

  /**
   * 获取模式显示名称
   */
  private getModeDisplayName(mode: SearchMode): string {
    const modeNames = {
      semantic: '智能语义搜索',
      advanced: '高级搜索',
      intelligent: '智能推荐',
      basic: '基础搜索',
      auto: '自动选择'
    };
    
    return modeNames[mode] || '未知模式';
  }
}

// 创建工具实例
export const unifiedSearchTool = new UnifiedSearchTool();

// 工具定义导出
export const unifiedSearchToolDef = unifiedSearchTool.getToolDefinition();

// 处理函数导出
export async function handleUnifiedSearch(
  params: any,
  context?: { userId?: string; requestId?: string; userAgent?: string }
): Promise<any> {
  const toolContext = {
    userId: context?.userId,
    requestId: context?.requestId || `unified_search_${Date.now()}`,
    timestamp: Date.now(),
    userAgent: context?.userAgent
  };

  const result = await unifiedSearchTool.execute(params, toolContext);
  
  if (result.success) {
    return {
      content: {
        type: 'text',
        text: result.data?.conversation_display || JSON.stringify(result.data, null, 2)
      },
      metadata: result.data?.search_metadata
    };
  } else {
    throw new Error(result.message || '统一搜索失败');
  }
}