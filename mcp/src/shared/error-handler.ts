/**
 * 统一错误处理器
 * 为MCP工具提供标准化的错误处理和响应格式
 */

import { MCPToolResponse } from '../types.js';
import logger from '../utils/logger.js';

// 错误类型枚举
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  STORAGE = 'storage',
  NETWORK = 'network',
  INTERNAL = 'internal',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 增强的错误接口
export interface EnhancedError extends Error {
  type?: ErrorType;
  severity?: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  userId?: string;
  toolName?: string;
}

/**
 * 分析错误类型和严重程度
 */
function analyzeError(error: any): { type: ErrorType; severity: ErrorSeverity } {
  const errorMessage = (error?.message || error || '').toLowerCase();

  // 验证错误
  if (errorMessage.includes('缺少必需参数') || errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
  }

  // 认证错误
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('token')) {
    return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.MEDIUM };
  }

  // 权限错误
  if (errorMessage.includes('forbidden') || errorMessage.includes('permission') || errorMessage.includes('access denied')) {
    return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM };
  }

  // 存储错误
  if (errorMessage.includes('database') || errorMessage.includes('storage') || errorMessage.includes('supabase')) {
    return { type: ErrorType.STORAGE, severity: ErrorSeverity.HIGH };
  }

  // 网络错误
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM };
  }

  // 未找到错误
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return { type: ErrorType.NOT_FOUND, severity: ErrorSeverity.LOW };
  }

  // 默认为内部错误
  return { type: ErrorType.INTERNAL, severity: ErrorSeverity.HIGH };
}

/**
 * 处理工具执行错误
 * @param toolName 工具名称
 * @param error 错误对象
 * @param customMessage 自定义错误消息
 * @param context 错误上下文
 * @returns 标准化的错误响应
 */
export function handleToolError(
  toolName: string,
  error: any,
  customMessage?: string,
  context?: Record<string, any>
): MCPToolResponse {
  const errorMessage = error?.message || error || '未知错误';
  const { type, severity } = analyzeError(error);

  // 生成错误ID用于追踪
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 构建增强的错误对象
  const enhancedError: EnhancedError = {
    name: error?.name || 'Error',
    message: errorMessage,
    type,
    severity,
    code: error?.code,
    context: {
      toolName,
      errorId,
      timestamp: new Date().toISOString(),
      ...context
    },
    toolName,
    stack: error?.stack
  };

  // 根据严重程度选择日志级别
  const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' :
                   severity === ErrorSeverity.HIGH ? 'error' :
                   severity === ErrorSeverity.MEDIUM ? 'warn' : 'info';

  // 记录结构化错误日志
  logger[logLevel]('Tool execution error', {
    toolName,
    errorId,
    type,
    severity,
    message: errorMessage,
    context,
    stack: error?.stack
  });

  // 构建用户友好的错误消息
  const userMessage = customMessage || `${toolName}执行失败，请重试`;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: userMessage,
        errorId,
        type,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  };
}

/**
 * 处理成功响应
 * @param data 响应数据
 * @param message 成功消息
 * @param toolName 工具名称（用于日志）
 * @param context 成功上下文
 * @returns 标准化的成功响应
 */
export function handleToolSuccess(
  data: any,
  message?: string,
  toolName?: string,
  context?: Record<string, any>
): MCPToolResponse {
  // 记录成功日志
  if (toolName) {
    logger.info('Tool execution success', {
      toolName,
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  };
}

/**
 * 创建简单的文本响应
 * @param text 响应文本
 * @returns MCPToolResponse
 */
export function createTextResponse(text: string): MCPToolResponse {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}

/**
 * 验证必需参数
 * @param params 参数对象
 * @param requiredFields 必需字段列表
 * @throws EnhancedError 如果缺少必需参数
 */
export function validateRequiredParams(params: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field =>
    params[field] === undefined || params[field] === null || params[field] === ''
  );

  if (missingFields.length > 0) {
    const error = new Error(`缺少必需参数: ${missingFields.join(', ')}`) as EnhancedError;
    error.type = ErrorType.VALIDATION;
    error.severity = ErrorSeverity.LOW;
    error.context = { missingFields, providedParams: Object.keys(params) };
    throw error;
  }
}

/**
 * 创建增强错误
 * @param message 错误消息
 * @param type 错误类型
 * @param severity 错误严重程度
 * @param context 错误上下文
 * @returns EnhancedError
 */
export function createEnhancedError(
  message: string,
  type: ErrorType = ErrorType.INTERNAL,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>
): EnhancedError {
  const error = new Error(message) as EnhancedError;
  error.type = type;
  error.severity = severity;
  error.context = context;
  return error;
}

/**
 * 安全的JSON序列化
 * @param obj 要序列化的对象
 * @param space 缩进空格数
 * @returns 序列化后的字符串
 */
export function safeJsonStringify(obj: any, space: number = 2): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // 过滤敏感信息
      if (typeof key === 'string' && (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')
      )) {
        return '[REDACTED]';
      }
      return value;
    }, space);
  } catch (error) {
    logger.warn('JSON序列化失败', { error: error.message });
    return JSON.stringify({ error: '序列化失败' }, null, space);
  }
}