/**
 * 统一响应格式化器
 */

import { MCPToolResponse } from '../types.js';

export enum ResponseType {
  Success = 'success',
  Error = 'error'
}

export class ResponseFormatter {
  static success(data: unknown, message?: string): MCPToolResponse {
    return {
      content: [{
        type: 'text',
        text: `✅ **${message || '成功'}**\n\n${JSON.stringify(data, null, 2)}`
      }]
    };
  }

  static error(message: string, details?: unknown): MCPToolResponse {
    return {
      content: [{
        type: 'text',
        text: `❌ **错误: ${message}**\n\n${details ? JSON.stringify(details, null, 2) : ''}`
      }]
    };
  }
} 