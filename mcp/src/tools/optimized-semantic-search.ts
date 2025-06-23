/**
 * 优化语义搜索工具
 * 
 * 五层智能搜索架构：
 * 1. 用户意图分析层 - 深度理解用户需求
 * 2. 多维度搜索执行层 - 全方位搜索覆盖
 * 3. 高级相关性评分层 - 精准相关性计算
 * 4. 结果优化与排序层 - 智能过滤排序
 * 5. 简洁化对话展示层 - 用户友好展示
 */

import { BaseMCPTool } from '../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../types.js';

// 定义本地类型接口
interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
}

interface ToolContext {
  userId?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
}

/**
 * 用户意图分析结果
 */
interface UserIntent {
  category: 'create' | 'analyze' | 'optimize' | 'translate' | 'explain' | 'plan' | 'other';
  domain: 'business' | 'technical' | 'creative' | 'academic' | 'communication' | 'legal' | 'general';
  style: 'formal' | 'casual' | 'creative' | 'technical' | 'concise' | 'detailed';
  urgency: 'low' | 'medium' | 'high';
  keywords: string[];
  confidence: number;
}

/**
 * 搜索维度配置
 */
interface SearchDimensions {
  title_weight: number;
  description_weight: number;
  content_weight: number;
  category_weight: number;
  tags_weight: number;
}

/**
 * 搜索结果项
 */
interface SearchResultItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  matchReason: string;
  preview: string;
  quality: number;
  isPublic: boolean;
  version: number;
}

/**
 * 优化语义搜索工具
 */
export class OptimizedSemanticSearchTool extends BaseMCPTool {
  readonly name = 'smart_semantic_search';
  readonly description = '🎯 智能语义搜索 - 用自然语言描述需求，快速找到最相关的提示词';

  // 停词列表
  private readonly stopWords = new Set([\n    // 中文停用词\n    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',\n    '这', '那', '他', '她', '它', '你', '我们', '他们', '她们', '这个', '那个',\n    '以', '及', '为', '与', '等', '或', '但', '从', '到', '对', '于', '给', '把',\n    '将', '让', '使', '被', '所', '可', '能', '会', '要', '想', '应该', '可以', '能够',\n    '需要', '想要', '希望', '用于', '关于', '帮助', '帮我', '请', '谢谢', '如何', '怎么',\n    \n    // 英文停用词\n    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',\n    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',\n    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',\n    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',\n    'help', 'please', 'thank', 'thanks', 'how', 'what', 'when', 'where', 'why', 'who'\n  ]);


  // 意图识别关键词
  private readonly intentKeywords = {
    create: ['创建', '写', '生成', '制作', '编写', '设计', 'create', 'write', 'generate', 'make', 'design'],
    analyze: ['分析', '检查', '评估', '审查', '研究', 'analyze', 'check', 'evaluate', 'review', 'study'],
    optimize: ['优化', '改进', '提升', '完善', '修改', 'optimize', 'improve', 'enhance', 'refine', 'modify'],
    translate: ['翻译', '转换', '转化', '转述', 'translate', 'convert', 'transform', 'rephrase'],
    explain: ['解释', '说明', '阐述', '描述', '讲解', 'explain', 'describe', 'illustrate', 'clarify'],
    plan: ['计划', '规划', '安排', '策划', '准备', 'plan', 'schedule', 'organize', 'prepare']
  };

  // 领域识别关键词
  private readonly domainKeywords = {
    business: ['商务', '商业', '销售', '营销', '管理', '企业', 'business', 'sales', 'marketing', 'management'],
    technical: ['技术', '代码', '编程', '开发', '算法', '系统', 'technical', 'code', 'programming', 'development'],
    creative: ['创意', '创作', '艺术', '设计', '文案', '故事', 'creative', 'art', 'design', 'story', 'content'],
    academic: ['学术', '研究', '论文', '教学', '学习', '科学', 'academic', 'research', 'study', 'education'],
    communication: ['沟通', '交流', '演讲', '邮件', '聊天', 'communication', 'presentation', 'email', 'chat'],
    legal: ['法律', '合同', '条款', '协议', '法规', 'legal', 'contract', 'agreement', 'regulation']
  };

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '用自然语言描述您的需求，例如："写商务邮件"、"分析代码问题"、"创意文案"等',
          required: true,
        } as ToolParameter,
        max_results: {
          type: 'number',
          description: '最多返回几个结果，默认5个',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['query']);

    const { query, max_results = 5 } = params;
    const startTime = performance.now();

    this.logExecution('智能语义搜索开始', context, { 
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      max_results
    });

    try {
      // 第一层：用户意图分析
      const userIntent = this.analyzeUserIntent(query);
      
      // 第二层：多维度搜索执行
      const candidateResults = await this.executeMultiDimensionalSearch(query, userIntent, context.userId);
      
      // 第三层：高级相关性评分
      const scoredResults = this.calculateAdvancedRelevanceScore(candidateResults, query, userIntent);
      
      // 第四层：结果优化与排序
      const optimizedResults = this.optimizeAndSortResults(scoredResults, max_results);
      
      // 第五层：简洁化对话展示
      const formattedOutput = this.formatForConversationalDisplay(optimizedResults, query, userIntent);

      const executionTime = performance.now() - startTime;

      this.logExecution('智能语义搜索完成', context, {
        candidatesFound: candidateResults.length,
        finalResults: optimizedResults.length,
        executionTime: `${executionTime.toFixed(2)}ms`,
        intentCategory: userIntent.category,
        intentDomain: userIntent.domain
      });

      return {
        success: true,
        data: {
          results: optimizedResults,
          conversation_display: formattedOutput,
          search_metadata: {
            query,
            intent: userIntent,
            total_candidates: candidateResults.length,
            final_count: optimizedResults.length,
            execution_time_ms: Math.round(executionTime)
          }
        },
        message: `🎯 智能搜索完成，为您找到 ${optimizedResults.length} 个高度相关的提示词`
      };

    } catch (error) {
      console.error('[OptimizedSemanticSearch] 搜索失败:', error);
      return {
        success: false,
        message: '智能搜索失败，请重试或联系技术支持'
      };
    }
  }

