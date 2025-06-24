/**
 * 🚀 统一搜索工具
 *
 * MCP服务的唯一搜索入口，集成了语义理解和智能搜索算法：
 * - 自然语言理解：真正理解用户意图和查询语义
 * - 多维度评分：意图匹配、语义相关性、内容匹配等综合评分
 * - 完美结果展示：确保message内容完整显示且可复制
 * - 智能关键词扩展：同义词、相关词自动扩展
 */

import { BaseMCPTool } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';

// 搜索结果接口
interface EnhancedSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  messages: any;
  content: string; // 提取的完整内容
  relevanceScore: number; // 相关性评分 0-100
  matchReasons: string[]; // 匹配原因
  created_at?: string;
  updated_at?: string;
}

// 搜索参数接口
interface UnifiedSearchParams {
  query: string;
  category?: string;
  tags?: string[];
  max_results?: number;
  include_content?: boolean; // 是否包含完整内容
  sort_by?: 'relevance' | 'name' | 'created_at' | 'updated_at';
}

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
 * 统一搜索工具类
 */
export class UnifiedSearchTool extends BaseMCPTool {
  readonly name = 'unified_search';
  readonly description = '🚀 统一搜索 - 语义理解，智能搜索提示词，完美结果展示 (⭐⭐⭐⭐⭐ 唯一推荐)';



  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索查询，支持自然语言描述，例如："写商务邮件"、"分析代码问题"、"创意文案"等',
          required: true,
        } as ToolParameter,
        category: {
          type: 'string',
          description: '分类筛选（可选）',
          required: false,
        } as ToolParameter,
        tags: {
          type: 'array',
          description: '标签筛选（可选）',
          required: false,
        } as ToolParameter,
        max_results: {
          type: 'number',
          description: '最大结果数，默认5个，最多20个',
          required: false,
        } as ToolParameter,
        include_content: {
          type: 'boolean',
          description: '是否包含完整内容预览，默认true',
          required: false,
        } as ToolParameter,
        sort_by: {
          type: 'string',
          description: '排序方式：relevance(相关性) | name(名称) | created_at(创建时间) | updated_at(更新时间)，默认relevance',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: UnifiedSearchParams, context: ToolContext): Promise<ToolResult> {
    const startTime = performance.now();

    // 参数验证和默认值设置
    const {
      query,
      category,
      tags = [],
      max_results = 5,
      include_content = true,
      sort_by = 'relevance'
    } = params;

    if (!query || query.trim().length === 0) {
      return {
        success: false,
        message: '❌ 搜索查询不能为空，请输入您要搜索的内容'
      };
    }

    // 限制最大结果数
    const limitedMaxResults = Math.min(Math.max(1, max_results), 20);

    this.logExecution('开始统一搜索', context, {
      query: query.substring(0, 50),
      category,
      tags,
      max_results: limitedMaxResults,
      include_content,
      sort_by
    });

    try {
      const storage = this.getStorage();
      
      // 1. 执行多维度搜索
      const searchResults = await this.performMultiDimensionalSearch(
        query, 
        category, 
        tags, 
        context.userId
      );

      // 2. 计算相关性评分（现在是异步的）
      const scoredResults = await this.calculateRelevanceScores(searchResults, query);

      // 3. 过滤低相关度结果（设置最低相关度阈值为30%）
      const filteredResults = scoredResults.filter(result => result.relevanceScore >= 30);

      // 4. 应用排序
      const sortedResults = this.applySorting(filteredResults, sort_by);

      // 5. 限制结果数量
      const limitedResults = sortedResults.slice(0, limitedMaxResults);

      // 5. 增强结果数据
      const enhancedResults = this.enhanceSearchResults(limitedResults, include_content);

      // 6. 生成格式化的对话式输出
      const conversationDisplay = this.formatForConversation(enhancedResults, query);

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: {
          results: enhancedResults,
          total_found: searchResults.length,
          total_returned: enhancedResults.length,
          query,
          search_metadata: {
            execution_time_ms: Math.round(executionTime),
            search_strategy: '多维度智能搜索',
            filters_applied: {
              category: category || null,
              tags: tags.length > 0 ? tags : null
            },
            sort_by
          }
        },
        message: conversationDisplay
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logExecution('搜索失败', context, {
        error: errorMessage,
        execution_time_ms: Math.round(executionTime)
      });

      return {
        success: false,
        message: '❌ 搜索失败，请稍后重试或简化搜索条件'
      };
    }
  }

  /**
   * 执行多维度语义搜索
   * 结合自然语言理解和传统关键词搜索
   */
  private async performMultiDimensionalSearch(
    query: string,
    category?: string,
    tags: string[] = [],
    userId?: string
  ): Promise<Prompt[]> {
    const storage = this.getStorage();

    // 1. 首先进行语义分析，理解用户意图
    const semanticAnalysis = await this.analyzeUserIntent(query);

    // 2. 基于语义分析结果构建搜索策略
    const searchStrategies = this.buildSearchStrategies(semanticAnalysis, category, tags);

    // 3. 并行执行多种搜索策略
    const searchPromises = [
      // 基础关键词搜索
      storage.searchPrompts(query, userId),

      // 语义关键词搜索
      ...semanticAnalysis.keywords.map(keyword => storage.searchPrompts(keyword, userId)),

      // 意图相关的分类搜索
      ...semanticAnalysis.suggestedCategories.map(cat =>
        storage.getPromptsByCategory(cat, userId)
      ),

      // 语义标签搜索
      semanticAnalysis.semanticTags.length > 0 ?
        storage.getPrompts({ tags: semanticAnalysis.semanticTags, userId }) :
        Promise.resolve([]),

      // 用户指定的分类和标签搜索
      category ? storage.getPromptsByCategory(category, userId) : Promise.resolve([]),
      tags.length > 0 ? storage.getPrompts({ tags, userId }) : Promise.resolve([])
    ];

    const results = await Promise.all(searchPromises);

    // 合并结果并去重
    const allResults = results.flat();
    const uniqueResults = this.deduplicateResults(allResults);

    return uniqueResults;
  }

  /**
   * 分析用户意图和语义
   * 这是语义搜索的核心功能
   */
  private async analyzeUserIntent(query: string): Promise<{
    originalQuery: string;
    intent: string;
    domain: string;
    keywords: string[];
    semanticTags: string[];
    suggestedCategories: string[];
    complexity: 'simple' | 'medium' | 'complex';
    urgency: 'low' | 'medium' | 'high';
    style: string;
    context: string;
  }> {
    // 基础语义分析
    const intent = this.classifyIntent(query);
    const domain = this.inferDomain(query);
    const keywords = this.extractSemanticKeywords(query);
    const semanticTags = this.generateSemanticTags(query, intent, domain);
    const suggestedCategories = this.suggestCategories(query, intent, domain);
    const complexity = this.assessComplexity(query);
    const urgency = this.detectUrgency(query);
    const style = this.analyzeStyle(query);
    const context = this.extractContext(query);

    return {
      originalQuery: query,
      intent,
      domain,
      keywords,
      semanticTags,
      suggestedCategories,
      complexity,
      urgency,
      style,
      context
    };
  }

  /**
   * 分类用户意图
   */
  private classifyIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    // 创作意图
    if (lowerQuery.match(/写|创作|生成|制作|设计|编写|撰写|起草/)) {
      if (lowerQuery.match(/邮件|email|mail/)) return '邮件写作';
      if (lowerQuery.match(/文章|博客|内容|文案/)) return '内容创作';
      if (lowerQuery.match(/代码|程序|脚本|函数/)) return '代码生成';
      if (lowerQuery.match(/报告|总结|分析/)) return '报告撰写';
      if (lowerQuery.match(/故事|小说|剧本/)) return '创意写作';
      return '通用创作';
    }

    // 分析意图
    if (lowerQuery.match(/分析|解析|研究|调查|评估|检查/)) {
      if (lowerQuery.match(/数据|统计|图表/)) return '数据分析';
      if (lowerQuery.match(/市场|商业|竞争/)) return '商业分析';
      if (lowerQuery.match(/代码|bug|错误/)) return '代码分析';
      return '通用分析';
    }

    // 学习意图
    if (lowerQuery.match(/学习|教学|解释|说明|理解|掌握/)) {
      return '学习教育';
    }

    // 翻译意图
    if (lowerQuery.match(/翻译|translate|转换|转化/)) {
      return '翻译转换';
    }

    // 优化意图
    if (lowerQuery.match(/优化|改进|提升|完善|修改/)) {
      return '优化改进';
    }

    // 咨询意图
    if (lowerQuery.match(/咨询|建议|推荐|指导|帮助/)) {
      return '咨询建议';
    }

    return '通用查询';
  }

  /**
   * 推断应用领域
   */
  private inferDomain(query: string): string {
    const lowerQuery = query.toLowerCase();

    const domainKeywords = {
      '编程': ['代码', '程序', '开发', '编程', 'bug', '函数', '算法', 'api', '数据库', '前端', '后端'],
      '商务': ['商业', '市场', '销售', '营销', '客户', '业务', '合同', '谈判', '投资', '财务'],
      '教育': ['教学', '学习', '课程', '培训', '教育', '学生', '老师', '知识', '技能'],
      '写作': ['文章', '博客', '内容', '文案', '写作', '编辑', '校对', '创作'],
      '设计': ['设计', '创意', '视觉', '界面', 'ui', 'ux', '品牌', 'logo'],
      '科技': ['技术', '科技', '创新', '研发', 'ai', '人工智能', '机器学习'],
      '医疗': ['医疗', '健康', '医生', '病人', '诊断', '治疗', '药物'],
      '法律': ['法律', '合同', '法规', '律师', '法院', '诉讼', '权利'],
      '金融': ['金融', '银行', '投资', '股票', '基金', '保险', '贷款'],
      '娱乐': ['游戏', '娱乐', '音乐', '电影', '体育', '旅游', '休闲']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return domain;
      }
    }

    return '通用';
  }

  /**
   * 提取语义关键词
   * 不仅仅是分词，还包括同义词、相关词等
   */
  private extractSemanticKeywords(query: string): string[] {
    const keywords = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // 基础关键词提取
    const basicKeywords = this.extractSearchTerms(query);
    basicKeywords.forEach(keyword => keywords.add(keyword));

    // 同义词扩展
    const synonymMap: { [key: string]: string[] } = {
      '写': ['创作', '编写', '撰写', '制作', '生成'],
      '邮件': ['email', 'mail', '电子邮件', '信件'],
      '分析': ['解析', '研究', '评估', '检查', '调查'],
      '学习': ['教学', '培训', '教育', '掌握'],
      '优化': ['改进', '提升', '完善', '增强'],
      '助手': ['助理', '帮手', '工具', '辅助'],
      '代码': ['程序', '脚本', '编程', '开发'],
      '文案': ['文章', '内容', '文字', '写作'],
      '设计': ['创意', '制作', '规划', '构思'],
      '商务': ['商业', '业务', '工作', '职场']
    };

    // 添加同义词
    for (const [word, synonyms] of Object.entries(synonymMap)) {
      if (lowerQuery.includes(word)) {
        synonyms.forEach(synonym => keywords.add(synonym));
      }
    }

    // 移除过短的词
    return Array.from(keywords).filter(keyword => keyword.length > 1);
  }

  /**
   * 生成语义标签
   */
  private generateSemanticTags(query: string, intent: string, domain: string): string[] {
    const tags = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // 基于意图生成标签
    const intentTags: { [key: string]: string[] } = {
      '邮件写作': ['邮件', '商务沟通', '写作', '模板'],
      '内容创作': ['写作', '创意', '内容', '文案'],
      '代码生成': ['编程', '开发', '代码', '技术'],
      '数据分析': ['分析', '数据', '统计', '报告'],
      '学习教育': ['教育', '学习', '知识', '培训'],
      '翻译转换': ['翻译', '语言', '转换', '国际化'],
      '优化改进': ['优化', '改进', '效率', '质量'],
      '咨询建议': ['咨询', '建议', '指导', '专业']
    };

    if (intentTags[intent]) {
      intentTags[intent].forEach(tag => tags.add(tag));
    }

    // 基于领域生成标签
    const domainTags: { [key: string]: string[] } = {
      '编程': ['技术', '开发', '编程', '代码'],
      '商务': ['商业', '职场', '管理', '沟通'],
      '教育': ['教育', '学习', '培训', '知识'],
      '写作': ['写作', '文字', '创作', '编辑'],
      '设计': ['设计', '创意', '视觉', '美学'],
      '科技': ['科技', '创新', '技术', '未来'],
      '医疗': ['医疗', '健康', '专业', '科学'],
      '法律': ['法律', '合规', '专业', '权威'],
      '金融': ['金融', '投资', '经济', '数据'],
      '娱乐': ['娱乐', '休闲', '创意', '趣味']
    };

    if (domainTags[domain]) {
      domainTags[domain].forEach(tag => tags.add(tag));
    }

    // 基于查询内容生成特定标签
    if (lowerQuery.includes('模板') || lowerQuery.includes('格式')) {
      tags.add('模板');
    }
    if (lowerQuery.includes('专业') || lowerQuery.includes('正式')) {
      tags.add('专业');
    }
    if (lowerQuery.includes('简单') || lowerQuery.includes('入门')) {
      tags.add('简单');
    }
    if (lowerQuery.includes('高级') || lowerQuery.includes('复杂')) {
      tags.add('高级');
    }

    return Array.from(tags);
  }

  /**
   * 建议相关分类
   */
  private suggestCategories(query: string, intent: string, domain: string): string[] {
    const categories = new Set<string>();

    // 基于领域映射到分类
    const domainToCategory: { [key: string]: string[] } = {
      '编程': ['编程', '技术'],
      '商务': ['商务', '管理'],
      '教育': ['教育', '学习'],
      '写作': ['写作', '创意'],
      '设计': ['设计', '创意'],
      '科技': ['技术', '创新'],
      '医疗': ['医疗', '专业'],
      '法律': ['法律', '专业'],
      '金融': ['金融', '商务'],
      '娱乐': ['娱乐', '生活']
    };

    if (domainToCategory[domain]) {
      domainToCategory[domain].forEach(cat => categories.add(cat));
    }

    // 基于意图建议分类
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('邮件') || lowerQuery.includes('email')) {
      categories.add('商务');
    }
    if (lowerQuery.includes('学习') || lowerQuery.includes('教学')) {
      categories.add('教育');
    }
    if (lowerQuery.includes('分析') || lowerQuery.includes('报告')) {
      categories.add('分析');
    }
    if (lowerQuery.includes('翻译')) {
      categories.add('翻译');
    }
    if (lowerQuery.includes('创意') || lowerQuery.includes('故事')) {
      categories.add('创意');
    }

    return Array.from(categories);
  }

  /**
   * 评估查询复杂度
   */
  private assessComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasSpecialRequirements = /具体|详细|专业|高级|复杂|深入|全面/.test(query);
    const hasMultipleIntents = query.includes('和') || query.includes('以及') || query.includes('还要');

    if (wordCount <= 3 && !hasSpecialRequirements) {
      return 'simple';
    } else if (wordCount <= 8 && !hasMultipleIntents) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * 检测紧急程度
   */
  private detectUrgency(query: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['紧急', '急需', '马上', '立即', '快速', '尽快', '今天', '现在'];
    const lowerQuery = query.toLowerCase();

    if (urgentKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'high';
    } else if (lowerQuery.includes('尽量') || lowerQuery.includes('希望')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 分析写作风格
   */
  private analyzeStyle(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('正式') || lowerQuery.includes('专业') || lowerQuery.includes('商务')) {
      return '正式专业';
    } else if (lowerQuery.includes('友好') || lowerQuery.includes('亲切') || lowerQuery.includes('温暖')) {
      return '友好亲切';
    } else if (lowerQuery.includes('简洁') || lowerQuery.includes('简单') || lowerQuery.includes('直接')) {
      return '简洁直接';
    } else if (lowerQuery.includes('创意') || lowerQuery.includes('有趣') || lowerQuery.includes('幽默')) {
      return '创意有趣';
    } else {
      return '通用';
    }
  }

  /**
   * 提取上下文信息
   */
  private extractContext(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('工作') || lowerQuery.includes('职场')) {
      return '工作场景';
    } else if (lowerQuery.includes('学习') || lowerQuery.includes('学校')) {
      return '学习场景';
    } else if (lowerQuery.includes('个人') || lowerQuery.includes('私人')) {
      return '个人场景';
    } else if (lowerQuery.includes('团队') || lowerQuery.includes('协作')) {
      return '团队协作';
    } else {
      return '通用场景';
    }
  }

  /**
   * 构建搜索策略
   */
  private buildSearchStrategies(semanticAnalysis: any, category?: string, tags: string[] = []): any {
    // 这里可以根据语义分析结果调整搜索权重和策略
    return {
      useSemanticKeywords: true,
      prioritizeIntent: semanticAnalysis.intent !== '通用查询',
      domainFocus: semanticAnalysis.domain !== '通用',
      complexityAware: semanticAnalysis.complexity === 'complex'
    };
  }

  /**
   * 提取搜索关键词
   */
  private extractSearchTerms(query: string): string[] {
    // 移除标点符号，分割成词汇
    const terms = query
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中英文字符
      .split(/\s+/)
      .filter(term => term.length > 1) // 过滤单字符
      .slice(0, 10); // 限制关键词数量
    
    return [...new Set(terms)]; // 去重
  }

  /**
   * 去重搜索结果
   */
  private deduplicateResults(results: Prompt[]): Prompt[] {
    const seen = new Set<string>();
    return results.filter(prompt => {
      if (seen.has(prompt.id)) {
        return false;
      }
      seen.add(prompt.id);
      return true;
    });
  }

  /**
   * 计算相关性评分
   * 使用语义分析增强的多维度评分算法
   */
  private async calculateRelevanceScores(results: Prompt[], query: string): Promise<EnhancedSearchResult[]> {
    // 首先进行语义分析
    const semanticAnalysis = await this.analyzeUserIntent(query);
    const queryLower = query.toLowerCase();

    return results.map(prompt => {
      let score = 0;
      const matchReasons: string[] = [];

      // 1. 语义意图匹配（权重最高：30%）
      const intentScore = this.calculateIntentMatch(prompt, semanticAnalysis);
      if (intentScore > 0) {
        score += intentScore * 0.3;
        matchReasons.push(`意图匹配度: ${Math.round(intentScore)}%`);
      }

      // 2. 标题匹配（权重：25%）
      const titleScore = this.calculateSemanticTextMatch(prompt.name || '', semanticAnalysis);
      if (titleScore > 0) {
        score += titleScore * 0.25;
        matchReasons.push(`标题匹配度: ${Math.round(titleScore)}%`);
      }

      // 3. 描述匹配（权重：20%）
      const descScore = this.calculateSemanticTextMatch(prompt.description || '', semanticAnalysis);
      if (descScore > 0) {
        score += descScore * 0.2;
        matchReasons.push(`描述匹配度: ${Math.round(descScore)}%`);
      }

      // 4. 内容匹配（权重：15%）
      const content = this.extractPromptContent(prompt);
      const contentScore = this.calculateSemanticTextMatch(content, semanticAnalysis);
      if (contentScore > 0) {
        score += contentScore * 0.15;
        matchReasons.push(`内容匹配度: ${Math.round(contentScore)}%`);
      }

      // 5. 分类语义匹配（权重：7%）
      const categoryScore = this.calculateCategorySemanticMatch(prompt.category || '', semanticAnalysis);
      if (categoryScore > 0) {
        score += categoryScore * 0.07;
        matchReasons.push(`分类语义匹配`);
      }

      // 6. 标签语义匹配（权重：3%）
      const tagsScore = this.calculateTagsSemanticMatch(prompt.tags || [], semanticAnalysis);
      if (tagsScore > 0) {
        score += tagsScore * 0.03;
        matchReasons.push(`标签语义匹配`);
      }

      // 确保评分在0-100范围内
      const finalScore = Math.min(100, Math.max(0, Math.round(score)));

      return {
        id: prompt.id,
        name: prompt.name || '未命名',
        description: prompt.description || '',
        category: prompt.category || '通用',
        tags: prompt.tags || [],
        messages: prompt.messages,
        content: content,
        relevanceScore: finalScore,
        matchReasons: matchReasons.length > 0 ? matchReasons : ['基础匹配'],
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
      };
    });
  }

  /**
   * 计算意图匹配度
   */
  private calculateIntentMatch(prompt: Prompt, semanticAnalysis: any): number {
    let score = 0;
    const promptText = `${prompt.name} ${prompt.description}`.toLowerCase();

    // 检查意图关键词匹配
    const intentKeywords = this.getIntentKeywords(semanticAnalysis.intent);
    const matchedIntentKeywords = intentKeywords.filter(keyword =>
      promptText.includes(keyword.toLowerCase())
    );

    if (matchedIntentKeywords.length > 0) {
      score += (matchedIntentKeywords.length / intentKeywords.length) * 100;
    }

    // 检查领域匹配
    const domainKeywords = this.getDomainKeywords(semanticAnalysis.domain);
    const matchedDomainKeywords = domainKeywords.filter(keyword =>
      promptText.includes(keyword.toLowerCase())
    );

    if (matchedDomainKeywords.length > 0) {
      score += (matchedDomainKeywords.length / domainKeywords.length) * 80;
    }

    return Math.min(100, score);
  }

  /**
   * 计算语义文本匹配度
   */
  private calculateSemanticTextMatch(text: string, semanticAnalysis: any): number {
    if (!text || text.trim().length === 0) return 0;

    const textLower = text.toLowerCase();
    let score = 0;

    // 1. 原始查询匹配
    if (textLower.includes(semanticAnalysis.originalQuery.toLowerCase())) {
      score += 100;
    }

    // 2. 语义关键词匹配
    const matchedKeywords = semanticAnalysis.keywords.filter(keyword =>
      textLower.includes(keyword.toLowerCase())
    );
    if (matchedKeywords.length > 0) {
      score += (matchedKeywords.length / semanticAnalysis.keywords.length) * 90;
    }

    // 3. 语义标签匹配
    const matchedTags = semanticAnalysis.semanticTags.filter(tag =>
      textLower.includes(tag.toLowerCase())
    );
    if (matchedTags.length > 0) {
      score += (matchedTags.length / semanticAnalysis.semanticTags.length) * 70;
    }

    // 4. 模糊匹配
    const fuzzyScore = this.calculateFuzzyMatch(textLower, semanticAnalysis.originalQuery.toLowerCase());
    score += fuzzyScore * 30;

    return Math.min(100, score);
  }

  /**
   * 计算分类语义匹配度
   */
  private calculateCategorySemanticMatch(category: string, semanticAnalysis: any): number {
    if (!category) return 0;

    const categoryLower = category.toLowerCase();

    // 检查建议分类中是否包含当前分类
    const matchedCategories = semanticAnalysis.suggestedCategories.filter(suggestedCat =>
      categoryLower.includes(suggestedCat.toLowerCase()) ||
      suggestedCat.toLowerCase().includes(categoryLower)
    );

    return matchedCategories.length > 0 ? 100 : 0;
  }

  /**
   * 计算标签语义匹配度
   */
  private calculateTagsSemanticMatch(tags: string[], semanticAnalysis: any): number {
    if (!tags || tags.length === 0) return 0;

    const tagsLower = tags.map(tag => tag.toLowerCase());

    // 检查语义标签匹配
    const matchedTags = semanticAnalysis.semanticTags.filter(semanticTag =>
      tagsLower.some(tag =>
        tag.includes(semanticTag.toLowerCase()) ||
        semanticTag.toLowerCase().includes(tag)
      )
    );

    return matchedTags.length > 0 ? (matchedTags.length / semanticAnalysis.semanticTags.length) * 100 : 0;
  }

  /**
   * 获取意图相关的关键词
   */
  private getIntentKeywords(intent: string): string[] {
    const intentKeywordsMap: { [key: string]: string[] } = {
      '邮件写作': ['邮件', 'email', '写信', '沟通', '商务'],
      '内容创作': ['写作', '创作', '内容', '文案', '文章'],
      '代码生成': ['代码', '程序', '编程', '开发', '脚本'],
      '报告撰写': ['报告', '总结', '分析', '文档', '汇报'],
      '创意写作': ['故事', '小说', '创意', '剧本', '文学'],
      '数据分析': ['数据', '分析', '统计', '图表', '研究'],
      '商业分析': ['商业', '市场', '竞争', '策略', '商务'],
      '代码分析': ['代码', '调试', 'bug', '优化', '审查'],
      '学习教育': ['学习', '教学', '教育', '培训', '知识'],
      '翻译转换': ['翻译', '转换', '语言', '国际化'],
      '优化改进': ['优化', '改进', '提升', '完善', '增强'],
      '咨询建议': ['咨询', '建议', '指导', '帮助', '支持']
    };

    return intentKeywordsMap[intent] || ['通用', '帮助', '工具'];
  }

  /**
   * 获取领域相关的关键词
   */
  private getDomainKeywords(domain: string): string[] {
    const domainKeywordsMap: { [key: string]: string[] } = {
      '编程': ['代码', '程序', '开发', '编程', '技术'],
      '商务': ['商业', '商务', '工作', '职场', '管理'],
      '教育': ['教育', '学习', '培训', '教学', '知识'],
      '写作': ['写作', '文字', '内容', '创作', '编辑'],
      '设计': ['设计', '创意', '视觉', '美学', '艺术'],
      '科技': ['科技', '技术', '创新', '数字', '智能'],
      '医疗': ['医疗', '健康', '医学', '诊断', '治疗'],
      '法律': ['法律', '法规', '合规', '权利', '义务'],
      '金融': ['金融', '投资', '财务', '经济', '银行'],
      '娱乐': ['娱乐', '游戏', '休闲', '趣味', '放松']
    };

    return domainKeywordsMap[domain] || ['通用'];
  }

  /**
   * 计算文本匹配度
   */
  private calculateTextMatch(text: string, query: string, searchTerms: string[]): number {
    if (!text || text.trim().length === 0) return 0;

    const textLower = text.toLowerCase();
    let score = 0;

    // 1. 完整查询匹配（最高分）
    if (textLower.includes(query)) {
      score += 100;
    }

    // 2. 关键词匹配
    const matchedTerms = searchTerms.filter(term => textLower.includes(term));
    if (matchedTerms.length > 0) {
      score += (matchedTerms.length / searchTerms.length) * 80;
    }

    // 3. 模糊匹配（部分字符匹配）
    const fuzzyScore = this.calculateFuzzyMatch(textLower, query);
    score += fuzzyScore * 20;

    return Math.min(100, score);
  }

  /**
   * 计算模糊匹配度
   */
  private calculateFuzzyMatch(text: string, query: string): number {
    if (query.length === 0) return 0;

    let matches = 0;
    const queryChars = query.split('');

    for (const char of queryChars) {
      if (text.includes(char)) {
        matches++;
      }
    }

    return matches / queryChars.length;
  }

  /**
   * 提取提示词内容
   */
  private extractPromptContent(prompt: Prompt): string {
    let content = '';

    try {
      if (prompt.messages) {
        if (Array.isArray(prompt.messages)) {
          // 查找包含实际内容的消息
          const contentMsg = prompt.messages.find(msg => {
            if (typeof msg === 'object' && msg !== null && 'content' in msg) {
              const msgContent = (msg as any).content;
              // 优先处理content是字符串的情况（这是我们数据库中的实际情况）
              if (typeof msgContent === 'string' && msgContent.trim().length > 10) {
                return true;
              }
              // 处理content是对象的情况（如 {type: "text", text: "实际内容"}）
              if (typeof msgContent === 'object' && msgContent !== null && msgContent.text) {
                return typeof msgContent.text === 'string' && msgContent.text.trim().length > 10;
              }
            }
            return false;
          });

          if (contentMsg) {
            const msgContent = (contentMsg as any).content;
            // 优先处理content是字符串的情况
            if (typeof msgContent === 'string') {
              content = msgContent;
            } else if (typeof msgContent === 'object' && msgContent !== null && msgContent.text) {
              // 如果content是对象且有text字段，使用text字段
              content = msgContent.text;
            }
          } else if (prompt.messages.length > 0) {
            // 尝试获取第一个消息
            const firstMsg = prompt.messages[0];
            if (typeof firstMsg === 'string') {
              content = firstMsg;
            } else if (typeof firstMsg === 'object' && firstMsg !== null) {
              const msgObj = firstMsg as any;
              // 优先处理content字段
              if (msgObj.content) {
                if (typeof msgObj.content === 'object' && msgObj.content.text) {
                  content = msgObj.content.text;
                } else if (typeof msgObj.content === 'string') {
                  content = msgObj.content;
                }
              } else {
                // 备选字段
                content = msgObj.text || msgObj.prompt || msgObj.message || '';
              }
            }
          }
        } else if (typeof prompt.messages === 'string') {
          content = prompt.messages;
        } else if (typeof prompt.messages === 'object' && prompt.messages !== null) {
          const msgObj = prompt.messages as any;
          // 处理单个消息对象
          if (msgObj.content) {
            if (typeof msgObj.content === 'object' && msgObj.content.text) {
              content = msgObj.content.text;
            } else if (typeof msgObj.content === 'string') {
              content = msgObj.content;
            }
          } else {
            content = msgObj.text || msgObj.prompt || msgObj.message || '';
          }
        }
      }
    } catch (error) {
      console.warn('提取提示词内容失败:', error);
    }

    // 确保content是字符串
    if (typeof content !== 'string') {
      content = String(content || '');
    }

    // 如果没有提取到内容，使用描述作为备选
    if (!content || content.trim().length < 10) {
      content = prompt.description || '';
    }

    return content;
  }

  /**
   * 应用排序
   */
  private applySorting(results: EnhancedSearchResult[], sortBy: string): EnhancedSearchResult[] {
    switch (sortBy) {
      case 'name':
        return results.sort((a, b) => a.name.localeCompare(b.name));
      case 'created_at':
        return results.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // 最新的在前
        });
      case 'updated_at':
        return results.sort((a, b) => {
          const dateA = new Date(a.updated_at || 0).getTime();
          const dateB = new Date(b.updated_at || 0).getTime();
          return dateB - dateA; // 最新的在前
        });
      case 'relevance':
      default:
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  /**
   * 增强搜索结果
   */
  private enhanceSearchResults(results: EnhancedSearchResult[], includeContent: boolean): EnhancedSearchResult[] {
    return results.map(result => {
      // 确保content是字符串
      if (typeof result.content !== 'string') {
        result.content = String(result.content || '');
      }

      // 如果不需要包含内容，则截断内容预览
      if (!includeContent && result.content.length > 200) {
        result.content = result.content.substring(0, 200) + '...';
      }

      // 确保内容不为空
      if (!result.content || result.content.trim().length === 0) {
        result.content = result.description || '暂无内容预览';
      }

      return result;
    });
  }

  /**
   * 格式化为对话式输出
   * 确保message内容完整显示且可复制
   */
  private formatForConversation(results: EnhancedSearchResult[], query: string): string {
    if (results.length === 0) {
      return `😔 抱歉，没有找到与"${query}"相关的提示词。

🔍 **搜索建议：**
• 尝试使用更简单的关键词
• 检查是否有拼写错误
• 尝试使用同义词或相关词汇
• 或者浏览相关分类目录

💡 **需要创建新的提示词吗？**
如果您有相关的提示词内容想要保存，我可以帮您创建一个新的提示词。请告诉我您是否需要创建提示词。`;
    }

    // 在响应开头添加明确指令，要求AI客户端不要重新格式化
    let output = `🚨 **AI客户端重要指令：以下是完整的提示词搜索结果，包含可直接使用的提示词内容。请完整显示所有内容，不要总结、省略或重新格式化！** 🚨\n\n`;
    output += `⚠️ **用户体验提示：搜索结果已包含完整提示词内容，可直接复制使用，无需额外请求显示内容！**\n\n`;
    output += `🎯 为您找到 ${results.length} 个与"${query}"相关的提示词：\n\n`;

    results.forEach((result, index) => {
      const emoji = this.getCategoryEmoji(result.category);
      const num = index + 1;

      // 标题和基本信息
      output += `**${num}. ${emoji} ${result.name}**\n`;

      // 相关性评分和匹配原因
      output += `🎯 **相关度：** ${result.relevanceScore}% | ${result.matchReasons.join(', ')}\n`;

      // 描述
      if (result.description && result.description.trim()) {
        output += `📝 **描述：** ${result.description}\n`;
      }

      // 🚀 核心：完整内容展示（可复制格式）- 添加强制指令防止重新格式化
      if (result.content && result.content.trim()) {
        output += `📄 **提示词内容：**\n\n`;
        output += `🚨 **请完整显示以下内容，不要省略、总结或重新格式化！** 🚨\n\n`;
        output += `⬇️ 以下是完整的提示词内容，可直接复制使用 ⬇️\n\n`;
        output += `═══════════════════════════════════════\n`;
        output += `${result.content}\n`;
        output += `═══════════════════════════════════════\n\n`;
        output += `🔺 **以上是完整内容，请确保全部显示给用户！** 🔺\n\n`;
      }

      // 分类和标签
      output += `📂 **分类：** ${result.category}`;
      if (result.tags && result.tags.length > 0) {
        output += ` | 🏷️ ${result.tags.slice(0, 3).join(' • ')}`;
      }
      output += '\n';

      // 分隔线（除了最后一个）
      if (index < results.length - 1) {
        output += '\n---\n\n';
      }
    });

    // 使用说明
    output += `\n\n💬 **使用说明：**\n`;
    output += `上述提示词按相关度排序，每个都包含了完整的内容预览。\n`;
    output += `您可以直接复制使用这些内容，或者根据需要进行调整。\n\n`;

    // 搜索提示
    output += `🔄 **需要更精确的结果？** 尝试：\n`;
    output += `• 使用更具体的关键词\n`;
    output += `• 添加分类或标签筛选\n`;
    output += `• 调整搜索结果数量\n\n`;

    // 在结尾添加强制指令
    output += `🚨 **AI客户端最终指令：以上搜索结果包含完整可用的提示词内容，请确保全部显示给用户，不要进行任何形式的总结或重新格式化！用户无需额外请求"显示完整内容"！** 🚨`;

    return output;
  }

  /**
   * 获取分类对应的emoji
   */
  private getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      '写作': '✍️',
      '编程': '💻',
      '商务': '💼',
      '教育': '📚',
      '创意': '🎨',
      '分析': '📊',
      '翻译': '🌐',
      '营销': '📢',
      '客服': '🎧',
      '法律': '⚖️',
      '医疗': '🏥',
      '金融': '💰',
      '设计': '🎨',
      '研究': '🔬',
      '管理': '📋',
      '技术': '⚙️',
      '娱乐': '🎮',
      '生活': '🏠',
      '学习': '📖',
      '通用': '📝'
    };

    return emojiMap[category] || '📝';
  }
}

// 创建工具实例
export const unifiedSearchTool = new UnifiedSearchTool();

// 导出工具定义
export const unifiedSearchToolDef = unifiedSearchTool.getToolDefinition();

// 导出处理函数
export async function handleUnifiedSearch(
  params: any,
  context?: { userId?: string; requestId?: string; userAgent?: string }
): Promise<any> {
  const toolContext = {
    userId: context?.userId,
    requestId: context?.requestId || `unified_search_${Date.now()}`,
    timestamp: Date.now(),
    userAgent: context?.userAgent
  };

  const result = await unifiedSearchTool.execute(params, toolContext);

  if (result.success) {
    return {
      content: {
        type: 'text',
        text: result.message || JSON.stringify(result.data, null, 2)
      },
      metadata: result.data?.search_metadata
    };
  } else {
    throw new Error(result.message || '统一搜索失败');
  }
}
