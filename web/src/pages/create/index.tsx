import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import {
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_DESCRIPTIONS
} from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { createPrompt, getCategories, getTags, Category } from '@/lib/api';
import { PromptDetails } from '@/types';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  XMarkIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  CodeBracketIcon,
  TagIcon,
  DocumentTextIcon,
  UserIcon,
  CpuChipIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import { useAuth } from '@/contexts/AuthContext';
import { ModelSelector } from '@/components/ModelSelector';
import { formatVersionDisplay } from '@/lib/version-utils';
import { withAuth } from '@/contexts/AuthContext';

// 扩展类型，添加messages字段和其他数据库中的字段
type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  messages?: Array<{role: string; content: string}>; // 添加messages字段
  allow_collaboration?: boolean;  // 添加allow_collaboration字段
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 添加edit_permission字段
};

function CreatePromptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([
    '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
  ]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([
    'GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'
  ]);
  // AI分析状态
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  
  // 数据加载状态
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);

  // 添加实时内容监听状态
  const [currentContent, setCurrentContent] = useState('');

  // 智能分类映射函数 - 改进安全性，与编辑页面保持一致
  function matchCategory(aiCategory: string, availableCategories: string[]): string | null {
    if (!aiCategory) return null;
    
    // 1. 精确匹配
    if (availableCategories.includes(aiCategory)) {
      return aiCategory;
    }
    
    // 2. 忽略大小写匹配
    const lowerAiCategory = aiCategory.toLowerCase();
    let match = availableCategories.find(cat => cat.toLowerCase() === lowerAiCategory);
    if (match) return match;
    
    // 3. 包含匹配
    match = availableCategories.find(cat => aiCategory.includes(cat) || cat.includes(aiCategory));
    if (match) return match;
    
    // 如果都不匹配，返回null，让调用者决定是否使用默认值
    return null;
  }

  // AI分析处理函数 - 更新以确保正确的分类映射，与编辑页面保持一致
  const handleAIAnalysis = (result: Partial<AIAnalysisResult>) => {
    console.log('收到AI分析结果:', result);
    
    // 将结果设置到状态中
    if (result as AIAnalysisResult) {
      // 映射分类到可用分类
      if (result.category) {
        const mappedCategory = matchCategory(result.category, categories);
        if (mappedCategory) {
          result.category = mappedCategory;
        } else {
          // 如果没有匹配的分类，使用通用分类
          result.category = '通用';
        }
      }
      
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysis(true);
    }
  };

  // 为AI分析按钮提供额外配置
  const getAIAnalysisConfig = () => {
    return {
      isNewPrompt: true, // 创建页面总是新提示词
      existingVersions: [], // 新提示词没有现有版本
      currentVersion: undefined // 新提示词没有当前版本
    };
  };

  // 应用AI分析结果 - 增强功能，与编辑页面保持一致
  const applyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    // 应用分类 - 直接应用AI建议的分类，与编辑页面保持一致
    if (data.category) {
      const mapped = matchCategory(data.category, categories);
      if (mapped) {
        setValue('category', mapped);
        console.log(`AI分类应用: -> ${mapped}`);
      } else {
        setValue('category', '通用');
        console.log(`AI分类应用: -> 通用 (默认)`);
      }
    }
    
    // 应用标签 - 直接应用AI建议的标签，与编辑页面保持一致
    if (data.tags && Array.isArray(data.tags)) {
      setTags(data.tags);
      setValue('tags', data.tags);
      console.log('AI标签应用:', { 
        原有标签: tags, 
        AI建议标签: data.tags, 
        最终应用: data.tags 
      });
    }
    
    // 应用变量 - 直接应用AI建议的变量，与编辑页面保持一致
    if (data.variables && Array.isArray(data.variables)) {
      setVariables(data.variables);
      setValue('input_variables', data.variables);
      console.log('AI变量应用:', { 
        原有变量: variables, 
        AI建议变量: data.variables, 
        最终应用: data.variables 
      });
    }
    
    // 应用兼容模型 - 直接应用AI建议的模型，与编辑页面保持一致
    if (data.compatibleModels && Array.isArray(data.compatibleModels)) {
      setModels(data.compatibleModels);
      setValue('compatible_models', data.compatibleModels);
      console.log('兼容模型应用:', { 
        原有模型: models, 
        AI建议模型: data.compatibleModels, 
        最终应用: data.compatibleModels 
      });
    }

    // 应用建议标题 - 只在当前标题为空时应用
    if (data.suggestedTitle && !watch('name')) {
      setValue('name', data.suggestedTitle);
    }

    // 应用描述 - 只在当前描述为空时应用
    if (data.description && !watch('description')) {
      setValue('description', data.description);
    }
    
    // 应用版本
    if (data.version) {
      // 将string版本号转换为number
      const versionNumber = parseFloat(data.version.toString());
      if (!isNaN(versionNumber)) {
        setValue('version', versionNumber);
      }
    }
  };

  // 获取分类数据 - 异步但不阻塞页面显示
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        console.log('开始获取类别数据...');
        const data = await getCategories();
        console.log('获取到的类别数据:', data);
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error('获取分类失败:', err);
        // 保持默认分类
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // 获取标签数据 - 异步但不阻塞页面显示
  useEffect(() => {
    const fetchTags = async () => {
      setTagsLoading(true);
      try {
        const data = await getTags();
        if (data && data.length > 0) {
          setSuggestedTags(data);
        }
      } catch (err) {
        console.error('获取标签失败:', err);
        // 保持默认标签
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PromptFormData>({
    defaultValues: {
      name: '',
      description: '',
      content: '',  // 会被转换为messages JSONB格式
      category: '通用', // 与数据库默认值保持一致
      version: 1.0,  // 默认版本1.0，支持小数格式
      is_public: false, // 默认非公开，与数据库默认值保持一致
      allow_collaboration: false, // 默认不允许协作编辑
      edit_permission: 'owner_only', // 默认仅所有者可编辑
      template_format: 'text',
      input_variables: [],
      tags: [],
      compatible_models: [],
    }
  });

  // 监听表单内容变化，确保AI按钮能够正确获取内容
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'content') {
        setCurrentContent(value.content || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // 自动检测变量 - 增强版，同时更新内容状态
  const detectVariables = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    // 实时更新内容状态以确保AI按钮能够监听到变化
    setCurrentContent(content);
    
    if (!content) return;
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = content.match(regex);
    
    if (matches) {
      const detectedVars = Array.from(new Set(matches.map(match => match.slice(2, -2))));
      if (detectedVars.length > 0) {
        setVariables(prev => Array.from(new Set([...prev, ...detectedVars])));
        setValue('input_variables', Array.from(new Set([...variables, ...detectedVars])));
      }
    }
  };

  // 添加变量
  const addVariable = () => {
    if (variableInput && !variables.includes(variableInput)) {
      const newVariables = [...variables, variableInput];
      setVariables(newVariables);
      setValue('input_variables', newVariables);
      setVariableInput('');
    }
  };

  // 删除变量
  const removeVariable = (variable: string) => {
    const newVariables = variables.filter(v => v !== variable);
    setVariables(newVariables);
    setValue('input_variables', newVariables);
  };

  // 添加标签
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      const newTags = [...tags, tagInput];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    setValue('tags', newTags);
  };

  // 切换模型选择 - 更新为兼容新的模型选择器
  const handleModelChange = (models: string[]) => {
    setModels(models);
    setValue('compatible_models', models);
  };

  // 表单提交
  const onSubmit = async (data: PromptFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log('提交提示词数据:', data);
      
      // 构建完整的数据对象
      const promptData = {
        ...data,
        version: Number(data.version) || 1.0,
        author: data.author || user?.username || '未知作者',
        input_variables: variables,
        tags,
        compatible_models: models,
      };

      console.log('即将创建的提示词:', promptData);
      
      const newPrompt = await createPrompt(promptData as any);
      console.log('提示词创建成功:', newPrompt);
      
      // 导航到新提示词页面
      router.push(`/prompts/${newPrompt.id}`);
    } catch (error: any) {
      console.error('创建提示词失败:', error);
      alert(`创建提示词失败: ${error.message || '请检查您的认证状态或网络连接'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      {/* 开发模式调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs space-y-1">
          <div>分类数量: {categories.length}</div>
        </div>
      )}

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 返回按钮 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              href="/prompts" 
              className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              返回提示词列表
            </Link>
          </motion.div>

          {/* 页面标题 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              创建新提示词
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              释放AI的无限潜能，打造专属的智能提示词
            </motion.p>
          </motion.div>
          
          {/* 表单容器 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 提示词内容 - 移到最上面突出显示 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-lg font-semibold text-gray-200">
                    <CodeBracketIcon className="h-6 w-6 text-neon-cyan mr-3" />
                    提示词内容 *
                    <span className="ml-2 text-sm font-normal text-gray-400">核心内容区域</span>
                  </label>
                  
                  {/* AI分析按钮组 - 突出显示 */}
                  <div className="flex items-center gap-2">
                    <AIAnalyzeButton
                      content={currentContent || watch('content') || ''}
                      onAnalysisComplete={(result) => {
                        // 显示AI分析结果，用户可以选择应用
                        handleAIAnalysis(result);
                      }}
                      variant="full"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={12}
                    placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
                    className="input-primary w-full font-mono text-sm resize-none"
                    onChange={detectVariables}
                  />
                  
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {`{{变量名}}`} 定义变量
                  </div>
                </div>
                
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
                
                {/* AI分析结果显示 - 紧跟在内容下方 */}
                <AnimatePresence>
                  {showAiAnalysis && aiAnalysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="mt-4"
                    >
                      <div className="relative">
                        <AIAnalysisResultDisplay
                          result={aiAnalysisResult}
                          onApplyResults={applyAIResults}
                        />
                        <button
                          onClick={() => setShowAiAnalysis(false)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                          title="关闭AI分析结果"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 基本信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词名称 *
                  </label>
                  <input
                    {...register('name', { required: '请输入提示词名称' })}
                    type="text"
                    placeholder="为您的提示词起个响亮的名字"
                    className="input-primary w-full"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                    作者
                  </label>
                  <input
                    {...register('author')}
                    type="text"
                    placeholder={user?.username || "您的名字"}
                    className="input-primary w-full"
                  />
                </div>
              </motion.div>

              {/* 分类和版本 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    分类 *
                  </label>
                  <select
                    {...register('category', { required: '请选择分类' })}
                    className="input-primary w-full"
                  >
                    <option value="">选择分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                    版本
                  </label>
                  <input
                    {...register('version')}
                    type="text"
                    value={(() => {
                      const version = watch('version') ?? 1.0;
                      const numVersion = Number(version);
                      return isNaN(numVersion) ? String(version) : numVersion.toFixed(1);
                    })()}
                    onChange={e => setValue('version', e.target.value as any)}
                    className="input-primary w-full"
                  />
                </div>
              </motion.div>

              {/* 描述 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-2"
              >
                <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                  <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  描述 *
                </label>
                <textarea
                  {...register('description', { required: '请输入描述' })}
                  rows={3}
                  placeholder="简要描述您的提示词的用途和特点..."
                  className="input-primary w-full resize-none"
                />
                {errors.description && (
                  <p className="text-neon-red text-sm mt-1">{errors.description.message}</p>
                )}
              </motion.div>

              {/* 变量管理 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
                  输入变量
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="添加新变量..."
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  />
                  <motion.button
                    type="button"
                    onClick={addVariable}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                <AnimatePresence>
                  {variables.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {variables.map((variable) => (
                        <motion.span
                          key={variable}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                        >
                          {variable}
                          <button
                            type="button"
                            onClick={() => removeVariable(variable)}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 标签管理 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-pink mr-2" />
                  标签
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="添加新标签..."
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <motion.button
                    type="button"
                    onClick={addTag}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* 推荐标签 */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">推荐标签：</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => !tags.includes(tag) && (setTags([...tags, tag]), setValue('tags', [...tags, tag]))}
                        disabled={tags.includes(tag)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all duration-300 ${
                          tags.includes(tag)
                            ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30 opacity-50'
                            : 'bg-dark-bg-secondary/50 text-gray-400 border-gray-600 hover:border-neon-purple hover:text-neon-purple'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 已选标签 */}
                <AnimatePresence>
                  {tags.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {tags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-neon-red transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 兼容模型 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CpuChipIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  兼容模型
                </label>
                
                <ModelSelector
                  selectedModels={models}
                  onChange={handleModelChange}
                  placeholder="选择或添加兼容的AI模型..."
                />
                
                <p className="text-xs text-gray-500">
                  选择此提示词兼容的AI模型类型，支持文本、图像、音频、视频等多种模型
                </p>
              </motion.div>

              {/* 公开/私有选项 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex items-center justify-between p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-neon-cyan">
                    {watch('is_public') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">{watch('is_public') ? '公开分享' : '私人提示词'}</h3>
                    <p className="text-gray-400 text-sm">{watch('is_public') ? '所有人可以查看和使用您的提示词（访问权限）' : '只有您自己可以访问此提示词'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      {...register('is_public')} 
                      defaultChecked={false}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-cyan rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                  </label>
                </div>
              </motion.div>

              {/* 协作设置 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <ShieldExclamationIcon className="h-5 w-5 text-neon-purple mr-2" />
                  协作设置
                </label>
                
                <div className="relative flex items-start p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={watch('allow_collaboration') || false}
                      onChange={(e) => setValue('allow_collaboration', e.target.checked)}
                      className="h-4 w-4 text-neon-cyan border-gray-600 rounded focus:ring-neon-cyan"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-300">
                      允许协作编辑
                    </div>
                    <div className="text-sm text-gray-400">
                      允许其他贡献者修改这个提示词的内容（编辑权限，仅在公开分享时有效）
                    </div>
                  </div>
                </div>

                {/* 编辑权限级别 */}
                <div className="p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    编辑权限级别
                  </label>
                  <select
                    value={watch('edit_permission') || PERMISSION_LEVELS.OWNER_ONLY}
                    onChange={(e) => setValue('edit_permission', e.target.value as any)}
                    className="input-primary w-full"
                  >
                    {Object.entries(PERMISSION_LEVEL_DESCRIPTIONS).map(([key, description]) => (
                      <option key={key} value={key}>
                        {description}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* 提交按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex justify-end space-x-4 pt-8"
              >
                <Link href="/prompts">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                  >
                    取消
                  </motion.button>
                </Link>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>创建中...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>创建提示词</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CreatePromptPage); 