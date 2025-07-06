/**
 * Context Engineering 核心管理器
 * 实现动态上下文编排和状态管理
 */

// import { ToolContext } from '../shared/base-tool.js'; // 暂未使用
import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';
import { contextStateManager } from './state-manager.js';

/**
 * 上下文状态接口
 */
export interface ContextState {
  sessionId: string;
  userId: string;
  currentContext: Record<string, unknown>;
  contextHistory: ContextSnapshot[];
  adaptationRules: AdaptationRule[];
  personalizedData: PersonalizedContext;
  experimentConfig?: ExperimentConfig;
}

/**
 * 上下文快照
 */
export interface ContextSnapshot {
  timestamp: number;
  triggerEvent: string;
  contextData: Record<string, unknown>;
  effectiveness?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 适应规则
 */
export interface AdaptationRule {
  id: string;
  name: string;
  condition: string; // JSON Logic格式的条件
  action: ContextAction;
  priority: number;
  isActive: boolean;
}

/**
 * 上下文动作
 */
export interface ContextAction {
  type: 'modify' | 'append' | 'replace' | 'filter';
  target: string; // JSONPath
  value?: unknown;
  template?: string;
  function?: string;
}

/**
 * 个性化上下文
 */
export interface PersonalizedContext {
  preferences: Record<string, unknown>;
  learningData: Record<string, unknown>;
  usagePatterns: UsagePattern[];
  contextualMemory: ContextualMemory[];
}

/**
 * 使用模式
 */
export interface UsagePattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  lastUsed: Date;
  context: Record<string, unknown>;
}

/**
 * 上下文记忆
 */
export interface ContextualMemory {
  key: string;
  value: unknown;
  relevanceScore: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

/**
 * 实验配置
 */
export interface ExperimentConfig {
  experimentId: string;
  variant: string;
  parameters: Record<string, unknown>;
  startDate: Date;
  endDate?: Date;
}

/**
 * 上下文请求
 */
export interface ContextRequest {
  promptId: string;
  userId: string;
  sessionId?: string;
  currentInput: string;
  requiredContext?: string[];
  preferences?: Record<string, unknown>;
}

/**
 * 上下文响应
 */
export interface ContextResponse {
  adaptedContent: string;
  contextUsed: Record<string, unknown>;
  adaptationApplied: string[];
  personalizations: string[];
  experimentVariant?: string;
  effectiveness?: number;
  metadata: {
    processingTime: number;
    contextSources: string[];
    adaptationCount: number;
  };
}

/**
 * Context Engineering 核心管理器
 * 负责动态上下文编排、个性化适应和状态管理
 */
export class ContextManager {
  private activeContexts = new Map<string, ContextState>();
  private contextCache = new Map<string, unknown>();
  private static instance: ContextManager;

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * 处理上下文请求
   * 这是Context Engineering的核心入口
   */
  async processContextRequest(request: ContextRequest): Promise<ContextResponse> {
    const startTime = performance.now();
    
    try {
      // 1. 获取或创建上下文状态
      const contextState = await this.getOrCreateContextState(request);
      
      // 2. 加载提示词基础内容
      const prompt = await storage.getPrompt(request.promptId, request.userId);
      if (!prompt) {
        throw new Error(`提示词不存在: ${request.promptId}`);
      }

      // 3. 动态上下文组装
      const dynamicContext = await this.assembleDynamicContext(
        contextState, 
        request, 
        prompt as unknown as Record<string, unknown>
      );

      // 4. 应用适应规则
      const adaptedContent = await this.applyAdaptationRules(
        prompt.content,
        dynamicContext,
        contextState.adaptationRules
      );

      // 5. 个性化处理
      const personalizedContent = await this.applyPersonalization(
        adaptedContent,
        contextState.personalizedData,
        request
      );

      // 6. 实验处理（如果有）
      const finalContent = contextState.experimentConfig
        ? await this.applyExperimentVariant(personalizedContent, contextState.experimentConfig)
        : personalizedContent;

      // 7. 更新上下文状态
      await this.updateContextState(contextState, request, {
        content: finalContent,
        context: dynamicContext
      });

      // 8. 记录性能指标
      const processingTime = performance.now() - startTime;
      await this.recordPerformanceMetrics(request, processingTime);

      const response: ContextResponse = {
        adaptedContent: finalContent,
        contextUsed: dynamicContext,
        adaptationApplied: [], // TODO: 实际应用的规则
        personalizations: [], // TODO: 实际个性化项
        experimentVariant: contextState.experimentConfig?.variant,
        metadata: {
          processingTime,
          contextSources: Object.keys(dynamicContext),
          adaptationCount: contextState.adaptationRules.length
        }
      };

      logger.info(`Context Engineering处理完成`, {
        userId: request.userId,
        promptId: request.promptId,
        processingTime,
        contextSources: response.metadata.contextSources.length
      });

      return response;

    } catch (error) {
      logger.error('Context Engineering处理失败', {
        error: error instanceof Error ? error.message : error,
        request
      });
      throw error;
    }
  }

