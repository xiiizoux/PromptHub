/**
 * 统一上下文管理器
 * 管理多层级上下文（会话级、用户级、全局级）的统一接口
 */

import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';

/**
 * 上下文级别
 */
export type ContextLevel = 'session' | 'user' | 'global';

/**
 * 上下文状态接口
 */
export interface UnifiedContextState {
  sessionId: string;
  userId?: string;
  contextLevel: ContextLevel;
  contextData: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * 上下文查询选项
 */
export interface ContextQueryOptions {
  sessionId?: string;
  userId?: string;
  contextLevel?: ContextLevel;
  includeHistory?: boolean;
  limit?: number;
}

/**
 * 上下文更新选项
 */
export interface ContextUpdateOptions {
  merge?: boolean; // 是否合并而不是替换
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 统一上下文管理器
 */
export class UnifiedContextManager {
  private static instance: UnifiedContextManager;
  private contextCache = new Map<string, UnifiedContextState>();
  private cacheTTL = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): UnifiedContextManager {
    if (!UnifiedContextManager.instance) {
      UnifiedContextManager.instance = new UnifiedContextManager();
    }
    return UnifiedContextManager.instance;
  }

  /**
   * 获取上下文状态
   */
  async getContext(
    sessionId: string,
    userId?: string,
    contextLevel: ContextLevel = 'session'
  ): Promise<UnifiedContextState | null> {
    const cacheKey = `${sessionId}_${userId || 'anonymous'}_${contextLevel}`;
    
    // 检查缓存
    const cached = this.contextCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // 从数据库加载
      const state = await this.loadContextFromDB(sessionId, userId, contextLevel);
      
      if (state) {
        this.contextCache.set(cacheKey, state);
      }
      
      return state;
    } catch (error) {
      logger.error('获取上下文状态失败', {
        error: error instanceof Error ? error.message : error,
        sessionId,
        userId,
        contextLevel
      });
      return null;
    }
  }

  /**
   * 更新上下文状态
   */
  async updateContext(
    sessionId: string,
    updates: Partial<Record<string, unknown>>,
    userId?: string,
    contextLevel: ContextLevel = 'session',
    options: ContextUpdateOptions = {}
  ): Promise<UnifiedContextState> {
    const cacheKey = `${sessionId}_${userId || 'anonymous'}_${contextLevel}`;
    
    try {
      // 获取现有上下文
      const existing = await this.getContext(sessionId, userId, contextLevel);
      
      // 合并或替换数据
      const contextData = options.merge && existing
        ? { ...existing.contextData, ...updates }
        : updates;

      // 更新数据库
      const updatedState = await this.saveContextToDB(
        sessionId,
        userId,
        contextLevel,
        contextData,
        {
          ...options.metadata,
          lastUpdate: new Date().toISOString()
        },
        options.expiresAt
      );

      // 更新缓存
      this.contextCache.set(cacheKey, updatedState);

      return updatedState;
    } catch (error) {
      logger.error('更新上下文状态失败', {
        error: error instanceof Error ? error.message : error,
        sessionId,
        userId,
        contextLevel
      });
      throw error;
    }
  }

  /**
   * 合并上下文
   */
  async mergeContext(
    baseContext: UnifiedContextState,
    newContext: Partial<Record<string, unknown>>,
    strategy: 'replace' | 'merge' | 'deep-merge' = 'merge'
  ): Promise<UnifiedContextState> {
    let mergedData: Record<string, unknown>;

    switch (strategy) {
      case 'replace':
        mergedData = newContext as Record<string, unknown>;
        break;
      case 'deep-merge':
        mergedData = this.deepMerge(baseContext.contextData, newContext);
        break;
      case 'merge':
      default:
        mergedData = { ...baseContext.contextData, ...newContext };
        break;
    }

    return await this.updateContext(
      baseContext.sessionId,
      mergedData,
      baseContext.userId,
      baseContext.contextLevel,
      { merge: false }
    );
  }

  /**
   * 清除上下文
   */
  async clearContext(
    sessionId: string,
    userId?: string,
    contextLevel?: ContextLevel
  ): Promise<void> {
    const cacheKey = `${sessionId}_${userId || 'anonymous'}_${contextLevel || 'session'}`;
    
    try {
      await this.deleteContextFromDB(sessionId, userId, contextLevel);
      this.contextCache.delete(cacheKey);
    } catch (error) {
      logger.error('清除上下文失败', {
        error: error instanceof Error ? error.message : error,
        sessionId,
        userId,
        contextLevel
      });
    }
  }

  /**
   * 获取多层上下文（会话级 + 用户级 + 全局级）
   */
  async getMultiLevelContext(
    sessionId: string,
    userId?: string
  ): Promise<{
    session: UnifiedContextState | null;
    user: UnifiedContextState | null;
    global: UnifiedContextState | null;
    merged: Record<string, unknown>;
  }> {
    const [session, user, global] = await Promise.all([
      this.getContext(sessionId, userId, 'session'),
      userId ? this.getContext(`user_${userId}`, userId, 'user') : Promise.resolve(null),
      this.getContext('global', undefined, 'global')
    ]);

    // 合并多层上下文（优先级：session > user > global）
    const merged: Record<string, unknown> = {};
    
    if (global) {
      Object.assign(merged, global.contextData);
    }
    if (user) {
      Object.assign(merged, user.contextData);
    }
    if (session) {
      Object.assign(merged, session.contextData);
    }

    return { session, user, global, merged };
  }

