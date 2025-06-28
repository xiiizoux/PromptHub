import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import {
  PERMISSION_LEVELS,
  PERMISSION_LEVEL_DESCRIPTIONS,
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
  ShieldExclamationIcon,
  PhotoIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import { useAuth } from '@/contexts/AuthContext';
import { ModelSelector } from '@/components/ModelSelector';
import { formatVersionDisplay } from '@/lib/version-utils';
import { withAuth } from '@/contexts/AuthContext';
import SmartWritingAssistant from '@/components/SmartWritingAssistant';
import { toast } from 'react-hot-toast';
import PromptTypeSelector, { PromptType } from '@/components/prompts/edit/PromptTypeSelector';


// 扩展类型，添加媒体相关字段
type PromptFormData = Omit<PromptDetails, 'created_at' | 'updated_at'> & {
  messages?: Array<{role: string; content: string}>; // 添加messages字段
  allow_collaboration?: boolean;  // 添加allow_collaboration字段
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 添加edit_permission字段
  // 媒体相关字段
  category_type?: 'chat' | 'image' | 'video'; // 分类类型
  preview_asset_url?: string; // 预览资源URL
  parameters?: Record<string, any>; // 生成参数
  category_id?: string; // 分类ID
};

function CreatePromptPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableInput, setVariableInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  
  // 数据加载状态
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);

  // 媒体相关状态
  const [categoryType, setCategoryType] = useState<'chat' | 'image' | 'video'>('chat');
  const [currentType, setCurrentType] = useState<PromptType>('chat');
  const [categoriesByType, setCategoriesByType] = useState<Record<string, string[]>>({
    chat: [],
    image: [],
    video: []
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({});

  // 获取类型标签
  const getTypeLabel = (type: PromptType) => {
    const typeLabels = {
      chat: '对话',
      image: '图像',
      video: '视频'
    };
    return typeLabels[type];
  };

  // 获取激活状态的样式
  const getActiveStyles = (color: string) => {
    switch (color) {
      case 'neon-cyan':
        return 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-md';
      case 'neon-purple':
        return 'border-neon-purple bg-neon-purple/20 text-neon-purple shadow-md';
      case 'neon-pink':
        return 'border-neon-pink bg-neon-pink/20 text-neon-pink shadow-md';
      default:
        return 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-md';
    }
  };

  // 获取激活状态的圆点样式
  const getActiveDotStyles = (color: string) => {
    switch (color) {
      case 'neon-cyan':
        return 'bg-neon-cyan';
      case 'neon-purple':
        return 'bg-neon-purple';
      case 'neon-pink':
        return 'bg-neon-pink';
      default:
        return 'bg-neon-cyan';
    }
  };

  // 添加实时内容监听状态
  const [currentContent, setCurrentContent] = useState('');
  
  // 移动端智能助手显示状态
  const [showMobileAssistant, setShowMobileAssistant] = useState(false);
  
  // 待应用的AI分析结果
  const [pendingAIAnalysis, setPendingAIAnalysis] = useState<any | null>(null);

  // 用户状态检查
  const [userReady, setUserReady] = useState(false);

  // 表单管理 - 必须在使用 setValue 的 useEffect 之前定义
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PromptFormData>({
    defaultValues: {
      name: '',
      description: '',
      content: '',  // 会被转换为messages JSONB格式
      category: '通用对话', // 与数据库默认值保持一致
      version: 1.0,  // 默认版本1.0，支持小数格式
      is_public: true, // 默认公开，便于分享和发现
      allow_collaboration: true, // 默认允许协作编辑，鼓励社区协作
      edit_permission: 'owner_only', // 默认仅创建者可编辑
      template_format: 'text',
      input_variables: [],
      tags: [],
      compatible_models: [],
      // 媒体相关默认值
      category_type: 'chat',
      preview_asset_url: '',
      parameters: {},
      category_id: '',
    },
  });

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

  // 应用AI分析结果 - 增强功能，与编辑页面保持一致
  const applyAIResults = (data: Partial<AIAnalysisResult>) => {
    console.log('应用AI分析结果:', data);
    
    // 应用分类 - 确保正确应用AI建议的分类
    if (data.category) {
      const mapped = matchCategory(data.category, categories);
      if (mapped) {
        setValue('category', mapped);
        console.log(`AI分类应用: ${data.category} -> ${mapped}`);
      } else {
        // 如果匹配失败，检查分类是否在预设列表中
        if (categories.includes(data.category)) {
          setValue('category', data.category);
          console.log(`AI分类直接应用: ${data.category}`);
        } else {
          setValue('category', '通用');
          console.log(`AI分类无法匹配，使用默认分类: ${data.category} -> 通用`);
        }
      }
    }
    
    // 应用标签 - 直接应用AI建议的标签，与编辑页面保持一致
    if (data.tags && Array.isArray(data.tags)) {
      const currentTags = watch('tags') || [];
      setTags(data.tags);
      setValue('tags', data.tags);
      console.log('AI标签应用:', { 
        原有标签: currentTags, 
        AI建议标签: data.tags, 
        最终应用: data.tags, 
      });
    }
    
    // 应用变量 - 直接应用AI建议的变量，与编辑页面保持一致
    if (data.variables && Array.isArray(data.variables)) {
      const currentVariables = watch('input_variables') || [];
      setVariables(data.variables);
      setValue('input_variables', data.variables);
      console.log('AI变量应用:', { 
        原有变量: currentVariables, 
        AI建议变量: data.variables, 
        最终应用: data.variables, 
      });
    }
    
    // 应用兼容模型 - 直接应用AI建议的模型，与编辑页面保持一致
    if (data.compatibleModels && Array.isArray(data.compatibleModels)) {
      const currentModels = watch('compatible_models') || [];
      setModels(data.compatibleModels);
      setValue('compatible_models', data.compatibleModels);
      console.log('兼容模型应用:', { 
        原有模型: currentModels, 
        AI建议模型: data.compatibleModels, 
        最终应用: data.compatibleModels, 
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
    
    // 清除待应用的AI分析结果
    setPendingAIAnalysis(null);

    // 显示应用成功提示
    toast.success('AI分析建议已成功应用到表单中');
  };

  // 处理类型变化
  const handleTypeChange = (newType: PromptType) => {
    if (newType !== currentType) {
      setCurrentType(newType);
      setCategoryType(newType);
      setValue('category_type', newType);

      // 重置相关字段
      setValue('category', '');

      // 设置默认参数
      const defaultParams = getDefaultParameters(newType);
      setParameters(defaultParams);
      setValue('parameters', defaultParams);

      // 更新分类选项
      const availableCategories = categoriesByType[newType] || [];
      if (availableCategories.length > 0) {
        setValue('category', availableCategories[0]);
      }
    }
  };

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

  // 文件上传处理 - 支持多文件
  const handleFilesUpload = async (files: File[]) => {
    if (uploadedFiles.length + files.length > 4) {
      toast.error('最多只能上传4个文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.access_token || ''}`,
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

  // 更新参数
  const updateParameter = (key: string, value: any) => {
    const newParameters = { ...parameters, [key]: value };
    setParameters(newParameters);
    setValue('parameters', newParameters);
  };

  // 删除参数
  const removeParameter = (key: string) => {
    const newParameters = { ...parameters };
    delete newParameters[key];
    setParameters(newParameters);
    setValue('parameters', newParameters);
  };

  // 根据类型获取默认参数模板
  const getDefaultParameters = (type: 'chat' | 'image' | 'video') => {
    switch (type) {
      case 'image':
        return {
          style: 'photorealistic',
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          quality: 'high'
        };
      case 'video':
        return {
          duration: 10,
          fps: 30,
          motion_strength: 5,
          camera_movement: 'static'
        };
      default:
        return {};
    }
  };

  // 用户状态监听和检查
  useEffect(() => {
    // 如果还在加载认证状态，等待
    if (isLoading) {
      setUserReady(false);
      return;
    }

    // 如果用户已登录且信息完整，标记为准备就绪
    if (user) {
      console.log('用户认证状态确认:', {
        id: user.id,
        username: user.username,
        email: user.email
      });
      setUserReady(true);

      // 设置作者信息为当前登录用户（创建提示词时作者就是当前用户）
      const authorName = user.display_name || user.username || user.email?.split('@')[0] || '未知用户';
      setValue('author', authorName);
    } else {
      // 用户未登录，withAuth应该会处理重定向，但这里也做个标记
      setUserReady(false);
      console.log('用户未登录，等待认证处理...');
    }
  }, [user, isLoading, setValue]);

  // 添加处理URL参数的功能
  useEffect(() => {
    const handleURLParams = () => {
      const { query } = router;
      
      // 等待分类数据加载完成后再处理
      if (categoriesLoading) {
        console.log('等待分类数据加载完成...');
        return;
      }
      
      // 检查是否有来自优化器的内容
      if (query.optimizedContent) {
        const content = decodeURIComponent(query.optimizedContent as string);
        
        // 只在内容为空时才填充
        const currentContent = watch('content');
        if (!currentContent || currentContent.trim() === '') {
          setValue('content', content);
          setCurrentContent(content);
          console.log('填充优化后的内容');
        }
        
        // 移除硬编码的名称、描述和标签填充
        // 只有在有AI分析结果时才进行智能填充，否则保持页面默认状态
        
        // 处理AI分析结果 - 区分来源，智能决定是否自动应用
        if (query.aiAnalysisResult) {
          try {
            const analysisResult = JSON.parse(decodeURIComponent(query.aiAnalysisResult as string));
            console.log('接收到AI分析结果:', analysisResult);
            
            // 检查是否还有其他AI优化器相关的参数，如果有，说明来自AI优化器页面的手动应用
            const isFromOptimizerManualApply = !!(query.suggestedName || query.suggestedDesc);
            
            if (isFromOptimizerManualApply) {
              // 来自AI优化器页面的手动应用，直接自动填充（用户已经在优化器页面确认过了）
              console.log('来自AI优化器页面的手动应用，自动填充分析结果');
              applyAIResults(analysisResult);
              
              // 应用建议名称和描述
              if (query.suggestedName) {
                const suggestedName = decodeURIComponent(query.suggestedName as string);
                setValue('name', suggestedName);
                console.log('应用建议名称:', suggestedName);
              }
              
              if (query.suggestedDesc) {
                const suggestedDesc = decodeURIComponent(query.suggestedDesc as string);
                setValue('description', suggestedDesc);
                console.log('应用建议描述:', suggestedDesc);
              }
            } else {
              // 来自页面内智能分析，存储待手动应用
              console.log('来自页面内智能分析，等待用户手动应用');
              setPendingAIAnalysis(analysisResult);
              
              // 显示智能助手，方便用户查看和应用建议
              setTimeout(() => {
                setShowMobileAssistant(true);
              }, 1000);
            }
            
          } catch (error) {
            console.error('解析AI分析结果失败:', error);
          }
        } else {
          // 如果没有AI分析结果，进行传统的变量检测
          const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
          const matches = content.match(regex);
          if (matches) {
            const detectedVars = Array.from(new Set(matches
          .map(match => match.slice(2, -2))
          .filter(variable => variable && typeof variable === 'string' && variable.trim().length > 0)));
            // 只添加不存在的变量
            const currentVariables = watch('input_variables') || [];
            const varsToAdd = detectedVars.filter(variable => !currentVariables.includes(variable));
            if (varsToAdd.length > 0) {
              const newVariables = [...currentVariables, ...varsToAdd];
              setVariables(newVariables);
              setValue('input_variables', newVariables);
              console.log('检测到新变量:', varsToAdd);
            }
          }
        }
        
        console.log('从优化器智能填充完成');
        
        // 显示用户友好的提示
        setTimeout(() => {
          const hasContent = !!content;
          const hasAiAnalysis = !!query.aiAnalysisResult;
          const isFromOptimizerManualApply = !!(query.suggestedName || query.suggestedDesc);
          
          if (hasContent && !hasAiAnalysis) {
            toast.success('已从AI优化器填充提示词内容');
          } else if (hasContent && hasAiAnalysis && isFromOptimizerManualApply) {
            toast.success('已从AI优化器填充内容并自动应用智能分析结果');
          } else if (hasContent && hasAiAnalysis && !isFromOptimizerManualApply) {
            toast.success('已填充内容，右侧智能助手中有AI分析建议等待您应用', { duration: 6000 });
          }
        }, 500);
      }
    };

    // 只在路由准备好且分类数据加载完成时处理参数
    if (router.isReady) {
      handleURLParams();
    }
  }, [router.isReady, router.query, categoriesLoading, categories]); // 添加分类相关依赖

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

      } catch (err) {
        toast.error('获取分类列表失败');
        console.error('获取分类失败:', err);
        // 错误时设置空数组
        setCategoriesByType({ chat: [], image: [], video: [] });
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategoriesByType();
  }, []);
  
  // 获取标签数据 - 异步但不阻塞页面显示
  useEffect(() => {
    const fetchTags = async () => {
      setTagsLoading(true);
      try {
        const data = await getTags();
        if (data && data.length > 0) {
          setSuggestedTags(data as string[]);
        }
      } catch (err) {
        toast.error('获取标签建议失败');
        console.error('获取标签失败:', err);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);



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
    
    // 检测提示词类型并更新相关状态
    if (content) {
      const detectedType = detectCategoryType(content);
      if (detectedType !== categoryType) {
        setCategoryType(detectedType);
        setValue('category_type', detectedType);
        
        // 根据类型设置默认参数
        const defaultParams = getDefaultParameters(detectedType);
        setParameters(defaultParams);
        setValue('parameters', defaultParams);
        
        // 更新分类选项
        const availableCategories = categoriesByType[detectedType] || [];
        if (availableCategories.length > 0) {
          setValue('category', availableCategories[0]);
        }
        
        // 显示类型检测提示
        toast.success(`检测到${detectedType === 'image' ? '图像' : detectedType === 'video' ? '视频' : '对话'}生成提示词`);
      }
    }
    
    if (!content || typeof content !== 'string') return;
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = content.match(regex);
    
    if (matches) {
      const detectedVars = Array.from(new Set(matches
          .map(match => match.slice(2, -2))
          .filter(variable => variable && typeof variable === 'string' && variable.trim().length > 0)));
      if (detectedVars.length > 0) {
        setVariables(prev => Array.from(new Set([...prev, ...detectedVars])));
        const currentVariables = watch('input_variables') || [];
        setValue('input_variables', Array.from(new Set([...currentVariables, ...detectedVars])));
      }
    }
  };

  // 添加变量
  const addVariable = () => {
    if (variableInput && !variables.includes(variableInput)) {
      const trimmedVariable = variableInput.trim();
      const newVariables = [...variables, trimmedVariable];
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
      const trimmedTag = tagInput.trim();
      const newTags = [...tags, trimmedTag];
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
    // 认证状态检查
    if (!user || !userReady) {
      toast.error('用户认证状态异常，请重新登录');
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

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
    if ((categoryType === 'image' || categoryType === 'video') && uploadedFiles.length === 0) {
      toast.error(`${categoryType === 'image' ? '图片' : '视频'}类型的提示词至少需要上传一个文件`);
      return;
    }

    setIsSubmitting(true);
    
    // 创建提示词请求
    
    try {
      console.log('=== 开始提示词创建流程 ===');
      console.log('提交提示词数据:', data);
      
      // 构建完整的数据对象
      const promptData = {
        ...data,
        version: Number(data.version) || 1.0,
        // 创建提示词时，作者始终是当前登录用户
        author: user.display_name || user.username || user.email?.split('@')[0] || '未知用户',
        input_variables: variables.filter(Boolean), // 过滤空值
        tags: tags.filter(Boolean), // 过滤空值
        compatible_models: models.filter(Boolean), // 过滤空值
        // 媒体相关字段
        category_type: categoryType,
        preview_asset_url: previewUrls.length > 0 ? previewUrls[0] : '',
        preview_assets: previewUrls,
        parameters: parameters,
      } as const;

      console.log('即将创建的提示词:', promptData);
      
      // 使用新的超时机制
      const createPromptWithTimeout = () => {
        return new Promise<any>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('创建提示词总体超时(2分钟)，请检查网络连接并重试'));
          }, 120000); // 2分钟总超时时间
          
          createPrompt(promptData as any)
            .then((result) => {
              clearTimeout(timeoutId);
              resolve(result);
            })
            .catch((error) => {
              clearTimeout(timeoutId);
              reject(error);
            });
        });
      };
      
      const newPrompt = await createPromptWithTimeout();
      console.log('提示词创建成功:', newPrompt);
      
      // 创建成功
      
      // 确保在导航前重置状态
      setIsSubmitting(false);
      
      // 显示成功提示
      toast.success('提示词创建成功！正在跳转...', {
        duration: 3000,
        position: 'top-center',
      });
      
      // 导航到新提示词页面
      router.push(`/prompts/${newPrompt.id}`);
    } catch (error: unknown) {
      console.error('=== 创建提示词失败 ===');
      console.error('错误详情:', error);
      
      // 创建失败
      
      // 提供用户友好的错误提示
      let errorMessage = '创建提示词失败，请稍后重试';
      let canRetry = true;
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('网络') || error.message.includes('Network')) {
          errorMessage = '网络连接问题，请检查网络状态并重试';
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
          errorMessage = '请求超时，可能是网络较慢，请稍后重试';
        } else if (error.message.includes('认证') || error.message.includes('登录') || error.message.includes('token')) {
          errorMessage = '登录状态已过期，请重新登录';
          canRetry = false; // 认证问题不建议重试

          // 认证失效时自动重定向到登录页面
          setTimeout(() => {
            const currentUrl = window.location.pathname + window.location.search;
            router.replace(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
          }, 2000);
        } else if (error.message.includes('权限')) {
          errorMessage = '权限不足，请联系管理员';
          canRetry = false;
        } else if (error.message.includes('服务器')) {
          errorMessage = '服务器暂时不可用，请稍后重试';
        } else if (error.message.includes('参数错误')) {
          errorMessage = '请检查输入内容是否正确';
          canRetry = false;
        } else {
          errorMessage = error.message;
        }
      }
      
      // 显示错误提示
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
      
      // 根据错误类型决定是否显示重试选项
      if (canRetry && typeof window !== 'undefined' && window.confirm) {
        const retry = window.confirm(`${errorMessage}\n\n是否重试？`);
        if (retry) {
          // 给用户一点时间，然后重试
          setTimeout(() => {
            onSubmit(data);
          }, 2000); // 延长重试间隔
          return;
        }
      } else if (!canRetry) {
        // 对于不可重试的错误，提供相应的指导
        if (errorMessage.includes('登录')) {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
      
      // 在开发环境下输出错误信息
      if (process.env.NODE_ENV === 'development') {
        console.log('创建提示词失败，错误详情:', error);
      }
    } finally {
      // 确保无论如何都重置提交状态
      setIsSubmitting(false);
    }
  };

  // 如果用户信息还在加载或用户未准备就绪，显示加载状态
  if (isLoading || !userReady) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">正在加载用户信息...</p>
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

      {/* 开发模式调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs space-y-1">
          <div>分类数量: {categories.length}</div>
        </div>
      )}



      <div className="relative z-10 unified-page-spacing">
        <div className="container-custom">


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
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue mr-2">
                <PlusCircleIcon className="unified-page-title-icon" />
              </div>
              <h1 className="unified-page-title">
                创建提示词
              </h1>
            </motion.div>
            <motion.p
              className="unified-page-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              释放AI的无限潜能，打造专属的智能提示词
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
                    pendingAIAnalysis={pendingAIAnalysis}
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
                value={currentType}
                onChange={handleTypeChange}
                disabled={isSubmitting}
              />
            </div>
          </motion.div>

          {/* 双栏布局容器 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 主表单区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-2 glass rounded-3xl border border-neon-cyan/20 shadow-2xl p-8"
            >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">



              {/* 提示词内容 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="content" className="flex items-center text-lg font-semibold text-gray-200">
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
                    id="content"
                    {...register('content', { required: '请输入提示词内容' })}
                    rows={12}
                    placeholder="在这里编写您的提示词内容。您可以使用 {{变量名}} 来定义动态变量..."
                    className="input-primary w-full font-mono text-sm resize-none"
                    onChange={detectVariables}
                    autoComplete="off"
                  />
                  
                  <div className="absolute top-3 right-3 text-xs text-gray-500">
                    使用 {'{{变量名}}'} 定义变量
                  </div>
                </div>
                
                {errors.content && (
                  <p className="text-neon-red text-sm mt-1">{errors.content.message}</p>
                )}
                

              </motion.div>

              {/* 文件上传区域 - 移到提示词内容下面 */}
              {(categoryType === 'image' || categoryType === 'video') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-4"
                >
                  <label className="flex items-center text-base font-medium text-gray-200">
                    <PhotoIcon className="h-4 w-4 text-neon-purple mr-2" />
                    {categoryType === 'image' ? '示例图片' : '示例视频'} ({uploadedFiles.length}/4)*
                  </label>

                  {/* 文件上传区域 */}
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-neon-cyan/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept={categoryType === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        handleFilesUpload(files);
                      }}
                      className="hidden"
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
                                {categoryType === 'image' ? (
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
                            >
                              添加更多文件
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-4xl text-gray-400">
                          {categoryType === 'image' ? '🖼️' : '🎬'}
                        </div>
                        <div>
                          <p className="text-gray-300 mb-2">
                            拖拽文件到此处或点击上传{categoryType === 'image' ? '图片' : '视频'}
                          </p>
                          <p className="text-sm text-gray-500">
                            支持 {categoryType === 'image' ? 'JPG, PNG, WebP, GIF' : 'MP4, WebM, MOV, AVI'} 格式
                          </p>
                          <p className="text-sm text-gray-500">
                            单个文件最大 {categoryType === 'image' ? '10MB' : '100MB'}，最多上传 4 个文件
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-white rounded-lg font-medium hover:from-neon-cyan-dark hover:to-neon-blue-dark transition-all"
                        >
                          选择{categoryType === 'image' ? '图片' : '视频'}文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 文件上传要求提示 */}
                  <div className="text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
                    <p className="font-medium text-neon-cyan mb-1">上传要求：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 至少上传1个{categoryType === 'image' ? '图片' : '视频'}文件</li>
                      <li>• 最多可上传4个文件</li>
                      <li>• {categoryType === 'image' ? '图片' : '视频'}将作为提示词的示例展示</li>
                      <li>• 文件大小限制：{categoryType === 'image' ? '10MB' : '100MB'}</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* 基本信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
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
                    autoComplete="off"
                  />
                  {errors.name && (
                    <p className="text-neon-red text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="author" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <UserIcon className="h-5 w-5 text-neon-purple mr-2" />
                    作者
                  </label>
                  <input
                    id="author"
                    {...register('author')}
                    type="text"
                    value={user?.display_name || user?.username || user?.email?.split('@')[0] || ''}
                    className="input-primary w-full bg-gray-800 text-gray-400 cursor-not-allowed"
                    readOnly
                    title="创建提示词时，作者自动设置为当前登录用户"
                  />
                  <p className="text-xs text-gray-500">创建提示词时，作者自动设置为当前登录用户</p>
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
                  <label htmlFor="category" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <TagIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    分类 *
                  </label>

                  <select
                    id="category"
                    {...register('category', { required: '请选择分类' })}
                    className="input-primary w-full"
                    autoComplete="off"
                  >
                    <option value="">选择分类</option>
                    {(categoriesByType[categoryType] || []).map((category: string) => (
                      <option key={category} value={category}>
                        {category}（{getTypeLabel(categoryType)}类型）
                      </option>
                    ))}
                  </select>

                  {errors.category && (
                    <p className="text-neon-red text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="version" className="flex items-center text-sm font-medium text-gray-300 mb-3">
                    <CodeBracketIcon className="h-5 w-5 text-neon-purple mr-2" />
                    版本
                  </label>
                  <input
                    id="version"
                    {...register('version')}
                    type="text"
                    value={(() => {
                      const version = watch('version') ?? 1.0;
                      const numVersion = Number(version);
                      return isNaN(numVersion) ? String(version) : numVersion.toFixed(1);
                    })()}
                    onChange={e => setValue('version', e.target.value as any)}
                    className="input-primary w-full"
                    autoComplete="off"
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
                <label htmlFor="variable-input" className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-purple mr-2" />
                  输入变量
                </label>
                
                <div className="flex gap-2">
                  <input
                    id="variable-input"
                    name="variable-input"
                    type="text"
                    value={variableInput}
                    onChange={(e) => setVariableInput(e.target.value)}
                    placeholder="添加新变量..."
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
                <label htmlFor="tag-input" className="flex items-center text-sm font-medium text-gray-300">
                  <TagIcon className="h-5 w-5 text-neon-pink mr-2" />
                  标签
                </label>
                
                {/* 添加标签输入框 */}
                <div className="flex gap-2">
                  <input
                    id="tag-input"
                    name="tag-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="添加新标签..."
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
                  categoryType={categoryType}
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
                transition={{ delay: 1.9 }}
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
                  <label htmlFor="is-public" className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="is-public"
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
                      id="allow-collaboration"
                      name="allow-collaboration"
                      type="checkbox"
                      checked={watch('allow_collaboration') || false}
                      onChange={(e) => setValue('allow_collaboration', e.target.checked)}
                      className="h-4 w-4 text-neon-cyan border-gray-600 rounded focus:ring-neon-cyan"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="allow-collaboration" className="text-sm font-medium text-gray-300">
                      允许协作编辑
                    </label>
                    <div className="text-sm text-gray-400">
                      允许其他贡献者修改这个提示词的内容（编辑权限，仅在公开分享时有效）
                    </div>
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
                    autoComplete="off"
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
                      <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
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
          
          {/* 智能写作助手侧边栏 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="glass rounded-3xl border border-neon-purple/20 shadow-2xl p-6"
          >
            <SmartWritingAssistant
              content={currentContent || watch('content') || ''}
              onContentChange={(newContent) => {
                setValue('content', newContent);
                setCurrentContent(newContent);
              }}
              onAnalysisComplete={(result) => {
                setPendingAIAnalysis(result);
                console.log('收到智能分析结果，等待用户手动应用:', result);
              }}
              onApplyAnalysisResults={applyAIResults}
              pendingAIAnalysis={pendingAIAnalysis}
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

export default withAuth(CreatePromptPage); 