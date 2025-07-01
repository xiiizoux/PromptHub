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

// 扩展分析结果，添加普通用户友好的建议
export interface EnhancedQualityAnalysis extends PromptQualityAnalysis {
  userFriendlyTips: UserFriendlyTip[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  improvementPriority: ImprovementPriority[];
  quickFixes: QuickFix[];
  successExamples: string[];
}

export interface UserFriendlyTip {
  category: 'structure' | 'clarity' | 'effectiveness' | 'format';
  title: string;
  description: string;
  example: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ImprovementPriority {
  area: string;
  reason: string;
  currentScore: number;
  potentialImprovement: number;
  actionItems: string[];
}

export interface QuickFix {
  issue: string;
  solution: string;
  beforeExample: string;
  afterExample: string;
  applyable: boolean; // 是否可以一键应用
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
   * 获取分类关键词 - 动态生成基于分类名称
   */
  private getCategoryKeywords(category: string): string[] {
    // 基于分类名称智能生成关键词
    const categoryKeywordMap = this.generateCategoryKeywords(category);
    return categoryKeywordMap;
  }

  /**
   * 智能生成分类关键词
   */
  private generateCategoryKeywords(category: string): string[] {
    // 动态关键词生成 - 基于分类名称智能推断
    return this.generateKeywordsByCategory(category);
  }

  /**
   * 基于分类名称动态生成关键词
   */
  private generateKeywordsByCategory(category: string): string[] {
    // 基础关键词映射规则
    const keywordRules = [
      // 编程开发相关
      { keywords: ['编程', '开发', '代码', '程序'], relatedWords: ['代码', '函数', '算法', '变量', '调试', '优化', '架构', '开发', '程序'] },

      // 文案写作相关
      { keywords: ['文案', '写作', '创作', '文字'], relatedWords: ['标题', '内容', '创意', '营销', '品牌', '传播', '文字', '写作', '表达'] },

      // 学术研究相关
      { keywords: ['学术', '研究', '论文', '科研'], relatedWords: ['研究', '分析', '理论', '方法', '数据', '结论', '参考', '学术', '论文'] },

      // 翻译语言相关
      { keywords: ['翻译', '语言', '多语言'], relatedWords: ['翻译', '语言', '转换', '表达', '准确', '流畅', '多语言'] },

      // 对话交流相关
      { keywords: ['对话', '交流', '沟通', '聊天'], relatedWords: ['对话', '交流', '沟通', '回答', '互动', '理解'] },

      // 设计艺术相关
      { keywords: ['设计', '艺术', '绘画', '美术'], relatedWords: ['视觉', '布局', '色彩', '字体', '创意', '美学', '构图'] },

      // 商业金融相关
      { keywords: ['商业', '金融', '投资', '财务'], relatedWords: ['策略', '市场', '客户', '价值', '投资', '理财', '风险', '收益'] },

      // 摄影图像相关
      { keywords: ['摄影', '拍摄', '照片', '图像'], relatedWords: ['摄影', '构图', '光线', '色彩', '视觉', '美学'] },

      // 视频制作相关
      { keywords: ['视频', '影像', '动画', '特效'], relatedWords: ['视频', '剪辑', '特效', '动画', '故事', '叙述'] },
    ];

    // 查找匹配的规则
    for (const rule of keywordRules) {
      if (rule.keywords.some(keyword => category.includes(keyword))) {
        return rule.relatedWords;
      }
    }

    // 基于分类名称生成通用关键词
    const generalKeywords = ['专业', '质量', '效果', '方法'];

    // 根据分类名称中的特定词汇添加相关关键词
    if (category.includes('对话') || category.includes('聊天')) {
      generalKeywords.push('对话', '交流', '沟通');
    }
    if (category.includes('创作') || category.includes('创意')) {
      generalKeywords.push('创作', '创意', '想象');
    }
    if (category.includes('分析') || category.includes('研究')) {
      generalKeywords.push('分析', '研究', '深入');
    }
    if (category.includes('设计') || category.includes('美术')) {
      generalKeywords.push('设计', '美学', '视觉');
    }
    if (category.includes('技术') || category.includes('科技')) {
      generalKeywords.push('技术', '创新', '解决方案');
    }

    return generalKeywords;
  }

  /**
   * 增强版质量分析 - 专门针对普通用户痛点
   */
  async analyzeForBeginners(prompt: PromptDetails): Promise<EnhancedQualityAnalysis> {
    // 先获取基础分析结果
    const baseAnalysis = await this.analyzePromptQuality(prompt);

    // 添加普通用户友好的增强分析
    const content = prompt.content || '';
    const category = prompt.category || '通用';

    const userFriendlyTips = this.generateUserFriendlyTips(content);
    const difficultyLevel = this.assessDifficultyLevel(content);
    const improvementPriority = this.prioritizeImprovements(baseAnalysis);
    const quickFixes = this.generateQuickFixes(content, baseAnalysis);
    const successExamples = this.generateSuccessExamples(category);

    return {
      ...baseAnalysis,
      userFriendlyTips,
      difficultyLevel,
      improvementPriority,
      quickFixes,
      successExamples,
    };
  }

