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
  promptId: string;
  overallScore: number; // 总体质量分数 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor'; // 质量等级
  dimensions: {
    clarity: QualityDimension; // 清晰度
    completeness: QualityDimension; // 完整性
    professionalism: QualityDimension; // 专业性
    actionability: QualityDimension; // 可操作性
    creativity: QualityDimension; // 创新性
    universality: QualityDimension; // 通用性
    safety: QualityDimension; // 安全性
  };
  strengths: string[]; // 优势
  weaknesses: string[]; // 劣势
  recommendations: string[]; // 改进建议
  comparisonWithCategory: {
    categoryAverage: number;
    ranking: number;
    totalInCategory: number;
  };
  lastAnalyzed: string;
  analysisVersion: string;
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