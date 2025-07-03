/**
 * Context Engineering 编排器
 * 负责协调多个上下文组件，实现智能上下文流水线
 */

import { contextManager, ContextRequest, ContextResponse } from './context-manager.js';
import logger from '../utils/logger.js';

/**
 * 上下文流水线阶段
 */
export interface PipelineStage {
  name: string;
  priority: number;
  processor: (context: unknown, metadata: unknown) => Promise<unknown>;
  condition?: (context: unknown) => boolean;
  timeout?: number; // 超时时间（毫秒）
}

/**
 * 流水线配置
 */
export interface PipelineConfig {
  stages: PipelineStage[];
  maxConcurrency?: number;
  totalTimeout?: number;
  fallbackStrategy?: 'graceful' | 'strict';
}

/**
 * 编排结果
 */
export interface OrchestrationResult {
  success: boolean;
  result?: ContextResponse;
  stagesExecuted: string[];
  totalTime: number;
  errors?: Array<{ stage: string; error: string }>;
}

/**
 * Context Engineering 编排器
 * 实现智能上下文流水线和多阶段处理
 */
export class ContextOrchestrator {
  private static instance: ContextOrchestrator;
  private pipelineConfigs = new Map<string, PipelineConfig>();

  static getInstance(): ContextOrchestrator {
    if (!ContextOrchestrator.instance) {
      ContextOrchestrator.instance = new ContextOrchestrator();
    }
    return ContextOrchestrator.instance;
  }

  constructor() {
    this.initializeDefaultPipelines();
  }

  /**
   * 编排上下文处理
   * 主要入口方法，协调整个Context Engineering流程
   */
  async orchestrateContext(
    request: ContextRequest,
    pipelineName: string = 'default'
  ): Promise<OrchestrationResult> {
    const startTime = performance.now();
    const stagesExecuted: string[] = [];
    const errors: Array<{ stage: string; error: string }> = [];

    try {
      logger.info('开始Context Engineering编排', {
        userId: request.userId,
        promptId: request.promptId,
        pipeline: pipelineName
      });

      // 1. 获取流水线配置
      const pipelineConfig = this.pipelineConfigs.get(pipelineName);
      if (!pipelineConfig) {
        throw new Error(`未找到流水线配置: ${pipelineName}`);
      }

      // 2. 预处理阶段
      const preprocessedRequest = await this.preprocessRequest(request);

      // 3. 执行流水线
      const result = await this.executePipeline(
        preprocessedRequest,
        pipelineConfig,
        stagesExecuted,
        errors
      );

      // 4. 后处理阶段
      const finalResult = await this.postprocessResult(result, request);

      const totalTime = performance.now() - startTime;

      logger.info('Context Engineering编排完成', {
        userId: request.userId,
        promptId: request.promptId,
        totalTime,
        stagesExecuted,
        errorsCount: errors.length
      });

      return {
        success: true,
        result: finalResult,
        stagesExecuted,
        totalTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const totalTime = performance.now() - startTime;
      
      logger.error('Context Engineering编排失败', {
        error: error instanceof Error ? error.message : error,
        userId: request.userId,
        promptId: request.promptId,
        totalTime,
        stagesExecuted,
        errors
      });

      return {
        success: false,
        stagesExecuted,
        totalTime,
        errors: [...errors, { 
          stage: 'orchestrator', 
          error: error instanceof Error ? error.message : String(error) 
        }]
      };
    }
  }

  /**
   * 执行流水线
   */
  private async executePipeline(
    request: ContextRequest,
    config: PipelineConfig,
    stagesExecuted: string[],
    errors: Array<{ stage: string; error: string }>
  ): Promise<ContextResponse> {
    let currentContext = request;
    
    // 按优先级排序阶段
    const sortedStages = [...config.stages].sort((a, b) => a.priority - b.priority);

    for (const stage of sortedStages) {
      try {
        // 检查条件
        if (stage.condition && !stage.condition(currentContext)) {
          logger.debug(`跳过阶段: ${stage.name}`, { condition: 'not_met' });
          continue;
        }

        logger.debug(`执行阶段: ${stage.name}`);
        
        // 执行阶段处理器
        const stageResult = await this.executeStageWithTimeout(
          stage,
          currentContext,
          stage.timeout || 5000
        );

        // 更新上下文
        if (stageResult) {
          currentContext = { ...currentContext, ...stageResult };
        }

        stagesExecuted.push(stage.name);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ stage: stage.name, error: errorMessage });

        logger.warn(`阶段执行失败: ${stage.name}`, { error: errorMessage });

        // 根据策略决定是否继续
        if (config.fallbackStrategy === 'strict') {
          throw error;
        }
        // 'graceful' 策略：记录错误但继续执行
      }
    }

