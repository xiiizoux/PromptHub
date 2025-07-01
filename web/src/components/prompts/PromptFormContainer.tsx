import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  PlusCircleIcon, 
  ChevronLeftIcon,
  PhotoIcon,
  XMarkIcon,
  DocumentTextIcon,
  TagIcon,
  UserIcon,
  CogIcon,
  CpuChipIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';
import SmartWritingAssistant from '@/components/SmartWritingAssistant';
import PromptTypeSelector, { PromptType } from '@/components/prompts/edit/PromptTypeSelector';
import CategorySelector from '@/components/prompts/edit/CategorySelector';
import ImageParametersForm, { ImageParameters } from '@/components/prompts/edit/ImageParametersForm';
import VideoParametersForm, { VideoParameters } from '@/components/prompts/edit/VideoParametersForm';
import { ModelSelector } from '@/components/ModelSelector';
import { PromptDetails } from '@/types';
import { 
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_DESCRIPTIONS,
  SIMPLE_PERMISSIONS,
  SIMPLE_PERMISSION_DESCRIPTIONS,
  SIMPLE_PERMISSION_DETAILS,
  SimplePermissionType,
  convertSimplePermissionToFields,
  inferSimplePermission,
} from '@/lib/permissions';
import { PermissionCheck } from '@/types';
import PermissionPreview from '@/components/prompts/PermissionPreview';

// 文件接口
interface AssetFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

// 表单数据接口
export interface PromptFormData {
  name: string;
  description: string;
  content: string;
  category_type: PromptType;
  category: string;
  tags: string[];
  author: string;
  is_public: boolean;
  allow_collaboration: boolean;
  edit_permission: 'owner_only' | 'collaborators' | 'public';
  simple_permission: SimplePermissionType; // 新增：简化权限字段
  collaborators: string[]; // 协作者列表
  compatible_models: string[];
  input_variables: string[];
  template_format: string;
  version: string | number;
  // 媒体相关字段
  preview_assets?: AssetFile[];
  preview_asset_url?: string;
  parameters?: Record<string, any>;
}

