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
    config: Partial<AnalysisConfig> = {}
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

    const systemPrompt = this.buildSystemPrompt(defaultConfig);
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
      return this.validateAndFormatResult(result, content);

    } catch (error: any) {
      console.error('AI analysis failed:', error);
      
      // 如果API调用失败，返回基础分析结果
      return this.getFallbackAnalysis(content);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(config: AnalysisConfig): string {
    const language = config.language === 'zh' ? '中文' : 'English';
    // 数据库分类（仅中文）
    const categories = [
      '全部','通用','学术','职业','文案','设计','绘画','教育','情感','娱乐','游戏','生活','商业','办公','编程','翻译','视频','播客','音乐','健康','科技'
    ];
    return `你是一个专业的AI提示词分析专家。请分析用户提供的提示词，并返回JSON格式的分析结果。\n\n分析维度：\n1. 分类（category）- 只能从以下类别中选择最合适的一个，严格返回下列分类的中文名，不要返回其他内容：${categories.join('、')}\n2. 标签（tags）- 提取3-8个相关标签，体现提示词的核心特征\n3. 难度级别（difficulty）- beginner/intermediate/advanced\n4. 变量提取（variables）- 找出所有{{变量名}}格式的变量\n5. 兼容模型（compatibleModels）- 推荐适合的AI模型\n6. 版本建议（version）- 基于复杂度建议版本号（1.0, 1.1, 2.0等）\n7. 预估token数（estimatedTokens）- 预估处理所需token数量\n8. 置信度（confidence）- 分析结果的置信度（0-1）\n${config.includeImprovements ? `9. 改进建议（improvements）- 提供3-5个具体的优化建议` : ''}\n${config.includeSuggestions ? `10. 使用场景（useCases）- 列出3-5个典型应用场景\n11. 标题建议（suggestedTitle）- 建议一个简洁明确的标题\n12. 描述建议（description）- 建议一个清晰的描述` : ''}\n\n请用${language}回复，返回有效的JSON格式，确保所有字段都存在。`;
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
      '编程': ['代码', 'code', '函数', 'function', '编程', '开发', 'debug', '算法'],
      '创意写作': ['故事', '小说', '文章', '创意', '写作', '剧本', '诗歌'],
      '数据分析': ['数据', '分析', '统计', '图表', '报告', 'excel', 'sql'],
      '营销推广': ['营销', '推广', '广告', '文案', '品牌', '用户'],
      '学术研究': ['研究', '论文', '学术', '文献', '理论', '实验'],
      '教育培训': ['教学', '培训', '学习', '课程', '教育', '指导'],
      '商务办公': ['商务', '办公', '会议', '邮件', '报告', '管理'],
      '内容翻译': ['翻译', '语言', '转换', 'translate', '多语言']
    };

    const lowerContent = content.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerContent.includes(word.toLowerCase()))) {
        return category;
      }
    }
    
    return '通用';
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
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            { 
              role: 'system', 
              content: '你是一个提示词分类专家。请将提示词分类到以下类别之一：编程、创意写作、数据分析、营销推广、学术研究、教育培训、商务办公、内容翻译、通用、娱乐。只返回分类名称，不要其他内容。' 
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

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Quick classify failed:', error);
      return this.detectCategoryByKeywords(content);
    }
  }

  /**
   * 提取标签（仅返回标签列表）
   */
  async extractTags(content: string): Promise<string[]> {
    if (!this.apiKey) {
      return this.extractTagsByKeywords(content);
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            { 
              role: 'system', 
              content: '你是一个标签提取专家。请为提示词提取3-6个最相关的标签。用逗号分隔，只返回标签列表。' 
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
      return tagsText.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    } catch (error) {
      console.error('Tag extraction failed:', error);
      return this.extractTagsByKeywords(content);
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