    // 最后调用核心Context Manager
    return await contextManager.processContextRequest(currentContext);
  }

  /**
   * 带超时的阶段执行
   */
  private async executeStageWithTimeout(
    stage: PipelineStage,
    context: any,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`阶段超时: ${stage.name} (${timeout}ms)`));
      }, timeout);

      stage.processor(context, {})
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 预处理请求
   */
  private async preprocessRequest(request: ContextRequest): Promise<ContextRequest> {
    // 标准化请求格式
    const preprocessed: ContextRequest = {
      ...request,
      // 确保必要字段存在
      sessionId: request.sessionId || `session_${request.userId}_${Date.now()}`,
      preferences: request.preferences || {}
    };

    // 输入验证和清理
    if (!preprocessed.currentInput?.trim()) {
      throw new Error('输入内容不能为空');
    }

    // 安全检查
    preprocessed.currentInput = this.sanitizeInput(preprocessed.currentInput);

    return preprocessed;
  }

  /**
   * 后处理结果
   */
  private async postprocessResult(
    result: ContextResponse,
    _originalRequest: ContextRequest
  ): Promise<ContextResponse> {
    // 结果验证
    if (!result.adaptedContent?.trim()) {
      throw new Error('生成的内容为空');
    }

    // 安全检查
    result.adaptedContent = this.sanitizeOutput(result.adaptedContent);

    // 添加追踪信息 - 扩展metadata
    const extendedMetadata = result.metadata as Record<string, unknown>;
    extendedMetadata.processingVersion = '1.0';

    return result;
  }

  /**
   * 输入清理
   */
  private sanitizeInput(input: string): string {
    // 移除潜在的恶意内容
    // eslint-disable-next-line no-control-regex
    return input
      .replace(/\u0000/g, '') // 移除空字符
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, '') // 移除控制字符
      .trim();
  }

  /**
   * 输出清理
   */
  private sanitizeOutput(output: string): string {
    // 确保输出安全
    // eslint-disable-next-line no-control-regex
    return output
      .replace(/\u0000/g, '')
      .trim();
  }

  /**
   * 注册流水线配置
   */
  registerPipeline(name: string, config: PipelineConfig): void {
    this.pipelineConfigs.set(name, config);
    logger.info(`注册Context Engineering流水线: ${name}`, {
      stagesCount: config.stages.length
    });
  }

  /**
   * 获取流水线配置
   */
  getPipelineConfig(name: string): PipelineConfig | undefined {
    return this.pipelineConfigs.get(name);
  }

  /**
   * 初始化默认流水线
   */
  private initializeDefaultPipelines(): void {
    // 默认流水线：标准Context Engineering流程
    this.registerPipeline('default', {
      stages: [
        {
          name: 'input_analysis',
          priority: 1,
          processor: this.analyzeInput.bind(this),
          timeout: 3000
        },
        {
          name: 'context_enrichment',
          priority: 2,
          processor: this.enrichContext.bind(this),
          timeout: 5000
        },
        {
          name: 'personalization_check',
          priority: 3,
          processor: this.checkPersonalization.bind(this),
          timeout: 2000
        },
        {
          name: 'experiment_assignment',
          priority: 4,
          processor: this.assignExperiment.bind(this),
          condition: (ctx) => (ctx as Record<string, unknown>)?.allowExperiments !== false,
          timeout: 1000
        }
      ],
      maxConcurrency: 3,
      totalTimeout: 15000,
      fallbackStrategy: 'graceful'
    });

    // 快速流水线：最小化处理，用于高频请求
    this.registerPipeline('fast', {
      stages: [
        {
          name: 'basic_context',
          priority: 1,
          processor: this.basicContextProcessing.bind(this),
          timeout: 1000
        }
      ],
      maxConcurrency: 1,
      totalTimeout: 3000,
      fallbackStrategy: 'graceful'
    });

    // 深度流水线：全功能处理，用于重要请求
    this.registerPipeline('deep', {
      stages: [
        {
          name: 'deep_analysis',
          priority: 1,
          processor: this.deepAnalysis.bind(this),
          timeout: 10000
        },
        {
          name: 'advanced_context',
          priority: 2,
          processor: this.advancedContextProcessing.bind(this),
          timeout: 8000
        },
        {
          name: 'ml_personalization',
          priority: 3,
          processor: this.mlPersonalization.bind(this),
          timeout: 5000
        },
        {
          name: 'adaptive_optimization',
          priority: 4,
          processor: this.adaptiveOptimization.bind(this),
          timeout: 3000
        }
      ],
      maxConcurrency: 2,
      totalTimeout: 30000,
      fallbackStrategy: 'graceful'
    });
  }

  // ===== 流水线阶段处理器 =====

  private async analyzeInput(context: unknown): Promise<unknown> {
    // 分析输入内容的意图、复杂度、领域等
    const typedContext = context as { currentInput?: string };
    return {
      inputAnalysis: {
        intent: 'general', // TODO: 实现意图识别
        complexity: 'medium', // TODO: 复杂度评估
        domain: 'general', // TODO: 领域识别
        length: typedContext.currentInput?.length || 0,
        language: 'zh-CN' // TODO: 语言检测
      }
    };
  }

  private async enrichContext(_context: unknown): Promise<unknown> {
    // 丰富上下文信息
    return {
      enrichedContext: {
        timeContext: new Date().toISOString(),
        sessionCount: 1, // TODO: 从数据库获取
        userActivity: 'active' // TODO: 用户活跃度分析
      }
    };
  }

  private async checkPersonalization(_context: unknown): Promise<unknown> {
    // 检查个性化需求
    return {
      personalizationNeeds: {
        required: true,
        level: 'medium',
        aspects: ['style', 'complexity'] // TODO: 个性化方面分析
      }
    };
  }

  private async assignExperiment(_context: unknown): Promise<unknown> {
    // 分配实验变体
    return {
      experiment: {
        id: 'exp_001',
        variant: 'control', // TODO: 实现实验分配逻辑
        parameters: {}
      }
    };
  }

  private async basicContextProcessing(_context: unknown): Promise<unknown> {
    // 基础上下文处理
    return {
      basicContext: {
        processed: true,
        timestamp: Date.now()
      }
    };
  }

  private async deepAnalysis(_context: unknown): Promise<unknown> {
    // 深度分析
    return {
      deepAnalysis: {
        semanticAnalysis: {}, // TODO: 语义分析
        sentimentAnalysis: {}, // TODO: 情感分析
        topicModeling: {} // TODO: 主题建模
      }
    };
  }

  private async advancedContextProcessing(_context: unknown): Promise<unknown> {
    // 高级上下文处理
    return {
      advancedContext: {
        multiModalContext: {}, // TODO: 多模态上下文
        temporalContext: {}, // TODO: 时间上下文
        spatialContext: {} // TODO: 空间上下文
      }
    };
  }

  private async mlPersonalization(_context: unknown): Promise<unknown> {
    // 机器学习个性化
    return {
      mlPersonalization: {
        userEmbedding: [], // TODO: 用户嵌入向量
        contentEmbedding: [], // TODO: 内容嵌入向量
        similarityScore: 0.8 // TODO: 相似度计算
      }
    };
  }

  private async adaptiveOptimization(_context: unknown): Promise<unknown> {
    // 自适应优化
    return {
      optimization: {
        strategy: 'adaptive',
        parameters: {}, // TODO: 优化参数
        expectedImprovement: 0.15 // TODO: 预期改进
      }
    };
  }
}

// 导出单例实例
export const contextOrchestrator = ContextOrchestrator.getInstance();