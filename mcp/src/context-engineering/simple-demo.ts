/**
 * Context Engineering 简化演示
 * 展示核心功能的工作原理
 */

import logger from '../utils/logger.js';

export interface SimpleContextRequest {
  promptId: string;
  userId: string;
  input: string;
  sessionId?: string;
}

export interface SimpleContextResponse {
  adaptedContent: string;
  contextInfo: {
    userId: string;
    sessionId: string;
    processingTime: number;
  };
  adaptations: string[];
}

/**
 * 简化的Context Engineering处理器
 */
export class SimpleContextProcessor {
  private static instance: SimpleContextProcessor;
  private userSessions = new Map<string, { count: number; lastInteraction: Date }>();

  static getInstance(): SimpleContextProcessor {
    if (!SimpleContextProcessor.instance) {
      SimpleContextProcessor.instance = new SimpleContextProcessor();
    }
    return SimpleContextProcessor.instance;
  }

  /**
   * 处理上下文请求
   */
  async processRequest(request: SimpleContextRequest): Promise<SimpleContextResponse> {
    const startTime = performance.now();
    
    try {
      logger.info('开始处理Context Engineering请求', {
        promptId: request.promptId,
        userId: request.userId
      });

      // 1. 获取用户会话信息
      const sessionInfo = this.getUserSession(request.userId);
      
      // 2. 应用简单的上下文适应
      const adaptations: string[] = [];
      let adaptedContent = `基于提示词${request.promptId}的内容: ${request.input}`;

      // 根据用户交互次数调整风格
      if (sessionInfo.count > 5) {
        adaptedContent = `[熟悉用户] ${adaptedContent}`;
        adaptations.push('user_familiarity');
      }

      // 根据时间调整
      const hour = new Date().getHours();
      if (hour < 12) {
        adaptedContent = `[早上好] ${adaptedContent}`;
        adaptations.push('morning_greeting');
      } else if (hour > 18) {
        adaptedContent = `[晚上好] ${adaptedContent}`;
        adaptations.push('evening_greeting');
      }

      // 3. 更新用户会话
      this.updateUserSession(request.userId);

      const processingTime = performance.now() - startTime;

      const response: SimpleContextResponse = {
        adaptedContent,
        contextInfo: {
          userId: request.userId,
          sessionId: request.sessionId || `session_${Date.now()}`,
          processingTime
        },
        adaptations
      };

      logger.info('Context Engineering处理完成', {
        userId: request.userId,
        processingTime: processingTime.toFixed(2) + 'ms',
        adaptationsCount: adaptations.length
      });

      return response;

    } catch (error) {
      logger.error('Context Engineering处理失败', {
        error: error instanceof Error ? error.message : error,
        userId: request.userId
      });
      throw error;
    }
  }

  /**
   * 获取用户会话信息
   */
  private getUserSession(userId: string): { count: number; lastInteraction: Date } {
    const existing = this.userSessions.get(userId);
    if (existing) {
      return existing;
    }

    const newSession = {
      count: 0,
      lastInteraction: new Date()
    };
    this.userSessions.set(userId, newSession);
    return newSession;
  }

  /**
   * 更新用户会话
   */
  private updateUserSession(userId: string): void {
    const session = this.userSessions.get(userId);
    if (session) {
      session.count += 1;
      session.lastInteraction = new Date();
    }
  }

  /**
   * 获取用户统计
   */
  getUserStats(userId: string): { count: number; lastInteraction: Date } | null {
    return this.userSessions.get(userId) || null;
  }

  /**
   * 获取所有用户统计
   */
  getAllStats(): Record<string, { count: number; lastInteraction: Date }> {
    const stats: Record<string, { count: number; lastInteraction: Date }> = {};
    this.userSessions.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }
}

// 导出单例实例
export const simpleContextProcessor = SimpleContextProcessor.getInstance();