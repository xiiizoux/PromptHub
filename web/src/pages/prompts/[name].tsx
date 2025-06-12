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
  ShareIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getPromptDetails, trackPromptUsage } from '@/lib/api';
import { PromptDetails, PromptExample, PromptVersion } from '@/types';

interface PromptDetailsPageProps {
  prompt: PromptDetails;
}

export default function PromptDetailsPage({ prompt }: PromptDetailsPageProps) {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState<string>(prompt.version?.toString() || '1');
  const [copied, setCopied] = useState(false);
  const [usageTracked, setUsageTracked] = useState(false);
  
  // 变量值状态管理
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [processedContent, setProcessedContent] = useState<string>('');

  // 初始化变量值
  useEffect(() => {
    if (prompt.input_variables) {
      const initialValues: Record<string, string> = {};
      prompt.input_variables.forEach(variable => {
        initialValues[variable] = `[${variable}]`;
      });
      setVariableValues(initialValues);
    }
  }, [prompt.input_variables]);

  // 实时更新内容
  useEffect(() => {
    let content = getVersionContent();
    
    // 替换变量
    Object.entries(variableValues).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value || `[${variable}]`);
    });
    
    setProcessedContent(content);
  }, [variableValues, selectedVersion]);

  // 获取当前选中版本的内容
  const getVersionContent = () => {
    if (!prompt.versions || prompt.versions.length === 0) {
      return prompt.content || '';
    }

    const version = prompt.versions.find(v => v.version.toString() === selectedVersion);
    return version ? version.content : prompt.content || '';
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
            prompt_id: prompt.name,
            version: parseInt(selectedVersion) || 1,
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
    // 分类映射表
    const categoryMap: Record<string, { color: string; icon: any }> = {
      '编程': { color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
      '代码': { color: 'from-neon-cyan to-neon-cyan-dark', icon: CodeBracketIcon },
      '创意写作': { color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      '写作': { color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      '文案': { color: 'from-neon-pink to-neon-yellow', icon: DocumentTextIcon },
      '数据分析': { color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
      '分析': { color: 'from-neon-yellow to-neon-green', icon: SparklesIcon },
      '通用': { color: 'from-neon-purple to-neon-blue', icon: SparklesIcon },
      '教育': { color: 'from-neon-green to-neon-yellow', icon: DocumentTextIcon },
      '商业': { color: 'from-neon-red to-neon-orange', icon: ChartBarIcon },
      '翻译': { color: 'from-neon-blue to-neon-cyan', icon: DocumentTextIcon },
    };
    
    const info = categoryMap[category || ''] || { 
      color: 'from-gray-600 to-gray-700', 
      icon: TagIcon 
    };
    
    return {
      name: category || '其他',
      ...info
    };
  };

  // 渲染评分星星
  const renderStars = (rating?: number) => {
    const stars = [];
    const ratingValue = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon 
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
              v{version.version} {version.notes ? `- ${version.notes}` : ''}
            </option>
          ))}
        </select>
      </motion.div>
    );
  };

  // 渲染变量输入区域
  const renderVariableInputs = () => {
    if (!prompt.input_variables || prompt.input_variables.length === 0) {
      return (
        <div className="text-sm text-gray-400 text-center py-8">
          此提示词没有输入变量
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {prompt.input_variables.map((variable) => (
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
                    className="p-3 glass rounded-xl border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan/50 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ShareIcon className="h-5 w-5" />
                  </motion.button>
                  <Link 
                    href={`/prompts/${prompt.name}/edit`}
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
                    版本 {prompt.version}
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
                      {prompt.compatible_models.map(model => (
                        <span 
                          key={model}
                          className="block px-3 py-2 rounded-lg text-sm glass border border-neon-green/30 text-neon-green"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="pt-4 border-t border-neon-cyan/20">
                  <Link 
                    href={`/analytics/${prompt.name}`}
                    className="w-full btn-secondary flex items-center justify-center"
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    性能分析
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
  const { name } = context.params as { name: string };
  
  try {
    const promptDetails = await getPromptDetails(name);
    
    return {
      props: {
        prompt: promptDetails,
      },
    };
  } catch (error) {
    console.error(`获取提示词 ${name} 详情失败:`, error);
    
    return {
      notFound: true,
    };
  }
};
