import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';
import PromptCard from '@/components/prompts/PromptCard';
import PromptFilters from '@/components/prompts/PromptFilters';

export default function PromptsPage() {
  // 状态管理
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<PromptFiltersType>({
    page: 1,
    pageSize: 21,
    sortBy: 'latest',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('开始获取类别数据...');
        const data = await getCategories();
        console.log('获取到的类别数据:', data);
        
        if (data && Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories(['通用']);
        }
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories(['通用']);
      }
    };

    fetchCategories();
  }, []);
  
  // 获取标签数据
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        if (data && Array.isArray(data)) {
          setTags(data);
        } else {
          setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级']);
        }
      } catch (err) {
        console.error('获取标签失败:', err);
        setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级']);
      }
    };

    fetchTags();
  }, []);

  // 获取提示词数据
  useEffect(() => {
    const fetchPrompts = async () => {
      console.log('开始获取提示词数据，filters:', filters);
      setLoading(true);
      setError(null);
      
      try {
        const response = await getPrompts(filters);
        console.log('获取提示词响应:', response);
        
        if (response && response.data && Array.isArray(response.data)) {
          console.log('设置提示词数据，数量:', response.data.length);
          setPrompts(response.data);
          setTotalPages(response.totalPages || 1);
          setTotalCount(response.total || 0);
          setError(null);
        } else {
          console.error('获取提示词数据格式错误:', response);
          setPrompts([]);
          setTotalPages(1);
          setTotalCount(0);
          setError('获取提示词数据格式错误');
        }
      } catch (err) {
        console.error('获取提示词失败:', err);
        setError('无法加载提示词，请稍后再试');
        setPrompts([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        console.log('提示词数据加载完成');
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [filters]);

  // 处理过滤器变更
  const handleFilterChange = (newFilters: PromptFiltersType) => {
    console.log('过滤器变更:', newFilters);
    setFilters({ ...newFilters, page: 1 });
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    console.log('页面变更:', newPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ ...filters, page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const currentPage = filters.page || 1;
    const maxVisiblePages = 5;
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
        className="flex items-center justify-between p-4 md:p-6 bg-dark-card/30 backdrop-blur-md rounded-xl border border-dark-border shadow-xl"
      >
        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              显示第 <span className="font-medium text-neon-cyan">{(currentPage - 1) * (filters.pageSize || 21) + 1}</span> 到{' '}
              <span className="font-medium text-neon-cyan">
                {Math.min(currentPage * (filters.pageSize || 21), totalCount)}
              </span>{' '}
              条，共 <span className="font-medium text-neon-purple">{totalCount}</span> 条结果
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* 上一页 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 页码 */}
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-dark-border focus:z-20 focus:outline-offset-0 transition-all duration-300 ${
                    page === currentPage
                      ? 'z-10 bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg'
                      : 'text-gray-300 hover:bg-neon-cyan/20 hover:text-neon-cyan'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* 下一页 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </motion.div>
    );
  };

  console.log('组件渲染状态:', { 
    loading, 
    error, 
    promptsCount: prompts.length, 
    totalCount, 
    totalPages 
  });

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 spacing-section">
        <div className="container-custom">
          <div className="minimal-spacing">
            {/* 页面标题 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-3 md:mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                探索提示词宇宙
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                在这里发现最强大的AI提示词，解锁无限创意可能
              </motion.p>
            </motion.div>

            {/* 过滤器 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <PromptFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                tags={tags}
              />
            </motion.div>

            {/* 错误提示 */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
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

            {/* 主要内容区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-dark-card/30 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
            >
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
                    正在加载提示词...
                  </motion.p>
                </motion.div>
              ) : (
                <>
                  {prompts && prompts.length > 0 ? (
                    <>
                      {/* 提示词网格 */}
                      <motion.div 
                        className="prompt-grid p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                      >
                        {prompts.map((prompt, index) => (
                          <motion.div
                            key={prompt.id || prompt.name || `prompt-${index}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                              duration: 0.6, 
                              delay: 1.2 + index * 0.1,
                              ease: "easeOut"
                            }}
                          >
                            <PromptCard prompt={prompt} />
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* 分页 */}
                      {totalPages > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 1.5 }}
                          className="border-t border-dark-border"
                        >
                          {renderPagination()}
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1 }}
                      className="text-center py-20"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-600/20 to-gray-400/20 flex items-center justify-center mx-auto mb-6">
                        <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">暂无提示词</h3>
                      <p className="text-gray-400">当前条件下没有找到相关提示词，请尝试调整搜索条件</p>
                      
                      {/* 调试信息 */}
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-sm text-gray-400">
                        <p>API响应: totalCount={totalCount}, loading={loading.toString()}</p>
                        <p>过滤器: {JSON.stringify(filters)}</p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
