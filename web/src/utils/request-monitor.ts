/**
 * 请求监控工具
 * 用于诊断和监控API请求的状态，特别是创建提示词时可能出现的卡死问题
 */

interface RequestLog {
  id: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  status?: 'pending' | 'success' | 'error' | 'timeout';
  error?: string;
  duration?: number;
}

class RequestMonitor {
  private logs: Map<string, RequestLog> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  constructor() {
    // 在开发环境下启用详细日志
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).requestMonitor = this;
    }
  }

  /**
   * 开始监控一个请求
   */
  startRequest(method: string, url: string, timeoutMs: number = 30000): string {
    const id = this.generateId();
    const startTime = Date.now();
    
    const log: RequestLog = {
      id,
      method,
      url,
      startTime,
      status: 'pending'
    };
    
    this.logs.set(id, log);
    
    // 设置超时监控
    const timeoutId = setTimeout(() => {
      this.markTimeout(id);
    }, timeoutMs);
    
    this.timeouts.set(id, timeoutId);
    
    console.log(`[RequestMonitor] 开始监控请求: ${method} ${url} (ID: ${id})`);
    
    return id;
  }

  /**
   * 标记请求成功
   */
  markSuccess(id: string, data?: any): void {
    const log = this.logs.get(id);
    if (!log) return;
    
    const endTime = Date.now();
    log.endTime = endTime;
    log.duration = endTime - log.startTime;
    log.status = 'success';
    
    this.clearTimeout(id);
    
    console.log(`[RequestMonitor] 请求成功: ${log.method} ${log.url} (${log.duration}ms)`);
    
    // 记录慢请求
    if (log.duration > 10000) {
      console.warn(`[RequestMonitor] 慢请求警告: ${log.method} ${log.url} 耗时 ${log.duration}ms`);
    }
  }

  /**
   * 标记请求失败
   */
  markError(id: string, error: string): void {
    const log = this.logs.get(id);
    if (!log) return;
    
    const endTime = Date.now();
    log.endTime = endTime;
    log.duration = endTime - log.startTime;
    log.status = 'error';
    log.error = error;
    
    this.clearTimeout(id);
    
    console.error(`[RequestMonitor] 请求失败: ${log.method} ${log.url} (${log.duration}ms) - ${error}`);
  }

  /**
   * 标记请求超时
   */
  private markTimeout(id: string): void {
    const log = this.logs.get(id);
    if (!log || log.status !== 'pending') return;
    
    const endTime = Date.now();
    log.endTime = endTime;
    log.duration = endTime - log.startTime;
    log.status = 'timeout';
    log.error = 'Request timeout';
    
    console.error(`[RequestMonitor] 请求超时: ${log.method} ${log.url} (${log.duration}ms)`);
    
    // 触发超时处理
    this.handleTimeout(log);
  }

  /**
   * 处理超时
   */
  private handleTimeout(log: RequestLog): void {
    // 在开发环境下显示详细的超时信息
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 请求超时详情`);
      console.log('请求ID:', log.id);
      console.log('方法:', log.method);
      console.log('URL:', log.url);
      console.log('开始时间:', new Date(log.startTime).toISOString());
      console.log('超时时间:', new Date(log.endTime!).toISOString());
      console.log('持续时间:', log.duration + 'ms');
      console.log('当前活跃请求:', this.getActiveRequests());
      console.groupEnd();
    }
  }

  /**
   * 清除超时定时器
   */
  private clearTimeout(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
  }

  /**
   * 获取活跃请求
   */
  getActiveRequests(): RequestLog[] {
    return Array.from(this.logs.values()).filter(log => log.status === 'pending');
  }

  /**
   * 获取所有请求日志
   */
  getAllLogs(): RequestLog[] {
    return Array.from(this.logs.values());
  }

  /**
   * 清理旧日志（保留最近100条）
   */
  cleanup(): void {
    const logs = Array.from(this.logs.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 100);
    
    this.logs.clear();
    logs.forEach(log => this.logs.set(log.id, log));
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取监控统计
   */
  getStats(): {
    total: number;
    success: number;
    error: number;
    timeout: number;
    pending: number;
    avgDuration: number;
  } {
    const logs = Array.from(this.logs.values());
    const completed = logs.filter(log => log.duration !== undefined);
    
    return {
      total: logs.length,
      success: logs.filter(log => log.status === 'success').length,
      error: logs.filter(log => log.status === 'error').length,
      timeout: logs.filter(log => log.status === 'timeout').length,
      pending: logs.filter(log => log.status === 'pending').length,
      avgDuration: completed.length > 0 
        ? Math.round(completed.reduce((sum, log) => sum + (log.duration || 0), 0) / completed.length)
        : 0
    };
  }
}

// 创建全局实例
export const requestMonitor = new RequestMonitor();

/**
 * 装饰器函数，用于自动监控API调用
 */
export function monitorRequest<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  timeoutMs: number = 30000
): T {
  return (async (...args: any[]) => {
    const id = requestMonitor.startRequest('API', name, timeoutMs);
    
    try {
      const result = await fn(...args);
      requestMonitor.markSuccess(id, result);
      return result;
    } catch (error: any) {
      requestMonitor.markError(id, error.message || String(error));
      throw error;
    }
  }) as T;
}

/**
 * 监控创建提示词的包装器
 */
export function withCreatePromptMonitoring<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return monitorRequest('createPrompt', fn, 45000) as T;
} 