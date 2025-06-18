import { useState, useEffect } from 'react';
import PromptCard from '@/components/prompts/PromptCard';
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
  
  // 过滤状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name' | 'updated'>('latest');

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

  // 获取提示词数据
  useEffect(() => {
    const loadPrompts = async () => {
      console.log('开始加载提示词，页面:', currentPage);
      setLoading(true);
      setError(null);
      
      try {
        const filters: PromptFiltersType = {
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sortBy: sortBy,
          page: currentPage,
          pageSize: pageSize
        };
        
        const response = await getPrompts(filters);
        console.log('获取提示词响应:', response);
        
        setPrompts(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.total || 0);
      } catch (err) {
        console.error('获取提示词失败:', err);
        setError('加载提示词失败，请刷新页面重试');
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [currentPage, searchQuery, selectedCategory, selectedTags, sortBy]);

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理搜索
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理分类选择
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
    setCurrentPage(1);
  };

  // 处理标签选择
  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setCurrentPage(1);
  };

  // 处理排序
  const handleSortChange = (newSortBy: 'latest' | 'oldest' | 'name' | 'updated') => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  // 清除所有过滤器
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('latest');
    setCurrentPage(1);
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

  console.log('组件渲染状态:', { 
    loading, 
    error, 
    promptsCount: prompts.length, 
    totalCount, 
    totalPages,
    currentPage 
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

        {/* 简单的过滤器 */}
        <div className="bg-dark-card/30 backdrop-blur-md rounded-2xl border border-dark-border p-6 mb-8">
          {/* 搜索框 */}
          <div className="mb-4">
            <input
              type="text"
              className="w-full px-4 py-3 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
              placeholder="搜索提示词..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* 分类选择 */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-neon-cyan mb-3">类别</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:bg-dark-card hover:text-neon-cyan'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 排序选择 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-neon-purple mb-3">排序方式</h3>
              <div className="flex gap-2">
                {[
                  { value: 'latest', label: '最新' },
                  { value: 'updated', label: '更新' },
                  { value: 'oldest', label: '最早' },
                  { value: 'name', label: '名称' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sortBy === option.value
                        ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                        : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:bg-dark-card hover:text-neon-purple'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 清除过滤器 */}
            {(searchQuery || selectedCategory || selectedTags.length > 0 || sortBy !== 'latest') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-300"
              >
                清除过滤器
              </button>
            )}
          </div>
        </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {prompts.map((prompt, index) => {
                      const stableKey = prompt.id || `prompt-${currentPage}-${index}`;
                      return (
                        <div key={stableKey}>
                          <PromptCard prompt={prompt} />
                        </div>
                      );
                    })}
                  </div>

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
