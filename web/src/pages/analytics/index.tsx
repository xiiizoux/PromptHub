import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrompts, getPromptPerformance } from '@/lib/api';
import { PromptInfo, PromptPerformance } from '@/types';
import { ChartBarIcon, ArrowRightIcon, CheckCircleIcon, ChartPieIcon, ClockIcon, StarIcon, FireIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, PromptPerformance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20; // 每页显示20个
  const totalPages = Math.ceil(totalCount / pageSize);

  // 获取提示词和性能数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取指定页面的提示词列表
        const response = await getPrompts({ 
          sortBy: 'latest', 
          page: currentPage,
          pageSize: pageSize, 
        });
        const promptList = response.data || [];
        setPrompts(promptList);
        setTotalCount(response.total || 0);
        
        // 获取每个提示词的性能数据（只处理有ID的提示词）
        const promptsWithId = promptList.filter(prompt => prompt.id);
        const performancePromises = promptsWithId.map(prompt => 
          getPromptPerformance(prompt.id!)
            .then(data => ({ id: prompt.id!, data }))
            .catch(() => ({ id: prompt.id!, data: null })),
        );
        
        const performanceResults = await Promise.all(performancePromises);
        const performanceMap = performanceResults.reduce((acc, { id, data }) => {
          if (data) {
            acc[id] = data;
          }
          return acc;
        }, {} as Record<string, PromptPerformance>);
        
        setPerformanceData(performanceMap);
        setError(null);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('无法加载分析数据，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // 处理页面变更
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 渲染分页组件
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5; // 显示5个页码
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-dark-bg-secondary/30 backdrop-blur-md border-t border-dark-border"
      >
        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              显示第 <span className="font-medium text-neon-cyan">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
              <span className="font-medium text-neon-cyan">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              条，共 <span className="font-medium text-neon-purple">{totalCount}</span> 条结果
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 上一页按钮 */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                currentPage === 1
                  ? 'text-gray-500 bg-dark-bg-secondary/50 cursor-not-allowed'
                  : 'text-gray-300 bg-dark-bg-secondary hover:bg-neon-cyan/20 hover:text-neon-cyan'
              }`}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              上一页
            </button>

            {/* 页码按钮 */}
            <div className="flex items-center space-x-1">
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg'
                      : 'text-gray-300 bg-dark-bg-secondary hover:bg-neon-cyan/20 hover:text-neon-cyan'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* 下一页按钮 */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                currentPage === totalPages
                  ? 'text-gray-500 bg-dark-bg-secondary/50 cursor-not-allowed'
                  : 'text-gray-300 bg-dark-bg-secondary hover:bg-neon-cyan/20 hover:text-neon-cyan'
              }`}
            >
              下一页
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // 计算百分比
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // 格式化数字
  const formatNumber = (value: number) => {
    return value.toLocaleString('zh-CN');
  };

  // 格式化时间（毫秒转为秒）
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
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
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-neon-cyan mb-4"
              style={{ color: '#00ffff' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <ChartBarIcon className="h-8 w-8 md:h-12 md:w-12 text-neon-cyan mr-4 inline" style={{ color: '#00ffff' }} />
              数据分析中心
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              基于多维度评价体系，深入分析提示词质量，驱动AI优化决策
            </motion.p>
          </motion.div>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="mb-8"
              >
                <div className="p-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-300">发生错误</h3>
                      <div className="mt-2 text-red-200">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 加载状态 */}
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-neon-purple rounded-full animate-spin animate-reverse"></div>
              </div>
              <motion.p 
                className="mt-6 text-xl text-gray-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                正在加载质量分析数据...
              </motion.p>
            </motion.div>
          ) : (
            <>
              {/* 总体统计 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl p-8 mb-12"
              >
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5 mr-4">
                    <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                      <ChartPieIcon className="h-5 w-5 text-neon-cyan" />
                    </div>
                  </div>
                  总体统计
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 rounded-xl p-6 hover:shadow-neon-sm transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <FireIcon className="h-8 w-8 text-neon-cyan mr-3" />
                      <span className="text-sm text-gray-400">总使用次数</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-cyan">
                      {Object.values(performanceData).reduce((sum, data) => sum + (data.total_usage || 0), 0).toLocaleString('zh-CN')}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-purple/30 rounded-xl p-6 hover:shadow-neon-sm transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <CheckCircleIcon className="h-8 w-8 text-neon-purple mr-3" />
                      <span className="text-sm text-gray-400">平均成功率</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-purple">
                      {formatPercent(Object.values(performanceData).reduce((sum, data) => sum + (data.success_rate || 0), 0) / (Object.keys(performanceData).length || 1))}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 border border-neon-pink/30 rounded-xl p-6 hover:shadow-neon-sm transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <ClockIcon className="h-8 w-8 text-neon-pink mr-3" />
                      <span className="text-sm text-gray-400">平均响应时间</span>
                    </div>
                    <div className="text-3xl font-bold text-neon-pink">
                      {formatTime(Object.values(performanceData).reduce((sum, data) => sum + (data.average_latency || 0), 0) / (Object.keys(performanceData).length || 1))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* 提示词性能表格 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-dark-border">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink p-0.5 mr-4">
                      <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="h-5 w-5 text-neon-purple" />
                      </div>
                    </div>
                    提示词质量排名
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-dark-bg-secondary/50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          提示词
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          使用次数
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          成功率
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          平均评分
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          响应时间
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neon-cyan uppercase tracking-wider">
                          查看详情
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {prompts.filter(prompt => prompt.id).map((prompt, index) => {
                        const performance = performanceData[prompt.id!];
                        return (
                          <motion.tr 
                            key={prompt.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                            className="hover:bg-dark-card/30 transition-colors duration-300"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-white">
                                  {prompt.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">
                                {performance ? formatNumber(performance.total_usage) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {performance ? (
                                <div className="flex items-center">
                                  <div className={`mr-3 flex-shrink-0 h-3 w-3 rounded-full shadow-neon-sm ${
                                    performance.success_rate > 0.9 ? 'bg-green-400' : 
                                    performance.success_rate > 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}></div>
                                  <div className="text-sm text-gray-300">{formatPercent(performance.success_rate)}</div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {performance && performance.average_rating ? (
                                  <>
                                    <StarIcon className="h-4 w-4 text-yellow-400 mr-2" />
                                    <span className="text-sm text-gray-300">{performance.average_rating.toFixed(1)}</span>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">
                                {performance ? formatTime(performance.average_latency) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link 
                                href={`/analytics/${prompt.id}`} 
                                className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
                              >
                                <span>详情</span>
                                <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                      
                      {prompts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="text-gray-400">
                              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                              <h3 className="text-lg font-medium text-white mb-2">暂无数据</h3>
                              <p>当前没有可用的质量分析数据</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页控件 */}
                {renderPagination()}
              </motion.div>

              {/* 优化建议 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
                className="mt-12"
              >
                <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-pink p-0.5 mr-4">
                      <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-neon-cyan" />
                      </div>
                    </div>
                    优化建议
                  </h2>
                  <div className="space-y-4">
                    {[
                      '定期分析性能数据，关注成功率低于80%的提示词，考虑优化其指令或增加示例',
                      '检查平均响应时间较长的提示词，尝试简化其复杂度或分解为多个步骤',
                      '收集并分析用户反馈，了解评分的原因，有针对性地改进提示词',
                      '对于常用提示词，考虑创建更多版本来针对不同的使用场景',
                    ].map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 2.2 + index * 0.2 }}
                        className="flex items-start"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center mt-0.5 mr-4">
                          <CheckCircleIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-gray-300 leading-relaxed">{suggestion}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
