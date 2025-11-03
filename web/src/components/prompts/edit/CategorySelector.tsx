import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PromptType } from './PromptTypeSelector';
import { useCategoryContext } from '@/contexts/CategoryContext';

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
  disabled = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getCategoryDisplayInfo } = useCategoryContext();

  const availableCategories = categoriesByType[promptType] || [];

  // 当类型改变时重置状态
  useEffect(() => {
    setIsOpen(false);
  }, [promptType]);

  const handleCategorySelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
  };

  const handleToggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleOpen();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const getTypeLabel = (type: PromptType) => {
    const typeLabels = {
      chat: '对话',
      image: '图像',
      video: '视频',
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
        <div 
          className={`
            input-primary w-full pr-10 cursor-pointer flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neon-cyan/50'}
            ${isOpen ? 'border-neon-cyan/50' : ''}
          `}
          onClick={handleToggleOpen}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="category-listbox"
        >
          <div className="flex items-center space-x-2">
            {value && (() => {
              const categoryInfo = getCategoryDisplayInfo(value, promptType);
              const IconComponent = categoryInfo.iconComponent;
              
              // 只在有图标时显示图标容器
              if (IconComponent) {
                return (
                  <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${categoryInfo.color}`}>
                    <IconComponent className="h-3.5 w-3.5 text-dark-bg-primary" />
                  </div>
                );
              }
              return null;
            })()}
            <span className={value ? 'text-gray-200' : 'text-gray-400'}>
              {value ? (() => {
                const categoryInfo = getCategoryDisplayInfo(value, promptType);
                return categoryInfo.name;
              })() : '请选择分类...'}
            </span>
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform hover:text-neon-cyan ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-dark-bg-secondary border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-hidden"
            >
              {/* 分类列表 */}
              <div className="max-h-64 overflow-y-auto" role="listbox" id="category-listbox">
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => {
                    const categoryInfo = getCategoryDisplayInfo(category, promptType);
                    const IconComponent = categoryInfo.iconComponent;
                    
                    return (
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
                        role="option"
                        aria-selected={value === category}
                      >
                        <div className="flex items-center space-x-3">
                          {IconComponent && (
                            <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${categoryInfo.color}`}>
                              <IconComponent className="h-3.5 w-3.5 text-dark-bg-primary" />
                            </div>
                          )}
                          <span>{categoryInfo.name}</span>
                        </div>
                        {value === category && (
                          <CheckIcon className="h-4 w-4 text-neon-cyan" />
                        )}
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400">
                    <p>没有可用的{getTypeLabel(promptType)}分类</p>
                    <p className="text-sm mt-1">请先选择其他类型</p>
                  </div>
                )}
              </div>

              {/* 提示信息 */}
              {availableCategories.length > 0 && (
                <div className="px-4 py-2 bg-dark-bg-primary/50 border-t border-gray-600">
                  <p className="text-xs text-gray-500">
                    共 {availableCategories.length} 个{getTypeLabel(promptType)}分类
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