import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

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

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${service || 'MCP'}] ${level}: ${message}${metaStr}`;
  })
);

// 创建传输器数组
const transports: winston.transport[] = [];

// 文件传输器（如果启用）
if (config.logging.enableFile) {
  transports.push(
    // 写入所有日志到 combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles
    }),
    // 写入错误日志到 error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles
    }),
    // 写入API密钥相关操作到 api-keys.log
    new winston.transports.File({
      filename: path.join(logDir, 'api-keys.log'),
      maxsize: config.logging.maxFileSize,
      maxFiles: config.logging.maxFiles
    })
  );
}

// 控制台传输器（如果启用）
if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 创建日志记录器
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'mcp-prompt-server' },
  transports,
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

// 审计日志类型
export enum AuditEventType {
  API_KEY_CREATED = 'api_key_created',
  API_KEY_USED = 'api_key_used',
  API_KEY_DELETED = 'api_key_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  PROMPT_CREATED = 'prompt_created',
  PROMPT_UPDATED = 'prompt_updated',
  PROMPT_DELETED = 'prompt_deleted',
  PROMPT_ACCESSED = 'prompt_accessed',
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

// 记录API密钥相关操作的审计函数
export const logApiKeyActivity = (
  userId: string,
  action: AuditEventType,
  keyId?: string,
  metadata?: any
) => {
  auditLogger.info('API Key Activity', {
    eventType: action,
    userId,
    keyId,
    timestamp: new Date().toISOString(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown',
    sessionId: metadata?.sessionId,
    ...metadata
  });
};

// 记录认证相关操作的审计函数
export const logAuthActivity = (
  userId: string,
  action: AuditEventType,
  success: boolean,
  metadata?: any
) => {
  auditLogger.info('Authentication Activity', {
    eventType: action,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown',
    sessionId: metadata?.sessionId,
    failureReason: success ? undefined : metadata?.reason,
    ...metadata
  });
};

// 记录安全事件
export const logSecurityEvent = (
  eventType: AuditEventType,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  metadata?: any
) => {
  auditLogger.warn('Security Event', {
    eventType,
    severity,
    description,
    timestamp: new Date().toISOString(),
    ip: metadata?.ip || 'unknown',
    userAgent: metadata?.userAgent || 'unknown',
    userId: metadata?.userId,
    ...metadata
  });
};

// 记录性能事件
export const logPerformanceEvent = (
  operation: string,
  duration: number,
  metadata?: any
) => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  logger[level]('Performance Event', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export default logger;
