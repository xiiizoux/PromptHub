/**
 * AI智能提示词分析服务
 * 使用ChatGPT API实现自动分类、标签提取、版本号建议等功能
 */

import axios from 'axios';

// AI分析结果接口
export interface AIAnalysisResult {
  category: string;
  tags: string[];
  suggestedTitle?: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTokens: number;
  variables: string[];
  improvements: string[];
  useCases: string[];
  compatibleModels: string[];
  version: string;
  confidence: number; // 0-1之间的置信度
}

// 分析配置
interface AnalysisConfig {
  includeImprovements: boolean;
  includeSuggestions: boolean;
  language: 'zh' | 'en';
  strictMode: boolean;
}

class AIAnalyzer {
  private apiKey: string;
  private baseURL: string;
  private fullAnalysisModel: string;
  private quickTasksModel: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    this.fullAnalysisModel = process.env.AI_MODEL_FULL_ANALYSIS || 'gpt-4';
    this.quickTasksModel = process.env.AI_MODEL_QUICK_TASKS || 'gpt-3.5-turbo';
    
    // 清理baseURL，确保没有尾随斜杠
    this.baseURL = this.baseURL.replace(/\/$/, '');
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI analysis features will be disabled.');
    }
    
    console.log('AI Analyzer initialized:', {
      baseURL: this.baseURL,
      fullAnalysisModel: this.fullAnalysisModel,
      quickTasksModel: this.quickTasksModel,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * 主要分析函数 - 分析提示词并返回结构化结果
   */
  async analyzePrompt(
    content: string, 
    config: Partial<AnalysisConfig> = {},
    existingTags: string[] = [] // 新增参数：系统中已存在的标签
  ): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const defaultConfig: AnalysisConfig = {
      includeImprovements: true,
      includeSuggestions: true,
      language: 'zh',
      strictMode: false,
      ...config
    };

    const systemPrompt = this.buildSystemPrompt(defaultConfig, existingTags);
    const userPrompt = this.buildUserPrompt(content, defaultConfig);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.fullAnalysisModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      
      // 对标签进行智能合并处理
      if (result.tags && existingTags.length > 0) {
        result.tags = this.mergeTagsIntelligently(result.tags, existingTags);
      }
      
      return this.validateAndFormatResult(result, content);

    } catch (error: any) {
      console.error('AI analysis failed:', error);
      
      // 如果API调用失败，返回基础分析结果
      const fallbackResult = this.getFallbackAnalysis(content);
      
      // 对后备结果也进行标签合并
      if (fallbackResult.tags && existingTags.length > 0) {
        fallbackResult.tags = this.mergeTagsIntelligently(fallbackResult.tags, existingTags);
      }
      
      return fallbackResult;
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(config: AnalysisConfig, existingTags: string[] = []): string {
    const language = config.language === 'zh' ? '中文' : 'English';
    // 21个预设分类（与数据库categories表完全一致）
    const categories = [
      '全部', '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
    ];
    
    // 构建已有标签提示
    const existingTagsHint = existingTags.length > 0 
      ? `\n\n系统中已有以下标签，请优先使用这些标签（如果相关的话）：${existingTags.slice(0, 20).join('、')}`
      : '';
    
    return `你是一个专业的AI提示词分析专家。请分析用户提供的提示词，并返回JSON格式的分析结果。

分析要求：
1. 分类（category）- 必须从以下21个预设分类中选择最合适的一个，严格返回下列分类名称，不要自由发挥或创造新分类：${categories.join('、')}
2. 标签（tags）- 提取3-8个相关标签，体现提示词的核心特征
3. 难度级别（difficulty）- beginner/intermediate/advanced
4. 变量提取（variables）- 找出所有{{变量名}}格式的变量
5. 兼容模型（compatibleModels）- 推荐适合的AI模型
6. 版本建议（version）- 基于复杂度建议版本号（1.0, 1.1, 2.0等）
7. 预估token数（estimatedTokens）- 预估处理所需token数量
8. 置信度（confidence）- 分析结果的置信度（0-1）
${config.includeImprovements ? `9. 改进建议（improvements）- 提供3-5个具体的优化建议` : ''}
${config.includeSuggestions ? `10. 使用场景（useCases）- 列出3-5个典型应用场景
11. 标题建议（suggestedTitle）- 建议一个简洁明确的标题
12. 描述建议（description）- 建议一个清晰的描述` : ''}

重要提醒：
- 分类必须严格从上述21个预设分类中选择，不要使用"创意写作"、"数据分析"等不在列表中的分类
- 如果不确定分类，请选择"通用"
- 标签优先使用已有标签，只有在确实需要时才创建新标签${existingTagsHint}
- 请用${language}回复，返回有效的JSON格式，确保所有字段都存在。`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(content: string, config: AnalysisConfig): string {
    return `请分析以下提示词：

\`\`\`
${content}
\`\`\`

请返回JSON格式的分析结果，包含所有必需字段。确保JSON格式正确且可解析。`;
  }

  /**
   * 验证和格式化分析结果
   */
  private validateAndFormatResult(result: any, originalContent: string): AIAnalysisResult {
    // 确保所有必需字段存在
    const validated: AIAnalysisResult = {
      category: result.category || '通用',
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 8) : ['AI', '提示词'],
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(result.difficulty) 
        ? result.difficulty : 'intermediate',
      estimatedTokens: typeof result.estimatedTokens === 'number' 
        ? result.estimatedTokens : Math.ceil(originalContent.length / 4),
      variables: Array.isArray(result.variables) ? result.variables : this.extractVariables(originalContent),
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
      useCases: Array.isArray(result.useCases) ? result.useCases : [],
      compatibleModels: Array.isArray(result.compatibleModels) 
        ? result.compatibleModels : ['gpt-4', 'gpt-3.5-turbo'],
      version: result.version || '1.0',
      confidence: typeof result.confidence === 'number' 
        ? Math.max(0, Math.min(1, result.confidence)) : 0.8,
      suggestedTitle: result.suggestedTitle || '',
      description: result.description || ''
    };

    return validated;
  }

  /**
   * 后备分析方案（当API调用失败时）
   */
  private getFallbackAnalysis(content: string): AIAnalysisResult {
    const variables = this.extractVariables(content);
    const estimatedTokens = Math.ceil(content.length / 4);
    
    // 基于关键词的简单分类
    const category = this.detectCategoryByKeywords(content);
    const tags = this.extractTagsByKeywords(content);

    return {
      category,
      tags,
      difficulty: estimatedTokens > 500 ? 'advanced' : estimatedTokens > 200 ? 'intermediate' : 'beginner',
      estimatedTokens,
      variables,
      improvements: ['建议添加更多上下文信息', '可以优化变量命名'],
      useCases: ['通用AI对话', '内容生成'],
      compatibleModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
      version: variables.length > 3 ? '1.1' : '1.0',
      confidence: 0.6,
      suggestedTitle: content.length > 50 ? content.substring(0, 50) + '...' : content,
      description: '基于内容特征的自动分析结果'
    };
  }

  /**
   * 提取变量（正则表达式方法）
   */
  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    const uniqueVariables = new Set(
      matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
    );
    return Array.from(uniqueVariables).filter(variable => variable.length > 0);
  }

  /**
   * 基于关键词的分类检测
   */
  private detectCategoryByKeywords(content: string): string {
    const keywords = {
      '编程': ['代码', 'code', '函数', 'function', '编程', '开发', 'debug', '算法', 'javascript', 'python', 'java', 'css', 'html'],
      '文案': ['文案', '广告', '营销', '宣传', '推广', '产品描述', '品牌'],
      '设计': ['设计', '视觉', '创意', '布局', '界面', 'ui', 'ux', 'logo'],
      '绘画': ['绘画', '画画', '艺术', '插画', '素描', '美术', '画作', '创作', '色彩', '构图'],
      '教育': ['教学', '培训', '学习', '课程', '教育', '指导', '辅导'],
      '学术': ['研究', '论文', '学术', '文献', '理论', '实验', '分析'],
      '职业': ['工作', '职场', '简历', '面试', '职业', '求职', '招聘'],
      '商业': ['商业', '生意', '投资', '创业', '管理', '市场', '销售'],
      '办公': ['办公', '文档', '报告', '会议', '邮件', '表格', '演示'],
      '翻译': ['翻译', '语言', '转换', 'translate', '多语言', '英语', '中文'],
      '视频': ['视频', '影片', '制作', '剪辑', '拍摄', '脚本'],
      '播客': ['播客', '音频', '录音', '访谈', '节目', '电台'],
      '音乐': ['音乐', '歌曲', '作曲', '歌词', '旋律', '乐器'],
      '健康': ['健康', '医疗', '运动', '养生', '心理', '身体'],
      '科技': ['科技', '技术', '创新', '数字', '人工智能', 'ai', '机器学习'],
      '生活': ['生活', '日常', '家庭', '购物', '旅行', '美食'],
      '娱乐': ['娱乐', '游戏', '电影', '小说', '故事', '趣味'],
      '游戏': ['游戏', '玩法', '策略', '角色', '关卡', '竞技'],
      '情感': ['情感', '心理', '情绪', '关系', '爱情', '友情']
    };

    const lowerContent = content.toLowerCase();
    
    // 计算每个分类的匹配分数
    let bestCategory = '通用';
    let bestScore = 0;
    
    for (const [category, words] of Object.entries(keywords)) {
      let score = 0;
      for (const word of words) {
        if (lowerContent.includes(word.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }

  /**
   * 基于关键词的标签提取
   */
  private extractTagsByKeywords(content: string): string[] {
    const commonTags = ['AI', '提示词', '自动化', '效率', '创新'];
    const lowerContent = content.toLowerCase();
    
    const detectedTags: string[] = [];
    
    // 检测编程相关
    if (lowerContent.includes('代码') || lowerContent.includes('code')) {
      detectedTags.push('编程', '代码');
    }
    
    // 检测创意相关
    if (lowerContent.includes('创意') || lowerContent.includes('创作')) {
      detectedTags.push('创意', '内容生成');
    }
    
    // 检测分析相关
    if (lowerContent.includes('分析') || lowerContent.includes('数据')) {
      detectedTags.push('分析', '数据处理');
    }

    const tagSet = new Set([...detectedTags, ...commonTags]);
    return Array.from(tagSet).slice(0, 6);
  }

  /**
   * 快速分类（仅返回分类，不调用完整API）
   */
  async quickClassify(content: string): Promise<string> {
    if (!this.apiKey) {
      return this.detectCategoryByKeywords(content);
    }

    try {
      const categories = [
        '全部', '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
      ];
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            { 
              role: 'system', 
              content: `你是一个提示词分类专家。请将提示词分类到以下21个预设分类之一：${categories.join('、')}。只返回分类名称，不要其他内容。如果不确定，请选择"通用"。` 
            },
            { role: 'user', content: `请为以下提示词分类：\n\n${content}` }
          ],
          temperature: 0.1,
          max_tokens: 20
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiCategory = response.data.choices[0].message.content.trim();
      
      // 验证AI返回的分类是否在预设列表中
      if (categories.includes(aiCategory)) {
        return aiCategory;
      } else {
        // 如果AI返回的分类不在预设列表中，使用关键词检测
        console.warn(`AI返回了无效分类: ${aiCategory}，使用关键词检测`);
        return this.detectCategoryByKeywords(content);
      }
    } catch (error) {
      console.error('Quick classify failed:', error);
      return this.detectCategoryByKeywords(content);
    }
  }

  /**
   * 智能标签合并 - 优先使用已有的相似标签
   */
  private mergeTagsIntelligently(aiTags: string[], existingTags: string[]): string[] {
    const mergedTags: string[] = [];
    
    for (const aiTag of aiTags) {
      const matchedTag = this.findSimilarTag(aiTag, existingTags);
      
      if (matchedTag) {
        // 使用已有的相似标签
        if (!mergedTags.includes(matchedTag)) {
          mergedTags.push(matchedTag);
        }
      } else {
        // 没有相似标签，使用AI建议的新标签
        if (!mergedTags.includes(aiTag)) {
          mergedTags.push(aiTag);
        }
      }
    }
    
    return mergedTags;
  }

  /**
   * 查找相似标签
   */
  private findSimilarTag(aiTag: string, existingTags: string[]): string | null {
    const lowerAiTag = aiTag.toLowerCase().trim();
    
    // 1. 完全匹配
    const exactMatch = existingTags.find(tag => tag.toLowerCase().trim() === lowerAiTag);
    if (exactMatch) return exactMatch;
    
    // 2. 包含关系匹配
    const containsMatch = existingTags.find(tag => {
      const lowerExistingTag = tag.toLowerCase().trim();
      return lowerExistingTag.includes(lowerAiTag) || lowerAiTag.includes(lowerExistingTag);
    });
    if (containsMatch) return containsMatch;
    
    // 3. 同义词匹配
    const synonymMatch = this.findSynonymTag(lowerAiTag, existingTags);
    if (synonymMatch) return synonymMatch;
    
    // 4. 相似度匹配（使用简单的字符串相似度）
    for (const existingTag of existingTags) {
      const similarity = this.calculateStringSimilarity(lowerAiTag, existingTag.toLowerCase().trim());
      if (similarity > 0.7) { // 相似度阈值
        return existingTag;
      }
    }
    
    return null;
  }

  /**
   * 同义词匹配
   */
  private findSynonymTag(aiTag: string, existingTags: string[]): string | null {
    const synonyms: { [key: string]: string[] } = {
      '开发': ['编程', '代码', '程序', 'dev', 'development'],
      '编程': ['开发', '代码', '程序', 'programming', 'coding'],
      '代码': ['编程', '开发', '程序', 'code'],
      '写作': ['文案', '创作', '内容', 'writing'],
      '文案': ['写作', '内容', '营销', 'copywriting'],
      '设计': ['ui', 'ux', '界面', 'design'],
      '翻译': ['转换', '语言', 'translation'],
      '分析': ['数据', '统计', 'analysis'],
      '助手': ['ai', '智能', 'assistant'],
      '初学者': ['新手', '入门', 'beginner'],
      '高级': ['专业', '进阶', 'advanced'],
      '自动化': ['automation', '自动']
    };
    
    for (const [synonym, alternatives] of Object.entries(synonyms)) {
      if (alternatives.includes(aiTag)) {
        const match = existingTags.find(tag => tag.toLowerCase().includes(synonym));
        if (match) return match;
      }
    }
    
    return null;
  }

  /**
   * 计算字符串相似度（简单版本）
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 提取标签（仅返回标签列表）- 支持已有标签智能合并
   */
  async extractTags(content: string, existingTags: string[] = []): Promise<string[]> {
    if (!this.apiKey) {
      const fallbackTags = this.extractTagsByKeywords(content);
      return this.mergeTagsIntelligently(fallbackTags, existingTags);
    }

    try {
      const existingTagsHint = existingTags.length > 0 
        ? `\n\n请优先使用以下已有标签（如果相关）：${existingTags.slice(0, 15).join('、')}` 
        : '';
        
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            { 
              role: 'system', 
              content: `你是一个标签提取专家。请为提示词提取3-6个最相关的标签。用逗号分隔，只返回标签列表。优先使用已有标签，避免创建重复或相似的标签。${existingTagsHint}` 
            },
            { role: 'user', content: `请为以下提示词提取标签：\n\n${content}` }
          ],
          temperature: 0.2,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const tagsText = response.data.choices[0].message.content.trim();
      const aiTags = tagsText.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      
      // 智能合并标签
      return this.mergeTagsIntelligently(aiTags, existingTags);
    } catch (error) {
      console.error('Tag extraction failed:', error);
      const fallbackTags = this.extractTagsByKeywords(content);
      return this.mergeTagsIntelligently(fallbackTags, existingTags);
    }
  }

  /**
   * 建议版本号
   */
  suggestVersion(content: string, existingVersions: string[] = []): string {
    const complexity = this.calculateComplexity(content);
    const variables = this.extractVariables(content);
    
    // 基于复杂度建议版本号
    let baseVersion = '1.0';
    
    if (complexity > 0.7 || variables.length > 5) {
      baseVersion = '2.0';
    } else if (complexity > 0.5 || variables.length > 2) {
      baseVersion = '1.5';
    } else if (variables.length > 0) {
      baseVersion = '1.1';
    }

    // 确保版本号不重复
    let version = baseVersion;
    let counter = 1;
    while (existingVersions.includes(version)) {
      const [major, minor] = baseVersion.split('.');
      version = `${major}.${parseInt(minor) + counter}`;
      counter++;
    }

    return version;
  }

  /**
   * 计算提示词复杂度
   */
  private calculateComplexity(content: string): number {
    let score = 0;
    
    // 基于长度
    score += Math.min(content.length / 1000, 0.3);
    
    // 基于变量数量
    const variables = this.extractVariables(content);
    score += Math.min(variables.length * 0.1, 0.3);
    
    // 基于结构复杂度（换行、特殊字符等）
    const lines = content.split('\n').length;
    score += Math.min(lines * 0.05, 0.2);
    
    // 基于关键词复杂度
    const complexKeywords = ['步骤', '规则', '约束', '条件', '格式', '要求'];
    const keywordCount = complexKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(keywordCount * 0.05, 0.2);
    
    return Math.min(score, 1);
  }

  /**
   * 检查API健康状态
   */
  async checkHealth(): Promise<{
    isHealthy: boolean;
    endpoint: string;
    models: { full: string; quick: string };
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          isHealthy: false,
          endpoint: this.baseURL,
          models: { full: this.fullAnalysisModel, quick: this.quickTasksModel },
          error: 'API密钥未配置'
        };
      }

      // 发送一个简单的请求来测试连接
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );

      return {
        isHealthy: true,
        endpoint: this.baseURL,
        models: { full: this.fullAnalysisModel, quick: this.quickTasksModel }
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        endpoint: this.baseURL,
        models: { full: this.fullAnalysisModel, quick: this.quickTasksModel },
        error: error.message || '连接失败'
      };
    }
  }

  /**
   * 获取当前配置信息
   */
  getConfig() {
    return {
      endpoint: this.baseURL,
      models: {
        fullAnalysis: this.fullAnalysisModel,
        quickTasks: this.quickTasksModel
      },
      hasApiKey: !!this.apiKey,
      isCustomEndpoint: this.baseURL !== 'https://api.openai.com/v1'
    };
  }
}

// 创建单例实例
export const aiAnalyzer = new AIAnalyzer();

// 导出类型
export default AIAnalyzer; 