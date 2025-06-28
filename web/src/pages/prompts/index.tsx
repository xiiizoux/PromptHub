import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';
import PromptCard from '@/components/prompts/PromptCard';
import PromptFilters from '@/components/prompts/PromptFilters';
import SidebarFilters from '@/components/layout/SidebarFilters';

export default function PromptsPage() {
  // 状态管理
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<PromptFiltersType>({
    page: 1,
    pageSize: 30, // 改为30个（10行x3列）
    sortBy: 'latest',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取分类数据
  useEffect(() => {
    if (!mounted) return;
    
    const abortController = new AbortController();
    
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        // 检查请求是否被中止
        if (abortController.signal.aborted) {
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        // 检查请求是否被中止
        if (abortController.signal.aborted) {
          return;
        }

        console.error('获取分类失败:', err);
        setCategories([]);
      }
    };

    fetchCategories();
    
    // 清理函数：当组件卸载或依赖项变化时中止请求
    return () => {
      abortController.abort();
    };
  }, [mounted]);
  
  // 获取标签数据
  useEffect(() => {
    if (!mounted) return;
    
    const abortController = new AbortController();
    
    const fetchTags = async () => {
      try {
        const data = await getTags();

        // 检查请求是否被中止
        if (abortController.signal.aborted) {
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setTags(data);
        } else {
          setTags([]);
        }
      } catch (err) {
        // 检查请求是否被中止
        if (abortController.signal.aborted) {
          return;
        }

        console.error('获取标签失败:', err);
        setTags([]);
      }
    };

    fetchTags();
    
    // 清理函数：当组件卸载或依赖项变化时中止请求
    return () => {
      abortController.abort();
    };
  }, [mounted]);

  // 获取提示词数据
  useEffect(() => {
    if (!mounted) return;

    const abortController = new AbortController();

    const fetchPrompts = async () => {
      setLoading(true);
      setError(null); // 重置错误状态

      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          // 检查请求是否被中止
          if (abortController.signal.aborted) {
            return;
          }

          const response = await getPrompts(filters);

          if (response && response.data && Array.isArray(response.data)) {
            setPrompts(response.data);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.total || 0);
            setError(null);
            setLoading(false); // 成功时立即停止加载状态
            return; // 成功，退出重试循环
          } else {
            setPrompts([]);
            setTotalPages(1);
            setTotalCount(0);
            setError('获取提示词数据格式错误，请刷新页面重试');
            setLoading(false); // 数据格式错误时也停止加载状态
            return; // 数据格式错误，不重试
          }
        } catch (err) {
          // 检查请求是否被中止
          if (abortController.signal.aborted) {
            return;
          }

          retryCount++;
          console.error(`获取提示词失败 (尝试 ${retryCount}/${maxRetries + 1}):`, err);

          if (retryCount > maxRetries) {
            // 重试次数用完，设置错误状态
            setError('无法加载提示词，请检查网络连接后重试');
            setPrompts([]);
            setTotalPages(1);
            setTotalCount(0);
            break;
          } else {
            // 等待后重试，使用指数退避
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      // 确保在所有情况下都停止加载状态
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    };

    fetchPrompts();

    // 清理函数：当组件卸载或依赖项变化时中止请求
    return () => {
      abortController.abort();
    };
  }, [filters, mounted]);

  // 处理过滤器变更
  const handleFilterChange = (newFilters: PromptFiltersType) => {
    // 重置到第一页
    setFilters({ ...newFilters, page: 1 });
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    // 滚动到页面顶部
    if (typeof window !== 'undefined') {
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
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              显示第 <span className="font-medium text-neon-cyan">{(currentPage - 1) * (filters.pageSize || 30) + 1}</span> 到{' '}
              <span className="font-medium text-neon-cyan">
                {Math.min(currentPage * (filters.pageSize || 30), totalCount)}
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

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      {/* 边栏过滤器 */}
      <SidebarFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        tags={tags}
      >
        <div className="relative z-10 spacing-section page-bottom-padding">
        <div className="container-custom">
          {/* 如果组件未挂载，显示加载状态 */}
          {!mounted ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center spacing-content"
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
                正在初始化页面...
              </motion.p>
            </motion.div>
          ) : (
            <div className="minimal-spacing">
              {/* 页面标题 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-6"
              >
                <motion.h1
                  className="text-2xl md:text-3xl font-bold text-neon-cyan mb-2"
                  style={{ color: '#00ffff' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <RectangleStackIcon className="h-6 w-6 text-neon-cyan mr-2 inline" style={{ color: '#00ffff' }} />
                  对话提示词
                </motion.h1>
                <motion.p
                  className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  在这里发现最强大的AI提示词，解锁无限创意可能
                </motion.p>
              </motion.div>



              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-red-200">{error}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setError(null);
                        // 重新加载数据
                        window.location.reload();
                      }}
                      className="mt-3 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 text-red-200 rounded-md text-sm transition-colors"
                    >
                      重新加载页面
                    </button>
                  </div>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >

                
                {/* 加载状态 */}
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center spacing-content"
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
                ) :
                  <>
                    {/* 没有结果 */}
                    {prompts.length === 0 && !loading && !error ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center spacing-content"
                      >
                        <div className="bg-dark-card/50 backdrop-blur-md rounded-xl border border-dark-border p-6 md:p-8 shadow-xl">
                          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5">
                            <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 md:w-8 md:h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">没有找到提示词</h3>
                          <p className="text-gray-400 text-base md:text-lg">尝试调整过滤条件或清除搜索关键词</p>
                        </div>
                      </motion.div>
                    ) :
                      <>
                        {/* 提示词网格 */}
                        <motion.div
                          className="prompt-grid mb-8 md:mb-12"
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
                                ease: 'easeOut',
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
                            className="pagination-spacing"
                          >
                            {renderPagination()}
                          </motion.div>
                        )}
                      </>
                    }
                  </>
                }
              </motion.div>
            </div>
          )}
        </div>
        </div>
      </SidebarFilters>
    </div>
  );
}
