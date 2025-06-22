import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { PromptQualityAnalysis } from '@/types/performance';

interface QualityAnalysisPanelProps {
  promptId: string;
  className?: string;
}

const QualityAnalysisPanel: React.FC<QualityAnalysisPanelProps> = ({ promptId, className = '' }) => {
  const [analysis, setAnalysis] = useState<PromptQualityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQualityAnalysis();
  }, [promptId]);

  const fetchQualityAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quality/analyze/${promptId}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.message || '获取质量分析失败');
      }
    } catch (err) {
      console.error('获取质量分析失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-neon-green';
    if (score >= 70) return 'text-neon-cyan';
    if (score >= 55) return 'text-neon-yellow';
    return 'text-neon-pink';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-neon-green/20 to-neon-green/5';
    if (score >= 70) return 'from-neon-cyan/20 to-neon-cyan/5';
    if (score >= 55) return 'from-neon-yellow/20 to-neon-yellow/5';
    return 'from-neon-pink/20 to-neon-pink/5';
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return <StarIcon className="h-6 w-6 text-neon-green" />;
      case 'good':
        return <CheckCircleIcon className="h-6 w-6 text-neon-cyan" />;
      case 'fair':
        return <ExclamationTriangleIcon className="h-6 w-6 text-neon-yellow" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-neon-pink" />;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'excellent':
        return '优秀';
      case 'good':
        return '良好';
      case 'fair':
        return '中等';
      default:
        return '需要改进';
    }
  };

  const DimensionBar: React.FC<{ name: string; score: number; description: string; suggestions?: string[] }> = ({
    name, score, description, suggestions = []
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{name}</span>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}分</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <motion.div
          className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      {suggestions && suggestions.length > 0 && (
        <div className="hidden group-hover:block bg-dark-bg-secondary/80 rounded-lg p-3 mt-2">
          <p className="text-xs font-medium text-neon-cyan mb-1">改进建议:</p>
          <ul className="text-xs text-gray-300 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`glass rounded-xl border border-neon-cyan/20 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">正在分析提示词质量...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className={`glass rounded-xl border border-neon-pink/20 p-6 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-neon-pink mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">分析失败</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchQualityAnalysis}
            className="btn-primary"
          >
            重新分析
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-xl border border-neon-cyan/20 overflow-hidden ${className}`}>
      {/* 标题区域 */}
      <div className="p-6 border-b border-neon-cyan/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-neon-cyan" />
            <h3 className="text-lg font-semibold text-white">质量分析</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchQualityAnalysis}
            className="text-xs text-neon-cyan hover:text-neon-purple transition-colors"
          >
            重新分析
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 总体评分 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${getScoreGradient(analysis.overallScore)} rounded-xl p-6 border border-neon-cyan/20`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {getLevelIcon(analysis.level)}
                <span className="text-lg font-semibold text-white">
                  总体质量: {getLevelText(analysis.level)}
                </span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}分
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>在{analysis.comparisonWithCategory.totalInCategory}个同类提示词中</div>
              <div className="text-neon-cyan">排名第{analysis.comparisonWithCategory.ranking}位</div>
            </div>
          </div>
        </motion.div>

        {/* 各维度评分 */}
        <div>
          <h4 className="text-md font-semibold text-white mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-neon-purple" />
            各维度评分
          </h4>
          <div className="space-y-4">
            {Object.entries(analysis.dimensions).map(([key, dimension], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DimensionBar
                  name={dimension.name}
                  score={dimension.score}
                  description={dimension.description}
                  suggestions={dimension.suggestions}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 优势和劣势 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 优势 */}
          {analysis.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-neon-green/10 border border-neon-green/20 rounded-lg p-4"
            >
              <h5 className="font-medium text-neon-green mb-3 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                优势
              </h5>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="text-neon-green mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* 劣势 */}
          {analysis.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-neon-yellow/10 border border-neon-yellow/20 rounded-lg p-4"
            >
              <h5 className="font-medium text-neon-yellow mb-3 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                待改进
              </h5>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="text-neon-yellow mr-2">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* 改进建议 */}
        {analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neon-purple/10 border border-neon-purple/20 rounded-lg p-4"
          >
            <h5 className="font-medium text-neon-purple mb-3 flex items-center">
              <LightBulbIcon className="h-4 w-4 mr-2" />
              改进建议
            </h5>
            <ul className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-neon-purple mr-2">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* 分析信息 */}
        <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span>分析时间: {new Date(analysis.metadata.analysisDate).toLocaleString('zh-CN')}</span>
            <span>分析版本: {analysis.metadata.modelVersion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { QualityAnalysisPanel };
export default QualityAnalysisPanel; 