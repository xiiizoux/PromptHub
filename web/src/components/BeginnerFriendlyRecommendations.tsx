import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  SparklesIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  StarIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  UserGroupIcon,
  ArrowPathIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  BookOpenIcon,
  ArrowRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useUserLevel } from '@/hooks/useUserLevel';

// 添加缺失的类型定义
type RecommendationType = 'personalized' | 'trending' | 'similar';

interface RecommendationResult {
  id: string;
  prompt: {
    id: string;
    title: string;
    description: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  score: number;
  reason?: string;
}

interface BeginnerFriendlyRecommendationsProps {
  currentPromptId?: string;
  userId?: string;
  maxRecommendations?: number;
  className?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  showLearningPath?: boolean;
  _showLearningPath?: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    type: 'read' | 'practice' | 'create' | 'review';
  }>;
  category: string;
  tags: string[];
  popularity: number;
  successRate: number;
}

interface PersonalizedRecommendation {
  id: string;
  type: 'template' | 'technique' | 'practice' | 'community';
  title: string;
  description: string;
  reason: string;
  confidence: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  actionUrl: string;
  popularity: number;
  category: string;
  tags: string[];
}

// 初学者学习路径
const LearningPath: React.FC<{
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  onLevelChange: (level: 'beginner' | 'intermediate' | 'advanced') => void;
}> = ({ currentLevel, onLevelChange }) => {
  const levels = [
    {
      level: 'beginner' as const,
      name: '🌱 新手入门',
      description: '简单易懂的基础提示词',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30',
    },
    {
      level: 'intermediate' as const,
      name: '🔥 进阶学习',
      description: '功能丰富的实用提示词',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30',
    },
    {
      level: 'advanced' as const,
      name: '⚡ 专家级别',
      description: '复杂专业的高级提示词',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30',
    },
  ];

  return (
    <div className="mb-6 p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/30">
      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <AcademicCapIcon className="h-4 w-4 text-neon-cyan" />
        选择您的学习级别
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map((level) => (
          <button
            key={level.level}
            onClick={() => onLevelChange(level.level)}
            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
              currentLevel === level.level
                ? `${level.bgColor} ${level.borderColor} ${level.color}`
                : 'bg-dark-bg-secondary/20 border-gray-700/50 text-gray-400 hover:border-gray-600/50'
            }`}
          >
            <div className="font-medium text-sm">{level.name}</div>
            <div className="text-xs mt-1 opacity-80">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// 提示词难度标识
const _DifficultyBadge: React.FC<{ difficulty: 'beginner' | 'intermediate' | 'advanced' }> = ({ difficulty }) => {
  const configs = {
    beginner: {
      label: '新手',
      icon: '🌱',
      color: 'text-green-400 bg-green-400/10 border-green-400/30',
    },
    intermediate: {
      label: '进阶',
      icon: '🔥',
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    },
    advanced: {
      label: '专家',
      icon: '⚡',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    },
  };

  const config = configs[difficulty];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

// 学习提示组件
const _LearningTip: React.FC<{ tip: string; type: 'info' | 'success' | 'warning' }> = ({ tip, type }) => {
  const configs = {
    info: {
      icon: <LightBulbIcon className="h-4 w-4 text-blue-400" />,
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300',
    },
    success: {
      icon: <ShieldCheckIcon className="h-4 w-4 text-green-400" />,
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300',
    },
    warning: {
      icon: <SparklesIcon className="h-4 w-4 text-yellow-400" />,
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-300',
    },
  };

  const config = configs[type];

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mt-3`}>
      <div className="flex items-start gap-2">
        {config.icon}
        <p className={`text-xs ${config.textColor} leading-relaxed`}>{tip}</p>
      </div>
    </div>
  );
};

