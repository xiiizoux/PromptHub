import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PromptType } from './PromptTypeSelector';

interface CategorySelectorProps {
  promptType: PromptType;
  value: string;
  onChange: (category: string) => void;
  categoriesByType: Record<string, string[]>;
  loading?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export default function CategorySelector({
  promptType,
  value,
  onChange,
  categoriesByType,
  loading = false,
  error,
  className = '',
  disabled = false
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableCategories = categoriesByType[promptType] || [];
  
  // 根据搜索词过滤分类
  const filteredCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 当类型改变时重置搜索
  useEffect(() => {
    setSearchTerm('');
    setIsOpen(false);
  }, [promptType]);

  const handleCategorySelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getTypeLabel = (type: PromptType) => {
    const typeLabels = {
      chat: '对话',
      image: '图像',
      video: '视频',
      multimodal: '多模态'
    };
    return typeLabels[type];
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="flex items-center text-sm font-medium text-gray-300">
          <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
          分类
        </label>
        <div className="input-primary w-full flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-cyan"></div>
          <span className="ml-2 text-gray-400">加载分类中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="flex items-center text-sm font-medium text-gray-300">
          <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
          分类
        </label>
        <div className="input-primary w-full border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
        <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
        分类 *
        <span className="ml-2 text-xs text-gray-500">
          ({getTypeLabel(promptType)}类型)
        </span>
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            input-primary w-full text-left flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neon-cyan/50'}
            ${isOpen ? 'border-neon-cyan/50' : ''}
          `}
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {value || '选择分类'}
          </span>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-dark-bg-secondary border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-hidden"
            >
              {/* 搜索框 */}
              <div className="p-3 border-b border-gray-600">
                <input
                  type="text"
                  placeholder="搜索分类..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-neon-cyan"
                  autoFocus
                />
              </div>

              {/* 分类列表 */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <motion.button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-neon-cyan/10 transition-colors
                        flex items-center justify-between
                        ${value === category ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-300'}
                      `}
                      whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                    >
                      <span>{category}</span>
                      {value === category && (
                        <CheckIcon className="h-4 w-4 text-neon-cyan" />
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400">
                    {searchTerm ? (
                      <>
                        <p>未找到匹配的分类</p>
                        <p className="text-sm mt-1">尝试其他关键词</p>
                      </>
                    ) : (
                      <>
                        <p>没有可用的{getTypeLabel(promptType)}分类</p>
                        <p className="text-sm mt-1">请先选择其他类型</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 提示信息 */}
              {availableCategories.length > 0 && (
                <div className="px-4 py-2 bg-dark-bg-primary/50 border-t border-gray-600">
                  <p className="text-xs text-gray-500">
                    共 {availableCategories.length} 个{getTypeLabel(promptType)}分类
                    {searchTerm && `, 显示 ${filteredCategories.length} 个匹配结果`}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}