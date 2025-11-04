/**
 * Context Engineering core manager
 * Implements dynamic context orchestration and state management
 */

// import { ToolContext } from '../shared/base-tool.js'; // Not used yet
import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';
import { contextStateManager } from './state-manager.js';

/**
 * Context state interface
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
 * Context snapshot
 */
export interface ContextSnapshot {
  timestamp: number;
  triggerEvent: string;
  contextData: Record<string, unknown>;
  effectiveness?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Adaptation rule
 */
export interface AdaptationRule {
  id: string;
  name: string;
  condition: string; // Condition in JSON Logic format
  action: ContextAction;
  priority: number;
  isActive: boolean;
}

/**
 * Context action
 */
export interface ContextAction {
  type: 'modify' | 'append' | 'replace' | 'filter';
  target: string; // JSONPath
  value?: unknown;
  template?: string;
  function?: string;
}

/**
 * Personalized context
 */
export interface PersonalizedContext {
  preferences: Record<string, unknown>;
  learningData: Record<string, unknown>;
  usagePatterns: UsagePattern[];
  contextualMemory: ContextualMemory[];
}

/**
 * Usage pattern
 */
export interface UsagePattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  lastUsed: Date;
  context: Record<string, unknown>;
}

/**
 * Contextual memory
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
 * Experiment configuration
 */
export interface ExperimentConfig {
  experimentId: string;
  variant: string;
  parameters: Record<string, unknown>;
  startDate: Date;
  endDate?: Date;
}

