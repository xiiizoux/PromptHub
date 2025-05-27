/**
 * 简单的内存缓存实现
 * 用于缓存频繁请求的数据，减少数据库和MCP服务器负载
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // 如果缓存项不存在，返回null
    if (!item) {
      return null;
    }
    
    // 如果缓存项已过期，删除并返回null
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttlSeconds 缓存生存时间（秒）
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }
  
  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存项数量
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * 执行缓存清理，删除已过期的项
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
        this.cache.delete(key);
    });
  }
  
  /**
   * 获取或设置缓存
   * 如果缓存存在且未过期，返回缓存的数据
   * 否则执行回调函数获取数据，并将结果缓存后返回
   * 
   * @param key 缓存键
   * @param fetchFn 获取数据的回调函数
   * @param ttlSeconds 缓存生存时间（秒）
   * @returns 缓存的数据或回调函数的返回值
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    // 尝试从缓存获取
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // 如果缓存不存在，执行回调函数获取数据
    const data = await fetchFn();
    
    // 缓存数据
    this.set(key, data, ttlSeconds);
    
    return data;
  }
}

// 创建单例实例
const cache = new MemoryCache();

// 每小时清理一次过期缓存
setInterval(() => {
  cache.cleanup();
}, 60 * 60 * 1000);

export default cache;
