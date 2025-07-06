import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  UserIcon,
  TagIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  ArrowPathIcon,
  SparklesIcon,
  CodeBracketIcon,
  BoltIcon,
  FireIcon,
  EyeIcon,
  ShareIcon,
  StarIcon,
  CalendarIcon,
  PlayIcon,
  StopIcon,
  CheckIcon,
  XMarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  PencilIcon,
  SwatchIcon,
  PaintBrushIcon,
  AcademicCapIcon,
  HeartIcon,
  PuzzlePieceIcon,
  HomeIcon,
  FolderIcon,
  LanguageIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  HeartIcon as HealthIcon,
  CpuChipIcon,
  PhotoIcon,
  FilmIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { useOptimizedCategoryDisplay } from '@/contexts/CategoryContext';
import ShareButton from '@/components/ShareButton';

// 参数名称中文映射
const PARAMETER_NAMES: Record<string, string> = {
  // 图像参数
  'style': '风格样式',
  'aspect_ratio': '宽高比',
  'resolution': '分辨率',
  'quality': '生成质量',
  'guidance_scale': '引导强度',
  'num_inference_steps': '推理步数',
  'seed': '随机种子',
  'negative_prompt': '负面提示词',
  // 视频参数
  'duration': '视频时长',
  'fps': '帧率',
  'motion_strength': '运动强度',
  'camera_movement': '摄像机运动',
};

import { databaseService } from '@/lib/database-service';
import { PromptDetails, PromptExample, PromptVersion } from '@/types';
import { MODEL_TAGS, getModelTypeLabel } from '@/constants/ai-models';
import { formatVersionDisplay } from '@/lib/version-utils';
import { RatingSystem } from '@/components/RatingSystem';
import PromptInteractions from '@/components/social/PromptInteractions';
import VersionHistory from '@/components/prompts/VersionHistory';
import UserPromptContext from '@/components/prompts/UserPromptContext';
import { toast } from 'react-hot-toast';

interface PromptDetailsPageProps {
  // 移除 prompt prop，改为客户端获取
}

