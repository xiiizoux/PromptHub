import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { getPromptDetails, trackPromptUsage } from '@/lib/api';
import { PromptDetails, PromptExample, PromptVersion } from '@/types';
import { MODEL_TAGS, getModelTypeLabel } from '@/constants/ai-models';
import { formatVersionDisplay } from '@/lib/version-utils';
import { RatingSystem } from '@/components/RatingSystem';
import PromptInteractions from '@/components/social/PromptInteractions';

interface PromptDetailsPageProps {
  prompt: PromptDetails;
}

export default function PromptDetailsPage({ prompt }: PromptDetailsPageProps) {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState<string>(prompt.version?.toString() || '1');
  const [copied, setCopied] = useState(false);
  const [usageTracked, setUsageTracked] = useState(false);
  
  // 从prompt数据中获取完整的内容
  const getFullContent = () => {
    // 首先尝试从content字段获取（API兼容性）
    if (prompt.content && typeof prompt.content === 'string') {
      return prompt.content;
    }
    
    // 然后从messages获取内容
    if (prompt.messages && Array.isArray(prompt.messages) && prompt.messages.length > 0) {
      return prompt.messages.map((msg: any) => {
        // 处理不同的消息内容格式
        if (typeof msg.content === 'string') {
          return msg.content;
        } else if (msg.content && typeof msg.content === 'object') {
          // 处理 {type: 'text', text: '...'} 格式
          if (msg.content.text && typeof msg.content.text === 'string') {
            return msg.content.text;
          }
          // 处理其他对象格式，转换为JSON字符串
          return JSON.stringify(msg.content);
        }
        return '';
      }).filter(content => content.trim()).join('\n\n');
    }
    
    return '';
  };

  // 提取变量的函数
  const extractVariablesFromText = (text: string): string[] => {
    const regex = /\{\{([a-zA-Z0-9_\u4e00-\u9fa5]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      variables.add(match[1].trim());
    }
    return Array.from(variables);
  };

  // 获取完整内容和提取变量
  const fullContent = getFullContent();
  const allVariables = prompt.input_variables && prompt.input_variables.length > 0 
    ? prompt.input_variables 
    : extractVariablesFromText(fullContent);

  // 添加调试输出
  useEffect(() => {
    console.log('=== 提示词详情页面调试信息 ===');
    console.log('原始prompt数据:', prompt);
    console.log('提取的内容:', fullContent);
    console.log('提取的变量:', allVariables);
    console.log('prompt.messages:', prompt.messages);
    console.log('prompt.content:', prompt.content);
    console.log('prompt.input_variables:', prompt.input_variables);
  }, []);

  // 状态管理
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    allVariables.forEach(variable => {
      initialValues[variable] = '';
    });
    return initialValues;
  });
  
  const [processedContent, setProcessedContent] = useState<string>(fullContent);

  // 当变量值变化时更新处理后的内容
  useEffect(() => {
    let content = fullContent;
    Object.entries(variableValues).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value || `{{${variable}}}`);
    });
    setProcessedContent(content);
  }, [variableValues, fullContent]);

  // 获取当前选中版本的内容（暂时简化，因为没有版本系统）
  const getVersionContent = () => {
    return processedContent;
  };

  // 更新变量值
  const updateVariableValue = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  // 复制处理后的内容到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // 追踪使用情况
      if (!usageTracked) {
        try {
          await trackPromptUsage({
            prompt_id: prompt.id,
            version: parseFloat(selectedVersion) || 1.0,
            input_tokens: processedContent.length / 4, // 粗略估算
            output_tokens: 0,
            latency: 0,
            success: true
          });
          setUsageTracked(true);
        } catch (error) {
          console.error('追踪使用情况失败:', error);
        }
      }
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // 获取分类样式和图标
  const getCategoryInfo = (category?: string) => {
    // 分类映射表 - 支持完整的21个分类
    const categoryMap: Record<string, { color: string; icon: any }> = {
      // 基础分类
      '全部': { color: 'from-neon-purple to-neon-blue', icon: SparklesIcon },
      '通用': { color: 'from-neon-purple to-neon-blue', icon: SparklesIcon },
      
      // 专业和学术
      '学术': { color: 'from-neon-blue to-neon-cyan', icon: AcademicCapIcon },
      '职业': { color: 'from-neon-green to-neon-yellow', icon: BriefcaseIcon },
      
      // 创作和内容
      '文案': { color: 'from-neon-pink to-neon-yellow', icon: PencilIcon },
      '设计': { color: 'from-neon-yellow to-neon-orange', icon: SwatchIcon },
      '绘画': { color: 'from-neon-orange to-neon-red', icon: PaintBrushIcon },
      
      // 教育和情感
      '教育': { color: 'from-neon-green to-neon-cyan', icon: BookOpenIcon },
      '情感': { color: 'from-neon-pink to-neon-purple', icon: HeartIcon },
      
      // 娱乐和游戏
      '娱乐': { color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
      '游戏': { color: 'from-neon-purple to-neon-pink', icon: PuzzlePieceIcon },
      
      // 生活和商业
      '生活': { color: 'from-neon-green to-neon-blue', icon: HomeIcon },
      '商业': { color: 'from-neon-red to-neon-orange', icon: ChartBarIcon },
      '办公': { color: 'from-neon-blue to-neon-purple', icon: FolderIcon },
      
      // 技术分类
      '编程': { color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
      '翻译': { color: 'from-neon-blue to-neon-cyan', icon: LanguageIcon },
      
      // 多媒体
      '视频': { color: 'from-neon-red to-neon-pink', icon: VideoCameraIcon },
      '播客': { color: 'from-neon-orange to-neon-yellow', icon: MicrophoneIcon },
      '音乐': { color: 'from-neon-purple to-neon-blue', icon: MusicalNoteIcon },
      
      // 专业领域
      '健康': { color: 'from-neon-green to-neon-cyan', icon: HealthIcon },
      '科技': { color: 'from-neon-cyan to-neon-blue', icon: CpuChipIcon },
      
      // 兼容旧分类名称
      '代码': { color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
      '创意写作': { color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      '写作': { color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      '数据分析': { color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
      '分析': { color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
    };
    
    const info = categoryMap[category || ''] || { 
      color: 'from-neon-purple to-neon-blue', 
      icon: SparklesIcon 
    };
    
    return {
      name: category || '通用',
      ...info
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
        />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  // 渲染标签
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    
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
    if (!prompt.versions || prompt.versions.length <= 1) return null;
    
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
  const CategoryIcon = categoryInfo.icon;

  // 获取模型显示信息
  const getModelDisplayInfo = (modelId: string) => {
    const tag = MODEL_TAGS.find(t => t.id === modelId);
    if (tag) {
      return {
        name: tag.name,
        color: tag.color,
        type: getModelTypeLabel(tag.type),
        description: tag.description
      };
    }
    // 自定义模型
    return {
      name: modelId,
      color: 'text-gray-400',
      type: '自定义模型',
      description: '用户添加的自定义模型'
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
          <Link href="/prompts" className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-white transition-colors group">
            <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回提示词列表
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
                        <span className="text-sm text-gray-400">{categoryInfo.name}</span>
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
                
                <div className="flex items-center space-x-3 ml-6">
                  <motion.button
                    type="button"
                    onClick={() => {
                      // 简单的分享功能：复制当前页面链接
                      const shareUrl = window.location.href;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        // 这里可以添加toast提示
                        alert('链接已复制到剪贴板！');
                      }).catch(() => {
                        alert('复制失败，请手动复制地址栏链接');
                      });
                    }}
                    className="p-3 glass rounded-xl border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan/50 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="分享这个提示词"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </motion.button>
                  <Link 
                    href={`/prompts/${prompt.id}/edit`}
                    className="p-3 glass rounded-xl border border-neon-yellow/30 text-neon-yellow hover:border-neon-yellow/50 hover:text-white transition-colors"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </Link>
                  <button 
                    type="button"
                    className="p-3 glass rounded-xl border border-neon-red/30 text-neon-red hover:border-neon-red/50 hover:text-white transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
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
              transition={{ duration: 0.4, delay: 0.1 }}
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

            {/* 社交互动组件 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <PromptInteractions promptId={prompt.id} />
            </motion.div>

            {/* 评分和评论系统 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
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
              <h3 className="text-lg font-semibold text-white mb-6">变量设置</h3>
              
              <div className="space-y-6">
                {/* 输入变量 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2 text-neon-pink" />
                    输入变量
                  </h4>
                  {renderVariableInputs()}
                </div>
                
                {/* 兼容模型 */}
                {prompt.compatible_models && prompt.compatible_models.length > 0 && (
                  <div className="pt-4 border-t border-neon-cyan/20">
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <BoltIcon className="h-4 w-4 mr-2 text-neon-yellow" />
                      兼容模型
                    </h4>
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
                  </div>
                )}

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
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="pt-4 border-t border-neon-cyan/20">
                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-neon-cyan" />
                      标签
                    </h4>
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
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="pt-4 border-t border-neon-cyan/20">
                  <Link 
                    href={`/analytics/${prompt.id}`}
                    className="w-full btn-secondary flex items-center justify-center group hover:bg-neon-purple/20 hover:border-neon-purple/50 transition-all duration-300"
                    title="查看详细性能分析"
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2 group-hover:text-neon-purple transition-colors duration-300" />
                    <span className="group-hover:text-neon-purple transition-colors duration-300">性能分析</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  
  try {
    const promptDetails = await getPromptDetails(id);
    
    return {
      props: {
        prompt: promptDetails,
      },
    };
  } catch (error) {
    console.error(`获取提示词 ${id} 详情失败:`, error);
    
    return {
      notFound: true,
    };
  }
};
