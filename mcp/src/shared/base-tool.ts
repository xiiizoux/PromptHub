/**
 * MCP工具基类
 * 提供统一的工具接口和通用功能
 */

import { ToolDescription, MCPToolResponse } from '../types.js';
import { handleToolError, handleToolSuccess, validateRequiredParams } from './error-handler.js';
import { storage, aiAnalyzer } from './services.js';

/**
 * 工具执行上下文
 */
export interface ToolContext {
  userId?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
  metadata?: {
    executionTime?: number;
    cacheHit?: boolean;
    warnings?: string[];
  };
}

/**
 * 抽象工具基类
 */
export abstract class BaseMCPTool {
  /**
   * 工具名称
   */
  abstract readonly name: string;

  /**
   * 工具描述
   */
  abstract readonly description: string;

  /**
   * 工具定义
   */
  abstract getToolDefinition(): ToolDescription;

  /**
   * 工具执行入口
   */
  abstract execute(params: any, context: ToolContext): Promise<ToolResult>;

  /**
   * 获取存储实例
   */
  protected getStorage() {
    return storage;
  }

  /**
   * 获取AI分析器实例
   */
  protected getAIAnalyzer() {
    return aiAnalyzer;
  }

  /**
   * 验证必需参数
   */
  protected validateParams(params: any, requiredFields: string[]): void {
    validateRequiredParams(params, requiredFields);
  }

  /**
   * 创建成功响应
   */
  protected createSuccessResponse(data: any, message?: string): MCPToolResponse {
    return handleToolSuccess(data, message);
  }

  /**
   * 创建错误响应
   */
  protected createErrorResponse(error: Error | string | unknown, customMessage?: string): MCPToolResponse {
    return handleToolError(this.name, error, customMessage);
  }

  /**
   * 记录工具执行日志
   */
  protected logExecution(action: string, context: ToolContext, metadata?: Record<string, unknown>): void {
    // Execution logging disabled - use proper logging framework in production
  }

  /**
   * 处理工具执行
   * 包含错误处理、日志记录、性能监控等通用逻辑
   */
  async handleExecution(params: any, userId?: string): Promise<MCPToolResponse> {
    const context: ToolContext = {
      userId,
      requestId: this.generateRequestId(),
      timestamp: Date.now()
    };

    const startTime = performance.now();

    try {
      this.logExecution('开始执行', context, { params });

      // 执行具体的工具逻辑
      const result = await this.execute(params, context);

      const executionTime = performance.now() - startTime;
      
      this.logExecution('执行完成', context, { 
        success: result.success,
        executionTime: `${executionTime.toFixed(2)}ms`
      });

      if (result.success) {
        return this.createSuccessResponse(result.data, result.message);
      } else {
        return this.createErrorResponse(new Error(result.message || '执行失败'));
      }

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      this.logExecution('执行失败', context, { 
        error: error instanceof Error ? error.message : error,
        executionTime: `${executionTime.toFixed(2)}ms`
      });

      return this.createErrorResponse(error);
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 格式化响应数据
   */
  protected formatResponse(data: Record<string, unknown> | string | number | boolean | null, format: 'json' | 'markdown' | 'plain' = 'json'): string {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(data);
      case 'plain':
        return this.toPlainText(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * 转换为Markdown格式
   */
  private toMarkdown(data: unknown): string {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.map((item, index) => `${index + 1}. ${this.toMarkdown(item)}`).join('\n');
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `**${key}**: ${this.toMarkdown(value)}`)
        .join('\n');
    }
    return String(data);
  }

  /**
   * 转换为纯文本格式
   */
  private toPlainText(data: unknown): string {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.map((item, index) => `${index + 1}. ${this.toPlainText(item)}`).join('\n');
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${this.toPlainText(value)}`)
        .join('\n');
    }
    return String(data);
  }
}

/**
 * 工具注册器
 */
export class ToolRegistry {
  private static tools = new Map<string, BaseMCPTool>();

  /**
   * 注册工具
   */
  static register(tool: BaseMCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 获取工具
   */
  static getTool(name: string): BaseMCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   */
  static getAllTools(): BaseMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具定义列表
   */
  static getToolDefinitions(): ToolDescription[] {
    return this.getAllTools().map(tool => tool.getToolDefinition());
  }

  /**
   * 执行工具
   */
  static async executeTool(name: string, params: any, userId?: string): Promise<MCPToolResponse> {
    const tool = this.getTool(name);
    if (!tool) {
      return handleToolError('工具注册器', new Error(`未找到工具: ${name}`));
    }
    return tool.handleExecution(params, userId);
  }
} 