  /**
   * 获取或创建上下文状态
   */
  private async getOrCreateContextState(request: ContextRequest): Promise<ContextState> {
    const sessionId = request.sessionId || `session_${request.userId}_${Date.now()}`;
    const stateKey = `${request.userId}_${sessionId}`;

    if (this.activeContexts.has(stateKey)) {
      return this.activeContexts.get(stateKey)!;
    }

    // 从数据库加载现有会话或创建新会话
    const existingSession = request.sessionId 
      ? await this.loadContextSession(request.sessionId, request.userId)
      : null;

    const contextState: ContextState = existingSession || {
      sessionId,
      userId: request.userId,
      currentContext: {},
      contextHistory: [],
      adaptationRules: await this.loadAdaptationRules(request.userId),
      personalizedData: await this.loadPersonalizedData(request.userId),
      experimentConfig: await this.loadExperimentConfig(request.userId)
    };

    this.activeContexts.set(stateKey, contextState);
    return contextState;
  }

  /**
   * 动态上下文组装
   * 根据当前状态、历史和个人化数据组装上下文
   */
  private async assembleDynamicContext(
    state: ContextState,
    request: ContextRequest,
    prompt: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      // 基础上下文
      currentInput: request.currentInput,
      sessionContext: state.currentContext,
      
      // 历史上下文（智能选择相关历史）
      relevantHistory: await this.selectRelevantHistory(
        state.contextHistory, 
        request.currentInput
      ),
      
      // 个性化上下文
      userPreferences: state.personalizedData.preferences,
      
      // 使用模式上下文
      usagePatterns: await this.selectRelevantPatterns(
        state.personalizedData.usagePatterns,
        request.currentInput
      ),
      
      // 上下文记忆
      contextualMemory: await this.selectRelevantMemory(
        state.personalizedData.contextualMemory,
        request.currentInput
      ),
      
      // 实时环境上下文
      timestamp: new Date().toISOString(),
      timeOfDay: this.getTimeOfDay(),
      
      // 任务上下文（从提示词content中提取）
      taskContext: await this.extractTaskContext(prompt, request.currentInput)
    };

    return context;
  }

