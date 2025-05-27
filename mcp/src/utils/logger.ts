import winston from 'winston';
import fs from 'fs';
import path from 'path';

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mcp-prompt-server' },
  transports: [
    // 写入所有日志到 combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 写入错误日志到 error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 写入API密钥相关操作到 api-keys.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'api-keys.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5 
    }),
    // 开发环境下在控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 定义审计日志记录器（专门用于记录安全相关操作）
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'mcp-prompt-server-audit' },
  transports: [
    // 写入审计日志到 audit.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    // 开发环境下在控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 记录API密钥相关操作的审计函数
export const logApiKeyActivity = (userId: string, action: string, keyId?: string, metadata?: any) => {
  auditLogger.info({
    userId,
    action,
    keyId,
    timestamp: new Date().toISOString(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown',
    ...metadata
  });
};

// 记录认证相关操作的审计函数
export const logAuthActivity = (userId: string, action: string, success: boolean, metadata?: any) => {
  auditLogger.info({
    userId,
    action,
    success,
    timestamp: new Date().toISOString(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown',
    ...metadata
  });
};

export default logger;
