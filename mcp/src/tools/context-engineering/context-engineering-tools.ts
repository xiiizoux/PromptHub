/**
 * Context Engineering工具定义和处理器
 * 为MCP路由器提供工具定义和处理函数
 */

import { ToolDescription, MCPToolResponse } from '../../types.js';
import { contextOrchestrator, PipelineConfig } from '../../context-engineering/context-orchestrator.js';
import { ContextRequest } from '../../context-engineering/context-manager.js';
import { unifiedContextManager } from '../../context-engineering/unified-context-manager.js';
import { contextMemoryManager } from '../../context-engineering/context-memory-manager.js';
import { toolExecutionManager } from '../../context-engineering/tool-execution-manager.js';
import { handleToolSuccess, handleToolError } from '../../shared/error-handler.js';
import logger from '../../utils/logger.js';

// ===== Context Engineering 主工具定义 =====

export const contextEngineeringToolDef: ToolDescription = {
  name: 'context_engineering',
  description: 'Context Engineering智能上下文处理工具，提供动态上下文编排、个性化适应和状态管理',
  schema_version: 'v1',
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
      required: false
    },
    preferences: {
      type: 'object',
      description: '用户偏好设置',
      required: false
    }
  }
};

// ===== Context State 查询工具定义 =====

export const contextStateToolDef: ToolDescription = {
  name: 'context_state',
  description: 'Context Engineering状态查询工具，获取用户上下文状态和会话信息',
  schema_version: 'v1',
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
      description: '历史记录数量限制（默认10）',
      required: false
    }
  }
};

// ===== Context Config 配置工具定义 =====

