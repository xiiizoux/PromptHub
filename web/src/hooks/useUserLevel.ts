import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

interface UserLevelData {
  level: UserLevel;
  score: number;
  nextLevelProgress: number;
  factors: {
    promptsCreated: number;
    averageQuality: number;
    advancedFeaturesUsed: number;
    timeOnPlatform: number; // days
    collaborations: number;
  };
  achievements: string[];
  recommendations: string[];
}

interface UserLevelHookReturn {
  userLevel: UserLevel;
  levelData: UserLevelData | null;
  isLoading: boolean;
  updateUserLevel: () => Promise<void>;
  setManualLevel: (level: UserLevel) => void;
}

// 级别判断算法
const calculateUserLevel = (factors: UserLevelData['factors']): { level: UserLevel; score: number } => {
  let score = 0;

  // 创建的提示词数量 (0-30分)
  const promptScore = Math.min(factors.promptsCreated * 2, 30);
  score += promptScore;

  // 平均质量分数 (0-25分)
  const qualityScore = (factors.averageQuality / 100) * 25;
  score += qualityScore;

  // 高级功能使用 (0-20分)
  const featuresScore = Math.min(factors.advancedFeaturesUsed * 4, 20);
  score += featuresScore;

  // 平台使用时长 (0-15分)
  const timeScore = Math.min(factors.timeOnPlatform / 7, 15); // 每周1分，最多15分
  score += timeScore;

  // 协作次数 (0-10分)
  const collabScore = Math.min(factors.collaborations * 2, 10);
  score += collabScore;

  // 根据总分确定级别
  let level: UserLevel;
  if (score >= 75) {
    level = 'advanced';
  } else if (score >= 35) {
    level = 'intermediate';
  } else {
    level = 'beginner';
  }

  return { level, score };
};

// 生成成就列表
const generateAchievements = (factors: UserLevelData['factors'], level: UserLevel): string[] => {
  const achievements: string[] = [];

  if (factors.promptsCreated >= 1) achievements.push('🎉 首次创建');
  if (factors.promptsCreated >= 5) achievements.push('✨ 创作新手');
  if (factors.promptsCreated >= 20) achievements.push('🚀 创作达人');
  if (factors.promptsCreated >= 50) achievements.push('👑 创作专家');

  if (factors.averageQuality >= 70) achievements.push('⭐ 质量保证');
  if (factors.averageQuality >= 85) achievements.push('💎 精品创作者');

  if (factors.advancedFeaturesUsed >= 3) achievements.push('🔧 功能探索者');
  if (factors.advancedFeaturesUsed >= 8) achievements.push('⚡ 高级用户');

  if (factors.timeOnPlatform >= 30) achievements.push('📅 忠实用户');
  if (factors.timeOnPlatform >= 90) achievements.push('🏆 资深会员');

  if (factors.collaborations >= 1) achievements.push('🤝 团队协作');
  if (factors.collaborations >= 5) achievements.push('👥 协作达人');

  return achievements;
};

// 生成个性化建议
const generateRecommendations = (factors: UserLevelData['factors'], level: UserLevel): string[] => {
  const recommendations: string[] = [];

  if (level === 'beginner') {
    if (factors.promptsCreated < 3) {
      recommendations.push('尝试创建更多提示词，熟悉基本功能');
    }
    if (factors.averageQuality < 60) {
      recommendations.push('使用智能写作助手提升提示词质量');
    }
    recommendations.push('浏览"新手友好"的模板和示例');
    recommendations.push('参与社区讨论，学习最佳实践');
  } else if (level === 'intermediate') {
    if (factors.advancedFeaturesUsed < 5) {
      recommendations.push('探索更多高级功能，如A/B测试和性能分析');
    }
    if (factors.collaborations === 0) {
      recommendations.push('尝试协作功能，与他人共同创作');
    }
    recommendations.push('创建更复杂的多步骤提示词');
    recommendations.push('分享您的优质提示词给社区');
  } else {
    recommendations.push('成为社区导师，帮助新手用户');
    recommendations.push('参与高级功能的测试和反馈');
    recommendations.push('创建和维护高质量的模板库');
    recommendations.push('探索AI模型的前沿应用');
  }

  return recommendations;
};

