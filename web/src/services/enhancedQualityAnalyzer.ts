import { PromptDetails } from '@/types';
import { PromptQualityAnalysis, QualityDimension } from '@/types/performance';
import { PromptQualityAnalyzer } from './qualityAnalyzer';

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
      successExamples
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
        impact: 'high'
      });
    }

    // 检查任务描述
    if (!this.hasTaskDescription(content)) {
      tips.push({
        category: 'clarity',
        title: '用"请"开头，礼貌地提出要求',
        description: '明确告诉AI你需要它做什么，就像和朋友聊天一样自然',
        example: '请帮我分析这篇文章的主要观点...',
        impact: 'high'
      });
    }

    // 检查输出格式
    if (!this.hasOutputFormat(content)) {
      tips.push({
        category: 'format',
        title: '告诉AI你想要什么样的回答',
        description: '指定回答的格式，就像点菜时说要什么一样',
        example: '请用1、2、3的列表形式回答...',
        impact: 'medium'
      });
    }

    // 检查具体性
    if (this.isContentTooVague(content)) {
      tips.push({
        category: 'effectiveness',
        title: '提供更多背景信息',
        description: '想象你在向朋友解释问题，提供足够的细节',
        example: '我是一名大学生，正在写关于环保的论文...',
        impact: 'medium'
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
    if (content.match(/\d+\./g)?.length > 3) complexityScore += 1;
    
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
      if (dimension && dimension.score < 70) {
        let potentialImprovement = 0;
        let actionItems: string[] = [];
        
        switch (key) {
          case 'clarity':
            potentialImprovement = 85 - dimension.score;
            actionItems = [
              '使用更简单直接的语言',
              '删除不必要的修饰词',
              '一个句子表达一个意思'
            ];
            break;
          case 'actionability':
            potentialImprovement = 80 - dimension.score;
            actionItems = [
              '使用具体的动作词汇',
              '提供分步骤的指导',
              '添加具体的数量要求'
            ];
            break;
          case 'completeness':
            potentialImprovement = 75 - dimension.score;
            actionItems = [
              '补充背景信息',
              '明确目标和约束',
              '添加使用场景说明'
            ];
            break;
        }
        
        if (potentialImprovement > 0) {
          priorities.push({
            area: dimension.name,
            reason: `当前得分${dimension.score}分，有较大提升空间`,
            currentScore: dimension.score,
            potentialImprovement,
            actionItems
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
        applyable: true
      });
    }

    // 缺少明确任务的快速修复
    if (!this.hasTaskDescription(content)) {
      fixes.push({
        issue: '任务指令不够明确',
        solution: '添加明确的请求词汇',
        beforeExample: content,
        afterExample: content.replace(/^/, '请帮我'),
        applyable: true
      });
    }

    // 提示词过短的快速修复
    if (content.length < 50) {
      fixes.push({
        issue: '提示词内容过于简单',
        solution: '添加更多背景信息和要求',
        beforeExample: content,
        afterExample: content + '\n\n请详细说明，并提供具体例子。',
        applyable: true
      });
    }

    return fixes;
  }

  /**
   * 根据分类生成成功示例
   */
  private generateSuccessExamples(category: string): string[] {
    const examples: Record<string, string[]> = {
      '文案': [
        '你是一位资深的营销文案专家。请为我们的新产品写一段吸引人的宣传文案，产品是智能手表。目标受众是年轻上班族，文案长度150字左右，语调要活泼有趣。',
        '作为品牌营销专家，请帮我创作一条朋友圈广告文案。产品：咖啡店新品拿铁，受众：白领女性，要求：温暖治愈风格，包含优惠信息。'
      ],
      '编程': [
        '你是一位Python编程专家。请帮我写一个函数，功能是计算两个日期之间的天数差。要求：输入为字符串格式的日期，输出为整数，包含错误处理和详细注释。',
        '作为前端开发专家，请帮我创建一个响应式导航栏组件，使用HTML、CSS和JavaScript。要求：支持移动端，有下拉菜单，代码要简洁易懂。'
      ],
      '学术': [
        '你是一位学术研究专家。请帮我分析"人工智能对教育的影响"这个主题，从积极影响、潜在挑战、未来趋势三个角度进行论述，每个角度300字左右，要求有理有据。',
        '作为论文写作指导老师，请帮我制定一个关于"可持续发展"的研究计划，包括研究问题、研究方法、时间安排、预期成果等部分。'
      ],
      '通用': [
        '你是一位经验丰富的顾问。请帮我分析一下从北京到上海的旅行方案，考虑时间、成本、舒适度三个因素，提供2-3个选择，并说明各自的优缺点。',
        '作为生活助手，请为我制定一个健康的一周运动计划，我是初学者，每天有1小时时间，希望既能减肥又能增强体质。请详细说明每天的运动内容和注意事项。'
      ]
    };

    return examples[category] || examples['通用'];
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