  /**
   * 第一层：用户意图分析
   */
  private analyzeUserIntent(query: string): UserIntent {
    const lowerQuery = query.toLowerCase();
    
    // 意图分类识别
    let category: UserIntent['category'] = 'other';
    let maxCategoryScore = 0;
    
    for (const [intentType, keywords] of Object.entries(this.intentKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerQuery.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (score > maxCategoryScore) {
        maxCategoryScore = score;
        category = intentType as UserIntent['category'];
      }
    }

    // 领域识别
    let domain: UserIntent['domain'] = 'general';
    let maxDomainScore = 0;
    
    for (const [domainType, keywords] of Object.entries(this.domainKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerQuery.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (score > maxDomainScore) {
        maxDomainScore = score;
        domain = domainType as UserIntent['domain'];
      }
    }

    // 风格分析
    const style = this.analyzeStyle(lowerQuery);
    
    // 紧急程度分析
    const urgency = this.analyzeUrgency(lowerQuery);
    
    // 关键词提取
    const keywords = this.extractKeywords(query);
    
    // 置信度计算
    const confidence = Math.min(0.9, Math.max(0.3, (maxCategoryScore + maxDomainScore + keywords.length) / 10));

    return {
      category,
      domain,
      style,
      urgency,
      keywords,
      confidence
    };
  }

  /**
   * 风格分析
   */
  private analyzeStyle(query: string): UserIntent['style'] {
    if (/正式|官方|商务|专业|formal|official|professional/.test(query)) return 'formal';
    if (/随意|轻松|简单|casual|simple|easy/.test(query)) return 'casual';
    if (/创意|创新|有趣|creative|innovative|interesting/.test(query)) return 'creative';
    if (/技术|专业|详细|technical|detailed|specific/.test(query)) return 'technical';
    if (/简洁|简短|快速|concise|brief|quick/.test(query)) return 'concise';
    return 'detailed';
  }

  /**
   * 紧急程度分析
   */
  private analyzeUrgency(query: string): UserIntent['urgency'] {
    if (/紧急|立即|马上|急需|urgent|immediate|asap/.test(query)) return 'high';
    if (/尽快|较快|soon|quickly/.test(query)) return 'medium';
    return 'low';
  }

  /**
   * 关键词提取
   */
  private extractKeywords(query: string): string[] {\n    // 保留原始查询作为主要关键词\n    const originalQuery = query.trim();\n    \n    // 分词和清理\n    const words = query\n      .toLowerCase()\n      .replace(/[^\\u4e00-\\u9fff\\w\\s]/g, ' ') // 保留中文、字母、数字和空格\n      .split(/\\s+/)\n      .filter(word => \n        word.length > 0 && \n        word.length >= 2 && // 至少2个字符\n        !this.stopWords.has(word) &&\n        !/^[0-9]+$/.test(word) // 排除纯数字\n      );\n    \n    // 构建关键词列表：原始查询 + 分词结果\n    const keywords = [originalQuery, ...words];\n    \n    // 去重并限制数量\n    const uniqueKeywords = [...new Set(keywords)].slice(0, 8);\n    \n    console.log(`[KeywordExtraction] 原始: \"${originalQuery}\", 提取: [${uniqueKeywords.join(', ')}]`);\n    \n    return uniqueKeywords;\n  }


  /**
   * 第二层：多维度搜索执行
   */
  private async executeMultiDimensionalSearch(\n    query: string, \n    intent: UserIntent, \n    userId?: string\n  ): Promise<Prompt[]> {\n    const storage = this.getStorage();\n    const allCandidates = new Set<Prompt>();\n\n    try {\n      console.log(`[MultiDimensionalSearch] 开始搜索: \"${query}\", 意图: ${intent.category}, 领域: ${intent.domain}`);\n      \n      // 1. 主要搜索：使用改进后的搜索功能\n      const mainResults = await storage.searchPrompts(query, userId, true);\n      if (Array.isArray(mainResults)) {\n        mainResults.forEach(prompt => allCandidates.add(prompt));\n        console.log(`[MultiDimensionalSearch] 主搜索找到 ${mainResults.length} 个结果`);\n      }\n\n      // 2. 关键词补充搜索（仅搜索前2个高价值关键词）\n      const highValueKeywords = intent.keywords\n        .filter(keyword => keyword !== query && keyword.length >= 2)\n        .slice(0, 2);\n        \n      for (const keyword of highValueKeywords) {\n        try {\n          const keywordResults = await storage.searchPrompts(keyword, userId, true);\n          if (Array.isArray(keywordResults)) {\n            keywordResults.forEach(prompt => allCandidates.add(prompt));\n            console.log(`[MultiDimensionalSearch] 关键词 \"${keyword}\" 找到 ${keywordResults.length} 个结果`);\n          }\n        } catch (error) {\n          console.warn(`关键词搜索失败: ${keyword}`, error);\n        }\n      }\n\n      // 3. 分类搜索（如果领域明确且主搜索结果不足）\n      if (allCandidates.size < 5 && intent.domain !== 'general') {\n        try {\n          const categoryMapping: { [key: string]: string } = {\n            business: '商务',\n            technical: '编程',\n            creative: '创意', \n            academic: '学术',\n            communication: '文案',\n            legal: '通用',\n            health: '健康',\n            education: '教育',\n            lifestyle: '生活'\n          };\n          \n          const categoryName = categoryMapping[intent.domain];\n          if (categoryName) {\n            const categoryResults = await storage.getPrompts({ \n              category: categoryName,\n              isPublic: true,\n              pageSize: 10\n            });\n            if (categoryResults?.data) {\n              categoryResults.data.forEach(prompt => allCandidates.add(prompt));\n              console.log(`[MultiDimensionalSearch] 分类 \"${categoryName}\" 找到 ${categoryResults.data.length} 个结果`);\n            }\n          }\n        } catch (error) {\n          console.warn(`分类搜索失败: ${intent.domain}`, error);\n        }\n      }\n\n      // 4. 智能兜底策略（仅在结果极少时启用）\n      if (allCandidates.size < 3) {\n        try {\n          console.log('[MultiDimensionalSearch] 结果不足，启用兜底策略');\n          \n          // 基于意图分类的兜底搜索\n          const fallbackQueries = {\n            'find': ['常用', '推荐', '热门'],\n            'create': ['模板', '示例', '框架'],\n            'improve': ['优化', '改进', '提升'],\n            'analyze': ['分析', '总结', '评估'],\n            'other': ['通用', '实用', '效率']\n          };\n          \n          const fallbackKeywords = fallbackQueries[intent.category] || fallbackQueries['other'];\n          \n          for (const fallbackKeyword of fallbackKeywords.slice(0, 1)) { // 只用1个兜底关键词\n            const fallbackResults = await storage.searchPrompts(fallbackKeyword, userId, true);\n            if (Array.isArray(fallbackResults)) {\n              fallbackResults.slice(0, 5).forEach(prompt => allCandidates.add(prompt)); // 限制兜底结果数量\n            }\n          }\n        } catch (error) {\n          console.warn('兜底搜索失败', error);\n        }\n      }\n\n      // 转换为数组并限制候选集大小（性能考虑）\n      const candidatesArray = Array.from(allCandidates).slice(0, 50);\n      \n      console.log(`[MultiDimensionalSearch] 搜索完成，共收集 ${candidatesArray.length} 个候选结果`);\n      return candidatesArray;\n\n    } catch (error) {\n      console.error('[MultiDimensionalSearch] 搜索失败:', error);\n      // 返回空数组而不是抛出错误，保证系统稳定性\n      return [];\n    }\n  }


  /**
   * 第三层：高级相关性评分
   */
  private calculateAdvancedRelevanceScore(
    candidates: Prompt[], 
    query: string, 
    intent: UserIntent
  ): SearchResultItem[] {
    const lowerQuery = query.toLowerCase();
    
    return candidates.map(prompt => {
      // 多维度评分权重配置
      const weights = {
        exactMatch: 0.40,      // 精确匹配权重 40%
        keywordDistribution: 0.25,  // 关键词分布权重 25%
        semanticSimilarity: 0.20,   // 语义相似度权重 20%
        intentAlignment: 0.10,      // 意图匹配权重 10%
        qualityScore: 0.05          // 质量评分权重 5%
      };

      // 1. 精确匹配评分
      const exactMatchScore = this.calculateExactMatchScore(prompt, lowerQuery);
      
      // 2. 关键词分布评分
      const keywordScore = this.calculateKeywordDistributionScore(prompt, intent.keywords);
      
      // 3. 语义相似度评分
      const semanticScore = this.calculateSemanticSimilarityScore(prompt, query, intent);
      
      // 4. 意图匹配评分
      const intentScore = this.calculateIntentAlignmentScore(prompt, intent);
      
      // 5. 质量评分
      const qualityScore = this.calculateQualityScore(prompt);

      // 综合相关性评分
      const relevanceScore = (
        exactMatchScore * weights.exactMatch +
        keywordScore * weights.keywordDistribution +
        semanticScore * weights.semanticSimilarity +
        intentScore * weights.intentAlignment +
        qualityScore * weights.qualityScore
      );

      // 生成匹配原因
      const matchReason = this.generateMatchReason(
        exactMatchScore, keywordScore, semanticScore, intentScore, intent
      );

      return {
        id: prompt.id || prompt.name || '',
        name: prompt.name || '',
        description: prompt.description || '',
        category: prompt.category || '未分类',
        tags: prompt.tags || [],
        relevanceScore: Math.round(relevanceScore * 100),
        matchReason,
        preview: this.generatePreview(prompt),
        quality: Math.round(qualityScore * 100),
        isPublic: prompt.is_public || false,
        version: prompt.version || 1
      };
    });
  }

  /**
   * 精确匹配评分
   */
  private calculateExactMatchScore(prompt: Prompt, query: string): number {
    let score = 0;
    const searchFields = [
      { field: prompt.name, weight: 0.4 },
      { field: prompt.description, weight: 0.3 },
      { field: prompt.category, weight: 0.2 },
      { field: (prompt.tags || []).join(' '), weight: 0.1 }
    ];

    for (const { field, weight } of searchFields) {
      if (field && field.toLowerCase().includes(query)) {
        score += weight;
      }
    }

    return Math.min(1, score);
  }

  /**
   * 关键词分布评分
   */
  private calculateKeywordDistributionScore(prompt: Prompt, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    const promptText = `${prompt.name} ${prompt.description} ${prompt.category} ${(prompt.tags || []).join(' ')}`.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => promptText.includes(keyword.toLowerCase()));
    
    return matchedKeywords.length / keywords.length;
  }

  /**
   * 语义相似度评分
   */
  private calculateSemanticSimilarityScore(prompt: Prompt, query: string, intent: UserIntent): number {
    // 简化的语义相似度计算
    const promptText = `${prompt.name} ${prompt.description}`.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    let matches = 0;
    for (const word of queryWords) {
      if (word.length > 2 && promptText.includes(word)) {
        matches++;
      }
    }
    
    return Math.min(1, matches / queryWords.length);
  }

  /**
   * 意图匹配评分
   */
  private calculateIntentAlignmentScore(prompt: Prompt, intent: UserIntent): number {
    let score = 0;
    
    // 类别匹配
    const categoryKeywords = this.intentKeywords[intent.category] || [];
    const promptText = `${prompt.name} ${prompt.description}`.toLowerCase();
    
    for (const keyword of categoryKeywords) {
      if (promptText.includes(keyword.toLowerCase())) {
        score += 0.5;
      }
    }
    
    // 领域匹配
    const domainKeywords = this.domainKeywords[intent.domain] || [];
    for (const keyword of domainKeywords) {
      if (promptText.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }
    
    return Math.min(1, score);
  }

  /**
   * 质量评分
   */
  private calculateQualityScore(prompt: Prompt): number {
    let score = 0.5; // 基础分
    
    // 描述质量
    if (prompt.description && prompt.description.length > 20) score += 0.2;
    if (prompt.description && prompt.description.length > 50) score += 0.1;
    
    // 标签丰富度
    if (prompt.tags && prompt.tags.length > 0) score += 0.1;
    if (prompt.tags && prompt.tags.length > 2) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * 生成匹配原因
   */
  private generateMatchReason(
    exactMatch: number, 
    keywordScore: number, 
    semanticScore: number, 
    intentScore: number,
    intent: UserIntent
  ): string {
    const reasons = [];
    
    if (exactMatch > 0.7) reasons.push('精确匹配');
    else if (exactMatch > 0.4) reasons.push('部分匹配');
    
    if (keywordScore > 0.6) reasons.push('关键词匹配');
    if (semanticScore > 0.5) reasons.push('语义相关');
    if (intentScore > 0.4) reasons.push(`${intent.category}意图匹配`);
    
    return reasons.length > 0 ? reasons.join(' • ') : '基础匹配';
  }

  /**
   * 生成预览
   */
  private generatePreview(prompt: Prompt): string {
      let content = '';
      
      // 优先从messages中提取实际内容
      if (prompt.messages) {
        try {
          if (Array.isArray(prompt.messages)) {
            // 查找包含实际提示词内容的消息
            const contentMsg = prompt.messages.find(msg => {
              if (typeof msg === 'object' && msg !== null && 'content' in msg) {
                const msgContent = (msg as any).content;
                return typeof msgContent === 'string' && msgContent.trim().length > 20;
              }
              return false;
            });
            
            if (contentMsg) {
              content = (contentMsg as any).content;
            } else if (prompt.messages.length > 0) {
              // 如果没找到content字段，尝试获取第一个非空消息
              const firstMsg = prompt.messages[0];
              if (typeof firstMsg === 'string') {
                content = firstMsg;
              } else if (typeof firstMsg === 'object' && firstMsg !== null) {
                // 尝试各种可能的字段名
                const msgObj = firstMsg as any;
                content = msgObj.content || msgObj.text || msgObj.prompt || msgObj.message || '';
              }
            }
          } else if (typeof prompt.messages === 'string') {
            content = prompt.messages;
          } else if (typeof prompt.messages === 'object' && prompt.messages !== null) {
            // 处理单个消息对象
            const msgObj = prompt.messages as any;
            content = msgObj.content || msgObj.text || msgObj.prompt || msgObj.message || '';
          }
        } catch (error) {
          console.warn('解析提示词消息内容失败:', error);
        }
      }
      
      // 如果没有从messages中提取到内容，使用描述作为备选
      if (!content || content.trim().length < 20) {
        content = prompt.description || '';
      }
      
      // 如果内容仍然太短，尝试组合多个字段
      if (content.trim().length < 30) {
        const combinedContent = [
          prompt.description,
          prompt.category,
          (prompt.tags || []).join(' ')
        ].filter(Boolean).join(' - ');
        
        if (combinedContent.length > content.length) {
          content = combinedContent;
        }
      }
      
      // 清理和格式化内容
      content = content.trim();
      
      // 如果内容太长，智能截断（保持完整句子）
      if (content.length > 300) {
        // 在句号、问号、感叹号处截断
        const sentences = content.match(/[^.!?]*[.!?]/g) || [];
        let truncated = '';
        
        for (const sentence of sentences) {
          if ((truncated + sentence).length <= 300) {
            truncated += sentence;
          } else {
            break;
          }
        }
        
        // 如果没有找到合适的句子边界，直接截断
        if (truncated.length < 100) {
          truncated = content.substring(0, 300);
          // 尝试在词边界截断
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > 200) {
            truncated = truncated.substring(0, lastSpace);
          }
          truncated += '...';
        }
        
        content = truncated;
      }
      
      return content || '暂无内容预览';
    }


  /**
   * 第四层：结果优化与排序
   */
  private optimizeAndSortResults(scoredResults: SearchResultItem[], maxResults: number): SearchResultItem[] {
    // 1. 过滤低质量结果
    const filtered = scoredResults.filter(result => 
      result.relevanceScore >= 30 && // 相关性阈值
      result.name && result.name.trim().length > 0 &&
      result.description && result.description.trim().length > 0
    );

    // 2. 去重（基于名称相似度）
    const deduplicated = this.removeDuplicates(filtered);

    // 3. 多维排序
    const sorted = deduplicated.sort((a, b) => {
      // 主要按相关性排序
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 5) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // 相关性相近时，按质量排序
      if (Math.abs(a.quality - b.quality) > 10) {
        return b.quality - a.quality;
      }
      
      // 最后按名称排序（确保稳定性）
      return a.name.localeCompare(b.name);
    });

    // 4. 限制结果数量
    return sorted.slice(0, maxResults);
  }

  /**
   * 去重处理
   */
  private removeDuplicates(results: SearchResultItem[]): SearchResultItem[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 第五层：简洁化对话展示
   */
  private formatForConversationalDisplay(
      results: SearchResultItem[], 
      query: string, 
      intent: UserIntent
    ): string {
      if (results.length === 0) {
        return `😔 抱歉，没有找到与"${query}"相关的提示词。\n\n🔍 建议：\n• 尝试使用更简单的关键词\n• 检查是否有拼写错误\n• 或者浏览我们的分类目录`;
      }
  
      let output = `🎯 为您找到 ${results.length} 个与"${query}"相关的提示词：\n\n`;
  
      results.forEach((result, index) => {
        const emoji = this.getEmojiForCategory(result.category);
        const relevanceBar = this.getRelevanceBar(result.relevanceScore);
        
        // 核心：标题、描述、内容是必要的
        output += `**${index + 1}. ${emoji} ${result.name}**\n`;
        output += `📝 **描述：** ${result.description}\n`;
        
        // 最重要：显示实际内容
        if (result.preview && result.preview.trim()) {
          output += `📄 **内容：**\n\`\`\`\n${result.preview}\n\`\`\`\n`;
        }
        
        // 简化其他信息：相关度和匹配原因
        output += `🎯 相关度 ${result.relevanceScore}% | ${result.matchReason}\n`;
        
        // 标签信息（可选）
        if (result.tags.length > 0) {
          output += `🏷️ ${result.tags.slice(0, 3).join(' • ')}\n`;
        }
        
        if (index < results.length - 1) {
          output += '\n---\n\n';
        }
      });
  
      output += `\n\n💬 **使用说明：**\n`;
      output += `上述提示词按相关度排序，每个都包含了完整的内容预览。\n`;
      output += `您可以直接使用这些内容，或者说"我要第X个提示词"获取更多详细信息。\n\n`;
      
      output += `🔄 **需要更多结果？** 尝试使用不同的搜索关键词或浏览相关分类。`;
  
      return output;
    }


  /**
   * 获取分类对应的表情符号
   */
  private getEmojiForCategory(category: string): string {
    const emojiMap: { [key: string]: string } = {
      '商务': '💼', '技术': '💻', '创意': '🎨', '学术': '📚',
      '沟通': '💬', '法律': '⚖️', '营销': '📈', '教育': '🎓',
      '写作': '✍️', '分析': '🔍', '翻译': '🌐', '规划': '📋'
    };
    
    return emojiMap[category] || '📄';
  }

  /**
   * 获取相关度进度条
   */
  private getRelevanceBar(score: number): string {
    const fullBlocks = Math.floor(score / 10);
    const emptyBlocks = 10 - fullBlocks;
    return '█'.repeat(fullBlocks) + '░'.repeat(emptyBlocks);
  }
}

// 创建工具实例
export const optimizedSemanticSearchTool = new OptimizedSemanticSearchTool();

// 工具定义导出
export const optimizedSemanticSearchToolDef = optimizedSemanticSearchTool.getToolDefinition();

// 处理函数导出
export async function handleOptimizedSemanticSearch(
  params: any, 
  context?: { userId?: string; requestId?: string; userAgent?: string }
): Promise<any> {
  const toolContext = {
    userId: context?.userId,
    requestId: context?.requestId || `search_${Date.now()}`,
    timestamp: Date.now(),
    userAgent: context?.userAgent
  };

  const result = await optimizedSemanticSearchTool.execute(params, toolContext);
  
  if (result.success) {
    return {
      content: {
        type: 'text',
        text: result.data.conversation_display || JSON.stringify(result.data, null, 2)
      },
      metadata: result.data.search_metadata
    };
  } else {
    throw new Error(result.message || '搜索失败');
  }
}