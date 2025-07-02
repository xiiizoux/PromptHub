/**
 * 访问日志和错误追踪系统
 * 记录API访问、错误信息、性能指标等
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export interface AccessLogEntry {
  timestamp: number;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  requestSize: number;
  responseSize: number;
  error?: string;
}

export interface ErrorLogEntry {
  timestamp: number;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  method?: string;
}

export interface AccessStats {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  statusCodeDistribution: Map<number, number>;
  errorPatterns: Array<{ pattern: string; count: number; lastOccurrence: number }>;
}

/**
 * 访问日志记录器
 */
export class AccessLogger {
  private accessLogs: AccessLogEntry[] = [];
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogHistory = 10000;
  private requestStartTimes = new Map<string, number>();

  /**
   * Express中间件：记录访问日志
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      
      // 记录请求开始时间
      this.requestStartTimes.set(requestId, startTime);
      
      // 添加请求ID到请求对象
      (req as express.Request & { requestId?: string }).requestId = requestId;

      // 监听响应完成
      res.on('finish', () => {
        this.logAccess(req, res, startTime, requestId);
      });

      // 监听响应错误
      res.on('error', (error) => {
        this.logError('error', error.message, {
          stack: error.stack,
          url: req.url,
          method: req.method,
          requestId,
          userId: (req as express.Request & { userId?: string }).userId,
          sessionId: (req as express.Request & { sessionId?: string }).sessionId
        });
      });

      next();
    };
  }

  /**
   * 记录访问日志
   */
  private logAccess(req: Request, res: Response, startTime: number, requestId: string): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const entry: AccessLogEntry = {
      timestamp: endTime,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: this.getClientIP(req),
      userId: (req as express.Request & { userId?: string }).userId,
      sessionId: (req as express.Request & { sessionId?: string }).sessionId,
      requestId,
      requestSize: this.getRequestSize(req),
      responseSize: this.getResponseSize(res),
      error: res.statusCode >= 400 ? res.statusMessage : undefined
    };

    // 添加到日志历史
    this.accessLogs.push(entry);
    if (this.accessLogs.length > this.maxLogHistory) {
      this.accessLogs = this.accessLogs.slice(-this.maxLogHistory);
    }

    // 清理请求开始时间记录
    this.requestStartTimes.delete(requestId);

    // 记录到文件日志
    logger.info('API访问', {
      method: entry.method,
      url: entry.url,
      statusCode: entry.statusCode,
      responseTime: entry.responseTime,
      ip: entry.ip,
      userId: entry.userId,
      requestId: entry.requestId
    });

    // 记录慢请求
    if (responseTime > 1000) {
      logger.warn('慢请求检测', {
        url: entry.url,
        method: entry.method,
        responseTime: entry.responseTime,
        requestId: entry.requestId
      });
    }

