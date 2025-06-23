import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { updatePrompt, getCategories, getTags, Category } from '@/lib/api';
import { databaseService } from '@/lib/database-service';
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
import { useAuth, withAuth } from '@/contexts/AuthContext';
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
import SmartWritingAssistant from '@/components/SmartWritingAssistant';

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
    compatible_models: Array.isArray(prompt.compatible_models) ? prompt.compatible_models : [], // 保持数据原始性
    version: currentVersionFormatted, // 使用正确的格式化版本号
    author: prompt.author || user?.display_name || user?.username || '未知用户',
    template_format: prompt.template_format || 'text',
    is_public: prompt.is_public !== undefined ? Boolean(prompt.is_public) : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? Boolean(prompt.allow_collaboration) : false,
    edit_permission: mapEditPermission(prompt.edit_permission),
  };
  

  
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
  
  // 移动端智能助手显示状态
  const [showMobileAssistant, setShowMobileAssistant] = useState(false);
  
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
          setValue('category', matched);
        } else {
          // 如果匹配失败，添加到分类列表中
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

  // 为AI分析按钮提供配置（保持与创建页面一致的结构）
  const getAIAnalysisConfig = () => {
    return {
      isNewPrompt: false, // 编辑页面不是新提示词
      existingVersions: [], // 不再使用版本比较
      currentVersion: undefined // 不再使用当前版本比较
    };
  };

  // 应用AI分析结果 - 与创建页面保持一致
  const applyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    // 获取当前表单值用于记录
    const currentValues = watch();
    
    console.log('AI分析应用:', {
      当前分类: currentValues.category,
      AI建议分类: data.category,
      当前标签: tags,
      AI建议标签: data.tags
    });

    // 智能分类建议 - 直接应用，不显示建议提示
    if (data.category) {
      const mapped = matchCategory(data.category, categories);
      if (mapped) {
        setValue('category', mapped);
        setHasUnsavedChanges(true);
        console.log(`AI分类应用: ${currentValues.category} -> ${mapped}`);
        // 清除任何分类建议
        setCategorySuggestion(null);
      }
    }
    
    // 智能应用标签 - 直接应用AI建议的标签
    if (data.tags && Array.isArray(data.tags)) {
      setTags(data.tags);
      setValue('tags', data.tags);
      setHasUnsavedChanges(true);
      console.log(`AI标签应用: ${tags.length} -> ${data.tags.length}个标签`);
      console.log('标签详情:', { 
        原有: tags, 
        AI建议: data.tags, 
        最终应用: data.tags 
      });
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
    
    // 智能应用变量 - 直接应用AI建议的变量
    if (data.variables && Array.isArray(data.variables)) {
      setVariables(data.variables);
      setValue('input_variables', data.variables);
      setHasUnsavedChanges(true);
      console.log(`AI变量应用: ${variables.length} -> ${data.variables.length}个变量`);
      console.log('变量详情:', { 
        原有: variables, 
        AI建议: data.variables, 
        最终应用: data.variables 
      });
    }
    
    // 智能应用兼容模型 - 直接应用AI建议的模型
    if (data.compatibleModels && Array.isArray(data.compatibleModels)) {
      // 使用AI建议的模型列表，而不是合并
      setModels(data.compatibleModels);
      setValue('compatible_models', data.compatibleModels);
      setHasUnsavedChanges(true);
      console.log(`兼容模型应用: ${models.length} -> ${data.compatibleModels.length}个模型`);
      console.log('兼容模型详情:', { 
        原有: models, 
        AI建议: data.compatibleModels, 
        最终应用: data.compatibleModels 
      });
    }

    // 应用建议标题 - 直接应用AI建议的标题
    if (data.suggestedTitle) {
      setValue('name', data.suggestedTitle);
      setHasUnsavedChanges(true);
      console.log(`AI标题应用: ${currentValues.name} -> ${data.suggestedTitle}`);
    }

    // 应用建议描述 - 直接应用AI建议的描述
    if (data.description) {
      setValue('description', data.description);
      setHasUnsavedChanges(true);
      console.log(`AI描述应用: ${data.description.substring(0, 50)}...`);
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
      const result = await updatePrompt(prompt.id, data);
      
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      
      // 保存成功后直接跳转回详情页面，提供更好的用户体验
      router.push(`/prompts/${prompt.id}`);
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
              完善您的智能提示词，让AI更好地理解您的需求
            </motion.p>
          </motion.div>
          
          {/* 移动端智能助手（可折叠） */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="xl:hidden mb-6"
          >
            <button
              onClick={() => setShowMobileAssistant(!showMobileAssistant)}
              className="w-full flex items-center justify-between p-4 glass rounded-2xl border border-neon-purple/20 hover:border-neon-purple/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-6 w-6 text-neon-purple" />
                <span className="text-white font-semibold">智能写作助手</span>
              </div>
              <ChevronLeftIcon 
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showMobileAssistant ? 'rotate-90' : '-rotate-90'
                }`} 
              />
            </button>
            
            <AnimatePresence>
              {showMobileAssistant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 glass rounded-2xl border border-neon-purple/20 p-4"
                >
                  <SmartWritingAssistant
                    content={currentContent || watch('content') || ''}
                    onContentChange={(newContent) => {
                      setValue('content', newContent);
                      setCurrentContent(newContent);
                    }}
                    onAnalysisComplete={(result) => {
                      // 仅显示分析结果，不自动应用，需要用户手动点击应用按钮
                      console.log('收到智能分析结果，等待用户手动应用:', result);
                    }}
                    onApplyAnalysisResults={applyAIResults}
                    category={watch('category')}
                    tags={tags}
                    className="max-h-96 overflow-y-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 双栏布局容器 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 主表单区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="xl:col-span-2 glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
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
                  <label htmlFor="edit-content" className="flex items-center text-lg font-semibold text-gray-200">
                    <CodeBracketIcon className="h-6 w-6 text-neon-cyan mr-3" />
                    提示词内容 *
                    <span className="ml-2 text-sm font-normal text-gray-400">核心内容区域</span>
                  </label>
                  
                  {/* 提示用户使用右侧栏的智能功能 */}
                  <div className="text-sm text-gray-400">
                    💡 使用右侧智能助手进行分析和优化
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    id="edit-content"
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={12}
                    placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
                    className="input-primary w-full font-mono text-sm resize-none"
                    onChange={detectVariables}
                    autoComplete="off"
                  />
                  
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {`{{变量名}}`} 定义变量
                  </div>
                </div>
                
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
                

              </motion.div>

              {/* 基本信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-2">
                  <label htmlFor="edit-prompt-name" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    提示词名称 *
                  </label>
                  <input
                    id="edit-prompt-name"
                    {...register('name', { required: '请输入提示词名称' })}
                    type="text"
                    placeholder="为您的提示词起个响亮的名字"
                    className="input-primary w-full"
                    autoComplete="off"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-author" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                    作者
                  </label>
                  <input
                    id="edit-author"
                    {...register('author')}
                    type="text"
                    placeholder={user?.username || "您的名字"}
                    className="input-primary w-full"
                    autoComplete="name"
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
                  <label htmlFor="edit-category" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    分类 *
                  </label>
                  <select
                    id="edit-category"
                    {...register('category', { required: '请选择分类' })}
                    className="input-primary w-full"
                    autoComplete="off"
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
                  <label htmlFor="edit-author-2" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                    作者
                  </label>
                  <input
                    id="edit-author-2"
                    {...register('author')}
                    type="text"
                    placeholder="作者名称"
                    className="input-primary w-full"
                    autoComplete="name"
                  />
                  <p className="text-xs text-gray-500">
                    提示词作者信息，可选填写
                  </p>
                </div>
              </motion.div>

              {/* 描述 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="space-y-2"
              >
                <label htmlFor="edit-description" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                  <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  描述 *
                </label>
                <textarea
                  id="edit-description"
                  {...register('description', { required: '请输入描述' })}
                  rows={3}
                  placeholder="简要描述您的提示词的用途和特点..."
                  className="input-primary w-full resize-none"
                  autoComplete="off"
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
                <label htmlFor="edit-variable-input" className="flex items-center text-sm font-medium text-gray-300">
                  <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                  输入变量
                </label>
                
                {/* 添加变量 */}
                <div className="flex space-x-3">
                  <input
                    id="edit-variable-input"
                    name="edit-variable-input"
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="输入变量名"
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                    autoComplete="off"
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
                <label htmlFor="edit-tag-input" className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
                  标签
                </label>
                
                {/* 添加标签 */}
                <div className="flex space-x-3">
                  <input
                    id="edit-tag-input"
                    name="edit-tag-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签"
                    className="input-primary flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    autoComplete="off"
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

                {/* 已选标签 */}
                <AnimatePresence>
                  {tags.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-xs text-gray-500">已选标签：</p>
                      <div className="flex flex-wrap gap-2">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
              </motion.div>

              {/* 兼容模型 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0 }}
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
                transition={{ delay: 2.1 }}
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
                <div className="flex flex-col items-end">
                  <label htmlFor="edit-is-public" className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="edit-is-public"
                      type="checkbox" 
                      className="sr-only peer" 
                      {...register('is_public')} 
                      defaultChecked={safePromptData.is_public}
                      disabled={!checkFieldPermission('is_public', permissionCheck)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-cyan rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
                  </label>
                  {!checkFieldPermission('is_public', permissionCheck) && (
                    <div className="text-xs text-neon-orange mt-1">
                      您没有权限修改公开/私有设置
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 可见性和权限设置 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="space-y-4"
              >
                <label className="flex items-center text-sm font-medium text-gray-300">
                  <ShieldExclamationIcon className="h-5 w-5 text-neon-purple mr-2" />
                  协作设置
                </label>
                
                <div className="relative flex items-start p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                  <div className="flex items-center h-5">
                    <input
                      id="edit-allow-collaboration"
                      name="edit-allow-collaboration"
                      type="checkbox"
                      checked={watch('allow_collaboration') || false}
                      onChange={(e) => setValue('allow_collaboration', e.target.checked)}
                      className="h-4 w-4 text-neon-cyan border-gray-600 rounded focus:ring-neon-cyan"
                      disabled={!checkFieldPermission('allow_collaboration', permissionCheck)}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="edit-allow-collaboration" className="text-sm font-medium text-gray-300">
                      允许协作编辑
                    </label>
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
                  <label htmlFor="edit-permission" className="block text-sm font-medium text-gray-300 mb-2">
                    编辑权限级别
                  </label>
                  <select
                    id="edit-permission"
                    name="edit-permission"
                    value={watch('edit_permission') || PERMISSION_LEVELS.OWNER_ONLY}
                    onChange={(e) => setValue('edit_permission', e.target.value as any)}
                    className="input-primary w-full"
                    disabled={!checkFieldPermission('edit_permission', permissionCheck)}
                    autoComplete="off"
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
                transition={{ delay: 2.4 }}
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
                      <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
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
          
          {/* 智能写作助手侧边栏 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="hidden xl:block glass rounded-3xl border border-neon-purple/20 shadow-2xl p-6"
          >
            <SmartWritingAssistant
              content={currentContent || watch('content') || ''}
              onContentChange={(newContent) => {
                setValue('content', newContent);
                setCurrentContent(newContent);
              }}
              onAnalysisComplete={(result) => {
                // 仅显示分析结果，不自动应用，需要用户手动点击应用按钮
                console.log('收到智能分析结果，等待用户手动应用:', result);
              }}
              onApplyAnalysisResults={applyAIResults}
              category={watch('category')}
              tags={tags}
              className="h-full"
            />
          </motion.div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditPromptPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  try {
    console.log(`[Edit getServerSideProps] 获取提示词详情，ID: ${id}`);

    // 在服务端直接使用数据库服务，避免HTTP调用
    // 注意：getPromptByName 方法实际上支持通过ID或name查找
    const prompt = await databaseService.getPromptByName(id as string);

    if (!prompt) {
      console.log(`[Edit getServerSideProps] 未找到提示词，ID: ${id}`);
      return {
        notFound: true,
      };
    }

    console.log(`[Edit getServerSideProps] 成功获取提示词: ${prompt.name} (ID: ${prompt.id})`);

    return {
      props: {
        prompt: prompt,
      },
    };
  } catch (error) {
    console.error(`[Edit getServerSideProps] 获取提示词详情失败，ID: ${id}`, error);

    return {
      notFound: true,
    };
  }
};