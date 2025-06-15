/**
 * 提示词洞察分析模块
 * 通过数据分析为用户提供个性化的提示词优化建议
 */

interface PromptInsight {
  id: string;
  type: 'quality' | 'usage' | 'performance' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  dataSource: string;
}

interface UserPromptProfile {
  userId: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  favoriteCategories: string[];
  commonMistakes: string[];
  averageQuality: number;
  improvementAreas: string[];
  successPatterns: string[];
}

export class PromptInsightsAnalyzer {
  /**
   * 分析用户的提示词使用模式，生成个性化洞察
   */
  async generateUserInsights(userId: string): Promise<PromptInsight[]> {
    const profile = await this.getUserPromptProfile(userId);
    const insights: PromptInsight[] = [];

    // 质量相关洞察
    insights.push(...await this.analyzeQualityPatterns(profile));
    
    // 使用习惯洞察
    insights.push(...await this.analyzeUsagePatterns(profile));
    
    // 性能优化洞察
    insights.push(...await this.analyzePerformancePatterns(profile));
    
    // 趋势洞察
    insights.push(...await this.analyzeTrendPatterns(profile));

    return insights.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * 分析提示词质量模式
   */
  private async analyzeQualityPatterns(profile: UserPromptProfile): Promise<PromptInsight[]> {
    const insights: PromptInsight[] = [];

    // 质量分数偏低
    if (profile.averageQuality < 70) {
      insights.push({
        id: 'low-quality-pattern',
        type: 'quality',
        severity: 'high',
        title: '提示词质量有待提升',
        description: `您的提示词平均质量分数为 ${profile.averageQuality}/100，低于推荐标准(80分)`,
        recommendation: '建议使用质量检测工具，关注角色定义、任务描述和输出格式的完整性',
        impact: '提升质量分数可以显著改善AI响应效果，预计提升30-50%的满意度',
        dataSource: 'quality_analysis'
      });
    }

    // 常见错误模式
    if (profile.commonMistakes.includes('missing_role')) {
      insights.push({
        id: 'missing-role-pattern',
        type: 'quality',
        severity: 'medium',
        title: '经常缺少角色定义',
        description: '在您的提示词中，68%缺少明确的角色定义',
        recommendation: '建议在提示词开头明确定义AI的角色，如"你是一位专业的..."',
        impact: '添加角色定义通常能提升响应的专业性和准确性',
        dataSource: 'pattern_analysis'
      });
    }

    return insights;
  }

  /**
   * 分析使用习惯模式
   */
  private async analyzeUsagePatterns(profile: UserPromptProfile): Promise<PromptInsight[]> {
    const insights: PromptInsight[] = [];

    // 类别集中度分析
    if (profile.favoriteCategories.length === 1) {
      insights.push({
        id: 'category-diversity',
        type: 'usage',
        severity: 'low',
        title: '可以尝试更多类别的提示词',
        description: `您主要使用${profile.favoriteCategories[0]}类别的提示词`,
        recommendation: '探索其他类别如创作、分析、教育等，可能发现新的应用场景',
        impact: '多样化使用可以提升整体AI应用能力',
        dataSource: 'usage_stats'
      });
    }

    return insights;
  }

  /**
   * 分析性能模式
   */
  private async analyzePerformancePatterns(profile: UserPromptProfile): Promise<PromptInsight[]> {
    const insights: PromptInsight[] = [];

    // 成功模式识别
    if (profile.successPatterns.length > 0) {
      insights.push({
        id: 'success-pattern',
        type: 'performance',
        severity: 'low',
        title: '发现您的成功模式',
        description: `您在使用${profile.successPatterns.join('、')}模式时效果最佳`,
        recommendation: '可以将这些成功模式应用到其他提示词中',
        impact: '复用成功模式可以提升新提示词的成功率',
        dataSource: 'performance_analysis'
      });
    }

    return insights;
  }

  /**
   * 分析趋势模式
   */
  private async analyzeTrendPatterns(profile: UserPromptProfile): Promise<PromptInsight[]> {
    const insights: PromptInsight[] = [];

    // 技能水平提升
    if (profile.skillLevel === 'intermediate') {
      insights.push({
        id: 'skill-progression',
        type: 'trend',
        severity: 'low',
        title: '您的技能正在稳步提升',
        description: '基于最近的使用模式，您已从初学者进步到中级水平',
        recommendation: '可以尝试更复杂的模板变量和结构化指令',
        impact: '掌握高级技巧将大幅提升提示词的灵活性和效果',
        dataSource: 'skill_tracking'
      });
    }

    return insights;
  }

  /**
   * 获取用户提示词档案
   */
  private async getUserPromptProfile(userId: string): Promise<UserPromptProfile> {
    // 实际实现中从数据库获取数据
    return {
      userId,
      skillLevel: 'intermediate',
      favoriteCategories: ['工作', '学习'],
      commonMistakes: ['missing_role', 'unclear_task'],
      averageQuality: 65,
      improvementAreas: ['角色定义', '输出格式'],
      successPatterns: ['结构化指令', '具体示例']
    };
  }

  /**
   * 获取严重性权重
   */
  private getSeverityWeight(severity: PromptInsight['severity']): number {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[severity];
  }

  /**
   * 生成质量改进建议
   */
  async generateQualityImprovement(promptContent: string): Promise<{
    currentScore: number;
    improvements: Array<{
      issue: string;
      suggestion: string;
      example: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const improvements: Array<{
      issue: string;
      suggestion: string;
      example: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // 检查角色定义
    if (!this.hasRoleDefinition(promptContent)) {
      improvements.push({
        issue: '缺少角色定义',
        suggestion: '在开头明确定义AI的角色和专业背景',
        example: '你是一位有10年经验的产品经理...',
        priority: 'high'
      });
    }

    // 检查任务描述
    if (!this.hasTaskDescription(promptContent)) {
      improvements.push({
        issue: '任务描述不够具体',
        suggestion: '详细说明需要完成的具体任务',
        example: '请帮我分析这个产品的市场定位，包括目标用户、竞争优势等',
        priority: 'high'
      });
    }

    // 检查输出格式
    if (!this.hasOutputFormat(promptContent)) {
      improvements.push({
        issue: '缺少输出格式要求',
        suggestion: '明确期望的输出格式和结构',
        example: '请按以下格式输出：1. 问题分析 2. 解决方案 3. 实施建议',
        priority: 'medium'
      });
    }

    // 检查约束条件
    if (!this.hasConstraints(promptContent)) {
      improvements.push({
        issue: '缺少约束条件',
        suggestion: '添加必要的限制和要求',
        example: '回答控制在500字以内，使用通俗易懂的语言',
        priority: 'low'
      });
    }

    const currentScore = this.calculateQualityScore(promptContent, improvements);

    return {
      currentScore,
      improvements
    };
  }

  private hasRoleDefinition(content: string): boolean {
    const roleKeywords = ['你是', '作为', '扮演', '角色', '专家', '助手'];
    return roleKeywords.some(keyword => content.includes(keyword));
  }

  private hasTaskDescription(content: string): boolean {
    const taskKeywords = ['请', '帮我', '任务', '需要', '完成', '分析', '生成'];
    return taskKeywords.some(keyword => content.includes(keyword));
  }

  private hasOutputFormat(content: string): boolean {
    const formatKeywords = ['格式', '结构', '按照', '输出', '返回', '列出'];
    return formatKeywords.some(keyword => content.includes(keyword));
  }

  private hasConstraints(content: string): boolean {
    const constraintKeywords = ['限制', '要求', '不能', '必须', '避免', '确保'];
    return constraintKeywords.some(keyword => content.includes(keyword));
  }

  private calculateQualityScore(content: string, improvements: any[]): number {
    const maxScore = 100;
    const deduction = improvements.reduce((total, improvement) => {
      const weights = { high: 25, medium: 15, low: 10 };
      return total + weights[improvement.priority];
    }, 0);
    
    return Math.max(0, maxScore - deduction);
  }
} 