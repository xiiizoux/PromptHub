import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface SearchStats {
  summary: {
    totalSearches: number;
    avgResponseTime: number;
    timeRange: string;
    periodStart: string;
    periodEnd: string;
  };
  toolStats: Array<{
    tool: string;
    count: number;
    avgResponseTime: number;
    percentage: number;
  }>;
  timeSeries: {
    labels: string[];
    searchCounts: number[];
    avgResponseTimes: number[];
  };
  responseTimeDistribution: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}

interface SearchOperationStatsProps {
  timeRange?: '24h' | '7d' | '30d';
  className?: string;
}

const SearchOperationStats: React.FC<SearchOperationStatsProps> = ({ 
  timeRange = '24h', 
  className = '' 
}) => {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchStats();
  }, [timeRange]);

  const fetchSearchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/performance/search-stats?timeRange=${timeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || '获取搜索统计失败');
      }
    } catch (err) {
      console.error('获取搜索统计失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '24h': return '最近24小时';
      case '7d': return '最近7天';
      case '30d': return '最近30天';
      default: return '最近24小时';
    }
  };

  const getToolDisplayName = (toolName: string) => {
    const toolNames: Record<string, string> = {
      'unified_search': '统一搜索',
      'smart_semantic_search': '智能语义搜索',
      'enhanced_search_prompts': '增强搜索',
      'get_prompt_details': '获取详情',
      'quick_access_prompts': '快速访问',
      'prompt_optimizer': '提示词优化',
      'unknown_tool': '未知工具',
    };
    return toolNames[toolName] || toolName;
  };

  if (loading) {
    return (
      <div className={`glass rounded-xl border border-gray-700/50 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MagnifyingGlassIcon className="h-5 w-5 text-neon-cyan mr-2" />
          搜索操作统计
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">正在加载统计数据...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass rounded-xl border border-gray-700/50 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MagnifyingGlassIcon className="h-5 w-5 text-neon-cyan mr-2" />
          搜索操作统计
        </h3>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">{error}</div>
          <button 
            onClick={fetchSearchStats}
            className="text-neon-cyan hover:text-neon-purple transition-colors"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`glass rounded-xl border border-gray-700/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <MagnifyingGlassIcon className="h-5 w-5 text-neon-cyan mr-2" />
          搜索操作统计
        </h3>
        <span className="text-sm text-gray-400">{getTimeRangeLabel(timeRange)}</span>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-bg-secondary/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">总搜索次数</p>
              <p className="text-2xl font-bold text-neon-cyan">{stats.summary.totalSearches}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-neon-cyan/50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-bg-secondary/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">平均响应时间</p>
              <p className="text-2xl font-bold text-neon-purple">{stats.summary.avgResponseTime}ms</p>
            </div>
            <ClockIcon className="h-8 w-8 text-neon-purple/50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-bg-secondary/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">活跃工具数</p>
              <p className="text-2xl font-bold text-neon-green">{stats.toolStats.length}</p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-neon-green/50" />
          </div>
        </motion.div>
      </div>

      {/* 工具使用统计 */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-white mb-3 flex items-center">
          <ArrowTrendingUpIcon className="h-4 w-4 text-neon-cyan mr-2" />
          工具使用分布
        </h4>
        <div className="space-y-3">
          {stats.toolStats.slice(0, 5).map((tool, index) => (
            <motion.div
              key={tool.tool}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-bg-secondary/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{getToolDisplayName(tool.tool)}</span>
                <span className="text-sm text-gray-400">{tool.count} 次</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">平均响应: {tool.avgResponseTime}ms</span>
                <span className="text-neon-cyan">{tool.percentage}%</span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-neon-cyan to-neon-purple h-2 rounded-full transition-all duration-500"
                  style={{ width: `${tool.percentage}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 响应时间分布 */}
      <div>
        <h4 className="text-md font-semibold text-white mb-3">响应时间分布</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {stats.responseTimeDistribution.map((range, index) => (
            <motion.div
              key={range.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-bg-secondary/30 rounded-lg p-3 text-center"
            >
              <div className="text-sm text-gray-400 mb-1">{range.label}</div>
              <div className="text-lg font-bold text-white">{range.count}</div>
              <div className="text-xs text-neon-cyan">{range.percentage}%</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        数据更新时间: {new Date(stats.summary.periodEnd).toLocaleString('zh-CN')}
      </div>
    </div>
  );
};

export default SearchOperationStats;
