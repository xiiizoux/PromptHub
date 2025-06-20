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

// 增强的会话管理
interface SessionInfo {
  userId: string;
  lastActivity: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
  authMethod: string;
  createdAt: number;
}

const activeSessions = new Map<string, SessionInfo>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟
const MAX_SESSIONS_PER_USER = 5; // 每个用户最多5个活跃会话

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 100; // 每个窗口最多100个请求

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

function updateSessionActivity(sessionId: string, userId: string, ip: string, userAgent: string, authMethod: string): void {
  const now = Date.now();

  // 检查用户的活跃会话数量
  const userSessions = Array.from(activeSessions.entries())
    .filter(([_, session]) => session.userId === userId);

  // 如果超过最大会话数，删除最旧的会话
  if (userSessions.length >= MAX_SESSIONS_PER_USER) {
    const oldestSession = userSessions
      .sort((a, b) => a[1].lastActivity - b[1].lastActivity)[0];
    activeSessions.delete(oldestSession[0]);
    logger.info('删除最旧的会话', { userId, sessionId: oldestSession[0] });
  }

  activeSessions.set(sessionId, {
    userId,
    lastActivity: now,
    expiresAt: now + SESSION_TIMEOUT,
    ip,
    userAgent,
    authMethod,
    createdAt: activeSessions.get(sessionId)?.createdAt || now
  });
}

function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of activeSessions) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.debug(`清理了 ${cleanedCount} 个过期会话`);
  }
}

// 速率限制检查
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 创建新的速率限制记录
    const newRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newRecord.resetTime
    };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetTime: record.resetTime
  };
}

// 清理过期的速率限制记录
function cleanupRateLimit(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.debug(`清理了 ${cleanedCount} 个过期的速率限制记录`);
  }
}

// 定期清理过期会话和速率限制记录
setInterval(() => {
  cleanupExpiredSessions();
  cleanupRateLimit();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 增强的认证逻辑
async function performAuthentication(req: Request, requireAuth: boolean = true): Promise<AuthResult> {
  const { apiKey, serverKey, token, ip, userAgent } = extractAuthInfo(req);
  const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    // 0. 速率限制检查
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      logSecurityEvent(
        AuditEventType.SECURITY_VIOLATION,
        'high',
        'Rate limit exceeded',
        { ip, userAgent, sessionId, resetTime: rateLimitResult.resetTime }
      );
      return { success: false, error: '请求过于频繁，请稍后再试' };
    }

    // 1. 系统级API密钥验证
    if (apiKey && (apiKey === config.apiKey || apiKey === serverKey)) {
      const systemUser: User = {
        id: 'system-user',
        email: 'system@example.com',
        display_name: 'System User'
      };

      // 更新会话活动
      updateSessionActivity(sessionId, 'system-user', ip, userAgent, 'system');

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
        updateSessionActivity(sessionId, user.id, ip, userAgent, 'api_key');

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
        updateSessionActivity(sessionId, user.id, ip, userAgent, 'jwt_token');

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
  const { ip } = extractAuthInfo(req);
  const rateLimitResult = checkRateLimit(ip);

  // 添加速率限制响应头
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));

  const result = await performAuthentication(req, true);

  if (result.success) {
    req.user = result.user;
    req.authMethod = result.method;
    req.sessionId = req.headers['x-session-id'] as string;
    return next();
  }

  // 如果是速率限制错误，返回429状态码
  if (result.error?.includes('请求过于频繁')) {
    return res.status(429).json({
      success: false,
      error: result.error,
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    });
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
 * 增强的速率限制中间件
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!config.security.enableRateLimit) {
    return next();
  }

  const { ip } = extractAuthInfo(req);
  const rateLimitResult = checkRateLimit(ip);

  // 添加速率限制响应头
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));

  if (!rateLimitResult.allowed) {
    logSecurityEvent(
      AuditEventType.SECURITY_VIOLATION,
      'high',
      'Rate limit exceeded in middleware',
      { ip, resetTime: rateLimitResult.resetTime }
    );

    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      timestamp: new Date().toISOString()
    });
  }

  logger.debug('Rate limit check passed', {
    ip,
    remaining: rateLimitResult.remaining,
    resetTime: new Date(rateLimitResult.resetTime).toISOString()
  });

  next();
};

/**
 * 增强的安全头中间件
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 基础安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 内容安全策略 (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 允许内联脚本用于兼容性
    "style-src 'self' 'unsafe-inline'", // 允许内联样式
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HTTPS 强制 (仅在生产环境)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 权限策略
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

  // 防止MIME类型嗅探
  res.setHeader('X-Download-Options', 'noopen');

  // 移除暴露服务器信息的头
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('X-AspNetMvc-Version');

  next();
};

/**
 * 会话信息获取函数
 */
export const getSessionInfo = (sessionId: string): SessionInfo | undefined => {
  return activeSessions.get(sessionId);
};

/**
 * 获取用户的所有活跃会话
 */
export const getUserSessions = (userId: string): Array<{ sessionId: string; info: SessionInfo }> => {
  return Array.from(activeSessions.entries())
    .filter(([_, session]) => session.userId === userId)
    .map(([sessionId, info]) => ({ sessionId, info }));
};

/**
 * 强制注销用户的所有会话
 */
export const logoutUserSessions = (userId: string): number => {
  let loggedOutCount = 0;
  for (const [sessionId, session] of activeSessions) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
      loggedOutCount++;
    }
  }

  if (loggedOutCount > 0) {
    logger.info(`强制注销用户的 ${loggedOutCount} 个会话`, { userId });
  }

  return loggedOutCount;
};
