/**
 * Context Engineering 状态管理器
 * 负责用户上下文状态的持久化和管理
 */

import { storage } from '../shared/services.js';
import logger from '../utils/logger.js';
import { 
  ContextState, 
  ContextSnapshot, 
  AdaptationRule, 
  PersonalizedContext, 
  ExperimentConfig 
} from './context-manager.js';

/**
 * 状态存储接口
 */
export interface StateStorage {
  // 会话状态管理
  saveContextSession(userId: string, sessionId: string, state: ContextState): Promise<void>;
  loadContextSession(userId: string, sessionId: string): Promise<ContextState | null>;
  deleteContextSession(userId: string, sessionId: string): Promise<boolean>;
  getUserActiveSessions(userId: string): Promise<string[]>;
  
  // 用户档案管理
  saveUserProfile(userId: string, profile: PersonalizedContext): Promise<void>;
  loadUserProfile(userId: string): Promise<PersonalizedContext | null>;
  updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<void>;
  
  // 适应规则管理
  saveAdaptationRules(userId: string, rules: AdaptationRule[]): Promise<void>;
  loadAdaptationRules(userId: string): Promise<AdaptationRule[]>;
  addAdaptationRule(userId: string, rule: AdaptationRule): Promise<void>;
  updateAdaptationRule(userId: string, ruleId: string, rule: Partial<AdaptationRule>): Promise<void>;
  deleteAdaptationRule(userId: string, ruleId: string): Promise<boolean>;
  
  // 实验配置管理
  saveExperimentConfig(userId: string, config: ExperimentConfig): Promise<void>;
  loadExperimentConfig(userId: string): Promise<ExperimentConfig | null>;
  deleteExperimentConfig(userId: string): Promise<boolean>;
  
  // 交互历史管理
  saveInteraction(userId: string, sessionId: string, interaction: ContextSnapshot): Promise<void>;
  getInteractionHistory(userId: string, sessionId?: string, limit?: number): Promise<ContextSnapshot[]>;
  
  // 性能指标管理
  recordMetric(userId: string, metricType: string, value: number, metadata?: Record<string, any>): Promise<void>;
  getMetrics(userId: string, metricType?: string, timeRange?: { start: Date; end: Date }): Promise<any[]>;
}

/**
 * Context Engineering 状态管理器
 * 提供统一的状态管理接口
 */
