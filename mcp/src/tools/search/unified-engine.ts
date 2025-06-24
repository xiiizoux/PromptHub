/**
 * 🔍 统一搜索引擎 - MCP搜索功能整合
 * 集成所有搜索算法，提供统一的搜索入口
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';
import { searchCache, CacheKeys } from './cache.js';
import { searchPerformanceMonitor } from './performance-monitor.js';

// 搜索结果接口
interface SearchResult {
  prompt: Prompt;
  score: number;
  source: string; // 搜索来源：semantic、conversational、advanced等
  confidence: number;
  reasons: string[];
  metadata?: any;
}

// 搜索配置接口
interface SearchConfig {
  algorithm: 'semantic' | 'keyword' | 'hybrid' | 'smart';
  maxResults: number;
  minConfidence: number;
  includeReasons: boolean;
  enableCache: boolean;
  sortBy: 'relevance' | 'confidence' | 'popularity' | 'date';
}

/**
 * 统一搜索引擎工具类
 */
export class UnifiedSearchEngine extends BaseMCPTool {
  readonly name = 'unified_search';
  readonly description = '🔍 统一搜索引擎 - 智能整合多种搜索算法，提供最优搜索体验';

  // 静态缓存，在所有实例间共享
  private static searchCache = new Map<string, {
    results: SearchResult[];
    timestamp: number;
    config: SearchConfig;
  }>();