// 组件属性接口
interface PromptFormContainerProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PromptDetails>;
  onSubmit: (data: PromptFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  categoriesByType: Record<string, string[]>;
  backLink?: {
    href: string;
    label: string;
  };
  pageTitle: string;
  pageSubtitle: string;
  submitButtonText: string;
  permissionCheck?: PermissionCheck | null;
  hasUnsavedChanges?: boolean;
  saveSuccess?: boolean;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

export default function PromptFormContainer({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  categoriesByType,
  backLink,
  pageTitle,
  pageSubtitle,
  submitButtonText,
  permissionCheck,
  hasUnsavedChanges = false,
  saveSuccess = false,
  onUnsavedChanges,
}: PromptFormContainerProps) {
  const { user } = useAuth();
  const router = useRouter();

  // 根据类型获取默认参数模板
  const getDefaultParameters = (type: PromptType) => {
    switch (type) {
      case 'image':
        return {
          style: 'photorealistic',
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          quality: 'high',
        };
      case 'video':
        return {
          duration: 10,
          fps: 30,
          motion_strength: 5,
          camera_movement: 'static',
        };
      default:
        return {};
    }
  };

  // 表单状态
  const [currentType, setCurrentType] = useState<PromptType>(
    (initialData?.category_type as PromptType) || 'chat',
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  
  // 初始化状态 - 用于防止在数据加载期间误报未保存状态
  const [isInitialized, setIsInitialized] = useState(mode === 'create');

  // 只保留必要的本地状态 - 输入框状态
  const [variableInput, setVariableInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // AI相关状态
  const [currentContent, setCurrentContent] = useState(initialData?.content || '');
  const [showMobileAssistant, setShowMobileAssistant] = useState(false);

  // 表单控制
  // 从初始数据推断简化权限，默认为公开只读
  const inferredSimplePermission = initialData ? inferSimplePermission(
    initialData?.is_public,
    initialData?.allow_collaboration,
    initialData?.edit_permission
  ) : 'public_read';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PromptFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      content: initialData?.content || '',
      category_type: currentType,
      category: initialData?.category || '',
      tags: initialData?.tags || [],
      author: initialData?.author || user?.display_name || user?.username || '',
      is_public: initialData?.is_public ?? true,
      allow_collaboration: initialData?.allow_collaboration ?? false,
      edit_permission: initialData?.edit_permission || 'owner_only',
      simple_permission: inferredSimplePermission, // 新增：简化权限默认值
      collaborators: initialData?.collaborators || [], // 协作者列表
      compatible_models: initialData?.compatible_models || [],
      input_variables: initialData?.input_variables || [],
      template_format: initialData?.template_format || 'text',
      version: initialData?.version || 1.0,
      parameters: initialData?.parameters || {},
    },
  });

  // 初始化现有媒体文件
  useEffect(() => {
    console.log('PromptFormContainer - useEffect 触发:', {
      mode,
      hasInitialData: !!initialData,
      hasParameters: !!initialData?.parameters,
      hasMediaFiles: !!initialData?.parameters?.media_files,
      mediaFilesLength: initialData?.parameters?.media_files?.length || 0,
      initialDataKeys: initialData ? Object.keys(initialData) : [],
    });

    if (mode === 'edit' && initialData?.parameters?.media_files && Array.isArray(initialData.parameters.media_files)) {
      const mediaFiles = initialData.parameters.media_files;
      const urls = mediaFiles.map((file: any) => file.url);
      setPreviewUrls(urls);

      // 设置预览资源URL
      if (urls.length > 0) {
        setValue('preview_asset_url', urls[0]);
      }

      // 为编辑模式创建虚拟File对象，用于正确显示文件计数
      const virtualFiles = mediaFiles.map((file: any) => {
        // 创建一个虚拟File对象，包含必要的属性
        const virtualFile = new File([], file.name || 'unknown', {
          type: file.type || 'application/octet-stream',
        });
        // 添加size属性
        Object.defineProperty(virtualFile, 'size', {
          value: file.size || 0,
          writable: false,
        });
        return virtualFile;
      });
      setUploadedFiles(virtualFiles);

      console.log('PromptFormContainer - 加载现有媒体文件:', {
        mediaFilesCount: mediaFiles.length,
        urls: urls,
        virtualFilesCount: virtualFiles.length,
      });
    } else {
      console.log('PromptFormContainer - 未加载媒体文件，原因:', {
        isEditMode: mode === 'edit',
        hasParameters: !!initialData?.parameters,
        hasMediaFiles: !!initialData?.parameters?.media_files,
        isArray: Array.isArray(initialData?.parameters?.media_files),
      });
    }

    // 初始化参数
    if (initialData?.parameters) {
      setParameters(initialData.parameters);
      setValue('parameters', initialData.parameters);
      console.log('PromptFormContainer - 设置参数:', initialData.parameters);
    } else if (currentType === 'image' || currentType === 'video') {
      // 如果是图像或视频类型但没有参数，设置默认参数
      const defaultParams = getDefaultParameters(currentType);
      setParameters(defaultParams);
      setValue('parameters', defaultParams);
    }

    // 标记初始化完成 - 延迟一点确保所有setValue都完成
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [initialData, mode, setValue, currentType]);

  // 工具函数：安全的数组比较
  const arraysEqual = (a: any[], b: any[]): boolean => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  // 工具函数：深度比较对象
  const objectsEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (!a || !b) return a === b;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => {
      const valueA = a[key];
      const valueB = b[key];
      
      if (Array.isArray(valueA) && Array.isArray(valueB)) {
        return arraysEqual(valueA, valueB);
      }
      
      return valueA === valueB;
    });
  };

  // 监听简化权限变化，自动更新原有三个权限字段
  const watchedSimplePermission = watch('simple_permission');
  useEffect(() => {
    if (watchedSimplePermission) {
      const fields = convertSimplePermissionToFields(watchedSimplePermission);
      setValue('is_public', fields.is_public, { shouldValidate: false });
      setValue('allow_collaboration', fields.allow_collaboration, { shouldValidate: false });
      setValue('edit_permission', fields.edit_permission, { shouldValidate: false });
    }
  }, [watchedSimplePermission, setValue]);

  // 监听表单变化，检测是否有未保存的更改
  const watchedData = watch();
  useEffect(() => {
    if (!onUnsavedChanges) return;

    // 只有在初始化完成后才开始检测未保存状态
    if (!isInitialized) {
      onUnsavedChanges(false);
      return;
    }

    let hasChanges = false;

    if (mode === 'edit') {
      // 编辑模式：比较当前表单数据与初始数据
      hasChanges = 
        watchedData.name !== (initialData?.name || '') ||
        watchedData.description !== (initialData?.description || '') ||
        watchedData.content !== (initialData?.content || '') ||
        watchedData.category !== (initialData?.category || '') ||
        watchedData.version !== (initialData?.version || 1.0) ||
        !arraysEqual(watchedData.tags || [], initialData?.tags || []) ||
        !arraysEqual(watchedData.compatible_models || [], initialData?.compatible_models || []) ||
        !arraysEqual(watchedData.input_variables || [], initialData?.input_variables || []) ||
        watchedData.category_type !== (initialData?.category_type || 'chat') ||
        watchedData.is_public !== (initialData?.is_public ?? true) ||
        watchedData.allow_collaboration !== (initialData?.allow_collaboration ?? false) ||
        !objectsEqual(watchedData.parameters || {}, initialData?.parameters || {}) ||
        uploadedFiles.length > 0; // 编辑模式下如果有新上传的文件也算作更改
    } else if (mode === 'create') {
      // 创建模式：检测是否有任何输入（包括空格）
      hasChanges = 
        (watchedData.name && watchedData.name !== '') ||
        (watchedData.description && watchedData.description !== '') ||
        (watchedData.content && watchedData.content !== '') ||
        (watchedData.category && watchedData.category !== '' && watchedData.category !== '通用') ||
        (watchedData.tags && watchedData.tags.length > 0) ||
        (watchedData.compatible_models && watchedData.compatible_models.length > 0) ||
        (watchedData.input_variables && watchedData.input_variables.length > 0) ||
        (watchedData.version && watchedData.version !== 1.0 && watchedData.version !== '1.0') ||
        (watchedData.parameters && Object.keys(watchedData.parameters).some(key => {
          const value = (watchedData.parameters as Record<string, any>)?.[key];
          return value !== null && value !== undefined && value !== '' && value !== false;
        })) ||
        uploadedFiles.length > 0;
    }

    // 调试信息 - 仅在开发环境输出
    if (process.env.NODE_ENV === 'development') {
      console.log('未保存状态检测:', {
        mode,
        hasChanges,
        isInitialized,
        current: {
          name: watchedData.name,
          description: watchedData.description,
          content: watchedData.content,
          version: watchedData.version,
          category: watchedData.category,
          tagsLength: watchedData.tags?.length || 0,
        },
        initial: mode === 'edit' ? {
          name: initialData?.name || '',
          description: initialData?.description || '',
          content: initialData?.content || '',
          version: initialData?.version || 1.0,
          category: initialData?.category || '',
          tagsLength: initialData?.tags?.length || 0,
        } : null,
        uploadedFilesCount: uploadedFiles.length,
      });
    }

    onUnsavedChanges(hasChanges);
  }, [watchedData, initialData, uploadedFiles, onUnsavedChanges, mode, isInitialized]);

  // 获取类型标签
  const getTypeLabel = (type: PromptType) => {
    const typeLabels = {
      chat: '对话',
      image: '图像',
      video: '视频',
    };
    return typeLabels[type];
  };

  // 检测提示词类型
  const detectCategoryType = (content: string): PromptType => {
    const lowerContent = content.toLowerCase();

    // 视频生成关键词
    const videoKeywords = [
      '视频', '动画', '镜头', '运动', '帧', '时长', '播放', '拍摄', '剪辑', '特效',
      'video', 'animation', 'motion', 'camera', 'frame', 'fps', 'duration', 'editing',
    ];

    // 图像生成关键词
    const imageKeywords = [
      '画', '绘制', '绘画', '图像', '图片', '照片', '摄影', '设计', '风格', '生成图片',
      'style', 'draw', 'paint', 'image', 'photo', 'picture', 'art', 'design', 'generate image',
    ];

    const hasVideoKeywords = videoKeywords.some(keyword => lowerContent.includes(keyword));
    const hasImageKeywords = imageKeywords.some(keyword => lowerContent.includes(keyword));

    if (hasVideoKeywords) return 'video';
    if (hasImageKeywords) return 'image';
    return 'chat';
  };

  // 处理类型变化
  const handleTypeChange = (newType: PromptType) => {
    if (newType !== currentType) {
      setCurrentType(newType);
      setValue('category_type', newType);
      
      // 重置相关字段
      setValue('category', '');
      setUploadedFiles([]);
      setPreviewUrls([]);
      
      // 根据类型设置默认参数
      const defaultParams = getDefaultParameters(newType);
      setParameters(defaultParams);
      setValue('parameters', defaultParams);
      
      // 重置分类选择，让用户主动选择
      // 不自动设置第一个分类，避免混淆用户
      
      if (newType === 'image' || newType === 'video') {
        toast.success(`切换到${getTypeLabel(newType)}生成模式`);
      }
    }
  };


  // 文件上传处理 - 支持多文件
  const handleFilesUpload = async (files: File[]) => {
    if (uploadedFiles.length + files.length > 4) {
      toast.error('最多只能上传4个文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 获取认证token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('用户未登录，请先登录后再上传文件');
      }

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`文件 ${file.name} 上传失败`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || `文件 ${file.name} 上传失败`);
        }

        return result.data.url;
      });

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 更新状态
      setUploadedFiles(prev => [...prev, ...files]);
      setPreviewUrls(prev => [...prev, ...uploadedUrls]);
      
      // 更新表单值（使用第一个URL作为主要预览）
      if (uploadedUrls.length > 0) {
        setValue('preview_asset_url', uploadedUrls[0]);
      }
      
      toast.success(`成功上传${files.length}个文件`);
    } catch (error) {
      console.error('文件上传错误:', error);
      toast.error(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除文件
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    setUploadedFiles(newFiles);
    setPreviewUrls(newUrls);
    
    // 更新表单值
    if (newUrls.length > 0) {
      setValue('preview_asset_url', newUrls[0]);
    } else {
      setValue('preview_asset_url', '');
    }
  };

  // 自动检测变量 - 增强版，同时更新内容状态
  const detectVariables = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    // 实时更新内容状态以确保AI按钮能够监听到变化
    setCurrentContent(content);
    
    // 检测提示词类型并更新相关状态（仅创建模式）
    if (mode === 'create' && content) {
      const detectedType = detectCategoryType(content);
      if (detectedType !== currentType) {
        handleTypeChange(detectedType);
      }
    }
    
    if (!content || typeof content !== 'string') return;
    
    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    
    if (matches) {
      const detectedVars = Array.from(new Set(
        matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
      )).filter(variable => variable.length > 0);
      
      if (detectedVars.length > 0) {
        const currentVariables = watch('input_variables') || [];
        const newVariables = Array.from(new Set([...currentVariables, ...detectedVars]));
        setValue('input_variables', newVariables);
      }
    }
  };

  // 添加变量
  const addVariable = () => {
    const currentVariables = watch('input_variables') || [];
    if (variableInput && !currentVariables.includes(variableInput)) {
      const newVariables = [...currentVariables, variableInput];
      setValue('input_variables', newVariables);
      setVariableInput('');
    }
  };

  // 删除变量
  const removeVariable = (variable: string) => {
    const currentVariables = watch('input_variables') || [];
    const newVariables = currentVariables.filter(v => v !== variable);
    setValue('input_variables', newVariables);
  };

  // 添加标签
  const addTag = () => {
    const currentTags = watch('tags') || [];
    if (tagInput && !currentTags.includes(tagInput)) {
      const newTags = [...currentTags, tagInput];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    const currentTags = watch('tags') || [];
    const newTags = currentTags.filter(t => t !== tag);
    setValue('tags', newTags);
  };

  // 切换模型选择
  const handleModelChange = (models: string[]) => {
    setValue('compatible_models', models);
  };

  // 监听content字段变化，更新AI助手的内容状态
  useEffect(() => {
    setCurrentContent(watchedData.content || '');
  }, [watchedData.content]);

  // 表单提交处理
  const onFormSubmit = async (data: PromptFormData) => {
    // 基础输入验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      toast.error('提示词名称不能为空');
      return;
    }
    
    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
      toast.error('提示词内容不能为空');
      return;
    }
    
    if (data.name.trim().length > 100) {
      toast.error('提示词名称不能超过100个字符');
      return;
    }

    // 检查图片和视频类型是否上传了文件
    if ((currentType === 'image' || currentType === 'video') && uploadedFiles.length === 0) {
      toast.error(`${getTypeLabel(currentType)}类型的提示词至少需要上传一个文件`);
      return;
    }

    // 构建完整的数据对象
    const formData: PromptFormData = {
      ...data,
      category_type: currentType,
      preview_asset_url: previewUrls.length > 0 ? previewUrls[0] : '',
      preview_assets: previewUrls.map((url, index) => ({
        id: `${Date.now()}-${index}`,
        url,
        name: uploadedFiles[index]?.name || `file-${index}`,
        size: uploadedFiles[index]?.size || 0,
        type: uploadedFiles[index]?.type || '',
      })),
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
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

      <div className="relative z-10 unified-page-spacing">
        <div className="container-custom">
          {/* 返回按钮 */}
          {backLink && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <Link
                href={backLink.href}
                className="inline-flex items-center text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                {backLink.label}
              </Link>
            </motion.div>
          )}

          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="unified-page-title-container"
          >
            <motion.div
              className="flex items-center justify-center mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className={`inline-flex p-2 rounded-xl mr-2 ${
                mode === 'create' 
                  ? 'bg-gradient-to-br from-neon-cyan to-neon-blue' 
                  : 'bg-gradient-to-br from-neon-purple to-neon-pink'
              }`}>
                {mode === 'create' ? (
                  <PlusCircleIcon className="unified-page-title-icon" />
                ) : (
                  <SparklesIcon className="unified-page-title-icon" />
                )}
              </div>
              <h1 className="unified-page-title">
                {pageTitle}
              </h1>
            </motion.div>
            <motion.p
              className="unified-page-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {pageSubtitle}
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
                      console.log('收到智能分析结果，等待用户手动应用:', result);
                    }}
                    onApplyAnalysisResults={(data) => {
                      // 应用AI分析结果的逻辑
                      console.log('应用AI分析结果:', data);
                    }}
                    category={watch('category')}
                    tags={watch('tags') || []}
                    className="max-h-96 overflow-y-auto"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 提示词类型选择 - 仅在创建模式下显示 */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="bg-dark-bg-secondary/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-lg">
                <PromptTypeSelector
                  value={currentType}
                  onChange={handleTypeChange}
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>
          )}

          {/* 双栏布局容器 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 主表单区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-2 glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
            >
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
                {/* 提示词内容 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="content" className="flex items-center text-lg font-semibold text-gray-200">
                      <DocumentTextIcon className="h-6 w-6 text-neon-cyan mr-3" />
                      提示词内容 *
                      <span className="ml-2 text-sm font-normal text-gray-400">核心内容区域</span>
                    </label>

                    <div className="text-sm text-gray-400">
                      💡 使用右侧智能助手进行分析和优化
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      id="content"
                      {...register('content', { required: '请输入提示词内容' })}
                      rows={12}
                      placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
                      className="input-primary w-full font-mono text-sm resize-none"
                      onChange={detectVariables}
                      disabled={isSubmitting}
                    />
                    
                    <div className="absolute top-3 right-3 text-xs text-gray-500">
                      使用 {'{{变量名}}'} 定义变量
                    </div>
                  </div>
                  
                  {errors.content && (
                    <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                  )}
                </motion.div>

                {/* 文件上传区域 - 在提示词内容下面 */}
                <AnimatePresence>
                  {(currentType === 'image' || currentType === 'video') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: 0.15 }}
                      className="space-y-4"
                    >
                      <label className="flex items-center text-base font-medium text-gray-200">
                        <PhotoIcon className="h-4 w-4 text-neon-purple mr-2" />
                        {getTypeLabel(currentType) === '图像' ? '示例图片' : '示例视频'} ({uploadedFiles.length}/4)*
                      </label>

                      {/* 文件上传区域 */}
                      <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-neon-cyan/50 transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept={currentType === 'image' ? 'image/*' : 'video/*'}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            handleFilesUpload(files);
                          }}
                          className="hidden"
                          disabled={isSubmitting}
                        />

                        {isUploading ? (
                          <div className="space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
                            <p className="text-gray-400">正在上传文件...</p>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-neon-cyan h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-500">{uploadProgress}%</p>
                          </div>
                        ) : uploadedFiles.length > 0 ? (
                          <div className="space-y-4">
                            {/* 文件预览网格 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {previewUrls.map((url, index) => (
                                <div key={index} className="relative group bg-dark-bg-secondary rounded-lg overflow-hidden border border-gray-600">
                                  <div className="aspect-video">
                                    {currentType === 'image' ? (
                                      <img
                                        src={url}
                                        alt={`预览 ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <video
                                        src={url}
                                        className="w-full h-full object-cover"
                                        controls
                                        preload="metadata"
                                      />
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <p className="text-sm font-medium text-gray-200 truncate" title={uploadedFiles[index]?.name}>
                                      {uploadedFiles[index]?.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {uploadedFiles[index]?.size ? Math.round(uploadedFiles[index].size / 1024) + ' KB' : ''}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="删除文件"
                                    disabled={isSubmitting}
                                  >
                                    <XMarkIcon className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            {/* 添加更多文件按钮 */}
                            {uploadedFiles.length < 4 && (
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('file-upload')?.click()}
                                  className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
                                  disabled={isSubmitting}
                                >
                                  添加更多文件
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-4xl text-gray-400">
                              {currentType === 'image' ? '🖼️' : '🎬'}
                            </div>
                            <div>
                              <p className="text-gray-300 mb-2">
                                拖拽文件到此处或点击上传{getTypeLabel(currentType)}
                              </p>
                              <p className="text-sm text-gray-500">
                                支持 {currentType === 'image' ? 'JPG, PNG, WebP, GIF' : 'MP4, WebM, MOV, AVI'} 格式
                              </p>
                              <p className="text-sm text-gray-500">
                                单个文件最大 {currentType === 'image' ? '10MB' : '100MB'}，最多上传 4 个文件
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-white rounded-lg font-medium hover:from-neon-cyan-dark hover:to-neon-blue-dark transition-all"
                              disabled={isSubmitting}
                            >
                              选择{getTypeLabel(currentType)}文件
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 生成参数设置（仅图像和视频类型） */}
                {(currentType === 'image' || currentType === 'video') && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-8"
                  >
                    <div className="glass rounded-xl p-8 border border-neon-cyan/20">
                      <div className="flex items-center mb-6">
                        <CogIcon className="h-6 w-6 text-neon-yellow mr-3" />
                        <h3 className="text-xl font-semibold text-white">
                          生成参数设置
                        </h3>
                        <span className="ml-2 text-sm text-gray-400">
                          ({currentType === 'image' ? '图像' : '视频'}类型)
                        </span>
                      </div>
                      
                      <Controller
                        name="parameters"
                        control={control}
                        render={({ field }) => {
                          if (currentType === 'image') {
                            return (
                              <ImageParametersForm
                                value={field.value as ImageParameters || {}}
                                onChange={(parameters) => {
                                  field.onChange(parameters);
                                }}
                                disabled={isSubmitting}
                              />
                            );
                          } else if (currentType === 'video') {
                            return (
                              <VideoParametersForm
                                value={field.value as VideoParameters || {}}
                                onChange={(parameters) => {
                                  field.onChange(parameters);
                                }}
                                disabled={isSubmitting}
                              />
                            );
                          }
                          return <div></div>;
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* 基本信息 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* 标题 */}
                  <div className="space-y-2">
                    <label htmlFor="prompt-name" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                      <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                      提示词名称 *
                    </label>
                    <input
                      id="prompt-name"
                      {...register('name', { required: '请输入提示词名称' })}
                      type="text"
                      placeholder="为您的提示词起个响亮的名字"
                      className="input-primary w-full"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* 作者 */}
                  <div className="space-y-2">
                    <label htmlFor="author" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                      <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                      作者
                    </label>
                    <input
                      id="author"
                      {...register('author')}
                      type="text"
                      className="input-primary w-full bg-gray-800 text-gray-400 cursor-not-allowed"
                      disabled={true}
                      readOnly
                      title={mode === 'create' ? '创建提示词时，作者自动设置为当前登录用户' : '创作者不可更改'}
                    />
                    <p className="text-xs text-gray-500">
                      {mode === 'create' ? '创建提示词时，作者自动设置为当前登录用户' : '创作者不可更改'}
                    </p>
                  </div>
                </motion.div>

                {/* 分类和版本 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* 分类选择 */}
                  <div className="space-y-2">
                    <Controller
                      name="category"
                      control={control}
                      rules={{ required: '请选择分类' }}
                      render={({ field }) => (
                        <CategorySelector
                          promptType={currentType}
                          value={field.value}
                          onChange={(category) => {
                            field.onChange(category);
                          }}
                          categoriesByType={categoriesByType}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    {errors.category && (
                      <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  {/* 版本 */}
                  <div className="space-y-2">
                    <label htmlFor="version" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                      <CogIcon className="h-5 w-5 text-neon-purple mr-2" />
                      版本
                    </label>
                    <input
                      id="version"
                      {...register('version')}
                      type="text"
                      className="input-primary w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                </motion.div>

                {/* 描述 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    描述 *
                  </label>
                  <textarea
                    id="description"
                    {...register('description', { required: '请输入描述' })}
                    rows={3}
                    placeholder="简要描述您的提示词的用途和特点..."
                    className="input-primary w-full resize-none"
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="text-neon-red text-sm mt-1">{errors.description.message}</p>
                  )}
                </motion.div>

                {/* 变量管理 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
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
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                      disabled={isSubmitting}
                    />
                    <motion.button
                      type="button"
                      onClick={addVariable}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {(watch('input_variables') || []).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                      >
                        {(watch('input_variables') || []).map((variable: string) => (
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
                              disabled={isSubmitting}
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
                  transition={{ delay: 0.6 }}
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
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      disabled={isSubmitting}
                    />
                    <motion.button
                      type="button"
                      onClick={addTag}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {(watch('tags') || []).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                      >
                        {(watch('tags') || []).map((tag: string) => (
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
                              disabled={isSubmitting}
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
                  transition={{ delay: 0.7 }}
                  className="space-y-4"
                >
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <CpuChipIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    兼容模型
                  </label>
                  
                  <ModelSelector
                    selectedModels={watch('compatible_models') || []}
                    onChange={handleModelChange}
                    categoryType={currentType}
                    placeholder="选择或添加兼容的AI模型..."
                  />
                  
                  <p className="text-xs text-gray-500">
                    选择此提示词兼容的AI模型类型，支持文本、图像、音频、视频等多种模型
                  </p>
                </motion.div>

                {/* 简化权限设置 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-4"
                >
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <InformationCircleIcon className="h-5 w-5 text-neon-purple mr-2" />
                    访问权限
                  </label>
                  
                  {/* 权限选择器 */}
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(SIMPLE_PERMISSION_DETAILS).map(([key, details]) => (
                      <label 
                        key={key} 
                        className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                          watch('simple_permission') === key 
                            ? 'border-neon-cyan bg-neon-cyan/5' 
                            : 'border-gray-600 bg-dark-bg-secondary hover:border-neon-cyan/40'
                        }`}
                      >
                        <input
                          type="radio"
                          value={key}
                          {...register('simple_permission')}
                          className="sr-only"
                          disabled={isSubmitting}
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-2xl">{details.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-300">{details.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{details.description}</p>
                          </div>
                        </div>
                        {watch('simple_permission') === key && (
                          <div className="ml-3">
                            <CheckCircleIcon className="h-5 w-5 text-neon-cyan" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* 协作者管理 */}
                  {watch('simple_permission') === 'team_edit' && (
                    <div className="p-4 border border-neon-cyan/20 rounded-xl bg-dark-bg-secondary">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        协作者设置
                      </label>
                      <p className="text-xs text-gray-400 mb-3">
                        输入协作者的用户名，用逗号分隔。这些用户将获得编辑权限。
                      </p>
                      <Controller
                        name="collaborators"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="例如：user1, user2, user3"
                            className="input-primary w-full"
                            value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                            onChange={(e) => {
                              const collaborators = e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(s => s.length > 0);
                              field.onChange(collaborators);
                            }}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* 权限预览 */}
                  <PermissionPreview 
                    selectedPermission={watch('simple_permission')} 
                    collaborators={watch('collaborators') || []}
                    className="mt-4"
                  />
                </motion.div>

                {/* 提交按钮和状态信息 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex justify-between items-end pt-8"
                >
                  {/* 左侧状态信息 */}
                  <div className="flex flex-col space-y-1">
                    {/* 未保存更改提示 */}
                    {hasUnsavedChanges && (
                      <p className="text-xs text-yellow-400">
                        <span className="text-yellow-400">⚠</span> 有未保存的更改
                      </p>
                    )}

                    {/* 权限信息 */}
                    {permissionCheck && permissionCheck.canEdit && (
                      <p className="text-xs text-gray-500">
                        <span className="text-neon-cyan">✓</span> {permissionCheck.message}
                      </p>
                    )}

                    {/* 保存成功提示 */}
                    {saveSuccess && (
                      <p className="text-xs text-green-400">
                        <span className="text-green-400">✓</span> 提示词已成功更新！
                      </p>
                    )}
                  </div>

                  {/* 右侧提交按钮 */}
                  <div className="flex space-x-4">
                    {onCancel && (
                      <motion.button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                      >
                        取消
                      </motion.button>
                    )}
                    
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                          <span>{mode === 'create' ? '创建中...' : '更新中...'}</span>
                        </>
                      ) : (
                        <>
                          {mode === 'create' ? (
                            <PlusCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                          <span>{submitButtonText}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </form>
            </motion.div>
            
            {/* 智能写作助手侧边栏 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="hidden lg:block glass rounded-3xl border border-neon-purple/20 shadow-2xl p-6"
            >
              <SmartWritingAssistant
                content={currentContent || watch('content') || ''}
                onContentChange={(newContent) => {
                  setValue('content', newContent);
                  setCurrentContent(newContent);
                }}
                onAnalysisComplete={(result) => {
                  console.log('收到智能分析结果，等待用户手动应用:', result);
                }}
                onApplyAnalysisResults={(data) => {
                  // 应用AI分析结果的逻辑
                  console.log('应用AI分析结果:', data);
                }}
                category={watch('category')}
                tags={watch('tags') || []}
                className="h-full"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}