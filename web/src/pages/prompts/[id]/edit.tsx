import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePrompt, getCategories, getTags, getPromptDetails, Category } from '@/lib/api';
import { PromptDetails, PermissionCheck } from '@/types';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  XMarkIcon,
  PlusCircleIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  CodeBracketIcon,
  TagIcon,
  DocumentTextIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import { useAuth } from '@/contexts/AuthContext';
import { 
  checkEditPermission, 
  checkFieldPermission,
  getPermissionDescription,
  getPermissionColor,
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_DESCRIPTIONS
} from '@/lib/permissions';
import { 
  validateVersionFormat,
  canIncrementVersion,
  suggestNextVersion,
  formatVersionFromInt,
  parseVersionToInt,
  getVersionValidationMessage,
  formatVersionDisplay
} from '@/lib/version-utils';
// @ts-ignore
import { pinyin } from 'pinyin-pro';
import { ModelSelector } from '@/components/ModelSelector';

type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  is_public?: boolean;
  version?: string | number; // 允许版本字段为字符串或数字
};

interface EditPromptPageProps {
  prompt: PromptDetails;
}

function EditPromptPage({ prompt }: EditPromptPageProps) {
  const router = useRouter();
  const { user, getToken, isLoading, isAuthenticated } = useAuth();
  
  // 认证检查
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  // 如果正在加载认证状态，显示加载界面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        </div>
        
        {/* 加载内容 */}
        <div className="relative z-10 text-center">
          <div className="relative mx-auto mb-8">
            <div className="w-16 h-16 border-4 border-neon-cyan/30 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-neon-cyan rounded-full animate-pulse"></div>
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-neon-purple/20 rounded-full animate-ping"></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold gradient-text">验证身份中</h3>
            <p className="text-gray-400 text-sm">正在连接到服务器...</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果未认证，返回null等待重定向
  if (!isAuthenticated) {
    return null;
  }
  
  // 格式化当前版本号 - 一位小数方案，确保格式一致
  const currentVersionFormatted = typeof prompt.version === 'number' 
    ? Math.round(prompt.version * 10) / 10  // 确保一位小数格式
    : parseVersionToInt(prompt.version || 1.0);

  // 修复edit_permission数据映射 - 支持更多变体
  const mapEditPermission = (serverValue: any): 'owner_only' | 'collaborators' | 'public' => {
    // 处理可能的各种格式
    const normalizedValue = String(serverValue).toLowerCase().trim();
    
    switch (normalizedValue) {
      case 'owner':
      case 'owner_only':
      case 'owneronly':
        return 'owner_only';
      case 'collaborators':
      case 'collaborator':
        return 'collaborators';
      case 'public':
      case 'everyone':
        return 'public';
      default:
        console.warn('未识别的编辑权限值:', serverValue, '使用默认值 owner_only');
        return 'owner_only';
    }
  };

  // 分类数据标准化处理
  const normalizeCategoryName = (category: string | undefined): string => {
    if (!category) return '通用';
    
    // 清理分类名称：去除多余空格、统一格式
    const cleaned = category.trim();
    
    // 只做基本的英文到中文映射，不要随意更改中文分类名称
    const categoryMappings: { [key: string]: string } = {
      'general': '通用',
      'academic': '学术',
      'professional': '职业', 
      'creative': '文案',
      'design': '设计',
      'education': '教育',
      'entertainment': '娱乐',
      'game': '游戏',
      'life': '生活',
      'business': '商业',
      'office': '办公',
      'code': '编程',
      'programming': '编程',
      'translation': '翻译',
      'video': '视频',
      'podcast': '播客',
      'music': '音乐',
      'health': '健康',
      'technology': '科技'
    };
    
    // 检查是否为英文分类，如果是则映射为中文
    const mapped = categoryMappings[cleaned.toLowerCase()];
    if (mapped) return mapped;
    
    // 中文分类名称直接返回，不做映射
    return cleaned;
  };

  // 确保所有数据都有默认值并正确格式化
  const safePromptData = {
    name: prompt.name || '',
    description: prompt.description || '',
    content: prompt.content || prompt.messages?.[0]?.content || '',
    category: normalizeCategoryName(prompt.category),
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
    compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : ['GPT-4', 'GPT-3.5', 'Claude-2'],
    version: currentVersionFormatted, // 使用正确的格式化版本号
    author: prompt.author || user?.display_name || user?.username || '未知用户',
    template_format: prompt.template_format || 'text',
    is_public: prompt.is_public !== undefined ? Boolean(prompt.is_public) : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? Boolean(prompt.allow_collaboration) : false,
    edit_permission: mapEditPermission(prompt.edit_permission),
  };
  
  // 添加调试日志以排查问题
  console.log('编辑页面数据处理结果（一位小数版本方案）:', {
    原始版本: prompt.version,
    格式化版本: currentVersionFormatted,
    最终版本: safePromptData.version,
    版本类型: typeof safePromptData.version,
    原始分类: prompt.category,
    标准化分类: safePromptData.category,
    原始编辑权限: prompt.edit_permission,
    映射后编辑权限: safePromptData.edit_permission,
    权限常量: PERMISSION_LEVELS,
    映射描述: PERMISSION_LEVEL_DESCRIPTIONS
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>(safePromptData.input_variables);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>(safePromptData.tags);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>(safePromptData.compatible_models);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [permissionCheck, setPermissionCheck] = useState<PermissionCheck | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  
  // 添加实时内容监听状态 - 用于修复AI按钮问题
  const [currentContent, setCurrentContent] = useState(safePromptData.content);
  
  // 添加分类建议状态
  const [categorySuggestion, setCategorySuggestion] = useState<{
    suggested: string;
    current: string;
    confidence: string;
  } | null>(null);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // 直接使用字符串数组
        setCategories(data);
        console.log('分类数据加载完成:', {
          categories: data,
          currentCategory: safePromptData.category,
          isCurrentCategoryInList: data.some((cat: string) => cat === safePromptData.category)
        });
      } catch (err) {
        console.error('获取分类失败:', err);
        setCategories([
          '通用', '创意写作', '代码辅助', '数据分析', '营销', '学术研究', '教育'
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);
  
  // 获取标签数据
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        setSuggestedTags(data);
      } catch (err) {
        console.error('获取标签失败:', err);
        setSuggestedTags(['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色']);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<PromptFormData>({
    defaultValues: {
      name: safePromptData.name,
      description: safePromptData.description,
      content: safePromptData.content,
      category: safePromptData.category,
      tags: safePromptData.tags,
      input_variables: safePromptData.input_variables,
      compatible_models: safePromptData.compatible_models,
      version: currentVersionFormatted, // 直接使用格式化后的版本号
      author: safePromptData.author,
      template_format: safePromptData.template_format,
      is_public: safePromptData.is_public,
      allow_collaboration: safePromptData.allow_collaboration,
      edit_permission: safePromptData.edit_permission,
    }
  });

  // 监听表单内容变化，确保AI按钮能够正确获取内容 - 修复AI按钮问题
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'content') {
        setCurrentContent(value.content || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // 分类加载后自动匹配（编辑场景） - 移动到useForm之后
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) {
      const currentCategory = safePromptData.category;
      
      // 检查当前分类是否在分类列表中
      if (currentCategory && !categories.includes(currentCategory)) {
        // 如果不在列表中，尝试智能匹配
        const matched = matchCategory(currentCategory, categories);
        if (matched) {
          console.log(`分类智能匹配: "${currentCategory}" -> "${matched}"`);
          setValue('category', matched);
        } else {
          // 如果匹配失败，添加到分类列表中
          console.log(`添加新分类: "${currentCategory}"`);
          setCategories(prev => [...prev, currentCategory]);
          setValue('category', currentCategory);
        }
      } else if (currentCategory) {
        // 分类存在于列表中，直接设置
        setValue('category', currentCategory);
      }
    }
  }, [categoriesLoading, categories, safePromptData.category, setValue]);

  // 一次性数据初始化：仅在组件挂载时执行
  useEffect(() => {
    // 如果input_variables为空，尝试从content中提取变量
    let finalVariables = safePromptData.input_variables || [];
    if (finalVariables.length === 0 && safePromptData.content) {
      const matches = safePromptData.content.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        finalVariables = Array.from(new Set(
          matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
        )).filter(variable => variable.length > 0);
      }
    }
    
    // 同步状态变量（但不调用setValue避免无限循环）
    setVariables(finalVariables);
    setTags(safePromptData.tags || []);
    setModels(safePromptData.compatible_models || []);
    
    console.log('前端一次性数据初始化完成:', {
      promptName: safePromptData.name,
      category: safePromptData.category,
      extractedVariables: finalVariables,
      originalVariables: safePromptData.input_variables,
      tags: safePromptData.tags,
      models: safePromptData.compatible_models,
      content: safePromptData.content ? safePromptData.content.substring(0, 100) + '...' : 'empty',
      formDefaultValues: {
        name: safePromptData.name,
        category: safePromptData.category,
        description: safePromptData.description
      }
    });
  }, []); // 空依赖数组，仅执行一次

  // 权限检查和作者信息更新
  useEffect(() => {
    if (user) {
      const permission = checkEditPermission(prompt, user);
      setPermissionCheck(permission);
      
      // 更新作者信息如果当前没有作者或作者为未知用户
      if (!prompt.author || prompt.author === '未知用户') {
        const authorName = user.display_name || user.username || user.email.split('@')[0];
        setValue('author', authorName);
      }
      
      // 如果没有权限，3秒后重定向到详情页
      if (!permission.canEdit) {
        setTimeout(() => {
          router.push(`/prompts/${prompt.id}`);
        }, 3000);
      }
    }
  }, [user, prompt, router, setValue]);

  // 监听表单变化以检测未保存的更改
  const watchedValues = watch();
  useEffect(() => {
    const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify({
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      version: prompt.version || 1,
      author: prompt.author || user?.display_name || user?.username || '',
      template_format: prompt.template_format || 'text',
      input_variables: prompt.input_variables || [],
      tags: prompt.tags || [],
      compatible_models: prompt.compatible_models || [],
      is_public: prompt.is_public || false,
      allow_collaboration: prompt.allow_collaboration || false,
      edit_permission: prompt.edit_permission || 'owner_only',
    });
    setHasUnsavedChanges(hasChanges);
  }, [watchedValues, prompt, user]);

  // 监听提示词内容以提取变量
  const promptContent = watch('content');

  // 自动检测变量 - 增强版，同时更新内容状态
  const detectVariables = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    // 实时更新内容状态以确保AI按钮能够监听到变化
    setCurrentContent(content);
    
    if (!content) return;
    
    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      const detectedVars = Array.from(new Set(
        matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
      )).filter(variable => variable.length > 0);
      
      if (detectedVars.length > 0) {
        const newVariables = Array.from(new Set([...variables, ...detectedVars]));
        setVariables(newVariables);
        setValue('input_variables', newVariables);
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

  // 智能分类映射函数
  function matchCategory(aiCategory: string, categories: string[]): string | null {
    if (!aiCategory) return null;
    
    // 1. 精确匹配
    let match = categories.find(cat => cat === aiCategory);
    if (match) return match;
    
    // 2. 忽略大小写
    match = categories.find(cat => cat.toLowerCase() === aiCategory.toLowerCase());
    if (match) return match;
    
    // 3. 包含匹配
    match = categories.find(cat => aiCategory.includes(cat) || cat.includes(aiCategory));
    if (match) return match;
    
    // 如果都不匹配，返回null，让调用者决定是否使用默认值
    return null;
  }

  // AI分析处理函数 - 增强版，支持增量分析和智能版本管理
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
      
      // 智能版本号建议 - 基于内容变化程度
      const currentVersion = watch('version') || safePromptData.version || 1.0;
      const originalContent = safePromptData.content || '';
      const newContent = currentContent || '';
      
      // 计算内容变化程度
      const contentChangeRatio = calculateContentChangeRatio(originalContent, newContent);
      let suggestedVersion = currentVersion;
      
      if (contentChangeRatio > 0.6) {
        // 重大变化：版本号增加1.0
        suggestedVersion = Math.floor(currentVersion) + 1.0;
      } else if (contentChangeRatio > 0.3) {
        // 中等变化：版本号增加0.5
        suggestedVersion = Math.floor(currentVersion) + 0.5;
      } else if (contentChangeRatio > 0.1) {
        // 轻微变化：版本号增加0.1
        suggestedVersion = Math.round((currentVersion + 0.1) * 10) / 10;
      }
      // 如果变化很小（<0.1），保持原版本号
      
      result.version = suggestedVersion.toString();
      
      console.log('智能版本分析:', {
        原版本: currentVersion,
        内容变化比: contentChangeRatio,
        建议版本: suggestedVersion,
        变化程度: contentChangeRatio > 0.6 ? '重大' : contentChangeRatio > 0.3 ? '中等' : contentChangeRatio > 0.1 ? '轻微' : '微小'
      });
      
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysis(true);
    }
  };

  // 计算内容变化比例的辅助函数
  const calculateContentChangeRatio = (originalContent: string, newContent: string): number => {
    if (!originalContent && !newContent) return 0;
    if (!originalContent) return 1;
    if (!newContent) return 1;
    
    // 简单的字符差异比较
    const maxLength = Math.max(originalContent.length, newContent.length);
    const minLength = Math.min(originalContent.length, newContent.length);
    
    // 计算共同字符数
    let commonChars = 0;
    const shorter = originalContent.length < newContent.length ? originalContent : newContent;
    const longer = originalContent.length >= newContent.length ? originalContent : newContent;
    
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) {
        commonChars++;
      }
    }
    
    // 计算变化比例
    const changeRatio = 1 - (commonChars / maxLength);
    return Math.min(1, Math.max(0, changeRatio));
  };

  // 应用AI分析结果 - 增强版，支持智能合并现有参数
  const applyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    // 获取当前表单值用于智能合并
    const currentValues = watch();
    const originalContent = safePromptData.content || '';
    const newContent = currentContent || '';
    const contentChangeRatio = calculateContentChangeRatio(originalContent, newContent);
    
    console.log('智能合并分析:', {
      内容变化比: contentChangeRatio,
      当前分类: currentValues.category,
      AI建议分类: data.category,
      当前标签: tags,
      AI建议标签: data.tags
    });

    // 智能分类建议 - 基于内容性质判断，而非变化程度
    if (data.category) {
      const mapped = matchCategory(data.category, categories);
      if (mapped && mapped !== currentValues.category) {
        // 显示分类建议，让用户决定是否应用
        const confidenceLevel = contentChangeRatio > 0.6 ? '高' : contentChangeRatio > 0.3 ? '中' : '低';
        setCategorySuggestion({
          suggested: mapped,
          current: currentValues.category || '未知',
          confidence: confidenceLevel
        });
        console.log(`AI分类建议: ${currentValues.category} -> ${mapped} (置信度: ${confidenceLevel})`);
      } else if (mapped === currentValues.category) {
        // 清除建议，AI确认当前分类合适
        setCategorySuggestion(null);
        console.log(`分类验证: AI确认当前分类"${currentValues.category}"是合适的`);
      }
    }
    
    // 智能应用标签 - 合并现有标签和新建议标签
    if (data.tags && Array.isArray(data.tags)) {
      let finalTags = [...tags]; // 保留现有标签
      
      if (contentChangeRatio > 0.3) {
        // 内容有较大变化时，合并新标签
        const newTags = data.tags.filter(tag => !finalTags.includes(tag));
        finalTags = [...finalTags, ...newTags];
      } else {
        // 内容变化较小时，只添加相关性很高的标签
        const relevantTags = data.tags.filter(tag => 
          !finalTags.includes(tag) && 
          (tag.includes('优化') || tag.includes('改进') || tag.includes('增强'))
        );
        finalTags = [...finalTags, ...relevantTags];
      }
      
      if (finalTags.length !== tags.length) {
        setTags(finalTags);
        setValue('tags', finalTags);
        setHasUnsavedChanges(true);
        console.log(`标签合并: ${tags.length} -> ${finalTags.length}个标签`);
      }
    }
    
    // 应用版本 - 使用智能建议的版本号
    if (data.version) {
      let versionNum = 1;
      if (typeof data.version === 'number') versionNum = data.version;
      else if (typeof data.version === 'string') versionNum = parseFloat(data.version) || 1;
      
      setValue('version', versionNum);
      setHasUnsavedChanges(true);
      console.log(`版本更新: ${currentValues.version} -> ${versionNum}`);
    }
    
    // 智能应用变量 - 合并现有变量和新检测变量
    if (data.variables && Array.isArray(data.variables)) {
      const mergedVariables = Array.from(new Set([...variables, ...data.variables]));
      if (mergedVariables.length !== variables.length) {
        setVariables(mergedVariables);
        setValue('input_variables', mergedVariables);
        setHasUnsavedChanges(true);
        console.log(`变量合并: ${variables.length} -> ${mergedVariables.length}个变量`);
      }
    }
    
    // 智能应用兼容模型 - 仅在内容有较大变化时才更改模型兼容性
    if (data.compatibleModels && Array.isArray(data.compatibleModels) && contentChangeRatio > 0.4) {
      // 合并现有模型和新建议模型
      const mergedModels = Array.from(new Set([...models, ...data.compatibleModels]));
      if (mergedModels.length !== models.length) {
        setModels(mergedModels);
        setValue('compatible_models', mergedModels);
        setHasUnsavedChanges(true);
        console.log(`兼容模型合并: ${models.length} -> ${mergedModels.length}个模型`);
      }
    }

    // 应用建议标题 - 仅在标题为空或内容有重大变化时
    if (data.suggestedTitle && (!currentValues.name || contentChangeRatio > 0.5)) {
      setValue('name', data.suggestedTitle);
      setHasUnsavedChanges(true);
      console.log(`标题更新: ${currentValues.name} -> ${data.suggestedTitle}`);
    }

    // 智能应用描述 - 基于内容变化程度和现有描述情况
    if (data.description) {
      if (!currentValues.description) {
        // 如果原本没有描述，直接应用
        setValue('description', data.description);
        setHasUnsavedChanges(true);
        console.log(`描述新增: ${data.description.substring(0, 50)}...`);
      } else if (contentChangeRatio > 0.3) {
        // 内容有较大变化时，更新描述
        setValue('description', data.description);
        setHasUnsavedChanges(true);
        console.log(`描述更新 (变化${(contentChangeRatio * 100).toFixed(1)}%): ${currentValues.description.substring(0, 30)}... -> ${data.description.substring(0, 30)}...`);
      } else {
        // 变化较小时，保持原描述
        console.log(`描述保持: 内容变化较小(${(contentChangeRatio * 100).toFixed(1)}%)，保持原描述`);
      }
    }
  };

  // 表单提交
  const onSubmit = async (data: PromptFormData) => {
    // 再次检查权限
    if (!permissionCheck?.canEdit) {
      alert('您没有编辑此提示词的权限');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 同步表单数据
      data.input_variables = variables;
      data.tags = tags;
      data.compatible_models = models;
      
      // 确保版本号是整数格式（后端需要）
      const versionInt = typeof data.version === 'number' 
        ? data.version 
        : parseVersionToInt(String(data.version));
      
      data.version = versionInt;
      
      console.log('提交的表单数据:', {
        原始版本: data.version,
        处理后版本: versionInt,
        其他数据: { ...data, content: data.content?.substring(0, 100) + '...' }
      });
      
      // 获取token
      let token = undefined;
      if (typeof window !== 'undefined' && user && typeof user === 'object') {
        if (typeof getToken === 'function') {
          token = await getToken();
        }
      }
      const result = await updatePrompt(prompt.id, data, token || undefined);
      
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      // 显示弹窗成功提示
      alert('✅ 提示词保存成功！');
      
      setTimeout(() => setSaveSuccess(false), 5000); // 延长显示时间
      
      // 名称更改不影响URL，因为我们使用ID
      // 无需重定向，保持在当前页面
    } catch (error) {
      console.error('更新提示词失败:', error);
      alert(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    const resetData = {
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: normalizeCategoryName(prompt.category),
      version: typeof prompt.version === 'number' 
        ? Math.round(prompt.version * 10) / 10  // 确保一位小数格式
        : parseVersionToInt(prompt.version || 1.0), 
      author: prompt.author || user?.display_name || user?.username || '',
      template_format: prompt.template_format || 'text',
      input_variables: prompt.input_variables || [],
      tags: prompt.tags || [],
      compatible_models: prompt.compatible_models || [],
      is_public: Boolean(prompt.is_public),
      allow_collaboration: Boolean(prompt.allow_collaboration),
      edit_permission: mapEditPermission(prompt.edit_permission),
    };
    
    console.log('重置表单数据（一位小数版本方案）:', resetData);
    
    reset(resetData);
    setVariables(prompt.input_variables || []);
    setTags(prompt.tags || []);
    setModels(prompt.compatible_models || []);
    setHasUnsavedChanges(false);
  };

  // 页面离开前的确认
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 权限检查失败时显示错误页面
  if (permissionCheck && !permissionCheck.canEdit) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link href={`/prompts/${prompt.id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回提示词详情
            </Link>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
            <p className="text-gray-600 mb-6">{permissionCheck.message}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">编辑权限说明：</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>您可以编辑自己创建的提示词</li>
                  <li>管理员可以编辑所有提示词</li>
                  <li>贡献者可以编辑公开的提示词</li>
                  <li>其他用户无法编辑他人的提示词</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href={`/prompts/${prompt.id}`}
                className="btn-primary"
              >
                查看提示词详情
              </Link>
              <Link
                href="/prompts"
                className="btn-secondary"
              >
                浏览其他提示词
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              3秒后将自动跳转到提示词详情页面...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 返回按钮 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href={`/prompts/${prompt.id}`}
              className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              返回提示词详情
            </Link>
          </motion.div>

          {/* 权限提示 */}
          {permissionCheck && permissionCheck.canEdit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-cyan/20 p-4"
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-neon-cyan" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    编辑权限确认
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {permissionCheck.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 成功提示 */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-green/20 p-4"
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-neon-green" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    提示词已成功更新！
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 未保存更改提示 */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-xl border border-neon-orange/20 p-4"
            >
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-neon-orange" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    您有未保存的更改
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    请记得保存您的更改，否则离开页面时将丢失。
                  </p>
                </div>
              </div>
            </motion.div>
          )}

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
              编辑提示词
            </motion.h1>
            <motion.p
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              编辑 "{prompt.name}" 的详细信息。所有带 * 的字段为必填项。
            </motion.p>
          </motion.div>
          
          {/* 表单容器 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
          >
          
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
              {/* 基本信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词名称 *
                  </label>
                  <input
                    {...register('name', {
                      required: '提示词名称是必填的'
                    })}
                    type="text"
                    placeholder="输入提示词名称"
                    className="input-primary w-full"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    提示词显示名称，可以随时修改
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                    版本 *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      {...register('version')}
                      type="text"
                      value={String(watch('version') ?? '')}
                      onChange={e => setValue('version', e.target.value as any)}
                      className="input-primary w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentVersion = watch('version') || currentVersionFormatted;
                        const suggested = suggestNextVersion(currentVersion, 'minor');
                        setValue('version', suggested);
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                      title="小版本更新 (+0.1)"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVersion = watch('version') || currentVersionFormatted;
                        const suggested = suggestNextVersion(currentVersion, 'major');
                        setValue('version', suggested);
                      }}
                      className="btn-secondary text-sm px-3 py-1"
                      title="大版本更新 (+1.0)"
                    >
                      +1.0
                    </button>
                  </div>
                  {errors.version && (
                    <p className="text-neon-red text-sm mt-1">{errors.version.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    当前版本：{formatVersionDisplay(currentVersionFormatted)}，新版本必须是大于当前版本的数字（支持一位小数）
                  </p>
                </div>
              </motion.div>

              {/* 分类和作者 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
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
                    value={watch('category') || ''}
                    onChange={e => setValue('category', e.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="">选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                  )}
                  
                  {/* 分类建议提示 */}
                  <AnimatePresence>
                    {categorySuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              AI建议
                            </span>
                            <span className="text-gray-700">
                              建议将分类从 
                              <span className="font-medium text-blue-600 mx-1">"{categorySuggestion.current}"</span>
                              更改为 
                              <span className="font-medium text-green-600 mx-1">"{categorySuggestion.suggested}"</span>
                              <span className="text-xs text-gray-500">(置信度: {categorySuggestion.confidence})</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setValue('category', categorySuggestion.suggested);
                                setHasUnsavedChanges(true);
                                setCategorySuggestion(null);
                              }}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                            >
                              应用
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategorySuggestion(null)}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                            >
                              忽略
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    disabled={!checkFieldPermission('author', permissionCheck)}
                  />
                  {!checkFieldPermission('author', permissionCheck) && (
                    <p className="text-xs text-gray-500">
                      只有创建者和管理员可以修改作者信息
                    </p>
                  )}
                </div>
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
                      disabled={!checkFieldPermission('is_public', permissionCheck)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-cyan rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                  </label>
                </div>
              </motion.div>

              {/* 描述 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
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

              {/* 提示词内容 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词内容 *
                  </label>
                  
                  {/* AI分析按钮组 - 增强版，支持增量分析 */}
                  <div className="flex items-center gap-2">
                    <AIAnalyzeButton
                      content={currentContent || watch('content') || ''}
                      onAnalysisComplete={(result) => {
                        handleAIAnalysis(result);
                      }}
                      variant="full"
                      currentVersion={watch('version')?.toString() || safePromptData.version?.toString()}
                      isNewPrompt={false}
                      existingVersions={[safePromptData.version?.toString() || '1.0']}
                      originalContent={safePromptData.content}
                      existingCategory={watch('category') || safePromptData.category}
                      existingTags={tags}
                      existingModels={models}
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={8}
                    placeholder="在这里输入您的提示词内容。使用 {{变量名}} 来定义可替换的变量..."
                    className="input-primary w-full resize-none font-mono"
                    onChange={(e) => {
                      detectVariables(e);
                    }}
                  />
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {`{{变量名}}`} 定义变量
                  </div>
                </div>
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
                
                {/* AI分析结果显示 */}
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

              {/* 变量管理 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                  输入变量
                </label>
                
                {/* 添加变量 */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="输入变量名"
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

                {/* 变量列表 */}
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
                  <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
                  标签
                </label>
                
                {/* 添加标签 */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签"
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
                {!tagsLoading && suggestedTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">推荐标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.filter(tag => !tags.includes(tag)).slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const newTags = [...tags, tag];
                            setTags(newTags);
                            setValue('tags', newTags);
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition-all duration-300 bg-dark-bg-secondary/50 text-gray-400 border-gray-600 hover:border-neon-purple hover:text-neon-purple`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                transition={{ delay: 2 }}
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

              {/* 可见性和权限设置 */}
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
                      disabled={!checkFieldPermission('allow_collaboration', permissionCheck)}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-300">
                      允许协作编辑
                    </div>
                    <div className="text-sm text-gray-400">
                      允许其他贡献者修改这个提示词的内容（编辑权限，仅在公开分享时有效）
                    </div>
                    {!checkFieldPermission('allow_collaboration', permissionCheck) && (
                      <div className="text-xs text-neon-orange mt-1">
                        您无权修改协作设置
                      </div>
                    )}
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
                    disabled={!checkFieldPermission('edit_permission', permissionCheck)}
                  >
                    {Object.entries(PERMISSION_LEVEL_DESCRIPTIONS).map(([key, description]) => (
                      <option key={key} value={key}>
                        {description}
                      </option>
                    ))}
                  </select>
                  {!checkFieldPermission('edit_permission', permissionCheck) && (
                    <p className="mt-1 text-xs text-neon-orange">
                      您无权修改编辑权限设置
                    </p>
                  )}
                </div>
              </motion.div>

              {/* 提交按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="flex justify-end space-x-4 pt-8"
              >
                <Link href={`/prompts/${prompt.id}`}>
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
                  type="button"
                  onClick={handleReset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  重置
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !permissionCheck?.canEdit}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>保存更改</span>
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

export default EditPromptPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    // 使用Next.js API路由获取提示词详情，这样可以复用前端的API逻辑
    const baseUrl = `http://localhost:${process.env.FRONTEND_PORT || 9011}`;
    
    // 从 Cookie 获取用户认证信息（如果有的话）
    let authHeaders: Record<string, string> = {};
    if (context.req.headers.cookie) {
      authHeaders['Cookie'] = context.req.headers.cookie;
    }
    
    // 尝试通过API获取提示词详情
    const apiResponse = await fetch(`${baseUrl}/api/prompts/${encodeURIComponent(id as string)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const result = await apiResponse.json();
    
    if (!result.success || !result.prompt) {
      throw new Error(result.error || '无法获取提示词数据');
    }
    
    const prompt = result.prompt;
    
    // 添加详细的调试输出
    console.log('getServerSideProps - API返回的原始数据:', JSON.stringify(prompt, null, 2));
    console.log('getServerSideProps - 数据字段检查:', {
      id: prompt.id,
      name: prompt.name,
      category: prompt.category,
      tags: prompt.tags,
      input_variables: prompt.input_variables,
      content: prompt.content || 'empty', // 显示完整内容
      messages: prompt.messages,
      contentLength: prompt.content ? prompt.content.length : 0
    });
    
    // 确保数据格式符合PromptDetails类型
    const promptDetails: PromptDetails = {
      id: prompt.id,
      name: prompt.name || id as string,
      description: prompt.description || '',
      content: prompt.content || prompt.messages?.[0]?.content || '', // 尝试从messages中提取content
      category: prompt.category || '通用',
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      input_variables: Array.isArray(prompt.input_variables) ? prompt.input_variables : [],
      compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : [],
      template_format: prompt.template_format || 'text',
      version: typeof prompt.version === 'number' ? prompt.version : 1,
      author: prompt.author || prompt.user_id || '',
      is_public: Boolean(prompt.is_public),
      allow_collaboration: Boolean(prompt.allow_collaboration),
      edit_permission: prompt.edit_permission === 'owner' ? 'owner_only' as const : 
                      (prompt.edit_permission || 'owner_only' as const),
      user_id: prompt.user_id || '',
      created_at: prompt.created_at || new Date().toISOString(),
      updated_at: prompt.updated_at || new Date().toISOString(),
    };
    
    console.log('getServerSideProps - 处理后的数据:', JSON.stringify(promptDetails, null, 2));
    
    return {
      props: {
        prompt: promptDetails,
      },
    };
  } catch (error) {
    console.error('获取提示词详情失败:', error);
    
    return {
      notFound: true,
    };
  }
}; 