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
      throw new Error('AI分析服务未配置API密钥，请联系管理员配置');
    }

    const finalConfig: MCPAnalysisConfig = {
      includeImprovements: true,
      includeSuggestions: true,
      language: 'zh',
      strictMode: false,
      ...config
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.fullAnalysisModel,
          messages: [
            { role: 'system', content: this.buildAnalysisSystemPrompt() },
            { role: 'user', content: this.buildUserPrompt(content, finalConfig) }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 验证响应格式
      if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
        console.error('[MCP AI] API返回格式异常:', response.data);
        throw new Error('AI服务返回格式异常，请重试');
      }

      const choice = response.data.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        console.error('[MCP AI] API返回内容为空:', choice);
        throw new Error('AI服务返回内容为空，请重试');
      }

      const result = choice.message.content;
      
      try {
        const parsedResult = JSON.parse(result);
        return this.validateAndFormatResult(parsedResult, content, currentVersion, isNewPrompt, existingVersions);
      } catch (parseError) {
        console.error('[MCP AI] 返回结果解析失败:', parseError);
        console.error('[MCP AI] 原始返回内容:', result);
        throw new Error('AI分析结果格式错误，请重试');
      }

    } catch (error: any) {
      console.error('[MCP AI] 分析失败:', error);
      
      // 提供具体的错误信息
      if (error.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (error.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (error.response?.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else if (error.message?.includes('timeout')) {
        throw new Error('AI分析超时，请重试');
      } else {
        throw new Error(`AI分析失败: ${error.message || '未知错误'}，请重试`);
      }
    }
  }

  /**
   * 构建分析系统提示词
   */
  private buildAnalysisSystemPrompt(): string {
    return `你是一个专业的AI提示词分析专家。请根据提供的提示词内容，生成合适的分类、标签、标题、描述等分析结果。

## 分析任务

请根据提供的提示词内容，理解其核心功能和用途，然后生成以下分析结果：

### 1. 分类（category）
请根据提示词的主要功能和用途，从以下分类中选择最合适的一个：
通用、编程、文案、设计、绘画、教育、学术、职业、商业、办公、翻译、视频、播客、音乐、健康、科技、生活、娱乐、游戏、情感、创意写作

### 2. 标签（tags）
请提取3-8个能够准确描述提示词特征的标签，包括：
- 功能类型（如：分析、创作、翻译、编程等）
- 应用场景（如：办公、学习、研究等）
- 特色功能（如：角色扮演、深度分析等）

### 3. 其他字段
- 难度级别（difficulty）：beginner/intermediate/advanced
- 变量提取（variables）：找出所有{{变量名}}格式的变量
- 预估token数（estimatedTokens）：预估处理所需token数量
- 置信度（confidence）：分析结果的置信度（0-1）
- 建议标题（suggestedTitle）：请根据提示词的核心价值生成一个准确、吸引人的标题（10-25字）
- 建议描述（description）：请概括提示词的核心能力和价值（60-150字），说明它能帮助用户解决什么问题
- 使用场景（useCases）：请列出3-5个典型的应用场景
- 改进建议（improvements）：请提供3-5个具体的优化建议，帮助提升提示词的效果

## 分析要求
- 请仔细理解提示词的实际功能，而不是被表面词汇误导
- 如果提示词中的某些词汇是比喻性使用，请根据实际功能进行分类
- 请用中文回复，返回有效的JSON格式

## 返回格式示例
{
  "category": "学术",
  "tags": ["模式识别", "系统思维", "角色扮演", "分析", "洞察"],
  "difficulty": "advanced",
  "variables": [],
  "estimatedTokens": 300,
  "confidence": 0.92,
  "suggestedTitle": "跨域模式识别思维专家",
  "description": "具有深度洞察能力的AI角色，专门用于发现复杂系统中的隐藏模式和规律。通过独特的觉察视角，帮助用户在看似无关的事物间建立联系，从而获得更高层次的系统性理解。",
  "useCases": ["复杂问题分析", "系统性思维训练", "创新思维启发", "跨领域研究", "战略规划"],
  "improvements": ["可以增加具体应用示例", "建议明确输出格式", "添加互动引导机制"]
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
    
    // 新提示词从1.0开始
    if (isNewPrompt) {
      let baseVersion = '1.0';

      // 确保版本号不重复
      let version = baseVersion;
      let counter = 1;
      while (existingVersions.includes(version)) {
        const [major, minor] = baseVersion.split('.');
        version = `${major}.${(parseFloat(minor) + (counter * 0.1)).toFixed(1)}`;
        counter++;
      }

      return version;
    }

    // 现有提示词版本必须大于当前版本，默认+0.1
    if (currentVersion) {
      const currentNum = parseFloat(currentVersion);
      const suggestedNum = Math.round((currentNum + 0.1) * 10) / 10; // 默认+0.1

      // 基于复杂度决定是否需要更大的版本增量
      let finalVersion = suggestedNum;
      if (complexity > 0.7 || variables.length > 5) {
        // 大幅改动，建议升级主版本
        const major = Math.floor(currentNum);
        finalVersion = major + 1.0;
      } else if (complexity > 0.5 || variables.length > 2) {
        // 中等改动，建议升级次版本更多  
        finalVersion = Math.round((currentNum + 0.2) * 10) / 10;
      }

      let version = finalVersion.toFixed(1);
      let counter = 1;
      while (existingVersions.includes(version)) {
        version = (finalVersion + (counter * 0.1)).toFixed(1);
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
   * 提取标签
   */
  async extractTags(content: string, existingTags: string[] = []): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('AI标签提取服务未配置API密钥，请联系管理员配置');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            {
              role: 'system',
              content: `你是一个AI提示词标签提取专家。请为提示词提取3-8个准确的标签，标签应该体现提示词的核心特征。

请提取以下类型的标签：
- 功能类型（如：分析、创作、翻译、编程等）
- 应用场景（如：办公、学习、研究等）
- 特色功能（如：角色扮演、深度分析等）

请仔细理解提示词的实际功能，而不是被表面词汇误导。

${existingTags.length > 0 ? `优先使用现有标签：${existingTags.slice(0, 20).join('、')}` : ''}

返回格式：用逗号分隔的标签列表，如：分析,角色扮演,学术研究`
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
      
      return tags.slice(0, 8); // 最多返回8个标签
    } catch (error) {
      console.error('[MCP AI] 标签提取失败:', error);
      
      // 提供具体的错误信息
      if (error.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (error.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (error.response?.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`AI标签提取失败: ${error.message || '未知错误'}，请重试`);
      }
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

  /**
   * 快速分类
   */
  async quickClassify(content: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI分类服务未配置API密钥，请联系管理员配置');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            {
              role: 'system',
              content: `你是一个AI提示词分类专家。请根据提示词内容，从以下分类中选择最合适的一个：
${PRESET_CATEGORIES.join('、')}

请仔细理解提示词的实际功能，而不是被表面词汇误导。如果提示词中的某些词汇是比喻性使用，请根据实际功能进行分类。

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
      console.error('[MCP AI] 分类失败:', error);
      
      // 提供具体的错误信息
      if (error.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (error.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (error.response?.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`AI分类失败: ${error.message || '未知错误'}，请重试`);
      }
    }
  }
}