import { config } from '../config.js';
import type { Request, Response, NextFunction } from 'express';
import { storage } from '../shared/services.js';
import { User } from '../types.js';
import logger, { logAuthActivity, logSecurityEvent, AuditEventType } from '../utils/logger.js';
import { createEnhancedError, ErrorType, ErrorSeverity } from '../shared/error-handler.js';

// 扩展Express的Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isPublicAccess?: boolean;
      authMethod?: 'api_key' | 'jwt_token' | 'system' | 'public';
      sessionId?: string;
    }
  }
}

// 认证结果接口
interface AuthResult {
  success: boolean;
  user?: User;
  method?: 'api_key' | 'jwt_token' | 'system' | 'public';
  error?: string;
}

// 提取认证信息的通用函数
function extractAuthInfo(req: Request): {
  apiKey?: string;
  serverKey?: string;
  token?: string;
  ip: string;
  userAgent: string;
} {
  const apiKey = getAuthValue(req, 'x-api-key') || getAuthValue(req, 'api_key');
  const serverKey = getAuthValue(req, 'server-key') || config.serverKey || config.apiKey;

  // 获取JWT令牌
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = getAuthValue(req, 'token') || getAuthValue(req, 'access_token') || '';
  }

  return {
    apiKey,
    serverKey,
    token,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
}

// 会话管理
const activeSessions = new Map<string, { userId: string; lastActivity: number; expiresAt: number }>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

function isSessionValid(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  const now = Date.now();
  if (now > session.expiresAt) {
    activeSessions.delete(sessionId);
    return false;
  }

  return true;
}

function updateSessionActivity(sessionId: string, userId: string): void {
  const now = Date.now();
  activeSessions.set(sessionId, {
    userId,
    lastActivity: now,
    expiresAt: now + SESSION_TIMEOUT
  });
}

function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
    }
  }
}

// 定期清理过期会话
setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // 每5分钟清理一次

// 统一的认证逻辑
async function performAuthentication(req: Request, requireAuth: boolean = true): Promise<AuthResult> {
  const { apiKey, serverKey, token, ip, userAgent } = extractAuthInfo(req);
  const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    // 1. 系统级API密钥验证
    if (apiKey && (apiKey === config.apiKey || apiKey === serverKey)) {
      const systemUser: User = {
        id: 'system-user',
        email: 'system@example.com',
        display_name: 'System User'
      };

      logAuthActivity('system-user', AuditEventType.API_KEY_USED, true, {
        ip, userAgent, sessionId, keyType: 'system'
      });

      return { success: true, user: systemUser, method: 'system' };
    }

    // 2. 用户API密钥验证
    if (apiKey) {
      const user = await storage.verifyApiKey(apiKey);
      if (user) {
        // 更新会话活动
        updateSessionActivity(sessionId, user.id);

        // 异步更新最后使用时间，不阻塞请求
        storage.updateApiKeyLastUsed(apiKey).catch(err => {
          logger.warn('更新API密钥使用时间失败', { error: err.message, userId: user.id });
        });

        logAuthActivity(user.id, AuditEventType.API_KEY_USED, true, {
          ip, userAgent, sessionId, keyType: 'user'
        });

        return { success: true, user, method: 'api_key' };
      } else {
        // 记录无效API密钥使用
        logSecurityEvent(
          AuditEventType.SECURITY_VIOLATION,
          'medium',
          'Invalid API key used',
          { ip, userAgent, sessionId, apiKey: apiKey.substring(0, 8) + '...' }
        );
      }
    }

    // 3. JWT令牌验证
    if (token) {
      const user = await storage.verifyToken(token);
      if (user) {
        // 更新会话活动
        updateSessionActivity(sessionId, user.id);

        logAuthActivity(user.id, AuditEventType.USER_LOGIN, true, {
          ip, userAgent, sessionId, method: 'jwt'
        });

        return { success: true, user, method: 'jwt_token' };
      } else {
        // 记录无效令牌使用
        logSecurityEvent(
          AuditEventType.SECURITY_VIOLATION,
          'medium',
          'Invalid JWT token used',
          { ip, userAgent, sessionId, token: token.substring(0, 8) + '...' }
        );
      }
    }

    // 4. 公开访问检查
    const publicAccessHeader = getAuthValue(req, 'x-public-access');
    if (publicAccessHeader === 'true' || !requireAuth) {
      return { success: true, method: 'public' };
    }

    // 认证失败
    logSecurityEvent(
      AuditEventType.SECURITY_VIOLATION,
      'low',
      'Authentication failed - no valid credentials',
      { ip, userAgent, sessionId }
    );

    return { success: false, error: '未授权访问，请提供有效的API密钥或认证令牌' };

  } catch (error) {
    logger.error('认证过程中发生错误', { error: error.message, ip, userAgent, sessionId });
    return { success: false, error: '认证过程中发生错误' };
  }
}

/**
 * 身份验证中间件，用于保护需要认证的API路由
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const result = await performAuthentication(req, true);

  if (result.success) {
    req.user = result.user;
    req.authMethod = result.method;
    req.sessionId = req.headers['x-session-id'] as string;
    return next();
  }

  res.status(401).json({
    success: false,
    error: result.error,
    timestamp: new Date().toISOString()
  });
};

/**
 * 公开访问中间件 - 只允许访问公开的内容
 */
export const publicAccessMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.isPublicAccess = true;
  req.authMethod = 'public';
  next();
};

/**
 * 可选认证中间件 - 如果有认证信息会认证，没有则继续
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const result = await performAuthentication(req, false);

  if (result.success && result.user) {
    req.user = result.user;
    req.authMethod = result.method;
  } else {
    req.isPublicAccess = true;
    req.authMethod = 'public';
  }

  req.sessionId = req.headers['x-session-id'] as string;
  next();
};

/**
 * 从请求中获取认证值
 * @param request 请求对象
 * @param key 键名
 * @returns 认证值
 */
function getAuthValue(request: Request, key: string): string {
  const lowerKey = key.toLowerCase();

  // 从查询参数获取值
  if (request.query && request.query[lowerKey]) {
    const value = request.query[lowerKey];
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value) && value.length > 0) return String(value[0]).trim();
    return '';
  }

  // 从headers获取值
  if (request.headers && request.headers[lowerKey]) {
    const value = request.headers[lowerKey];
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value) && value.length > 0) return String(value[0]).trim();
    return '';
  }

  // 从Bearer令牌获取API密钥（仅用于api_key）
  if (lowerKey === 'api_key' && request.headers && request.headers.authorization) {
    const authHeader = request.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
  }

  return '';
}

/**
 * 速率限制中间件
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.security.enableRateLimit) {
    return next();
  }

  // 简单的内存速率限制（生产环境应使用Redis）
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - config.security.rateLimitWindow;

  // 这里应该实现真正的速率限制逻辑
  // 为了简化，这里只是记录访问
  logger.debug('Rate limit check', { ip, timestamp: now });

  next();
};

/**
 * 安全头中间件
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 设置安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 移除暴露服务器信息的头
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};
