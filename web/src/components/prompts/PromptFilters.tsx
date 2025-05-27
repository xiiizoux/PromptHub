import React, { useState } from 'react';
import { PromptFilters as PromptFiltersType } from '@/types';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PromptFiltersProps {
  filters: PromptFiltersType;
  onFilterChange: (newFilters: PromptFiltersType) => void;
  categories: string[];
  tags: string[];
}

const PromptFilters: React.FC<PromptFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  tags,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  // 处理类别选择
  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  // 处理标签选择
  const handleTagChange = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    
    onFilterChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  // 处理排序方式变更
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as 'latest' | 'popular' | 'rating',
    });
  };

  // 清除所有过滤器
  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      category: undefined,
      tags: undefined,
      sortBy: 'latest',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="input pl-10"
          placeholder="搜索提示词..."
          value={filters.search || ''}
          onChange={handleSearchChange}
        />
      </div>

      {/* 移动端过滤按钮 */}
      <div className="flex justify-between items-center mb-4 md:hidden">
        <button
          type="button"
          className="flex items-center text-sm font-medium text-gray-700"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <FunnelIcon className="w-4 h-4 mr-1" />
          过滤选项
        </button>
        
        {(filters.category || (filters.tags && filters.tags.length > 0)) && (
          <button
            type="button"
            className="text-sm text-primary-600 hover:text-primary-800"
            onClick={clearAllFilters}
          >
            清除所有
          </button>
        )}
      </div>

      {/* 桌面端过滤器 */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}>
        {/* 类别过滤 - 新的多列布局 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">类别</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.category === category
                    ? 'bg-primary-100 text-primary-800 border-2 border-primary-300 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 标签过滤 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagChange(tag)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filters.tags?.includes(tag)
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {tag}
                  {filters.tags?.includes(tag) && (
                    <XMarkIcon className="w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">排序方式</h3>
            <select
              className="input w-full"
              value={filters.sortBy || 'latest'}
              onChange={handleSortChange}
            >
              <option value="latest">最新</option>
              <option value="popular">最受欢迎</option>
              <option value="rating">最高评分</option>
            </select>
          </div>
        </div>

        {/* 清除过滤器按钮（桌面端） */}
        <div className="flex justify-end mt-4">
          {(filters.category || (filters.tags && filters.tags.length > 0)) && (
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              onClick={clearAllFilters}
            >
              清除所有过滤器
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptFilters;
