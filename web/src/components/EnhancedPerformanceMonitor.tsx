import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  InformationCircleIcon, 
  TrophyIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClockIcon,
  SparklesIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { getPromptQualityAnalysis } from '@/lib/api';
import { PromptQualityAnalysis } from '@/types/performance';
import { useUserLevel, UserLevel } from '@/hooks/useUserLevel';

interface EnhancedPerformanceMonitorProps {
  promptId: string;
  showExplanations?: boolean;
  userLevel?: UserLevel;
}

// 性能解释组件
const PerformanceExplanation: React.FC<{
  type: 'score' | 'dimension' | 'ranking' | 'improvement';
  score?: number;
  dimension?: string;
  ranking?: number;
  level: UserLevel;
}> = ({ type, score, dimension, ranking, level }) => {
  const getExplanation = () => {
    if (level === 'beginner') {
      switch (type) {
        case 'score':
          if (score && score >= 85) return '🎉 太棒了！您的提示词质量非常高，AI能很好地理解并执行您的指令。';
          if (score && score >= 70) return '👍 不错！您的提示词质量良好，继续保持这种水平。';
          if (score && score >= 55) return '📈 还可以！有一些改进空间，可以让AI更好地理解您的需求。';
          return '💪 继续加油！通过一些简单的调整可以大幅提升效果。';
        case 'dimension':
          switch (dimension) {
            case 'clarity': return '清晰度指AI是否能准确理解您想要什么。分数越高，AI越不会搞错。';
            case 'completeness': return '完整性指您是否提供了足够的信息。就像问路时要说清楚目的地一样。';
            case 'professionalism': return '专业性指提示词是否用词得当、逻辑清晰，就像写正式邮件一样。';
            case 'actionability': return '可操作性指AI能否根据您的指令采取具体行动，而不是只能泛泛而谈。';
            default: return '这个维度影响AI理解和执行您指令的能力。';
          }
        case 'ranking':
          if (ranking && ranking <= 10) return '🏆 您在同类提示词中排名前10！这说明您的提示词非常优秀。';
          if (ranking && ranking <= 30) return '🥇 您在同类提示词中表现很好，继续保持！';
          return '📊 这是您在同类提示词中的排名位置，可以参考排名更高的提示词学习。';
        case 'improvement':
          return '💡 系统为您分析了提升空间，这些建议都很实用，建议优先处理。';
      }
    } else if (level === 'intermediate') {
      switch (type) {
        case 'score':
          if (score && score >= 85) return '优秀的提示词设计！各项指标均达到高水平，可作为最佳实践参考。';
          if (score && score >= 70) return '良好的质量水平，建议重点关注得分较低的维度进行优化。';
          return '有较大优化空间，建议系统性地改进提示词结构和内容。';
        case 'dimension':
          return `${dimension}维度反映了提示词在该方面的表现，可通过对比分析找出改进方向。`;
        case 'ranking':
          return '相对排名帮助您了解提示词在同类中的竞争力，可参考头部提示词的设计模式。';
        case 'improvement':
          return '基于数据分析生成的优化建议，建议结合A/B测试验证改进效果。';
      }
    } else {
      switch (type) {
        case 'score':
          return `Quality Score: ${score}/100. Calculated using weighted metrics across multiple dimensions with statistical confidence intervals.`;
        case 'dimension':
          return `Performance dimension analyzed using ML-based scoring with comparative benchmarking against category baselines.`;
        case 'ranking':
          return `Percentile ranking based on multi-variate analysis of performance metrics within category cohort.`;
        case 'improvement':
          return `Data-driven optimization recommendations generated using performance correlation analysis and best practice patterns.`;
      }
    }
    return '';
  };

  return (
    <div className="mt-2 p-3 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/30">
      <div className="flex items-start gap-2">
        <InformationCircleIcon className="h-4 w-4 text-neon-cyan flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-300 leading-relaxed">{getExplanation()}</p>
      </div>
    </div>
  );
};

// 性能趋势组件
const PerformanceTrend: React.FC<{
  data: PromptQualityAnalysis;
  userLevel: UserLevel;
}> = ({ data, userLevel }) => {
  const getTrendInsight = () => {
    if (userLevel === 'beginner') {
      if (data.overallScore >= 85) {
        return {
          icon: <TrophyIcon className="h-5 w-5 text-yellow-400" />,
          title: '您的提示词很优秀！',
          description: '继续保持这种质量，可以尝试创建更多类似的提示词。',
          color: 'text-yellow-400'
        };
      } else if (data.overallScore >= 70) {
        return {
          icon: <FireIcon className="h-5 w-5 text-orange-400" />,
          title: '您正在进步！',
          description: '提示词质量不错，再优化几个细节就能达到优秀水平。',
          color: 'text-orange-400'
        };
      } else {
        return {
          icon: <LightBulbIcon className="h-5 w-5 text-blue-400" />,
          title: '学习机会来了！',
          description: '每个专家都是从新手开始的，按照建议改进就能快速提升。',
          color: 'text-blue-400'
        };
      }
    } else {
      return {
        icon: <ChartBarIcon className="h-5 w-5 text-neon-cyan" />,
        title: '性能分析',
        description: '基于多维度评估的综合性能报告',
        color: 'text-neon-cyan'
      };
    }
  };

  const insight = getTrendInsight();

  return (
    <div className="bg-dark-bg-secondary/50 rounded-lg p-4 border border-gray-700/30">
      <div className="flex items-center gap-3 mb-3">
        {insight.icon}
        <div>
          <h4 className={`font-medium ${insight.color}`}>{insight.title}</h4>
          <p className="text-sm text-gray-400">{insight.description}</p>
        </div>
      </div>
    </div>
  );
};