  // 缓存清理定时器
  private static cacheCleanupTimer: NodeJS.Timeout | null = null;

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索查询，支持自然语言描述，如："写商务邮件"、"代码分析工具"',
          required: true,
        } as ToolParameter,
        algorithm: {
          type: 'string',
          description: '搜索算法：semantic（语义）、keyword（关键词）、hybrid（混合）、smart（智能自适应）',
          required: false,
        } as ToolParameter,
        context: {
          type: 'string',
          description: '使用场景上下文，帮助优化搜索结果',
          required: false,
        } as ToolParameter,
        filters: {
          type: 'object',
          description: '搜索过滤条件：{category, tags, difficulty, models}',
          required: false,
        } as ToolParameter,
        max_results: {
          type: 'number',
          description: '最大结果数量，默认8',
          required: false,
        } as ToolParameter,
        min_confidence: {
          type: 'number',
          description: '最小置信度阈值（0-1），默认0.6',
          required: false,
        } as ToolParameter,
        sort_by: {
          type: 'string',
          description: '排序方式：relevance（相关性）、confidence（置信度）、popularity（热门度）、date（日期）',
          required: false,
        } as ToolParameter,
        enable_cache: {
          type: 'boolean',
          description: '是否启用缓存，默认true',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['query']);

    const {
      query,
      algorithm = 'smart',
      context: searchContext = '',
      filters = {},
      max_results = 8,
      min_confidence = 0.6,
      sort_by = 'relevance',
      enable_cache = true
    } = params;

    // 构建搜索配置
    const config: SearchConfig = {
      algorithm: algorithm as any,
      maxResults: max_results,
      minConfidence: min_confidence,
      includeReasons: true,
      enableCache: enable_cache,
      sortBy: sort_by as any
    };

    this.logExecution('统一搜索', context, {
      query: query.substring(0, 50),
      algorithm,
      maxResults: max_results
    });

    // 开始性能监控
    const timer = searchPerformanceMonitor.startSearch(query, algorithm, context.userId, filters);

    try {
      // 检查增强缓存
      if (enable_cache) {
        const cacheKey = CacheKeys.searchResults(query, { algorithm, filters, max_results, min_confidence });
        const cached = await searchCache.get<SearchResult[]>(cacheKey);

        if (cached) {
          timer.end(cached.length, true, true);

          // 格式化缓存结果
          const formattedOutput = this.formatForConversationalDisplay(cached, query);

          return {
            success: true,
            data: {
              results: cached,
              conversation_display: formattedOutput,
              from_cache: true,
              search_config: config,
              cache_key: cacheKey,
              performance: { cached: true, response_time: 0 }
            },
            message: `从缓存获取 ${cached.length} 个搜索结果`
          };
        }
      }

      // 执行搜索
      const searchResults = await this.performUnifiedSearch(query, searchContext, filters, config, context.userId);

      // 缓存结果
      if (enable_cache && searchResults.length > 0) {
        const cacheKey = CacheKeys.searchResults(query, { algorithm, filters, max_results, min_confidence });
        await searchCache.set(cacheKey, searchResults, 300000, { // 5分钟缓存
          algorithm,
          resultCount: searchResults.length,
          timestamp: Date.now()
        });
      }

      // 结束性能监控
      timer.end(searchResults.length, false, true);

      // 格式化搜索结果
      const formattedOutput = this.formatForConversationalDisplay(searchResults, query);
      const suggestions = this.generateSearchSuggestions(searchResults, query);

      return {
        success: true,
        data: {
          results: searchResults,
          conversation_display: formattedOutput,
          from_cache: false,
          search_config: config,
          performance: this.generatePerformanceReport(searchResults),
          suggestions,
          cache_stats: searchCache.getStats()
        },
        message: `🎯 统一搜索完成，为您找到 ${searchResults.length} 个相关的提示词`
      };

    } catch (error) {
      // 记录错误
      timer.end(0, false, false, error.message);

      return {
        success: false,
        message: `搜索失败：${error.message}，请尝试简化搜索条件`
      };
    }
  }

  /**
   * 统一搜索执行引擎
   */
  private async performUnifiedSearch(
    query: string, 
    context: string, 
    filters: any, 
    config: SearchConfig,
    userId?: string
  ): Promise<SearchResult[]> {
    const storage = this.getStorage();
    const allResults: SearchResult[] = [];

    // 根据算法选择搜索策略
    switch (config.algorithm) {
      case 'semantic':
        allResults.push(...await this.performSemanticSearch(query, context, userId));
        break;
      case 'keyword':
        allResults.push(...await this.performKeywordSearch(query, userId));
        break;
      case 'hybrid':
        // 混合搜索：结合语义和关键词
        const semanticResults = await this.performSemanticSearch(query, context, userId);
        const keywordResults = await this.performKeywordSearch(query, userId);
        allResults.push(...semanticResults, ...keywordResults);
        break;
      case 'smart':
      default:
        // 智能自适应搜索：根据查询类型自动选择最佳算法
        allResults.push(...await this.performSmartAdaptiveSearch(query, context, userId));
        break;
    }

    // 应用过滤器
    const filteredResults = this.applyFilters(allResults, filters);

    // 去重和评分
    const deduplicatedResults = this.deduplicateAndScore(filteredResults);

    // 排序
    const sortedResults = this.sortResults(deduplicatedResults, config.sortBy);

    // 应用置信度阈值和数量限制
    return sortedResults
      .filter(result => result.confidence >= config.minConfidence)
      .slice(0, config.maxResults);
  }

  /**
   * 语义搜索算法
   */
  private async performSemanticSearch(query: string, context: string, userId?: string): Promise<SearchResult[]> {
    const storage = this.getStorage();
    
    try {
      // 意图分析
      const intent = this.analyzeSearchIntent(query, context);
      
      // 基础搜索
      const prompts = await storage.searchPrompts(query, userId);
      const promptArray = Array.isArray(prompts) ? prompts : [];
      
      return promptArray.map(prompt => ({
        prompt,
        score: this.calculateSemanticScore(prompt, query, intent),
        source: 'semantic',
        confidence: this.calculateSemanticConfidence(prompt, query),
        reasons: this.generateSemanticReasons(prompt, query, intent),
        metadata: { intent, algorithm: 'semantic' }
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * 关键词搜索算法
   */
  private async performKeywordSearch(query: string, userId?: string): Promise<SearchResult[]> {
    const storage = this.getStorage();
    
    try {
      const prompts = await storage.searchPrompts(query, userId);
      const promptArray = Array.isArray(prompts) ? prompts : [];
      
      return promptArray.map(prompt => ({
        prompt,
        score: this.calculateKeywordScore(prompt, query),
        source: 'keyword',
        confidence: this.calculateKeywordConfidence(prompt, query),
        reasons: this.generateKeywordReasons(prompt, query),
        metadata: { algorithm: 'keyword' }
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * 智能自适应搜索算法
   */
  private async performSmartAdaptiveSearch(query: string, context: string, userId?: string): Promise<SearchResult[]> {
    // 分析查询类型，选择最佳算法组合
    const queryType = this.analyzeQueryType(query);
    
    let results: SearchResult[] = [];

    if (queryType.isNaturalLanguage) {
      // 自然语言查询优先使用语义搜索
      results.push(...await this.performSemanticSearch(query, context, userId));
    }
    
    if (queryType.hasKeywords) {
      // 关键词查询补充关键词搜索
      results.push(...await this.performKeywordSearch(query, userId));
    }

    // 如果结果不足，尝试扩展搜索
    if (results.length < 3) {
      results.push(...await this.performExpandedSearch(query, userId));
    }

    return results;
  }

  /**
   * 扩展搜索 - 当结果不足时的回退策略
   */
  private async performExpandedSearch(query: string, userId?: string): Promise<SearchResult[]> {
    const storage = this.getStorage();
    
    try {
      // 获取所有提示词并进行模糊匹配
      const allPrompts = await storage.getPrompts({ userId, pageSize: 50 });
      const promptArray = Array.isArray(allPrompts) ? allPrompts : allPrompts.data || [];
      
      return promptArray
        .map(prompt => ({
          prompt,
          score: this.calculateFuzzyScore(prompt, query),
          source: 'expanded',
          confidence: this.calculateFuzzyConfidence(prompt, query),
          reasons: ['扩展搜索匹配'],
          metadata: { algorithm: 'expanded' }
        }))
        .filter(result => result.confidence > 0.3);
    } catch (error) {
      return [];
    }
  }

  /**
   * 查询类型分析
   */
  private analyzeQueryType(query: string) {
    const words = query.toLowerCase().split(/\s+/);
    
    return {
      isNaturalLanguage: words.length > 3 || /[我想需要希望帮助如何]/.test(query),
      hasKeywords: words.some(word => word.length > 2),
      isSpecific: /[具体特定专门]/.test(query),
      isGeneral: words.length <= 2
    };
  }

  /**
   * 搜索意图分析
   */
  private analyzeSearchIntent(query: string, context: string) {
    return {
      action: this.extractAction(query),
      domain: this.extractDomain(query, context),
      style: this.extractStyle(query),
      urgency: this.extractUrgency(query, context),
      complexity: this.extractComplexity(query)
    };
  }

  private extractAction(query: string): string {
    const actions = {
      '写|编写|创建|生成': 'create',
      '分析|检查|评估|审查': 'analyze',
      '翻译|转换|改写': 'transform',
      '总结|概括|提炼': 'summarize',
      '优化|改进|提升': 'optimize'
    };
    
    for (const [pattern, action] of Object.entries(actions)) {
      if (new RegExp(pattern).test(query)) return action;
    }
    return 'general';
  }

  private extractDomain(query: string, context: string): string {
    const combined = query + ' ' + context;
    const domains = {
      '商务|商业|业务|邮件|会议': 'business',
      '技术|代码|程序|开发|IT': 'tech',
      '学术|论文|研究|科学': 'academic',
      '创意|设计|艺术|文案': 'creative',
      '法律|合同|条款': 'legal'
    };
    
    for (const [pattern, domain] of Object.entries(domains)) {
      if (new RegExp(pattern).test(combined)) return domain;
    }
    return 'general';
  }

  private extractStyle(query: string): string {
    if (/正式|专业|商务/.test(query)) return 'formal';
    if (/随意|轻松|友好/.test(query)) return 'casual';
    if (/技术|专业|详细/.test(query)) return 'technical';
    if (/创意|有趣|生动/.test(query)) return 'creative';
    return 'neutral';
  }

  private extractUrgency(query: string, context: string): string {
    const combined = query + ' ' + context;
    if (/紧急|急|立即|马上/.test(combined)) return 'high';
    if (/今天|尽快|很快/.test(combined)) return 'medium';
    return 'low';
  }

  private extractComplexity(query: string): string {
    if (query.length < 10) return 'simple';
    if (query.length > 50 || /复杂|详细|深入|全面/.test(query)) return 'complex';
    return 'medium';
  }

  /**
   * 语义评分算法
   */
  private calculateSemanticScore(prompt: Prompt, query: string, intent: any): number {
    let score = 0;
    
    // 标题匹配
    if (prompt.name) {
      score += this.textSimilarity(prompt.name, query) * 0.4;
    }
    
    // 描述匹配
    if (prompt.description) {
      score += this.textSimilarity(prompt.description, query) * 0.3;
    }
    
    // 标签匹配
    if (prompt.tags?.length) {
      const tagText = prompt.tags.join(' ');
      score += this.textSimilarity(tagText, query) * 0.2;
    }
    
    // 意图匹配
    if (intent.domain && prompt.category === intent.domain) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 关键词评分算法
   */
  private calculateKeywordScore(prompt: Prompt, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    const promptText = `${prompt.name} ${prompt.description} ${prompt.tags?.join(' ')}`.toLowerCase();
    
    const matches = queryWords.filter(word => promptText.includes(word)).length;
    return matches / Math.max(queryWords.length, 1);
  }

  /**
   * 模糊评分算法
   */
  private calculateFuzzyScore(prompt: Prompt, query: string): number {
    const promptText = `${prompt.name} ${prompt.description}`.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // 简单的包含关系评分
    if (promptText.includes(queryLower)) return 0.8;
    
    // 部分匹配评分
    const queryWords = queryLower.split(/\s+/);
    const matches = queryWords.filter(word => promptText.includes(word)).length;
    
    return (matches / queryWords.length) * 0.6;
  }

  /**
   * 文本相似度计算
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = new Set([...words1, ...words2]);
    
    return intersection.length / union.size;
  }

  /**
   * 置信度计算
   */
  private calculateSemanticConfidence(prompt: Prompt, query: string): number {
    // 基于多个因素计算置信度
    let confidence = 0.5;
    
    if (prompt.name && prompt.name.toLowerCase().includes(query.toLowerCase())) {
      confidence += 0.3;
    }
    
    if (prompt.description && prompt.description.toLowerCase().includes(query.toLowerCase())) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private calculateKeywordConfidence(prompt: Prompt, query: string): number {
    const score = this.calculateKeywordScore(prompt, query);
    return score * 0.9; // 关键词搜索置信度稍低
  }

  private calculateFuzzyConfidence(prompt: Prompt, query: string): number {
    const score = this.calculateFuzzyScore(prompt, query);
    return score * 0.7; // 模糊搜索置信度更低
  }

  /**
   * 生成搜索理由
   */
  private generateSemanticReasons(prompt: Prompt, query: string, intent: any): string[] {
    const reasons: string[] = [];
    
    if (prompt.name?.toLowerCase().includes(query.toLowerCase())) {
      reasons.push('标题高度匹配');
    }
    
    if (prompt.description?.toLowerCase().includes(query.toLowerCase())) {
      reasons.push('描述内容相关');
    }
    
    if (intent.domain && prompt.category === intent.domain) {
      reasons.push('领域完全匹配');
    }
    
    if (prompt.tags?.some(tag => query.toLowerCase().includes(tag.toLowerCase()))) {
      reasons.push('标签匹配');
    }
    
    return reasons.length > 0 ? reasons : ['语义相似度匹配'];
  }

  private generateKeywordReasons(prompt: Prompt, query: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const reasons: string[] = [];
    
    queryWords.forEach(word => {
      if (prompt.name?.toLowerCase().includes(word)) {
        reasons.push(`标题包含"${word}"`);
      }
      if (prompt.description?.toLowerCase().includes(word)) {
        reasons.push(`描述包含"${word}"`);
      }
    });
    
    return reasons.length > 0 ? reasons : ['关键词匹配'];
  }

  /**
   * 应用过滤器
   */
  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      // 分类过滤
      if (filters.category && result.prompt.category !== filters.category) {
        return false;
      }
      
      // 标签过滤
      if (filters.tags && Array.isArray(filters.tags)) {
        const hasRequiredTag = filters.tags.some((tag: string) => 
          result.prompt.tags?.includes(tag)
        );
        if (!hasRequiredTag) return false;
      }
      
      // 难度过滤
      if (filters.difficulty && result.prompt.difficulty !== filters.difficulty) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 去重和重新评分
   */
  private deduplicateAndScore(results: SearchResult[]): SearchResult[] {
    const seenPrompts = new Map<string, SearchResult>();
    
    results.forEach(result => {
      const key = result.prompt.id || result.prompt.name;
      if (!key) return;
      
      const existing = seenPrompts.get(key);
      if (!existing || result.confidence > existing.confidence) {
        // 如果是新结果或者置信度更高，则保留
        seenPrompts.set(key, {
          ...result,
          score: Math.max(result.score, existing?.score || 0),
          confidence: Math.max(result.confidence, existing?.confidence || 0),
          reasons: [...new Set([...result.reasons, ...(existing?.reasons || [])])]
        });
      }
    });
    
    return Array.from(seenPrompts.values());
  }

  /**
   * 结果排序
   */
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    switch (sortBy) {
      case 'confidence':
        return results.sort((a, b) => b.confidence - a.confidence);
      case 'popularity':
        // 基于分类热门度的简化排序
        return results.sort((a, b) => {
          const aPopularity = this.getPopularityScore(a.prompt);
          const bPopularity = this.getPopularityScore(b.prompt);
          return bPopularity - aPopularity;
        });
      case 'date':
        return results.sort((a, b) => {
          const aDate = new Date(a.prompt.updated_at || a.prompt.created_at || 0);
          const bDate = new Date(b.prompt.updated_at || b.prompt.created_at || 0);
          return bDate.getTime() - aDate.getTime();
        });
      case 'relevance':
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  private getPopularityScore(prompt: Prompt): number {
    // 简化的热门度评分
    let score = 0;
    if (prompt.category === 'business') score += 0.3;
    if (prompt.category === 'tech') score += 0.2;
    if (prompt.tags?.length && prompt.tags.length > 2) score += 0.2;
    if (prompt.is_public) score += 0.1;
    return score;
  }

  /**
   * 缓存管理
   */
  private getCachedResults(query: string, config: SearchConfig) {
    const cacheKey = this.generateCacheKey(query, config);
    const cached = UnifiedSearchEngine.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5分钟缓存
      return cached;
    }
    
    return null;
  }

  private cacheResults(query: string, results: SearchResult[], config: SearchConfig) {
    const cacheKey = this.generateCacheKey(query, config);
    UnifiedSearchEngine.searchCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
      config
    });
  }

  private generateCacheKey(query: string, config: SearchConfig): string {
    return `${query}_${config.algorithm}_${config.maxResults}_${config.minConfidence}`;
  }

  private startCacheCleanup() {
    if (UnifiedSearchEngine.cacheCleanupTimer) return;
    
    UnifiedSearchEngine.cacheCleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, cache] of UnifiedSearchEngine.searchCache.entries()) {
        if (now - cache.timestamp > 900000) { // 15分钟过期
          UnifiedSearchEngine.searchCache.delete(key);
        }
      }
    }, 300000); // 每5分钟清理一次
  }

  /**
   * 性能报告生成
   */
  private generatePerformanceReport(results: SearchResult[]) {
    const sourceStats = results.reduce((acc, result) => {
      acc[result.source] = (acc[result.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
      : 0;

    return {
      total_results: results.length,
      source_distribution: sourceStats,
      average_confidence: Math.round(avgConfidence * 100) / 100,
      top_confidence: results.length > 0 ? Math.round(results[0].confidence * 100) / 100 : 0
    };
  }

  /**
   * 搜索建议生成
   */
  private generateSearchSuggestions(results: SearchResult[], query: string): string[] {
    const suggestions: string[] = [];
    
    if (results.length === 0) {
      suggestions.push('尝试使用更简单的关键词');
      suggestions.push('检查拼写或使用同义词');
      suggestions.push('浏览分类查看可用的提示词');
    } else if (results.length < 3) {
      suggestions.push('结果较少，尝试扩大搜索范围');
      suggestions.push('使用更通用的关键词');
    } else if (results.length > 10) {
      suggestions.push('结果较多，添加更具体的过滤条件');
      suggestions.push('使用更精确的关键词');
    }
    
    // 基于搜索意图的建议
    if (query.length > 20) {
      suggestions.push('简化搜索查询可能获得更好的结果');
    }
    
    return suggestions;
  }

  /**
   * 格式化搜索结果为对话式显示
   */
  private formatForConversationalDisplay(results: SearchResult[], query: string): string {
    if (results.length === 0) {
      return `😔 抱歉，没有找到与"${query}"相关的提示词。\n\n🔍 建议：\n• 尝试使用更简单的关键词\n• 检查是否有拼写错误\n• 或者浏览我们的分类目录`;
    }

    let output = `🎯 为您找到 ${results.length} 个与"${query}"相关的提示词：\n\n`;

    results.forEach((result, index) => {
      const emoji = this.getEmojiForCategory(result.prompt.category);
      const relevanceScore = Math.round((result.confidence || 0.5) * 100);
      
      // 核心：标题、描述、内容是必要的
      output += `**${index + 1}. ${emoji} ${result.prompt.name}**\n`;
      output += `📝 **描述：** ${result.prompt.description || '暂无描述'}\n`;
      
      // 最重要：显示实际内容
      const content = this.extractContentPreview(result.prompt);
      if (content && content.trim()) {
        output += `📄 **内容：**\n\`\`\`\n${content}\n\`\`\`\n`;
      }
      
      // 简化其他信息：相关度和匹配原因
      const matchReason = this.generateMatchReason(result, query);
      output += `🎯 相关度 ${relevanceScore}% | ${matchReason}\n`;
      
      // 标签信息（可选）
      if (result.prompt.tags && result.prompt.tags.length > 0) {
        output += `🏷️ ${result.prompt.tags.slice(0, 3).join(' • ')}\n`;
      }
      
      if (index < results.length - 1) {
        output += '\n---\n\n';
      }
    });

    output += `\n\n💬 **使用说明：**\n`;
    output += `上述提示词按相关度排序，每个都包含了完整的内容预览。\n`;
    output += `您可以直接使用这些内容，或者说"我要第X个提示词"获取更多详细信息。\n\n`;
    
    output += `🔄 **需要更多结果？** 尝试使用不同的搜索关键词或浏览相关分类。`;

    return output;
  }

  /**
   * 为分类获取对应的emoji
   */
  private getEmojiForCategory(category?: string): string {
    const categoryEmojis: Record<string, string> = {
      '通用': '🔧',
      '学术': '🎓',
      '职业': '💼',
      '文案': '✍️',
      '设计': '🎨',
      '绘画': '🖌️',
      '教育': '📚',
      '情感': '💝',
      '娱乐': '🎮',
      '游戏': '🎯',
      '生活': '🏠',
      '商业': '💰',
      '办公': '📊',
      '编程': '💻',
      '翻译': '🌐',
      '视频': '📹',
      '播客': '🎙️',
      '音乐': '🎵',
      '健康': '🏥',
      '科技': '🔬',
      'business': '💼',
      'tech': '💻',
      'academic': '🎓',
      'creative': '🎨',
      'legal': '⚖️',
      'health': '🏥',
      'education': '📚'
    };
    
    return categoryEmojis[category || ''] || '📝';
  }

  /**
   * 提取内容预览
   */
  private extractContentPreview(prompt: Prompt): string {
    let content = '';
    
    // 从messages中提取内容
    if (prompt.messages && Array.isArray(prompt.messages)) {
      content = prompt.messages
        .map(msg => typeof msg === 'string' ? msg : msg.content || '')
        .join('\n\n');
    } else if (typeof prompt.messages === 'string') {
      content = prompt.messages;
    }
    
    // content字段已从Prompt接口中移除，内容存储在messages字段中
    
    // 限制预览长度
    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }
    
    return content;
  }

  /**
   * 生成匹配原因
   */
  private generateMatchReason(result: SearchResult, query: string): string {
    // 如果已有原因，使用现有的
    if (result.reasons && result.reasons.length > 0) {
      return result.reasons[0];
    }

    // 生成默认匹配原因
    const prompt = result.prompt;
    const queryLower = query.toLowerCase();
    
    if (prompt.name && prompt.name.toLowerCase().includes(queryLower)) {
      return '标题高度匹配';
    }
    
    if (prompt.description && prompt.description.toLowerCase().includes(queryLower)) {
      return '描述内容相关';
    }
    
    if (prompt.category && prompt.category.toLowerCase().includes(queryLower)) {
      return '分类匹配';
    }
    
    if (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      return '标签匹配';
    }
    
    return `${result.source || '智能'}搜索匹配`;
  }
}

// 创建工具实例
export const unifiedSearchEngine = new UnifiedSearchEngine();

// 向后兼容的函数导出
export async function handleUnifiedSearch(params: any, userId?: string) {
  return unifiedSearchEngine.handleExecution(params, userId);
}

// 工具定义导出
export const unifiedSearchEngineToolDef = unifiedSearchEngine.getToolDefinition();

/**
 * 🔍 快速搜索工具 - 简化版本用于日常使用
 */
export class QuickSearchTool extends BaseMCPTool {
  readonly name = 'search';
  readonly description = '🔍 快速搜索 - 简洁的搜索入口，自动选择最佳搜索策略';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        q: {
          type: 'string',
          description: '搜索关键词或描述',
          required: true,
        } as ToolParameter,
        limit: {
          type: 'number',
          description: '结果数量限制，默认5',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['q']);

    const { q: query, limit = 5 } = params;

    this.logExecution('快速搜索', context, { query: query.substring(0, 30) });

    // 直接调用统一搜索引擎
    const searchParams = {
      query,
      algorithm: 'smart',
      max_results: limit,
      min_confidence: 0.5,
      enable_cache: true
    };

    try {
      const result = await unifiedSearchEngine.execute(searchParams, context);
      
      if (result.success && result.data?.results) {
        const formattedResults = this.formatQuickResults(result.data.results, query);
        
        return {
          success: true,
          data: {
            results: result.data.results,
            count: result.data.results.length,
            formatted: formattedResults
          },
          message: formattedResults
        };
      }

      return { success: false, message: '搜索未找到结果' };

    } catch (error) {
      return { success: false, message: '搜索失败' };
    }
  }

  private formatQuickResults(results: SearchResult[], query: string): string {
    if (results.length === 0) {
      return `🔍 未找到"${query}"的相关结果\n💡 建议：尝试其他关键词或浏览分类`;
    }

    let output = `🎯 "${query}" 搜索结果 (${results.length}个):\n\n`;

    results.forEach((result, index) => {
      const confidence = Math.round(result.confidence * 100);
      output += `${index + 1}. **${result.prompt.name}**\n`;
      output += `   📝 ${result.prompt.description?.substring(0, 80) || '暂无描述'}...\n`;
      output += `   🎯 匹配度: ${confidence}% | 📂 ${result.prompt.category || '通用'}\n\n`;
    });

    output += `💡 使用方式：选择对应编号的提示词`;
    return output;
  }
}

// 创建快速搜索工具实例
export const quickSearchTool = new QuickSearchTool();

// 快速搜索的向后兼容函数
export async function handleQuickSearch(params: any, userId?: string) {
  return quickSearchTool.handleExecution(params, userId);
}

// 快速搜索工具定义
export const quickSearchToolDef = quickSearchTool.getToolDefinition(); 