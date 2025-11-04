/**
 * Context Engineering tool definitions and handlers
 * Provides tool definitions and handler functions for MCP router
 */

import { ToolDescription, MCPToolResponse } from '../../types.js';
import { contextOrchestrator, PipelineConfig } from '../../context-engineering/context-orchestrator.js';
import { ContextRequest } from '../../context-engineering/context-manager.js';
import { unifiedContextManager } from '../../context-engineering/unified-context-manager.js';
import { contextMemoryManager } from '../../context-engineering/context-memory-manager.js';
import { toolExecutionManager } from '../../context-engineering/tool-execution-manager.js';
import { handleToolSuccess, handleToolError } from '../../shared/error-handler.js';
import logger from '../../utils/logger.js';

// ===== Context Engineering Main Tool Definition =====

export const contextEngineeringToolDef: ToolDescription = {
  name: 'context_engineering',
  description: 'Context Engineering智能上下文处理工具，提供动态上下文编排、个性化适应和状态管理',
  schema_version: 'v1',
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
      required: false
    },
    preferences: {
      type: 'object',
      description: 'User preference settings',
      required: false
    }
  }
};

// ===== Context State Query Tool Definition =====

export const contextStateToolDef: ToolDescription = {
  name: 'context_state',
  description: 'Context Engineering状态查询工具，获取用户上下文状态和会话信息',
  schema_version: 'v1',
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
      description: 'History record limit (default 10)',
      required: false
    }
  }
};

// ===== Context Config Configuration Tool Definition =====

