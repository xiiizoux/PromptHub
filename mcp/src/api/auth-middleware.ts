import { config } from '../config.js';
import { Request, Response, NextFunction } from 'express';
import { StorageFactory } from '../storage/storage-factory.js';
import { User } from '../types.js';

// 扩展Express的Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isPublicAccess?: boolean;
    }
  }
}

/**
 * 身份验证中间件，用于保护需要认证的API路由
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件函数
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 获取存储适配器
    const storage = StorageFactory.getStorage();
    
    // 先检查API密钥
    const apiKey = getAuthValue(req, 'x-api-key') || getAuthValue(req, 'api_key');
    const serverKey = getAuthValue(req, 'server-key') || config.serverKey || config.apiKey;
    
    // 验证API密钥 - 系统级别访问
    if (apiKey && (apiKey === config.apiKey || apiKey === serverKey)) {
      req.user = {
        id: 'system-user',
        email: 'system@example.com',
        display_name: 'System User'
      };
      return next();
    }
    
    // 验证用户API密钥
    if (apiKey) {
      const user = await storage.verifyApiKey(apiKey);
      if (user) {
        req.user = user;
        // 异步更新最后使用时间，不阻塞请求
        storage.updateApiKeyLastUsed(apiKey).catch(err => {
          console.error('更新API密钥使用时间失败:', err);
        });
        return next();
      }
    }
    
    // 获取授权头
    const authHeader = req.headers.authorization;
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 从其他地方获取令牌
      token = getAuthValue(req, 'token') || getAuthValue(req, 'access_token') || '';
    }
    
    // 如果有令牌，验证用户身份
    if (token) {
      const user = await storage.verifyToken(token);
      
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // 检查是否只是公开访问
    const publicAccessHeader = getAuthValue(req, 'x-public-access');
    if (publicAccessHeader === 'true') {
      req.isPublicAccess = true;
      return next();
    }
    
    // 身份验证失败
    res.status(401).json({
      success: false,
      error: '未授权访问，请提供有效的API密钥或认证令牌'
    });
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({
      success: false,
      error: '认证过程中发生错误'
    });
  }
};

/**
 * 公开访问中间件 - 只允许访问公开的内容
 */
export const publicAccessMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.isPublicAccess = true;
  next();
};

/**
 * 可选认证中间件 - 如果有认证信息会认证，没有则继续
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 获取存储适配器
    const storage = StorageFactory.getStorage();
    
    // 先检查API密钥
    const apiKey = getAuthValue(req, 'x-api-key') || getAuthValue(req, 'api_key');
    const serverKey = getAuthValue(req, 'server-key') || config.serverKey || config.apiKey;
    
    // 验证API密钥 - 系统级别访问
    if (apiKey && (apiKey === config.apiKey || apiKey === serverKey)) {
      req.user = {
        id: 'system-user',
        email: 'system@example.com',
        display_name: 'System User'
      };
      return next();
    }
    
    // 验证用户API密钥
    if (apiKey) {
      const user = await storage.verifyApiKey(apiKey);
      if (user) {
        req.user = user;
        // 异步更新最后使用时间，不阻塞请求
        storage.updateApiKeyLastUsed(apiKey).catch(err => {
          console.error('更新API密钥使用时间失败:', err);
        });
        return next();
      }
    }
    
    // 获取授权头
    const authHeader = req.headers.authorization;
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 从其他地方获取令牌
      token = getAuthValue(req, 'token') || getAuthValue(req, 'access_token') || '';
    }
    
    // 如果有令牌，验证用户身份
    if (token) {
      const user = await storage.verifyToken(token);
      
      if (user) {
        req.user = user;
      }
    }
    
    // 无论认证结果如何，都继续处理
    next();
  } catch (error) {
    // 即使出错也继续，但不设置用户信息
    console.error('可选认证错误:', error);
    next();
  }
};

/**
 * 从请求中获取认证值
 * @param request 请求对象
 * @param key 键名
 * @returns 认证值
 */
function getAuthValue(request: Request, key: string): string {
  // 从查询参数获取值
  if (request.query && request.query[key.toLowerCase()]) {
    const value = request.query[key.toLowerCase()];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    return '';
  }
  
  // 从headers获取值
  if (request.headers && request.headers[key.toLowerCase()]) {
    const value = request.headers[key.toLowerCase()];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    return '';
  }
  
  // 从Bearer令牌获取API密钥
  if (key.toLowerCase() === 'api_key' && request.headers && request.headers.authorization) {
    const authHeader = request.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  
  return '';
}