export const contextConfigToolDef: ToolDescription = {
  name: 'context_config',
  description: 'Context Engineering配置工具，管理用户偏好、适应规则和实验设置',
  schema_version: 'v1',
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

// ===== Context Pipeline 流水线管理工具定义 =====

export const contextPipelineToolDef: ToolDescription = {
  name: 'context_pipeline',
  description: 'Context Engineering流水线管理工具，配置和管理处理流水线',
  schema_version: 'v1',
  parameters: {
    action: {
      type: 'string',
      description: '操作类型：list/get/register/update/delete',
      required: true
    },
    pipelineName: {
      type: 'string',
      description: '流水线名称',
      required: false
    },
    pipelineConfig: {
      type: 'object',
      description: '流水线配置（register/update操作时需要）',
      required: false
    }
  }
};

// ===== 工具处理器实现 =====

/**
 * Context Engineering 主处理器
 */
export async function handleContextEngineering(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { promptId?: string; input?: string; sessionId?: string; pipeline?: string; requiredContext?: string[]; preferences?: Record<string, unknown> };
  const typedContext = context as { userId?: string };
  
  try {

    logger.info('执行Context Engineering处理', { 
      promptId: typedParams.promptId,
      userId: typedContext?.userId,
      pipeline: typedParams.pipeline || 'default'
    });

    // 验证必需参数
    if (!typedParams.promptId || !typedParams.input) {
      return handleToolError('context_engineering', new Error('缺少必需参数: promptId 和 input'));
    }

    if (!typedContext?.userId) {
      return handleToolError('context_engineering', new Error('需要用户身份验证'));
    }

    // 构建Context Engineering请求
    const contextRequest: ContextRequest = {
      promptId: typedParams.promptId,
      userId: typedContext.userId,
      currentInput: typedParams.input,
      sessionId: typedParams.sessionId,
      requiredContext: typedParams.requiredContext,
      preferences: typedParams.preferences
    };

    // 选择处理流水线
    const pipeline = typedParams.pipeline || 'default';
    
    // 记录执行开始时间
    const executionStartTime = Date.now();

    // 执行Context Engineering编排
    const orchestrationResult = await contextOrchestrator.orchestrateContext(
      contextRequest,
      pipeline
    );

    // 计算执行时间
    const executionTimeMs = Date.now() - executionStartTime;

    // 记录工具执行上下文（异步，不阻塞响应）
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

    logger.info('Context Engineering处理完成', {
      userId: typedContext.userId,
      promptId: typedParams.promptId,
      processingTime: result.metadata.processingTime,
      pipeline
    });

    return handleToolSuccess(responseData, `Context Engineering处理完成，使用${pipeline}流水线`);

  } catch (error) {
    logger.error('Context Engineering处理失败', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_engineering', error);
  }
}

/**
 * Context State 查询处理器
 */
export async function handleContextState(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { sessionId?: string; includeHistory?: boolean; historyLimit?: number };
  const typedContext = context as { userId?: string };
  
  try {
    logger.info('查询Context Engineering状态', { 
      userId: typedContext?.userId,
      sessionId: typedParams.sessionId
    });

    if (!typedContext?.userId) {
      return handleToolError('context_state', new Error('需要用户身份验证'));
    }

    const userId = typedContext.userId;
    const sessionId = typedParams.sessionId || `session_${Date.now()}`;
    const limit = typedParams.historyLimit || 10;

    // 获取多层上下文状态
    const multiLevelContext = await unifiedContextManager.getMultiLevelContext(sessionId, userId);

    // 构建状态响应
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

    // 如果请求历史记录，查询相关上下文
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

    return handleToolSuccess(state, '上下文状态查询成功');

  } catch (error) {
    logger.error('Context Engineering状态查询失败', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_state', error);
  }
}

/**
 * Context Config 配置处理器
 * 使用 context_memories 表存储配置，memory_type 为 'preference'
 */
export async function handleContextConfig(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { action?: string; configType?: string; configData?: unknown; configId?: string };
  const typedContext = context as { userId?: string };
  
  try {
    logger.info('管理Context Engineering配置', { 
      action: typedParams.action,
      configType: typedParams.configType,
      userId: typedContext?.userId
    });

    if (!typedParams.action || !typedParams.configType) {
      return handleToolError('context_config', new Error('缺少必需参数: action 和 configType'));
    }

    if (!typedContext?.userId) {
      return handleToolError('context_config', new Error('需要用户身份验证'));
    }

    const { action, configType, configData, configId } = typedParams;
    const userId = typedContext.userId;

    // 配置类型映射到记忆类型
    const configTitleMap: Record<string, string> = {
      preferences: 'user_preferences',
      adaptationRules: 'adaptation_rules',
      experiments: 'experiment_config'
    };

    const title = configTitleMap[configType] || configType;
    const memoryType = 'preference' as const;

    switch (action) {
      case 'get':
        // 根据ID或标题获取配置
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
          }, `获取${configType}配置成功（未找到，返回空配置）`);
        }

        return handleToolSuccess({
          configType,
          configId: memory.id,
          data: memory.content,
          metadata: memory.metadata,
          importanceScore: memory.importanceScore,
          updatedAt: memory.updatedAt?.toISOString()
        }, `获取${configType}配置成功`);

      case 'set':
      case 'update':
        if (!configData) {
          return handleToolError('context_config', new Error('set/update操作需要提供configData'));
        }

        // 尝试获取现有配置
        const existingMemory = await contextMemoryManager.getMemoryByTitle(userId, title, memoryType);
        
        if (action === 'set' && existingMemory) {
          // set操作需要先删除旧的
          await contextMemoryManager.deleteMemory(existingMemory.id!, userId);
        }

        // 创建或更新记忆
        const memoryToSave = {
          userId,
          memoryType,
          title,
          content: configData as Record<string, unknown>,
          importanceScore: 0.8, // 配置重要性较高
          relevanceTags: ['config', configType]
        };

        if (action === 'update' && existingMemory) {
          // 更新现有记忆
          const updated = await contextMemoryManager.updateMemory(
            existingMemory.id!,
            userId,
            {
              content: { ...existingMemory.content, ...(configData as Record<string, unknown>) },
              metadata: { ...existingMemory.metadata, lastUpdated: new Date().toISOString() }
            }
          );
          
          if (!updated) {
            return handleToolError('context_config', new Error('更新配置失败'));
          }

          return handleToolSuccess({
            configType,
            configId: updated.id,
            data: updated.content,
            updated: true
          }, `更新${configType}配置成功`);
        } else {
          // 创建新记忆
          const saved = await contextMemoryManager.saveMemory(memoryToSave);
          
          return handleToolSuccess({
            configType,
            configId: saved.id,
            data: saved.content,
            created: true
          }, `${action === 'set' ? '设置' : '创建'}${configType}配置成功`);
        }

      case 'delete':
        if (!configId) {
          return handleToolError('context_config', new Error('delete操作需要提供configId'));
        }
        
        const deleted = await contextMemoryManager.deleteMemory(configId, userId);
        
        if (!deleted) {
          return handleToolError('context_config', new Error('删除配置失败或配置不存在'));
        }

        return handleToolSuccess({
          configType,
          configId,
          deleted: true
        }, `删除${configType}配置成功`);

      case 'list':
        // 列出所有配置
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
        }, `列出配置成功，共${configs.length}个`);

      default:
        return handleToolError('context_config', new Error(`不支持的操作类型: ${action}`));
    }

  } catch (error) {
    logger.error('Context Engineering配置管理失败', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_config', error);
  }
}

