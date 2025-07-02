/**
 * MCP服务器独立AI分析器
 * 参考web服务AI分析器实现，但完全独立运行
 * 提供智能提示词分析和推荐功能
 */

import axios from 'axios';

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
  
  // 媒体相关字段
  category_type?: 'chat' | 'image' | 'video'; // 分类类型
  suggested_parameters?: {
    // 图像生成参数建议
    style?: string;
    aspect_ratio?: string;
    resolution?: string;
    quality?: string;
    negative_prompt?: string;
    
    // 视频生成参数建议
    duration?: number;
    fps?: number;
    motion_strength?: number;
    camera_movement?: string;
    
    // 通用参数
    model?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * 动态分类管理器
 */
class CategoryManager {
  private categoriesCache: { [key: string]: string[] } = {};
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取指定类型的分类列表
   */
  async getCategories(type: 'chat' | 'image' | 'video'): Promise<string[]> {
    const cacheKey = type;
    const now = Date.now();

    // 检查缓存
    if (this.categoriesCache[cacheKey] && (now - this.lastCacheUpdate) < this.CACHE_TTL) {
      return this.categoriesCache[cacheKey];
    }

    try {
      // 尝试从API获取分类（如果可用）
      const categories = await this.fetchCategoriesFromAPI(type);

      // 更新缓存
      this.categoriesCache[cacheKey] = categories;
      this.lastCacheUpdate = now;

      return categories;
    } catch (error) {
      console.warn(`获取${type}分类失败，使用默认分类`, error);

      // 降级：使用默认分类
      const defaultCategories = this.getDefaultCategories(type);
      this.categoriesCache[cacheKey] = defaultCategories;
      return defaultCategories;
    }
  }

  /**
   * 从API获取分类
   */
  private async fetchCategoriesFromAPI(_type: string): Promise<string[]> {
    // 这里可以实现从web服务API获取分类的逻辑
    // 暂时抛出错误，使用默认分类
    throw new Error('API获取暂未实现');
  }

  /**
   * 获取默认分类 - 不再提供硬编码默认值
   */
  private getDefaultCategories(type: 'chat' | 'image' | 'video'): string[] {
    // 不再提供硬编码的默认分类
    // 如果API失败，应该返回空数组，让调用方处理错误
    console.warn(`无法获取${type}类型的分类，API服务不可用`);
    return [];
  }

  /**
   * 获取所有分类的平面列表
   */
  async getAllCategories(): Promise<string[]> {
    const chatCategories = await this.getCategories('chat');
    const imageCategories = await this.getCategories('image');
    const videoCategories = await this.getCategories('video');

    return [...chatCategories, ...imageCategories, ...videoCategories];
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.categoriesCache = {};
    this.lastCacheUpdate = 0;
  }
}

// 创建分类管理器实例
const categoryManager = new CategoryManager();

// 预设的兼容模型
const PRESET_MODELS = [
  { id: 'llm-large', name: '大型语言模型', description: '70B+参数的大型语言模型' },
  { id: 'llm-medium', name: '中型语言模型', description: '7B-70B参数的中型语言模型' },
  { id: 'llm-small', name: '小型语言模型', description: '7B以下参数的轻量级模型' },
  { id: 'code-specialized', name: '代码专用模型', description: '专门针对编程任务优化' },
  { id: 'translation-specialized', name: '翻译专用模型', description: '专门针对翻译任务优化' },
  { id: 'reasoning-specialized', name: '推理专用模型', description: '专门针对逻辑推理优化' },
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
    _existingTags: string[] = [],
    currentVersion?: string,
    isNewPrompt: boolean = false,
    existingVersions: string[] = []
  ): Promise<MCPAIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('AI分析服务未配置API密钥，请联系管理员配置');
    }

    const _finalConfig: MCPAnalysisConfig = {
      includeImprovements: true,
      includeSuggestions: true,
      language: 'zh',
      strictMode: false,
      ...config
    };

    try {
      const _response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.fullAnalysisModel,
          messages: [
            { role: 'system', content: this.buildAnalysisSystemPrompt() },
            { role: 'user', content: this.buildUserPrompt(content, _finalConfig) }
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
      if (!_response.data || !_response.data.choices || !Array.isArray(_response.data.choices) || _response.data.choices.length === 0) {
        console.error('[MCP AI] API返回格式异常:', _response.data);
        throw new Error('AI服务返回格式异常，请重试');
      }

      const choice = _response.data.choices[0];
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

    } catch (error: unknown) {
      console.error('[MCP AI] 分析失败:', error);
      
      // 提供具体的错误信息
      const axiosError = error as { response?: { status?: number }; message?: string };
      if (axiosError.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (axiosError.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else if (axiosError.message?.includes('timeout')) {
        throw new Error('AI分析超时，请重试');
      } else {
        throw new Error(`AI分析失败: ${axiosError.message || '未知错误'}，请重试`);
      }
    }
  }

  /**
   * 构建分析系统提示词
   */
  private buildAnalysisSystemPrompt(): string {
    return `你是一个专业的AI提示词分析专家，专门分析对话、图像生成和视频生成三种类型的提示词。请根据提供的提示词内容，生成合适的分类、标签、标题、描述等分析结果。

## 分析任务

请根据提供的提示词内容，首先识别其类型（对话/图像生成/视频生成），然后生成对应的分析结果：

### 1. 类型识别（category_type）
请根据提示词的核心用途，自动识别类型：
- "chat"：对话类提示词，用于文本交互、问答、分析、创作等
- "image"：图像生成提示词，用于AI图像生成工具（如DALL-E、Midjourney、Stable Diffusion等）
- "video"：视频生成提示词，用于AI视频生成工具（如Sora、Runway、Pika等）

识别标准：
- 包含"画"、"绘制"、"图像"、"照片"、"设计"、"风格"等关键词 → image
- 包含"视频"、"动画"、"镜头"、"运动"、"帧"、"时长"等关键词 → video  
- 其他情况 → chat

### 2. 分类（category）
根据识别的类型，从对应分类中选择：

**对话类分类（chat）：**
通用对话、学术研究、编程开发、文案写作、翻译语言

**图像生成分类（image）：**
真实摄影、艺术绘画、动漫插画、抽象艺术、Logo设计、建筑空间、时尚设计

**视频生成分类（video）：**
故事叙述、动画特效、产品展示、自然风景、人物肖像、广告营销

### 3. 参数建议（suggested_parameters）
根据类型提供生成参数建议：

**图像生成参数：**
- style: 风格描述（如"photorealistic"、"anime"、"watercolor"）
- aspect_ratio: 长宽比（如"16:9"、"1:1"、"9:16"）
- resolution: 分辨率（如"1024x1024"、"1920x1080"）
- quality: 质量等级（如"high"、"ultra"）
- negative_prompt: 负面提示词（避免的元素）

**视频生成参数：**
- duration: 时长（秒数，如5、10、30）
- fps: 帧率（如24、30、60）
- motion_strength: 运动强度（1-10）
- camera_movement: 镜头运动（如"static"、"pan"、"zoom"、"dolly"）

### 4. 标签（tags）
请提取3-8个准确描述提示词特征的标签：
- 功能类型
- 应用场景
- 风格特征（图像/视频）
- 技术特点

### 5. 其他字段
- 难度级别（difficulty）：beginner/intermediate/advanced
- 变量提取（variables）：找出所有{{变量名}}格式的变量
- 预估token数（estimatedTokens）：预估处理所需token数量
- 置信度（confidence）：分析结果的置信度（0-1）
- 建议标题（suggestedTitle）：根据类型和功能生成标题（10-25字）
- 建议描述（description）：概括核心能力和价值（60-150字）
- 使用场景（useCases）：列出3-5个典型应用场景
- 改进建议（improvements）：提供3-5个具体优化建议

## 返回格式示例

**对话类提示词：**
{
  "category_type": "chat",
  "category": "学术研究",
  "tags": ["数据分析", "学术写作", "研究方法", "统计分析"],
  "difficulty": "intermediate",
  "variables": ["数据类型", "分析目标"],
  "estimatedTokens": 250,
  "confidence": 0.88,
  "suggestedTitle": "学术数据分析助手",
  "description": "专业的学术研究数据分析助手，帮助研究人员进行数据处理、统计分析和结果解释，提供科学严谨的分析报告。",
  "useCases": ["学术论文数据分析", "实验结果统计", "调研数据处理"],
  "improvements": ["增加具体统计方法指导", "添加可视化建议"]
}

**图像生成提示词：**
{
  "category_type": "image",
  "category": "真实摄影",
  "tags": ["人像摄影", "自然光", "高品质", "专业摄影"],
  "suggested_parameters": {
    "style": "photorealistic",
    "aspect_ratio": "16:9",
    "resolution": "1920x1080",
    "quality": "ultra",
    "negative_prompt": "blurry, low quality, distorted"
  },
  "difficulty": "beginner",
  "variables": [],
  "estimatedTokens": 150,
  "confidence": 0.92,
  "suggestedTitle": "专业人像摄影风格",
  "description": "生成高质量的专业人像照片，适用于商务头像、艺术人像等场景，呈现自然真实的摄影效果。",
  "useCases": ["商务头像", "社交媒体头像", "艺术人像创作"],
  "improvements": ["添加具体光线描述", "指定背景细节"]
}

**视频生成提示词：**
{
  "category_type": "video",
  "category": "自然风景",
  "tags": ["风景视频", "延时摄影", "自然美景", "治愈系"],
  "suggested_parameters": {
    "duration": 10,
    "fps": 30,
    "motion_strength": 3,
    "camera_movement": "slow_pan"
  },
  "difficulty": "intermediate",
  "variables": ["场景类型", "时间段"],
  "estimatedTokens": 180,
  "confidence": 0.85,
  "suggestedTitle": "自然风景延时视频",
  "description": "生成唯美的自然风景延时视频，展现大自然的动态美感，适用于背景视频、放松内容等。",
  "useCases": ["网站背景视频", "冥想放松内容", "社交媒体分享"],
  "improvements": ["指定具体季节", "添加音效建议", "明确拍摄角度"]
}`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(content: string, _config: MCPAnalysisConfig): string {
    return `请分析以下提示词内容：

${content}

请按照系统提示的要求，返回JSON格式的分析结果。确保所有字段都存在且格式正确。`;
  }

  /**
   * 验证和格式化分析结果
   */
  private validateAndFormatResult(
    result: Record<string, unknown>, 
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
      finalCompatibleModels = (result.compatibleModels as unknown[]).filter((model): model is string => 
        typeof model === 'string' && validModelIds.includes(model)
      );
    }
    
    // 如果AI没有返回有效模型，使用智能推荐
    if (finalCompatibleModels.length === 0) {
      finalCompatibleModels = this.recommendCompatibleModels((result.category as string) || '通用', originalContent);
    }
    
    // 生成版本建议
    const suggestedVersion = this.suggestVersion(originalContent, existingVersions, currentVersion, isNewPrompt);
    
    // 确保所有必需字段存在
    const validated: MCPAIAnalysisResult = {
      category: (result.category as string) || '通用对话',
      tags: Array.isArray(result.tags) ? (result.tags as string[]).slice(0, 8) : ['AI', '提示词'],
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(result.difficulty as string) 
        ? (result.difficulty as 'beginner' | 'intermediate' | 'advanced') : 'intermediate',
      estimatedTokens: typeof result.estimatedTokens === 'number' 
        ? result.estimatedTokens : Math.ceil(originalContent.length / 4),
      variables: Array.isArray(result.variables) ? (result.variables as string[]) : this.extractVariables(originalContent),
      improvements: Array.isArray(result.improvements) ? (result.improvements as string[]) : [],
      useCases: Array.isArray(result.useCases) ? (result.useCases as string[]) : [],
      compatibleModels: finalCompatibleModels,
      version: suggestedVersion,
      confidence: typeof result.confidence === 'number' 
        ? Math.max(0, Math.min(1, result.confidence)) : 0.8,
      suggestedTitle: (result.suggestedTitle as string) || '',
      description: (result.description as string) || '',
      
      // 新增媒体相关字段验证
      category_type: ['chat', 'image', 'video'].includes(result.category_type as string) 
        ? (result.category_type as 'chat' | 'image' | 'video') : this.detectCategoryType(originalContent),
      suggested_parameters: result.suggested_parameters && typeof result.suggested_parameters === 'object' && !Array.isArray(result.suggested_parameters)
        ? (result.suggested_parameters as Record<string, string | number | boolean | undefined>) : this.generateDefaultParameters((result.category_type as 'chat' | 'image' | 'video') || 'chat')
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
        recommendations.push('image-generation', 'image-analysis');
        break;
      case '绘画':
        recommendations.push('image-generation');
        break;
      case '视频':
        recommendations.push('video-generation');
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
      const baseVersion = '1.0';

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
      const _response = await axios.post(
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

      const tagsText = _response.data.choices[0].message.content.trim();
      const tags = tagsText.split(',').map(tag => tag.trim()).filter(Boolean);
      
      return tags.slice(0, 8); // 最多返回8个标签
    } catch (error: unknown) {
      console.error('[MCP AI] 标签提取失败:', error);
      
      // 提供具体的错误信息
      const axiosError = error as { response?: { status?: number }; message?: string };
      if (axiosError.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (axiosError.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`AI标签提取失败: ${axiosError.message || '未知错误'}，请重试`);
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
      const _response = await axios.post(
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isHealthy: false,
        endpoint: this.baseURL,
        models: {
          full: this.fullAnalysisModel,
          quick: this.quickTasksModel
        },
        error: errorMessage
      };
    }
  }

  /**
   * 获取配置信息
   */
  async getConfig() {
    const chatCategories = await categoryManager.getCategories('chat');
    const imageCategories = await categoryManager.getCategories('image');
    const videoCategories = await categoryManager.getCategories('video');

    return {
      endpoint: this.baseURL,
      models: {
        fullAnalysis: this.fullAnalysisModel,
        quickTasks: this.quickTasksModel
      },
      presetCategories: {
        chat: chatCategories,
        image: imageCategories,
        video: videoCategories
      },
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
      // 获取所有可用分类
      const allCategories = await categoryManager.getAllCategories();

      const _response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [
            {
              role: 'system',
              content: `你是一个AI提示词分类专家。请根据提示词内容，从以下分类中选择最合适的一个：
${allCategories.join('、')}

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

      const category = _response.data.choices[0].message.content.trim();

      if (allCategories.length === 0) {
        // 如果无法获取分类列表，直接返回AI的结果
        return category;
      }

      return allCategories.includes(category) ? category : allCategories[0];
    } catch (error: unknown) {
      console.error('[MCP AI] 分类失败:', error);
      
      // 提供具体的错误信息
      const axiosError = error as { response?: { status?: number }; message?: string };
      if (axiosError.response?.status === 401) {
        throw new Error('AI服务认证失败，请检查API密钥配置');
      } else if (axiosError.response?.status === 429) {
        throw new Error('AI服务请求频率过高，请稍后重试');
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`AI分类失败: ${axiosError.message || '未知错误'}，请重试`);
      }
    }
  }

  /**
   * 检测提示词的类型（对话/图像/视频）
   */
  private detectCategoryType(content: string): 'chat' | 'image' | 'video' {
    const lowerContent = content.toLowerCase();
    
    // 图像生成关键词
    const imageKeywords = [
      '画', '绘制', '绘画', '图像', '图片', '照片', '摄影', '设计', '风格', 
      'style', 'draw', 'paint', 'image', 'photo', 'picture', 'art', 'design',
      '渲染', '像素', '分辨率', '色彩', '构图', '光影', '质感'
    ];
    
    // 视频生成关键词
    const videoKeywords = [
      '视频', '动画', '镜头', '运动', '帧', '时长', '播放', '拍摄', '剪辑',
      'video', 'animation', 'motion', 'camera', 'frame', 'fps', 'duration',
      '场景', '转场', '特效', '慢镜头', '快进', '回放'
    ];
    
    // 检查图像关键词
    const hasImageKeywords = imageKeywords.some(keyword => lowerContent.includes(keyword));
    // 检查视频关键词
    const hasVideoKeywords = videoKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasVideoKeywords) {
      return 'video';
    } else if (hasImageKeywords) {
      return 'image';
    } else {
      return 'chat';
    }
  }

  /**
   * 根据类型生成默认参数
   */
  private generateDefaultParameters(categoryType: 'chat' | 'image' | 'video'): Record<string, string | number> {
    switch (categoryType) {
      case 'image':
        return {
          style: 'photorealistic',
          aspect_ratio: '1:1',
          resolution: '1024x1024',
          quality: 'high'
        };
      
      case 'video':
        return {
          duration: 10,
          fps: 30,
          motion_strength: 5,
          camera_movement: 'static'
        };
      
      case 'chat':
      default:
        return {};
    }
  }
}