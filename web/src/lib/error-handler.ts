/**
 * 增强的错误处理和日志系统
 * 提供统一的错误类型、日志记录和监控
 */

import { ErrorCode } from './api-handler';

// 自定义API错误类
export class ApiError extends Error {
  statusCode: number;
  code: string;
  context?: Record<string, any>;
  
  constructor(
    message: string, 
    statusCode: number = ErrorCode.INTERNAL_SERVER_ERROR,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    
    // 保留原始调用栈
    Error.captureStackTrace(this, this.constructor);
  }
  
  // 创建特定类型的错误实例的静态方法
  static badRequest(message: string, code: string = 'BAD_REQUEST', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.BAD_REQUEST, code, context);
  }
  
  static unauthorized(message: string = '未授权', code: string = 'UNAUTHORIZED', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.UNAUTHORIZED, code, context);
  }
  
  static forbidden(message: string = '禁止访问', code: string = 'FORBIDDEN', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.FORBIDDEN, code, context);
  }
  
  static notFound(message: string = '资源不存在', code: string = 'NOT_FOUND', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.NOT_FOUND, code, context);
  }
  
  static internal(message: string = '服务器内部错误', code: string = 'INTERNAL_ERROR', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.INTERNAL_SERVER_ERROR, code, context);
  }
  
  static tooManyRequests(message: string = '请求过于频繁', code: string = 'TOO_MANY_REQUESTS', context?: Record<string, any>): ApiError {
    return new ApiError(message, ErrorCode.TOO_MANY_REQUESTS, code, context);
  }
}

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// 日志记录器接口
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error | ApiError, meta?: Record<string, any>): void;
  fatal(message: string, error?: Error | ApiError, meta?: Record<string, any>): void;
}

// 控制台日志记录器实现
class ConsoleLogger implements Logger {
  private formatMeta(meta?: Record<string, any>): string {
    if (!meta || Object.keys(meta).length === 0) {
      return '';
    }
    
    try {
      return JSON.stringify(meta, null, 2);
    } catch (error) {
      return `[无法序列化元数据: ${error}]`;
    }
  }
  
  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta ? this.formatMeta(meta) : '');
  }
  
  info(message: string, meta?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, meta ? this.formatMeta(meta) : '');
  }
  
  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta ? this.formatMeta(meta) : '');
  }
  
  error(message: string, error?: Error | ApiError, meta?: Record<string, any>): void {
    const combinedMeta = {
      ...meta,
      ...(error && {
        name: error.name,
        stack: error.stack,
        ...(error instanceof ApiError && {
          statusCode: error.statusCode,
          code: error.code,
          context: error.context,
        }),
      }),
    };
    
    console.error(`[ERROR] ${message}`, error, this.formatMeta(combinedMeta));
  }
  
  fatal(message: string, error?: Error | ApiError, meta?: Record<string, any>): void {
    const combinedMeta = {
      ...meta,
      ...(error && {
        name: error.name,
        stack: error.stack,
        ...(error instanceof ApiError && {
          statusCode: error.statusCode,
          code: error.code,
          context: error.context,
        }),
      }),
    };
    
    console.error(`[FATAL] ${message}`, error, this.formatMeta(combinedMeta));
  }
}

// 创建默认日志记录器
const defaultLogger = new ConsoleLogger();

// 可以根据环境创建不同的日志记录器
export const logger = process.env.NODE_ENV === 'production'
  ? defaultLogger // 在生产环境可以使用更高级的日志系统
  : defaultLogger;

// 异常处理中间件工厂
export const createErrorHandler = () => {
  return (error: Error | ApiError, req: any, res: any, next: any) => {
    if (error instanceof ApiError) {
      // 记录API错误
      logger.error(`API错误: ${error.message}`, error, {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        userId: req.user?.id,
      });
      
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
    } else {
      // 记录未知错误
      logger.error(`未处理的错误: ${error.message}`, error, {
        path: req.path,
        method: req.method,
      });
      
      return res.status(ErrorCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  };
};
