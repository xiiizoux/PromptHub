import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MODEL_TAGS,
  ModelTag,
  ModelType,
  getModelTagsByType,
  getModelTagsByCategoryType,
  getModelTypeOptions,
  getModelTypeLabel,
} from '@/constants/ai-models';
import {
  ChevronDownIcon,
  PlusIcon,
  XMarkIcon,
  CpuChipIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface ModelSelectorProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
  categoryType?: 'chat' | 'image' | 'video' | 'multimodal'; // 根据分类类型过滤模型
  className?: string;
  placeholder?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModels,
  onChange,
  categoryType,
  className = '',
  placeholder = '选择兼容模型...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ModelType | 'all'>('all');
  const [customModel, setCustomModel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // 根据分类类型和选择的模型类型过滤模型标签
  const getFilteredTags = (): ModelTag[] => {
    let availableTags = MODEL_TAGS;

    // 如果指定了分类类型，先按分类类型过滤
    if (categoryType) {
      availableTags = getModelTagsByCategoryType(categoryType);
    }

    // 再按选择的模型类型过滤
    if (selectedType === 'all') {
      return availableTags;
    }
    return availableTags.filter(tag => tag.type === selectedType);
  };

  // 获取已选中的模型标签
  const getSelectedTags = (): ModelTag[] => {
    return MODEL_TAGS.filter(tag => selectedModels.includes(tag.id));
  };

  // 获取自定义模型（不在预定义列表中的）
  const getCustomModels = (): string[] => {
    const predefinedIds = MODEL_TAGS.map(tag => tag.id);
    return selectedModels.filter(model => !predefinedIds.includes(model));
  };

  // 切换模型选择
  const toggleModel = (tagId: string) => {
    const newModels = selectedModels.includes(tagId)
      ? selectedModels.filter(id => id !== tagId)
      : [...selectedModels, tagId];
    onChange(newModels);
  };

  // 移除模型
  const removeModel = (modelId: string) => {
    onChange(selectedModels.filter(id => id !== modelId));
  };

  // 添加自定义模型
  const addCustomModel = () => {
    if (customModel.trim() && !selectedModels.includes(customModel.trim())) {
      onChange([...selectedModels, customModel.trim()]);
      setCustomModel('');
      setShowCustomInput(false);
    }
  };

  // 获取模型显示名称
  const getModelDisplayName = (modelId: string): string => {
    const tag = MODEL_TAGS.find(t => t.id === modelId);
    return tag ? tag.name : modelId;
  };

  // 获取模型颜色
  const getModelColor = (modelId: string): string => {
    const tag = MODEL_TAGS.find(t => t.id === modelId);
    return tag ? tag.color : 'text-gray-400';
  };

  const typeOptions = getModelTypeOptions();

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
          
          {/* 自定义模型 */}
          {getCustomModels().map(model => (
            <motion.span
              key={model}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-800/50 border border-gray-600 text-gray-300"
            >
              {model}
              <button
                type="button"
                onClick={() => removeModel(model)}
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
            {/* 类型筛选 */}
            <div className="p-4 border-b border-gray-600">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                模型类型筛选
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ModelType | 'all')}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-gray-600 rounded text-white"
              >
                <option value="all">所有类型</option>
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 模型列表 */}
            <div className="max-h-64 overflow-y-auto">
              {getFilteredTags().map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleModel(tag.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 ${
                    selectedModels.includes(tag.id) ? 'bg-neon-cyan/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-medium ${tag.color}`}>
                        {tag.name}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {tag.description}
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                          {getModelTypeLabel(tag.type)}
                        </span>
                        {tag.scale && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                            {tag.scale}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedModels.includes(tag.id) && (
                      <div className="w-4 h-4 rounded-full bg-neon-cyan"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 自定义模型输入 */}
            <div className="p-4 border-t border-gray-600">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-neon-cyan hover:bg-gray-700/50 transition-colors rounded"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  添加自定义模型
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="输入模型名称..."
                    className="w-full px-3 py-2 bg-dark-bg-tertiary border border-gray-600 rounded text-white placeholder-gray-400 focus:border-neon-cyan focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomModel()}
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={addCustomModel}
                      className="flex-1 px-3 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded hover:bg-neon-cyan/30 transition-colors"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomModel('');
                      }}
                      className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
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