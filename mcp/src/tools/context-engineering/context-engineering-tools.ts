/**
 * Context Engineering工具定义和处理器
 * 为MCP路由器提供工具定义和处理函数
 */

import { ToolDescription, MCPToolResponse } from '../../types.js';
import { contextOrchestrator } from '../../context-engineering/context-orchestrator.js';
import { ContextRequest } from '../../context-engineering/context-manager.js';
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
  try {
    const typedParams = params as { promptId?: string; input?: string; sessionId?: string; pipeline?: string; requiredContext?: string[]; preferences?: Record<string, unknown> };
    const typedContext = context as { userId?: string };

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
    
    // 执行Context Engineering编排
    const orchestrationResult = await contextOrchestrator.orchestrateContext(
      contextRequest,
      pipeline
    );

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
  try {
    const typedParams = params as { sessionId?: string; includeHistory?: boolean; historyLimit?: number };
    const typedContext = context as { userId?: string };

    logger.info('查询Context Engineering状态', { 
      userId: typedContext?.userId,
      sessionId: typedParams.sessionId
    });

    if (!typedContext?.userId) {
      return handleToolError('context_state', new Error('需要用户身份验证'));
    }

    // TODO: 实现状态查询逻辑
    // 这里需要从ContextManager中获取用户的上下文状态
    // 当前返回模拟数据

    const mockState = {
      userId: typedContext.userId,
      activeSessions: [
        {
          sessionId: typedParams.sessionId || 'mock_session_1',
          status: 'active',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          interactions: 5
        }
      ],
      personalizedData: {
        preferences: {
          responseStyle: 'concise',
          complexity: 'medium',
          language: 'zh-CN'
        },
        learningData: {
          frequentTopics: ['technology', 'programming'],
          preferredFormats: ['markdown', 'json']
        },
        usagePatterns: [
          {
            pattern: 'technical_questions',
            frequency: 15,
            effectiveness: 0.85,
            lastUsed: new Date().toISOString()
          }
        ],
        contextualMemory: [
          {
            key: 'preferred_programming_language',
            value: 'TypeScript',
            relevanceScore: 0.9,
            lastAccessed: new Date().toISOString()
          }
        ]
      },
      adaptationRules: [
        {
          id: 'rule_1',
          name: '技术问题简化',
          condition: 'contains(input, "技术")',
          priority: 10,
          isActive: true
        }
      ],
      experiments: [
        {
          experimentId: 'exp_001',
          variant: 'control',
          status: 'active',
          startDate: new Date().toISOString()
        }
      ],
      statistics: {
        totalInteractions: 25,
        averageResponseTime: 1.2,
        satisfactionScore: 4.3
      }
    };

    return handleToolSuccess(mockState, '上下文状态查询成功');

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
 */
export async function handleContextConfig(params: unknown, context?: unknown): Promise<MCPToolResponse> {
  try {
    const typedParams = params as { action?: string; configType?: string; configData?: unknown; configId?: string };
    const typedContext = context as { userId?: string };

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

    // TODO: 实现配置管理逻辑
    // 这里需要与数据库交互，管理用户的Context Engineering配置

    switch (action) {
      case 'get':
        const mockGetResult = {
          configType,
          data: {
            preferences: { responseStyle: 'detailed' },
            adaptationRules: [],
            experiments: []
          }[configType] || {}
        };
        return handleToolSuccess(mockGetResult, `获取${configType}配置成功`);

      case 'set':
      case 'update':
        if (!configData) {
          return handleToolError('context_config', new Error('set/update操作需要提供configData'));
        }
        
        const mockSetResult = {
          configType,
          configId: configId || `${configType}_${Date.now()}`,
          data: configData,
          updated: true
        };
        
        return handleToolSuccess(mockSetResult, `${action === 'set' ? '设置' : '更新'}${configType}配置成功`);

      case 'delete':
        if (!configId) {
          return handleToolError('context_config', new Error('delete操作需要提供configId'));
        }
        
        const mockDeleteResult = {
          configType,
          configId,
          deleted: true
        };
        
        return handleToolSuccess(mockDeleteResult, `删除${configType}配置成功`);

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
  try {
    const typedParams = params as { action?: string; pipelineName?: string; pipelineConfig?: unknown };
    const typedContext = context as { userId?: string };

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
        
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig);
        
        return handleToolSuccess({ 
          name: pipelineName, 
          registered: true 
        }, `注册流水线成功: ${pipelineName}`);

      case 'update':
        if (!pipelineName || !pipelineConfig) {
          return handleToolError('context_pipeline', new Error('update操作需要提供pipelineName和pipelineConfig'));
        }
        
        // 更新现有流水线
        contextOrchestrator.registerPipeline(pipelineName, pipelineConfig);
        
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