  /**
   * 查询相关上下文（基于关键词或模式）
   */
  async queryContext(
    query: string,
    options: ContextQueryOptions = {}
  ): Promise<UnifiedContextState[]> {
    try {
      // 这里可以使用数据库的全文搜索功能
      // 简化实现：通过关键词匹配
      const contexts: UnifiedContextState[] = [];
      
      if (options.sessionId) {
        const sessionContext = await this.getContext(
          options.sessionId,
          options.userId,
          options.contextLevel || 'session'
        );
        if (sessionContext && this.matchesQuery(sessionContext, query)) {
          contexts.push(sessionContext);
        }
      }

      if (options.userId) {
        const userContext = await this.getContext(
          `user_${options.userId}`,
          options.userId,
          'user'
        );
        if (userContext && this.matchesQuery(userContext, query)) {
          contexts.push(userContext);
        }
      }

      return contexts.slice(0, options.limit || 10);
    } catch (error) {
      logger.error('查询上下文失败', {
        error: error instanceof Error ? error.message : error,
        query,
        options
      });
      return [];
    }
  }

  // ===== 私有方法 =====

  /**
   * 从数据库加载上下文
   */
  private async loadContextFromDB(
    sessionId: string,
    userId: string | undefined,
    contextLevel: ContextLevel
  ): Promise<UnifiedContextState | null> {
    try {
      // 检查 storage 是否为 SupabaseAdapter 并获取客户端
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        logger.warn('Supabase client not available, using fallback');
        return null;
      }

      let query = supabaseAdapter.supabase
        .from('context_states')
        .select('*')
        .eq('session_id', sessionId)
        .eq('context_level', contextLevel);

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return this.mapDBToState(data);
    } catch (error) {
      logger.error('从数据库加载上下文失败', { 
        error: error instanceof Error ? error.message : error,
        sessionId, 
        userId, 
        contextLevel 
      });
      return null;
    }
  }

  /**
   * 保存上下文到数据库
   */
  private async saveContextToDB(
    sessionId: string,
    userId: string | undefined,
    contextLevel: ContextLevel,
    contextData: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    expiresAt?: Date
  ): Promise<UnifiedContextState> {
    try {
      // 检查 storage 是否为 SupabaseAdapter 并获取客户端
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        throw new Error('Supabase client not available');
      }

      const now = new Date();
      const stateData = {
        session_id: sessionId,
        user_id: userId || null,
        context_level: contextLevel,
        context_data: contextData,
        metadata: metadata || {},
        expires_at: expiresAt?.toISOString() || null,
        updated_at: now.toISOString()
      };

      const { data, error } = await supabaseAdapter.supabase
        .from('context_states')
        .upsert(stateData, {
          onConflict: 'session_id,user_id,context_level'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDBToState(data);
    } catch (error) {
      logger.error('保存上下文到数据库失败', { 
        error: error instanceof Error ? error.message : error,
        sessionId, 
        userId, 
        contextLevel 
      });
      throw error;
    }
  }

  /**
   * 从数据库删除上下文
   */
  private async deleteContextFromDB(
    sessionId: string,
    userId: string | undefined,
    contextLevel?: ContextLevel
  ): Promise<void> {
    try {
      // 检查 storage 是否为 SupabaseAdapter 并获取客户端
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return;
      }

      let query = supabaseAdapter.supabase
        .from('context_states')
        .delete()
        .eq('session_id', sessionId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.is('user_id', null);
      }

      if (contextLevel) {
        query = query.eq('context_level', contextLevel);
      }

      await query;
    } catch (error) {
      logger.error('从数据库删除上下文失败', { 
        error: error instanceof Error ? error.message : error,
        sessionId, 
        userId, 
        contextLevel 
      });
    }
  }

  /**
   * 映射数据库记录到状态对象
   */
  private mapDBToState(data: any): UnifiedContextState {
    return {
      sessionId: data.session_id,
      userId: data.user_id,
      contextLevel: data.context_level,
      contextData: data.context_data || {},
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
    };
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(
          (result[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(state: UnifiedContextState): boolean {
    if (state.expiresAt && state.expiresAt < new Date()) {
      return false;
    }
    const cacheAge = Date.now() - state.updatedAt.getTime();
    return cacheAge < this.cacheTTL;
  }

  /**
   * 检查上下文是否匹配查询
   */
  private matchesQuery(state: UnifiedContextState, query: string): boolean {
    const queryLower = query.toLowerCase();
    const contextStr = JSON.stringify(state.contextData).toLowerCase();
    const metadataStr = JSON.stringify(state.metadata || {}).toLowerCase();
    return contextStr.includes(queryLower) || metadataStr.includes(queryLower);
  }
}

// 导出单例实例
export const unifiedContextManager = UnifiedContextManager.getInstance();