const EnhancedPerformanceMonitor: React.FC<EnhancedPerformanceMonitorProps> = ({ 
  promptId, 
  showExplanations = true,
  userLevel: propUserLevel
}) => {
  const { userLevel: hookUserLevel } = useUserLevel();
  const userLevel = propUserLevel || hookUserLevel;
  
  const [analysis, setAnalysis] = useState<PromptQualityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'suggestions'>('overview');

  useEffect(() => {
    const fetchQualityData = async () => {
      try {
        setLoading(true);
        setError(null);
        const qualityData = await getPromptQualityAnalysis(promptId);
        setAnalysis(qualityData);
      } catch (err) {
        console.error('获取质量分析失败:', err);
        setError('获取质量分析失败');
      } finally {
        setLoading(false);
      }
    };

    if (promptId) {
      fetchQualityData();
    }
  }, [promptId]);

  if (loading) {
    return (
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">智能质量分析</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">AI正在分析您的提示词...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">智能质量分析</h3>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <div className="text-red-400 mb-2">{error}</div>
          {userLevel === 'beginner' && (
            <p className="text-sm text-gray-500 mb-4">
              别担心，这可能是网络问题。点击重试或稍后再试。
            </p>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            重新分析
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-yellow-500 to-amber-500';
    if (score >= 55) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const getLevelText = (level: string) => {
    const levels = {
      'excellent': userLevel === 'beginner' ? '🌟 太棒了' : '优秀',
      'good': userLevel === 'beginner' ? '👍 很好' : '良好',
      'fair': userLevel === 'beginner' ? '📈 还不错' : '中等',
      'poor': userLevel === 'beginner' ? '💪 待改进' : '需要改进'
    };
    return levels[level as keyof typeof levels] || level;
  };

  return (
    <div className="glass rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-neon-cyan" />
          {userLevel === 'beginner' ? '我的提示词得分' : '智能质量分析'}
        </h3>
        <Link 
          href={`/analytics/${promptId}`}
          className="text-neon-cyan hover:text-neon-purple transition-colors text-sm"
        >
          查看详情 →
        </Link>
      </div>
      
      {analysis && (
        <div className="space-y-6">
          {/* 标签导航 */}
          <div className="flex space-x-1 bg-dark-bg-secondary/50 rounded-lg p-1">
            {[
              { key: 'overview', label: userLevel === 'beginner' ? '总体评分' : '概览' },
              { key: 'dimensions', label: userLevel === 'beginner' ? '各项得分' : '维度分析' },
              { key: 'suggestions', label: userLevel === 'beginner' ? '改进建议' : '优化建议' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-neon-cyan text-dark-bg-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 概览面板 */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* 总体质量评分 */}
              <div className={`bg-gradient-to-r ${getScoreGradient(analysis.overallScore)} rounded-lg p-6 text-center`}>
                <div className="text-sm text-white/80 mb-2">
                  {userLevel === 'beginner' ? '您的总分' : '总体质量评分'}
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {analysis.overallScore}分
                </div>
                <div className="text-sm text-white/90">
                  {getLevelText(analysis.level)}
                </div>
              </div>

              {showExplanations && (
                <PerformanceExplanation 
                  type="score" 
                  score={analysis.overallScore} 
                  level={userLevel}
                />
              )}

              {/* 性能趋势 */}
              <PerformanceTrend data={analysis} userLevel={userLevel} />

              {/* 排名信息 */}
              <div className="bg-dark-bg-secondary/30 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">
                  {userLevel === 'beginner' ? '在同类提示词中的排名' : '类别排名'}
                </div>
                <div className="text-xl font-bold text-neon-cyan">
                  第{analysis.comparisonWithCategory.ranking}位
                </div>
                <div className="text-xs text-gray-500">
                  共{analysis.comparisonWithCategory.totalInCategory}个提示词
                </div>
              </div>

              {showExplanations && (
                <PerformanceExplanation 
                  type="ranking" 
                  ranking={analysis.comparisonWithCategory.ranking}
                  level={userLevel}
                />
              )}
            </motion.div>
          )}

          {/* 维度分析面板 */}
          {activeTab === 'dimensions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {Object.entries(analysis.dimensions).map(([key, dimension]) => (
                <div key={key} className="bg-dark-bg-secondary/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{dimension.name}</span>
                    <span className={`font-bold ${getScoreColor(dimension.score)}`}>
                      {dimension.score}分
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={`bg-gradient-to-r ${getScoreGradient(dimension.score)} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${dimension.score}%` }}
                    ></div>
                  </div>

                  {showExplanations && userLevel === 'beginner' && (
                    <PerformanceExplanation 
                      type="dimension" 
                      dimension={key}
                      level={userLevel}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* 优化建议面板 */}
          {activeTab === 'suggestions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* 优势 */}
              {analysis.strengths.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                    <TrophyIcon className="h-4 w-4" />
                    {userLevel === 'beginner' ? '做得很好的地方' : '优势'}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改进建议 */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                  <LightBulbIcon className="h-4 w-4" />
                  {userLevel === 'beginner' ? '改进小贴士' : '优化建议'}
                </h4>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-1 font-bold">{index + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {showExplanations && (
                <PerformanceExplanation 
                  type="improvement" 
                  level={userLevel}
                />
              )}

              {/* 需要改进的地方 */}
              {analysis.weaknesses.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h4 className="text-orange-400 font-medium mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {userLevel === 'beginner' ? '可以改进的地方' : '待改进项'}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-orange-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedPerformanceMonitor; 