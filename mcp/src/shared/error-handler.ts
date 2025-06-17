/**
 * 统一错误处理器
 * 为MCP工具提供标准化的错误处理和响应格式
 */

import { MCPToolResponse } from '../types.js';

/**
 * 处理工具执行错误
 * @param toolName 工具名称
 * @param error 错误对象
 * @param customMessage 自定义错误消息
 * @returns 标准化的错误响应
 */
export function handleToolError(
  toolName: string, 
  error: any, 
  customMessage?: string
): MCPToolResponse {
  const errorMessage = error?.message || error || '未知错误';
  
  // 记录错误日志
  console.error(`[${toolName}] 错误:`, errorMessage);
  if (error?.stack) {
    console.debug(`[${toolName}] 错误堆栈:`, error.stack);
  }

  // 构建用户友好的错误消息
  const userMessage = customMessage || `${toolName}执行失败，请重试`;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, null, 2)
    }]
  };
}

/**
 * 处理成功响应
 * @param data 响应数据
 * @param message 成功消息
 * @returns 标准化的成功响应
 */
export function handleToolSuccess(
  data: any, 
  message?: string
): MCPToolResponse {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message,
        data
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
 * @throws Error 如果缺少必需参数
 */
export function validateRequiredParams(params: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => 
    params[field] === undefined || params[field] === null || params[field] === ''
  );
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必需参数: ${missingFields.join(', ')}`);
  }
} 