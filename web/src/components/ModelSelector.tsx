import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MODEL_TAGS,
  ModelTag,
  getModelTagsByCategoryType,
} from '@/constants/ai-models';
import {
  ChevronDownIcon,
  XMarkIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface ModelSelectorProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
  categoryType?: 'chat' | 'image' | 'video'; // 根据分类类型过滤模型
  className?: string;
  placeholder?: string;
}

// 获取分类类型的中文标签
const getCategoryTypeLabel = (categoryType: 'chat' | 'image' | 'video'): string => {
  const labels = {
    chat: '对话',
    image: '图像',
    video: '视频',
  };
  return labels[categoryType];
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModels,
  onChange,
  categoryType,
  className = '',
  placeholder = '选择兼容模型...',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 根据分类类型获取可用模型，并按大类别分组
  const modelsByCategory = useMemo(() => {
    if (categoryType) {
      // 如果指定了分类类型，只显示该类型的模型
      const availableTags = getModelTagsByCategoryType(categoryType);
      return {
        [categoryType]: availableTags,
      };
    } else {
      // 如果没有指定分类类型，显示所有模型并按三大类别分组
      return {
        chat: getModelTagsByCategoryType('chat'),
        image: getModelTagsByCategoryType('image'),
        video: getModelTagsByCategoryType('video'),
      };
    }
  }, [categoryType]);

  // 获取已选中的模型标签（去重）
  const getSelectedTags = (): ModelTag[] => {
    const uniqueSelectedModels = [...new Set(selectedModels)];
    return MODEL_TAGS.filter(tag => uniqueSelectedModels.includes(tag.id));
  };

  // 切换模型选择
  const toggleModel = (tagId: string) => {
    const newModels = selectedModels.includes(tagId)
      ? selectedModels.filter(id => id !== tagId)
      : [...selectedModels, tagId];
    // 去重处理
    const uniqueModels = [...new Set(newModels)];
    onChange(uniqueModels);
  };

  // 移除模型
  const removeModel = (modelId: string) => {
    onChange(selectedModels.filter(id => id !== modelId));
  };

  return (
    <div className={`relative ${className}`}>
      {/* 选择器触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg text-white hover:border-neon-cyan transition-colors"
      >
        <div className="flex items-center">
          <CpuChipIcon className="h-5 w-5 text-neon-cyan mr-2" />
          <span className="text-gray-300">
            {selectedModels.length > 0 
              ? `已选择 ${selectedModels.length} 个模型` 
              : placeholder
            }
          </span>
        </div>
        <ChevronDownIcon 
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 已选中的模型标签 */}
      {selectedModels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {getSelectedTags().map(tag => (
            <motion.span
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-800/50 border border-gray-600 ${tag.color}`}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeModel(tag.id)}
                className="ml-2 hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-dark-bg-secondary border border-gray-600 rounded-lg shadow-xl max-h-96 overflow-hidden"
          >
            {/* 模型列表 - 按类别分组 */}
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(modelsByCategory).map(([category, models]) => (
                <div key={category} className="border-b border-gray-700/50 last:border-b-0">
                  {/* 类别标题 */}
                  <div className="px-4 py-3 bg-dark-bg-tertiary/50 border-b border-gray-700/30">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center">
                      <CpuChipIcon className="h-4 w-4 mr-2 text-neon-cyan" />
                      {getCategoryTypeLabel(category as 'chat' | 'image' | 'video')}模型
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-600 rounded text-gray-400">
                        {models.length}个
                      </span>
                    </h3>
                  </div>
                  
                  {/* 该类别下的模型 */}
                  <div>
                    {models.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleModel(tag.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 last:border-b-0 ${
                          selectedModels.includes(tag.id) ? 'bg-neon-cyan/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${tag.color} truncate`}>
                              {tag.name}
                            </div>
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {tag.description}
                            </div>
                            {tag.scale && (
                              <div className="flex items-center mt-2">
                                <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                                  {tag.scale}
                                </span>
                              </div>
                            )}
                          </div>
                          {selectedModels.includes(tag.id) && (
                            <div className="ml-3 flex-shrink-0">
                              <div className="w-4 h-4 rounded-full bg-neon-cyan"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 背景遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ModelSelector;