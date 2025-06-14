/**
 * MCP服务器独立AI分析器
 * 参考web服务AI分析器实现，但完全独立运行
 * 提供智能提示词分析和推荐功能
 */

import axios from 'axios';
import { Prompt } from '../types.js';

// MCP AI分析结果接口
export interface MCPAIAnalysisResult {
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

// 预设的21个分类（与数据库完全一致）
const PRESET_CATEGORIES = [
  '全部', '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', 
  '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
];

// 预设的兼容模型
const PRESET_MODELS = [
  { id: 'llm-large', name: '大型语言模型', description: '70B+参数的大型语言模型' },
  { id: 'llm-medium', name: '中型语言模型', description: '7B-70B参数的中型语言模型' },
  { id: 'llm-small', name: '小型语言模型', description: '7B以下参数的轻量级模型' },
  { id: 'code-specialized', name: '代码专用模型', description: '专门针对编程任务优化' },
  { id: 'translation-specialized', name: '翻译专用模型', description: '专门针对翻译任务优化' },
  { id: 'reasoning-specialized', name: '推理专用模型', description: '专门针对逻辑推理优化' },
  { id: 'multimodal-vision', name: '视觉多模态模型', description: '支持图像理解的多模态模型' },
  { id: 'image-generation', name: '图像生成模型', description: '文本转图像生成' },
  { id: 'image-analysis', name: '图像理解模型', description: '图像分析和理解' },
  { id: 'audio-generation', name: '音频生成模型', description: '音频和音乐生成' },
  { id: 'audio-tts', name: '文字转语音模型', description: '文本转语音合成' },
  { id: 'video-generation', name: '视频生成模型', description: '视频内容生成' },
  { id: 'embedding-model', name: '嵌入模型', description: '文本向量化和语义理解' }
];

// 分析配置
interface MCPAnalysisConfig {
  includeImprovements: boolean;
  includeSuggestions: boolean;
  language: 'zh' | 'en';
  strictMode: boolean;
}

export class MCPAIAnalyzer {
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
      console.warn('[MCP AI] OpenAI API key not found. AI analysis features will be disabled.');
    }
    
