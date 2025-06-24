

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';


export class SemanticSearchTool extends BaseMCPTool {
  readonly name = 'semantic_search';
  readonly description = '基于语义理解的智能提示词搜索，理解用户意图而非仅匹配关键词';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        intent: {
          type: 'string', 
          description: '用户意图描述，例如："我想写一封道歉邮件"、"需要分析代码性能"',
          required: true,
        } as ToolParameter,
        context: {
          type: 'string',
          description: '使用场景上下文，例如："商务环境"、"技术会议"、"学术论文"',
          required: false,
        } as ToolParameter,
        output_style: {
          type: 'string',
          description: '期望输出风格：professional（专业）、casual（随意）、technical（技术）、creative（创意）',
          required: false,
        } as ToolParameter,
        domain: {
          type: 'string',
          description: '专业领域：business（商业）、tech（技术）、academic（学术）、creative（创意）、legal（法律）',
          required: false,
        } as ToolParameter,
        confidence_threshold: {
          type: 'number',
          description: '匹配置信度阈值（0-1），默认0.7',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    // 参数验证
    this.validateParams(params, ['intent']);

    const {
      intent,
      context: searchContext = '',
      output_style = 'professional',
      domain,
      confidence_threshold = 0.7
    } = params;

    this.logExecution('开始语义搜索', context, { 
      intent: intent.substring(0, 50), // 截取前50字符用于日志
      domain, 
      output_style 
    });

    // 获取存储实例
    const storage = this.getStorage();

    try {
      // 1. 意图分析和关键词提取
      const analyzedIntent = await this.analyzeUserIntent(intent, searchContext, domain);
      
      // 2. 多维度搜索
      const searchResults = await this.performMultiDimensionalSearch(
        analyzedIntent, 
        output_style, 
        context.userId
      );

      // 3. 语义相似度排序
      const rankedResults = await this.rankBySemanticSimilarity(
        searchResults, 
        intent, 
        confidence_threshold
      );

      // 4. 生成使用建议
      const recommendations = this.generateUsageRecommendations(rankedResults, searchContext);

      return {
        success: true,
        data: {
          results: rankedResults.slice(0, 8), // 限制最佳结果
          analysis: analyzedIntent,
          search_strategy: '语义理解 + 多维度匹配',
          confidence_scores: rankedResults.map(r => r.confidence),
          recommendations
        },
        message: `找到 ${rankedResults.length} 个语义匹配结果`
      };

    } catch (error) {
      return {
        success: false,
        message: '语义搜索失败'
      };
    }
  }

  
  private async analyzeUserIntent(intent: string, context: string, domain?: string) {
    const keywords = this.extractKeywords(intent);
    const intentType = this.classifyIntent(intent);
    const emotionalTone = this.detectEmotionalTone(intent);
    
    return {
      keywords,
      type: intentType,
      tone: emotionalTone,
      domain: domain || this.inferDomain(intent),
      complexity: this.assessComplexity(intent),
      urgency: this.detectUrgency(intent, context)
    };
  }

  
  private async performMultiDimensionalSearch(analyzedIntent: any, outputStyle: string, userId?: string) {
    const storage = this.getStorage();
    
    const searchPromises = [
      // 关键词搜索
      storage.searchPrompts(analyzedIntent.keywords.join(' '), userId),
      // 分类搜索
      analyzedIntent.domain ? storage.getPromptsByCategory(analyzedIntent.domain, userId) : Promise.resolve([]),
      // 标签搜索
      storage.getPrompts({ tags: [analyzedIntent.type, outputStyle], userId })
    ];

    const results = await Promise.all(searchPromises);
    return results.flat().filter((prompt, index, self) => 
      index === self.findIndex(p => p.id === prompt.id)
    );
  }

  
  private async rankBySemanticSimilarity(prompts: Prompt[], userIntent: string, threshold: number) {
    return prompts
      .map(prompt => ({
        ...prompt,
        confidence: this.calculateSemanticSimilarity(prompt, userIntent)
      }))
      .filter(p => p.confidence >= threshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // === 辅助方法 ===

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private classifyIntent(intent: string): string {
    const patterns = {
      'writing': /写|编写|撰写|起草/,
      'analysis': /分析|评估|检查|审查/,
      'translation': /翻译|转换|改写/,
      'coding': /代码|编程|开发|bug/,
      'email': /邮件|email|信件/,
      'presentation': /演讲|展示|汇报/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(intent)) return type;
    }
    return 'general';
  }

  private detectEmotionalTone(intent: string): string {
    if (/道歉|抱歉|sorry/.test(intent)) return 'apologetic';
    if (/祝贺|恭喜|庆祝/.test(intent)) return 'celebratory';
    if (/紧急|urgent|急/.test(intent)) return 'urgent';
    if (/正式|official|formal/.test(intent)) return 'formal';
    return 'neutral';
  }

  private inferDomain(intent: string): string {
    const domainKeywords = {
      'business': ['商务', '商业', '销售', '市场', '客户'],
      'tech': ['技术', '代码', '系统', '开发', '程序'],
      'academic': ['学术', '研究', '论文', '分析'],
      'creative': ['创意', '设计', '艺术', '创作'],
      'legal': ['法律', '合同', '条款', '协议']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => intent.includes(keyword))) {
        return domain;
      }
    }
    return 'general';
  }

  private assessComplexity(intent: string): 'simple' | 'medium' | 'complex' {
    const wordCount = intent.split(/\s+/).length;
    if (wordCount < 5) return 'simple';
    if (wordCount < 15) return 'medium';
    return 'complex';
  }

  private detectUrgency(intent: string, context: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['紧急', '急', 'urgent', '立即', '马上', 'asap'];
    const urgentCount = urgentKeywords.filter(keyword => 
      intent.includes(keyword) || context.includes(keyword)
    ).length;
    
    if (urgentCount > 0) return 'high';
    if (context.includes('deadline') || context.includes('截止')) return 'medium';
    return 'low';
  }

  private calculateSemanticSimilarity(prompt: Prompt, userIntent: string): number {
    // 简化的相似度计算
    const promptText = `${prompt.name} ${prompt.description} ${prompt.tags?.join(' ')}`.toLowerCase();
    const intentWords = userIntent.toLowerCase().split(/\s+/);
    
    const matches = intentWords.filter(word => promptText.includes(word)).length;
    return Math.min(matches / intentWords.length, 1.0);
  }

  private generateUsageRecommendations(results: any[], context: string): string[] {
    const recommendations = [
      '💡 建议根据具体场景调整提示词参数',
      '🎯 可以组合多个提示词获得更好效果'
    ];

    if (results.length > 5) {
      recommendations.push('📊 结果较多，建议缩小搜索范围');
    }

    if (context.includes('urgent')) {
      recommendations.push('⚡ 检测到紧急需求，推荐使用置信度最高的前3个结果');
    }

    return recommendations;
  }
}

// 创建工具实例
export const semanticSearchTool = new SemanticSearchTool();

// 向后兼容的函数导出（保持现有API不变）
export async function handleSemanticSearch(params: any, userId?: string) {
  return semanticSearchTool.handleExecution(params, userId);
}

// 工具定义导出（用于注册）
export const semanticSearchToolDef = semanticSearchTool.getToolDefinition();
 