// 计算下一级别进度
const calculateNextLevelProgress = (score: number, level: UserLevel): number => {
  if (level === 'beginner') {
    return Math.min((score / 35) * 100, 100);
  } else if (level === 'intermediate') {
    return Math.min(((score - 35) / (75 - 35)) * 100, 100);
  } else {
    return 100; // 已经是最高级别
  }
};

export const useUserLevel = (): UserLevelHookReturn => {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<UserLevel>('intermediate');
  const [levelData, setLevelData] = useState<UserLevelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualLevel, setManualLevel] = useState<UserLevel | null>(null);

  const updateUserLevel = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 模拟获取用户数据的API调用
      // 在实际应用中，这些数据应该从后端API获取
      const mockUserData = {
        promptsCreated: Math.floor(Math.random() * 30) + 1,
        averageQuality: Math.floor(Math.random() * 40) + 60,
        advancedFeaturesUsed: Math.floor(Math.random() * 10),
        timeOnPlatform: Math.floor(Math.random() * 120) + 1,
        collaborations: Math.floor(Math.random() * 8),
      };

      // 尝试从localStorage获取用户数据
      const savedData = localStorage.getItem(`userLevelData_${user.id}`);
      const factors = savedData ? JSON.parse(savedData) : mockUserData;

      // 计算用户级别
      const { level, score } = calculateUserLevel(factors);
      
      // 如果用户手动设置了级别，优先使用手动设置的级别
      const finalLevel = manualLevel || level;

      // 生成完整的级别数据
      const levelData: UserLevelData = {
        level: finalLevel,
        score,
        nextLevelProgress: calculateNextLevelProgress(score, finalLevel),
        factors,
        achievements: generateAchievements(factors, finalLevel),
        recommendations: generateRecommendations(factors, finalLevel),
      };

      setUserLevel(finalLevel);
      setLevelData(levelData);

      // 保存到localStorage
      localStorage.setItem(`userLevelData_${user.id}`, JSON.stringify(factors));
      
    } catch (error) {
      console.error('获取用户级别数据失败:', error);
      // 设置默认值
      setUserLevel('intermediate');
      setLevelData({
        level: 'intermediate',
        score: 50,
        nextLevelProgress: 50,
        factors: {
          promptsCreated: 0,
          averageQuality: 0,
          advancedFeaturesUsed: 0,
          timeOnPlatform: 0,
          collaborations: 0,
        },
        achievements: [],
        recommendations: ['开始创建您的第一个提示词'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetManualLevel = (level: UserLevel) => {
    setManualLevel(level);
    setUserLevel(level);
    
    // 更新级别数据
    if (levelData) {
      const updatedData = {
        ...levelData,
        level,
        nextLevelProgress: calculateNextLevelProgress(levelData.score, level),
        recommendations: generateRecommendations(levelData.factors, level),
      };
      setLevelData(updatedData);
    }

    // 保存手动设置的级别
    if (user) {
      localStorage.setItem(`userManualLevel_${user.id}`, level);
    }
  };

  useEffect(() => {
    if (user) {
      // 检查是否有手动设置的级别
      const savedManualLevel = localStorage.getItem(`userManualLevel_${user.id}`) as UserLevel;
      if (savedManualLevel) {
        setManualLevel(savedManualLevel);
      }
      
      updateUserLevel();
    } else {
      // 未登录用户默认为中级
      setUserLevel('intermediate');
      setLevelData(null);
      setIsLoading(false);
    }
  }, [user, manualLevel]);

  return {
    userLevel,
    levelData,
    isLoading,
    updateUserLevel,
    setManualLevel: handleSetManualLevel,
  };
}; 