export const contextConfigToolDef: ToolDescription = {
  name: 'context_config',
  description: 'Context Engineering配置工具，管理用户偏好、适应规则和实验设置',
  schema_version: 'v1',
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

// ===== Context Pipeline Pipeline Management Tool Definition =====

export const contextPipelineToolDef: ToolDescription = {
  name: 'context_pipeline',
  description: 'Context Engineering流水线管理工具，配置和管理处理流水线',
  schema_version: 'v1',
  parameters: {
    action: {
      type: 'string',
      description: 'Action type: list/get/register/update/delete',
      required: true
    },
    pipelineName: {
      type: 'string',
      description: 'Pipeline name',
      required: false
    },
    pipelineConfig: {
      type: 'object',
      description: 'Pipeline configuration (required for register/update operations)',
      required: false
    }
  }
};

// ===== Tool Handler Implementation =====

/**
 * Context Engineering main handler
 */
export async function handleContextEngineering(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { promptId?: string; input?: string; sessionId?: string; pipeline?: string; requiredContext?: string[]; preferences?: Record<string, unknown> };
  const typedContext = context as { userId?: string };
  
  try {

    logger.info('Executing Context Engineering processing', { 
      promptId: typedParams.promptId,
      userId: typedContext?.userId,
      pipeline: typedParams.pipeline || 'default'
    });

    // Validate required parameters
    if (!typedParams.promptId || !typedParams.input) {
      return handleToolError('context_engineering', new Error('Missing required parameters: promptId and input'));
    }

    if (!typedContext?.userId) {
      return handleToolError('context_engineering', new Error('User authentication required'));
    }

    // 🔒 Permission verification: Context functionality is only for prompt creators
    const { storage } = await import('../../shared/services.js');
    const prompt = await storage.getPrompt(typedParams.promptId, typedContext.userId);
    
    if (!prompt) {
      return handleToolError('context_engineering', new Error(`Prompt does not exist: ${typedParams.promptId}`));
    }

    // Verify if user is the prompt creator
    const isOwner = prompt.user_id === typedContext.userId || 
                    prompt.created_by === typedContext.userId;
    
    if (!isOwner) {
      logger.warn('Context Engineering access denied: User is not prompt creator', {
        userId: typedContext.userId,
        promptId: typedParams.promptId,
        promptOwnerId: prompt.user_id || prompt.created_by
      });
      return handleToolError('context_engineering', new Error('Context functionality is only for prompt creators. You are not the creator of this prompt and cannot use context functionality.'));
    }

    // Build Context Engineering request
    const contextRequest: ContextRequest = {
      promptId: typedParams.promptId,
      userId: typedContext.userId,
      currentInput: typedParams.input,
      sessionId: typedParams.sessionId,
      requiredContext: typedParams.requiredContext,
      preferences: typedParams.preferences
    };

    // Select processing pipeline
    const pipeline = typedParams.pipeline || 'default';
    
    // Record execution start time
    const executionStartTime = Date.now();

    // Execute Context Engineering orchestration
    const orchestrationResult = await contextOrchestrator.orchestrateContext(
      contextRequest,
      pipeline
    );

    // Calculate execution time
    const executionTimeMs = Date.now() - executionStartTime;

    // Record tool execution context (asynchronous, non-blocking)
    toolExecutionManager.recordExecution({
      toolName: 'context_engineering',
      userId: typedContext.userId,
      sessionId: typedParams.sessionId,
      inputParams: {
        promptId: typedParams.promptId,
        pipeline,
        requiredContext: typedParams.requiredContext
      },
      contextSnapshot: {
        userId: typedContext.userId,
        sessionId: typedParams.sessionId,
        pipeline
      },
      executionResult: orchestrationResult.success ? {
        success: true,
        stagesExecuted: orchestrationResult.stagesExecuted
      } : {
        success: false,
        errors: orchestrationResult.errors
      },
      executionTimeMs,
      contextEnhanced: true
    }).catch(err => {
      logger.warn('记录工具执行上下文失败', { error: err });
    });

    if (!orchestrationResult.success || !orchestrationResult.result) {
      return handleToolError('context_engineering', new Error('Context Engineering处理失败'));
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

    logger.info('Context Engineering processing completed', {
      userId: typedContext.userId,
      promptId: typedParams.promptId,
      processingTime: result.metadata.processingTime,
      pipeline
    });

    return handleToolSuccess(responseData, `Context Engineering processing completed, using ${pipeline} pipeline`);

  } catch (error) {
    logger.error('Context Engineering processing failed', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_engineering', error);
  }
}

/**
 * Context State query handler
 */
export async function handleContextState(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { sessionId?: string; includeHistory?: boolean; historyLimit?: number };
  const typedContext = context as { userId?: string };
  
  try {
    logger.info('Querying Context Engineering state', { 
      userId: typedContext?.userId,
      sessionId: typedParams.sessionId
    });

    if (!typedContext?.userId) {
      return handleToolError('context_state', new Error('User authentication required'));
    }

    // 🔒 Permission verification: context_state needs to verify creator permissions when associated with specific prompts
    // If sessionId is provided, need to verify if the prompt associated with that session belongs to current user
    // Since context_state queries user-level context state, allow users to query their own context state for now
    // If stricter verification is needed, can add promptId-based verification logic later
    
    const userId = typedContext.userId;
    const sessionId = typedParams.sessionId || `session_${Date.now()}`;
    const limit = typedParams.historyLimit || 10;

    // Get multi-level context state
    const multiLevelContext = await unifiedContextManager.getMultiLevelContext(sessionId, userId);

    // Build state response
    const state = {
      userId,
      sessionId,
      contextLevels: {
        session: multiLevelContext.session ? {
          contextLevel: multiLevelContext.session.contextLevel,
          dataKeys: Object.keys(multiLevelContext.session.contextData),
          metadata: multiLevelContext.session.metadata,
          updatedAt: multiLevelContext.session.updatedAt.toISOString(),
          expiresAt: multiLevelContext.session.expiresAt?.toISOString()
        } : null,
        user: multiLevelContext.user ? {
          contextLevel: multiLevelContext.user.contextLevel,
          dataKeys: Object.keys(multiLevelContext.user.contextData),
          metadata: multiLevelContext.user.metadata,
          updatedAt: multiLevelContext.user.updatedAt.toISOString(),
          expiresAt: multiLevelContext.user.expiresAt?.toISOString()
        } : null,
        global: multiLevelContext.global ? {
          contextLevel: multiLevelContext.global.contextLevel,
          dataKeys: Object.keys(multiLevelContext.global.contextData),
          metadata: multiLevelContext.global.metadata,
          updatedAt: multiLevelContext.global.updatedAt.toISOString(),
          expiresAt: multiLevelContext.global.expiresAt?.toISOString()
        } : null
      },
      mergedContext: {
        dataKeys: Object.keys(multiLevelContext.merged),
        data: multiLevelContext.merged
      },
      statistics: {
        sessionContextSize: multiLevelContext.session ? Object.keys(multiLevelContext.session.contextData).length : 0,
        userContextSize: multiLevelContext.user ? Object.keys(multiLevelContext.user.contextData).length : 0,
        globalContextSize: multiLevelContext.global ? Object.keys(multiLevelContext.global.contextData).length : 0,
        mergedContextSize: Object.keys(multiLevelContext.merged).length
      }
    };

    // If history is requested, query related context
    if (typedParams.includeHistory) {
      const historyContexts = await unifiedContextManager.queryContext('', {
        sessionId,
        userId,
        limit
      });
      
      state['history'] = historyContexts.map(ctx => ({
        sessionId: ctx.sessionId,
        contextLevel: ctx.contextLevel,
        dataKeys: Object.keys(ctx.contextData),
        updatedAt: ctx.updatedAt.toISOString(),
        expiresAt: ctx.expiresAt?.toISOString()
      }));
    }

    return handleToolSuccess(state, 'Context state query successful');

  } catch (error) {
    logger.error('Context Engineering state query failed', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_state', error);
  }
}

/**
 * Context Config configuration handler
 * Uses context_memories table to store configuration, memory_type is 'preference'
 */
export async function handleContextConfig(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { action?: string; configType?: string; configData?: unknown; configId?: string };
  const typedContext = context as { userId?: string };
  
  try {
    logger.info('Managing Context Engineering configuration', { 
      action: typedParams.action,
      configType: typedParams.configType,
      userId: typedContext?.userId
    });

    if (!typedParams.action || !typedParams.configType) {
      return handleToolError('context_config', new Error('Missing required parameters: action and configType'));
    }

    if (!typedContext?.userId) {
      return handleToolError('context_config', new Error('User authentication required'));
    }

    // 🔒 Permission verification: context_config manages user-level configuration
    // Since configuration is user-level, only verify user identity here
    // Configuration data itself is isolated by user_id, ensuring users can only access their own configuration
    
    const { action, configType, configData, configId } = typedParams;
    const userId = typedContext.userId;

    // Map configuration type to memory type
    const configTitleMap: Record<string, string> = {
      preferences: 'user_preferences',
      adaptationRules: 'adaptation_rules',
      experiments: 'experiment_config'
    };

    const title = configTitleMap[configType] || configType;
    const memoryType = 'preference' as const;

    switch (action) {
      case 'get':
        // Get configuration by ID or title
        let memory;
        if (configId) {
          memory = await contextMemoryManager.getMemoryById(configId, userId);
        } else {
          memory = await contextMemoryManager.getMemoryByTitle(userId, title, memoryType);
        }

        if (!memory) {
          return handleToolSuccess({
            configType,
            data: {}
          }, `Get ${configType} configuration successful (not found, returning empty configuration)`);
        }

        return handleToolSuccess({
          configType,
          configId: memory.id,
          data: memory.content,
          metadata: memory.metadata,
          importanceScore: memory.importanceScore,
          updatedAt: memory.updatedAt?.toISOString()
        }, `Get ${configType} configuration successful`);

      case 'set':
      case 'update':
        if (!configData) {
          return handleToolError('context_config', new Error('set/update operations require configData'));
        }

        // Try to get existing configuration
        const existingMemory = await contextMemoryManager.getMemoryByTitle(userId, title, memoryType);
        
        if (action === 'set' && existingMemory) {
          // set operation needs to delete old one first
          await contextMemoryManager.deleteMemory(existingMemory.id!, userId);
        }

        // Create or update memory
        const memoryToSave = {
          userId,
          memoryType,
          title,
          content: configData as Record<string, unknown>,
          importanceScore: 0.8, // Configuration has high importance
          relevanceTags: ['config', configType]
        };

        if (action === 'update' && existingMemory) {
          // Update existing memory
          const updated = await contextMemoryManager.updateMemory(
            existingMemory.id!,
            userId,
            {
              content: { ...existingMemory.content, ...(configData as Record<string, unknown>) },
              metadata: { ...existingMemory.metadata, lastUpdated: new Date().toISOString() }
            }
          );
          
          if (!updated) {
            return handleToolError('context_config', new Error('Update configuration failed'));
          }

          return handleToolSuccess({
            configType,
            configId: updated.id,
            data: updated.content,
            updated: true
          }, `Update ${configType} configuration successful`);
        } else {
          // Create new memory
          const saved = await contextMemoryManager.saveMemory(memoryToSave);
          
          return handleToolSuccess({
            configType,
            configId: saved.id,
            data: saved.content,
            created: true
          }, `${action === 'set' ? 'Set' : 'Create'} ${configType} configuration successful`);
        }

      case 'delete':
        if (!configId) {
          return handleToolError('context_config', new Error('delete operation requires configId'));
        }
        
        const deleted = await contextMemoryManager.deleteMemory(configId, userId);
        
        if (!deleted) {
          return handleToolError('context_config', new Error('Delete configuration failed or configuration does not exist'));
        }

        return handleToolSuccess({
          configType,
          configId,
          deleted: true
        }, `Delete ${configType} configuration successful`);

      case 'list':
        // List all configurations
        const memories = await contextMemoryManager.queryMemories({
          userId,
          memoryType: 'preference',
          relevanceTags: ['config'],
          limit: 100
        });

        const configs = memories.map(m => ({
          configId: m.id,
          configType: m.relevanceTags?.find(t => t !== 'config') || 'unknown',
          title: m.title,
          importanceScore: m.importanceScore,
          updatedAt: m.updatedAt?.toISOString()
        }));

        return handleToolSuccess({
          configs,
          total: configs.length
        }, `List configurations successful, total ${configs.length}`);

      default:
        return handleToolError('context_config', new Error(`Unsupported action type: ${action}`));
    }

  } catch (error) {
    logger.error('Context Engineering configuration management failed', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_config', error);
  }
}

/**
 * Context Pipeline pipeline management handler
 */
export async function handleContextPipeline(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { action?: string; pipelineName?: string; pipelineConfig?: unknown };
  const typedContext = context as { userId?: string };
  
  try {

    logger.info('Managing Context Engineering pipeline', { 
      action: typedParams.action,
      pipelineName: typedParams.pipelineName,
      userId: typedContext?.userId
    });

    if (!typedParams.action) {
      return handleToolError('context_pipeline', new Error('Missing required parameter: action'));
    }

    const { action, pipelineName, pipelineConfig } = typedParams;

    switch (action) {
      case 'list':
        const availablePipelines = [
          {
            name: 'default',
            description: 'Standard Context Engineering process',
            stages: ['input_analysis', 'context_enrichment', 'personalization_check', 'experiment_assignment'],
            totalTimeout: 15000
          },
          {
            name: 'fast',
            description: 'Minimal processing for high-frequency requests',
            stages: ['basic_context'],
            totalTimeout: 3000
          },
          {
            name: 'deep',
            description: 'Full-featured processing for important requests',
            stages: ['deep_analysis', 'advanced_context', 'ml_personalization', 'adaptive_optimization'],
            totalTimeout: 30000
          }
        ];
        
        return handleToolSuccess({ pipelines: availablePipelines }, 'Get pipeline list successful');

      case 'get':
        if (!pipelineName) {
          return handleToolError('context_pipeline', new Error('get operation requires pipelineName'));
        }
        
        const pipelineConfigResult = contextOrchestrator.getPipelineConfig(pipelineName);
        if (!pipelineConfigResult) {
          return handleToolError('context_pipeline', new Error(`Pipeline not found: ${pipelineName}`));
        }
        
        return handleToolSuccess({ 
          name: pipelineName, 
          config: pipelineConfigResult 
        }, `Get pipeline configuration successful: ${pipelineName}`);

      case 'register':
        if (!pipelineName || !pipelineConfig) {
          return handleToolError('context_pipeline', new Error('register operation requires pipelineName and pipelineConfig'));
        }
        
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig as PipelineConfig);
        
        return handleToolSuccess({ 
          name: pipelineName, 
          registered: true 
        }, `Register pipeline successful: ${pipelineName}`);

      case 'update':
        if (!pipelineName || !pipelineConfig) {
          return handleToolError('context_pipeline', new Error('update operation requires pipelineName and pipelineConfig'));
        }
        
        // Update existing pipeline
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig as PipelineConfig);
        
        return handleToolSuccess({ 
          name: pipelineName, 
          updated: true 
        }, `Update pipeline successful: ${pipelineName}`);

      case 'delete':
        // TODO: Implement delete pipeline logic
        return handleToolError('context_pipeline', new Error('Delete pipeline functionality not yet implemented'));

      default:
        return handleToolError('context_pipeline', new Error(`Unsupported action type: ${action}`));
    }

  } catch (error) {
    logger.error('Context Engineering pipeline management failed', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_pipeline', error);
  }
}