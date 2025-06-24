/**
 * 搜索性能监控系统
 * 监控搜索性能、分析搜索模式、提供优化建议
 */

import logger from '../../utils/logger.js';

export interface SearchMetrics {
  query: string;
  algorithm: string;
  startTime: number;
  endTime: number;
  duration: number;
  resultCount: number;
  cacheHit: boolean;
  userId?: string;
  filters?: any;
  success: boolean;
  errorMessage?: string;
}

export interface PerformanceStats {
  totalSearches: number;
  averageResponseTime: number;
  cacheHitRate: number;
  successRate: number;
  popularQueries: Array<{ query: string; count: number; avgTime: number }>;
  algorithmPerformance: Map<string, { count: number; avgTime: number; successRate: number }>;
  slowQueries: Array<{ query: string; duration: number; timestamp: number }>;
  errorPatterns: Array<{ pattern: string; count: number; lastOccurrence: number }>;
}

export interface OptimizationSuggestion {
  type: 'cache' | 'algorithm' | 'query' | 'index';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
}

/**
 * 搜索性能监控器
 */
export class SearchPerformanceMonitor {
  private metrics: SearchMetrics[] = [];
  private maxMetricsHistory = 10000; // 保留最近10000条记录
  private queryPatterns = new Map<string, number>();
  private algorithmStats = new Map<string, { totalTime: number; count: number; errors: number }>();
  private slowQueryThreshold = 1000; // 1秒
  private errorPatterns = new Map<string, { count: number; lastOccurrence: number }>();

  /**
   * 记录搜索指标
   */
  recordSearch(metrics: SearchMetrics): void {
    try {
      // 添加到历史记录
      this.metrics.push(metrics);
      
      // 限制历史记录大小
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // 更新查询模式统计
      this.updateQueryPatterns(metrics.query);
      
      // 更新算法统计
      this.updateAlgorithmStats(metrics);
      
      // 检查慢查询
      if (metrics.duration > this.slowQueryThreshold) {
        this.recordSlowQuery(metrics);
      }
      
      // 记录错误模式
      if (!metrics.success && metrics.errorMessage) {
        this.recordErrorPattern(metrics.errorMessage);
      }

      // 记录到日志
      logger.debug('搜索性能记录', {
        query: metrics.query.substring(0, 50),
        algorithm: metrics.algorithm,
        duration: metrics.duration,
        resultCount: metrics.resultCount,
        cacheHit: metrics.cacheHit,
        success: metrics.success
      });

    } catch (error) {
      logger.error('记录搜索性能失败', { error: error.message });
    }
  }

  /**
   * 开始搜索计时
   */
  startSearch(query: string, algorithm: string, userId?: string, filters?: any): SearchTimer {
    return new SearchTimer(this, query, algorithm, userId, filters);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(timeRange?: { start: number; end: number }): PerformanceStats {
    const relevantMetrics = timeRange 
      ? this.metrics.filter(m => m.startTime >= timeRange.start && m.startTime <= timeRange.end)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const totalSearches = relevantMetrics.length;
    const successfulSearches = relevantMetrics.filter(m => m.success);
    const cacheHits = relevantMetrics.filter(m => m.cacheHit);
    
    const averageResponseTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0) / totalSearches;
    const cacheHitRate = cacheHits.length / totalSearches;
    const successRate = successfulSearches.length / totalSearches;

    return {
      totalSearches,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      popularQueries: this.getPopularQueries(relevantMetrics),
      algorithmPerformance: this.getAlgorithmPerformance(relevantMetrics),
      slowQueries: this.getSlowQueries(relevantMetrics),
      errorPatterns: this.getErrorPatterns()
    };
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const stats = this.getPerformanceStats();

    // 缓存命中率建议
    if (stats.cacheHitRate < 0.3) {
      suggestions.push({
        type: 'cache',
        priority: 'high',
        description: '缓存命中率较低，建议优化缓存策略',
        impact: '可提升响应速度50-80%',
        implementation: '增加缓存时间、预热热门查询、优化缓存键策略'
      });
    }

    // 响应时间建议
    if (stats.averageResponseTime > 500) {
      suggestions.push({
        type: 'algorithm',
        priority: 'high',
        description: '平均响应时间较长，建议优化搜索算法',
        impact: '可减少响应时间30-50%',
        implementation: '优化数据库查询、添加索引、使用更高效的搜索算法'
      });
    }

    // 成功率建议
    if (stats.successRate < 0.9) {
      suggestions.push({
        type: 'query',
        priority: 'medium',
        description: '搜索成功率较低，建议改进查询处理',
        impact: '可提升用户体验和搜索准确性',
        implementation: '添加查询验证、改进错误处理、提供搜索建议'
      });
    }

    // 慢查询建议
    if (stats.slowQueries.length > stats.totalSearches * 0.1) {
      suggestions.push({
        type: 'index',
        priority: 'medium',
        description: '慢查询较多，建议优化数据库索引',
        impact: '可显著提升查询性能',
        implementation: '分析慢查询模式、添加复合索引、优化查询语句'
      });
    }

    return suggestions;
  }