export const BeginnerFriendlyRecommendations: React.FC<BeginnerFriendlyRecommendationsProps> = ({
  currentPromptId,
  userId,
  maxRecommendations = 9,
  className = '',
  userLevel = 'beginner',
  showLearningPath = true,
  _showLearningPath = true,
}) => {
  const { user } = useAuth();
  const { levelData, isLoading: _userLevelLoading } = useUserLevel();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = useState<PersonalizedRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'paths' | 'recommendations' | 'achievements'>('paths');
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // 适合初学者的推荐类型
  const _beginnerRecommendationTypes = [
    {
      type: 'personalized' as RecommendationType,
      label: '为您推荐',
      icon: SparklesIcon,
      description: '根据您的兴趣推荐',
      color: 'text-neon-cyan',
    },
    {
      type: 'trending' as RecommendationType,
      label: '热门精选',
      icon: RocketLaunchIcon,
      description: '大家都在用的提示词',
      color: 'text-neon-pink',
    },
    {
      type: 'similar' as RecommendationType,
      label: '相关推荐',
      icon: UserGroupIcon,
      description: '与当前提示词相似',
      color: 'text-neon-purple',
      disabled: !currentPromptId,
    },
  ];

  // 添加缺失的辅助函数
  const getDifficultyColor = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const configs = {
      beginner: 'text-green-400 bg-green-400/10 border-green-400/30',
      intermediate: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
      advanced: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    };
    return configs[difficulty];
  };

  const getDifficultyText = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const configs = {
      beginner: '新手',
      intermediate: '进阶',
      advanced: '专家',
    };
    return configs[difficulty];
  };

  const getTypeIcon = (type: 'read' | 'practice' | 'create' | 'review') => {
    const icons = {
      read: <BookOpenIcon className="h-3 w-3" />,
      practice: <PlayIcon className="h-3 w-3" />,
      create: <SparklesIcon className="h-3 w-3" />,
      review: <CheckCircleIcon className="h-3 w-3" />,
    };
    return icons[type];
  };

  // Mock API 函数
  const getPersonalizedRecommendations = async (_userId: string, _limit: number): Promise<RecommendationResult[]> => {
    // Mock 实现
    return [];
  };

  const getTrendingPrompts = async (_limit: number): Promise<RecommendationResult[]> => {
    // Mock 实现
    return [];
  };

  const getSimilarPrompts = async (_promptId: string, _limit: number): Promise<RecommendationResult[]> => {
    // Mock 实现
    return [];
  };

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      let results: RecommendationResult[] = [];

      switch (activeTab) {
        case 'recommendations':
          if (user) {
            results = await getPersonalizedRecommendations(user.id, maxRecommendations);
          } else {
            results = await getTrendingPrompts(maxRecommendations);
          }
          break;
        case 'paths':
          // 学习路径不需要特殊处理
          break;
        case 'achievements':
          // 成就不需要特殊处理
          break;
      }

      // 按难度过滤
      const filteredResults = results.filter(rec => {
        // 如果提示词没有难度标记，默认为intermediate
        const promptDifficulty = rec.prompt.difficulty || 'intermediate';
        
        // 初学者只看初学者和部分中级内容
        if (userLevel === 'beginner') {
          return promptDifficulty === 'beginner' || 
                 (promptDifficulty === 'intermediate' && rec.score > 0.7);
        }
        
        // 中级用户看中级和部分高级内容
        if (userLevel === 'intermediate') {
          return promptDifficulty === 'intermediate' || 
                 (promptDifficulty === 'advanced' && rec.score > 0.8) ||
                 (promptDifficulty === 'beginner' && rec.score > 0.6);
        }
        
        // 高级用户看所有内容
        return true;
      });

      setRecommendations(filteredResults);
    } catch (error: unknown) {
      console.error('获取推荐失败:', error);
      toast.error('获取推荐失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user, maxRecommendations, userLevel]);

  const generateLearningPaths = useCallback(() => {
    // Mock implementation for learning paths
    const mockPaths: LearningPath[] = [
      {
        id: '1',
        title: '提示词基础入门',
        description: '从零开始学习提示词的基本概念和使用方法',
        difficulty: 'beginner',
        estimatedTime: '30分钟',
        steps: [
          { id: '1', title: '了解什么是提示词', description: '学习提示词的基本概念', completed: false, type: 'read' },
          { id: '2', title: '第一个提示词', description: '创建你的第一个提示词', completed: false, type: 'practice' }
        ],
        category: '基础教程',
        tags: ['入门', '基础'],
        popularity: 95,
        successRate: 92
      }
    ];
    setLearningPaths(mockPaths);
  }, []);

  const generatePersonalizedRecommendations = useCallback(() => {
    // Mock implementation for personalized recommendations
    const mockRecs: PersonalizedRecommendation[] = [
      {
        id: '1',
        type: 'template',
        title: '个性化推荐示例',
        description: '根据您的使用习惯推荐的提示词',
        reason: '基于您的历史使用',
        confidence: 0.85,
        difficulty: 'beginner',
        estimatedTime: '5分钟',
        actionUrl: '/prompts/1',
        popularity: 85,
        category: '写作助手',
        tags: ['写作', '创意']
      }
    ];
    setPersonalizedRecs(mockRecs);
  }, []);

  useEffect(() => {
    fetchRecommendations();
    generateLearningPaths();
    generatePersonalizedRecommendations();
  }, [userLevel, currentPromptId, userId, fetchRecommendations, generateLearningPaths, generatePersonalizedRecommendations]);

  const _getRecommendationScore = (score: number) => {
    return Math.round(score * 100);
  };

  const _getScoreColor = (score: number) => {
    if (score >= 0.8) {return 'text-green-400 bg-green-400/10';}
    if (score >= 0.6) {return 'text-yellow-400 bg-yellow-400/10';}
    return 'text-orange-400 bg-orange-400/10';
  };

  const _getLearningTip = (prompt: { difficulty?: 'beginner' | 'intermediate' | 'advanced' }) => {
    const difficulty = prompt.difficulty || 'intermediate';
    
    if (userLevel === 'beginner') {
      if (difficulty === 'beginner') {
        return { tip: '这个提示词很适合新手练习，建议先试用再学习其结构。', type: 'success' as const };
      } else if (difficulty === 'intermediate') {
        return { tip: '这是个稍有挑战的提示词，可以学习其中的技巧。', type: 'info' as const };
      } else {
        return { tip: '这个提示词比较复杂，建议先掌握基础后再尝试。', type: 'warning' as const };
      }
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">正在加载个性化推荐...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-neon-cyan" />
          <h3 className="text-xl font-semibold text-white">
            {userLevel === 'beginner' ? '为您推荐' : '智能推荐'}
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 难度筛选 */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={userLevel}
              onChange={(_e) => {
                // Implementation of level change
              }}
              className="bg-dark-bg-secondary border border-gray-700 text-white text-sm rounded-lg px-3 py-1 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
            >
              <option value="beginner">新手级别</option>
              <option value="intermediate">进阶级别</option>
              <option value="advanced">专家级别</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              // Implementation of refresh
            }}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="flex space-x-1 bg-dark-bg-secondary/50 rounded-lg p-1 mb-6">
        {[
          { key: 'paths', label: userLevel === 'beginner' ? '学习路径' : '学习路径', icon: <AcademicCapIcon className="h-4 w-4" /> },
          { key: 'recommendations', label: userLevel === 'beginner' ? '个性推荐' : '智能推荐', icon: <SparklesIcon className="h-4 w-4" /> },
          { key: 'achievements', label: userLevel === 'beginner' ? '我的成就' : '成就系统', icon: <TrophyIcon className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'recommendations' | 'achievements')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-neon-cyan text-dark-bg-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 学习路径面板 */}
      {activeTab === 'paths' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 难度过滤器 */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: '全部' },
              { key: 'beginner', label: '新手友好' },
              { key: 'intermediate', label: '进阶' },
              { key: 'advanced', label: '高级' },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as 'all' | 'beginner' | 'intermediate' | 'advanced')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === filterOption.key
                    ? 'bg-neon-cyan text-dark-bg-primary'
                    : 'bg-dark-bg-secondary/50 text-gray-400 hover:text-white'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {/* 学习路径列表 */}
          <div className="space-y-4">
            {learningPaths.map((path) => (
              <motion.div
                key={path.id}
                layout
                className="bg-dark-bg-secondary/30 rounded-lg p-4 border border-gray-700/30 hover:border-neon-cyan/30 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium">{path.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(path.difficulty)}`}>
                        {getDifficultyText(path.difficulty)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{path.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {path.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <StarIcon className="h-3 w-3" />
                        {path.popularity}% 好评
                      </span>
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="h-3 w-3" />
                        {path.successRate}% 完成率
                      </span>
                    </div>
                  </div>
                </div>

                {/* 学习步骤 */}
                <div className="space-y-2 mb-4">
                  {path.steps.slice(0, 3).map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 text-sm">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {getTypeIcon(step.type)}
                        <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                          {step.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  {path.steps.length > 3 && (
                    <div className="text-xs text-gray-500 ml-9">
                      还有 {path.steps.length - 3} 个步骤...
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {path.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link 
                    href={`/learn/path/${path.id}`}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    开始学习
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 个性化推荐面板 */}
      {activeTab === 'recommendations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {personalizedRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-dark-bg-secondary/30 rounded-lg p-4 border border-gray-700/30 hover:border-neon-cyan/30 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-medium">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(rec.difficulty)}`}>
                      {getDifficultyText(rec.difficulty)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 mb-3">
                    <p className="text-xs text-blue-300 flex items-start gap-2">
                      <LightBulbIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {rec.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {rec.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      {rec.popularity}% 推荐
                    </span>
                    <span className="text-gray-600">{rec.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link 
                  href={rec.actionUrl}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  立即体验
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 成就系统面板 */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {levelData && (
            <>
              {/* 用户统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-dark-bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-neon-cyan mb-1">
                    {levelData.factors.promptsCreated}
                  </div>
                  <div className="text-xs text-gray-400">创建提示词</div>
                </div>
                <div className="bg-dark-bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {Math.round(levelData.factors.averageQuality)}
                  </div>
                  <div className="text-xs text-gray-400">平均质量</div>
                </div>
                <div className="bg-dark-bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {levelData.factors.timeOnPlatform}
                  </div>
                  <div className="text-xs text-gray-400">使用天数</div>
                </div>
                <div className="bg-dark-bg-secondary/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {levelData.achievements.length}
                  </div>
                  <div className="text-xs text-gray-400">获得成就</div>
                </div>
              </div>

              {/* 成就列表 */}
              <div className="space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2 mb-4">
                  <TrophyIcon className="h-5 w-5 text-yellow-400" />
                  您的成就
                </h4>
                {levelData.achievements.length > 0 ? (
                  <div className="grid gap-3">
                    {levelData.achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3"
                      >
                        <div className="text-2xl">{achievement.split(' ')[0]}</div>
                        <div className="flex-1">
                          <div className="text-yellow-400 font-medium">
                            {achievement.split(' ').slice(1).join(' ')}
                          </div>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <TrophyIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>继续使用平台来获得您的第一个成就！</p>
                  </div>
                )}
              </div>

              {/* 个性化建议 */}
              {levelData.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-white font-medium flex items-center gap-2 mb-4">
                    <LightBulbIcon className="h-5 w-5 text-blue-400" />
                    专属建议
                  </h4>
                  <div className="space-y-2">
                    {levelData.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3"
                      >
                        <p className="text-sm text-blue-300">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BeginnerFriendlyRecommendations; 