import { PromptDetails } from '@/types';

// 质量维度接口
export interface QualityDimension {
  name: string;
  score: number;
  weight: number;
  description: string;
  suggestions?: string[];
}

// 提示词质量分析结果接口
export interface PromptQualityAnalysis {
  overallScore: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  dimensions: {
    clarity?: QualityDimension;
    completeness?: QualityDimension;
    professionalism?: QualityDimension;
    actionability?: QualityDimension;
    creativity?: QualityDimension;
    universality?: QualityDimension;
    safety?: QualityDimension;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparisonWithCategory: {
    categoryAverage: number;
    ranking: number;
    totalInCategory: number;
    percentile: number;
  };
  metadata: {
    analysisDate: string;
    modelVersion: string;
    confidence: number;
  };
}

// 质量评价权重配置
const DIMENSION_WEIGHTS = {
  clarity: 0.20,        // 清晰度 20%
  completeness: 0.15,   // 完整性 15%
  professionalism: 0.15,// 专业性 15%
  actionability: 0.20,  // 可操作性 20%
  creativity: 0.10,     // 创新性 10%
  universality: 0.10,   // 通用性 10%
  safety: 0.10,         // 安全性 10%
};

// 质量等级阈值
const QUALITY_THRESHOLDS = {
  excellent: 85,
  good: 70,
  fair: 55,
};

export class PromptQualityAnalyzer {
  
  /**
   * 分析提示词质量
   */
  async analyzePromptQuality(prompt: PromptDetails): Promise<PromptQualityAnalysis> {
    const dimensions = await this.evaluateAllDimensions(prompt);
    const overallScore = this.calculateOverallScore(dimensions);
    const level = this.determineQualityLevel(overallScore);
    
    return {
      overallScore,
      level,
      dimensions,
      strengths: this.identifyStrengths(dimensions),
      weaknesses: this.identifyWeaknesses(dimensions),
      recommendations: this.generateRecommendations(dimensions, prompt),
      comparisonWithCategory: await this.getComparisonData(prompt.category || '通用', overallScore),
      metadata: {
        analysisDate: new Date().toISOString(),
        modelVersion: '1.0',
        confidence: 0.95,
      },
    };
  }

  /**
   * 评价所有维度
   */
  private async evaluateAllDimensions(prompt: PromptDetails) {
    const content = prompt.content || '';
    const description = prompt.description || '';
    const category = prompt.category || '通用';
    const tags = prompt.tags || [];

    return {
      clarity: await this.evaluateClarity(content, description),
      completeness: await this.evaluateCompleteness(content, prompt),
      professionalism: await this.evaluateProfessionalism(content, category),
      actionability: await this.evaluateActionability(content),
      creativity: await this.evaluateCreativity(content, description),
      universality: await this.evaluateUniversality(content, tags),
      safety: await this.evaluateSafety(content),
    };
  }

  /**
   * 评价清晰度
   */
  private async evaluateClarity(content: string, description: string): Promise<QualityDimension> {
    let score = 60; // 基础分
    const suggestions: string[] = [];

    // 检查句子结构
    const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    if (avgLength > 100) {
      score -= 10;
      suggestions.push('考虑缩短句子长度，提高可读性');
    } else if (avgLength < 200) {
      score += 10;
    }

    // 检查专业术语说明
    const hasExamples = /例如|比如|举例|示例|样例/.test(content);
    if (hasExamples) {
      score += 15;
    } else {
      suggestions.push('添加具体示例可以使指令更清晰');
    }

    // 检查结构化程度
    const hasSteps = /步骤|第一|第二|首先|其次|然后|最后/.test(content);
    if (hasSteps) {
      score += 10;
    }

    // 检查描述与内容一致性
    if (description && description.length > 10) {
      score += 5;
    }

    return {
      name: '清晰度',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.clarity,
      description: '提示词表达是否清楚、逻辑是否清晰',
      suggestions,
    };
  }

