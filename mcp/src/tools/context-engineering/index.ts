/**
 * Context Engineering MCP工具
 * 为MCP客户端提供Context Engineering功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription } from '../../types.js';
import { contextOrchestrator } from '../../context-engineering/context-orchestrator.js';
import { ContextRequest } from '../../context-engineering/context-manager.js';

/**
 * Context Engineering工具
 * 提供智能上下文处理和个性化内容生成
 */
export class ContextEngineeringTool extends BaseMCPTool {
  readonly name = 'context_engineering';
  readonly description = 'Context Engineering智能上下文处理工具，提供动态上下文编排、个性化适应和状态管理';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: '1.0.0',
      parameters: {
        promptId: {
          type: 'string',
          description: '提示词ID',
          required: true
        },
        input: {
          type: 'string',
          description: '用户输入内容',
          required: true
        },
        sessionId: {
          type: 'string',
          description: '会话ID（可选，用于维持上下文状态）',
          required: false
        },
        pipeline: {
          type: 'string',
          description: '处理流水线类型（default/fast/deep）',
          required: false
        },
        requiredContext: {
          type: 'array',
          description: '需要的上下文类型列表',
          required: false,
          items: {
            type: 'string'
          }
        },
        preferences: {
          type: 'object',
          description: '用户偏好设置',
          required: false
        }
      }
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      this.validateParams(params, ['promptId', 'input']);

      if (!context.userId) {
        return {
          success: false,
          message: '需要用户身份验证才能使用Context Engineering功能'
        };
      }

      // 构建Context Engineering请求
      const contextRequest: ContextRequest = {
        promptId: params.promptId,
        userId: context.userId,
        currentInput: params.input,
        sessionId: params.sessionId,
        requiredContext: params.requiredContext,
        preferences: params.preferences
      };

      // 选择处理流水线
      const pipeline = params.pipeline || 'default';
      
      this.logExecution('开始Context Engineering处理', context, {
        promptId: params.promptId,
        pipeline,
        inputLength: params.input.length
      });

      // 执行Context Engineering编排
      const orchestrationResult = await contextOrchestrator.orchestrateContext(
        contextRequest,
        pipeline
      );

      if (!orchestrationResult.success || !orchestrationResult.result) {
        return {
          success: false,
          message: 'Context Engineering处理失败',
          data: {
            errors: orchestrationResult.errors,
            stagesExecuted: orchestrationResult.stagesExecuted,
            totalTime: orchestrationResult.totalTime
          }
        };
      }

      const result = orchestrationResult.result;

      // 构建响应数据
      const responseData = {
        // 主要结果
        adaptedContent: result.adaptedContent,
        
        // 上下文信息
        contextUsed: result.contextUsed,
        adaptationApplied: result.adaptationApplied,
        personalizations: result.personalizations,
        
        // 实验信息
        experimentVariant: result.experimentVariant,
        effectiveness: result.effectiveness,
        
        // 元数据
        metadata: {
          ...result.metadata,
          pipeline,
          orchestrationTime: orchestrationResult.totalTime,
          stagesExecuted: orchestrationResult.stagesExecuted,
          warnings: orchestrationResult.errors?.map(e => e.error)
        },
        
        // 会话信息
        sessionId: contextRequest.sessionId,
        timestamp: new Date().toISOString()
      };

      this.logExecution('Context Engineering处理完成', context, {
        success: true,
        processingTime: result.metadata.processingTime,
        contextSources: result.metadata.contextSources?.length || 0,
        adaptations: result.adaptationApplied?.length || 0
      });

      return {
        success: true,
        data: responseData,
        message: `Context Engineering处理完成，使用${pipeline}流水线`,
        metadata: {
          executionTime: orchestrationResult.totalTime,
          cacheHit: false,
          warnings: orchestrationResult.errors?.length > 0 ? 
            [`部分阶段执行出现警告: ${orchestrationResult.errors.length}个`] : 
            undefined
        }
      };

    } catch (error) {
      this.logExecution('Context Engineering处理失败', context, {
        error: error instanceof Error ? error.message : error
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Context Engineering处理出现未知错误'
      };
    }
  }
}

/**
 * Context Engineering 状态查询工具
 */
export class ContextStateTool extends BaseMCPTool {
  readonly name = 'context_state';
  readonly description = 'Context Engineering状态查询工具，获取用户上下文状态和会话信息';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: '1.0.0',
      parameters: {
        sessionId: {
          type: 'string',
          description: '会话ID（可选）',
          required: false
        },
        includeHistory: {
          type: 'boolean',
          description: '是否包含历史记录',
          required: false
        },
        historyLimit: {
          type: 'number',
          description: '历史记录数量限制',
          required: false
        }
      }
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      if (!context.userId) {
        return {
          success: false,
          message: '需要用户身份验证才能查询上下文状态'
        };
      }

      // TODO: 实现状态查询逻辑
      // 这里需要从ContextManager中获取用户的上下文状态

      const mockState = {
        userId: context.userId,
        activeSessions: [],
        personalizedData: {
          preferences: {},
          learningData: {},
          usagePatterns: [],
          contextualMemory: []
        },
        adaptationRules: [],
        experiments: []
      };

      return {
        success: true,
        data: mockState,
        message: '上下文状态查询成功'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '状态查询失败'
      };
    }
  }
}

/**
 * Context Engineering 配置工具
 */
export class ContextConfigTool extends BaseMCPTool {
  readonly name = 'context_config';
  readonly description = 'Context Engineering配置工具，管理用户偏好、适应规则和实验设置';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: '1.0.0',
      parameters: {
        action: {
          type: 'string',
          description: '操作类型：get/set/update/delete',
          required: true
        },
        configType: {
          type: 'string',
          description: '配置类型：preferences/adaptationRules/experiments',
          required: true
        },
        configData: {
          type: 'object',
          description: '配置数据（set/update操作时需要）',
          required: false
        },
        configId: {
          type: 'string',
          description: '配置ID（update/delete操作时需要）',
          required: false
        }
      }
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    try {
      this.validateParams(params, ['action', 'configType']);

      if (!context.userId) {
        return {
          success: false,
          message: '需要用户身份验证才能管理配置'
        };
      }

      const { action, configType, configData, configId } = params;

      // TODO: 实现配置管理逻辑
      // 这里需要与数据库交互，管理用户的Context Engineering配置

      switch (action) {
        case 'get':
          return {
            success: true,
            data: {
              configType,
              data: {} // TODO: 从数据库获取配置
            },
            message: `获取${configType}配置成功`
          };

        case 'set':
        case 'update':
          if (!configData) {
            return {
              success: false,
              message: 'set/update操作需要提供configData'
            };
          }
          
          // TODO: 保存配置到数据库
          
          return {
            success: true,
            data: {
              configType,
              configId: configId || `${configType}_${Date.now()}`,
              data: configData
            },
            message: `${action === 'set' ? '设置' : '更新'}${configType}配置成功`
          };

        case 'delete':
          if (!configId) {
            return {
              success: false,
              message: 'delete操作需要提供configId'
            };
          }
          
          // TODO: 从数据库删除配置
          
          return {
            success: true,
            data: {
              configType,
              configId,
              deleted: true
            },
            message: `删除${configType}配置成功`
          };

        default:
          return {
            success: false,
            message: `不支持的操作类型: ${action}`
          };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '配置管理失败'
      };
    }
  }
}

// 导出所有Context Engineering工具
export const contextEngineeringTools = [
  new ContextEngineeringTool(),
  new ContextStateTool(),
  new ContextConfigTool()
];