/**
 * Context Pipeline 流水线管理处理器
 */
export async function handleContextPipeline(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  const typedParams = params as { action?: string; pipelineName?: string; pipelineConfig?: unknown };
  const typedContext = context as { userId?: string };
  
  try {

    logger.info('管理Context Engineering流水线', { 
      action: typedParams.action,
      pipelineName: typedParams.pipelineName,
      userId: typedContext?.userId
    });

    if (!typedParams.action) {
      return handleToolError('context_pipeline', new Error('缺少必需参数: action'));
    }

    const { action, pipelineName, pipelineConfig } = typedParams;

    switch (action) {
      case 'list':
        const availablePipelines = [
          {
            name: 'default',
            description: '标准Context Engineering流程',
            stages: ['input_analysis', 'context_enrichment', 'personalization_check', 'experiment_assignment'],
            totalTimeout: 15000
          },
          {
            name: 'fast',
            description: '最小化处理，用于高频请求',
            stages: ['basic_context'],
            totalTimeout: 3000
          },
          {
            name: 'deep',
            description: '全功能处理，用于重要请求',
            stages: ['deep_analysis', 'advanced_context', 'ml_personalization', 'adaptive_optimization'],
            totalTimeout: 30000
          }
        ];
        
        return handleToolSuccess({ pipelines: availablePipelines }, '获取流水线列表成功');

      case 'get':
        if (!pipelineName) {
          return handleToolError('context_pipeline', new Error('get操作需要提供pipelineName'));
        }
        
        const pipelineConfigResult = contextOrchestrator.getPipelineConfig(pipelineName);
        if (!pipelineConfigResult) {
          return handleToolError('context_pipeline', new Error(`未找到流水线: ${pipelineName}`));
        }
        
        return handleToolSuccess({ 
          name: pipelineName, 
          config: pipelineConfigResult 
        }, `获取流水线配置成功: ${pipelineName}`);

      case 'register':
        if (!pipelineName || !pipelineConfig) {
          return handleToolError('context_pipeline', new Error('register操作需要提供pipelineName和pipelineConfig'));
        }
        
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig as PipelineConfig);
        
        return handleToolSuccess({ 
          name: pipelineName, 
          registered: true 
        }, `注册流水线成功: ${pipelineName}`);

      case 'update':
        if (!pipelineName || !pipelineConfig) {
          return handleToolError('context_pipeline', new Error('update操作需要提供pipelineName和pipelineConfig'));
        }
        
        // 更新现有流水线
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig as PipelineConfig);
        
        return handleToolSuccess({ 
          name: pipelineName, 
          updated: true 
        }, `更新流水线成功: ${pipelineName}`);

      case 'delete':
        // TODO: 实现删除流水线逻辑
        return handleToolError('context_pipeline', new Error('删除流水线功能暂未实现'));

      default:
        return handleToolError('context_pipeline', new Error(`不支持的操作类型: ${action}`));
    }

  } catch (error) {
    logger.error('Context Engineering流水线管理失败', {
      error: error instanceof Error ? error.message : error,
      params: typedParams
    });

    return handleToolError('context_pipeline', error);
  }
}