  /**
   * 评价完整性
   */
  private async evaluateCompleteness(content: string, prompt: PromptDetails): Promise<QualityDimension> {
    let score = 50;
    const suggestions: string[] = [];

    // 检查基本要素
    const hasContext = /背景|上下文|情境/.test(content) || content.length > 100;
    const hasTask = /任务|要求|需要|请|帮助/.test(content);
    const hasFormat = /格式|输出|返回|结果/.test(content);
    const hasConstraints = /注意|限制|要求|不要|避免/.test(content);

    if (hasContext) score += 15;
    else suggestions.push('添加更多背景信息或上下文');

    if (hasTask) score += 20;
    else suggestions.push('明确说明具体任务或目标');

    if (hasFormat) score += 10;
    else suggestions.push('指定期望的输出格式');

    if (hasConstraints) score += 10;
    else suggestions.push('添加必要的限制条件');

    // 检查变量定义
    const variables = (prompt as any).variables || [];
    if (variables.length > 0) {
      score += 5;
    }

    return {
      name: '完整性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.completeness,
      description: '提示词是否包含必要的信息和上下文',
      suggestions,
    };
  }

  /**
   * 评价专业性
   */
  private async evaluateProfessionalism(content: string, category: string): Promise<QualityDimension> {
    let score = 60;
    const suggestions: string[] = [];

    // 根据类别检查专业术语
    const categoryKeywords = this.getCategoryKeywords(category);
    const hasRelevantTerms = categoryKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (hasRelevantTerms) {
      score += 15;
    } else {
      suggestions.push(`增加与${category}领域相关的专业术语`);
    }

    // 检查语言规范性
    const hasProperGrammar = !/\s{2,}/.test(content) && !/[a-zA-Z]{50,}/.test(content);
    if (hasProperGrammar) {
      score += 10;
    }

    // 检查权威性表述
    const hasAuthoritative = /研究表明|根据|基于|建议|推荐/.test(content);
    if (hasAuthoritative) {
      score += 10;
    }

    return {
      name: '专业性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.professionalism,
      description: '是否符合领域专业标准',
      suggestions,
    };
  }

  /**
   * 评价可操作性
   */
  private async evaluateActionability(content: string): Promise<QualityDimension> {
    let score = 50;
    const suggestions: string[] = [];

    // 检查动词使用
    const actionVerbs = /分析|生成|创建|编写|设计|制作|优化|改进|总结|列出/.test(content);
    if (actionVerbs) {
      score += 20;
    } else {
      suggestions.push('使用更多具体的动作词汇');
    }

    // 检查具体步骤
    const hasSteps = /1\.|2\.|①|②|第一|第二|步骤/.test(content);
    if (hasSteps) {
      score += 15;
    } else {
      suggestions.push('提供分步骤的操作指导');
    }

    // 检查量化指标
    const hasMetrics = /\d+个|至少|不超过|大约|\d+字|%/.test(content);
    if (hasMetrics) {
      score += 10;
    } else {
      suggestions.push('添加具体的数量或质量要求');
    }

    return {
      name: '可操作性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.actionability,
      description: '是否给出具体可执行的指导',
      suggestions,
    };
  }

  /**
   * 评价创新性
   */
  private async evaluateCreativity(content: string, description: string): Promise<QualityDimension> {
    let score = 60;
    const suggestions: string[] = [];

    // 检查创新词汇
    const creativeWords = /创新|独特|原创|突破|新颖|创意|想象/.test(content);
    if (creativeWords) {
      score += 15;
    }

    // 检查多角度思考
    const multiPerspective = /从.*角度|不同|多种|各种|多维/.test(content);
    if (multiPerspective) {
      score += 10;
    } else {
      suggestions.push('鼓励从多个角度思考问题');
    }

    // 检查开放性
    const isOpenEnded = /可能|也许|尝试|探索|发现/.test(content);
    if (isOpenEnded) {
      score += 10;
    }

    return {
      name: '创新性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.creativity,
      description: '是否具有独特的创意或方法',
      suggestions,
    };
  }

  /**
   * 评价通用性
   */
  private async evaluateUniversality(content: string, tags: string[]): Promise<QualityDimension> {
    let score = 60;
    const suggestions: string[] = [];

    // 检查通用性词汇
    const universalWords = /通用|一般|常见|普遍|广泛/.test(content);
    if (universalWords) {
      score += 10;
    }

    // 检查特定领域限制
    const hasSpecificDomain = /专业|特定|仅限|只能|限于/.test(content);
    if (hasSpecificDomain) {
      score -= 15;
      suggestions.push('考虑增加通用性，使其适用于更多场景');
    } else {
      score += 10;
    }

    // 根据标签数量评估
    if (tags.length >= 3) {
      score += 10;
    }

    return {
      name: '通用性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.universality,
      description: '是否适用于多种场景',
      suggestions,
    };
  }