  /**
   * 生成普通用户友好的建议
   */
  private generateUserFriendlyTips(content: string): UserFriendlyTip[] {
    const tips: UserFriendlyTip[] = [];

    // 检查角色定义
    if (!this.hasRoleDefinition(content)) {
      tips.push({
        category: 'structure',
        title: '给AI一个明确的身份',
        description: '就像介绍朋友一样，先告诉AI它应该扮演什么角色，这样回答会更专业',
        example: '你是一位经验丰富的写作老师...',
        impact: 'high',
      });
    }

    // 检查任务描述
    if (!this.hasTaskDescription(content)) {
      tips.push({
        category: 'clarity',
        title: '用"请"开头，礼貌地提出要求',
        description: '明确告诉AI你需要它做什么，就像和朋友聊天一样自然',
        example: '请帮我分析这篇文章的主要观点...',
        impact: 'high',
      });
    }

    // 检查输出格式
    if (!this.hasOutputFormat(content)) {
      tips.push({
        category: 'format',
        title: '告诉AI你想要什么样的回答',
        description: '指定回答的格式，就像点菜时说要什么一样',
        example: '请用1、2、3的列表形式回答...',
        impact: 'medium',
      });
    }

    // 检查具体性
    if (this.isContentTooVague(content)) {
      tips.push({
        category: 'effectiveness',
        title: '提供更多背景信息',
        description: '想象你在向朋友解释问题，提供足够的细节',
        example: '我是一名大学生，正在写关于环保的论文...',
        impact: 'medium',
      });
    }

    return tips;
  }

  /**
   * 评估提示词难度级别
   */
  private assessDifficultyLevel(content: string): 'beginner' | 'intermediate' | 'advanced' {
    let complexityScore = 0;

    // 长度复杂度
    if (content.length > 500) complexityScore += 2;
    else if (content.length > 200) complexityScore += 1;

    // 结构复杂度
    if (content.includes('步骤') || content.includes('分别')) complexityScore += 1;
    if ((content.match(/\d+\./g)?.length || 0) > 3) complexityScore += 1;

    // 专业术语
    const technicalTerms = ['算法', '机器学习', '深度学习', '神经网络', '数据结构'];
    if (technicalTerms.some(term => content.includes(term))) complexityScore += 2;

    // 变量使用
    const variableCount = (content.match(/\{\{[^}]+\}\}/g) || []).length;
    if (variableCount > 3) complexityScore += 1;

    if (complexityScore >= 4) return 'advanced';
    if (complexityScore >= 2) return 'intermediate';
    return 'beginner';
  }

  /**
   * 优先级排序改进建议
   */
  private prioritizeImprovements(analysis: PromptQualityAnalysis): ImprovementPriority[] {
    const priorities: ImprovementPriority[] = [];

    // 分析各维度得分，找出最需要改进的方面
    const dimensions = Object.entries(analysis.dimensions || {});

    dimensions.forEach(([key, dimension]) => {
      if (dimension?.score && dimension.score < 70) {
        let potentialImprovement = 0;
        let actionItems: string[] = [];

        switch (key) {
          case 'clarity':
            potentialImprovement = 85 - dimension.score;
            actionItems = [
              '使用更简单直接的语言',
              '删除不必要的修饰词',
              '一个句子表达一个意思',
            ];
            break;
          case 'actionability':
            potentialImprovement = 80 - dimension.score;
            actionItems = [
              '使用具体的动作词汇',
              '提供分步骤的指导',
              '添加具体的数量要求',
            ];
            break;
          case 'completeness':
            potentialImprovement = 75 - dimension.score;
            actionItems = [
              '补充背景信息',
              '明确目标和约束',
              '添加使用场景说明',
            ];
            break;
        }

        if (potentialImprovement > 0 && dimension) {
          priorities.push({
            area: dimension.name,
            reason: `当前得分${dimension.score}分，有较大提升空间`,
            currentScore: dimension.score,
            potentialImprovement,
            actionItems,
          });
        }
      }
    });

    // 按照潜在改进空间排序
    return priorities.sort((a, b) => b.potentialImprovement - a.potentialImprovement);
  }

  /**
   * 生成可快速修复的问题
   */
  private generateQuickFixes(content: string, analysis: PromptQualityAnalysis): QuickFix[] {
    const fixes: QuickFix[] = [];

    // 缺少角色定义的快速修复
    if (!this.hasRoleDefinition(content)) {
      fixes.push({
        issue: '缺少AI角色定义',
        solution: '在开头添加角色描述',
        beforeExample: content.substring(0, 50) + '...',
        afterExample: '你是一位专业的助手。' + content.substring(0, 50) + '...',
        applyable: true,
      });
    }

    // 缺少明确任务的快速修复
    if (!this.hasTaskDescription(content)) {
      fixes.push({
        issue: '任务指令不够明确',
        solution: '添加明确的请求词汇',
        beforeExample: content,
        afterExample: content.replace(/^/, '请帮我'),
        applyable: true,
      });
    }

    // 提示词过短的快速修复
    if (content.length < 50) {
      fixes.push({
        issue: '提示词内容过于简单',
        solution: '添加更多背景信息和要求',
        beforeExample: content,
        afterExample: content + '\n\n请详细说明，并提供具体例子。',
        applyable: true,
      });
    }

    return fixes;
  }

