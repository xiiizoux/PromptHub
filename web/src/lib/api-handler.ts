/**
 * 增强版API处理器
 * 为Next.js API Routes提供通用处理逻辑
 * 集成了缓存、速率限制、错误处理和日志功能
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/types/api';
import supabaseAdapter from './supabase-adapter';
import cache from './cache';
import { ApiError, logger } from './error-handler';

// 错误码定义
export enum ErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
  TOO_MANY_REQUESTS = 429,
}

// API处理器选项
export interface ApiHandlerOptions {
  // 是否需要认证
  requireAuth?: boolean;
  // 允许的请求方法
  allowedMethods?: string[];
  // 是否启用缓存（GET请求）
  enableCache?: boolean;
  // 缓存生存时间（秒）
  cacheTTL?: number;
  // 缓存键生成函数
  cacheKeyGenerator?: (req: NextApiRequest) => string;
}

// 默认选项
const defaultOptions: ApiHandlerOptions = {
  requireAuth: false,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableCache: false,
  cacheTTL: 300, // 默认5分钟
};

/**
 * 生成缓存键
 * @param req 请求对象
 */
const generateCacheKey = (req: NextApiRequest): string => {
  const { url, method, query } = req;
  const queryString = Object.entries(query)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `api:${method}:${url}:${queryString}`;
};

/**
 * 通用API处理函数包装器
 * @param handler 具体的处理函数
 * @param options 处理选项
 */
export const apiHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse, userId?: string) => Promise<void>,
  options: ApiHandlerOptions = {},
) => {
  // 合并默认选项
  const opts = { ...defaultOptions, ...options };

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 设置请求超时保护
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('API请求超时', new Error('Request timeout'), {
          method: req.method,
          url: req.url,
        });
        res.status(408).json({
          success: false,
          error: '请求超时，请稍后重试',
          code: 'REQUEST_TIMEOUT',
          statusCode: 408,
        });
      }
    }, 180000); // 增加到3分钟超时保护（比前端更长）
    
    // 记录请求
    logger.info(`API请求: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      query: req.query,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
    
    try {
      // 检查请求方法是否允许
      if (opts.allowedMethods && !opts.allowedMethods.includes(req.method || '')) {
        throw ApiError.badRequest(`不支持的请求方法: ${req.method}`, 'METHOD_NOT_SUPPORTED');
      }

      // 处理认证
      let userId: string | undefined;

      // 尝试获取认证信息（无论是否要求认证）
      try {
        // 从请求头中获取认证信息
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'] as string;

        let user = null;

        // 优先使用Bearer Token
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          user = await supabaseAdapter.verifyToken(token);
        }
        // 如果没有token但有API密钥，尝试使用API密钥认证
        else if (apiKey) {
          user = await supabaseAdapter.verifyApiKey(apiKey);

          // 更新API密钥使用时间
          if (user) {
            await supabaseAdapter.updateApiKeyLastUsed(apiKey);
          }
        }

        if (user) {
          userId = user.id;

          // 将用户信息附加到请求对象
          (req as any).user = user;

          logger.debug('用户已认证', { userId });
        }

        // 如果要求认证但没有用户，抛出错误
        if (opts.requireAuth && !user) {
          throw ApiError.unauthorized('未授权，请登录或提供有效的API密钥', 'UNAUTHORIZED');
        }
      } catch (error) {
        // 如果要求认证，认证失败时抛出错误
        if (opts.requireAuth) {
          logger.error('认证错误', error instanceof Error ? error : new Error(String(error)));
          throw ApiError.unauthorized('认证失败', 'AUTH_ERROR');
        } else {
          // 如果不要求认证，认证失败时只记录警告
          logger.warn('可选认证失败', error instanceof Error ? error : new Error(String(error)));
        }
      }

      // 检查GET请求是否启用了缓存
      if (req.method === 'GET' && opts.enableCache) {
        const cacheKey = opts.cacheKeyGenerator 
          ? opts.cacheKeyGenerator(req) 
          : generateCacheKey(req);
        
        // 尝试从缓存获取
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          logger.debug('从缓存返回响应', { cacheKey });
          
          // 设置缓存标头
          res.setHeader('X-Cache', 'HIT');
          clearTimeout(timeoutId);
          
          return res.status(200).json(cachedData);
        }
        
        // 封装响应对象，以拦截和缓存响应
        const originalJson = res.json;
        res.json = function(body: any): any {
          // 缓存成功的响应
          if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
            cache.set(cacheKey, body, opts.cacheTTL);
            logger.debug('缓存API响应', { cacheKey, ttl: opts.cacheTTL });
          }
          
          res.setHeader('X-Cache', 'MISS');
          clearTimeout(timeoutId);
          return originalJson.call(this, body);
        };
      }

      // 调用实际的处理函数
      await handler(req, res, userId);
      
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 记录成功的请求
      logger.debug('API请求处理成功', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
      });
    } catch (error: any) {
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      logger.error('API请求处理错误', error instanceof Error ? error : new Error(String(error)), {
        method: req.method,
        url: req.url,
      });
      
      // 检查响应是否已发送
      if (res.headersSent) {
        return;
      }
      
      // 处理API错误
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
        });
      }
      
      // 处理其他错误
      const statusCode = error.statusCode || ErrorCode.INTERNAL_SERVER_ERROR;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message || '服务器内部错误',
        code: 'INTERNAL_ERROR',
        statusCode,
      });
    }
  };
};

/**
 * 成功响应辅助函数
 */
export const successResponse = <T>(res: NextApiResponse, data: T, message?: string) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(200).json(response);
};

/**
 * 错误响应辅助函数
 */
export const errorResponse = (
  res: NextApiResponse, 
  error: string, 
  statusCode: ErrorCode = ErrorCode.BAD_REQUEST,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code: statusCode === ErrorCode.BAD_REQUEST ? 'BAD_REQUEST' :
          statusCode === ErrorCode.UNAUTHORIZED ? 'UNAUTHORIZED' :
          statusCode === ErrorCode.FORBIDDEN ? 'FORBIDDEN' :
          statusCode === ErrorCode.NOT_FOUND ? 'NOT_FOUND' :
          statusCode === ErrorCode.TOO_MANY_REQUESTS ? 'TOO_MANY_REQUESTS' :
          'INTERNAL_ERROR',
    statusCode,
  });
};

/**
 * MCP服务代理辅助函数
 */
export const mcpProxy = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  data?: any,
) => {
  const mcpUrl = process.env.MCP_URL || 'http://localhost:9010';
  const url = `${mcpUrl}${endpoint}`;

  logger.debug('代理请求到MCP服务', { endpoint, method });

  try {
    // 准备认证头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加API密钥认证（优先使用系统级API密钥）
    const apiKey = process.env.API_KEY || process.env.MCP_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    // 添加会话ID用于审计
    headers['x-session-id'] = `web-proxy-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `MCP服务错误 (${response.status}): ${errorText}`;
      logger.error(errorMessage, undefined, { endpoint, method, statusCode: response.status });
      throw new Error(errorMessage);
    }

    const result = await response.json();
    logger.debug('MCP服务响应成功', { endpoint });

    return result;
  } catch (error) {
    logger.error('MCP代理错误', error instanceof Error ? error : new Error(String(error)), { endpoint, method });
    throw error;
  }
};
