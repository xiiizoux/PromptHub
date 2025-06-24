/**
 * 增强的搜索缓存系统
 * 提供多层缓存、智能预热、性能监控等功能
 */

import logger from '../../utils/logger.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
  metadata?: any;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
  averageAccessTime: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableStats: boolean;
  enablePrewarm: boolean;
}

/**
 * 增强的搜索缓存管理器
 */
export class EnhancedSearchCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    accessCount: 0
  };
  
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private prewarmQueue: string[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5分钟
      cleanupInterval: config.cleanupInterval || 60000, // 1分钟
      enableStats: config.enableStats !== false,
      enablePrewarm: config.enablePrewarm !== false
    };

    this.startCleanupTimer();
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // 检查是否过期
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.recordMiss();
        return null;
      }

      // 更新访问统计
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.recordHit(Date.now() - startTime);
      return entry.data;
      
    } catch (error) {
      logger.error('缓存获取失败', { key, error: error.message });
      this.recordMiss();
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, data: T, ttl?: number, metadata?: any): Promise<void> {
    try {
      // 检查缓存大小限制
      if (this.cache.size >= this.config.maxSize) {
        this.evictLeastUsed();
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        metadata
      };

      this.cache.set(key, entry);
      
    } catch (error) {
      logger.error('缓存设置失败', { key, error: error.message });
    }
  }

  /**
   * 获取或设置缓存（如果不存在则执行函数并缓存结果）
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number, 
    metadata?: any
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, ttl, metadata);
    
    return data;
  }

  /**
   * 批量获取缓存
   */
  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  /**
   * 批量设置缓存
   */
  async setBatch<T>(entries: Array<{ key: string; data: T; ttl?: number; metadata?: any }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.data, entry.ttl, entry.metadata);
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * 预热缓存
   */
  async prewarm(keys: string[], factory: (key: string) => Promise<any>): Promise<void> {
    if (!this.config.enablePrewarm) return;

    for (const key of keys) {
      if (!this.cache.has(key)) {
        try {
          const data = await factory(key);
          await this.set(key, data);
        } catch (error) {
          logger.warn('缓存预热失败', { key, error: error.message });
        }
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const averageAccessTime = this.stats.accessCount > 0 
      ? this.stats.totalAccessTime / this.stats.accessCount 
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      averageAccessTime: Math.round(averageAccessTime * 100) / 100
    };
  }

  /**
   * 获取热门缓存键
   */
  getHotKeys(limit: number = 10): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * 驱逐最少使用的缓存项
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastUsedCount || 
          (entry.accessCount === leastUsedCount && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        leastUsedCount = entry.accessCount;
        oldestAccess = entry.lastAccessed;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      logger.debug('驱逐缓存项', { key: leastUsedKey, accessCount: leastUsedCount });
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 记录缓存命中
   */
  private recordHit(accessTime: number): void {
    if (!this.config.enableStats) return;
    
    this.stats.hits++;
    this.stats.totalAccessTime += accessTime;
    this.stats.accessCount++;
  }

  /**
   * 记录缓存未命中
   */
  private recordMiss(): void {
    if (!this.config.enableStats) return;
    
    this.stats.misses++;
  }

  /**
   * 重置统计
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      accessCount: 0
    };
  }

  /**
   * 估算内存使用量（简化版本）
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // 字符串大小估算
      totalSize += JSON.stringify(entry.data).length * 2; // 数据大小估算
      totalSize += 100; // 元数据开销估算
    }
    
    return totalSize;
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
    this.resetStats();
  }
}

// 全局搜索缓存实例
export const searchCache = new EnhancedSearchCache({
  maxSize: 500,
  defaultTTL: 300000, // 5分钟
  cleanupInterval: 60000, // 1分钟
  enableStats: true,
  enablePrewarm: true
});

// 导出缓存键生成器
export const CacheKeys = {
  searchResults: (query: string, filters: any = {}) => 
    `search:${query}:${JSON.stringify(filters)}`,
  
  promptDetails: (id: string) => 
    `prompt:${id}`,
  
  userPrompts: (userId: string, page: number = 1) => 
    `user:${userId}:prompts:${page}`,
  
  categoryPrompts: (category: string, page: number = 1) => 
    `category:${category}:${page}`,
  
  popularPrompts: (timeframe: string = 'week') => 
    `popular:${timeframe}`,
  
  searchSuggestions: (query: string) => 
    `suggestions:${query}`
};
