/**
 * 调试面板组件
 * 在开发环境下显示请求监控信息，帮助诊断卡死问题
 */

import React, { useState, useEffect } from 'react';
import { requestMonitor } from '@/utils/request-monitor';
import { runDiagnostics } from '@/utils/connection-diagnostics';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline';

interface DebugPanelProps {
  show?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ show = process.env.NODE_ENV === 'development' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(requestMonitor.getStats());
  const [activeLogs, setActiveLogs] = useState(requestMonitor.getActiveRequests());
  const [allLogs, setAllLogs] = useState(requestMonitor.getAllLogs());
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setStats(requestMonitor.getStats());
      setActiveLogs(requestMonitor.getActiveRequests());
      setAllLogs(requestMonitor.getAllLogs().slice(-10)); // 最近10条
    }, 1000);

    return () => clearInterval(interval);
  }, [show]);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await runDiagnostics();
      setDiagnosticsResult(result);
    } catch (error) {
      console.error('运行诊断失败:', error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  if (!show) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-400" />;
      case 'timeout':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'timeout':
        return 'text-yellow-400';
      case 'pending':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDiagnosticStatusColor = (overall: string) => {
    switch (overall) {
      case 'pass':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'fail':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 max-w-md"
    >
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl">
        {/* 头部 */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">请求监控</span>
            
            {/* 状态统计 */}
            <div className="flex items-center space-x-1 text-xs">
              {activeLogs.length > 0 && (
                <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded">
                  {activeLogs.length} 活跃
                </span>
              )}
              {stats.error > 0 && (
                <span className="bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded">
                  {stats.error} 错误
                </span>
              )}
              {stats.timeout > 0 && (
                <span className="bg-yellow-600/20 text-yellow-400 px-1.5 py-0.5 rounded">
                  {stats.timeout} 超时
                </span>
              )}
              {diagnosticsResult && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  diagnosticsResult.overall === 'pass' ? 'bg-green-600/20 text-green-400' :
                  diagnosticsResult.overall === 'warning' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  诊断: {diagnosticsResult.overall}
                </span>
              )}
            </div>
          </div>
          
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* 展开内容 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700"
            >
              <div className="p-3 space-y-3">
                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-400">总请求</div>
                    <div className="text-white font-mono">{stats.total}</div>
                  </div>
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-400">平均耗时</div>
                    <div className="text-white font-mono">{stats.avgDuration}ms</div>
                  </div>
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-400">成功率</div>
                    <div className="text-white font-mono">
                      {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-400">活跃请求</div>
                    <div className="text-white font-mono">{stats.pending}</div>
                  </div>
                </div>

                {/* 连接诊断 */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>连接诊断</span>
                    <button
                      onClick={handleRunDiagnostics}
                      disabled={isRunningDiagnostics}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded transition-colors"
                    >
                      <WrenchScrewdriverIcon className={`w-3 h-3 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                      <span>{isRunningDiagnostics ? '诊断中...' : '运行诊断'}</span>
                    </button>
                  </div>
                  
                  {diagnosticsResult && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      <div className={`text-xs font-medium ${getDiagnosticStatusColor(diagnosticsResult.overall)}`}>
                        总体状态: {diagnosticsResult.overall}
                      </div>
                      {diagnosticsResult.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-xs p-1.5 hover:bg-gray-800/30 rounded">
                          {result.success ? 
                            <CheckCircleIcon className="w-3 h-3 text-green-400" /> :
                            <XCircleIcon className="w-3 h-3 text-red-400" />
                          }
                          <span className="text-gray-300 truncate flex-1">
                            {result.test}
                          </span>
                          <span className={`font-mono text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                            {result.duration}ms
                          </span>
                        </div>
                      ))}
                      {diagnosticsResult.recommendations.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-600/10 rounded">
                          <div className="text-xs text-blue-400 font-medium mb-1">建议:</div>
                          {diagnosticsResult.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="text-xs text-gray-300">• {rec}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 活跃请求 */}
                {activeLogs.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">活跃请求</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {activeLogs.map((log) => (
                        <div key={log.id} className="flex items-center space-x-2 text-xs bg-blue-600/10 p-1.5 rounded">
                          <ClockIcon className="w-3 h-3 text-blue-400 animate-spin" />
                          <span className="text-gray-300 truncate flex-1">
                            {log.method} {log.url}
                          </span>
                          <span className="text-blue-400 font-mono">
                            {Math.round((Date.now() - log.startTime) / 1000)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最近请求 */}
                <div>
                  <div className="text-xs text-gray-400 mb-2">最近请求</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {allLogs.slice(-5).reverse().map((log) => (
                      <div key={log.id} className="flex items-center space-x-2 text-xs p-1.5 hover:bg-gray-800/30 rounded">
                        {getStatusIcon(log.status || 'pending')}
                        <span className="text-gray-300 truncate flex-1">
                          {log.method} {log.url}
                        </span>
                        <span className={`font-mono ${getStatusColor(log.status || 'pending')}`}>
                          {log.duration ? `${log.duration}ms` : '...'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      requestMonitor.cleanup();
                      setStats(requestMonitor.getStats());
                      setAllLogs(requestMonitor.getAllLogs());
                    }}
                    className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                  >
                    清理日志
                  </button>
                  <button
                    onClick={() => {
                      console.log('请求监控详细信息:', {
                        stats: requestMonitor.getStats(),
                        activeLogs: requestMonitor.getActiveRequests(),
                        allLogs: requestMonitor.getAllLogs(),
                        diagnostics: diagnosticsResult
                      });
                    }}
                    className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                  >
                    导出日志
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 