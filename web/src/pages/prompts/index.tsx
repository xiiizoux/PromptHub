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
    pageSize: 12,
    sortBy: 'latest',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 如果组件未挂载，返回null避免SSR问题
  if (!mounted) {
    return null;
  }

  // 获取分类数据
  useEffect(() => {
    if (!mounted) return;
    
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // 直接使用字符串数组
        // 确保"全部"选项始终存在
        if (data && Array.isArray(data)) {
          if (data.length > 0 && !data.includes('全部')) {
            setCategories(['全部', ...data]);
          } else {
            setCategories(data);
          }
        } else {
          setCategories(['全部']);
        }
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories(['全部']);
      }
    };

    fetchCategories();
  }, [mounted]);
  
  // 获取标签数据
  useEffect(() => {
    if (!mounted) return;
    
    const fetchTags = async () => {
      try {
        const data = await getTags();
        if (data && Array.isArray(data)) {
          setTags(data);
        } else {
          setTags([]);
        }
      } catch (err) {
        console.error('获取标签失败:', err);
        // 如果获取失败，设置一些默认标签
        setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色']);
      }
    };

    fetchTags();
  }, [mounted]);

  // 获取提示词数据
  useEffect(() => {
    if (!mounted) return;
    
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const response = await getPrompts(filters);
        if (response && response.data && Array.isArray(response.data)) {
          setPrompts(response.data);
          setTotalPages(response.totalPages || 1);
          setError(null);
        } else {
          setPrompts([]);
          setTotalPages(1);
          setError('获取提示词数据格式错误');
        }
      } catch (err) {
        console.error('获取提示词失败:', err);
        setError('无法加载提示词，请稍后再试');
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
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
        className="flex items-center justify-between p-6 bg-dark-card/30 backdrop-blur-md rounded-xl border border-dark-border shadow-xl"
      >
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              显示第 <span className="font-medium text-neon-cyan">{(currentPage - 1) * (filters.pageSize || 12) + 1}</span> 到{' '}
              <span className="font-medium text-neon-cyan">
                {Math.min(currentPage * (filters.pageSize || 12), prompts.length)}
              </span>{' '}
              条，共 <span className="font-medium text-neon-purple">{prompts.length}</span> 条结果
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* 上一页 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 ${
                    page === currentPage
                      ? 'z-10 bg-neon-cyan text-dark-bg-primary'
                      : 'text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* 下一页 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              探索提示词宇宙
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              在这里发现最强大的AI提示词，解锁无限创意可能
            </motion.p>
          </motion.div>

          {/* 过滤器 */}
          {categories.length > 0 && (
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
          )}

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
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
            ) :
              <>
                {/* 没有结果 */}
                {prompts.length === 0 && !loading && !error ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="bg-dark-card/50 backdrop-blur-md rounded-xl border border-dark-border p-12 shadow-xl">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5">
                        <div className="w-full h-full bg-dark-bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">没有找到提示词</h3>
                      <p className="text-gray-400 text-lg">尝试调整过滤条件或清除搜索关键词</p>
                    </div>
                  </motion.div>
                ) :
                  <>
                    {/* 提示词网格 */}
                    <motion.div 
                      className="card-grid mb-12"
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
      </div>
    </div>
  );
}
