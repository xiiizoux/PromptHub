import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';
import PromptCard from '@/components/prompts/PromptCard';
import SidebarFilters from '@/components/layout/SidebarFilters';

export default function ChatPromptsPage() {
  // 状态管理
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<PromptFiltersType>({
    page: 1,
    pageSize: 30,
    sortBy: 'latest',
    category_type: 'chat', // 只获取对话类型的提示词
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取对话分类数据
  useEffect(() => {
    if (!mounted) return;

    const abortController = new AbortController();

    const fetchCategories = async () => {
      try {
        // 直接从数据库获取chat类型的分类
        const data = await getCategories('chat');

        if (abortController.signal.aborted) {
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          // 如果数据库没有数据，显示空数组而不是硬编码回退
          setCategories([]);
          console.warn('数据库中没有chat类型的分类数据');
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('获取chat分类失败:', err);
        // 错误时显示空数组而不是硬编码回退
        setCategories([]);
      }
    };

    fetchCategories();
    
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

        if (abortController.signal.aborted) {
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setTags(data);
        } else {
          setTags([]);
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('获取标签失败:', err);
        setTags([]);
      }
    };

    fetchTags();
    
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
      setError(null);

      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          if (abortController.signal.aborted) {
            return;
          }

          const response = await getPrompts(filters);

          if (response && response.data && Array.isArray(response.data)) {
            // 直接使用服务端过滤后的数据，不需要客户端过滤
            setPrompts(response.data);
            setTotalPages(response.totalPages || 1);
            setTotalCount(response.total || 0);
            setError(null);
            setLoading(false);
            return;
          } else {
            setPrompts([]);
            setTotalPages(1);
            setTotalCount(0);
            setError('获取对话提示词数据格式错误，请刷新页面重试');
            setLoading(false);
            return;
          }
        } catch (err) {
          if (abortController.signal.aborted) {
            return;
          }

          retryCount++;
          console.error(`获取对话提示词失败 (尝试 ${retryCount}/${maxRetries + 1}):`, err);

          if (retryCount > maxRetries) {
            setError('无法加载对话提示词，请检查网络连接后重试');
            setPrompts([]);
            setTotalPages(1);
            setTotalCount(0);
            break;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    };

    fetchPrompts();

    return () => {
      abortController.abort();
    };
  }, [filters, mounted]);

  // 处理过滤器变更
  const handleFilterChange = (newFilters: PromptFiltersType) => {
    // 保持category_type为'chat'，重置到第一页
    setFilters({ ...newFilters, page: 1, category_type: 'chat' });
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const currentPage = filters.page || 1;
    const maxPagesToShow = 7;
    const sidePages = 2;

    let startPage = Math.max(1, currentPage - sidePages);
    let endPage = Math.min(totalPages, currentPage + sidePages);

    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center space-x-2 mt-12"
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm rounded-lg glass border border-neon-cyan/20 text-neon-cyan hover:border-neon-cyan/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          上一页
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm rounded-lg glass border border-neon-cyan/20 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm rounded-lg glass border transition-all ${
              page === currentPage
                ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                : 'border-neon-cyan/20 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm rounded-lg glass border border-neon-cyan/20 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm rounded-lg glass border border-neon-cyan/20 text-neon-cyan hover:border-neon-cyan/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          下一页
        </button>
      </motion.div>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/10 to-neon-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-purple/10 to-neon-pink/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* 边栏过滤器 */}
      <SidebarFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        tags={tags}
        hideTypeFilter={true}
      >
        <div className="relative z-10 spacing-section page-bottom-padding">
          <div className="container-custom">
            {/* 页面标题 */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue mr-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-dark-bg-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white gradient-text">
                  对话提示词
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
                探索最优秀的对话AI提示词，让你的对话更智能、更有深度、更富创造力
              </p>
              {totalCount > 0 && (
                <p className="text-sm text-neon-cyan mt-4">
                  共找到 {totalCount} 个对话提示词
                </p>
              )}
            </motion.div>

        {/* 主要内容 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-cyan mb-4"></div>
              <p className="text-gray-400">正在加载对话提示词...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="text-neon-red text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">加载失败</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                重新加载
              </button>
            </motion.div>
          ) : prompts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-2">暂无对话提示词</h2>
              <p className="text-gray-400 mb-6">
                {filters.search || filters.category || filters.tags?.length ? 
                  '没有找到符合条件的对话提示词，请尝试调整筛选条件' : 
                  '还没有对话提示词，成为第一个创建者吧！'
                }
              </p>
              <button
                onClick={() => window.location.href = '/create'}
                className="btn-primary"
              >
                创建对话提示词
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {prompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PromptCard prompt={prompt} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

            {/* 分页 */}
            {!loading && !error && prompts.length > 0 && renderPagination()}
          </div>
        </div>
      </SidebarFilters>
    </div>
  );
}