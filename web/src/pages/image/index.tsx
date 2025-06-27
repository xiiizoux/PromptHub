import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';
import ImagePromptCard from '@/components/prompts/ImagePromptCard';
import PromptFilters from '@/components/prompts/PromptFilters';
import SidebarFilters from '@/components/layout/SidebarFilters';

export default function ImagePromptsPage() {
  // 状态管理
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<PromptFiltersType>({
    page: 1,
    pageSize: 24, // 图像卡片稍大，使用24个（4x6或6x4布局）
    sortBy: 'latest',
    category_type: 'image' // 启用图像类型过滤
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取图像分类数据
  useEffect(() => {
    if (!mounted) return;
    
    const abortController = new AbortController();
    
    const fetchCategories = async () => {
      try {
        // 直接从数据库获取图像类型的分类
        const data = await getCategories('image');

        if (abortController.signal.aborted) {
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          // 如果数据库没有数据，使用默认分类
          setCategories([
            '真实摄影', '人像摄影', '风景摄影', '产品摄影',
            '艺术绘画', '动漫插画', '抽象艺术', '数字艺术',
            'Logo设计', '海报设计', '时尚设计', '建筑空间',
            '概念设计', '科幻奇幻', '复古怀旧'
          ]);
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('获取图像分类失败:', err);
        // 错误时使用默认分类
        setCategories([
          '真实摄影', '人像摄影', '风景摄影', '产品摄影',
          '艺术绘画', '动漫插画', '抽象艺术', '数字艺术',
          'Logo设计', '海报设计', '时尚设计', '建筑空间',
          '概念设计', '科幻奇幻', '复古怀旧'
        ]);
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
            // 在客户端过滤图像类型的提示词
            const imagePrompts = response.data.filter(prompt => 
              prompt.category_type === 'image'
            );
            setPrompts(imagePrompts);
            setTotalPages(Math.ceil(imagePrompts.length / (filters.pageSize || 24)));
            setTotalCount(imagePrompts.length);
            setError(null);
            setLoading(false);
            return;
          } else {
            setPrompts([]);
            setTotalPages(1);
            setTotalCount(0);
            setError('获取图像提示词数据格式错误，请刷新页面重试');
            setLoading(false);
            return;
          }
        } catch (err) {
          if (abortController.signal.aborted) {
            return;
          }

          retryCount++;
          console.error(`获取图像提示词失败 (尝试 ${retryCount}/${maxRetries + 1}):`, err);

          if (retryCount > maxRetries) {
            setError('无法加载图像提示词，请检查网络连接后重试');
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
    // 保持图像类型过滤
    setFilters({ ...newFilters, page: 1, category_type: 'image' });
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
          className="px-3 py-2 text-sm rounded-lg glass border border-pink-500/20 text-pink-400 hover:border-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          上一页
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm rounded-lg glass border border-pink-500/20 text-gray-400 hover:text-pink-400 hover:border-pink-500/40 transition-all"
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
                ? 'border-pink-500/50 bg-pink-500/10 text-pink-400'
                : 'border-pink-500/20 text-gray-400 hover:text-pink-400 hover:border-pink-500/40'
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
              className="px-3 py-2 text-sm rounded-lg glass border border-pink-500/20 text-gray-400 hover:text-pink-400 hover:border-pink-500/40 transition-all"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm rounded-lg glass border border-pink-500/20 text-pink-400 hover:border-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <div className="min-h-screen relative">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg-primary via-dark-bg-secondary to-dark-bg-primary" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* 边栏过滤器 */}
      <SidebarFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        tags={tags}
        hideTypeFilter={true}
      >
        <div className="relative z-10 container-custom py-12">
        {/* 页面标题 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 mr-4">
              <PhotoIcon className="h-8 w-8 text-dark-bg-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white gradient-text">
              图像提示词
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            发现最精美的图像生成提示词，释放AI图像创作的无限可能
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-pink-400 mt-4">
              共找到 {totalCount} 个图像提示词
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
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400 mb-4"></div>
              <p className="text-gray-400">正在加载图像提示词...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="text-pink-400 text-6xl mb-4">🖼️</div>
              <h2 className="text-2xl font-bold text-white mb-2">加载失败</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
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
              <div className="text-gray-400 text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold text-white mb-2">暂无图像提示词</h2>
              <p className="text-gray-400 mb-6">
                {filters.search || filters.category || filters.tags?.length ? 
                  '没有找到符合条件的图像提示词，请尝试调整筛选条件' : 
                  '还没有图像提示词，创建第一个视觉奇迹吧！'
                }
              </p>
              <button
                onClick={() => window.location.href = '/create'}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                创建图像提示词
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {prompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <ImagePromptCard prompt={prompt} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分页 */}
        {!loading && !error && prompts.length > 0 && renderPagination()}
        </div>
      </SidebarFilters>
    </div>
  );
}