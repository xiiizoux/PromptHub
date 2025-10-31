import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  ArrowLeftIcon,
  DocumentPlusIcon,
  BookmarkIcon,
  CpuChipIcon,
  CommandLineIcon,
  ChartBarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  CircleStackIcon,
  BoltIcon,
  CubeTransparentIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import PromptOptimizerComponent from '@/components/PromptOptimizerComponent';
import { createPrompt } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// 动态导入3D组件，避免SSR问题
const ThreeScene = dynamic(() => import('@/components/ui/ThreeScene'), { ssr: false });

const OptimizerPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  // 移除不再需要的保存状态
  // const [isSaving, setIsSaving] = useState(false);

  const handleOptimizedPrompt = (prompt: string) => {
    setOptimizedPrompt(prompt);
  };

  const handleSaveAsNewPrompt = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!optimizedPrompt.trim()) {
      toast.error('没有可保存的优化结果');
      return;
    }

    // 构建URL参数 - 只传递优化后的内容
    const params = new URLSearchParams({
      optimizedContent: encodeURIComponent(optimizedPrompt),
    });
    
    // 跳转到创建提示词页面
    router.push(`/create?${params.toString()}`);
    toast.success(t('pages.optimizer.analysis.redirecting'));
  };

  // 添加智能分析后填充到创建提示词页面的功能
  const handleSaveWithAnalysis = async () => {
    if (!user) {
      toast.error(t('pages.optimizer.errors.login_required'));
      return;
    }

    if (!optimizedPrompt.trim()) {
      toast.error(t('pages.optimizer.errors.no_optimized_result'));
      return;
    }

    // 显示即将填充的内容预览
    const contentPreview = optimizedPrompt.substring(0, 100) + (optimizedPrompt.length > 100 ? '...' : '');
    const confirmed = window.confirm(
      t('pages.optimizer.analysis.confirm_message', { content: contentPreview })
    );

    if (!confirmed) {
      return;
    }

    try {
      toast.loading(t('pages.optimizer.analysis.analyzing'), { id: 'ai-analysis' });
      
      // 调用AI分析API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: optimizedPrompt,
          action: 'full_analyze',
          config: {
            language: 'zh',
            includeImprovements: true,
            includeSuggestions: true,
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const analysisResult = result.data;
        toast.success(t('pages.optimizer.analysis.analysis_complete'), { id: 'ai-analysis' });
        
        // 构建URL参数，包含AI分析结果
        const suggestedName = analysisResult.suggestedTitle || `优化提示词_${new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
        
        const suggestedDesc = analysisResult.description || '通过AI优化生成的提示词，经过智能分析和结构化优化处理';
        
        const params = new URLSearchParams({
          optimizedContent: encodeURIComponent(optimizedPrompt),
          suggestedName: encodeURIComponent(suggestedName),
          suggestedDesc: encodeURIComponent(suggestedDesc),
          aiAnalysisResult: encodeURIComponent(JSON.stringify(analysisResult)),
        });
        
        // 跳转到创建提示词页面
        router.push(`/create?${params.toString()}`);
        toast.success(t('pages.optimizer.analysis.redirecting'));
      } else {
        throw new Error(result.error || 'AI分析失败');
      }
    } catch (error: any) {
      console.error('AI分析失败:', error);
      toast.error(`${t('pages.optimizer.analysis.analysis_failed')}: ${error.message}`, { id: 'ai-analysis' });
      // 作为后备，使用普通的填充方式
      handleSaveAsNewPrompt();
    }
  };

  const features = [
    {
      icon: SparklesIcon,
      title: t('pages.optimizer.features.smart_optimization.title'),
      description: t('pages.optimizer.features.smart_optimization.description'),
      color: 'from-neon-cyan to-neon-cyan-dark',
      stats: t('pages.optimizer.features.smart_optimization.stats'),
    },
    {
      icon: CpuChipIcon,
      title: t('pages.optimizer.features.iterative_improvement.title'),
      description: t('pages.optimizer.features.iterative_improvement.description'),
      color: 'from-neon-purple to-neon-pink',
      stats: t('pages.optimizer.features.iterative_improvement.stats'),
    },
    {
      icon: ChartBarIcon,
      title: t('pages.optimizer.features.quality_analysis.title'),
      description: t('pages.optimizer.features.quality_analysis.description'),
      color: 'from-neon-yellow to-neon-green',
      stats: t('pages.optimizer.features.quality_analysis.stats'),
    },
  ];

  const stats = [
    { label: t('pages.optimizer.stats.success_rate'), value: '98%', icon: RocketLaunchIcon },
    { label: t('pages.optimizer.stats.processing_speed'), value: '<3s', icon: BoltIcon },
    { label: t('pages.optimizer.stats.optimization_types'), value: '4种', icon: CircleStackIcon },
  ];

  return (
    <>
      <Head>
        <title>AI提示词优化器 | PromptHub</title>
        <meta name="description" content="使用AI技术优化您的提示词，提升效果和准确性" />
      </Head>

      <div className="min-h-screen relative overflow-hidden">
        {/* 3D背景 */}
        <div className="absolute inset-0 z-0">
          <ThreeScene />
        </div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg-primary/80 via-dark-bg-primary/90 to-dark-bg-primary z-1" />
        
        {/* 动态粒子背景 */}
        <div className="absolute inset-0 z-2">
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full px-4 unified-page-spacing">
          {/* 英雄区域 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="unified-page-title-container"
          >
            {optimizedPrompt && (
              <div className="flex justify-end mb-8 space-x-4">
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleSaveAsNewPrompt}
                  disabled={!user || !optimizedPrompt.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-purple/80 to-neon-pink/80 hover:from-neon-purple hover:to-neon-pink text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <>
                    <DocumentPlusIcon className="h-4 w-4" />
                    <span>{t('pages.optimizer.actions.fill_to_create')}</span>
                  </>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={handleSaveWithAnalysis}
                  disabled={!user || !optimizedPrompt.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-blue/80 to-neon-cyan/80 hover:from-neon-blue hover:to-neon-cyan text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <>
                    <BeakerIcon className="h-4 w-4" />
                    <span>{t('pages.optimizer.actions.analyze_and_fill')}</span>
                  </>
                </motion.button>
              </div>
            )}

            {/* 主标题区域 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center justify-center mb-2"
            >
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue mr-2">
                <SparklesIcon className="unified-page-title-icon" />
              </div>
              <h1 className="unified-page-title">
                {t('pages.optimizer.title')}
              </h1>
            </motion.div>

            {/* 简要描述 */}
            <motion.p
              className="unified-page-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t('pages.optimizer.subtitle')}
            </motion.p>
          </motion.div>

          {/* 功能卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12 w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="glass rounded-2xl p-8 border border-gray-700/30 hover:border-neon-cyan/40 transition-all duration-500 group"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -10 }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 text-center">{feature.title}</h3>
                    <p className="text-gray-400 text-center mb-4 leading-relaxed">{feature.description}</p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-sm font-medium">
                        {feature.stats}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* 优化器组件 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16 w-full"
          >
            <PromptOptimizerComponent
              onOptimizedPrompt={handleOptimizedPrompt}
              className="w-full"
            />
          </motion.div>

          {/* 使用指南 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-2xl p-8 border border-gray-700/30 max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold gradient-text mb-4 flex items-center justify-center">
                <LightBulbIcon className="h-6 w-6 text-neon-yellow mr-3" />
                {t('pages.optimizer.usage_guide.title')}
              </h3>
              <p className="text-gray-400">{t('pages.optimizer.usage_guide.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center mb-4">
                  <SparklesIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  {t('pages.optimizer.usage_guide.optimization_tips.title')}
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const tips = t('pages.optimizer.usage_guide.optimization_tips.tips', { returnObjects: true });
                    return Array.isArray(tips) ? tips : [];
                  })().map((tip: string, index: number) => (
                    <motion.div
                      key={index}
                      className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3" />
                      {tip}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center mb-4">
                  <CommandLineIcon className="h-5 w-5 text-neon-green mr-2" />
                  {t('pages.optimizer.usage_guide.configuration.title')}
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const items = t('pages.optimizer.usage_guide.configuration.items', { returnObjects: true });
                    return Array.isArray(items) ? items : [];
                  })().map((config: string, index: number) => (
                    <motion.div
                      key={index}
                      className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-neon-green rounded-full mr-3" />
                      {config}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #22d3ee, #a855f7);
          border-radius: 50%;
          animation: float linear infinite;
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .animate-text-shimmer {
          background: linear-gradient(
            110deg,
            #22d3ee 45%,
            #a855f7 55%,
            #22d3ee 65%
          );
          background-size: 200% 100%;
          animation: text-shimmer 3s ease-in-out infinite;
        }

        @keyframes text-shimmer {
          0%, 100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
};

export default OptimizerPage; 