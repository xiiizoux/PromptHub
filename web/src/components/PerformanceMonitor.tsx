import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPromptQualityAnalysis } from '@/lib/api';
import { PromptQualityAnalysis } from '@/types/performance';

interface PerformanceMonitorProps {
  promptId: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ promptId }) => {
  const [analysis, setAnalysis] = useState<PromptQualityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取质量分析数据
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
        <h3 className="text-lg font-semibold text-white mb-4">质量分析</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">正在分析质量...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">质量分析</h3>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="text-neon-cyan hover:text-neon-purple transition-colors"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-neon-green';
    if (score >= 70) return 'text-neon-cyan';
    if (score >= 55) return 'text-neon-yellow';
    return 'text-neon-pink';
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '中等';
      default: return '需要改进';
    }
  };

  return (
    <div className="glass rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">质量分析</h3>
        <Link 
          href={`/analytics/${promptId}`}
          className="text-neon-cyan hover:text-neon-purple transition-colors text-sm"
        >
          查看详情 →
        </Link>
      </div>
      
      {analysis ? (
        <div className="space-y-4">
          {/* 总体质量评分 */}
          <div className="bg-dark-bg-secondary/50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-400 mb-2">总体质量评分</div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)} mb-1`}>
              {analysis.overallScore}分
            </div>
            <div className="text-sm text-gray-400">
              {getLevelText(analysis.level)}
            </div>
          </div>
          
          {/* 各维度简要显示 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(analysis.dimensions).map(([key, dimension]) => (
              <div key={key} className="flex justify-between items-center bg-dark-bg-secondary/30 rounded p-2">
                <span className="text-gray-400">{dimension.name}</span>
                <span className={getScoreColor(dimension.score)}>
                  {dimension.score}分
                </span>
              </div>
            ))}
          </div>
          
          {/* 排名信息 */}
          <div className="bg-dark-bg-secondary/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400">
              在{analysis.comparisonWithCategory.totalInCategory}个同类提示词中排名
            </div>
            <div className="text-lg font-bold text-neon-cyan">
              第{analysis.comparisonWithCategory.ranking}位
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">暂无质量分析数据</div>
          <div className="text-sm text-gray-500">点击上方查看详情进行分析</div>
        </div>
      )}
    </div>
  );
};

export { PerformanceMonitor };
export default PerformanceMonitor; 