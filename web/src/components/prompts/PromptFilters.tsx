import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptFilters as PromptFiltersType } from '@/types';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

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
          type="text"
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
            opacity: showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 1 : showMobileFilters ? 1 : 1,
            height: 'auto'
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
              {categories.map((category, index) => (
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
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 标签过滤 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-lg font-medium text-neon-purple mb-4 flex items-center">
                <div className="w-2 h-2 bg-neon-purple rounded-full mr-3 shadow-neon-sm"></div>
                标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <motion.button
                    key={tag}
                    type="button"
                    onClick={() => handleTagChange(tag)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.03 }}
                    whileHover={{ scale: 1.1, y: -1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 backdrop-blur-sm ${
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
                        transition={{ duration: 0.2 }}
                      >
                        <XMarkIcon className="w-3 h-3 ml-1" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* 排序方式 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h3 className="text-lg font-medium text-neon-pink mb-4 flex items-center">
                <div className="w-2 h-2 bg-neon-pink rounded-full mr-3 shadow-neon-sm"></div>
                排序方式
              </h3>
              <motion.select
                value={filters.sortBy || 'latest'}
                onChange={handleSortChange}
                whileFocus={{ scale: 1.02 }}
                className="w-full px-4 py-3 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white focus:border-neon-pink focus:ring-1 focus:ring-neon-pink focus:shadow-neon-sm transition-all duration-300 backdrop-blur-sm"
              >
                <option value="latest" className="bg-dark-bg-secondary">最新</option>
                <option value="popular" className="bg-dark-bg-secondary">最受欢迎</option>
                <option value="rating" className="bg-dark-bg-secondary">最高评分</option>
              </motion.select>
            </motion.div>
          </div>

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
