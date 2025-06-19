import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPrompts, getCategories, getTags } from '@/lib/api';
import { PromptInfo, PromptFilters } from '@/types';

// 简化的过滤器组件
const SearchAndFilters = ({ 
  searchQuery, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange,
  categories,
  sortBy,
  onSortChange 
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sortBy: string;
  onSortChange: (value: string) => void;
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-dark-border rounded-2xl p-6 mb-8 shadow-xl">
      {/* 搜索框 */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-4 py-4 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan focus:shadow-neon-sm transition-all duration-300 backdrop-blur-sm text-lg"
          placeholder="搜索提示词..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* 过滤器和排序 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 分类过滤 */}
        <div>
          <label className="block text-sm font-medium text-neon-cyan mb-3">分类</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-3 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
          >
            <option value="">全部分类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 排序 */}
        <div>
          <label className="block text-sm font-medium text-neon-pink mb-3">排序方式</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-3 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all duration-300"
          >
            <option value="latest">最新创建</option>
            <option value="updated">最近更新</option>
            <option value="oldest">最早创建</option>
            <option value="name">名称排序</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// 分页组件
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalCount, 
  pageSize, 
  onPageChange 
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) => {
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
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* 页码 */}
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-dark-border hover:bg-dark-card focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// 简化的PromptCard组件，不包含BookmarkButton
const SimplePromptCard = ({ prompt }: { prompt: PromptInfo }) => {
  if (!prompt.id) return null;

  return (
    <div className="card glass border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 group cursor-pointer relative overflow-hidden p-6">
      {/* 分类标签 */}
      {prompt.category && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neon-purple/20 text-neon-purple border border-neon-purple/30 mb-3">
          {prompt.category}
        </div>
      )}
      
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-neon-cyan transition-colors">
        {prompt.name}
      </h3>
      
      {/* 描述 */}
      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
        {prompt.description || '暂无描述'}
      </p>
      
      {/* 标签 */}
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={`${prompt.id}-tag-${tag}-${index}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-neon-cyan/20 text-neon-cyan"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-gray-600 text-gray-400">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="mt-4 pt-4 border-t border-neon-cyan/10">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{prompt.author || '匿名'}</span>
          <span>v{prompt.version || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default function PromptsPage() {
  // === 基础状态 ===
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // === 基础数据 ===
  const [categories, setCategories] = useState<string[]>([]);
  
  // === 过滤和搜索状态 ===
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name' | 'updated'>('latest');
  
  // === 分页状态 ===
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 21;
  
  // === 防抖搜索 ===
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // === 加载控制标志 ===
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // 初始化
  useEffect(() => {
    setMounted(true);
  }, []);

  // 搜索防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // 搜索时重置到第一页
      setShouldLoad(true); // 触发数据加载
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 当分类或排序改变时，立即触发加载
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1);
      setShouldLoad(true);
    }
  }, [selectedCategory, sortBy, mounted]);

  // 当页码改变时，触发加载
  useEffect(() => {
    if (mounted && currentPage > 1) {
      setShouldLoad(true);
    }
  }, [currentPage, mounted]);

  // 获取基础数据（分类列表）
  useEffect(() => {
    if (!mounted) return;
    
    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories().catch(() => ['通用', '编程', '写作', '学术', '创意', '商业', '翻译', '教育']);
        setCategories(categoriesData);
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories(['通用', '编程', '写作', '学术', '创意', '商业', '翻译', '教育']);
      }
    };
    
    loadCategories();
  }, [mounted]);

  // 主数据加载逻辑 - 只在shouldLoad为true时执行
  useEffect(() => {
    if (!mounted || !shouldLoad) return;
    
    const loadData = async () => {
      console.log('=== 开始加载提示词数据 ===');
      console.log('参数:', {
        search: debouncedSearchQuery,
        category: selectedCategory,
        sortBy,
        page: currentPage,
        pageSize
      });
      
      setLoading(true);
      setError(null);
      
      try {
        const filters: PromptFilters = {
          search: debouncedSearchQuery || undefined,
          category: selectedCategory || undefined,
          sortBy: sortBy,
          page: currentPage,
          pageSize: pageSize
        };
        
        const response = await getPrompts(filters);
        
        if (response && response.data) {
          console.log('✅ 加载成功，数量:', response.data.length);
          setPrompts(response.data);
          setTotalPages(response.totalPages || 1);
          setTotalCount(response.total || 0);
          setError(null);
        } else {
          console.warn('⚠️ 响应异常:', response);
          setPrompts([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('❌ 加载失败:', err);
        setError('加载提示词失败，请刷新页面重试');
        setPrompts([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
        setShouldLoad(false); // 重置加载标志
        console.log('=== 加载完成 ===');
      }
    };
    
    loadData();
  }, [mounted, shouldLoad, debouncedSearchQuery, selectedCategory, sortBy, currentPage]);

  // 首次加载
  useEffect(() => {
    if (mounted) {
      setShouldLoad(true);
    }
  }, [mounted]);

  // === 事件处理函数 ===
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'latest' | 'oldest' | 'name' | 'updated');
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  console.log('🎯 页面状态:', { 
    mounted, 
    loading, 
    shouldLoad,
    error, 
    promptsCount: prompts.length,
    totalCount,
    currentPage,
    totalPages,
    searchQuery,
    debouncedSearchQuery,
    selectedCategory,
    sortBy
  });

  if (!mounted) {
    return null;
  }

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

        {/* 搜索和过滤器 */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          sortBy={sortBy}
          onSortChange={handleSortChange}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {prompts.map((prompt, index) => (
                      <SimplePromptCard 
                        key={prompt.id || `prompt-${currentPage}-${index}`} 
                        prompt={prompt} 
                      />
                    ))}
                  </div>

                  {/* 分页 */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-600/20 to-gray-400/20 flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">暂无提示词</h3>
                  <p className="text-gray-400">
                    {searchQuery || selectedCategory ? '当前搜索条件下没有找到匹配的提示词' : '当前没有找到任何提示词'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