    console.log('[MCP AI] Analyzer initialized:', {
      baseURL: this.baseURL,
      fullAnalysisModel: this.fullAnalysisModel,
      quickTasksModel: this.quickTasksModel,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * 完整分析提示词
   */
  async analyzePrompt(
    content: string,
    config: Partial<MCPAnalysisConfig> = {},
    existingTags: string[] = [],
    currentVersion?: string,
    isNewPrompt: boolean = false,
    existingVersions: string[] = []
  ): Promise<MCPAIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const defaultConfig: MCPAnalysisConfig = {
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
      
      return this.validateAndFormatResult(result, content, currentVersion, isNewPrompt, existingVersions);

    } catch (error: any) {
      console.error('[MCP AI] Analysis failed:', error);
      
      // 如果API调用失败，返回基础分析结果
      const fallbackResult = this.getFallbackAnalysis(content, currentVersion, isNewPrompt, existingVersions);
      
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
  private buildSystemPrompt(config: MCPAnalysisConfig, existingTags: string[] = []): string {
    const language = config.language === 'zh' ? '中文' : 'English';
    
    // 构建模型选项字符串
    const modelOptionsText = PRESET_MODELS.map(model => 
      `${model.id}(${model.name})`
    ).join('、');
    
    // 构建已有标签提示
    const existingTagsHint = existingTags.length > 0 
      ? `\n\n系统中已有以下标签，请优先使用这些标签（如果相关的话）：${existingTags.slice(0, 20).join('、')}`
      : '';
    
    return `你是一个专业的AI提示词分析专家。请分析用户提供的提示词，并返回JSON格式的分析结果。

分析要求：
1. 分类（category）- 必须从以下21个预设分类中选择最合适的一个：
   选项：${PRESET_CATEGORIES.join('、')}
   说明：只能选择其中一个，不要自由发挥或创造新分类。如果不确定，请选择"通用"。

2. 兼容模型（compatibleModels）- 必须从以下预设模型中选择1-3个最适合的模型：
   选项：${modelOptionsText}
   说明：返回模型ID数组（如：["llm-large", "code-specialized"]），不要创造新的模型名称。

3. 标签（tags）- 提取3-8个相关标签，体现提示词的核心特征
4. 难度级别（difficulty）- beginner/intermediate/advanced
5. 变量提取（variables）- 找出所有{{变量名}}格式的变量
6. 预估token数（estimatedTokens）- 预估处理所需token数量
7. 置信度（confidence）- 分析结果的置信度（0-1）
${config.includeImprovements ? `8. 改进建议（improvements）- 提供3-5个具体的优化建议` : ''}
${config.includeSuggestions ? `9. 使用场景（useCases）- 列出3-5个典型应用场景
10. 标题建议（suggestedTitle）- 建议一个简洁明确的标题
11. 描述建议（description）- 建议一个清晰的描述` : ''}

重要提醒：
- 分类必须严格从上述21个预设分类中选择一个
- 兼容模型必须从上述预设模型选项中选择1-3个，返回ID数组格式
- 标签优先使用已有标签，只有在确实需要时才创建新标签${existingTagsHint}
- 不要返回版本号（version），版本由系统自动生成
- 请用${language}回复，返回有效的JSON格式。

返回格式示例：
{
  "category": "编程",
  "compatibleModels": ["code-specialized", "llm-large"],
  "tags": ["JavaScript", "代码生成", "编程助手"],
  "difficulty": "intermediate",
  "variables": ["变量名1", "变量名2"],
  "estimatedTokens": 200,
  "confidence": 0.85,
  "improvements": ["建议1", "建议2"],
  "useCases": ["场景1", "场景2"],
  "suggestedTitle": "建议标题",
  "description": "建议描述"
}`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(content: string, config: MCPAnalysisConfig): string {
    return `请分析以下提示词内容：

${content}

请按照系统提示的要求，返回JSON格式的分析结果。确保所有字段都存在且格式正确。`;
  }

  /**
   * 验证和格式化分析结果
   */
  private validateAndFormatResult(
    result: any, 
    originalContent: string, 
    currentVersion?: string, 
    isNewPrompt: boolean = false, 
    existingVersions: string[] = []
  ): MCPAIAnalysisResult {
    // 获取有效的预设模型ID列表
    const validModelIds = PRESET_MODELS.map(model => model.id);
    
    // 验证AI返回的兼容模型
    let finalCompatibleModels: string[] = [];
    if (Array.isArray(result.compatibleModels)) {
      finalCompatibleModels = result.compatibleModels.filter((model: string) => 
        validModelIds.includes(model)
      );
    }
    
    // 如果AI没有返回有效模型，使用智能推荐
    if (finalCompatibleModels.length === 0) {
      finalCompatibleModels = this.recommendCompatibleModels(result.category || '通用', originalContent);
    }
    
    // 生成版本建议
    const suggestedVersion = this.suggestVersion(originalContent, existingVersions, currentVersion, isNewPrompt);
    
    // 确保所有必需字段存在
    const validated: MCPAIAnalysisResult = {
      category: result.category || '通用',
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 8) : ['AI', '提示词'],
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(result.difficulty) 
        ? result.difficulty : 'intermediate',
      estimatedTokens: typeof result.estimatedTokens === 'number' 
        ? result.estimatedTokens : Math.ceil(originalContent.length / 4),
      variables: Array.isArray(result.variables) ? result.variables : this.extractVariables(originalContent),
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
      useCases: Array.isArray(result.useCases) ? result.useCases : [],
      compatibleModels: finalCompatibleModels,
      version: suggestedVersion,
      confidence: typeof result.confidence === 'number' 
        ? Math.max(0, Math.min(1, result.confidence)) : 0.8,
      suggestedTitle: result.suggestedTitle || '',
      description: result.description || ''
    };

    return validated;
  }

  /**
   * 基于分类和内容推荐兼容模型
   */
  private recommendCompatibleModels(category: string, content: string): string[] {
    const recommendations: string[] = [];
    
    // 基于分类推荐
    switch (category) {
      case '编程':
        recommendations.push('code-specialized', 'llm-large');
        break;
      case '文案':
        recommendations.push('llm-large', 'llm-medium');
        break;
      case '翻译':
        recommendations.push('translation-specialized', 'llm-large');
        break;
      case '设计':
        recommendations.push('image-generation', 'multimodal-vision');
        break;
      case '绘画':
        recommendations.push('image-generation');
        break;
      case '视频':
        recommendations.push('video-generation', 'multimodal-vision');
        break;
      case '播客':
      case '音乐':
        recommendations.push('audio-generation', 'audio-tts');
        break;
      case '学术':
        recommendations.push('llm-large', 'reasoning-specialized');
        break;
      case '健康':
      case '科技':
        recommendations.push('llm-large', 'reasoning-specialized');
        break;
      default:
        recommendations.push('llm-large', 'llm-medium');
    }
    
    // 基于内容特征推荐
    const lowerContent = content.toLowerCase();
    
    // 检测各种内容特征
    if (lowerContent.includes('图片') || lowerContent.includes('图像') || 
        lowerContent.includes('画') || lowerContent.includes('设计')) {
      if (!recommendations.includes('image-generation')) {
        recommendations.push('image-generation');
      }
    }
    
    if (lowerContent.includes('代码') || lowerContent.includes('编程') || 
        lowerContent.includes('函数') || lowerContent.includes('算法')) {
      if (!recommendations.includes('code-specialized')) {
        recommendations.push('code-specialized');
      }
    }
    
    if (lowerContent.includes('推理') || lowerContent.includes('逻辑') || 
        lowerContent.includes('数学') || lowerContent.includes('计算')) {
      if (!recommendations.includes('reasoning-specialized')) {
        recommendations.push('reasoning-specialized');
      }
    }
    
    // 确保至少有一个推荐
    if (recommendations.length === 0) {
      recommendations.push('llm-large');
    }
    
    // 去重并限制数量
    return Array.from(new Set(recommendations)).slice(0, 3);
  }

  /**
   * 后备分析方案
   */
  private getFallbackAnalysis(
    content: string, 
    currentVersion?: string, 
    isNewPrompt: boolean = false, 
    existingVersions: string[] = []
  ): MCPAIAnalysisResult {
    const variables = this.extractVariables(content);
    const estimatedTokens = Math.ceil(content.length / 4);
    const category = this.detectCategoryByKeywords(content);
    const tags = this.extractTagsByKeywords(content);
    const recommendedModels = this.recommendCompatibleModels(category, content);
    const suggestedVersion = this.suggestVersion(content, existingVersions, currentVersion, isNewPrompt);

    return {
      category,
      tags,
      difficulty: estimatedTokens > 500 ? 'advanced' : estimatedTokens > 200 ? 'intermediate' : 'beginner',
      estimatedTokens,
      variables,
      improvements: ['建议添加更多上下文信息', '可以优化变量命名'],
      useCases: ['通用AI对话', '内容生成'],
      compatibleModels: recommendedModels,
      version: suggestedVersion,
      confidence: 0.6,
      suggestedTitle: content.length > 50 ? content.substring(0, 50) + '...' : content,
      description: '基于内容特征的自动分析结果'
    };
  }

  /**
   * 提取变量
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (variable && !variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  }

  /**
   * 基于关键词检测分类
   */
  private detectCategoryByKeywords(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('代码') || lowerContent.includes('编程') || 
        lowerContent.includes('函数') || lowerContent.includes('算法')) {
      return '编程';
    }
    
    if (lowerContent.includes('文案') || lowerContent.includes('写作') || 
        lowerContent.includes('营销') || lowerContent.includes('广告')) {
      return '文案';
    }
    
    if (lowerContent.includes('翻译') || lowerContent.includes('英文') || 
        lowerContent.includes('中文') || lowerContent.includes('语言')) {
      return '翻译';
    }
    
    if (lowerContent.includes('学术') || lowerContent.includes('研究') || 
        lowerContent.includes('论文') || lowerContent.includes('分析')) {
      return '学术';
    }
    
    if (lowerContent.includes('设计') || lowerContent.includes('创意') || 
        lowerContent.includes('艺术') || lowerContent.includes('美术')) {
      return '设计';
    }
    
    return '通用';
  }

  /**
   * 基于关键词提取标签
   */
  private extractTagsByKeywords(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // 技术相关
    if (lowerContent.includes('javascript')) tags.push('JavaScript');
    if (lowerContent.includes('python')) tags.push('Python');
    if (lowerContent.includes('代码')) tags.push('代码生成');
    if (lowerContent.includes('编程')) tags.push('编程助手');
    
    // 写作相关
    if (lowerContent.includes('写作')) tags.push('写作');
    if (lowerContent.includes('文案')) tags.push('文案创作');
    if (lowerContent.includes('营销')) tags.push('营销');
    
    // 通用标签
    if (tags.length === 0) {
      tags.push('AI助手', '提示词');
    }
    
    return tags.slice(0, 5);
  }

  /**
   * 智能合并标签
   */
  private mergeTagsIntelligently(aiTags: string[], existingTags: string[]): string[] {
    const mergedTags: string[] = [];
    
    for (const aiTag of aiTags) {
      // 查找相似或同义词标签
      const similarTag = this.findSimilarTag(aiTag, existingTags);
      if (similarTag) {
        if (!mergedTags.includes(similarTag)) {
          mergedTags.push(similarTag);
        }
      } else {
        // 没有找到相似标签，使用AI建议的标签
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
    const lowerAiTag = aiTag.toLowerCase();
    
    // 直接匹配
    for (const existingTag of existingTags) {
      if (existingTag.toLowerCase() === lowerAiTag) {
        return existingTag;
      }
    }
    
    // 包含匹配
    for (const existingTag of existingTags) {
      if (existingTag.toLowerCase().includes(lowerAiTag) || 
          lowerAiTag.includes(existingTag.toLowerCase())) {
        return existingTag;
      }
    }
    
    return null;
  }

  /**
   * 建议版本号
   */
  private suggestVersion(
    content: string, 
    existingVersions: string[] = [], 
    currentVersion?: string, 
    isNewPrompt: boolean = false
  ): string {
    const complexity = this.calculateComplexity(content);
    const variables = this.extractVariables(content);
    
    // 新提示词从0.1开始
    if (isNewPrompt) {
      let baseVersion = '0.1';
      
      if (complexity > 0.7 || variables.length > 5) {
        baseVersion = '0.3';
      } else if (complexity > 0.5 || variables.length > 2) {
        baseVersion = '0.2';
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

    // 现有提示词版本必须大于等于当前版本
    if (currentVersion) {
      const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
      let suggestedMajor = currentMajor;
      let suggestedMinor = currentMinor + 1;

      // 基于复杂度决定版本增量
      if (complexity > 0.7 || variables.length > 5) {
        suggestedMajor = currentMajor + 1;
        suggestedMinor = 0;
      }

      let version = `${suggestedMajor}.${suggestedMinor}`;
      let counter = 1;
      while (existingVersions.includes(version)) {
        version = `${suggestedMajor}.${suggestedMinor + counter}`;
        counter++;
      }

      return version;
    }

    // 默认版本
    return '1.0';
  }

  /**
   * 计算内容复杂度
   */
  private calculateComplexity(content: string): number {
    let score = 0;
    
    // 长度因子
    score += Math.min(content.length / 1000, 0.3);
    
    // 变量数量因子
    const variables = this.extractVariables(content);
    score += Math.min(variables.length / 10, 0.3);
    
    // 结构复杂度因子
    const lines = content.split('\n').length;
    score += Math.min(lines / 50, 0.2);
    
    // 特殊字符因子
    const specialChars = (content.match(/[{}[\]()]/g) || []).length;
    score += Math.min(specialChars / 100, 0.2);
    
    return Math.min(score, 1);
  }

  /**
   * 快速分类
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
              content: `你是一个提示词分类专家。请将提示词分类到以下类别之一：
${PRESET_CATEGORIES.join('、')}

只返回分类名称，不要其他内容。`
            },
            {
              role: 'user',
              content: `请对以下提示词进行分类：\n\n${content}`
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const category = response.data.choices[0].message.content.trim();
      return PRESET_CATEGORIES.includes(category) ? category : '通用';
    } catch (error) {
      console.error('[MCP AI] Quick classify failed:', error);
      return this.detectCategoryByKeywords(content);
    }
  }

  /**
   * 提取标签
   */
  async extractTags(content: string, existingTags: string[] = []): Promise<string[]> {
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
              content: `你是一个标签提取专家。请为提示词提取3-6个相关标签。
${existingTags.length > 0 ? `优先使用现有标签：${existingTags.slice(0, 20).join('、')}` : ''}

返回格式：标签1,标签2,标签3`
            },
            {
              role: 'user',
              content: `请为以下内容提取标签：\n\n${content}`
            }
          ],
          temperature: 0.3,
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
      const tags = tagsText.split(',').map(tag => tag.trim()).filter(Boolean);
      
      return this.mergeTagsIntelligently(tags, existingTags);
    } catch (error) {
      console.error('[MCP AI] Extract tags failed:', error);
      return this.extractTagsByKeywords(content);
    }
  }

  /**
   * 健康检查
   */
  async checkHealth(): Promise<{
    isHealthy: boolean;
    endpoint: string;
    models: { full: string; quick: string };
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        isHealthy: true,
        endpoint: this.baseURL,
        models: {
          full: this.fullAnalysisModel,
          quick: this.quickTasksModel
        }
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        endpoint: this.baseURL,
        models: {
          full: this.fullAnalysisModel,
          quick: this.quickTasksModel
        },
        error: error.message
      };
    }
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return {
      endpoint: this.baseURL,
      models: {
        fullAnalysis: this.fullAnalysisModel,
        quickTasks: this.quickTasksModel
      },
      presetCategories: PRESET_CATEGORIES,
      presetModels: PRESET_MODELS,
      hasApiKey: !!this.apiKey
    };
  }
}