  /**
   * 根据分类生成成功示例 - 动态生成
   */
  private generateSuccessExamples(category: string): string[] {
    // 基于分类智能生成示例
    return this.generateDynamicExamples(category);
  }

  /**
   * 动态生成分类示例 - 基于分类名称智能生成
   */
  private generateDynamicExamples(category: string): string[] {
    return this.generateExamplesByCategory(category);
  }

  /**
   * 基于分类名称动态生成示例
   */
  private generateExamplesByCategory(category: string): string[] {
    // 示例生成规则
    const exampleRules = [
      // 编程开发相关
      {
        keywords: ['编程', '开发', '代码', '程序'],
        examples: [
          '你是一位资深的编程专家。请帮我解决一个技术问题，要求：提供清晰的代码示例，包含详细注释，考虑错误处理和性能优化。',
          '作为软件开发专家，请帮我设计一个系统架构，要求：考虑可扩展性、可维护性，提供具体的技术选型和实现方案。',
        ],
      },

      // 文案写作相关
      {
        keywords: ['文案', '写作', '创作', '文字'],
        examples: [
          '你是一位专业的文案创作者。请帮我创作一段营销文案，要求：目标明确，语言生动，能够吸引目标受众并促进行动。',
          '作为内容策划专家，请帮我制定一个内容创作方案，要求：结构清晰，观点鲜明，包含具体的执行步骤。',
        ],
      },

      // 学术研究相关
      {
        keywords: ['学术', '研究', '论文', '科研'],
        examples: [
          '你是一位学术研究专家。请帮我分析一个研究主题，要求：逻辑严密，论据充分，提供多角度的深入分析。',
          '作为研究方法专家，请指导我设计一个研究方案，要求：方法科学，步骤清晰，考虑可行性和有效性。',
        ],
      },

      // 翻译语言相关
      {
        keywords: ['翻译', '语言', '多语言'],
        examples: [
          '你是一位专业的翻译专家。请帮我进行翻译工作，要求：准确传达原意，语言地道流畅，符合目标语言的表达习惯。',
          '作为语言学习顾问，请帮我制定学习计划，要求：目标明确，方法科学，提供具体的学习步骤和时间安排。',
        ],
      },

      // 对话交流相关
      {
        keywords: ['对话', '交流', '沟通', '聊天'],
        examples: [
          '你是一位智能助手。请帮我解决问题，要求：理解准确，回答全面，提供实用的建议和解决方案。',
          '作为沟通专家，请帮我改善交流效果，要求：分析深入，建议具体，考虑不同场景的应用。',
        ],
      },

      // 设计艺术相关
      {
        keywords: ['设计', '艺术', '绘画', '美术', '创意'],
        examples: [
          '你是一位设计专家。请帮我创作设计方案，要求：创意独特，美观实用，符合设计原则和用户需求。',
          '作为艺术指导，请帮我提升创作水平，要求：指导专业，建议具体，提供实用的技巧和方法。',
        ],
      },

      // 商业金融相关
      {
        keywords: ['商业', '金融', '投资', '财务', '管理'],
        examples: [
          '你是一位商业策略专家。请帮我分析商业问题，要求：分析全面，建议实用，考虑市场环境和竞争因素。',
          '作为投资顾问，请帮我制定投资策略，要求：风险可控，收益合理，提供具体的操作建议。',
        ],
      },
    ];

    // 查找匹配的规则
    for (const rule of exampleRules) {
      if (rule.keywords.some(keyword => category.includes(keyword))) {
        return rule.examples;
      }
    }

    // 通用示例模板
    return [
      `你是一位${category}领域的专业助手。请根据用户的需求提供准确、有用的信息和建议，确保回答清晰、结构化，并包含具体的操作步骤。`,
      `作为${category}专家，请分析用户提出的问题，提供多角度的解决方案，并说明每种方案的优缺点，帮助用户做出最佳选择。`,
    ];
  }

  // 辅助检测方法
  private hasRoleDefinition(content: string): boolean {
    return /你是|作为|扮演|角色|专家|助手/.test(content);
  }

  private hasTaskDescription(content: string): boolean {
    return /请|帮我|协助|需要|要求|分析|生成|创建|完成/.test(content);
  }

  private hasOutputFormat(content: string): boolean {
    return /格式|输出|按照|结构|形式|包含|列出|分成/.test(content);
  }

  private isContentTooVague(content: string): boolean {
    const vagueWords = ['帮我', '写一个', '分析一下', '说说'];
    const specificWords = ['具体', '详细', '步骤', '要求', '标准'];

    const vagueCount = vagueWords.filter(word => content.includes(word)).length;
    const specificCount = specificWords.filter(word => content.includes(word)).length;

    return vagueCount > specificCount && content.length < 100;
  }
}

// 导出单例
export const qualityAnalyzer = new PromptQualityAnalyzer();

// 导出增强分析器实例（向后兼容）
export const enhancedQualityAnalyzer = qualityAnalyzer;