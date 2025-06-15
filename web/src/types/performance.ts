// 提示词质量评价维度
export interface QualityDimension {
  name: string;
  score: number; // 0-100 分数
  weight: number; // 权重
  description: string;
  suggestions?: string[]; // 改进建议
}

// 提示词质量评价结果
export interface PromptQualityAnalysis {
  overallScore: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  dimensions: {
    [key: string]: {
      name: string;
      score: number;
      description: string;
    };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparisonWithCategory: {
    ranking: number;
    totalInCategory: number;
    percentile: number;
  };
  historicalData?: {
    date: string;
    score: number;
  }[];
  metadata: {
    analysisDate: string;
    modelVersion: string;
    confidence: number;
  };
}

// 批量质量分析结果
export interface BatchQualityAnalysis {
  results: PromptQualityAnalysis[];
  categoryStats: {
    [category: string]: {
      averageScore: number;
      topPrompts: Array<{
        id: string;
        name: string;
        score: number;
      }>;
    };
  };
  overallStats: {
    totalAnalyzed: number;
    averageScore: number;
    distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
}

// 质量评价配置
export interface QualityAnalysisConfig {
  enabledDimensions: string[];
  weights: {
    [dimension: string]: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
  };
  analysisMode: 'comprehensive' | 'quick' | 'expert';
}

export interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  relevance: number;
  coherence: number;
  creativity: number;
  safety: number;
}

export interface PerformanceTrend {
  date: string;
  metrics: PerformanceMetrics;
  userFeedback?: number;
  category?: string;
}

export interface QualityInsight {
  type: 'strength' | 'weakness' | 'suggestion' | 'warning';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: string;
}

export interface PerformanceComparison {
  current: PromptQualityAnalysis;
  baseline: PromptQualityAnalysis;
  improvement: {
    [key: string]: {
      change: number;
      direction: 'up' | 'down' | 'stable';
      significance: 'high' | 'medium' | 'low';
    };
  };
}

export interface CategoryBenchmark {
  category: string;
  averageScore: number;
  topPercentileScore: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface UserPerformanceProfile {
  userId: string;
  overallRating: number;
  specialties: string[];
  weakAreas: string[];
  improvementTrend: 'improving' | 'stable' | 'declining';
  totalPrompts: number;
  averageQuality: number;
  bestCategory: string;
  joinDate: string;
} 