  /**
   * 应用适应规则
   */
  private async applyAdaptationRules(
    content: unknown,
    context: Record<string, unknown>,
    rules: AdaptationRule[]
  ): Promise<string> {
    let adaptedContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    // 按优先级排序规则
    const sortedRules = rules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        if (await this.evaluateCondition(rule.condition, context)) {
          adaptedContent = await this.applyContextAction(
            adaptedContent,
            rule.action,
            context
          );
        }
      } catch (error) {
        logger.warn(`适应规则执行失败: ${rule.name}`, { error });
      }
    }

    return adaptedContent;
  }

  /**
   * 应用个性化处理
   */
  private async applyPersonalization(
    content: string,
    personalizedData: PersonalizedContext,
    request: ContextRequest
  ): Promise<string> {
    let personalizedContent = content;

    // 应用用户偏好
    personalizedContent = await this.applyUserPreferences(
      personalizedContent,
      personalizedData.preferences
    );

    // 应用学习数据
    personalizedContent = await this.applyLearningData(
      personalizedContent,
      personalizedData.learningData,
      request.currentInput
    );

    return personalizedContent;
  }

  /**
   * 应用实验变体
   */
  private async applyExperimentVariant(
    content: string,
    _experimentConfig: ExperimentConfig
  ): Promise<string> {
    // 根据实验配置修改内容
    // 这里可以实现A/B测试逻辑
    return content; // TODO: 实现实验变体逻辑
  }

  /**
   * 更新上下文状态
   */
  private async updateContextState(
    state: ContextState,
    request: ContextRequest,
    result: { content: string; context: Record<string, unknown> }
  ): Promise<void> {
    // 更新当前上下文
    state.currentContext = {
      ...state.currentContext,
      lastInput: request.currentInput,
      lastOutput: result.content,
      lastInteraction: new Date()
    };

    // 添加历史快照
    state.contextHistory.push({
      timestamp: Date.now(),
      triggerEvent: 'user_interaction',
      contextData: result.context,
      metadata: {
        promptId: request.promptId,
        inputLength: request.currentInput.length,
        outputLength: result.content.length
      }
    });

    // 限制历史记录数量
    if (state.contextHistory.length > 100) {
      state.contextHistory = state.contextHistory.slice(-50);
    }

    // 异步保存到数据库
    this.saveContextSession(state).catch(error => {
      logger.error('保存上下文会话失败', { error, userId: state.userId });
    });
  }

  // ===== 辅助方法 =====

  private async selectRelevantHistory(
    history: ContextSnapshot[],
    _currentInput: string
  ): Promise<ContextSnapshot[]> {
    // 使用相似度算法选择相关历史
    // TODO: 实现语义相似度计算
    return history.slice(-5); // 简单实现：返回最近5条
  }

  private async selectRelevantPatterns(
    patterns: UsagePattern[],
    _currentInput: string
  ): Promise<UsagePattern[]> {
    // 选择相关的使用模式
    return patterns.filter(pattern => 
      pattern.effectiveness > 0.7 && 
      pattern.frequency > 3
    ).slice(0, 3);
  }

  private async selectRelevantMemory(
    memory: ContextualMemory[],
    _currentInput: string
  ): Promise<ContextualMemory[]> {
    // 选择相关的上下文记忆
    return memory
      .filter(mem => mem.relevanceScore > 0.6)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) {return 'late-night';}
    if (hour < 12) {return 'morning';}
    if (hour < 18) {return 'afternoon';}
    return 'evening';
  }

  private async extractTaskContext(_prompt: unknown, _input: string): Promise<Record<string, unknown>> {
    // 从提示词和输入中提取任务上下文
    return {
      taskType: 'general', // TODO: 智能识别任务类型
      complexity: 'medium', // TODO: 评估任务复杂度
      domain: 'general' // TODO: 识别领域
    };
  }

  private async evaluateCondition(_condition: string, _context: Record<string, unknown>): Promise<boolean> {
    // TODO: 实现JSON Logic条件评估
    return true; // 简单实现
  }

  private async applyContextAction(
    content: string,
    _action: ContextAction,
    _context: Record<string, unknown>
  ): Promise<string> {
    // TODO: 实现上下文动作应用
    return content; // 简单实现
  }

  private async applyUserPreferences(
    content: string,
    _preferences: Record<string, unknown>
  ): Promise<string> {
    // TODO: 应用用户偏好
    return content;
  }

  private async applyLearningData(
    content: string,
    _learningData: Record<string, unknown>,
    _input: string
  ): Promise<string> {
    // TODO: 应用学习数据
    return content;
  }

  // ===== 数据持久化方法 =====

  private async loadContextSession(sessionId: string, userId: string): Promise<ContextState | null> {
    try {
      return await contextStateManager.loadContextSession(userId, sessionId);
    } catch (error) {
      logger.error('加载上下文会话失败', { error, sessionId, userId });
      return null;
    }
  }

  private async saveContextSession(state: ContextState): Promise<void> {
    try {
      await contextStateManager.saveContextSession(state.userId, state.sessionId, state);
      
      // 保存交互历史
      if (state.contextHistory.length > 0) {
        const latestInteraction = state.contextHistory[state.contextHistory.length - 1];
        await contextStateManager.saveInteraction(state.userId, state.sessionId, latestInteraction);
      }
    } catch (error) {
      logger.error('保存上下文会话失败', { error, sessionId: state.sessionId, userId: state.userId });
    }
  }

  private async loadAdaptationRules(userId: string): Promise<AdaptationRule[]> {
    try {
      return await contextStateManager.loadAdaptationRules(userId);
    } catch (error) {
      logger.error('加载适应规则失败', { error, userId });
      return [];
    }
  }

  private async loadPersonalizedData(userId: string): Promise<PersonalizedContext> {
    try {
      const profile = await contextStateManager.loadUserProfile(userId);
      return profile || {
        preferences: {},
        learningData: {},
        usagePatterns: [],
        contextualMemory: []
      };
    } catch (error) {
      logger.error('加载个性化数据失败', { error, userId });
      return {
        preferences: {},
        learningData: {},
        usagePatterns: [],
        contextualMemory: []
      };
    }
  }

  private async loadExperimentConfig(userId: string): Promise<ExperimentConfig | undefined> {
    try {
      return await contextStateManager.loadExperimentConfig(userId) || undefined;
    } catch (error) {
      logger.error('加载实验配置失败', { error, userId });
      return undefined;
    }
  }

  private async recordPerformanceMetrics(request: ContextRequest, processingTime: number): Promise<void> {
    try {
      await contextStateManager.recordMetric(
        request.userId,
        'processing_time',
        processingTime,
        {
          promptId: request.promptId,
          sessionId: request.sessionId,
          inputLength: request.currentInput.length
        }
      );
    } catch (error) {
      logger.error('记录性能指标失败', { error, userId: request.userId });
    }
  }
}

// 导出单例实例
export const contextManager = ContextManager.getInstance();