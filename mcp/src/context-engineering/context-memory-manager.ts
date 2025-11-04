/**
 * 上下文记忆管理器
 * 负责管理结构化上下文记忆，支持记忆的存储、检索、更新和删除
 */

import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';

/**
 * 上下文记忆接口
 * 对应数据库表 context_memories
 */
export interface ContextMemory {
  id?: string;
  userId: string;
  memoryType: 'preference' | 'pattern' | 'knowledge' | 'interaction';
  title?: string;
  content: Record<string, unknown>;
  importanceScore?: number;
  relevanceTags?: string[];
  accessCount?: number;
  lastAccessedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 记忆查询选项
 */
export interface MemoryQueryOptions {
  userId?: string;
  memoryType?: ContextMemory['memoryType'];
  title?: string;
  minImportanceScore?: number;
  relevanceTags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * 上下文记忆管理器
 */
export class ContextMemoryManager {
  private static instance: ContextMemoryManager;

  static getInstance(): ContextMemoryManager {
    if (!ContextMemoryManager.instance) {
      ContextMemoryManager.instance = new ContextMemoryManager();
    }
    return ContextMemoryManager.instance;
  }

  /**
   * 保存记忆
   */
  async saveMemory(memory: ContextMemory): Promise<ContextMemory> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        throw new Error('Supabase client not available');
      }

      const now = new Date();
      const memoryData = {
        user_id: memory.userId,
        memory_type: memory.memoryType,
        title: memory.title || null,
        content: memory.content,
        importance_score: memory.importanceScore ?? 0.5,
        relevance_tags: memory.relevanceTags || [],
        access_count: memory.accessCount ?? 0,
        last_accessed_at: memory.lastAccessedAt?.toISOString() || now.toISOString(),
        expires_at: memory.expiresAt?.toISOString() || null,
        metadata: memory.metadata || {},
        updated_at: now.toISOString()
      };

      const { data, error } = await supabaseAdapter.supabase
        .from('context_memories')
        .upsert(memoryData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDBToMemory(data);
    } catch (error) {
      logger.error('保存记忆失败', {
        error: error instanceof Error ? error.message : error,
        memory
      });
      throw error;
    }
  }

  /**
   * 根据ID获取记忆
   */
  async getMemoryById(memoryId: string, userId: string): Promise<ContextMemory | null> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return null;
      }

      const { data, error } = await supabaseAdapter.supabase
        .from('context_memories')
        .select('*')
        .eq('id', memoryId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      // 更新访问计数和时间
      await this.updateAccessStats(data.id, userId);

      return this.mapDBToMemory(data);
    } catch (error) {
      logger.error('获取记忆失败', {
        error: error instanceof Error ? error.message : error,
        memoryId,
        userId
      });
      return null;
    }
  }

  /**
   * 根据标题获取记忆
   */
  async getMemoryByTitle(
    userId: string,
    title: string,
    memoryType?: ContextMemory['memoryType']
  ): Promise<ContextMemory | null> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return null;
      }

      let query = supabaseAdapter.supabase
        .from('context_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('title', title);

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        return null;
      }

      // 更新访问计数和时间
      await this.updateAccessStats(data.id, userId);

      return this.mapDBToMemory(data);
    } catch (error) {
      logger.error('获取记忆失败', {
        error: error instanceof Error ? error.message : error,
        userId,
        title,
        memoryType
      });
      return null;
    }
  }

  /**
   * 查询记忆
   */
  async queryMemories(options: MemoryQueryOptions): Promise<ContextMemory[]> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return [];
      }

      let query = supabaseAdapter.supabase
        .from('context_memories')
        .select('*');

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.memoryType) {
        query = query.eq('memory_type', options.memoryType);
      }

      if (options.title) {
        query = query.eq('title', options.title);
      }

      if (options.minImportanceScore !== undefined) {
        query = query.gte('importance_score', options.minImportanceScore);
      }

      if (options.relevanceTags && options.relevanceTags.length > 0) {
        query = query.overlaps('relevance_tags', options.relevanceTags);
      }

      // 按重要性和访问时间排序
      query = query
        .order('importance_score', { ascending: false })
        .order('last_accessed_at', { ascending: false });

      // 分页
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(item => this.mapDBToMemory(item));
    } catch (error) {
      logger.error('查询记忆失败', {
        error: error instanceof Error ? error.message : error,
        options
      });
      return [];
    }
  }

  /**
   * 更新记忆
   */
  async updateMemory(
    memoryId: string,
    userId: string,
    updates: Partial<Pick<ContextMemory, 'content' | 'title' | 'metadata' | 'importanceScore' | 'relevanceTags' | 'expiresAt'>>
  ): Promise<ContextMemory | null> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        throw new Error('Supabase client not available');
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }

      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }

      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      if (updates.importanceScore !== undefined) {
        updateData.importance_score = updates.importanceScore;
      }

      if (updates.relevanceTags !== undefined) {
        updateData.relevance_tags = updates.relevanceTags;
      }

      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt ? updates.expiresAt.toISOString() : null;
      }

      const { data, error } = await supabaseAdapter.supabase
        .from('context_memories')
        .update(updateData)
        .eq('id', memoryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data ? this.mapDBToMemory(data) : null;
    } catch (error) {
      logger.error('更新记忆失败', {
        error: error instanceof Error ? error.message : error,
        memoryId,
        userId,
        updates
      });
      throw error;
    }
  }

  /**
   * 删除记忆
   */
  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return false;
      }

      const { error } = await supabaseAdapter.supabase
        .from('context_memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('删除记忆失败', {
        error: error instanceof Error ? error.message : error,
        memoryId,
        userId
      });
      return false;
    }
  }

  /**
   * 更新访问统计
   */
  private async updateAccessStats(memoryId: string, userId: string): Promise<void> {
    try {
      const supabaseAdapter = storage as any;
      if (!supabaseAdapter.supabase || typeof supabaseAdapter.supabase.from !== 'function') {
        return;
      }

      // 获取当前访问计数
      const { data: currentData } = await supabaseAdapter.supabase
        .from('context_memories')
        .select('access_count')
        .eq('id', memoryId)
        .eq('user_id', userId)
        .single();

      if (currentData) {
        await supabaseAdapter.supabase
          .from('context_memories')
          .update({
            access_count: (currentData.access_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', memoryId)
          .eq('user_id', userId);
      }
    } catch (error) {
      logger.warn('更新访问统计失败', {
        error: error instanceof Error ? error.message : error,
        memoryId,
        userId
      });
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 映射数据库记录到记忆对象
   */
  private mapDBToMemory(data: any): ContextMemory {
    return {
      id: data.id,
      userId: data.user_id,
      memoryType: data.memory_type,
      title: data.title,
      content: data.content || {},
      importanceScore: data.importance_score,
      relevanceTags: data.relevance_tags || [],
      accessCount: data.access_count,
      lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      metadata: data.metadata || {}
    };
  }
}

// 导出单例实例
export const contextMemoryManager = ContextMemoryManager.getInstance();