/**
 * Context request
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
 * Context response
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
 * Context Engineering core manager
 * Responsible for dynamic context orchestration, personalized adaptation and state management
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
   * Process context request
   * This is the core entry point for Context Engineering
   */
  async processContextRequest(request: ContextRequest): Promise<ContextResponse> {
    const startTime = performance.now();
    
    try {
      // 1. Get or create context state
      const contextState = await this.getOrCreateContextState(request);
      
      // 2. Load prompt base content
      const prompt = await storage.getPrompt(request.promptId, request.userId);
      if (!prompt) {
        throw new Error(`Prompt does not exist: ${request.promptId}`);
      }

      // 🔒 Permission verification: Context functionality is only for prompt creators
      const isOwner = prompt.user_id === request.userId || 
                      prompt.created_by === request.userId;
      
      if (!isOwner) {
        throw new Error('Context functionality is only for prompt creators. You are not the creator of this prompt and cannot use context functionality.');
      }

      // 3. Dynamic context assembly
      const dynamicContext = await this.assembleDynamicContext(
        contextState, 
        request, 
        prompt as unknown as Record<string, unknown>
      );

      // 4. Apply adaptation rules
      const adaptedContent = await this.applyAdaptationRules(
        prompt.content,
        dynamicContext,
        contextState.adaptationRules
      );

      // 5. Personalization processing
      const personalizedContent = await this.applyPersonalization(
        adaptedContent,
        contextState.personalizedData,
        request
      );

      // 6. Experiment processing (if any)
      const finalContent = contextState.experimentConfig
        ? await this.applyExperimentVariant(personalizedContent, contextState.experimentConfig)
        : personalizedContent;

      // 7. Update context state
      await this.updateContextState(contextState, request, {
        content: finalContent,
        context: dynamicContext
      });

      // 8. Record performance metrics
      const processingTime = performance.now() - startTime;
      await this.recordPerformanceMetrics(request, processingTime);

      const response: ContextResponse = {
        adaptedContent: finalContent,
        contextUsed: dynamicContext,
        adaptationApplied: [], // TODO: Actually applied rules
        personalizations: [], // TODO: Actual personalization items
        experimentVariant: contextState.experimentConfig?.variant,
        metadata: {
          processingTime,
          contextSources: Object.keys(dynamicContext),
          adaptationCount: contextState.adaptationRules.length
        }
      };

      logger.info(`Context Engineering processing completed`, {
        userId: request.userId,
        promptId: request.promptId,
        processingTime,
        contextSources: response.metadata.contextSources.length
      });

      return response;

    } catch (error) {
      logger.error('Context Engineering processing failed', {
        error: error instanceof Error ? error.message : error,
        request
      });
      throw error;
    }
  }

  /**
   * Get or create context state
   */
  private async getOrCreateContextState(request: ContextRequest): Promise<ContextState> {
    const sessionId = request.sessionId || `session_${request.userId}_${Date.now()}`;
    const stateKey = `${request.userId}_${sessionId}`;

    if (this.activeContexts.has(stateKey)) {
      return this.activeContexts.get(stateKey)!;
    }

    // Load existing session from database or create new session
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
   * Dynamic context assembly
   * Assemble context based on current state, history and personalized data
   */
  private async assembleDynamicContext(
    state: ContextState,
    request: ContextRequest,
    prompt: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      // Base context
      currentInput: request.currentInput,
      sessionContext: state.currentContext,
      
      // History context (intelligently select relevant history)
      relevantHistory: await this.selectRelevantHistory(
        state.contextHistory, 
        request.currentInput
      ),
      
      // Personalized context
      userPreferences: state.personalizedData.preferences,
      
      // Usage pattern context
      usagePatterns: await this.selectRelevantPatterns(
        state.personalizedData.usagePatterns,
        request.currentInput
      ),
      
      // Contextual memory
      contextualMemory: await this.selectRelevantMemory(
        state.personalizedData.contextualMemory,
        request.currentInput
      ),
      
      // Real-time environment context
      timestamp: new Date().toISOString(),
      timeOfDay: this.getTimeOfDay(),
      
      // Task context (extracted from prompt content)
      taskContext: await this.extractTaskContext(prompt, request.currentInput)
    };

    return context;
  }

  /**
   * Apply adaptation rules
   */
  private async applyAdaptationRules(
    content: unknown,
    context: Record<string, unknown>,
    rules: AdaptationRule[]
  ): Promise<string> {
    let adaptedContent = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Sort rules by priority
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
        logger.warn(`Adaptation rule execution failed: ${rule.name}`, { error });
      }
    }

    return adaptedContent;
  }

  /**
   * Apply personalization processing
   */
  private async applyPersonalization(
    content: string,
    personalizedData: PersonalizedContext,
    request: ContextRequest
  ): Promise<string> {
    let personalizedContent = content;

    // Apply user preferences
    personalizedContent = await this.applyUserPreferences(
      personalizedContent,
      personalizedData.preferences
    );

    // Apply learning data
    personalizedContent = await this.applyLearningData(
      personalizedContent,
      personalizedData.learningData,
      request.currentInput
    );

    return personalizedContent;
  }

  /**
   * Apply experiment variant
   */
  private async applyExperimentVariant(
    content: string,
    _experimentConfig: ExperimentConfig
  ): Promise<string> {
    // Modify content based on experiment configuration
    // Can implement A/B testing logic here
    return content; // TODO: Implement experiment variant logic
  }

  /**
   * Update context state
   */
  private async updateContextState(
    state: ContextState,
    request: ContextRequest,
    result: { content: string; context: Record<string, unknown> }
  ): Promise<void> {
    // Update current context
    state.currentContext = {
      ...state.currentContext,
      lastInput: request.currentInput,
      lastOutput: result.content,
      lastInteraction: new Date()
    };

    // Add history snapshot
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

    // Limit history record count
    if (state.contextHistory.length > 100) {
      state.contextHistory = state.contextHistory.slice(-50);
    }

    // Asynchronously save to database
    this.saveContextSession(state).catch(error => {
      logger.error('Failed to save context session', { error, userId: state.userId });
    });
  }

  // ===== Helper Methods =====

  private async selectRelevantHistory(
    history: ContextSnapshot[],
    _currentInput: string
  ): Promise<ContextSnapshot[]> {
    // Use similarity algorithm to select relevant history
    // TODO: Implement semantic similarity calculation
    return history.slice(-5); // Simple implementation: return last 5
  }

  private async selectRelevantPatterns(
    patterns: UsagePattern[],
    _currentInput: string
  ): Promise<UsagePattern[]> {
    // Select relevant usage patterns
    return patterns.filter(pattern => 
      pattern.effectiveness > 0.7 && 
      pattern.frequency > 3
    ).slice(0, 3);
  }

  private async selectRelevantMemory(
    memory: ContextualMemory[],
    _currentInput: string
  ): Promise<ContextualMemory[]> {
    // Select relevant contextual memory
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
    // Extract task context from prompt and input
    return {
      taskType: 'general', // TODO: Intelligently identify task type
      complexity: 'medium', // TODO: Assess task complexity
      domain: 'general' // TODO: Identify domain
    };
  }

  private async evaluateCondition(_condition: string, _context: Record<string, unknown>): Promise<boolean> {
    // TODO: Implement JSON Logic condition evaluation
    return true; // Simple implementation
  }

  private async applyContextAction(
    content: string,
    _action: ContextAction,
    _context: Record<string, unknown>
  ): Promise<string> {
    // TODO: Implement context action application
    return content; // Simple implementation
  }

  private async applyUserPreferences(
    content: string,
    _preferences: Record<string, unknown>
  ): Promise<string> {
    // TODO: Apply user preferences
    return content;
  }

  private async applyLearningData(
    content: string,
    _learningData: Record<string, unknown>,
    _input: string
  ): Promise<string> {
    // TODO: Apply learning data
    return content;
  }

  // ===== Data Persistence Methods =====

  private async loadContextSession(sessionId: string, userId: string): Promise<ContextState | null> {
    try {
      return await contextStateManager.loadContextSession(userId, sessionId);
    } catch (error) {
      logger.error('Failed to load context session', { error, sessionId, userId });
      return null;
    }
  }

  private async saveContextSession(state: ContextState): Promise<void> {
    try {
      await contextStateManager.saveContextSession(state.userId, state.sessionId, state);
      
      // Save interaction history
      if (state.contextHistory.length > 0) {
        const latestInteraction = state.contextHistory[state.contextHistory.length - 1];
        await contextStateManager.saveInteraction(state.userId, state.sessionId, latestInteraction);
      }
    } catch (error) {
      logger.error('Failed to save context session', { error, sessionId: state.sessionId, userId: state.userId });
    }
  }

  private async loadAdaptationRules(userId: string): Promise<AdaptationRule[]> {
    try {
      return await contextStateManager.loadAdaptationRules(userId);
    } catch (error) {
      logger.error('Failed to load adaptation rules', { error, userId });
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
      logger.error('Failed to load personalized data', { error, userId });
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
      logger.error('Failed to load experiment configuration', { error, userId });
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
      logger.error('Failed to record performance metrics', { error, userId: request.userId });
    }
  }
}

// Export singleton instance
export const contextManager = ContextManager.getInstance();