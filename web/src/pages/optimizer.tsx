import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  ArrowLeftIcon,
  DocumentPlusIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import PromptOptimizerComponent from '@/components/PromptOptimizerComponent';
import { createPrompt } from '@/lib/api';
import toast from 'react-hot-toast';

const OptimizerPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

    setIsSaving(true);
    try {
      const promptData = {
        name: `优化提示词_${Date.now()}`,
        description: '通过AI优化生成的提示词',
        messages: [
          {
            role: 'user' as const,
            content: optimizedPrompt
          }
        ],
        category: 'general',
        tags: ['AI优化', '自动生成'],
        is_public: false
      };

      await createPrompt(promptData);
      toast.success('优化结果已保存为新提示词！');
      
      // 跳转到提示词列表
      router.push('/prompts');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI提示词优化器 | PromptHub</title>
        <meta name="description" content="使用AI技术优化您的提示词，提升效果和准确性" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-neon-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neon-green/5 rounded-full blur-3xl" />
        </div>

        {/* 动态网格背景 */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid-background"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* 头部 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <SparklesIcon className="h-8 w-8 text-neon-cyan mr-3" />
                  AI提示词优化器
                </h1>
                <p className="text-gray-400 mt-1">
                  让AI帮助您优化提示词，提升效果和准确性
                </p>
              </div>
            </div>

            {optimizedPrompt && (
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveAsNewPrompt}
                  disabled={isSaving || !user}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-green/80 hover:to-neon-cyan/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <DocumentPlusIcon className="h-4 w-4" />
                      <span>保存为新提示词</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* 功能说明卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 mb-8 border border-neon-blue/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-neon-cyan rounded-lg flex items-center justify-center mx-auto mb-3">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">智能优化</h3>
                <p className="text-sm text-gray-400">
                  AI分析您的提示词结构和内容，提供专业的优化建议和改进版本
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ArrowLeftIcon className="h-6 w-6 text-white transform rotate-180" />
                </div>
                <h3 className="font-semibold text-white mb-2">迭代改进</h3>
                <p className="text-sm text-gray-400">
                  根据您的具体需求，对已优化的提示词进行精细调整和进一步改进
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-yellow to-neon-orange rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BookmarkIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">质量分析</h3>
                <p className="text-sm text-gray-400">
                  多维度评估提示词质量，包括清晰性、具体性、完整性等关键指标
                </p>
              </div>
            </div>
          </motion.div>

          {/* 优化器组件 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PromptOptimizerComponent
              onOptimizedPrompt={handleOptimizedPrompt}
              className="max-w-4xl mx-auto"
            />
          </motion.div>

          {/* 使用提示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 glass rounded-2xl p-6 border border-gray-700/30"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 text-neon-yellow mr-2" />
              使用提示
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-white mb-2">💡 优化技巧</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 提供足够的上下文信息</li>
                  <li>• 明确指定期望的输出格式</li>
                  <li>• 使用具体而非抽象的描述</li>
                  <li>• 包含相关的示例或约束条件</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">🔧 配置说明</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 需要配置OpenAI API密钥</li>
                  <li>• 支持多种优化类型选择</li>
                  <li>• 可添加特殊要求或约束</li>
                  <li>• 优化结果可直接保存使用</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .grid-background {
          background-image: 
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
      `}</style>
    </>
  );
};

export default OptimizerPage; 