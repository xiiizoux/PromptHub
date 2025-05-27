/**
 * API速率限制中间件
 * 用于限制每个IP地址或用户ID的请求频率
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { errorResponse, ErrorCode } from './api-handler';

// 速率限制配置
interface RateLimitConfig {
  // 时间窗口内允许的最大请求数
  maxRequests: number;
  // 时间窗口长度（秒）
  windowSizeSeconds: number;
}

// 用户请求记录
interface RequestRecord {
  count: number;
  resetTime: number;
}

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,  // 默认每个窗口允许100个请求
  windowSizeSeconds: 60  // 默认窗口为1分钟
};

class RateLimiter {
  private requestMap: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 每小时清理过期记录
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
  
  /**
   * 检查请求是否超过速率限制
   * @param key 限制键（通常是IP地址或用户ID）
   * @returns 是否允许请求和剩余配额
   */
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + (this.config.windowSizeSeconds * 1000);
    
    // 获取现有记录或创建新记录
    let record = this.requestMap.get(key);
    
    if (!record || now > record.resetTime) {
      // 创建新记录
      record = { count: 1, resetTime };
      this.requestMap.set(key, record);
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }
    
    // 增加请求计数
    record.count += 1;
    
    // 检查是否超过限制
    const allowed = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);
    
    return { allowed, remaining, resetTime: record.resetTime };
  }
  
  /**
   * 清理过期记录
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.requestMap.forEach((record, key) => {
      if (now > record.resetTime) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
        this.requestMap.delete(key);
    });
  }
  
  /**
   * 获取唯一请求标识符
   * 优先使用用户ID，其次使用API密钥，最后使用IP地址
   */
  private static getRequestIdentifier(req: NextApiRequest): string {
    // 优先使用认证用户ID
    const userId = (req as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    
    // 其次使用API密钥
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return `apikey:${apiKey}`;
    }
    
    // 最后使用IP地址
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
  
  /**
   * 创建中间件函数
   * @param customConfig 自定义配置
   */
  middleware(customConfig?: Partial<RateLimitConfig>) {
    // 合并配置
    const mergedConfig = { ...this.config, ...customConfig };
    const limiter = new RateLimiter(mergedConfig);
    
    return (req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>): Promise<void> => {
      const key = RateLimiter.getRequestIdentifier(req);
      const { allowed, remaining, resetTime } = limiter.check(key);
      
      // 设置速率限制头
      res.setHeader('X-RateLimit-Limit', String(mergedConfig.maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.floor(resetTime / 1000)));
      
      if (!allowed) {
        return errorResponse(
          res,
          '请求过于频繁，请稍后再试',
          ErrorCode.TOO_MANY_REQUESTS
        ) as any;
      }
      
      return next();
    };
  }
}

// 创建全局实例
const globalRateLimiter = new RateLimiter();

// 对不同类型的路由使用不同的速率限制配置
export const rateLimiters = {
  // 全局默认限制
  global: globalRateLimiter.middleware.bind(globalRateLimiter),
  
  // 认证路由：每分钟30个请求
  auth: globalRateLimiter.middleware.bind(globalRateLimiter, {
    maxRequests: 30,
    windowSizeSeconds: 60
  }),
  
  // 公共API：每分钟300个请求
  public: globalRateLimiter.middleware.bind(globalRateLimiter, {
    maxRequests: 300,
    windowSizeSeconds: 60
  }),
  
  // MCP工具：每分钟50个请求
  mcpTools: globalRateLimiter.middleware.bind(globalRateLimiter, {
    maxRequests: 50,
    windowSizeSeconds: 60
  })
};

// TOO_MANY_REQUESTS错误码已在ErrorCode中定义
