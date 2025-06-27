import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptFilters as PromptFiltersType } from '@/types';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { getTagsWithStats } from '@/lib/api';

interface SidebarFiltersProps {
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
  hideTypeFilter?: boolean;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  tags,
  hideTypeFilter = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取热门标签数据
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const tagsWithStats = await getTagsWithStats();
        const popular = tagsWithStats.slice(0, 8).map(item => item.tag);
        setPopularTags(popular);
      } catch (error) {
        console.error('获取热门标签失败:', error);
        setPopularTags([]);
      }
    };

    if (tags.length > 0) {
      fetchPopularTags();
    }
  }, [tags]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 智能标签展示逻辑
  const displayTags = useMemo(() => {
    const selectedTags = filters.tags || [];
    const selectedTagsSet = new Set(selectedTags);
    
    if (tagSearchQuery.trim()) {
      const searchLower = tagSearchQuery.toLowerCase();
      const result = [];
      const exactMatches = [];
      const partialMatches = [];
      
      for (const tag of tags) {
        const tagLower = tag.toLowerCase();
        if (!tagLower.includes(searchLower)) continue;
        
        if (selectedTagsSet.has(tag)) {
          result.push(tag);
        } else if (tagLower === searchLower) {
          exactMatches.push(tag);
        } else {
          partialMatches.push(tag);
        }
      }
      
      return [...result, ...exactMatches, ...partialMatches];
    }
    
    const popularTagsSet = new Set(popularTags);
    const result = [...selectedTags];
    const popularUnselected = [];
    const otherUnselected = [];
    
    for (const tag of tags) {
      if (selectedTagsSet.has(tag)) continue;
      
      if (popularTagsSet.has(tag)) {
        popularUnselected.push(tag);
      } else {
        otherUnselected.push(tag);
      }
    }
    
    const fullOrderedTags = [...result, ...popularUnselected, ...otherUnselected];
    return showAllTags ? fullOrderedTags : fullOrderedTags.slice(0, 25);
  }, [tags, filters.tags, popularTags, showAllTags, tagSearchQuery]);

  // 事件处理函数
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  }, [filters, onFilterChange]);

  const handleCategoryChange = useCallback((category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  }, [filters, onFilterChange]);

  const handleTagChange = useCallback((tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    
    onFilterChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  }, [filters, onFilterChange]);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as 'latest' | 'oldest' | 'name' | 'updated',
    });
  }, [filters, onFilterChange]);

  const clearAllFilters = useCallback(() => {
    onFilterChange({
      search: '',
      category: undefined,
      tags: undefined,
      sortBy: 'latest',
    });
    setTagSearchQuery('');
    setShowAllTags(false);
  }, [onFilterChange]);

  const toggleSidebar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const toggleShowAllTags = useCallback(() => {
    setShowAllTags(!showAllTags);
    if (!showAllTags) {
      setTagSearchQuery('');
    }
  }, [showAllTags]);

  // 切换按钮
  const ToggleButton = () => (
    <motion.button
      onClick={toggleSidebar}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed top-4 left-4 z-50 p-3 bg-dark-card/90 backdrop-blur-md border border-dark-border rounded-xl text-neon-cyan hover:text-white hover:border-neon-cyan transition-all duration-300 shadow-xl ${
        isOpen && !isMobile ? 'translate-x-80' : ''
      }`}
      aria-label={isOpen ? '关闭过滤器' : '打开过滤器'}
    >
      {isMobile ? (
        <Bars3Icon className="w-6 h-6" />
      ) : isOpen ? (
        <ChevronLeftIcon className="w-6 h-6" />
      ) : (
        <ChevronRightIcon className="w-6 h-6" />
      )}
    </motion.button>
  );

  return (
    <>
      <ToggleButton />
      
      {/* 移动端遮罩层 */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* 边栏 */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : isMobile ? '-100%' : '-320px',
          width: isMobile ? '80%' : '320px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 h-full bg-dark-bg-primary/95 backdrop-blur-xl border-r border-dark-border shadow-2xl z-40 overflow-y-auto ${
          isMobile ? 'max-w-sm' : 'w-80'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neon-cyan flex items-center">
              <FunnelIcon className="w-6 h-6 mr-2" />
              筛选条件
            </h2>
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-neon-cyan/60" />
            </div>
            <input
              type="search"
              placeholder="搜索提示词..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-dark-bg-secondary/50 border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
            />
          </div>

          {/* 类别过滤 */}
          <div>
            <h3 className="text-lg font-medium text-neon-cyan mb-3 flex items-center">
              <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
              类别
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filters.category === category
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                      : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:text-neon-cyan hover:border-neon-cyan/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 标签过滤 */}
          <div>
            <h3 className="text-lg font-medium text-neon-purple mb-3 flex items-center">
              <div className="w-2 h-2 bg-neon-purple rounded-full mr-2"></div>
              标签
            </h3>
            
            {/* 标签搜索 */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-neon-purple/60" />
              </div>
              <input
                type="search"
                placeholder="搜索标签..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-dark-bg-secondary/50 border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all duration-300"
              />
            </div>

            {/* 标签列表 */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    filters.tags?.includes(tag)
                      ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                      : 'bg-dark-bg-secondary/50 text-gray-400 border border-dark-border hover:text-neon-purple hover:border-neon-purple/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
              
              {!showAllTags && tags.length > 25 && !tagSearchQuery && (
                <button
                  onClick={toggleShowAllTags}
                  className="w-full px-3 py-2 border border-dashed border-neon-purple/50 rounded-lg text-neon-purple hover:border-neon-purple hover:bg-neon-purple/10 transition-all duration-200 text-sm"
                >
                  <ChevronDownIcon className="w-4 h-4 inline mr-1" />
                  显示更多标签
                </button>
              )}
              
              {showAllTags && (
                <button
                  onClick={toggleShowAllTags}
                  className="w-full px-3 py-2 bg-neon-purple/20 border border-neon-purple rounded-lg text-neon-purple hover:bg-neon-purple/30 transition-all duration-200 text-sm"
                >
                  <ChevronUpIcon className="w-4 h-4 inline mr-1" />
                  收起
                </button>
              )}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <h3 className="text-lg font-medium text-neon-pink mb-3 flex items-center">
              <div className="w-2 h-2 bg-neon-pink rounded-full mr-2"></div>
              排序方式
            </h3>
            <select
              value={filters.sortBy || 'latest'}
              onChange={handleSortChange}
              className="w-full px-3 py-2 bg-dark-bg-secondary/50 border border-dark-border rounded-lg text-white focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all duration-300"
            >
              <option value="latest">最新创建</option>
              <option value="updated">最近更新</option>
              <option value="oldest">最早创建</option>
              <option value="name">名称排序</option>
            </select>
          </div>

          {/* 清除按钮 */}
          {(filters.category || (filters.tags && filters.tags.length > 0)) && (
            <button
              onClick={clearAllFilters}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl text-red-300 hover:text-white hover:border-red-400 transition-all duration-300"
            >
              清除所有过滤器
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default SidebarFilters;
