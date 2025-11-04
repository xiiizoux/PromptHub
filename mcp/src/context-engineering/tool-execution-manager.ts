/**
 * 工具执行上下文管理器
 * 负责记录工具执行上下文，用于学习和优化
 */

import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';

/**
 * 工具执行上下文接口
 */
export interface ToolExecutionContext {
  id?: string;
  toolName: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  inputParams?: Record<string, unknown>;
  contextSnapshot?: Record<string, unknown>;
  executionResult?: Record<string, unknown>;
  executionTimeMs?: number;
  contextEnhanced?: boolean;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 工具组合模式接口
 */
export interface ToolCompositionPattern {
  id?: string;
  userId?: string;
  patternName?: string;
  toolChain: Array<{
    toolName: string;
    params?: Record<string, unknown>;
    order: number;
  }>;
  triggerContext?: Record<string, unknown>;
  successRate?: number;
  usageCount?: number;
  lastUsedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 工具执行上下文管理器
 */
export class ToolExecutionManager {
  private static instance: ToolExecutionManager;

  static getInstance(): ToolExecutionManager {
    if (!ToolExecutionManager.instance) {
      ToolExecutionManager.instance = new ToolExecutionManager();
    }
    return ToolExecutionManager.instance;
  }

  /**
   * 记录工具执行上下文
   */
  async recordExecution(context: ToolExecutionContext): Promise<ToolExecutionContext> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        logger.warn('Supabase client not available, skipping execution recording');
        return context;
      }

      const executionData = {
        tool_name: context.toolName,
        user_id: context.userId || null,
        session_id: context.sessionId || null,
        request_id: context.requestId || null,
        input_params: context.inputParams || {},
        context_snapshot: context.contextSnapshot || {},
        execution_result: context.executionResult || {},
        execution_time_ms: context.executionTimeMs || null,
        context_enhanced: context.contextEnhanced ?? false,
        metadata: context.metadata || {}
      };

      const { data, error } = await supabaseAdapter.supabase
        .from('tool_execution_contexts')
        .insert(executionData)
        .select()
        .single();

      if (error) {
        logger.warn('记录工具执行上下文失败', { error: error.message });
        return context;
      }

