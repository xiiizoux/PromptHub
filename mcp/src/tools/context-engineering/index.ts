/**
 * Context Engineering MCP tools
 * Provides Context Engineering functionality for MCP clients
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription } from '../../types.js';
import { contextOrchestrator } from '../../context-engineering/context-orchestrator.js';
import { ContextRequest } from '../../context-engineering/context-manager.js';

/**
 * Context Engineering tool
 * Provides intelligent context processing and personalized content generation
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
          description: 'Prompt ID',
          required: true
        },
        input: {
          type: 'string',
          description: 'User input content',
          required: true
        },
        sessionId: {
          type: 'string',
          description: 'Session ID (optional, for maintaining context state)',
          required: false
        },
        pipeline: {
          type: 'string',
          description: 'Processing pipeline type (default/fast/deep)',
          required: false
        },
        requiredContext: {
          type: 'array',
          description: 'List of required context types',
          required: false,
          items: {
            type: 'string'
          }
        },
        preferences: {
          type: 'object',
          description: 'User preference settings',
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
          message: 'User authentication required to use Context Engineering functionality'
        };
      }

      // 🔒 Permission verification: Context functionality is only for prompt creators
      const { storage } = await import('../../shared/services.js');
      const prompt = await storage.getPrompt(params.promptId, context.userId);
      
      if (!prompt) {
        return {
          success: false,
          message: `Prompt does not exist: ${params.promptId}`
        };
      }

      // Verify if user is the prompt creator
      const isOwner = prompt.user_id === context.userId || 
                      prompt.created_by === context.userId;
      
      if (!isOwner) {
        return {
          success: false,
          message: 'Context functionality is only for prompt creators. You are not the creator of this prompt and cannot use context functionality.'
        };
      }

      // Build Context Engineering request
      const contextRequest: ContextRequest = {
        promptId: params.promptId,
        userId: context.userId,
        currentInput: params.input,
        sessionId: params.sessionId,
        requiredContext: params.requiredContext,
        preferences: params.preferences
      };

      // Select processing pipeline
      const pipeline = params.pipeline || 'default';
      
      this.logExecution('Starting Context Engineering processing', context, {
        promptId: params.promptId,
        pipeline,
        inputLength: params.input.length
      });

      // Execute Context Engineering orchestration
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

      // Build response data
      const responseData = {
        // Main result
        adaptedContent: result.adaptedContent,
        
        // Context information
        contextUsed: result.contextUsed,
        adaptationApplied: result.adaptationApplied,
        personalizations: result.personalizations,
        
        // Experiment information
        experimentVariant: result.experimentVariant,
        effectiveness: result.effectiveness,
        
        // Metadata
        metadata: {
          ...result.metadata,
          pipeline,
          orchestrationTime: orchestrationResult.totalTime,
          stagesExecuted: orchestrationResult.stagesExecuted,
          warnings: orchestrationResult.errors?.map(e => e.error)
        },
        
        // Session information
        sessionId: contextRequest.sessionId,
        timestamp: new Date().toISOString()
      };

      this.logExecution('Context Engineering processing completed', context, {
        success: true,
        processingTime: result.metadata.processingTime,
        contextSources: result.metadata.contextSources?.length || 0,
        adaptations: result.adaptationApplied?.length || 0
      });

      return {
        success: true,
        data: responseData,
        message: `Context Engineering processing completed, using ${pipeline} pipeline`,
        metadata: {
          executionTime: orchestrationResult.totalTime,
          cacheHit: false,
          warnings: orchestrationResult.errors?.length > 0 ? 
            [`Some stages executed with warnings: ${orchestrationResult.errors.length}`] : 
            undefined
        }
      };

    } catch (error) {
      this.logExecution('Context Engineering processing failed', context, {
        error: error instanceof Error ? error.message : error
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during Context Engineering processing'
      };
    }
  }
}

/**
 * Context Engineering state query tool
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
          description: 'Session ID (optional)',
          required: false
        },
        includeHistory: {
          type: 'boolean',
          description: 'Whether to include history',
          required: false
        },
        historyLimit: {
          type: 'number',
          description: 'History record limit',
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
          message: 'User authentication required to query context state'
        };
      }

      // TODO: Implement state query logic
      // Need to get user's context state from ContextManager

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
        message: 'Context state query successful'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'State query failed'
      };
    }
  }
}

/**
 * Context Engineering configuration tool
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
          description: 'Action type: get/set/update/delete',
          required: true
        },
        configType: {
          type: 'string',
          description: 'Configuration type: preferences/adaptationRules/experiments',
          required: true
        },
        configData: {
          type: 'object',
          description: 'Configuration data (required for set/update operations)',
          required: false
        },
        configId: {
          type: 'string',
          description: 'Configuration ID (required for update/delete operations)',
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
          message: 'User authentication required to manage configuration'
        };
      }

      const { action, configType, configData, configId } = params;

      // TODO: Implement configuration management logic
      // Need to interact with database to manage user's Context Engineering configuration

      switch (action) {
        case 'get':
          return {
            success: true,
            data: {
              configType,
              data: {} // TODO: Get configuration from database
            },
            message: `Get ${configType} configuration successful`
          };

        case 'set':
        case 'update':
          if (!configData) {
            return {
              success: false,
              message: 'set/update operations require configData'
            };
          }
          
          // TODO: Save configuration to database
          
          return {
            success: true,
            data: {
              configType,
              configId: configId || `${configType}_${Date.now()}`,
              data: configData
            },
            message: `${action === 'set' ? 'Set' : 'Update'} ${configType} configuration successful`
          };

        case 'delete':
          if (!configId) {
            return {
              success: false,
              message: 'delete operation requires configId'
            };
          }
          
          // TODO: Delete configuration from database
          
          return {
            success: true,
            data: {
              configType,
              configId,
              deleted: true
            },
            message: `Delete ${configType} configuration successful`
          };

        default:
          return {
            success: false,
            message: `Unsupported action type: ${action}`
          };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Configuration management failed'
      };
    }
  }
}

// Export all Context Engineering tools
export const contextEngineeringTools = [
  new ContextEngineeringTool(),
  new ContextStateTool(),
  new ContextConfigTool()
];