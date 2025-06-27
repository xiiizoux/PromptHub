import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptFilters as PromptFiltersType } from '@/types';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { getTagsWithStats } from '@/lib/api';

interface PromptFiltersProps {
  filters: {
    search?: string;
    category?: string;
    tags?: string[];
    sortBy?: 'latest' | 'oldest' | 'name' | 'updated';
    category_type?: 'chat' | 'image' | 'video';
  };
  onFilterChange: (newFilters: PromptFiltersType) => void;
  categories: string[];
  tags: string[];
  hideTypeFilter?: boolean; // 是否隐藏类型过滤器
}

const PromptFilters: React.FC<PromptFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  tags,
  hideTypeFilter = false,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [popularTags, setPopularTags] = useState<string[]>([]);

  // 获取热门标签数据
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const tagsWithStats = await getTagsWithStats();
        // 取使用频率最高的前8个标签
        const popular = tagsWithStats.slice(0, 8).map(item => item.tag);
        setPopularTags(popular);
      } catch (error) {
        console.error('获取热门标签失败:', error);
        // 如果获取失败，使用空数组
        setPopularTags([]);
      }
    };

    if (tags.length > 0) {
      fetchPopularTags();
    }
  }, [tags]);

  // 智能标签展示逻辑 - 性能优化版本
  const displayTags = useMemo(() => {
    const selectedTags = filters.tags || [];
    const selectedTagsSet = new Set(selectedTags); // 使用Set提高查找性能
    
    // 如果有搜索查询，优先处理搜索
    if (tagSearchQuery.trim()) {
      const searchLower = tagSearchQuery.toLowerCase();
      const result = [];
      const exactMatches = [];
      const partialMatches = [];
      
      // 一次遍历完成所有分类，提高性能
      for (const tag of tags) {
        const tagLower = tag.toLowerCase();
        if (!tagLower.includes(searchLower)) continue;
        
        if (selectedTagsSet.has(tag)) {
          result.push(tag); // 已选中的直接加到前面
        } else if (tagLower === searchLower) {
          exactMatches.push(tag);
        } else {
          partialMatches.push(tag);
        }
      }
      
      return [...result, ...exactMatches, ...partialMatches];
    }
    
    // 缓存经常访问的集合
    const popularTagsSet = new Set(popularTags);
    const result = [...selectedTags]; // 已选中的标签
    const popularUnselected = [];
    const otherUnselected = [];
    
    // 一次遍历完成分类
    for (const tag of tags) {
      if (selectedTagsSet.has(tag)) continue;
      
      if (popularTagsSet.has(tag)) {
        popularUnselected.push(tag);
      } else {
        otherUnselected.push(tag);
      }
    }
    
    const fullOrderedTags = [...result, ...popularUnselected, ...otherUnselected];
    
    // 如果显示所有标签，返回完整顺序
    if (showAllTags) {
      return fullOrderedTags;
    }
    
    // 默认模式：只显示前25个
    return fullOrderedTags.slice(0, 25);
  }, [tags, filters.tags, popularTags, showAllTags, tagSearchQuery]);

  // 优化版本：减少不必要的重新计算
  const { visibleTags, hiddenTags } = useMemo(() => {
    const allTags = [...tags];
    const selectedTags = filters.tags || [];
    
    // 快速计算可见和隐藏的标签
    if (showAllTags || tagSearchQuery.trim()) {
      return { visibleTags: displayTags, hiddenTags: [] };
    }
    
    const maxDisplayTags = 25;
    const visible = displayTags.slice(0, maxDisplayTags);
    const hidden = allTags.slice(maxDisplayTags);
    
    return { visibleTags: visible, hiddenTags: hidden };
  }, [displayTags, showAllTags, tagSearchQuery, tags, filters.tags]);

  // 计算未显示的标签数量 - 优化版本
  const hiddenTagsCount = useMemo(() => {
    if (showAllTags || tagSearchQuery.trim()) return 0;
    return Math.max(0, tags.length - visibleTags.length);
  }, [tags.length, visibleTags.length, showAllTags, tagSearchQuery]);

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

  // 处理标签搜索
  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchQuery(e.target.value);
  };

  // 处理排序方式变更
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as 'latest' | 'oldest' | 'name' | 'updated',
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
    setTagSearchQuery('');
    setShowAllTags(false);
  };

  // 切换显示所有标签 - 优化版本
  const toggleShowAllTags = () => {
    // 使用批量状态更新减少重新渲染
    React.startTransition(() => {
      setShowAllTags(!showAllTags);
      if (!showAllTags) {
        setTagSearchQuery(''); // 展开时清除搜索
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg border border-dark-border rounded-2xl p-6 mb-8 shadow-xl"
    >
      {/* 搜索框 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-neon-cyan" />
        </div>
        <motion.input
          type="search"
          id="prompt-search-input"
          name="promptSearch"
          autoComplete="search"
          aria-label="搜索提示词"
          whileFocus={{ scale: 1.02 }}
          className="w-full pl-12 pr-4 py-4 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan focus:shadow-neon-sm transition-all duration-300 backdrop-blur-sm text-lg"
          placeholder="搜索提示词..."
          value={filters.search || ''}
          onChange={handleSearchChange}
        />
      </motion.div>

      {/* 移动端过滤按钮 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex justify-between items-center mb-6 md:hidden"
      >
        <motion.button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-white/5 border border-dark-border rounded-lg text-neon-cyan hover:border-neon-cyan transition-all duration-300 backdrop-blur-sm"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
          过滤选项
        </motion.button>
        
        {(filters.category || (filters.tags && filters.tags.length > 0)) && (
          <motion.button
            type="button"
            onClick={clearAllFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-neon-pink hover:text-white transition-colors duration-300"
          >
            清除所有
          </motion.button>
        )}
      </motion.div>

      {/* 过滤器内容 */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: 1,
            height: 'auto',
          }}
          exit={{ opacity: 0, height: 0 }}
          className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}
        >
          {/* 类别过滤 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-lg font-medium text-neon-cyan mb-4 flex items-center">
              <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3 shadow-neon-sm"></div>
              类别
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {categories.map((category, index) => {
                return (
                  <motion.button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                      filters.category === category
                        ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-neon border border-neon-cyan'
                        : 'bg-dark-bg-secondary/50 text-gray-300 border border-dark-border hover:bg-dark-card hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon-sm'
                    }`}
                  >
                    {category}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* 标签过滤 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* 标签标题和排序方式 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-neon-purple flex items-center">
                    <div className="w-2 h-2 bg-neon-purple rounded-full mr-3 shadow-neon-sm"></div>
                    标签
                  </h3>
                </div>

                {/* 排序方式 - 紧凑按钮组（仅桌面端显示） */}
                <div className="hidden sm:flex items-center gap-3">
                  <h4 className="text-lg font-medium text-neon-pink flex items-center">
                    <div className="w-2 h-2 bg-neon-pink rounded-full mr-3 shadow-neon-sm"></div>
                    排序方式:
                  </h4>
                  <div className="flex bg-dark-bg-secondary/50 border border-dark-border rounded-lg p-1">
                    {[
                      { value: 'latest', label: '最新' },
                      { value: 'updated', label: '更新' },
                      { value: 'oldest', label: '最早' },
                      { value: 'name', label: '名称' },
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => handleSortChange({ target: { value: option.value } } as any)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          (filters.sortBy || 'latest') === option.value
                            ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/50 shadow-neon-sm'
                            : 'text-gray-400 hover:text-white hover:bg-dark-card'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 标签搜索框（始终显示） */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="relative mb-4"
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="w-4 h-4 text-neon-purple/60" />
                </div>
                <input
                  type="search"
                  id="tag-search-input"
                  name="tagSearch"
                  autoComplete="search"
                  aria-label="搜索标签"
                  placeholder="搜索标签..."
                  value={tagSearchQuery}
                  onChange={handleTagSearchChange}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-dark-bg-secondary/50 border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all duration-300"
                />
                <AnimatePresence>
                  {tagSearchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setTagSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 标签列表容器 */}
              <div className="min-h-[60px]"> {/* 固定最小高度，减少布局跳动 */}
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {visibleTags.map((tag, index) => (
                      <motion.button
                        key={`tag-${tag}`} // 更稳定的key
                        type="button"
                        onClick={() => handleTagChange(tag)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          transition: { 
                            duration: 0.2, 
                            delay: showAllTags ? index * 0.01 : Math.min(index * 0.02, 0.3), // 大幅减少延迟
                          },
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.9,
                          transition: { duration: 0.1 },
                        }}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-sm ${
                          filters.tags?.includes(tag)
                            ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50 shadow-neon-sm'
                            : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:bg-dark-card hover:border-neon-purple hover:text-neon-purple'
                        }`}
                      >
                        {tag}
                        {filters.tags?.includes(tag) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            <XMarkIcon className="w-3 h-3 ml-1" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>

                  {/* 更多标签按钮 */}
                  <AnimatePresence>
                    {!showAllTags && hiddenTagsCount > 0 && !tagSearchQuery && (
                      <motion.button
                        key="expand-button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          transition: { duration: 0.15 }, // 减少按钮动画时间
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.9,
                          transition: { duration: 0.1 },
                        }}
                        onClick={toggleShowAllTags}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-3 py-2 border border-dashed border-neon-purple/50 rounded-lg text-neon-purple hover:border-neon-purple hover:bg-neon-purple/10 transition-all duration-200 text-xs font-medium"
                      >
                        <ChevronDownIcon className="w-3 h-3 mr-1" />
                        +{hiddenTagsCount} 更多
                      </motion.button>
                    )}

                    {showAllTags && (
                      <motion.button
                        key="collapse-button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          transition: { duration: 0.15 }, // 减少按钮动画时间
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.9,
                          transition: { duration: 0.1 },
                        }}
                        onClick={toggleShowAllTags}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-3 py-2 bg-neon-purple/20 border border-neon-purple rounded-lg text-neon-purple hover:bg-neon-purple/30 transition-all duration-200 text-xs font-medium"
                      >
                        <ChevronUpIcon className="w-3 h-3 mr-1" />
                        收起
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* 标签搜索结果提示 */}
                {tagSearchQuery && visibleTags.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MagnifyingGlassIcon className="w-8 h-8 text-gray-600" />
                      <span>没有找到匹配 "{tagSearchQuery}" 的标签</span>
                      <button
                        onClick={() => setTagSearchQuery('')}
                        className="text-neon-purple hover:text-white transition-colors text-xs"
                      >
                        清除搜索
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* 移动端排序方式 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="sm:hidden"
          >
            <h3 className="text-lg font-medium text-neon-pink mb-4 flex items-center">
              <div className="w-2 h-2 bg-neon-pink rounded-full mr-3 shadow-neon-sm"></div>
              排序方式
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'latest', label: '最新创建' },
                { value: 'updated', label: '最近更新' },
                { value: 'oldest', label: '最早创建' },
                { value: 'name', label: '名称排序' },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange({ target: { value: option.value } } as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    (filters.sortBy || 'latest') === option.value
                      ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/50 shadow-neon-sm'
                      : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:text-white hover:bg-dark-card hover:border-neon-pink'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 清除过滤器按钮（桌面端） */}
          <AnimatePresence>
            {(filters.category || (filters.tags && filters.tags.length > 0)) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex justify-end mt-6"
              >
                <motion.button
                  type="button"
                  onClick={clearAllFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 hover:text-white hover:border-red-400 transition-all duration-300 backdrop-blur-sm"
                >
                  清除所有过滤器
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PromptFilters;
