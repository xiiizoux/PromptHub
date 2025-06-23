import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 100; // 每个窗口最多100个请求

// 会话管理
interface SessionInfo {
  userId: string;
  lastActivity: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

const activeSessions = new Map<string, SessionInfo>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分钟

/**
 * 获取客户端IP地址
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

/**
 * 速率限制检查
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 更新会话活动
 */
function updateSessionActivity(sessionId: string, userId: string, ip: string, userAgent: string): void {
  const now = Date.now();
  activeSessions.set(sessionId, {
    userId,
    lastActivity: now,
    expiresAt: now + SESSION_TIMEOUT,
    ip,
    userAgent,
  });
}

/**
 * 增强的API路由认证中间件
 * 包含速率限制、会话管理和安全头部
 */
export function withApiAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 速率限制检查
      const rateLimitResult = checkRateLimit(ip);

      // 添加速率限制响应头
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));

      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          timestamp: new Date().toISOString(),
        });
      }

      // 获取授权头
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      let user = null;
      let authMethod = '';

      // 优先使用Bearer Token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        // 验证JWT令牌
        const supabase = getSupabaseServerClient();
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

        if (error || !authUser) {
          return res.status(401).json({
            success: false,
            message: '令牌无效或已过期',
            timestamp: new Date().toISOString(),
          });
        }

        user = authUser;
        authMethod = 'jwt_token';
      }
      // 如果没有token但有API密钥，尝试使用API密钥认证
      else if (apiKey) {
        // 这里应该验证API密钥，但由于Web服务解耦，我们暂时跳过
        // 在实际应用中，应该调用MCP服务的API密钥验证接口
        return res.status(401).json({
          success: false,
          message: 'API密钥认证暂不支持，请使用JWT令牌',
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌',
          timestamp: new Date().toISOString(),
        });
      }

      // 更新会话活动
      updateSessionActivity(sessionId, user.id, ip, userAgent);

      // 将用户信息添加到请求对象中
      (req as any).userId = user.id;
      (req as any).user = user;
      (req as any).authMethod = authMethod;
      (req as any).sessionId = sessionId;

      // 调用实际的处理程序
      return handler(req, res, user.id);

    } catch (error) {
      console.error('认证中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * 可选认证中间件 - 如果有认证信息会认证，没有则继续
 */
export function withOptionalAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 速率限制检查
      const rateLimitResult = checkRateLimit(ip);

      // 添加速率限制响应头
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000));

      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          timestamp: new Date().toISOString(),
        });
      }

      // 尝试获取认证信息
      const authHeader = req.headers.authorization;
      let user = null;
      let authMethod = 'public';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          const supabase = getSupabaseServerClient();
          const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

          if (!error && authUser) {
            user = authUser;
            authMethod = 'jwt_token';
            updateSessionActivity(sessionId, user.id, ip, userAgent);
          }
        } catch (error) {
          // 认证失败，但继续以公开访问方式处理
          console.warn('可选认证失败:', error);
        }
      }

      // 将信息添加到请求对象中
      (req as any).userId = user?.id;
      (req as any).user = user;
      (req as any).authMethod = authMethod;
      (req as any).sessionId = sessionId;
      (req as any).isPublicAccess = !user;

      // 调用实际的处理程序
      return handler(req, res, user?.id);

    } catch (error) {
      console.error('可选认证中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// 定期清理过期会话和速率限制记录
setInterval(() => {
  const now = Date.now();

  // 清理过期会话
  for (const [sessionId, session] of activeSessions) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
    }
  }

  // 清理过期的速率限制记录
  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // 每5分钟清理一次
