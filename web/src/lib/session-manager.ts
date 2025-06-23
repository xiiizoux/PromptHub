/**
 * 会话管理器
 * 提供友好的会话超时和轮换机制，避免频繁重新认证
 */

export interface SessionConfig {
  // 会话超时时间（毫秒）
  sessionTimeout: number;
  // 会话续期阈值（毫秒）- 在剩余时间少于此值时自动续期
  renewalThreshold: number;
  // 最大会话时长（毫秒）- 超过此时间必须重新认证
  maxSessionDuration: number;
  // 是否启用自动续期
  autoRenewal: boolean;
  // 续期前的警告时间（毫秒）
  warningTime: number;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  isValid: boolean;
  timeUntilExpiry: number;
  needsRenewal: boolean;
}

class SessionManager {
  private config: SessionConfig;
  private sessions: Map<string, SessionInfo> = new Map();
  private renewalCallbacks: Map<string, () => Promise<void>> = new Map();
  private warningCallbacks: Map<string, (timeLeft: number) => void> = new Map();

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      sessionTimeout: 30 * 60 * 1000,      // 30分钟
      renewalThreshold: 5 * 60 * 1000,     // 5分钟
      maxSessionDuration: 8 * 60 * 60 * 1000, // 8小时
      autoRenewal: true,
      warningTime: 2 * 60 * 1000,          // 2分钟
      ...config,
    };

    // 启动清理定时器
    this.startCleanupTimer();
  }

  /**
   * 创建新会话
   */
  createSession(userId?: string): SessionInfo {
    const now = Date.now();
    const sessionId = this.generateSessionId();
    
    const session: SessionInfo = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.sessionTimeout,
      isValid: true,
      timeUntilExpiry: this.config.sessionTimeout,
      needsRenewal: false,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    const sessionAge = now - session.createdAt;

    // 检查会话是否过期
    if (timeUntilExpiry <= 0 || sessionAge > this.config.maxSessionDuration) {
      this.invalidateSession(sessionId);
      return null;
    }

    // 更新会话信息
    session.timeUntilExpiry = timeUntilExpiry;
    session.needsRenewal = timeUntilExpiry <= this.config.renewalThreshold;
    session.isValid = true;

    return session;
  }

  /**
   * 更新会话活动时间
   */
  updateActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !this.isSessionValid(sessionId)) {
      return false;
    }

    const now = Date.now();
    session.lastActivity = now;

    // 如果启用自动续期且需要续期，则自动续期
    if (this.config.autoRenewal && session.needsRenewal) {
      this.renewSession(sessionId);
    }

    return true;
  }

  /**
   * 续期会话
   */
  renewSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    const sessionAge = now - session.createdAt;

    // 检查是否超过最大会话时长
    if (sessionAge >= this.config.maxSessionDuration) {
      this.invalidateSession(sessionId);
      return false;
    }

    // 续期会话
    session.expiresAt = now + this.config.sessionTimeout;
    session.lastActivity = now;
    session.needsRenewal = false;
    session.timeUntilExpiry = this.config.sessionTimeout;

    return true;
  }

  /**
   * 使会话无效
   */
  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isValid = false;
    }
    this.sessions.delete(sessionId);
    this.renewalCallbacks.delete(sessionId);
    this.warningCallbacks.delete(sessionId);
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    return session !== null && session.isValid;
  }

  /**
   * 设置续期回调
   */
  setRenewalCallback(sessionId: string, callback: () => Promise<void>): void {
    this.renewalCallbacks.set(sessionId, callback);
  }

  /**
   * 设置警告回调
   */
  setWarningCallback(sessionId: string, callback: (timeLeft: number) => void): void {
    this.warningCallbacks.set(sessionId, callback);
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): SessionInfo[] {
    const activeSessions: SessionInfo[] = [];
    for (const [sessionId] of this.sessions) {
      const session = this.getSession(sessionId);
      if (session && session.isValid) {
        activeSessions.push(session);
      }
    }
    return activeSessions;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.checkSessionWarnings();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      const sessionAge = now - session.createdAt;
      if (now >= session.expiresAt || sessionAge >= this.config.maxSessionDuration) {
        this.invalidateSession(sessionId);
      }
    }
  }

  /**
   * 检查会话警告
   */
  private checkSessionWarnings(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      const timeUntilExpiry = session.expiresAt - now;
      
      // 如果接近过期时间，触发警告回调
      if (timeUntilExpiry <= this.config.warningTime && timeUntilExpiry > 0) {
        const warningCallback = this.warningCallbacks.get(sessionId);
        if (warningCallback) {
          warningCallback(timeUntilExpiry);
        }
      }
    }
  }
}

// 创建全局会话管理器实例
export const sessionManager = new SessionManager({
  sessionTimeout: 30 * 60 * 1000,      // 30分钟
  renewalThreshold: 5 * 60 * 1000,     // 5分钟前自动续期
  maxSessionDuration: 8 * 60 * 60 * 1000, // 8小时最大时长
  autoRenewal: true,                    // 启用自动续期
  warningTime: 2 * 60 * 1000,           // 2分钟前警告
});

export default SessionManager;
