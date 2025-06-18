import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PromptCard from '@/components/prompts/PromptCard';
import PromptFilters from '@/components/prompts/PromptFilters';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters as PromptFiltersType } from '@/types';

export default function PromptsPage() {
  // 基础状态
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 21;
  
  // 使用统一的filters对象，但不包含分页信息
  const [filters, setFilters] = useState<Omit<PromptFiltersType, 'page' | 'pageSize'>>({
    search: '',
    category: '',
    tags: [],
    sortBy: 'latest'
  });

  // 获取基础数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          getCategories().catch(() => ['通用', '编程', '写作', '学术', '创意', '商业', '翻译', '教育']),
          getTags().catch(() => ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级'])
        ]);
        
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (err) {
        console.error('获取基础数据失败:', err);
      }
    };
    
    loadInitialData();
  }, []);

  // 获取提示词数据 - 使用useCallback避免依赖问题
  const loadPrompts = useCallback(async () => {
    console.log('=== 开始加载提示词 ===');
    console.log('当前页面:', currentPage);
    console.log('过滤器状态:', filters);
    
    setLoading(true);
    setError(null);
    
    try {
      const apiFilters: PromptFiltersType = {
        search: filters.search || undefined,
        category: filters.category && filters.category !== '全部' ? filters.category : undefined,
        tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
        sortBy: filters.sortBy,
        page: currentPage,
        pageSize: pageSize
      };
      
      console.log('API请求参数:', apiFilters);
      
      const response = await getPrompts(apiFilters);
      console.log('API响应数据:', {
        success: !!response,
        dataLength: response?.data?.length || 0,
        total: response?.total || 0,
        totalPages: response?.totalPages || 0,
        currentPageFromAPI: response?.page || 0
      });
      
      if (response && response.data) {
        setPrompts(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.total || 0);
        console.log('✅ 数据设置成功，提示词数量:', response.data.length);
      } else {
        console.warn('⚠️ API响应异常:', response);
        setPrompts([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('❌ 获取提示词失败:', err);
      setError('加载提示词失败，请刷新页面重试');
      setPrompts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      console.log('=== 加载完成 ===');
    }
  }, [currentPage, filters.search, filters.category, filters.tags, filters.sortBy]);

  // 当分页或过滤器变化时加载数据
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // 处理分页 - 只更新currentPage
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      console.log('📄 页面变化:', page);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理过滤器变化 - 只更新filters，重置页面到1
  const handleFilterChange = (newFilters: PromptFiltersType) => {
    console.log('🔄 过滤器变化:', { 
      旧值: filters, 
      新值: newFilters 
    });
    
    // 从新的过滤器中排除分页信息
    const { page, pageSize, ...filterWithoutPaging } = newFilters;
    
    setFilters(filterWithoutPaging);
    setCurrentPage(1); // 重置到第一页
  };

  // 渲染分页
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between p-4 md:p-6 bg-dark-card/30 backdrop-blur-md rounded-xl border border-dark-border shadow-xl mt-6">
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
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
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

  console.log('🎯 组件渲染状态:', { 
    loading, 
    error, 
    promptsCount: prompts.length, 
    totalCount, 
    totalPages,
    currentPage,
    filters,
    categories: categories.length,
    tags: tags.length
  });

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-4">
            探索提示词宇宙
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            在这里发现最强大的AI提示词，解锁无限创意可能
          </p>
        </div>

        {/* 过滤器组件 */}
        <PromptFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          tags={tags}
        />

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* 主要内容区域 */}
        <div className="bg-dark-card/30 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-xl text-gray-400">正在加载提示词...</p>
            </div>
          ) : (
            <>
              {prompts && prompts.length > 0 ? (
                <>
                  {/* 提示词网格 */}
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {prompts.map((prompt, index) => {
                        const stableKey = prompt.id || `prompt-${currentPage}-${index}`;
                        return (
                          <motion.div
                            key={stableKey}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ 
                              duration: 0.4, 
                              delay: index * 0.1,
                              layout: { duration: 0.3 }
                            }}
                          >
                            <PromptCard prompt={prompt} />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>

                  {/* 分页 */}
                  {totalPages > 1 && renderPagination()}
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