  /**
   * 评价安全性
   */
  private async evaluateSafety(content: string): Promise<QualityDimension> {
    let score = 90; // 安全性默认高分
    const suggestions: string[] = [];

    // 检查敏感词汇
    const sensitiveWords = /暴力|仇恨|歧视|危险|违法|不当/.test(content);
    if (sensitiveWords) {
      score -= 30;
      suggestions.push('移除可能引起争议或不当的内容');
    }

    // 检查是否有安全提醒
    const hasSafetyNote = /注意|警告|谨慎|合法|道德|伦理/.test(content);
    if (hasSafetyNote) {
      score += 5;
    }

    return {
      name: '安全性',
      score: Math.min(100, Math.max(0, score)),
      weight: DIMENSION_WEIGHTS.safety,
      description: '是否避免了有害或敏感内容',
      suggestions,
    };
  }

  /**
   * 计算总体得分
   */
  private calculateOverallScore(dimensions: any): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, dimension] of Object.entries(dimensions)) {
      const dim = dimension as QualityDimension;
      weightedSum += dim.score * dim.weight;
      totalWeight += dim.weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 确定质量等级
   */
  private determineQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (score >= QUALITY_THRESHOLDS.good) return 'good';
    if (score >= QUALITY_THRESHOLDS.fair) return 'fair';
    return 'poor';
  }

  /**
   * 识别优势
   */
  private identifyStrengths(dimensions: any): string[] {
    const strengths: string[] = [];
    
    for (const [key, dimension] of Object.entries(dimensions)) {
      const dim = dimension as QualityDimension;
      if (dim.score >= 80) {
        strengths.push(`${dim.name}表现优秀 (${dim.score}分)`);
      }
    }

    return strengths;
  }

  /**
   * 识别劣势
   */
  private identifyWeaknesses(dimensions: any): string[] {
    const weaknesses: string[] = [];
    
    for (const [key, dimension] of Object.entries(dimensions)) {
      const dim = dimension as QualityDimension;
      if (dim.score < 60) {
        weaknesses.push(`${dim.name}需要改进 (${dim.score}分)`);
      }
    }

    return weaknesses;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(dimensions: any, prompt: PromptDetails): string[] {
    const recommendations: string[] = [];
    
    // 收集各维度的建议
    for (const dimension of Object.values(dimensions) as QualityDimension[]) {
      if (dimension.suggestions) {
        recommendations.push(...dimension.suggestions);
      }
    }

    // 添加通用建议
    const overallScore = this.calculateOverallScore(dimensions);
    if (overallScore < 70) {
      recommendations.push('建议进行全面的内容重构，提高整体质量');
    }

    return recommendations.slice(0, 5); // 限制为最多5个建议
  }

  /**
   * 获取分类对比数据
   */
  private async getComparisonData(category: string, score: number) {
    // 模拟数据，实际应从数据库获取
    const ranking = Math.floor(Math.random() * 50) + 1;
    const totalInCategory = Math.floor(Math.random() * 100) + 50;
    const percentile = Math.round((1 - ranking / totalInCategory) * 100);
    
    return {
      categoryAverage: 72,
      ranking,
      totalInCategory,
      percentile,
    };
  }

  /**
   * 获取分类关键词
   */
  private getCategoryKeywords(category: string): string[] {
    const keywords: { [key: string]: string[] } = {
      '编程': ['代码', '函数', '算法', '变量', '调试', '优化', '架构'],
      '文案': ['标题', '内容', '创意', '营销', '品牌', '传播', '文字'],
      '写作': ['文章', '创作', '文字', '内容', '表达', '修辞', '结构'],
      '学术': ['研究', '分析', '理论', '方法', '数据', '结论', '参考'],
      '商业': ['策略', '市场', '客户', '价值', '竞争', '盈利', '增长'],
      '金融': ['投资', '理财', '风险', '收益', '资产', '财务', '分析'],
      '设计': ['视觉', '布局', '色彩', '字体', '用户体验', '界面', '创意'],
      '教育': ['学习', '教学', '知识', '技能', '培训', '课程', '评估'],
    };

    return keywords[category] || ['专业', '质量', '效果', '方法'];
  }
}

// 导出单例
export const qualityAnalyzer = new PromptQualityAnalyzer(); 