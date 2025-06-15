import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  TagIcon,
  EyeIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { PromptTemplate, TemplateCategory, TemplateFilters } from '@/types';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  PencilIcon,
  SparklesIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon
};

interface DatabaseTemplateLibraryProps {
  onSelectTemplate?: (template: PromptTemplate) => void;
  onUseTemplate?: (template: PromptTemplate) => void;
}

const DatabaseTemplateLibrary: React.FC<DatabaseTemplateLibraryProps> = ({
  onSelectTemplate,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, selectedDifficulty, showFeaturedOnly, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesResponse, categoriesResponse] = await Promise.all([
        fetch('/api/templates?limit=100'),
        fetch('/api/templates/categories')
      ]);

      const templatesResult = await templatesResponse.json();
      const categoriesResult = await categoriesResponse.json();

      if (templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('获取模板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty);
    }

    if (showFeaturedOnly) {
      filtered = filtered.filter(t => t.is_featured);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (template: PromptTemplate) => {
    try {
      // 记录使用统计
      await fetch(`/api/templates/${template.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use' })
      });

      // 更新本地使用次数
      setTemplates(prev => prev.map(t =>
        t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t
      ));

      onUseTemplate?.(template);
    } catch (error) {
      console.error('记录使用统计失败:', error);
      onUseTemplate?.(template);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '入门';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple mb-4">
            模板库
          </h1>
          <p className="text-gray-300 text-lg">
            精选的提示词模板，涵盖各种应用场景和行业需求
          </p>
        </motion.div>

        {/* 分类导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-neon-cyan text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              全部分类
            </button>
            {categories.map(category => {
              const IconComponent = ICON_MAP[category.icon || 'DocumentTextIcon'];
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.name
                      ? 'bg-neon-cyan text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {category.display_name}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 搜索和过滤器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索模板、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-cyan focus:outline-none"
              />
            </div>

            {/* 过滤器 */}
            <div className="flex gap-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-neon-cyan focus:outline-none"
              >
                <option value="">所有难度</option>
                <option value="beginner">入门</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>

              <button
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  showFeaturedOnly
                    ? 'bg-neon-purple text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FireIcon className="h-4 w-4" />
                精选
              </button>
            </div>
          </div>
        </motion.div>

        {/* 模板网格 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6 border border-gray-700 hover:border-neon-cyan/50 transition-all duration-300 group cursor-pointer"
                onClick={() => onSelectTemplate?.(template)}
              >
                {/* 模板头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {template.is_featured && (
                        <div className="px-2 py-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full">
                          <FireIcon className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {template.is_premium && (
                        <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                          <StarSolidIcon className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(template.difficulty)}`}>
                        {getDifficultyText(template.difficulty)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-neon-cyan transition-colors">
                      {template.title}
                    </h3>
                  </div>
                </div>

                {/* 模板描述 */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-4 w-4" />
                      <span>{template.usage_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{template.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4" />
                      <span>{template.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  {template.estimated_time && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{template.estimated_time}</span>
                    </div>
                  )}
                </div>

                {/* 作者和操作按钮 */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    by {template.author}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-lg text-sm font-medium hover:shadow-neon-lg transition-all duration-300"
                  >
                    使用模板
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* 空状态 */}
        {filteredTemplates.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <DocumentTextIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">暂无匹配的模板</h3>
            <p className="text-gray-500">
              尝试调整搜索条件或浏览其他分类
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTemplateLibrary; 