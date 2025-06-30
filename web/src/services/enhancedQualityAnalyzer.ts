import { PromptDetails } from '@/types';
import { PromptQualityAnalyzer, PromptQualityAnalysis, QualityDimension } from './qualityAnalyzer';

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

export class EnhancedQualityAnalyzer extends PromptQualityAnalyzer {
  
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
        ]
      },

      // 文案写作相关
      {
        keywords: ['文案', '写作', '创作', '文字'],
        examples: [
          '你是一位专业的文案创作者。请帮我创作一段营销文案，要求：目标明确，语言生动，能够吸引目标受众并促进行动。',
          '作为内容策划专家，请帮我制定一个内容创作方案，要求：结构清晰，观点鲜明，包含具体的执行步骤。',
        ]
      },

      // 学术研究相关
      {
        keywords: ['学术', '研究', '论文', '科研'],
        examples: [
          '你是一位学术研究专家。请帮我分析一个研究主题，要求：逻辑严密，论据充分，提供多角度的深入分析。',
          '作为研究方法专家，请指导我设计一个研究方案，要求：方法科学，步骤清晰，考虑可行性和有效性。',
        ]
      },

      // 翻译语言相关
      {
        keywords: ['翻译', '语言', '多语言'],
        examples: [
          '你是一位专业的翻译专家。请帮我进行翻译工作，要求：准确传达原意，语言地道流畅，符合目标语言的表达习惯。',
          '作为语言学习顾问，请帮我制定学习计划，要求：目标明确，方法科学，提供具体的学习步骤和时间安排。',
        ]
      },

      // 对话交流相关
      {
        keywords: ['对话', '交流', '沟通', '聊天'],
        examples: [
          '你是一位智能助手。请帮我解决问题，要求：理解准确，回答全面，提供实用的建议和解决方案。',
          '作为沟通专家，请帮我改善交流效果，要求：分析深入，建议具体，考虑不同场景的应用。',
        ]
      },

      // 设计艺术相关
      {
        keywords: ['设计', '艺术', '绘画', '美术', '创意'],
        examples: [
          '你是一位设计专家。请帮我创作设计方案，要求：创意独特，美观实用，符合设计原则和用户需求。',
          '作为艺术指导，请帮我提升创作水平，要求：指导专业，建议具体，提供实用的技巧和方法。',
        ]
      },

      // 商业金融相关
      {
        keywords: ['商业', '金融', '投资', '财务', '管理'],
        examples: [
          '你是一位商业策略专家。请帮我分析商业问题，要求：分析全面，建议实用，考虑市场环境和竞争因素。',
          '作为投资顾问，请帮我制定投资策略，要求：风险可控，收益合理，提供具体的操作建议。',
        ]
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

export const enhancedQualityAnalyzer = new EnhancedQualityAnalyzer(); 