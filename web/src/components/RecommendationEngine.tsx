import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon,
  HeartIcon,
  EyeIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getRecommendations, 
  getTrendingPrompts,
  getSimilarPrompts,
  getPersonalizedRecommendations,
  RecommendationResult,
  RecommendationType, 
} from '@/lib/api';
import { PromptDetails } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RecommendationEngineProps {
  currentPromptId?: string;
  userId?: string;
  maxRecommendations?: number;
  className?: string;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  currentPromptId,
  userId,
  maxRecommendations = 12,
  className = '',
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<RecommendationType>('personalized');
  const [refreshKey, setRefreshKey] = useState(0);

  const recommendationTypes = [
    {
      type: 'personalized' as RecommendationType,
      label: '个性化推荐',
      icon: SparklesIcon,
      description: '基于您的使用习惯推荐',
      color: 'text-neon-cyan',
    },
    {
      type: 'similar' as RecommendationType,
      label: '相似推荐',
      icon: UserGroupIcon,
      description: '与当前提示词相似的内容',
      color: 'text-neon-purple',
    },
    {
      type: 'trending' as RecommendationType,
      label: '热门推荐',
      icon: ArrowTrendingUpIcon,
      description: '最受欢迎的提示词',
      color: 'text-neon-pink',
    },
    {
      type: 'collaborative' as RecommendationType,
      label: '协同推荐',
      icon: HeartIcon,
      description: '相似用户喜欢的内容',
      color: 'text-neon-yellow',
    },
  ];

  useEffect(() => {
    fetchRecommendations();
  }, [selectedType, currentPromptId, userId, refreshKey]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      let results: RecommendationResult[] = [];

      switch (selectedType) {
        case 'personalized':
          if (user) {
            results = await getPersonalizedRecommendations(user.id, maxRecommendations);
          } else {
            // 未登录用户显示热门推荐
            results = await getTrendingPrompts(maxRecommendations);
          }
          break;
        case 'similar':
          if (currentPromptId) {
            results = await getSimilarPrompts(currentPromptId, maxRecommendations);
          }
          break;
        case 'trending':
          results = await getTrendingPrompts(maxRecommendations);
          break;
        case 'collaborative':
          if (user) {
            results = await getRecommendations('collaborative', user.id, maxRecommendations);
          }
          break;
      }

      setRecommendations(results);
    } catch (error: any) {
      console.error('获取推荐失败:', error);
      toast.error('获取推荐失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getRecommendationScore = (score: number) => {
    return Math.round(score * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400 bg-green-400/10';
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-orange-400 bg-orange-400/10';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 推荐类型选择器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-neon-cyan" />
          <h3 className="text-xl font-semibold text-white">智能推荐</h3>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 推荐类型标签 */}
      <div className="flex flex-wrap gap-2">
        {recommendationTypes.map((type) => {
          const IconComponent = type.icon;
          const isSelected = selectedType === type.type;
          
          // 检查是否可用
          const isAvailable = type.type === 'similar' ? !!currentPromptId : 
                             (type.type === 'personalized' || type.type === 'collaborative') ? !!user : true;
          
          return (
            <motion.button
              key={type.type}
              onClick={() => isAvailable && setSelectedType(type.type)}
              disabled={!isAvailable}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                  : isAvailable
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    : 'border-gray-700 text-gray-600 cursor-not-allowed'
              }`}
              whileHover={isAvailable ? { scale: 1.02 } : {}}
              whileTap={isAvailable ? { scale: 0.98 } : {}}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-sm font-medium">{type.label}</span>
              {!isAvailable && (
                <span className="text-xs bg-gray-700 px-1 rounded">
                  {type.type === 'similar' ? '需要选择提示词' : '需要登录'}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 当前推荐类型说明 */}
      <div className="flex items-start gap-3 p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/50">
        {(() => {
          const currentType = recommendationTypes.find(t => t.type === selectedType);
          if (!currentType) return null;
          const IconComponent = currentType.icon;
          return (
            <>
              <IconComponent className={`h-5 w-5 ${currentType.color} mt-0.5`} />
              <div>
                <h4 className={`font-medium ${currentType.color}`}>{currentType.label}</h4>
                <p className="text-sm text-gray-400">{currentType.description}</p>
              </div>
            </>
          );
        })()}
      </div>

      {/* 推荐结果 */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">分析中，正在为您推荐...</p>
          </motion.div>
        ) : recommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <SparklesIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">暂无推荐内容</h4>
            <p className="text-gray-500">
              {selectedType === 'personalized' && !user ? '登录后获取个性化推荐' :
               selectedType === 'similar' && !currentPromptId ? '选择一个提示词查看相似推荐' :
               '暂时没有找到合适的推荐内容'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl border border-neon-cyan/20 p-6 hover:border-neon-cyan/40 transition-all duration-300 group"
              >
                {/* 推荐分数 */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(rec.score)}`}>
                    匹配度 {getRecommendationScore(rec.score)}%
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    {rec.reason}
                  </div>
                </div>

                {/* 提示词信息 */}
                <div className="space-y-3">
                  <Link
                    href={`/prompts/${rec.prompt.id}`}
                    className="block"
                  >
                    <h4 className="text-lg font-semibold text-white hover:text-neon-cyan transition-colors line-clamp-2 group-hover:text-neon-cyan">
                      {rec.prompt.name}
                    </h4>
                  </Link>

                  <p className="text-gray-400 text-sm line-clamp-3">
                    {rec.prompt.description}
                  </p>

                  {/* 标签和分类 */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">
                      {rec.prompt.category}
                    </span>
                    {rec.prompt.tags?.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                    <span>by {rec.prompt.author || '匿名'}</span>
                    <div className="flex items-center gap-3">
                      {rec.prompt.likes && (
                        <span className="flex items-center gap-1">
                          <HeartIcon className="h-3 w-3" />
                          {rec.prompt.likes}
                        </span>
                      )}
                      {rec.prompt.usage_count && (
                        <span className="flex items-center gap-1">
                          <ChartBarIcon className="h-3 w-3" />
                          {rec.prompt.usage_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 推荐设置 */}
      <RecommendationSettings
        userId={user?.id}
        onSettingsChange={handleRefresh}
      />
    </div>
  );
};

// 推荐设置组件
interface RecommendationSettingsProps {
  userId?: string;
  onSettingsChange?: () => void;
}

const RecommendationSettings: React.FC<RecommendationSettingsProps> = ({
  userId,
  onSettingsChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    includeCategories: [] as string[],
    excludeCategories: [] as string[],
    minRating: 0,
    preferRecent: true,
    diversityFactor: 0.5,
  });

  if (!userId) return null;

  return (
    <div className="border-t border-gray-700/50 pt-6">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
        <span className="text-sm">推荐设置</span>
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/50 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最低评分要求
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={settings.minRating}
                onChange={(e) => setSettings({
                  ...settings,
                  minRating: parseFloat(e.target.value),
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0星</span>
                <span className="text-neon-cyan">{settings.minRating}星</span>
                <span>5星</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                多样性程度
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.diversityFactor}
                onChange={(e) => setSettings({
                  ...settings,
                  diversityFactor: parseFloat(e.target.value),
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>相似</span>
                <span className="text-neon-cyan">{Math.round(settings.diversityFactor * 100)}%</span>
                <span>多样</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.preferRecent}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferRecent: e.target.checked,
                  })}
                  className="rounded border-gray-600 bg-dark-bg-secondary text-neon-cyan"
                />
                <span className="text-sm text-gray-300">优先推荐最新内容</span>
              </label>
            </div>

            <button
              onClick={() => {
                onSettingsChange?.();
                toast.success('推荐设置已更新');
              }}
              className="btn-primary w-full"
            >
              应用设置
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 