      return this.mapDBToExecutionContext(data);
    } catch (error) {
      logger.warn('记录工具执行上下文失败', {
        error: error instanceof Error ? error.message : error,
        context
      });
      return context;
    }
  }

  /**
   * 查询工具执行上下文
   */
  async queryExecutions(options: {
    toolName?: string;
    userId?: string;
    sessionId?: string;
    contextEnhanced?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ToolExecutionContext[]> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return [];
      }

      let query = supabaseAdapter.supabase
        .from('tool_execution_contexts')
        .select('*');

      if (options.toolName) {
        query = query.eq('tool_name', options.toolName);
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.sessionId) {
        query = query.eq('session_id', options.sessionId);
      }

      if (options.contextEnhanced !== undefined) {
        query = query.eq('context_enhanced', options.contextEnhanced);
      }

      query = query.order('created_at', { ascending: false });

      const limit = options.limit || 100;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(item => this.mapDBToExecutionContext(item));
    } catch (error) {
      logger.error('查询工具执行上下文失败', {
        error: error instanceof Error ? error.message : error,
        options
      });
      return [];
    }
  }

  /**
   * 保存工具组合模式
   */
  async savePattern(pattern: ToolCompositionPattern): Promise<ToolCompositionPattern> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        throw new Error('Supabase client not available');
      }

      const patternData = {
        user_id: pattern.userId || null,
        pattern_name: pattern.patternName || null,
        tool_chain: pattern.toolChain,
        trigger_context: pattern.triggerContext || {},
        success_rate: pattern.successRate ?? 0.0,
        usage_count: pattern.usageCount ?? 0,
        last_used_at: pattern.lastUsedAt?.toISOString() || null,
        metadata: pattern.metadata || {},
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .upsert(patternData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDBToPattern(data);
    } catch (error) {
      logger.error('保存工具组合模式失败', {
        error: error instanceof Error ? error.message : error,
        pattern
      });
      throw error;
    }
  }

  /**
   * 查询工具组合模式
   */
  async queryPatterns(options: {
    userId?: string;
    patternName?: string;
    minSuccessRate?: number;
    limit?: number;
    offset?: number;
  }): Promise<ToolCompositionPattern[]> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return [];
      }

      let query = supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .select('*');

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.patternName) {
        query = query.eq('pattern_name', options.patternName);
      }

      if (options.minSuccessRate !== undefined) {
        query = query.gte('success_rate', options.minSuccessRate);
      }

      // 按成功率和使用次数排序
      query = query
        .order('success_rate', { ascending: false })
        .order('usage_count', { ascending: false });

      const limit = options.limit || 100;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(item => this.mapDBToPattern(item));
    } catch (error) {
      logger.error('查询工具组合模式失败', {
        error: error instanceof Error ? error.message : error,
        options
      });
      return [];
    }
  }

  /**
   * 更新模式使用统计
   */
  async updatePatternUsage(
    patternId: string,
    success: boolean,
    userId?: string
  ): Promise<boolean> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return false;
      }

      // 获取当前模式数据
      let query = supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .select('usage_count, success_rate')
        .eq('id', patternId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: currentData, error: fetchError } = await query.single();

      if (fetchError || !currentData) {
        return false;
      }

      // 计算新的成功率和使用次数
      const currentUsageCount = currentData.usage_count || 0;
      const currentSuccessRate = currentData.success_rate || 0;
      const newUsageCount = currentUsageCount + 1;
      
      // 更新成功率（加权平均）
      const totalSuccesses = currentSuccessRate * currentUsageCount;
      const newSuccessRate = success
        ? (totalSuccesses + 1) / newUsageCount
        : totalSuccesses / newUsageCount;

      const { error: updateError } = await supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .update({
          usage_count: newUsageCount,
          success_rate: newSuccessRate,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patternId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      logger.warn('更新模式使用统计失败', {
        error: error instanceof Error ? error.message : error,
        patternId,
        userId
      });
      return false;
    }
  }

  /**
   * 删除工具组合模式
   */
  async deletePattern(patternId: string, userId?: string): Promise<boolean> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return false;
      }

      let query = supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .delete()
        .eq('id', patternId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('删除工具组合模式失败', {
        error: error instanceof Error ? error.message : error,
        patternId,
        userId
      });
      return false;
    }
  }

  /**
   * 根据上下文推荐工具组合模式
   */
  async recommendPatterns(
    context: Record<string, unknown>,
    userId?: string,
    limit: number = 5
  ): Promise<ToolCompositionPattern[]> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return [];
      }

      // 查询所有相关模式
      let query = supabaseAdapter.supabase
        .from('tool_composition_patterns')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      // 按成功率和使用次数排序
      query = query
        .order('success_rate', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // 简单匹配：检查上下文是否包含触发条件中的键
      const patterns = (data || []).map(item => this.mapDBToPattern(item));
      
      // 可以根据 trigger_context 进行更复杂的匹配
      // 这里先返回按成功率排序的前几个
      return patterns;
    } catch (error) {
      logger.error('推荐工具组合模式失败', {
        error: error instanceof Error ? error.message : error,
        context,
        userId
      });
      return [];
    }
  }

  /**
   * 映射数据库记录到执行上下文对象
   */
  private mapDBToExecutionContext(data: any): ToolExecutionContext {
    return {
      id: data.id,
      toolName: data.tool_name,
      userId: data.user_id,
      sessionId: data.session_id,
      requestId: data.request_id,
      inputParams: data.input_params || {},
      contextSnapshot: data.context_snapshot || {},
      executionResult: data.execution_result || {},
      executionTimeMs: data.execution_time_ms,
      contextEnhanced: data.context_enhanced,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      metadata: data.metadata || {}
    };
  }

  /**
   * 映射数据库记录到模式对象
   */
  private mapDBToPattern(data: any): ToolCompositionPattern {
    return {
      id: data.id,
      userId: data.user_id,
      patternName: data.pattern_name,
      toolChain: data.tool_chain || [],
      triggerContext: data.trigger_context || {},
      successRate: data.success_rate,
      usageCount: data.usage_count,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      metadata: data.metadata || {}
    };
  }
}

// 导出单例实例
export const toolExecutionManager = ToolExecutionManager.getInstance();