export class ContextStateManager implements StateStorage {
  private static instance: ContextStateManager;
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): ContextStateManager {
    if (!ContextStateManager.instance) {
      ContextStateManager.instance = new ContextStateManager();
    }
    return ContextStateManager.instance;
  }

  // ===== 会话状态管理 =====

  async saveContextSession(userId: string, sessionId: string, state: ContextState): Promise<void> {
    try {
      // 保存到数据库
      await this.executeQuery(`
        INSERT INTO context_sessions (id, user_id, session_data, status, last_activity_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          session_data = $3,
          status = $4,
          last_activity_at = $5
      `, [
        sessionId,
        userId,
        JSON.stringify(state),
        'active',
        new Date()
      ]);

      // 更新缓存
      this.setCacheItem(`session_${userId}_${sessionId}`, state);

      logger.debug('保存上下文会话成功', { userId, sessionId });

    } catch (error) {
      logger.error('保存上下文会话失败', { 
        error: error instanceof Error ? error.message : error,
        userId, 
        sessionId 
      });
      throw error;
    }
  }

  async loadContextSession(userId: string, sessionId: string): Promise<ContextState | null> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `session_${userId}_${sessionId}`;
      const cached = this.getCacheItem(cacheKey);
      if (cached) {
        return cached;
      }

      // 从数据库加载
      const result = await this.executeQuery(`
        SELECT session_data, status, started_at, last_activity_at
        FROM context_sessions
        WHERE id = $1 AND user_id = $2
      `, [sessionId, userId]);

      if (result.length === 0) {
        return null;
      }

      const sessionData = JSON.parse(result[0].session_data);
      
      // 缓存结果
      this.setCacheItem(cacheKey, sessionData);

      logger.debug('加载上下文会话成功', { userId, sessionId });
      return sessionData;

    } catch (error) {
      logger.error('加载上下文会话失败', { 
        error: error instanceof Error ? error.message : error,
        userId, 
        sessionId 
      });
      return null;
    }
  }

  async deleteContextSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      await this.executeQuery(`
        DELETE FROM context_sessions
        WHERE id = $1 AND user_id = $2
      `, [sessionId, userId]);

      // 清除缓存
      this.cache.delete(`session_${userId}_${sessionId}`);

      logger.debug('删除上下文会话成功', { userId, sessionId });
      return true;

    } catch (error) {
      logger.error('删除上下文会话失败', { 
        error: error instanceof Error ? error.message : error,
        userId, 
        sessionId 
      });
      return false;
    }
  }

  async getUserActiveSessions(userId: string): Promise<string[]> {
    try {
      const result = await this.executeQuery(`
        SELECT id
        FROM context_sessions
        WHERE user_id = $1 AND status = 'active'
        ORDER BY last_activity_at DESC
      `, [userId]);

      return result.map(row => row.id);

    } catch (error) {
      logger.error('获取用户活跃会话失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      return [];
    }
  }

  // ===== 用户档案管理 =====

  async saveUserProfile(userId: string, profile: PersonalizedContext): Promise<void> {
    try {
      await this.executeQuery(`
        INSERT INTO user_context_profiles (user_id, profile_name, context_data, preferences)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, profile_name) DO UPDATE SET
          context_data = $3,
          preferences = $4,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        'default',
        JSON.stringify(profile),
        JSON.stringify(profile.preferences)
      ]);

      // 更新缓存
      this.setCacheItem(`profile_${userId}`, profile);

      logger.debug('保存用户档案成功', { userId });

    } catch (error) {
      logger.error('保存用户档案失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      throw error;
    }
  }

  async loadUserProfile(userId: string): Promise<PersonalizedContext | null> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `profile_${userId}`;
      const cached = this.getCacheItem(cacheKey);
      if (cached) {
        return cached;
      }

      // 从数据库加载
      const result = await this.executeQuery(`
        SELECT context_data, preferences
        FROM user_context_profiles
        WHERE user_id = $1 AND profile_name = 'default'
      `, [userId]);

      if (result.length === 0) {
        // 返回默认档案
        const defaultProfile: PersonalizedContext = {
          preferences: {},
          learningData: {},
          usagePatterns: [],
          contextualMemory: []
        };
        return defaultProfile;
      }

      const profileData = JSON.parse(result[0].context_data);
      
      // 缓存结果
      this.setCacheItem(cacheKey, profileData);

      logger.debug('加载用户档案成功', { userId });
      return profileData;

    } catch (error) {
      logger.error('加载用户档案失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      return null;
    }
  }

  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    try {
      const profile = await this.loadUserProfile(userId);
      if (profile) {
        profile.preferences = { ...profile.preferences, ...preferences };
        await this.saveUserProfile(userId, profile);
      }

      logger.debug('更新用户偏好成功', { userId });

    } catch (error) {
      logger.error('更新用户偏好失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      throw error;
    }
  }

  // ===== 适应规则管理 =====

  async saveAdaptationRules(userId: string, rules: AdaptationRule[]): Promise<void> {
    try {
      // 删除现有规则
      await this.executeQuery(`
        DELETE FROM context_adaptations WHERE user_id = $1
      `, [userId]);

      // 插入新规则
      for (const rule of rules) {
        await this.executeQuery(`
          INSERT INTO context_adaptations (user_id, adaptation_data)
          VALUES ($1, $2)
        `, [userId, JSON.stringify(rule)]);
      }

      // 更新缓存
      this.setCacheItem(`rules_${userId}`, rules);

      logger.debug('保存适应规则成功', { userId, rulesCount: rules.length });

    } catch (error) {
      logger.error('保存适应规则失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      throw error;
    }
  }

  async loadAdaptationRules(userId: string): Promise<AdaptationRule[]> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `rules_${userId}`;
      const cached = this.getCacheItem(cacheKey);
      if (cached) {
        return cached;
      }

      // 从数据库加载
      const result = await this.executeQuery(`
        SELECT adaptation_data
        FROM context_adaptations
        WHERE user_id = $1
      `, [userId]);

      const rules = result.map(row => JSON.parse(row.adaptation_data));
      
      // 缓存结果
      this.setCacheItem(cacheKey, rules);

      logger.debug('加载适应规则成功', { userId, rulesCount: rules.length });
      return rules;

    } catch (error) {
      logger.error('加载适应规则失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      return [];
    }
  }

  async addAdaptationRule(userId: string, rule: AdaptationRule): Promise<void> {
    try {
      const rules = await this.loadAdaptationRules(userId);
      rules.push(rule);
      await this.saveAdaptationRules(userId, rules);

      logger.debug('添加适应规则成功', { userId, ruleId: rule.id });

    } catch (error) {
      logger.error('添加适应规则失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        ruleId: rule.id 
      });
      throw error;
    }
  }

  async updateAdaptationRule(userId: string, ruleId: string, rule: Partial<AdaptationRule>): Promise<void> {
    try {
      const rules = await this.loadAdaptationRules(userId);
      const index = rules.findIndex(r => r.id === ruleId);
      
      if (index === -1) {
        throw new Error(`未找到适应规则: ${ruleId}`);
      }

      rules[index] = { ...rules[index], ...rule };
      await this.saveAdaptationRules(userId, rules);

      logger.debug('更新适应规则成功', { userId, ruleId });

    } catch (error) {
      logger.error('更新适应规则失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        ruleId 
      });
      throw error;
    }
  }

  async deleteAdaptationRule(userId: string, ruleId: string): Promise<boolean> {
    try {
      const rules = await this.loadAdaptationRules(userId);
      const filteredRules = rules.filter(r => r.id !== ruleId);
      
      if (filteredRules.length === rules.length) {
        return false; // 没有找到要删除的规则
      }

      await this.saveAdaptationRules(userId, filteredRules);

      logger.debug('删除适应规则成功', { userId, ruleId });
      return true;

    } catch (error) {
      logger.error('删除适应规则失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        ruleId 
      });
      return false;
    }
  }

  // ===== 实验配置管理 =====

  async saveExperimentConfig(userId: string, config: ExperimentConfig): Promise<void> {
    try {
      await this.executeQuery(`
        INSERT INTO experiment_participations (experiment_id, user_id, variant_assigned, participation_data)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (experiment_id, user_id) DO UPDATE SET
          variant_assigned = $3,
          participation_data = $4
      `, [
        config.experimentId,
        userId,
        config.variant,
        JSON.stringify(config)
      ]);

      // 更新缓存
      this.setCacheItem(`experiment_${userId}`, config);

      logger.debug('保存实验配置成功', { userId, experimentId: config.experimentId });

    } catch (error) {
      logger.error('保存实验配置失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        experimentId: config.experimentId 
      });
      throw error;
    }
  }

  async loadExperimentConfig(userId: string): Promise<ExperimentConfig | null> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `experiment_${userId}`;
      const cached = this.getCacheItem(cacheKey);
      if (cached) {
        return cached;
      }

      // 从数据库加载
      const result = await this.executeQuery(`
        SELECT participation_data
        FROM experiment_participations
        WHERE user_id = $1 AND completed_at IS NULL
        ORDER BY joined_at DESC
        LIMIT 1
      `, [userId]);

      if (result.length === 0) {
        return null;
      }

      const config = JSON.parse(result[0].participation_data);
      
      // 缓存结果
      this.setCacheItem(cacheKey, config);

      logger.debug('加载实验配置成功', { userId });
      return config;

    } catch (error) {
      logger.error('加载实验配置失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      return null;
    }
  }

  async deleteExperimentConfig(userId: string): Promise<boolean> {
    try {
      await this.executeQuery(`
        UPDATE experiment_participations
        SET completed_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND completed_at IS NULL
      `, [userId]);

      // 清除缓存
      this.cache.delete(`experiment_${userId}`);

      logger.debug('删除实验配置成功', { userId });
      return true;

    } catch (error) {
      logger.error('删除实验配置失败', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });
      return false;
    }
  }

  // ===== 交互历史管理 =====

  async saveInteraction(userId: string, sessionId: string, interaction: ContextSnapshot): Promise<void> {
    try {
      await this.executeQuery(`
        INSERT INTO user_interactions (user_id, session_id, interaction_type, interaction_data, context_snapshot)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        sessionId,
        interaction.triggerEvent,
        JSON.stringify(interaction.metadata || {}),
        JSON.stringify(interaction.contextData)
      ]);

      logger.debug('保存交互历史成功', { userId, sessionId });

    } catch (error) {
      logger.error('保存交互历史失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        sessionId 
      });
      throw error;
    }
  }

  async getInteractionHistory(userId: string, sessionId?: string, limit: number = 50): Promise<ContextSnapshot[]> {
    try {
      let query = `
        SELECT interaction_type, interaction_data, context_snapshot, created_at
        FROM user_interactions
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (sessionId) {
        query += ` AND session_id = $2`;
        params.push(sessionId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.executeQuery(query, params);

      const history = result.map(row => ({
        timestamp: new Date(row.created_at).getTime(),
        triggerEvent: row.interaction_type,
        contextData: JSON.parse(row.context_snapshot),
        metadata: JSON.parse(row.interaction_data)
      }));

      logger.debug('获取交互历史成功', { userId, sessionId, count: history.length });
      return history;

    } catch (error) {
      logger.error('获取交互历史失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        sessionId 
      });
      return [];
    }
  }

  // ===== 性能指标管理 =====

  async recordMetric(userId: string, metricType: string, value: number, metadata?: Record<string, any>): Promise<void> {
    try {
      await this.executeQuery(`
        INSERT INTO performance_metrics (user_id, metric_type, metric_value, metadata)
        VALUES ($1, $2, $3, $4)
      `, [
        userId,
        metricType,
        value,
        JSON.stringify(metadata || {})
      ]);

      logger.debug('记录性能指标成功', { userId, metricType, value });

    } catch (error) {
      logger.error('记录性能指标失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        metricType 
      });
    }
  }

  async getMetrics(userId: string, metricType?: string, timeRange?: { start: Date; end: Date }): Promise<any[]> {
    try {
      let query = `
        SELECT metric_type, metric_value, metadata, measured_at
        FROM performance_metrics
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (metricType) {
        query += ` AND metric_type = $2`;
        params.push(metricType);
      }

      if (timeRange) {
        const startIndex = params.length + 1;
        const endIndex = params.length + 2;
        query += ` AND measured_at BETWEEN $${startIndex} AND $${endIndex}`;
        params.push(timeRange.start, timeRange.end);
      }

      query += ` ORDER BY measured_at DESC`;

      const result = await this.executeQuery(query, params);

      const metrics = result.map(row => ({
        type: row.metric_type,
        value: row.metric_value,
        metadata: JSON.parse(row.metadata),
        timestamp: row.measured_at
      }));

      logger.debug('获取性能指标成功', { userId, metricType, count: metrics.length });
      return metrics;

    } catch (error) {
      logger.error('获取性能指标失败', { 
        error: error instanceof Error ? error.message : error,
        userId,
        metricType 
      });
      return [];
    }
  }

  // ===== 私有辅助方法 =====

  private async executeQuery(query: string, params: any[]): Promise<any[]> {
    // TODO: 实现真实的数据库查询
    // 这里需要使用实际的数据库连接
    // 当前返回模拟数据用于演示
    logger.debug('执行数据库查询', { query: query.substring(0, 50) + '...', paramsCount: params.length });
    return [];
  }

  private setCacheItem(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: this.cacheTimeout
    });
  }

  private getCacheItem(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 清理过期的缓存项
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export const contextStateManager = ContextStateManager.getInstance();