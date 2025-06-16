import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import validator from 'validator';

// 安全头配置
export const securityHeaders = helmet({
  // 启用 HSTS
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true
  },
  
  // CSP配置
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // 开发环境需要unsafe-eval
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "wss:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // 其他安全头
  crossOriginEmbedderPolicy: false, // 为了兼容性暂时关闭
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // 隐藏服务器信息
  hidePoweredBy: true,
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// 请求验证中间件
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 验证请求体
      if (req.body) {
        schema.parse(req.body);
      }
      
      // 验证查询参数中的危险字符
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // 检查SQL注入模式
          const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|['"`;\\]/i;
          if (sqlInjectionPattern.test(value)) {
            console.warn(`🚨 Potential SQL injection attempt in query param ${key}: ${value}`);
            return res.status(400).json({
              success: false,
              error: '请求参数包含非法字符'
            });
          }
          
          // 检查XSS模式
          const xssPattern = /<script|javascript:|on\w+\s*=|<iframe|<embed|<object/i;
          if (xssPattern.test(value)) {
            console.warn(`🚨 Potential XSS attempt in query param ${key}: ${value}`);
            return res.status(400).json({
              success: false,
              error: '请求参数包含恶意代码'
            });
          }
        }
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: '请求参数验证失败',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      next(error);
    }
  };
};

// 文件上传安全验证
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const file = req.file || (Array.isArray(req.files) ? req.files[0] : req.files);
  
  if (file) {
    // 验证文件类型
    const allowedMimeTypes = [
      'application/json',
      'text/plain',
      'text/csv',
      'application/octet-stream'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: '不支持的文件类型'
      });
    }
    
    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制（最大10MB）'
      });
    }
    
    // 验证文件名
    if (file.originalname && !/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
      return res.status(400).json({
        success: false,
        error: '文件名包含非法字符'
      });
    }
  }
  
  next();
};

// IP白名单验证（用于管理接口）
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (!clientIP || !allowedIPs.includes(clientIP as string)) {
      console.warn(`🚫 Unauthorized IP access attempt: ${clientIP}`);
      return res.status(403).json({
        success: false,
        error: '访问被拒绝：IP不在白名单中'
      });
    }
    
    next();
  };
};

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // 添加请求ID到响应头
  res.setHeader('X-Request-ID', requestId);
  
  // 记录请求开始
  console.log(`🔍 [${requestId}] ${req.method} ${req.url} from ${req.ip}`);
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    
    console.log(`${statusColor} [${requestId}] ${res.statusCode} - ${duration}ms`);
    
    // 记录慢请求
    if (duration > 5000) {
      console.warn(`⚠️ Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// 增强速率限制配置
export const createAdvancedRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    
    // 自定义键生成器（根据用户ID或IP）
    keyGenerator: (req) => {
      const user = (req as any).user;
      if (user?.id) {
        return `user:${user.id}`;
      }
      return req.ip || 'unknown';
    },
    
    // 自定义处理器
    handler: (req, res) => {
      console.warn(`🚨 Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// 常用的速率限制器
export const rateLimiters = {
  // 登录限制：每15分钟最多5次尝试
  auth: createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试过于频繁，请15分钟后再试',
    skipSuccessfulRequests: true
  }),
  
  // API限制：每分钟最多100次请求
  api: createAdvancedRateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'API调用过于频繁，请稍后再试'
  }),
  
  // 上传限制：每分钟最多10次上传
  upload: createAdvancedRateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: '文件上传过于频繁，请稍后再试'
  }),
  
  // 严格限制：每小时最多10次请求（用于敏感操作）
  strict: createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: '操作过于频繁，请1小时后再试'
  })
};

// 数据验证模式
export const validationSchemas = {
  // 创建提示词验证
  createPrompt: z.object({
    name: z.string()
      .min(1, '名称不能为空')
      .max(100, '名称不能超过100字符')
      .refine(val => validator.isLength(val.trim(), { min: 1 }), '名称不能只包含空格'),
    
    description: z.string()
      .min(1, '描述不能为空')
      .max(1000, '描述不能超过1000字符'),
      
    content: z.string()
      .min(1, '内容不能为空')
      .max(50000, '内容不能超过50000字符')
      .refine(val => {
        const dangerousPatterns = /<script|javascript:|data:|vbscript:|on\w+\s*=/i;
        return !dangerousPatterns.test(val);
      }, '内容包含不安全的代码'),
      
    category: z.string()
      .min(1, '分类不能为空')
      .max(50, '分类不能超过50字符'),
      
    tags: z.array(z.string().max(20, '标签长度不能超过20字符'))
      .max(10, '标签数量不能超过10个')
  }),
  
  // 用户注册验证
  userRegistration: z.object({
    email: z.string()
      .email('邮箱格式不正确')
      .max(255, '邮箱长度不能超过255字符'),
      
    password: z.string()
      .min(8, '密码至少需要8个字符')
      .max(128, '密码不能超过128字符')
      .refine(val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val), 
        '密码必须包含至少一个大写字母、一个小写字母和一个数字'),
        
    username: z.string()
      .min(3, '用户名至少需要3个字符')
      .max(30, '用户名不能超过30字符')
      .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), '用户名只能包含字母、数字、下划线和连字符')
  })
};

export default {
  securityHeaders,
  validateRequest,
  validateFileUpload,
  ipWhitelist,
  requestLogger,
  rateLimiters,
  validationSchemas
}; 