export default function PromptDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, getToken } = useAuth();

  // 添加客户端数据获取状态
  const [prompt, setPrompt] = useState<PromptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<string>('1');
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // 使用优化的分类显示Hook
  const categoryDisplayInfo = useOptimizedCategoryDisplay(
    prompt?.category || '',
    (prompt?.category_type || 'chat') as 'chat' | 'image' | 'video',
  );

  // 客户端数据获取
  useEffect(() => {
    if (!id || typeof id !== 'string') {return;}

    const fetchPrompt = async () => {
      try {
        setLoading(true);
        setError(null);

        // 准备请求头
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // 如果用户已登录，添加认证令牌
        if (user) {
          try {
            const token = await getToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          } catch (error) {
            console.warn('获取认证令牌失败:', error);
          }
        }

        // 使用 API 获取提示词详情
        const response = await fetch(`/api/prompts/${id}`, {
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('提示词不存在或您无权访问');
          } else if (response.status === 403) {
            setError('您无权访问此提示词');
          } else {
            setError('获取提示词详情失败');
          }
          return;
        }

        const data = await response.json();
        if (data.success && data.data && data.data.prompt) {
          setPrompt(data.data.prompt);
        } else {
          setError('提示词数据格式错误');
        }
      } catch (error) {
        console.error('获取提示词详情失败:', error);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id]);

  // 提取变量的函数 - 必须在使用之前定义
  const extractVariablesFromText = (text: string): string[] => {
    const regex = /\{\{([a-zA-Z0-9_\u4e00-\u9fa5]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      variables.add(match[1].trim());
    }
    return Array.from(variables);
  };

  // 获取完整内容和提取变量 - 需要在hooks之前计算
  const getFullContent = () => {
    if (!prompt) {return '';}
    // 处理可能的 JSONB 格式内容
    if (typeof prompt.content === 'string') {
      return prompt.content;
    } else if (prompt.content && typeof prompt.content === 'object') {
      // 如果是 JSONB 对象，提取文本内容
      const jsonbContent = prompt.content as any;
      return jsonbContent.static_content || jsonbContent.legacy_content || '';
    }
    return '';
  };

  const fullContent = getFullContent();
  const allVariables = prompt?.input_variables && prompt.input_variables.length > 0
    ? prompt.input_variables
    : extractVariablesFromText(fullContent);

  // 状态管理 - 所有useState必须在条件渲染之前
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    allVariables.forEach(variable => {
      initialValues[variable] = '';
    });
    return initialValues;
  });

  const [processedContent, setProcessedContent] = useState<string>(fullContent);

  // 确保客户端渲染一致性
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 处理路由变化时的状态重置
  useEffect(() => {
    if (prompt) {
      setSelectedVersion(prompt.version?.toString() || '1');
      setCopied(false);
    }
  }, [prompt]);

  // 当变量值变化时更新处理后的内容
  useEffect(() => {
    let content = fullContent;
    Object.entries(variableValues).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value || `{{${variable}}}`);
    });
    setProcessedContent(content);
  }, [variableValues, fullContent]);

  // 处理加载状态
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 处理错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">出错了</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 如果没有提示词数据，显示404
  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-white mb-2">提示词不存在</h1>
          <p className="text-gray-400 mb-4">您访问的提示词可能已被删除或不存在</p>
          <button
            onClick={() => router.push('/prompts')}
            className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors"
          >
            浏览其他提示词
          </button>
        </div>
      </div>
    );
  }




  // 获取当前选中版本的内容（暂时简化，因为没有版本系统）
  const getVersionContent = () => {
    return processedContent;
  };

  // 更新变量值
  const updateVariableValue = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value,
    }));
  };

  // 复制处理后的内容到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);


    } catch (error) {
      toast.error('复制到剪贴板失败');
      console.error('复制失败:', error);
    }
  };

  // 从URL中提取文件名的工具函数
  const extractFilenameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || '';
    } catch (error) {
      console.error('提取文件名失败:', error);
      return '';
    }
  };

  // 删除媒体文件的函数
  const deleteMediaFiles = async (token: string): Promise<void> => {
    if (!prompt || (prompt.category_type !== 'image' && prompt.category_type !== 'video')) {
      return; // 非媒体类型提示词，无需删除文件
    }

    const filesToDelete: string[] = [];

    // 收集需要删除的文件
    // 1. preview_asset_url 中的文件
    if (prompt.preview_asset_url) {
      const filename = extractFilenameFromUrl(prompt.preview_asset_url);
      if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
        filesToDelete.push(filename);
      }
    }

    // 2. parameters.media_files 中的文件
    const mediaFiles = prompt.parameters?.media_files || [];
    mediaFiles.forEach((file: any) => {
      if (file.url) {
        const filename = extractFilenameFromUrl(file.url);
        if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
          filesToDelete.push(filename);
        }
      }
    });

    // 删除重复的文件名
    const uniqueFiles = [...new Set(filesToDelete)];

    // 逐个删除文件
    for (const filename of uniqueFiles) {
      try {
        const deleteResponse = await fetch(`/api/assets/${filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!deleteResponse.ok) {
          console.warn(`删除文件失败: ${filename}`, await deleteResponse.text());
        } else {
          console.log(`文件删除成功: ${filename}`);
        }
      } catch (error) {
        console.warn(`删除文件时出错: ${filename}`, error);
      }
    }
  };

  // 版本回滚处理
  const handleVersionRevert = async (versionId: string) => {
    // 版本回滚成功后，重新获取提示词数据
    try {
      if (!id || typeof id !== 'string') {return;}

      console.log('开始重新获取提示词数据，ID:', id);

      // 重新获取提示词数据
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('获取认证令牌失败:', error);
        }
      }

      const response = await fetch(`/api/prompts/${id}`, {
        headers,
      });

      console.log('获取提示词响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('获取提示词响应数据:', data);

        if (data.success && data.data && data.data.prompt) {
          setPrompt(data.data.prompt);
          toast.success('版本回滚成功');
        } else {
          console.error('响应数据格式错误:', data);
          toast.error('获取提示词数据失败');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('获取提示词失败:', response.status, errorData);
        toast.error('获取提示词失败: ' + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error('重新获取提示词失败:', error);
      toast.error('刷新数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 删除提示词 - 智能检测版本
  const handleDeletePrompt = async () => {
    if (!prompt || !user) {
      toast.error('请先登录');
      return;
    }

    try {
      // 获取认证令牌
      const token = await getToken();
      if (!token) {
        toast.error('无法获取认证令牌，请重新登录');
        return;
      }

      // 🔍 第一步：检查删除策略
      const policyResponse = await fetch('/api/prompts/check-deletion-policy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId: prompt.id }),
      });

      if (!policyResponse.ok) {
        const error = await policyResponse.json();
        toast.error('策略检查失败: ' + (error.message || '未知错误'));
        return;
      }

      const policy = await policyResponse.json();

      // 🎯 根据策略显示不同的确认对话框
      let confirmMessage = '';
      if (policy.mustArchive) {
        confirmMessage = `⚠️ 检测到关联数据保护

提示词"${prompt.name}"有 ${policy.contextUsersCount} 个用户正在使用：
• 系统将自动归档此提示词（不会删除）
• 提示词从您的列表中移除，但保持完整功能
• 其他用户的个性化配置将得到保护
• 您可以随时从"我的归档"中恢复

原因：${policy.reason}

确定要归档此提示词吗？`;
      } else if (policy.canDelete) {
        confirmMessage = `🗑️ 安全删除确认

提示词"${prompt.name}"可以安全删除：
• 没有其他用户在使用此提示词
• 所有相关数据将被永久删除
• 此操作不可恢复

确定要删除此提示词吗？`;
      } else {
        toast.error(`无法操作此提示词：${policy.reason}`);
        return;
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      setIsDeleting(true);

      // 🎯 第二步：执行智能删除
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // 🎯 根据结果类型显示不同的成功消息
        if (result.type === 'archived') {
          // 显示归档成功信息
          toast.success(
            <div className="space-y-2">
              <div className="font-semibold text-blue-800">📚 智能归档成功！</div>
              <div className="text-sm text-blue-700">
                {result.details}
              </div>
              {result.affectedUsers > 0 && (
                <div className="text-sm text-green-700">
                  ✓ 已保护 {result.affectedUsers} 个用户的个性化配置
                </div>
              )}
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                <div>• 您可以在"我的归档"中找到此提示词</div>
                <div>• 点击"恢复"即可重新激活</div>
                <div>• 其他用户可以继续正常使用</div>
              </div>
            </div>,
            { 
              duration: 8000,
              className: 'bg-blue-50 border-blue-200',
            },
          );
        } else if (result.type === 'deleted') {
          // 显示删除成功信息
          toast.success(
            <div className="space-y-2">
              <div className="font-semibold text-green-800">🗑️ 删除成功！</div>
              <div className="text-sm text-green-700">
                {result.details}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                • 所有相关数据已永久删除
              </div>
            </div>,
            { duration: 5000 },
          );
        } else {
          // 默认成功消息
          toast.success(result.message || '操作成功');
        }

        // 根据提示词类型跳转到对应的页面
        const redirectPath = (() => {
          switch (prompt.category_type) {
            case 'image':
              return '/image';
            case 'video':
              return '/video';
            case 'chat':
            default:
              return '/prompts';
          }
        })();

        // 给用户足够时间阅读信息
        const redirectDelay = result.type === 'archived' ? 4000 : 2000;
        
        setTimeout(() => {
          router.push(redirectPath);
        }, redirectDelay);
      } else {
        const error = await response.json();
        throw new Error(error.message || '操作失败');
      }
    } catch (error: any) {
      console.error('删除提示词失败:', error);
      toast.error(`操作失败: ${error.message || '请检查您的权限或网络连接'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) {return '未知日期';}
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
    });
  };

  // 获取类型图标和样式
  const getTypeInfo = (categoryType?: string) => {
    const typeMap: Record<string, { color: string; icon: any; name: string }> = {
      'chat': { color: 'from-neon-blue to-neon-cyan', icon: ChatBubbleLeftRightIcon, name: '对话' },
      'image': { color: 'from-neon-pink to-neon-purple', icon: PhotoIcon, name: '图像' },
      'video': { color: 'from-neon-red to-neon-orange', icon: FilmIcon, name: '视频' },
    };
    
    return typeMap[categoryType || 'chat'] || typeMap['chat'];
  };

  // 获取分类样式和图标 - 直接使用优化的分类信息
  const getCategoryInfo = (category?: string) => {
    return {
      name: categoryDisplayInfo.name,
      color: categoryDisplayInfo.color,
      icon: categoryDisplayInfo.iconComponent || TagIcon,
    };
  };

  // 渲染评分星星
  const renderStars = (rating?: number) => {
    const stars = [];
    const ratingValue = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <SolidStarIcon 
          key={i} 
          className={`h-5 w-5 ${i <= ratingValue ? 'text-neon-yellow' : 'text-gray-600'}`} 
        />,
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  // 渲染标签
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) {return null;}
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag, index) => (
          <motion.span 
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium glass border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan/50 transition-colors"
          >
            #{tag}
          </motion.span>
        ))}
      </div>
    );
  };

  // 渲染版本选择器
  const renderVersionSelector = () => {
    if (!prompt.versions || prompt.versions.length <= 1) {return null;}
    
    return (
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="version" className="block text-sm font-medium text-gray-300 mb-3">
          <BoltIcon className="h-4 w-4 inline mr-2" />
          选择版本
        </label>
        <select
          id="version"
          name="version"
          className="input-primary w-full"
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
        >
          {prompt.versions.map((version) => (
            <option key={version.version} value={version.version}>
              v{formatVersionDisplay(version.version)} {version.notes ? `- ${version.notes}` : ''}
            </option>
          ))}
        </select>
      </motion.div>
    );
  };

  // 渲染变量输入区域
  const renderVariableInputs = () => {
    if (!allVariables || allVariables.length === 0) {
      return (
        <div className="text-sm text-gray-400 text-center py-8">
          此提示词没有输入变量
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allVariables.map((variable) => (
          <div key={variable}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {variable}
            </label>
            <input
              type="text"
              value={variableValues[variable] || ''}
              onChange={(e) => updateVariableValue(variable, e.target.value)}
              placeholder={`输入 ${variable} 的值`}
              className="w-full px-3 py-2 rounded-lg bg-dark-bg-secondary/50 border border-neon-pink/30 text-white placeholder-gray-400 focus:border-neon-pink/50 focus:outline-none transition-colors font-mono text-sm"
            />
          </div>
        ))}
      </div>
    );
  };

  const categoryInfo = getCategoryInfo(prompt.category);
  const typeInfo = getTypeInfo(prompt.category_type);
  const CategoryIcon = categoryInfo.icon;
  const TypeIcon = typeInfo.icon;

  // 获取模型显示信息
  const getModelDisplayInfo = (modelId: string) => {
    const tag = MODEL_TAGS.find(t => t.id === modelId);
    if (tag) {
      return {
        name: tag.name,
        color: tag.color,
        type: getModelTypeLabel(tag.type),
        description: tag.description,
      };
    }
    // 自定义模型
    return {
      name: modelId,
      color: 'text-gray-400',
      type: '自定义模型',
      description: '用户添加的自定义模型',
    };
  };

  return (
    <div className="min-h-screen relative">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg-primary via-dark-bg-secondary to-dark-bg-primary" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container-custom py-8">
        {/* 返回按钮 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            href={(() => {
              switch (prompt.category_type) {
                case 'image':
                  return '/image';
                case 'video':
                  return '/video';
                case 'chat':
                default:
                  return '/prompts';
              }
            })()} 
            className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors group"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回{prompt.category_type === 'image' ? '图像' : prompt.category_type === 'video' ? '视频' : '对话'}提示词列表
          </Link>
        </motion.div>
        
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-3">
            {/* 提示词头部 */}
            <motion.div 
              className="glass rounded-xl p-8 border border-neon-cyan/20 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${categoryInfo.color} mr-4`}>
                      <CategoryIcon className="h-6 w-6 text-dark-bg-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white gradient-text">
                        {prompt.name}
                      </h1>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">{typeInfo.name}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-sm text-gray-400">{categoryInfo.name}</span>
                        </div>
                        {prompt.usageCount && prompt.usageCount > 100 && (
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-neon-red/20 border border-neon-red/30">
                            <FireIcon className="h-3 w-3 text-neon-red" />
                            <span className="text-xs text-neon-red">热门</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-300 leading-relaxed mb-4">
                    {prompt.description}
                  </p>
                  
                  {renderTags(prompt.tags)}
                </div>
                
                <div className="flex items-center space-x-3 ml-6 relative z-[100]">
                  <ShareButton
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    title={prompt?.name || ''}
                    description={prompt?.description || ''}
                  />

                  {/* 版本历史按钮 - 所有用户都可以查看 */}
                  <motion.button
                    type="button"
                    onClick={() => setShowVersionHistory(true)}
                    className="p-3 glass rounded-xl border border-neon-purple/30 text-neon-purple hover:border-neon-purple/50 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="查看版本历史"
                  >
                    <ClockIcon className="h-5 w-5" />
                  </motion.button>

                  {/* 只有登录用户且是作者才显示编辑和删除按钮 */}
                  {user && prompt.user_id === user.id && (
                    <>
                      <Link
                        href={`/prompts/${prompt.id}/edit`}
                        className="p-3 glass rounded-xl border border-neon-yellow/30 text-neon-yellow hover:border-neon-yellow/50 hover:text-white transition-colors"
                        title="编辑提示词"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <motion.button
                        type="button"
                        onClick={handleDeletePrompt}
                        disabled={isDeleting}
                        className={`p-3 glass rounded-xl border transition-colors ${
                          isDeleting
                            ? 'border-gray-500/30 text-gray-500 cursor-not-allowed'
                            : 'border-neon-red/30 text-neon-red hover:border-neon-red/50 hover:text-white'
                        }`}
                        whileHover={!isDeleting ? { scale: 1.05 } : {}}
                        whileTap={!isDeleting ? { scale: 0.95 } : {}}
                        title={isDeleting ? '删除中...' : '删除提示词'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  创建于 {formatDate(prompt.created_at)}
                </div>
                {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                  <div className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    更新于 {formatDate(prompt.updated_at)}
                  </div>
                )}
                {prompt.author && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {prompt.author}
                  </div>
                )}
                {prompt.version && (
                  <div className="flex items-center">
                    <BoltIcon className="h-4 w-4 mr-2" />
                    版本 {formatVersionDisplay(prompt.version)}
                  </div>
                )}
                {prompt.rating !== undefined && (
                  <div className="flex items-center">
                    {renderStars(prompt.rating)}
                    <span className="ml-2 text-xs">({prompt.rating}/5)</span>
                  </div>
                )}
                {prompt.usageCount && (
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    使用 {prompt.usageCount} 次
                  </div>
                )}
              </div>
            </motion.div>
            


            {/* 提示词内容 */}
            <motion.div 
              className="glass rounded-xl p-8 border border-neon-cyan/20 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <CodeBracketIcon className="h-6 w-6 mr-3 text-neon-cyan" />
                  提示词内容
                </h2>
                <motion.button
                  type="button"
                  onClick={copyToClipboard}
                  className={`btn ${
                    copied
                      ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                      : 'btn-primary'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                  {copied ? '已复制！' : '复制内容'}
                </motion.button>
              </div>
              
              {renderVersionSelector()}
              
              <div className="relative">
                <div className="glass rounded-xl p-6 border border-gray-600 font-mono text-sm leading-relaxed text-gray-200 min-h-[200px] max-h-[600px] overflow-auto">
                  <pre className="whitespace-pre-wrap">{processedContent}</pre>
                </div>
                
                {/* 复制成功动画 */}
                {copied && (
                  <motion.div
                    className="absolute inset-0 bg-neon-green/10 rounded-xl border-2 border-neon-green/50 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-neon-green/20 px-4 py-2 rounded-lg text-neon-green font-semibold">
                      复制成功！
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>


            {/* 媒体资源展示（仅图像和视频类型） */}
            {(prompt.category_type === 'image' || prompt.category_type === 'video') && (
              <motion.div
                className="glass rounded-xl p-8 border border-neon-cyan/20 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    {prompt.category_type === 'image' ? (
                      <PhotoIcon className="h-6 w-6 mr-3 text-neon-pink" />
                    ) : (
                      <FilmIcon className="h-6 w-6 mr-3 text-neon-red" />
                    )}
                    {prompt.category_type === 'image' ? '图像展示' : '视频展示'}
                  </h2>
                </div>

                {(() => {
                  // 获取媒体文件列表
                  const mediaFiles = prompt.parameters?.media_files || [];
                  const hasMediaFiles = mediaFiles.length > 0;
                  const hasSinglePreview = prompt.preview_asset_url && !hasMediaFiles;

                  if (hasMediaFiles) {
                    // 显示多个媒体文件 - 单列布局
                    return (
                      <div className="space-y-6">
                        {mediaFiles.map((file: any, index: number) => (
                          <div key={file.id || index} className="relative">
                            <div className="glass rounded-xl p-4 border border-gray-600 bg-black/20">
                              {prompt.category_type === 'image' ? (
                                <img
                                  src={file.url}
                                  alt={file.name || `图像 ${index + 1}`}
                                  className="w-full h-auto max-h-96 object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                />
                              ) : (
                                <video
                                  src={file.url}
                                  controls
                                  className="w-full h-auto max-h-96 rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLVideoElement).style.display = 'none';
                                  }}
                                >
                                  您的浏览器不支持视频播放
                                </video>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (hasSinglePreview) {
                    // 显示单个预览文件（向后兼容）
                    return (
                      <div className="relative">
                        <div className="glass rounded-xl p-6 border border-gray-600 bg-black/20">
                          {prompt.category_type === 'image' ? (
                            <img
                              src={prompt.preview_asset_url}
                              alt={prompt.name}
                              className="w-full h-auto max-h-96 object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onClick={() => window.open(prompt.preview_asset_url!, '_blank')}
                            />
                          ) : (
                            <video
                              src={prompt.preview_asset_url}
                              controls
                              className="w-full h-auto max-h-96 rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLVideoElement).style.display = 'none';
                              }}
                            >
                              您的浏览器不支持视频播放
                            </video>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // 没有媒体文件时显示占位符
                    return (
                      <div className="relative">
                        <div className="glass rounded-xl p-12 border border-gray-600 bg-black/20 text-center">
                          <div className="text-gray-400">
                            {prompt.category_type === 'image' ? (
                              <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            ) : (
                              <FilmIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            )}
                            <p>暂无{prompt.category_type === 'image' ? '图像' : '视频'}文件</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </motion.div>
            )}

            {/* 用户个性化上下文模块 - Context Engineering核心功能 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <UserPromptContext promptId={prompt.id} isLoggedIn={!!user} />
            </motion.div>

            {/* 社交互动组件 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <PromptInteractions promptId={prompt.id} />
            </motion.div>

            {/* 评分和评论系统 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <RatingSystem promptId={prompt.id} className="mb-8" />
            </motion.div>
          </div>
          
          {/* 右侧信息栏 */}
          <div className="lg:col-span-1">
            <motion.div 
              className="glass rounded-xl p-6 border border-neon-cyan/20 sticky top-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-white mb-6">
                {prompt.category_type === 'chat' ? '变量设置' : '提示词信息'}
              </h3>
              
              <div className="space-y-6">
                {/* 类型信息 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <TypeIcon className="h-4 w-4 mr-2 text-neon-cyan" />
                    类型信息
                  </h4>
                  <div className="p-3 rounded-lg glass border border-neon-cyan/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${typeInfo.color}`}>
                        <TypeIcon className="h-4 w-4 text-dark-bg-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{typeInfo.name}生成</div>
                        <div className="text-xs text-gray-400">{categoryInfo.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 输入变量 */}
                <div className="pt-4 border-t border-neon-cyan/20">
                  <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2 text-neon-pink" />
                    输入变量
                  </h4>
                  {renderVariableInputs()}
                </div>

                {/* 生成参数（仅图像和视频类型） */}
                {(prompt.category_type === 'image' || prompt.category_type === 'video') && (
                  <div className="pt-4 border-t border-neon-cyan/20">
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <CogIcon className="h-4 w-4 mr-2 text-neon-yellow" />
                      生成参数
                    </h4>
                    {prompt.parameters && Object.keys(prompt.parameters).filter(key => key !== 'media_files').length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(prompt.parameters)
                          .filter(([key]) => key !== 'media_files') // 排除media_files字段，避免重复显示
                          .map(([key, value]) => {
                            const displayName = PARAMETER_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            
                            return (
                              <div key={key} className="p-3 rounded-lg glass border border-neon-yellow/30 group hover:border-neon-yellow/50 transition-colors">
                                <div className="text-xs font-medium text-neon-yellow mb-1">
                                  {displayName}
                                </div>
                                <div className="text-xs text-gray-300 break-words">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-8">
                        此提示词未设置参数
                      </div>
                    )}
                  </div>
                )}
                
                {/* 兼容模型 */}
                <div className="pt-4 border-t border-neon-cyan/20">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <BoltIcon className="h-4 w-4 mr-2 text-neon-yellow" />
                    兼容模型
                  </h4>
                  {prompt.compatible_models && prompt.compatible_models.length > 0 ? (
                    <div className="space-y-2">
                      {prompt.compatible_models.map(modelId => {
                        const modelInfo = getModelDisplayInfo(modelId);
                        return (
                          <div
                            key={modelId}
                            className="p-3 rounded-lg glass border border-neon-green/30 group hover:border-neon-green/50 transition-colors"
                          >
                            <div className={`font-medium ${modelInfo.color} mb-1`}>
                              {modelInfo.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {modelInfo.type}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {modelInfo.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-600/30 text-center">
                      <div className="text-sm text-gray-400 mb-1">
                        🔧 未设置兼容模型
                      </div>
                      <div className="text-xs text-gray-500">
                        作者尚未指定此提示词的兼容AI模型
                      </div>
                    </div>
                  )}
                </div>

                {/* 使用示例 */}
                {prompt.examples && prompt.examples.length > 0 && (
                  <div className="pt-4 border-t border-neon-cyan/20">
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2 text-neon-purple" />
                      使用示例
                    </h4>
                    <div className="space-y-3">
                      {prompt.examples.map((example, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg glass border border-neon-purple/30 group hover:border-neon-purple/50 transition-colors"
                        >
                          {example.description && (
                            <div className="text-xs text-gray-400 mb-2">
                              {example.description}
                            </div>
                          )}
                          <div className="text-xs text-neon-purple font-medium mb-1">输入:</div>
                          <div className="text-xs text-gray-300 mb-2 font-mono">
                            {JSON.stringify(example.input, null, 2)}
                          </div>
                          <div className="text-xs text-neon-green font-medium mb-1">输出:</div>
                          <div className="text-xs text-gray-200 font-mono">
                            {example.output}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 标签 */}
                <div className="pt-4 border-t border-neon-cyan/20">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2 text-neon-cyan" />
                    标签
                  </h4>
                  {prompt.tags && prompt.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-8">
                      此提示词未设置标签
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 版本历史弹窗 */}
        {prompt && (
          <VersionHistory
            isOpen={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            promptId={prompt.id}
            currentVersion={prompt.version || 1.0}
            onVersionRevert={handleVersionRevert}
          />
        )}
      </div>
    </div>
  );
}

// 移除 getServerSideProps，改为客户端渲染
// 这样可以避免服务端认证的复杂性，让客户端处理认证和数据获取
