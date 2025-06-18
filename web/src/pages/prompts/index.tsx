import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptCard from '@/components/prompts/PromptCard';
import PromptFilters from '@/components/prompts/PromptFilters';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';

export default function PromptsPage() {
  // 使用ref跟踪组件是否已挂载
  const isMountedRef = useRef(true);
  
  // 状态定义
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<PromptFiltersType>({
    search: '',
    category: '',
    tags: [],
    sortBy: 'latest',
    page: 1,
    pageSize: 21
  });

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 获取分类数据 - 使用useCallback避免重复创建
  const fetchCategories = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const data = await getCategories();
      if (isMountedRef.current && data && Array.isArray(data)) {
        setCategories(data);
      } else if (isMountedRef.current) {
        setCategories(['通用', '编程', '写作', '学术', '创意', '商业', '翻译', '教育']);
      }
    } catch (err) {
      console.error('获取分类失败:', err);
      if (isMountedRef.current) {
        setCategories(['通用', '编程', '写作', '学术', '创意', '商业', '翻译', '教育']);
      }
    }
  }, []);

  // 获取标签数据 - 使用useCallback避免重复创建
  const fetchTags = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const data = await getTags();
      if (isMountedRef.current && data && Array.isArray(data)) {
        setTags(data);
      } else if (isMountedRef.current) {
        setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级']);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
      if (isMountedRef.current) {
        setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级']);
      }
    }
  }, []);

  // 获取提示词数据 - 使用useCallback避免重复创建
  const fetchPrompts = useCallback(async (currentFilters: PromptFiltersType) => {
    if (!isMountedRef.current) return;
    
    console.log('开始获取提示词数据，filters:', currentFilters);
    setLoading(true);
    setError(null);
    
    try {
      const response = await getPrompts(currentFilters);
      console.log('获取提示词响应:', response);
      
      if (!isMountedRef.current) return; // 再次检查组件是否已卸载
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('设置提示词数据，数量:', response.data.length);
        // 批量状态更新，避免多次渲染
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
      if (isMountedRef.current) {
        setError('无法加载提示词，请稍后再试');
        setPrompts([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } finally {
      if (isMountedRef.current) {
        console.log('提示词数据加载完成');
        setLoading(false);
      }
    }
  }, []);

  // 初始化数据加载
  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  // 当filters变化时获取数据
  useEffect(() => {
    fetchPrompts(filters);
  }, [filters, fetchPrompts]);

  // 处理过滤器变更 - 使用useCallback避免重复创建
  const handleFilterChange = useCallback((newFilters: PromptFiltersType) => {
    console.log('过滤器变更:', newFilters);
    setFilters({ ...newFilters, page: 1 });
  }, []);

  // 处理分页 - 使用useCallback避免重复创建
  const handlePageChange = useCallback((newPage: number) => {
    console.log('页面变更:', newPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev: PromptFiltersType) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

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
      <div className="flex items-center justify-between p-4 md:p-6 bg-dark-card/30 backdrop-blur-md rounded-xl border border-dark-border shadow-xl">
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
      </div>
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
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-3 md:mb-4">
                探索提示词宇宙
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                在这里发现最强大的AI提示词，解锁无限创意可能
              </p>
            </div>

            {/* 过滤器 */}
            <div>
              <PromptFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                tags={tags}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-8">
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
              </div>
            )}

            {/* 主要内容区域 */}
            <div className="bg-dark-card/30 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden">
              {loading ? (
                <div className="text-center py-20">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-neon-purple rounded-full animate-spin animate-reverse"></div>
                  </div>
                  <p className="mt-6 text-xl text-gray-400">正在加载提示词...</p>
                </div>
              ) : (
                <>
                  {prompts && prompts.length > 0 ? (
                    <>
                      {/* 提示词网格 */}
                      <div className="prompt-grid p-6">
                        {prompts.map((prompt, index) => {
                          // 确保每个item都有稳定的key并验证数据完整性
                          if (!prompt) {
                            console.warn('发现空提示词数据:', index);
                            return null;
                          }
                          
                          const stableKey = prompt.id || `prompt-${filters.page || 1}-${index}`;
                          
                          return (
                            <div key={stableKey}>
                              <PromptCard prompt={prompt} />
                            </div>
                          );
                        })}
                      </div>

                      {/* 分页 */}
                      {totalPages > 1 && (
                        <div className="border-t border-dark-border">
                          {renderPagination()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20">
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
