import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getUserUsageHistory, getUsageStats, UsageRecord } from '@/lib/api';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { formatVersionDisplay } from '@/lib/version-utils';

const UsageHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsageHistory();
    fetchUsageStats();
  }, [currentPage, selectedModel, dateRange]);

  const fetchUsageHistory = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        pageSize: 20,
        ...(selectedModel !== 'all' && { model: selectedModel }),
        ...(dateRange.from && { dateFrom: dateRange.from }),
        ...(dateRange.to && { dateTo: dateRange.to })
      };
      
      const response = await getUserUsageHistory(params);
      setUsageHistory(response.data);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('获取使用历史失败:', error);
      toast.error('获取使用历史失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      setIsStatsLoading(true);
      const statsData = await getUsageStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('获取使用统计失败:', error);
      toast.error('获取使用统计失败: ' + error.message);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 过滤历史记录
  const filteredHistory = usageHistory.filter(record => {
    const matchesSearch = 
      record.prompt_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.model && record.model.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // 获取所有模型选项
  const models = Array.from(new Set(usageHistory.map(r => r.model).filter(Boolean)));

  const formatTokens = (tokens?: number) => {
    if (!tokens) return '0';
    return tokens.toLocaleString();
  };

  const formatLatency = (ms?: number) => {
    if (!ms) return '0ms';
    return `${ms}ms`;
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-dark-bg-primary">
        <div className="container-custom py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">加载使用历史中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <ClockIcon className="h-8 w-8 text-neon-cyan mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                使用历史
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              查看您的提示词使用记录和统计信息
            </p>
          </motion.div>

          {/* 统计卡片 */}
          {!isStatsLoading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="glass rounded-xl border border-neon-cyan/20 p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-neon-cyan mr-3" />
                  <div>
                    <p className="text-gray-400 text-sm">总使用次数</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsage}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl border border-neon-purple/20 p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-neon-purple mr-3" />
                  <div>
                    <p className="text-gray-400 text-sm">本周使用</p>
                    <p className="text-2xl font-bold text-white">{stats.thisWeekUsage}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl border border-neon-pink/20 p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-neon-pink mr-3" />
                  <div>
                    <p className="text-gray-400 text-sm">本月使用</p>
                    <p className="text-2xl font-bold text-white">{stats.thisMonthUsage}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl border border-neon-yellow/20 p-6">
                <div className="flex items-center">
                  <CpuChipIcon className="h-8 w-8 text-neon-yellow mr-3" />
                  <div>
                    <p className="text-gray-400 text-sm">常用模型</p>
                    <p className="text-lg font-bold text-white">
                      {stats.modelStats[0]?.model || '暂无'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 搜索和筛选 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索提示词或模型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary w-full pl-10"
                />
              </div>

              {/* 模型筛选 */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-primary lg:w-48"
              >
                <option value="all">所有模型</option>
                {models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              {/* 日期范围 */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-primary"
                />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-primary"
                />
              </div>
            </div>
          </motion.div>

          {/* 使用历史列表 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {filteredHistory.length === 0 ? (
              <div className="text-center py-16">
                <ClockIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  {searchTerm || selectedModel !== 'all' || dateRange.from || dateRange.to 
                    ? '没有找到匹配的记录' 
                    : '还没有使用记录'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedModel !== 'all' || dateRange.from || dateRange.to
                    ? '尝试调整搜索条件或筛选器'
                    : '开始使用提示词来查看使用历史吧！'
                  }
                </p>
                {!searchTerm && selectedModel === 'all' && !dateRange.from && !dateRange.to && (
                  <Link
                    href="/prompts"
                    className="btn-primary"
                  >
                    浏览提示词
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="glass rounded-xl border border-neon-cyan/20 p-6 hover:border-neon-cyan/40 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/prompts/${record.prompt_name}`}
                            className="text-lg font-semibold text-white hover:text-neon-cyan transition-colors"
                          >
                            {record.prompt_name}
                          </Link>
                          {record.model && (
                            <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">
                              {record.model}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full">
                            v{formatVersionDisplay(record.prompt_version)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="block font-medium">输入Token</span>
                            <span>{formatTokens(record.input_tokens)}</span>
                          </div>
                          <div>
                            <span className="block font-medium">输出Token</span>
                            <span>{formatTokens(record.output_tokens)}</span>
                          </div>
                          <div>
                            <span className="block font-medium">延迟</span>
                            <span>{formatLatency(record.latency_ms)}</span>
                          </div>
                          <div>
                            <span className="block font-medium">使用时间</span>
                            <span>
                              {formatDistanceToNow(new Date(record.created_at), { 
                                addSuffix: true, 
                                locale: zhCN 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  <span className="px-4 py-2 text-gray-400">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(UsageHistoryPage); 