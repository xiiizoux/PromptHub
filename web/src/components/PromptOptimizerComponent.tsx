import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import {
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  DocumentPlusIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  OptimizationRequest,
  OptimizationResult,
  IterationRequest,
  optimizePrompt,
  iteratePrompt,
  analyzePrompt
} from '@/lib/prompt-optimizer';
import { AIAnalyzeButton, AIAnalysisResultDisplay } from '@/components/AIAnalyzeButton';
import { AIAnalysisResult } from '@/lib/ai-analyzer';
import toast from 'react-hot-toast';

interface PromptOptimizerProps {
  initialPrompt?: string;
  onOptimizedPrompt?: (prompt: string) => void;
  className?: string;
}

export const PromptOptimizerComponent: React.FC<PromptOptimizerProps> = ({
  initialPrompt = '',
  onOptimizedPrompt,
  className = ''
}) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'iterate' | 'analyze'>('optimize');
  const [optimizationType, setOptimizationType] = useState<OptimizationRequest['type']>('general');
  const [requirements, setRequirements] = useState('');
  const [iterationRequirements, setIterationRequirements] = useState('');
  const [iterationType, setIterationType] = useState<IterationRequest['type']>('refine');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [analysisScore, setAnalysisScore] = useState<OptimizationResult['score'] | null>(null);
  
  // 添加智能分析相关状态
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAiAnalysisResult, setShowAiAnalysisResult] = useState(false);

  // 同步外部prompt变化
  useEffect(() => {
    if (initialPrompt !== prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // 当提示词改变时，清空之前的分析结果
  useEffect(() => {
    if (prompt.trim() && prompt.length > 10) {
      // 如果在分析标签页，自动分析
      if (activeTab === 'analyze') {
        handleAnalyze();
      }
    } else {
      setAnalysisScore(null);
    }
  }, [prompt, activeTab]);

  const handleOptimize = async () => {
    if (!prompt.trim()) {
      toast.error('请输入要优化的提示词');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimizationResult = await optimizePrompt(
        prompt,
        requirements || undefined,
        optimizationType
      );

      if (optimizationResult) {
        setResult(optimizationResult);
        setOptimizedPrompt(optimizationResult.optimizedPrompt);
        onOptimizedPrompt?.(optimizationResult.optimizedPrompt);
        toast.success('提示词优化完成！');
      } else {
        toast.error('优化失败：请检查API配置');
      }
    } catch (error) {
      console.error('优化失败:', error);
      toast.error(`优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleIterate = async () => {
    if (!prompt.trim() || !optimizedPrompt.trim()) {
      toast.error('请先优化提示词');
      return;
    }

    if (!iterationRequirements.trim()) {
      toast.error('请输入迭代要求');
      return;
    }

    setIsIterating(true);
    try {
      const iteratedPrompt = await iteratePrompt(
        prompt,
        optimizedPrompt,
        iterationRequirements,
        iterationType
      );

      if (iteratedPrompt) {
        setOptimizedPrompt(iteratedPrompt);
        onOptimizedPrompt?.(iteratedPrompt);
        toast.success('迭代优化完成！');
        setIterationRequirements('');
      } else {
        toast.error('迭代失败：请检查API配置');
      }
    } catch (error) {
      console.error('迭代失败:', error);
      toast.error(`迭代失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsIterating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error('请输入要分析的提示词');
      return;
    }

    setIsAnalyzing(true);
    try {
      const score = await analyzePrompt(prompt);
      if (score) {
        setAnalysisScore(score);
        // 如果当前有结果，也更新结果中的评分
        if (result) {
          setResult({
            ...result,
            score
          });
        }
        toast.success('质量分析完成！');
      } else {
        toast.error('分析失败：请检查API配置');
      }
    } catch (error) {
      console.error('分析失败:', error);
      toast.error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已复制到剪贴板');
    });
  };

  // 添加填充到创建提示词的方法
  const fillToCreatePrompt = () => {
    const suggestedName = `优化提示词_${new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    const suggestedDesc = '通过AI优化生成的提示词，经过智能分析和结构化优化处理';
    
    // 构建URL参数
    const params = new URLSearchParams({
      optimizedContent: encodeURIComponent(optimizedPrompt),
      suggestedName: encodeURIComponent(suggestedName),
      suggestedDesc: encodeURIComponent(suggestedDesc)
    });
    
    // 如果有AI分析结果，也添加到URL参数中
    if (aiAnalysisResult) {
      params.append('aiAnalysisResult', encodeURIComponent(JSON.stringify(aiAnalysisResult)));
    }
    
    // 跳转到创建提示词页面
    router.push(`/create?${params.toString()}`);
    toast.success('正在跳转到创建提示词页面...');
  };

  // 处理AI分析完成
  const handleAIAnalysisComplete = (result: Partial<AIAnalysisResult>) => {
    console.log('优化器收到AI分析结果:', result);
    
    if (result as AIAnalysisResult) {
      setAiAnalysisResult(result as AIAnalysisResult);
      setShowAiAnalysisResult(true);
      toast.success('智能分析完成！');
    }
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${(value / 10) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm font-medium text-white w-8">{value.toFixed(1)}</span>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 导航标签 */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
        {[
          { key: 'optimize', label: '智能优化', icon: SparklesIcon },
          { key: 'iterate', label: '迭代改进', icon: ArrowPathIcon },
          { key: 'analyze', label: '质量分析', icon: ChartBarIcon }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 原始提示词输入 */}
      <div className="glass rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <LightBulbIcon className="h-5 w-5 text-neon-yellow mr-2" />
            原始提示词
          </h3>
          {result?.score && (
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(result.score.overall / 2)
                        ? 'text-neon-yellow'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {result.score.overall.toFixed(1)}/10
              </span>
            </div>
          )}
        </div>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="在这里输入您想要优化的提示词..."
          className="w-full h-32 bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20 resize-none"
        />
      </div>

      {/* 优化配置和操作区 */}
      <AnimatePresence mode="wait">
        {activeTab === 'optimize' && (
          <motion.div
            key="optimize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-green/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 text-neon-green mr-2" />
              智能优化
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  优化类型
                </label>
                <select
                  value={optimizationType}
                  onChange={(e) => setOptimizationType(e.target.value as OptimizationRequest['type'])}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-green/50"
                >
                  <option value="general">通用优化</option>
                  <option value="specific">专业特定</option>
                  <option value="creative">创意写作</option>
                  <option value="analytical">分析推理</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  特殊要求 (可选)
                </label>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="例如：更加简洁、包含示例等"
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green/50"
                />
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !prompt.trim()}
              className="w-full bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-green/80 hover:to-neon-cyan/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>正在优化...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>开始优化</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {activeTab === 'iterate' && (
          <motion.div
            key="iterate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-purple/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-neon-purple mr-2" />
              迭代改进
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  迭代类型
                </label>
                <select
                  value={iterationType}
                  onChange={(e) => setIterationType(e.target.value as IterationRequest['type'])}
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-purple/50"
                >
                  <option value="refine">精细调整</option>
                  <option value="expand">扩展内容</option>
                  <option value="simplify">简化表达</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  迭代要求 *
                </label>
                <input
                  type="text"
                  value={iterationRequirements}
                  onChange={(e) => setIterationRequirements(e.target.value)}
                  placeholder="描述具体的改进需求..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-purple/50"
                />
              </div>
            </div>

            <button
              onClick={handleIterate}
              disabled={isIterating || !optimizedPrompt.trim() || !iterationRequirements.trim()}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isIterating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>正在迭代...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  <span>开始迭代</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {activeTab === 'analyze' && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-neon-yellow/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-neon-yellow mr-2" />
              质量分析
            </h3>

            {/* 分析按钮 */}
            <div className="mb-6">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !prompt.trim()}
                className="w-full bg-gradient-to-r from-neon-yellow to-neon-orange hover:from-neon-yellow/80 hover:to-neon-orange/80 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <ChartBarIcon className="h-5 w-5 animate-spin" />
                    <span>正在分析...</span>
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-5 w-5" />
                    <span>开始质量分析</span>
                  </>
                )}
              </button>
            </div>

            {/* 分析结果显示 */}
            {(analysisScore || result?.score) && (
              <div className="space-y-4">
                <ScoreBar 
                  label="清晰性" 
                  value={(analysisScore || result?.score)?.clarity || 0} 
                  color="bg-gradient-to-r from-neon-green to-neon-cyan" 
                />
                <ScoreBar 
                  label="具体性" 
                  value={(analysisScore || result?.score)?.specificity || 0} 
                  color="bg-gradient-to-r from-neon-cyan to-neon-blue" 
                />
                <ScoreBar 
                  label="完整性" 
                  value={(analysisScore || result?.score)?.completeness || 0} 
                  color="bg-gradient-to-r from-neon-purple to-neon-pink" 
                />
                <ScoreBar 
                  label="综合评分" 
                  value={(analysisScore || result?.score)?.overall || 0} 
                  color="bg-gradient-to-r from-neon-yellow to-neon-orange" 
                />
              </div>
            )}

            {/* 改进建议 */}
            {result?.suggestions && result.suggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 text-neon-yellow mr-2" />
                  改进建议
                </h4>
                <div className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-yellow mt-2 flex-shrink-0" />
                      <span className="text-gray-300">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 如果没有分析结果，显示提示 */}
            {!analysisScore && !result?.score && !isAnalyzing && (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">
                  {prompt.trim() ? '点击上方按钮开始分析提示词质量' : '请先在上方输入要分析的提示词'}
                </p>
                <p className="text-sm text-gray-500">
                  分析将从清晰性、具体性、完整性等维度评估您的提示词
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 优化结果显示 */}
      {optimizedPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-neon-cyan/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-neon-green mr-2" />
              优化结果
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(optimizedPrompt)}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-colors"
                title="复制优化结果"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPrompt(optimizedPrompt)}
                className="p-2 rounded-lg bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan transition-colors"
                title="应用优化结果"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </button>
              
              {/* 智能分析按钮 */}
              <AIAnalyzeButton
                content={optimizedPrompt}
                onAnalysisComplete={handleAIAnalysisComplete}
                variant="full"
                className="!px-3 !py-2 !text-sm"
              />
              
              <button
                onClick={fillToCreatePrompt}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 text-white transition-all duration-200 shadow-lg hover:shadow-neon"
                title="填充到创建提示词页面"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">创建提示词</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
            <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {optimizedPrompt}
            </pre>
          </div>

          {result?.improvements && result.improvements.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <SparklesIcon className="h-4 w-4 text-neon-green mr-2" />
                主要改进
              </h4>
              <div className="space-y-2">
                {result.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI智能分析结果显示 */}
          <AnimatePresence>
            {showAiAnalysisResult && aiAnalysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white flex items-center">
                    <BeakerIcon className="h-4 w-4 text-neon-blue mr-2" />
                    智能分析结果
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAiAnalysisResult(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="关闭智能分析结果"
                  >
                    ✕
                  </button>
                </div>
                
                <AIAnalysisResultDisplay
                  result={aiAnalysisResult}
                  onApplyResults={(data) => {
                    // 在优化器中，我们暂时只显示分析结果
                    // 实际应用会在创建提示词页面进行
                    console.log('AI分析结果将在创建提示词页面应用:', data);
                    toast.success('分析结果将在创建提示词时自动应用');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default PromptOptimizerComponent; 