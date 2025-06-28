import * as React from 'react';
import { useState, useEffect } from 'react';
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
  CpuChipIcon,
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
  PERMISSION_LEVEL_DESCRIPTIONS,
} from '@/lib/permissions';
import {
  validateVersionFormat,
  canIncrementVersion,
  suggestNextVersion,
  formatVersionFromInt,
  parseVersionToInt,
  getVersionValidationMessage,
  formatVersionDisplay,
} from '@/lib/version-utils';
// @ts-ignore
import { pinyin } from 'pinyin-pro';
import { ModelSelector } from '@/components/ModelSelector';
import SmartWritingAssistant from '@/components/SmartWritingAssistant';
import PromptTypeSelector, { PromptType } from '@/components/prompts/edit/PromptTypeSelector';
import PromptEditForm, { PromptEditFormData } from '@/components/prompts/edit/PromptEditForm';

type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  is_public?: boolean;
  version?: string | number; // 允许版本字段为字符串或数字
};

interface EditPromptPageProps {
  prompt: PromptDetails;
}

function EditPromptPage({ prompt }: EditPromptPageProps) {
  const router = useRouter();
  const { user, getToken } = useAuth();

  // withAuth HOC已经处理了认证保护，这里不需要额外的认证检查
  
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
      'technology': '科技',
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

  // 添加类型相关状态
  const [categoryType, setCategoryType] = useState<'chat' | 'image' | 'video' | 'multimodal'>('chat');
  const [categoriesByType, setCategoriesByType] = useState<Record<string, string[]>>({
    chat: [],
    image: [],
    video: [],
    multimodal: []
  });
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



  // 检测提示词类型 - 根据新的分类方案更新
  const detectCategoryType = (content: string): 'chat' | 'image' | 'video' | 'multimodal' => {
    const lowerContent = content.toLowerCase();

    // 多模态关键词（优先级最高）
    const multimodalKeywords = [
      '多模态', '视觉问答', '图文', '看图', '分析图片', '描述图像', '图像问答',
      'multimodal', 'visual question', 'vqa', 'image analysis', 'describe image'
    ];

    // 视频生成关键词
    const videoKeywords = [
      '视频', '动画', '镜头', '运动', '帧', '时长', '播放', '拍摄', '剪辑', '特效',
      'video', 'animation', 'motion', 'camera', 'frame', 'fps', 'duration', 'editing'
    ];

    // 图像生成关键词
    const imageKeywords = [
      '画', '绘制', '绘画', '图像', '图片', '照片', '摄影', '设计', '风格', '生成图片',
      'style', 'draw', 'paint', 'image', 'photo', 'picture', 'art', 'design', 'generate image'
    ];

    // 对话模型关键词（包含各种文本处理任务）
    const chatKeywords = [
      '对话', '聊天', '问答', '翻译', '摘要', '分析', '写作', '创作', '代码', '编程',
      'chat', 'conversation', 'translate', 'summary', 'analysis', 'writing', 'code'
    ];

    const hasMultimodalKeywords = multimodalKeywords.some(keyword => lowerContent.includes(keyword));
    const hasVideoKeywords = videoKeywords.some(keyword => lowerContent.includes(keyword));
    const hasImageKeywords = imageKeywords.some(keyword => lowerContent.includes(keyword));

    if (hasMultimodalKeywords) return 'multimodal';
    if (hasVideoKeywords) return 'video';
    if (hasImageKeywords) return 'image';
    return 'chat';
  };

  // 获取分类数据 - 按类型分别获取
  useEffect(() => {
    const fetchCategoriesByType = async () => {
      setCategoriesLoading(true);
      try {
        console.log('开始获取类别数据...');

        // 分别获取三种类型的分类
        const [chatCategories, imageCategories, videoCategories] = await Promise.all([
          getCategories('chat'),
          getCategories('image'),
          getCategories('video')
        ]);

        console.log('获取到的分类数据:', {
          chat: chatCategories,
          image: imageCategories,
          video: videoCategories
        });

        // 设置按类型分组的分类
        const categoriesByTypeData = {
          chat: chatCategories || [],
          image: imageCategories || [],
          video: videoCategories || []
        };
        setCategoriesByType(categoriesByTypeData);

        // 设置所有分类（用于向后兼容）
        const allCategories = [...(chatCategories || []), ...(imageCategories || []), ...(videoCategories || [])];
        setCategories(allCategories);

        // 优先使用提示词已有的category_type，如果没有则通过内容检测
        let initialType: 'chat' | 'image' | 'video' | 'multimodal' = 'chat';
        if (safePromptData.category_type && ['chat', 'image', 'video', 'multimodal'].includes(safePromptData.category_type)) {
          initialType = safePromptData.category_type as 'chat' | 'image' | 'video' | 'multimodal';
        } else {
          // 如果没有category_type字段，则通过内容检测
          initialType = detectCategoryType(safePromptData.content);
        }
        setCategoryType(initialType);

      } catch (err) {
        console.error('获取分类失败:', err);
        // 错误时设置空数组
        setCategoriesByType({ chat: [], image: [], video: [], multimodal: [] });
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoriesByType();
  }, []);
  
  // 获取标签数据
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        if (data && Array.isArray(data)) {
          setSuggestedTags(data as string[]);
        }
      } catch (err) {
        console.error('获取标签失败:', err);
        setSuggestedTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // 处理类型变化
  const handleTypeChange = (newType: PromptType) => {
    if (newType !== categoryType) {
      setCategoryType(newType as any);

      // 重置分类选择
      setValue('category', '');

      // 如果有可用分类，设置第一个作为默认值
      const availableCategories = categoriesByType[newType] || [];
      if (availableCategories.length > 0) {
        setValue('category', availableCategories[0]);
      }
    }
  };

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
    },
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
    if (!categoriesLoading && Array.isArray(categories) && categories.length > 0) {
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
          matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
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
    
    if (!content || typeof content !== 'string') return;
    
    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      const detectedVars = Array.from(new Set(
        matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
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
      currentVersion: undefined, // 不再使用当前版本比较
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
      AI建议标签: data.tags,
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
        最终应用: data.tags, 
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
        最终应用: data.variables, 
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
        最终应用: data.compatibleModels, 
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
        其他数据: { ...data, content: data.content?.substring(0, 100) + '...' },
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
    } catch (error: unknown) {
      console.error('更新提示词失败:', error);
      alert(`❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 新表单提交处理
  const handleNewFormSubmit = async (data: PromptEditFormData) => {
    // 再次检查权限
    if (!permissionCheck?.canEdit) {
      alert('您没有编辑此提示词的权限');
      return;
    }

    setIsSubmitting(true);

    try {
      // 转换新表单数据为旧格式
      const formData: PromptFormData = {
        name: data.name,
        description: data.description,
        content: data.content,
        category: data.category,
        tags: data.tags,
        input_variables: data.input_variables,
        compatible_models: data.compatible_models,
        version: data.version,
        author: data.author,
        template_format: data.template_format,
        is_public: data.is_public,
        allow_collaboration: data.allow_collaboration,
        edit_permission: data.edit_permission,
      };

      // 确保版本号是整数格式（后端需要）
      const versionInt = typeof formData.version === 'number'
        ? formData.version
        : parseVersionToInt(String(formData.version));

      formData.version = versionInt;

      console.log('新表单提交的数据:', {
        原始版本: formData.version,
        处理后版本: versionInt,
        类型: data.category_type,
        预览资源: data.preview_assets?.length || 0,
        图像参数: data.image_parameters,
        视频参数: data.video_parameters,
        其他数据: { ...formData, content: formData.content?.substring(0, 100) + '...' },
      });

      // 获取token
      let token = undefined;
      if (typeof window !== 'undefined' && user && typeof user === 'object') {
        if (typeof getToken === 'function') {
          token = await getToken();
        }
      }

      const result = await updatePrompt(prompt.id, formData);

      setSaveSuccess(true);
      setHasUnsavedChanges(false);

      // 保存成功后直接跳转回详情页面
      router.push(`/prompts/${prompt.id}`);
    } catch (error: unknown) {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center"
          >
            <motion.h1
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              编辑提示词
            </motion.h1>
            <motion.p
              className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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

          {/* 提示词类型选择 - 居中显示在双栏布局之前 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-dark-bg-secondary/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-lg">
              <PromptTypeSelector
                value={categoryType as any}
                onChange={handleTypeChange}
                disabled={isSubmitting}
              />
            </div>
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
              {/* 新版组件化表单 */}
              <PromptEditForm
                initialData={{
                  ...prompt,
                  content: prompt.content || prompt.messages?.[0]?.content || '',
                  category_type: categoryType as any,
                }}
                onSubmit={handleNewFormSubmit}
                onCancel={() => router.push(`/prompts/${prompt.id}`)}
                isSubmitting={isSubmitting}
                categoriesByType={categoriesByType}
              />
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
  } catch (error: unknown) {
    console.error(`[Edit getServerSideProps] 获取提示词详情失败，ID: ${id}`, error);

    return {
      notFound: true,
    };
  }
};