  /**
   * 获取搜索趋势分析
   */
  getSearchTrends(timeRange: { start: number; end: number }, interval: 'hour' | 'day' = 'hour'): Array<{
    timestamp: number;
    searchCount: number;
    averageResponseTime: number;
    cacheHitRate: number;
  }> {
    const relevantMetrics = this.metrics.filter(m => 
      m.startTime >= timeRange.start && m.startTime <= timeRange.end
    );

    const intervalMs = interval === 'hour' ? 3600000 : 86400000;
    const trends = new Map<number, {
      searches: SearchMetrics[];
      cacheHits: number;
    }>();

    // 按时间间隔分组
    for (const metric of relevantMetrics) {
      const intervalStart = Math.floor(metric.startTime / intervalMs) * intervalMs;
      
      if (!trends.has(intervalStart)) {
        trends.set(intervalStart, { searches: [], cacheHits: 0 });
      }
      
      const trend = trends.get(intervalStart)!;
      trend.searches.push(metric);
      if (metric.cacheHit) trend.cacheHits++;
    }

    // 转换为结果格式
    return Array.from(trends.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        searchCount: data.searches.length,
        averageResponseTime: data.searches.reduce((sum, m) => sum + m.duration, 0) / data.searches.length,
        cacheHitRate: data.cacheHits / data.searches.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 清理旧数据
   */
  cleanup(olderThan: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    this.metrics = this.metrics.filter(m => m.startTime > cutoff);
    
    // 清理错误模式
    for (const [pattern, data] of this.errorPatterns.entries()) {
      if (data.lastOccurrence < cutoff) {
        this.errorPatterns.delete(pattern);
      }
    }
    
    logger.info('清理搜索性能数据', { 
      remainingMetrics: this.metrics.length,
      cutoffTime: new Date(cutoff).toISOString()
    });
  }

  // 私有方法

  private updateQueryPatterns(query: string): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.queryPatterns.set(normalizedQuery, (this.queryPatterns.get(normalizedQuery) || 0) + 1);
  }

  private updateAlgorithmStats(metrics: SearchMetrics): void {
    const stats = this.algorithmStats.get(metrics.algorithm) || { totalTime: 0, count: 0, errors: 0 };
    stats.totalTime += metrics.duration;
    stats.count++;
    if (!metrics.success) stats.errors++;
    this.algorithmStats.set(metrics.algorithm, stats);
  }

  private recordSlowQuery(metrics: SearchMetrics): void {
    logger.warn('检测到慢查询', {
      query: metrics.query.substring(0, 100),
      algorithm: metrics.algorithm,
      duration: metrics.duration,
      resultCount: metrics.resultCount
    });
  }

  private recordErrorPattern(errorMessage: string): void {
    const pattern = this.extractErrorPattern(errorMessage);
    const existing = this.errorPatterns.get(pattern) || { count: 0, lastOccurrence: 0 };
    existing.count++;
    existing.lastOccurrence = Date.now();
    this.errorPatterns.set(pattern, existing);
  }

  private extractErrorPattern(errorMessage: string): string {
    // 简化错误模式提取
    return errorMessage.split(':')[0] || errorMessage.substring(0, 50);
  }

  private getPopularQueries(metrics: SearchMetrics[]): Array<{ query: string; count: number; avgTime: number }> {
    const queryStats = new Map<string, { count: number; totalTime: number }>();
    
    for (const metric of metrics) {
      const query = metric.query.toLowerCase().trim();
      const stats = queryStats.get(query) || { count: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += metric.duration;
      queryStats.set(query, stats);
    }

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getAlgorithmPerformance(metrics: SearchMetrics[]): Map<string, { count: number; avgTime: number; successRate: number }> {
    const algorithmStats = new Map<string, { count: number; totalTime: number; successes: number }>();
    
    for (const metric of metrics) {
      const stats = algorithmStats.get(metric.algorithm) || { count: 0, totalTime: 0, successes: 0 };
      stats.count++;
      stats.totalTime += metric.duration;
      if (metric.success) stats.successes++;
      algorithmStats.set(metric.algorithm, stats);
    }

    const result = new Map<string, { count: number; avgTime: number; successRate: number }>();
    for (const [algorithm, stats] of algorithmStats.entries()) {
      result.set(algorithm, {
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count * 100) / 100,
        successRate: Math.round(stats.successes / stats.count * 100) / 100
      });
    }

    return result;
  }

  private getSlowQueries(metrics: SearchMetrics[]): Array<{ query: string; duration: number; timestamp: number }> {
    return metrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .map(m => ({
        query: m.query.substring(0, 100),
        duration: m.duration,
        timestamp: m.startTime
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);
  }

  private getErrorPatterns(): Array<{ pattern: string; count: number; lastOccurrence: number }> {
    return Array.from(this.errorPatterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalSearches: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      successRate: 0,
      popularQueries: [],
      algorithmPerformance: new Map(),
      slowQueries: [],
      errorPatterns: []
    };
  }
}

/**
 * 搜索计时器
 */
export class SearchTimer {
  private startTime: number;
  
  constructor(
    private monitor: SearchPerformanceMonitor,
    private query: string,
    private algorithm: string,
    private userId?: string,
    private filters?: any
  ) {
    this.startTime = Date.now();
  }

  /**
   * 结束计时并记录结果
   */
  end(resultCount: number, cacheHit: boolean = false, success: boolean = true, errorMessage?: string): void {
    const endTime = Date.now();
    const metrics: SearchMetrics = {
      query: this.query,
      algorithm: this.algorithm,
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      resultCount,
      cacheHit,
      userId: this.userId,
      filters: this.filters,
      success,
      errorMessage
    };

    this.monitor.recordSearch(metrics);
  }
}

// 全局性能监控实例
export const searchPerformanceMonitor = new SearchPerformanceMonitor();
