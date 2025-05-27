import React, { useState, useEffect } from 'react';
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

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // 确保“全部”选项始终存在
        if (data.length > 0 && !data.includes('全部')) {
          setCategories(['全部', ...data]);
        } else {
          setCategories(data);
        }
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories(['全部']);
      }
    };

    fetchCategories();
  }, []);
  
  // 获取标签数据
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        setTags(data);
      } catch (err) {
        console.error('获取标签失败:', err);
        // 如果获取失败，设置一些默认标签
        setTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色']);
      }
    };

    fetchTags();
  }, []);

  // 获取提示词数据
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const response = await getPrompts(filters);
        setPrompts(response.data);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (err) {
        console.error('获取提示词失败:', err);
        setError('无法加载提示词，请稍后再试');
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [filters]);

  // 处理过滤器变更
  const handleFilterChange = (newFilters: PromptFiltersType) => {
    // 重置到第一页
    setFilters({ ...newFilters, page: 1 });
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 渲染分页控件
  const renderPagination = () => {
    const pages = [];
    const currentPage = filters.page || 1;
    
    // 确定显示的页码范围
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
            i === currentPage
              ? 'z-10 bg-primary-600 text-white focus:z-20'
              : 'bg-white text-gray-500 hover:bg-gray-50 focus:z-20'
          } border border-gray-300`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              显示第 <span className="font-medium">{(currentPage - 1) * (filters.pageSize || 12) + 1}</span> 到{' '}
              <span className="font-medium">
                {Math.min(currentPage * (filters.pageSize || 12), prompts.length)}
              </span>{' '}
              条，共 <span className="font-medium">{prompts.length}</span> 条结果
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ${
                  currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                } border border-gray-300`}
              >
                <span className="sr-only">上一页</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {pages}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                } border border-gray-300`}
              >
                <span className="sr-only">下一页</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">浏览提示词</h1>
          <p className="mt-2 text-gray-600">
            探索我们的提示词库，找到适合您需求的完美提示词
          </p>
        </div>

        {/* 过滤器 */}
        <PromptFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          tags={tags}
        />

        {/* 错误提示 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">发生错误</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">正在加载提示词...</p>
          </div>
        ) : (
          <>
            {/* 没有结果 */}
            {prompts.length === 0 && !loading && !error ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h3 className="mt-2 text-lg font-medium text-gray-900">没有找到提示词</h3>
                <p className="mt-1 text-gray-500">尝试调整过滤条件或清除搜索关键词</p>
              </div>
            ) : (
              <>
                {/* 提示词网格 */}
                <div className="card-grid">
                  {prompts.map((prompt) => (
                    <PromptCard key={prompt.name} prompt={prompt} />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && renderPagination()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
