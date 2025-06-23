/**
 * Web服务监控系统
 * 提供客户端性能监控、错误追踪、用户行为分析等功能
 */

import { NextApiRequest, NextApiResponse } from 'next';

export interface WebMetrics {
  timestamp: number;
  pageViews: number;
  uniqueUsers: number;
  sessionDuration: number;
  bounceRate: number;
  errorRate: number;
  loadTime: number;
}

export interface UserAction {
  timestamp: number;
  userId?: string;
  sessionId: string;
  action: string;
  page: string;
  data?: any;
  userAgent: string;
  ip: string;
}

export interface PerformanceMetric {
  timestamp: number;
  page: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface ErrorReport {
  timestamp: number;
  message: string;
  stack?: string;
  page: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Web监控管理器
 */
export class WebMonitor {
  private metrics: WebMetrics[] = [];
  private userActions: UserAction[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errorReports: ErrorReport[] = [];
  private maxHistorySize = 10000;
  private activeSessions = new Map<string, { startTime: number; lastActivity: number; pageViews: number }>();

  /**
   * 记录页面访问
   */
  trackPageView(page: string, userId?: string, sessionId?: string, userAgent?: string, ip?: string): void {
    const timestamp = Date.now();
    
    // 更新会话信息
    if (sessionId) {
      const session = this.activeSessions.get(sessionId) || {
        startTime: timestamp,
        lastActivity: timestamp,
        pageViews: 0,
      };
      session.lastActivity = timestamp;
      session.pageViews++;
      this.activeSessions.set(sessionId, session);
    }

    // 记录用户行为
    this.userActions.push({
      timestamp,
      userId,
      sessionId: sessionId || 'unknown',
      action: 'page_view',
      page,
      userAgent: userAgent || 'unknown',
      ip: ip || 'unknown',
    });

    this.cleanupOldData();
  }

  /**
   * 记录用户行为
   */
  trackUserAction(action: string, page: string, data?: any, userId?: string, sessionId?: string, userAgent?: string, ip?: string): void {
    this.userActions.push({
      timestamp: Date.now(),
      userId,
      sessionId: sessionId || 'unknown',
      action,
      page,
      data,
      userAgent: userAgent || 'unknown',
      ip: ip || 'unknown',
    });

    this.cleanupOldData();
  }

  /**
   * 记录性能指标
   */
  trackPerformance(metrics: Omit<PerformanceMetric, 'timestamp'>): void {
    this.performanceMetrics.push({
      timestamp: Date.now(),
      ...metrics,
    });

    this.cleanupOldData();
  }

  /**
   * 记录错误报告
   */
  reportError(error: Omit<ErrorReport, 'timestamp'>): void {
    this.errorReports.push({
      timestamp: Date.now(),
      ...error,
    });

    // 根据严重程度记录日志
    const logLevel = error.severity === 'critical' || error.severity === 'high' ? 'error' : 'warn';
    console[logLevel]('Web错误报告', {
      message: error.message,
      page: error.page,
      severity: error.severity,
      userId: error.userId,
      sessionId: error.sessionId,
    });

    this.cleanupOldData();
  }

  /**
   * 获取实时指标
   */
  getRealTimeMetrics(): WebMetrics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    
    // 过滤最近24小时的数据
    const recentActions = this.userActions.filter(action => action.timestamp > last24Hours);
    const recentErrors = this.errorReports.filter(error => error.timestamp > last24Hours);
    const recentPerformance = this.performanceMetrics.filter(metric => metric.timestamp > last24Hours);

    // 计算指标
    const pageViews = recentActions.filter(action => action.action === 'page_view').length;
    const uniqueUsers = new Set(recentActions.map(action => action.userId).filter(Boolean)).size;
    
    // 计算平均会话时长
    const sessionDurations = Array.from(this.activeSessions.values())
      .map(session => session.lastActivity - session.startTime)
      .filter(duration => duration > 0);
    const avgSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0;

    // 计算跳出率（单页面会话的比例）
    const singlePageSessions = Array.from(this.activeSessions.values())
      .filter(session => session.pageViews === 1).length;
    const bounceRate = this.activeSessions.size > 0 
      ? singlePageSessions / this.activeSessions.size 
      : 0;

    // 计算错误率
    const totalActions = recentActions.length;
    const errorRate = totalActions > 0 ? recentErrors.length / totalActions : 0;

    // 计算平均加载时间
    const avgLoadTime = recentPerformance.length > 0
      ? recentPerformance.reduce((sum, metric) => sum + metric.loadTime, 0) / recentPerformance.length
      : 0;

    return {
      timestamp: now,
      pageViews,
      uniqueUsers,
      sessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      loadTime: Math.round(avgLoadTime),
    };
  }

  /**
   * 获取用户行为分析
   */
  getUserBehaviorAnalysis(timeRange?: { start: number; end: number }): {
    topPages: Array<{ page: string; views: number; uniqueUsers: number }>;
    topActions: Array<{ action: string; count: number }>;
    userFlow: Array<{ from: string; to: string; count: number }>;
    deviceTypes: Map<string, number>;
  } {
    const relevantActions = timeRange 
      ? this.userActions.filter(action => action.timestamp >= timeRange.start && action.timestamp <= timeRange.end)
      : this.userActions;

    // 热门页面
    const pageStats = new Map<string, { views: number; users: Set<string> }>();
    for (const action of relevantActions.filter(a => a.action === 'page_view')) {
      const stats = pageStats.get(action.page) || { views: 0, users: new Set() };
      stats.views++;
      if (action.userId) stats.users.add(action.userId);
      pageStats.set(action.page, stats);
    }

    const topPages = Array.from(pageStats.entries())
      .map(([page, stats]) => ({
        page,
        views: stats.views,
        uniqueUsers: stats.users.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 热门行为
    const actionCounts = new Map<string, number>();
    for (const action of relevantActions) {
      actionCounts.set(action.action, (actionCounts.get(action.action) || 0) + 1);
    }

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 用户流分析（简化版本）
    const userFlow: Array<{ from: string; to: string; count: number }> = [];
    const flowMap = new Map<string, number>();
    
    for (const sessionId of new Set(relevantActions.map(a => a.sessionId))) {
      const sessionActions = relevantActions
        .filter(a => a.sessionId === sessionId && a.action === 'page_view')
        .sort((a, b) => a.timestamp - b.timestamp);
      
      for (let i = 0; i < sessionActions.length - 1; i++) {
        const from = sessionActions[i].page;
        const to = sessionActions[i + 1].page;
        const key = `${from} -> ${to}`;
        flowMap.set(key, (flowMap.get(key) || 0) + 1);
      }
    }

    userFlow.push(...Array.from(flowMap.entries())
      .map(([flow, count]) => {
        const [from, to] = flow.split(' -> ');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10));

    // 设备类型分析
    const deviceTypes = new Map<string, number>();
    for (const action of relevantActions) {
      const deviceType = this.getDeviceType(action.userAgent);
      deviceTypes.set(deviceType, (deviceTypes.get(deviceType) || 0) + 1);
    }

    return {
      topPages,
      topActions,
      userFlow,
      deviceTypes,
    };
  }

  /**
   * 获取性能分析
   */
  getPerformanceAnalysis(timeRange?: { start: number; end: number }): {
    averageLoadTime: number;
    averageFCP: number;
    averageLCP: number;
    averageCLS: number;
    averageFID: number;
    slowestPages: Array<{ page: string; avgLoadTime: number; count: number }>;
  } {
    const relevantMetrics = timeRange 
      ? this.performanceMetrics.filter(metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end)
      : this.performanceMetrics;

    if (relevantMetrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageFCP: 0,
        averageLCP: 0,
        averageCLS: 0,
        averageFID: 0,
        slowestPages: [],
      };
    }

    const averageLoadTime = relevantMetrics.reduce((sum, m) => sum + m.loadTime, 0) / relevantMetrics.length;
    const averageFCP = relevantMetrics.reduce((sum, m) => sum + m.firstContentfulPaint, 0) / relevantMetrics.length;
    const averageLCP = relevantMetrics.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / relevantMetrics.length;
    const averageCLS = relevantMetrics.reduce((sum, m) => sum + m.cumulativeLayoutShift, 0) / relevantMetrics.length;
    const averageFID = relevantMetrics.reduce((sum, m) => sum + m.firstInputDelay, 0) / relevantMetrics.length;

    // 最慢页面分析
    const pagePerformance = new Map<string, { totalTime: number; count: number }>();
    for (const metric of relevantMetrics) {
      const stats = pagePerformance.get(metric.page) || { totalTime: 0, count: 0 };
      stats.totalTime += metric.loadTime;
      stats.count++;
      pagePerformance.set(metric.page, stats);
    }

    const slowestPages = Array.from(pagePerformance.entries())
      .map(([page, stats]) => ({
        page,
        avgLoadTime: Math.round(stats.totalTime / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
      .slice(0, 10);

    return {
      averageLoadTime: Math.round(averageLoadTime),
      averageFCP: Math.round(averageFCP),
      averageLCP: Math.round(averageLCP),
      averageCLS: Math.round(averageCLS * 1000) / 1000,
      averageFID: Math.round(averageFID),
      slowestPages,
    };
  }

  /**
   * 获取错误分析
   */
  getErrorAnalysis(timeRange?: { start: number; end: number }): {
    totalErrors: number;
    errorsByPage: Array<{ page: string; count: number; severity: string }>;
    errorsBySeverity: Map<string, number>;
    recentErrors: ErrorReport[];
  } {
    const relevantErrors = timeRange 
      ? this.errorReports.filter(error => error.timestamp >= timeRange.start && error.timestamp <= timeRange.end)
      : this.errorReports;

    const totalErrors = relevantErrors.length;

    // 按页面分组错误
    const pageErrors = new Map<string, { count: number; severities: string[] }>();
    for (const error of relevantErrors) {
      const stats = pageErrors.get(error.page) || { count: 0, severities: [] };
      stats.count++;
      stats.severities.push(error.severity);
      pageErrors.set(error.page, stats);
    }

    const errorsByPage = Array.from(pageErrors.entries())
      .map(([page, stats]) => ({
        page,
        count: stats.count,
        severity: this.getMostSevereSeverity(stats.severities),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 按严重程度分组
    const errorsBySeverity = new Map<string, number>();
    for (const error of relevantErrors) {
      errorsBySeverity.set(error.severity, (errorsBySeverity.get(error.severity) || 0) + 1);
    }

    // 最近错误
    const recentErrors = relevantErrors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      totalErrors,
      errorsByPage,
      errorsBySeverity,
      recentErrors,
    };
  }

  /**
   * API中间件：自动追踪API请求
   */
  apiMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: Function) => {
      const startTime = Date.now();
      const sessionId = req.headers['x-session-id'] as string || 'unknown';
      const userId = (req as any).userId;
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ip = this.getClientIP(req);

      // 记录API调用
      this.trackUserAction('api_call', req.url || 'unknown', {
        method: req.method,
        query: req.query,
      }, userId, sessionId, userAgent, ip);

      // 监听响应完成
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // 记录性能指标
        this.trackPerformance({
          page: req.url || 'unknown',
          loadTime: duration,
          domContentLoaded: 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0,
        });

        // 记录错误
        if (res.statusCode >= 400) {
          this.reportError({
            message: `API错误: ${res.statusCode} ${res.statusMessage}`,
            page: req.url || 'unknown',
            userAgent,
            userId,
            sessionId,
            severity: res.statusCode >= 500 ? 'high' : 'medium',
          });
        }
      });

      next();
    };
  }

  // 私有方法

  private getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    }
    if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private getMostSevereSeverity(severities: string[]): string {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severities.reduce((most, current) => 
      (severityOrder[current as keyof typeof severityOrder] || 0) > (severityOrder[most as keyof typeof severityOrder] || 0) 
        ? current 
        : most,
    );
  }

  private getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7天前

    this.userActions = this.userActions.filter(action => action.timestamp > cutoff);
    this.performanceMetrics = this.performanceMetrics.filter(metric => metric.timestamp > cutoff);
    this.errorReports = this.errorReports.filter(error => error.timestamp > cutoff);

    // 清理过期会话
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoff) {
        this.activeSessions.delete(sessionId);
      }
    }

    // 限制数组大小
    if (this.userActions.length > this.maxHistorySize) {
      this.userActions = this.userActions.slice(-this.maxHistorySize);
    }
    if (this.performanceMetrics.length > this.maxHistorySize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxHistorySize);
    }
    if (this.errorReports.length > this.maxHistorySize) {
      this.errorReports = this.errorReports.slice(-this.maxHistorySize);
    }
  }
}

// 全局Web监控实例
export const webMonitor = new WebMonitor();