    // 记录错误请求
    if (res.statusCode >= 400) {
      logger.error('请求错误', {
        url: entry.url,
        method: entry.method,
        statusCode: entry.statusCode,
        error: entry.error,
        requestId: entry.requestId
      });
    }
  }

  /**
   * 记录错误日志
   */
  logError(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      stack: context?.stack as string | undefined,
      context,
      userId: context?.userId as string | undefined,
      sessionId: context?.sessionId as string | undefined,
      requestId: context?.requestId as string | undefined,
      url: context?.url as string | undefined,
      method: context?.method as string | undefined
    };

    // 添加到错误日志历史
    this.errorLogs.push(entry);
    if (this.errorLogs.length > this.maxLogHistory) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogHistory);
    }

    // 记录到文件日志
    logger[level]('应用错误', {
      message: entry.message,
      context: entry.context,
      requestId: entry.requestId,
      userId: entry.userId
    });
  }

  /**
   * 获取访问统计
   */
  getAccessStats(timeRange?: { start: number; end: number }): AccessStats {
    const relevantLogs = timeRange 
      ? this.accessLogs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
      : this.accessLogs;

    if (relevantLogs.length === 0) {
      return this.getEmptyStats();
    }

    const totalRequests = relevantLogs.length;
    const successfulRequests = relevantLogs.filter(log => log.statusCode < 400).length;
    const errorRequests = totalRequests - successfulRequests;
    
    const totalResponseTime = relevantLogs.reduce((sum, log) => sum + log.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;

    // 计算每分钟请求数
    const timeSpanMinutes = timeRange 
      ? (timeRange.end - timeRange.start) / 60000
      : (Date.now() - relevantLogs[0].timestamp) / 60000;
    const requestsPerMinute = totalRequests / Math.max(timeSpanMinutes, 1);

    // 统计热门端点
    const endpointStats = new Map<string, { count: number; totalTime: number }>();
    for (const log of relevantLogs) {
      const endpoint = this.normalizeEndpoint(log.url);
      const stats = endpointStats.get(endpoint) || { count: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += log.responseTime;
      endpointStats.set(endpoint, stats);
    }

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 状态码分布
    const statusCodeDistribution = new Map<number, number>();
    for (const log of relevantLogs) {
      statusCodeDistribution.set(log.statusCode, (statusCodeDistribution.get(log.statusCode) || 0) + 1);
    }

    // 错误模式分析
    const errorPatterns = this.analyzeErrorPatterns(relevantLogs);

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      topEndpoints,
      statusCodeDistribution,
      errorPatterns
    };
  }

  /**
   * 获取错误日志
   */
  getErrorLogs(timeRange?: { start: number; end: number }, level?: 'error' | 'warn' | 'info'): ErrorLogEntry[] {
    let logs = timeRange 
      ? this.errorLogs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
      : this.errorLogs;

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取慢请求日志
   */
  getSlowRequests(threshold: number = 1000, timeRange?: { start: number; end: number }): AccessLogEntry[] {
    const relevantLogs = timeRange 
      ? this.accessLogs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
      : this.accessLogs;

    return relevantLogs
      .filter(log => log.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 50);
  }

  /**
   * 清理旧日志
   */
  cleanup(olderThan: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    
    this.accessLogs = this.accessLogs.filter(log => log.timestamp > cutoff);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > cutoff);
    
    logger.info('清理访问日志', {
      remainingAccessLogs: this.accessLogs.length,
      remainingErrorLogs: this.errorLogs.length,
      cutoffTime: new Date(cutoff).toISOString()
    });
  }

  // 私有方法

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private getRequestSize(req: Request): number {
    const contentLength = req.headers['content-length'];
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  private getResponseSize(res: Response): number {
    const contentLength = res.getHeader('content-length');
    if (typeof contentLength === 'string') {
      return parseInt(contentLength, 10);
    }
    if (typeof contentLength === 'number') {
      return contentLength;
    }
    return 0;
  }

  private normalizeEndpoint(url: string): string {
    // 简化URL，移除查询参数和动态部分
    return url.split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
  }

  private analyzeErrorPatterns(logs: AccessLogEntry[]): Array<{ pattern: string; count: number; lastOccurrence: number }> {
    const errorLogs = logs.filter(log => log.statusCode >= 400);
    const patterns = new Map<string, { count: number; lastOccurrence: number }>();

    for (const log of errorLogs) {
      const pattern = `${log.statusCode} ${this.normalizeEndpoint(log.url)}`;
      const existing = patterns.get(pattern) || { count: 0, lastOccurrence: 0 };
      existing.count++;
      existing.lastOccurrence = Math.max(existing.lastOccurrence, log.timestamp);
      patterns.set(pattern, existing);
    }

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getEmptyStats(): AccessStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      topEndpoints: [],
      statusCodeDistribution: new Map(),
      errorPatterns: []
    };
  }
}

// 全局访问日志记录器实例
export const accessLogger = new AccessLogger();
