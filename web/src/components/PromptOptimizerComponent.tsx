import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import {
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  DocumentPlusIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  OptimizationRequest,
  OptimizationResult,
  IterationRequest,
  iteratePrompt,
  analyzePrompt,
} from '@/lib/prompt-optimizer';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import { categoryService, CategoryInfo } from '@/services/categoryService';
import { getIconComponent } from '@/utils/categoryIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedCategoryName } from '@/utils/categoryLocalization';
import toast from 'react-hot-toast';

interface PromptOptimizerProps {
  initialPrompt?: string;
  onOptimizedPrompt?: (prompt: string) => void;
  className?: string;
}

export const PromptOptimizerComponent: React.FC<PromptOptimizerProps> = ({
  initialPrompt = '',
  onOptimizedPrompt,
  className = '',
}) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'iterate' | 'analyze'>('optimize');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryType, setCategoryType] = useState<'chat' | 'image' | 'video'>('chat');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [requirements, setRequirements] = useState('');
  const [iterationRequirements, setIterationRequirements] = useState('');
  const [iterationType, setIterationType] = useState<IterationRequest['type']>('refine');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [analysisScore, setAnalysisScore] = useState<OptimizationResult['score'] | null>(null);

  // 添加智能分析相关状态
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysisResult, setShowAiAnalysisResult] = useState(false);

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesData = await categoryService.getCategories(categoryType);
        setCategories(categoriesData);

        // 重置选中的分类，让用户重新选择
        setSelectedCategory(null);
      } catch (error) {
        console.error('加载分类失败:', error);
        toast.error(t('pages.optimizer.component.optimize.loadingCategoriesFailed', { fallback: '加载分类失败' }));
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, [categoryType]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 同步外部prompt变化
  useEffect(() => {
    if (initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // 当提示词改变时，清空之前的分析结果
  useEffect(() => {
    if (prompt.trim() && prompt.length > 10) {
      // 如果在分析标签页，自动分析
      if (activeTab === 'analyze') {
        handleAnalyze();
      }
    } else {
      setAnalysisScore(null);
    }
  }, [prompt, activeTab]);

  const handleOptimize = async () => {
    if (!prompt.trim()) {
      toast.error(t('pages.optimizer.component.optimize.optimizeError', { fallback: '请输入要优化的提示词' }));
      return;
    }

    setIsOptimizing(true);
    try {
      // 构建请求体
      const requestBody: OptimizationRequest = {
        prompt,
        requirements: requirements || '',
        context: '',
      };

      // 如果用户手动选择了分类，则传递分类信息
      if (selectedCategory) {
        requestBody.manualCategory = {
          id: selectedCategory.id,
          name: selectedCategory.name,
          optimization_template: selectedCategory.optimization_template,
        };
      }

      // 使用新的智能优化API
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`${t('pages.optimizer.component.optimize.optimizeFailed', { error: '未知错误', fallback: '优化失败' })}: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || t('pages.optimizer.component.optimize.optimizeFailed', { error: '未知错误', fallback: '优化失败' }));
      }

      // 构建优化结果
      const optimizationResult = {
        optimizedPrompt: data.data.optimized,
        improvements: data.data.improvements || [],
        score: { clarity: 8, specificity: 8, completeness: 8, overall: 8 }, // 临时评分
        suggestions: data.data.suggestions || [],
      };

      setResult(optimizationResult);
      setOptimizedPrompt(optimizationResult.optimizedPrompt);
      onOptimizedPrompt?.(optimizationResult.optimizedPrompt);

      // 显示匹配的分类信息（本地化）
      if (data.data.category) {
        // 获取本地化的分类名称
        const categoryName = getLocalizedCategoryName(
          data.data.category as CategoryInfo,
          language,
          data.data.category.name || ''
        );
        
        if (selectedCategory) {
          toast.success(t('pages.optimizer.component.optimize.manualCategoryMatched', { name: categoryName, fallback: `使用手动选择的 "${categoryName}" 分类优化完成！` }));
        } else {
          toast.success(t('pages.optimizer.component.optimize.categoryMatched', { name: categoryName, confidence: Math.round(data.data.confidence * 100), fallback: `AI智能匹配到 "${categoryName}" 分类优化完成！置信度: ${Math.round(data.data.confidence * 100)}%` }));
        }
      } else {
        toast.success(t('pages.optimizer.component.optimize.optimizeSuccess', { fallback: '提示词优化完成！' }));
      }
    } catch (error) {
      console.error('优化失败:', error);
      toast.error(t('pages.optimizer.component.optimize.optimizeFailed', { error: error instanceof Error ? error.message : '未知错误', fallback: `优化失败: ${error instanceof Error ? error.message : '未知错误'}` }));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleIterate = async () => {
    if (!prompt.trim() || !optimizedPrompt.trim()) {
      toast.error(t('pages.optimizer.component.iterate.iterateError', { fallback: '请先优化提示词' }));
      return;
    }

    if (!iterationRequirements.trim()) {
      toast.error(t('pages.optimizer.component.iterate.requirementsError', { fallback: '请输入迭代要求' }));
      return;
    }

    setIsIterating(true);
    try {
      const iteratedPrompt = await iteratePrompt(
        prompt,
        optimizedPrompt,
        iterationRequirements,
        iterationType,
      );

      if (iteratedPrompt) {
        setOptimizedPrompt(iteratedPrompt);
        onOptimizedPrompt?.(iteratedPrompt);
        toast.success(t('pages.optimizer.component.iterate.iterateSuccess', { fallback: '迭代优化完成！' }));
        setIterationRequirements('');
      } else {
        toast.error(t('pages.optimizer.component.iterate.apiError', { fallback: '迭代失败：请检查API配置' }));
      }
    } catch (error) {
      console.error('迭代失败:', error);
      toast.error(t('pages.optimizer.component.iterate.iterateFailed', { error: error instanceof Error ? error.message : '未知错误', fallback: `迭代失败: ${error instanceof Error ? error.message : '未知错误'}` }));
    } finally {
      setIsIterating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error(t('pages.optimizer.component.analyze.analyzeError', { fallback: '请输入要分析的提示词' }));
      return;
    }

    setIsAnalyzing(true);
    try {
      const score = await analyzePrompt(prompt);
      if (score) {
        setAnalysisScore(score);
        // 如果当前有结果，也更新结果中的评分
        if (result) {
          setResult({
            ...result,
            score,
          });
        }
        toast.success(t('pages.optimizer.component.analyze.analyzeSuccess', { fallback: '质量分析完成！' }));
      } else {
        toast.error(t('pages.optimizer.component.analyze.apiError', { fallback: '分析失败：请检查API配置' }));
      }
    } catch (error) {
      console.error('分析失败:', error);
      toast.error(t('pages.optimizer.component.analyze.analyzeFailed', { error: error instanceof Error ? error.message : '未知错误', fallback: `分析失败: ${error instanceof Error ? error.message : '未知错误'}` }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('promptDetails.copySuccess', { fallback: '复制成功！' }));
    });
  };

  // 添加填充到创建提示词的方法 - 只填充内容
  const fillToCreatePrompt = () => {
    // 确保使用优化后的提示词内容，如果没有优化内容则使用原始内容
    const contentToUse = optimizedPrompt || prompt;
    
    if (!contentToUse.trim()) {
      toast.error(t('pages.optimizer.component.fillPrompt.error', { fallback: '请先输入或优化提示词内容' }));
      return;
    }
    
    // 构建URL参数 - 传递优化后的内容
    const params = new URLSearchParams({
      optimizedContent: encodeURIComponent(contentToUse),
    });
    
    // 跳转到创建提示词页面
    router.push(`/create?${params.toString()}`);
    toast.success(t('pages.optimizer.component.fillPrompt.redirecting', { fallback: '正在跳转到创建提示词页面...' }));
  };

  // 处理AI分析完成
  const handleAIAnalysisComplete = (result: Partial<AIAnalysisResult>) => {
    console.log('优化器收到AI分析结果:', result);
    
    if (result as AIAnalysisResult) {
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysisResult(true);
      toast.success(t('pages.optimizer.component.analyze.analyzeSuccess', { fallback: '质量分析完成！' }));
    }
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${(value / 10) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm font-medium text-white w-8">{value.toFixed(1)}</span>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 导航标签 */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
        {[
          { key: 'optimize', label: t('pages.optimizer.component.tabs.optimize', { fallback: '智能优化' }), icon: SparklesIcon },
          { key: 'iterate', label: t('pages.optimizer.component.tabs.iterate', { fallback: '迭代改进' }), icon: ArrowPathIcon },
          { key: 'analyze', label: t('pages.optimizer.component.tabs.analyze', { fallback: '质量分析' }), icon: ChartBarIcon },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'optimize' | 'iterate' | 'analyze')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 原始提示词输入 */}
      <div className="glass rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <LightBulbIcon className="h-5 w-5 text-neon-yellow mr-2" />
            {t('pages.optimizer.component.originalPrompt.title', { fallback: '原始提示词' })}
          </h3>
          {result?.score && (
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round((result?.score?.overall || 0) / 2)
                        ? 'text-neon-yellow'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {(result?.score?.overall || 0).toFixed(1)}/10
              </span>
            </div>
          )}
        </div>
        
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('pages.optimizer.component.originalPrompt.placeholder', { fallback: '在这里输入您想要优化的提示词...' })}
            className="w-full h-32 bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20 resize-none"
          />
      </div>

      {/* 优化配置和操作区 */}
      <AnimatePresence mode="wait">
        {activeTab === 'optimize' && (
          <motion.div
            key="optimize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-green/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 text-neon-green mr-2" />
              {t('pages.optimizer.component.optimize.title', { fallback: '智能优化' })}
            </h3>

            {/* 类型切换 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('pages.optimizer.component.optimize.promptType', { fallback: '提示词类型' })}
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 'chat', label: t('pages.optimizer.component.optimize.chat', { fallback: '💬 对话' }), icon: '💬' },
                  { value: 'image', label: t('pages.optimizer.component.optimize.image', { fallback: '🎨 图像' }), icon: '🎨' },
                  { value: 'video', label: t('pages.optimizer.component.optimize.video', { fallback: '🎬 视频' }), icon: '🎬' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setCategoryType(type.value as 'chat' | 'image' | 'video')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryType === type.value
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-600/50 hover:bg-gray-700/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 优化类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('pages.optimizer.component.optimize.optimizationType', { fallback: '优化类型' })}
                </label>
                {isLoadingCategories ? (
                  <div className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-gray-400">
                    {t('pages.optimizer.component.optimize.loadingCategories', { fallback: '加载分类中...' })}
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-green/50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {selectedCategory ? (
                          <>
                            {(() => {
                              const IconComponent = getIconComponent(selectedCategory.icon);
                              return IconComponent ? (
                                <IconComponent className="h-4 w-4 text-neon-green" />
                              ) : (
                                <span>📝</span>
                              );
                            })()}
                            <span>{selectedCategory.name}</span>
                          </>
                        ) : (
                          <>
                            <span>🧠</span>
                            <span className="text-gray-400">{t('pages.optimizer.component.optimize.selectCategoryOrAI', { fallback: '选择分类或AI智能匹配分类' })}</span>
                          </>
                        )}
                      </div>
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute z-[9999] w-full mt-1 bg-gray-800 border border-gray-600/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(null);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-700/50 flex items-center space-x-2 text-gray-400"
                        >
                          <span>🧠</span>
                          <span>{t('pages.optimizer.component.optimize.selectCategoryOrAI', { fallback: '选择分类或AI智能匹配分类' })}</span>
                        </button>
                        {categories.map((category) => {
                          const IconComponent = getIconComponent(category.icon);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-700/50 flex items-center space-x-2 text-white"
                            >
                              {IconComponent ? (
                                <IconComponent className="h-4 w-4 text-neon-green" />
                              ) : (
                                <span>📝</span>
                              )}
                              <span>{getLocalizedCategoryName(category, language)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {selectedCategory
                    ? t('pages.optimizer.component.optimize.selected', { name: selectedCategory.name, fallback: `已选择: ${selectedCategory.name}` })
                    : t('pages.optimizer.component.optimize.autoMatch', { fallback: '未选择时将自动智能匹配最适合的分类' })
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('pages.optimizer.component.optimize.requirements', { fallback: '特殊要求 (可选)' })}
                </label>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder={t('pages.optimizer.component.optimize.requirementsPlaceholder', { fallback: '例如：更加简洁、包含示例等' })}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50"
                />
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !prompt.trim()}
              className="w-full bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-green/80 hover:to-neon-cyan/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>{t('pages.optimizer.component.optimize.optimizing', { fallback: '正在优化...' })}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>{t('pages.optimizer.component.optimize.startOptimize', { fallback: '开始优化' })}</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {activeTab === 'iterate' && (
          <motion.div
            key="iterate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-purple/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-neon-purple mr-2" />
              {t('pages.optimizer.component.iterate.title', { fallback: '迭代改进' })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('pages.optimizer.component.iterate.iterationType', { fallback: '迭代类型' })}
                </label>
                <select
                  value={iterationType}
                  onChange={(e) => setIterationType(e.target.value as IterationRequest['type'])}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-purple/50"
                >
                  <option value="refine">{t('pages.optimizer.component.iterate.refine', { fallback: '精细调整' })}</option>
                  <option value="expand">{t('pages.optimizer.component.iterate.expand', { fallback: '扩展内容' })}</option>
                  <option value="simplify">{t('pages.optimizer.component.iterate.simplify', { fallback: '简化表达' })}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('pages.optimizer.component.iterate.requirements', { fallback: '迭代要求 *' })}
                </label>
                <input
                  type="text"
                  value={iterationRequirements}
                  onChange={(e) => setIterationRequirements(e.target.value)}
                  placeholder={t('pages.optimizer.component.iterate.requirementsPlaceholder', { fallback: '描述具体的改进需求...' })}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-purple/50"
                />
              </div>
            </div>

            <button
              onClick={handleIterate}
              disabled={isIterating || !optimizedPrompt.trim() || !iterationRequirements.trim()}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isIterating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>{t('pages.optimizer.component.iterate.iterating', { fallback: '正在迭代...' })}</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  <span>{t('pages.optimizer.component.iterate.startIterate', { fallback: '开始迭代' })}</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {activeTab === 'analyze' && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-yellow/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-neon-yellow mr-2" />
              {t('pages.optimizer.component.analyze.title', { fallback: '质量分析' })}
            </h3>

            {/* 分析按钮 */}
            <div className="mb-6">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !prompt.trim()}
                className="w-full bg-gradient-to-r from-neon-yellow to-neon-orange hover:from-neon-yellow/80 hover:to-neon-orange/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <ChartBarIcon className="h-5 w-5 animate-spin" />
                    <span>{t('pages.optimizer.component.analyze.analyzing', { fallback: '正在分析...' })}</span>
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-5 w-5" />
                    <span>{t('pages.optimizer.component.analyze.startAnalyze', { fallback: '开始质量分析' })}</span>
                  </>
                )}
              </button>
            </div>

            {/* 分析结果显示 */}
            {(analysisScore || result?.score) && (
              <div className="space-y-4">
                <ScoreBar 
                  label={t('pages.optimizer.component.analyze.clarity', { fallback: '清晰性' })} 
                  value={(analysisScore || result?.score)?.clarity || 0} 
                  color="bg-gradient-to-r from-neon-green to-neon-cyan" 
                />
                <ScoreBar 
                  label={t('pages.optimizer.component.analyze.specificity', { fallback: '具体性' })} 
                  value={(analysisScore || result?.score)?.specificity || 0} 
                  color="bg-gradient-to-r from-neon-cyan to-neon-blue" 
                />
                <ScoreBar 
                  label={t('pages.optimizer.component.analyze.completeness', { fallback: '完整性' })} 
                  value={(analysisScore || result?.score)?.completeness || 0} 
                  color="bg-gradient-to-r from-neon-purple to-neon-pink" 
                />
                <ScoreBar 
                  label={t('pages.optimizer.component.analyze.overall', { fallback: '综合评分' })} 
                  value={(analysisScore || result?.score)?.overall || 0} 
                  color="bg-gradient-to-r from-neon-yellow to-neon-orange" 
                />
              </div>
            )}

            {/* 改进建议 */}
            {result?.suggestions && result.suggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 text-neon-yellow mr-2" />
                  {t('pages.optimizer.component.analyze.suggestions', { fallback: '改进建议' })}
                </h4>
                <div className="space-y-2">
                  {result?.suggestions?.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-yellow mt-2 flex-shrink-0" />
                      <span className="text-gray-300">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 如果没有分析结果，显示提示 */}
            {!analysisScore && !result?.score && !isAnalyzing && (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  {prompt.trim() 
                    ? t('pages.optimizer.component.analyze.clickToAnalyze', { fallback: '点击上方按钮开始分析提示词质量' })
                    : t('pages.optimizer.component.analyze.enterPromptFirst', { fallback: '请先在上方输入要分析的提示词' })
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {t('pages.optimizer.component.analyze.analysisHint', { fallback: '分析将从清晰性、具体性、完整性等维度评估您的提示词' })}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 优化结果显示 */}
      {optimizedPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-neon-cyan/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-neon-green mr-2" />
              {t('pages.optimizer.component.result.title', { fallback: '优化结果' })}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(optimizedPrompt)}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-colors"
                title={t('pages.optimizer.component.result.copy', { fallback: '复制优化结果' })}
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPrompt(optimizedPrompt)}
                className="p-2 rounded-lg bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan transition-colors"
                title={t('pages.optimizer.component.result.apply', { fallback: '应用优化结果' })}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </button>
              
              {/* 智能分析按钮 - 确保分析优化后的内容 */}
              <div title={t('pages.optimizer.component.result.analyzeOptimized', { fallback: '对优化后的提示词进行智能分析' })}>
                <AIAnalyzeButton
                  content={optimizedPrompt || prompt}
                  onAnalysisComplete={handleAIAnalysisComplete}
                  variant="full"
                  className="!px-3 !py-2 !text-sm"
                />
              </div>
              
              <button
                onClick={fillToCreatePrompt}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 text-white transition-all duration-200 shadow-lg hover:shadow-neon"
                title={t('pages.optimizer.component.result.fillToCreate', { fallback: '填充到创建提示词页面' })}
              >
                <DocumentPlusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{t('pages.optimizer.component.result.createPrompt', { fallback: '创建提示词' })}</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
            <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {optimizedPrompt}
            </pre>
          </div>

          {result?.improvements && result.improvements.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <SparklesIcon className="h-4 w-4 text-neon-green mr-2" />
                {t('pages.optimizer.component.result.improvements', { fallback: '主要改进' })}
              </h4>
              <div className="space-y-2">
                {result?.improvements?.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI智能分析结果显示 */}
          <AnimatePresence>
            {showAiAnalysisResult && aiAnalysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white flex items-center">
                    <BeakerIcon className="h-4 w-4 text-neon-blue mr-2" />
                    {t('pages.optimizer.component.result.aiAnalysisResult', { fallback: '智能分析结果' })}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAiAnalysisResult(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={t('pages.optimizer.component.result.close', { fallback: '关闭智能分析结果' })}
                  >
                    ✕
                  </button>
                </div>
                
                <AIAnalysisResultDisplay
                  result={aiAnalysisResult}
                  onApplyResults={(data) => {
                    // 在优化器中，应用全部建议时跳转到创建提示词页面
                    console.log('应用AI分析结果并跳转到创建提示词页面:', data);
                    
                    // 确保使用优化后的提示词内容
                    const contentToUse = optimizedPrompt || prompt;
                    
                    // 生成建议标题和描述，用于标识这是来自优化器的手动应用
                    const suggestedName = aiAnalysisResult.suggestedTitle || `优化提示词_${new Date().toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`;
                    
                    const suggestedDesc = aiAnalysisResult.description || t('pages.optimizer.component.result.defaultDescription', { fallback: '通过AI优化生成的提示词，经过智能分析和结构化优化处理' });
                    
                    // 构建URL参数，包含优化内容、AI分析结果和标识参数
                    const params = new URLSearchParams({
                      optimizedContent: encodeURIComponent(contentToUse),
                      aiAnalysisResult: encodeURIComponent(JSON.stringify(aiAnalysisResult)),
                      suggestedName: encodeURIComponent(suggestedName),
                      suggestedDesc: encodeURIComponent(suggestedDesc),
                    });
                    
                    // 跳转到创建提示词页面
                    router.push(`/create?${params.toString()}`);
                    toast.success(t('pages.optimizer.component.result.redirectingWithAnalysis', { fallback: '正在跳转到创建提示词页面并应用分析结果...' }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default PromptOptimizerComponent; 