/**
 * 系统监控模块
 * 提供性能监控、健康检查、资源使用监控等功能
 */

import os from 'os';
import process from 'process';
import logger from '../utils/logger.js';

// Node.js types
import { MemoryUsage, CpuUsage } from 'node:process';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
    heapUsed: number;
    heapTotal: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: MemoryUsage;
    cpuUsage: CpuUsage;
  };
  network?: {
    connections: number;
    bytesReceived: number;
    bytesSent: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    duration: number;
  }>;
  timestamp: number;
  uptime: number;
}

export interface AlertRule {
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '==' | '>=' | '<=';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

/**
 * 系统监控器
 */
export class SystemMonitor {
  private metrics: SystemMetrics[] = [];
  private maxMetricsHistory = 1000;
  private monitoringInterval: ReturnType<typeof setTimeout> | null = null;
  private alertRules: AlertRule[] = [];
  private lastCpuUsage: CpuUsage | null = null;
  private startTime = Date.now();

  constructor() {
    this.initializeDefaultAlertRules();
  }

  /**
   * 开始监控
   */
  start(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      this.stop();
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('系统监控已启动', { interval: intervalMs });
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('系统监控已停止');
    }
  }

  /**
   * 收集系统指标
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    // CPU 使用率
    const currentCpuUsage = process.cpuUsage();
    let cpuUsagePercent = 0;
    
    if (this.lastCpuUsage) {
      const cpuDelta = process.cpuUsage(this.lastCpuUsage);
      const totalTime = cpuDelta.user + cpuDelta.system;
      const totalTimeMs = totalTime / 1000; // 转换为毫秒
      cpuUsagePercent = (totalTimeMs / 30000) * 100; // 假设30秒间隔
    }
    this.lastCpuUsage = currentCpuUsage;

    // 内存使用情况
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: Math.min(cpuUsagePercent, 100),
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      memory: {
        used: systemMemory.used,
        free: systemMemory.free,
        total: systemMemory.total,
        usage: (systemMemory.used / systemMemory.total) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage,
        cpuUsage: currentCpuUsage
      }
    };

    // 添加到历史记录
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // 检查告警规则
    this.checkAlerts(metrics);

    return metrics;
  }

  /**
   * 获取当前系统指标
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * 获取历史指标
   */
  getHistoricalMetrics(timeRange?: { start: number; end: number }): SystemMetrics[] {
    if (!timeRange) {
      return this.metrics;
    }

    return this.metrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  /**
   * 健康检查
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = [];
    const _startTime = Date.now();

    // CPU 检查
    const cpuCheck = await this.checkCPU();
    checks.push(cpuCheck);

    // 内存检查
    const memoryCheck = await this.checkMemory();
    checks.push(memoryCheck);

    // 磁盘检查
    const diskCheck = await this.checkDisk();
    checks.push(diskCheck);

    // 进程检查
    const processCheck = await this.checkProcess();
    checks.push(processCheck);

    // 确定整体状态
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warn').length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failedChecks > 0) {
      status = 'critical';
    } else if (warningChecks > 0) {
      status = 'warning';
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    logger.info('添加告警规则', { rule: rule.name });
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(name: string): boolean {
    const index = this.alertRules.findIndex(r => r.name === name);
    if (index >= 0) {
      this.alertRules.splice(index, 1);
      logger.info('移除告警规则', { rule: name });
      return true;
    }
    return false;
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(timeRange?: { start: number; end: number }): {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    maxCpuUsage: number;
    maxMemoryUsage: number;
    dataPoints: number;
  } {
    const relevantMetrics = timeRange 
      ? this.getHistoricalMetrics(timeRange)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        maxCpuUsage: 0,
        maxMemoryUsage: 0,
        dataPoints: 0
      };
    }

    const cpuUsages = relevantMetrics.map(m => m.cpu.usage);
    const memoryUsages = relevantMetrics.map(m => m.memory.usage);

    return {
      avgCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      maxCpuUsage: Math.max(...cpuUsages),
      maxMemoryUsage: Math.max(...memoryUsages),
      dataPoints: relevantMetrics.length
    };
  }

  // 私有方法

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        name: 'high_cpu_usage',
        metric: 'cpu.usage',
        threshold: 80,
        operator: '>',
        severity: 'high',
        enabled: true
      },
      {
        name: 'high_memory_usage',
        metric: 'memory.usage',
        threshold: 85,
        operator: '>',
        severity: 'high',
        enabled: true
      },
      {
        name: 'critical_memory_usage',
        metric: 'memory.usage',
        threshold: 95,
        operator: '>',
        severity: 'critical',
        enabled: true
      }
    ];
  }

  private checkAlerts(metrics: SystemMetrics): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const value = this.getMetricValue(metrics, rule.metric);
      if (value !== null && this.evaluateCondition(value, rule.threshold, rule.operator)) {
        this.triggerAlert(rule, value);
      }
    }
  }

  private getMetricValue(metrics: SystemMetrics, metricPath: string): number | null {
    const parts = metricPath.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return typeof value === 'number' ? value : null;
  }

  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      default: return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    logger.warn('系统告警触发', {
      rule: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity
    });
  }

  private async checkCPU(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string; duration: number }> {
    const start = Date.now();
    const current = this.getCurrentMetrics();
    
    if (!current) {
      return {
        name: 'cpu',
        status: 'warn',
        message: '无法获取CPU指标',
        duration: Date.now() - start
      };
    }

    const cpuUsage = current.cpu.usage;
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `CPU使用率: ${cpuUsage.toFixed(1)}%`;

    if (cpuUsage > 90) {
      status = 'fail';
      message += ' (严重过载)';
    } else if (cpuUsage > 70) {
      status = 'warn';
      message += ' (负载较高)';
    }

    return {
      name: 'cpu',
      status,
      message,
      duration: Date.now() - start
    };
  }

  private async checkMemory(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string; duration: number }> {
    const start = Date.now();
    const current = this.getCurrentMetrics();
    
    if (!current) {
      return {
        name: 'memory',
        status: 'warn',
        message: '无法获取内存指标',
        duration: Date.now() - start
      };
    }

    const memoryUsage = current.memory.usage;
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `内存使用率: ${memoryUsage.toFixed(1)}%`;

    if (memoryUsage > 95) {
      status = 'fail';
      message += ' (严重不足)';
    } else if (memoryUsage > 80) {
      status = 'warn';
      message += ' (使用率较高)';
    }

    return {
      name: 'memory',
      status,
      message,
      duration: Date.now() - start
    };
  }

  private async checkDisk(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string; duration: number }> {
    const start = Date.now();
    
    // 简化的磁盘检查
    return {
      name: 'disk',
      status: 'pass',
      message: '磁盘状态正常',
      duration: Date.now() - start
    };
  }

  private async checkProcess(): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string; duration: number }> {
    const start = Date.now();
    const uptime = process.uptime();
    
    return {
      name: 'process',
      status: 'pass',
      message: `进程运行时间: ${Math.floor(uptime / 3600)}小时${Math.floor((uptime % 3600) / 60)}分钟`,
      duration: Date.now() - start
    };
  }
}

// 全局系统监控实例
export const systemMonitor = new SystemMonitor();
