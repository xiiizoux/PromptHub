/**
 * AI智能提示词分析服务
 * 使用ChatGPT API实现自动分类、标签提取、版本号建议等功能
 */

import axios from 'axios';
import { MODEL_TAGS, ModelCapability, getModelTagsByCapability } from '@/constants/ai-models';

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
  // 增量分析支持
  incrementalAnalysis?: boolean;
  originalContent?: string;
  existingCategory?: string;
  existingTags?: string[];
  existingModels?: string[];
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
    existingTags: string[] = [], // 新增参数：系统中已存在的标签
    currentVersion?: string, // 新增参数：当前版本
    isNewPrompt: boolean = false, // 新增参数：是否为新提示词
    existingVersions: string[] = [] // 新增参数：已存在的版本
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
      
      return this.validateAndFormatResult(result, content, currentVersion, isNewPrompt, existingVersions);

    } catch (error: any) {
      console.error('AI analysis failed:', error);
      
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
   * 构建系统提示词 - 支持增量分析
   */
  private buildSystemPrompt(config: AnalysisConfig, existingTags: string[] = []): string {
    const language = config.language === 'zh' ? '中文' : 'English';
    
    // 21个预设分类（与数据库categories表完全一致）
    const categories = [
      '全部', '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
    ];
    
    // 预设的兼容模型选项（从MODEL_TAGS中获取）
    const compatibleModelOptions = MODEL_TAGS.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      type: tag.type
    }));
    
    // 构建模型选项字符串
    const modelOptionsText = compatibleModelOptions.map(model => 
      `${model.id}(${model.name})`
    ).join('、');
    
    // 构建已有标签提示
    const existingTagsHint = existingTags.length > 0 
      ? `\n\n系统中已有以下标签，请优先使用这些标签（如果相关的话）：${existingTags.slice(0, 20).join('、')}`
      : '';

    // 构建增量分析提示
    const incrementalAnalysisHint = config.incrementalAnalysis 
      ? `\n\n【增量分析模式】
这是对现有提示词的修改分析，请考虑以下现有参数：
- 原始分类：${config.existingCategory || '未知'}
- 现有标签：${config.existingTags?.join('、') || '无'}
- 兼容模型：${config.existingModels?.join('、') || '无'}

分析策略：
1. **分类判断**：基于提示词的实际功能和用途判断分类，而不是基于修改程度
   - 健康类提示词即使修改90%，只要功能还是健康相关，就应保持健康分类
   - 只有当提示词的核心功能发生根本性改变时，才建议更换分类
   - 如果现有分类不准确，可以建议更合适的分类

2. **标签策略**：
   - 保留现有的相关标签
   - 根据内容变化添加新的合适标签
   - 移除明显不再适用的标签

3. **描述更新**：根据内容变化程度调整描述详细程度
   - 轻微变化：保持原描述或微调
   - 中等变化：适当更新描述
   - 重大变化：重新撰写描述

4. **版本号建议**：轻微变化+0.1，中等变化+0.5，重大变化+1.0` 
      : '';
    
    return `你是一个专业的AI提示词分析专家，擅长深度理解和分析各种类型的提示词内容。请仔细分析用户提供的提示词，并返回JSON格式的分析结果。${incrementalAnalysisHint}

## 分析方法论
在进行分析时，请遵循以下步骤：
1. **核心功能识别**：这个提示词的主要目的是什么？它要解决什么问题？
2. **使用场景判断**：用户在什么情况下会使用这个提示词？
3. **能力层次评估**：这个提示词展现了什么样的AI能力需求？
4. **风格特征识别**：是技术性的、创意性的、还是哲学性的？

## 具体分析要求

### 1. 分类（category）
必须从以下21个预设分类中选择最合适的一个：
选项：${categories.join('、')}

**分类判断准则**：
- 不要被表面词汇误导，要理解内容的本质功能
- 如果提示词包含角色设定+思维方法，通常属于"学术"或"通用"
- 如果包含创作指导，属于"文案"或"创意写作"
- 如果包含代码或技术内容，属于"编程"
- 如果只是比喻性地提到某个领域（如音乐、绘画），不代表属于该分类

### 2. 兼容模型（compatibleModels）
从以下预设模型中选择1-3个最适合的：
选项：${modelOptionsText}
说明：返回模型ID数组格式，根据提示词的复杂度和能力需求选择

### 3. 标签（tags）
提取3-8个精准标签，体现提示词的核心特征。请按照以下标签分类体系进行提取：

**功能类标签**（必选1-3个）：
- 核心能力：分析、创作、翻译、编程、设计、教学、咨询、管理
- 思维方式：逻辑推理、创意思维、系统思维、批判思维、模式识别
- 处理类型：文本处理、数据分析、内容生成、问题解决、决策支持

**角色类标签**（可选1-2个）：
- 专业角色：专家、顾问、助手、导师、分析师、创作者
- 领域角色：技术专家、商业顾问、学术研究者、创意总监

**应用场景标签**（必选1-2个）：
- 工作场景：办公、研究、教学、咨询、创作、开发
- 使用目的：学习、工作、娱乐、研究、创新、效率提升

**特色标签**（可选1-2个）：
- 交互方式：角色扮演、对话式、引导式、结构化
- 输出特点：深度分析、创意输出、系统性、个性化

**标签提取原则**：
1. **本质优先**：基于提示词的真实功能，而非表面词汇
2. **层次分明**：从抽象到具体，从核心到辅助
3. **用户视角**：考虑用户搜索和使用习惯
4. **避免重复**：不要使用意思相近的标签
5. **精准表达**：使用准确、专业但易懂的词汇

**特殊情况处理**：
- 哲学性/抽象性提示词：优先使用"哲学思考"、"深度洞察"、"抽象思维"
- 角色扮演类：必须包含"角色扮演"标签
- 复合功能类：选择最主要的2-3个功能标签
- 创新性提示词：可以创建新标签，但要确保准确性

${existingTagsHint}

### 4. 其他基础字段
- 难度级别（difficulty）：beginner/intermediate/advanced
- 变量提取（variables）：找出所有{{变量名}}格式的变量
- 预估token数（estimatedTokens）：预估处理所需token数量
- 置信度（confidence）：分析结果的置信度（0-1）

### 5. 增强分析字段
${config.includeImprovements ? `
**改进建议（improvements）**：
- 分析提示词的不足之处
- 提供3-5个具体的优化建议
- 重点关注清晰度、完整性、可操作性` : ''}

${config.includeSuggestions ? `
**使用场景（useCases）**：
- 基于提示词的真实功能，列出3-5个典型应用场景
- 要具体、实际、有价值

**标题建议（suggestedTitle）**：
- 深度理解提示词的核心价值和独特性
- 生成一个准确、吸引人的标题（10-25字）
- 要体现功能而非简单描述，如：
  * "系统性思维模式分析专家"
  * "跨领域模式识别助手" 
  * "深度洞察与规律发现者"
- 避免：过于通用的词汇（如"AI助手"、"生成器"）

**描述建议（description）**：
- 准确概括提示词的核心能力和价值（60-150字）
- 说明它能帮助用户解决什么具体问题
- 突出独特性和专业性
- 使用吸引人但不夸张的语言` : ''}

## 重要提醒
- **深度理解胜过表面分析**：不要被某个词汇误导，要理解整体意图
- **功能导向分类**：按照提示词的实际功能分类，而非表面主题
- **准确性第一**：宁可保守也不要过度解读
- **专业性表达**：使用专业但易懂的语言
- 分类必须严格从上述21个预设分类中选择一个
- 兼容模型必须从预设选项中选择1-3个，返回ID数组格式
- 不要返回版本号（version），版本由系统自动生成
- 请用${language}回复，返回有效的JSON格式

## 返回格式示例
{
  "category": "学术",
  "compatibleModels": ["llm-large", "reasoning-specialized"],
  "tags": ["模式识别", "系统思维", "角色扮演", "分析", "洞察", "哲学思考"],
  "difficulty": "advanced",
  "variables": [],
  "estimatedTokens": 300,
  "confidence": 0.92,
  "improvements": ["可以增加具体应用示例", "建议明确输出格式"],
  "useCases": ["复杂问题分析", "系统性思维训练", "创新思维启发"],
  "suggestedTitle": "跨域模式识别思维专家",
  "description": "具有深度洞察能力的AI角色，专门用于发现复杂系统中的隐藏模式和规律。通过独特的觉察视角，帮助用户在看似无关的事物间建立联系，识别递归结构和韵律节奏，从而获得更高层次的系统性理解。"
}`;
  }

  /**
   * 构建用户提示词 - 支持增量分析
   */
  private buildUserPrompt(content: string, config: AnalysisConfig): string {
    let prompt = `请分析以下提示词：

\`\`\`
${content}
\`\`\``;

    // 如果是增量分析，提供原始内容比较
    if (config.incrementalAnalysis && config.originalContent) {
      prompt += `

【原始内容】（用于比较分析）：
\`\`\`
${config.originalContent}
\`\`\`

请比较新旧内容，评估变化程度，并根据变化程度决定是否需要更新分类、标签、兼容模型等参数。`;
    }

    prompt += `

请返回JSON格式的分析结果，包含所有必需字段。确保JSON格式正确且可解析。`;

    return prompt;
  }

  /**
   * 验证和格式化分析结果
   */
  private validateAndFormatResult(result: any, originalContent: string, currentVersion?: string, isNewPrompt: boolean = false, existingVersions: string[] = []): AIAnalysisResult {
    // 获取有效的预设模型ID列表
    const validModelIds = MODEL_TAGS.map(tag => tag.id);
    
    // 验证AI返回的兼容模型
    let finalCompatibleModels: string[] = [];
    if (Array.isArray(result.compatibleModels)) {
      // 过滤出有效的模型ID
      finalCompatibleModels = result.compatibleModels.filter((model: string) => 
        validModelIds.includes(model)
      );
    }
    
    // 如果AI没有返回有效模型或返回的模型无效，则使用智能推荐
    if (finalCompatibleModels.length === 0) {
      finalCompatibleModels = this.recommendCompatibleModels(result.category || '通用', originalContent);
      console.log('⚠️ AI返回的模型无效，使用智能推荐:', finalCompatibleModels);
    } else {
      console.log('✅ 使用AI返回的有效模型:', finalCompatibleModels);
    }
    
    // 生成版本建议
    const suggestedVersion = this.suggestVersion(originalContent, existingVersions, currentVersion, isNewPrompt);
    
    // 添加调试日志
    console.log('🔧 validateAndFormatResult 调试:');
    console.log('- AI返回的版本:', result.version);
    console.log('- 我们建议的版本:', suggestedVersion);
    console.log('- AI返回的模型:', result.compatibleModels);
    console.log('- 最终使用的模型:', finalCompatibleModels);
    console.log('- 当前版本:', currentVersion);
    console.log('- 是否新提示词:', isNewPrompt);
    
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
      compatibleModels: finalCompatibleModels, // 使用验证后的模型列表
      version: suggestedVersion, // 始终使用我们的版本建议，不使用AI返回的版本
      confidence: typeof result.confidence === 'number' 
        ? Math.max(0, Math.min(1, result.confidence)) : 0.8,
      suggestedTitle: result.suggestedTitle || '',
      description: result.description || ''
    };

    console.log('✅ 最终验证结果:', {
      version: validated.version,
      compatibleModels: validated.compatibleModels,
      category: validated.category
    });

    return validated;
  }

  /**
   * 基于分类和内容推荐兼容模型
   */
  private recommendCompatibleModels(category: string, content: string): string[] {
    const recommendations: string[] = [];
    
    // 从预设的MODEL_TAGS中获取模型ID
    const availableModels = MODEL_TAGS.map(tag => tag.id);
    
    // 基于分类推荐
    switch (category) {
      case '编程':
        recommendations.push('code-specialized', 'llm-large');
        break;
      case '文案':
      case '创意写作':
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
    
    // 检测图像相关内容
    if (lowerContent.includes('图片') || lowerContent.includes('图像') || 
        lowerContent.includes('画') || lowerContent.includes('设计')) {
      if (!recommendations.includes('image-generation')) {
        recommendations.push('image-generation');
      }
      if (!recommendations.includes('multimodal-vision')) {
        recommendations.push('multimodal-vision');
      }
    }
    
    // 检测音频相关内容
    if (lowerContent.includes('音频') || lowerContent.includes('语音') || 
        lowerContent.includes('音乐') || lowerContent.includes('录音')) {
      if (!recommendations.includes('audio-generation')) {
        recommendations.push('audio-generation');
      }
    }
    
    // 检测代码相关内容
    if (lowerContent.includes('代码') || lowerContent.includes('编程') || 
        lowerContent.includes('函数') || lowerContent.includes('算法')) {
      if (!recommendations.includes('code-specialized')) {
        recommendations.push('code-specialized');
      }
    }
    
    // 检测推理相关内容
    if (lowerContent.includes('推理') || lowerContent.includes('逻辑') || 
        lowerContent.includes('数学') || lowerContent.includes('计算')) {
      if (!recommendations.includes('reasoning-specialized')) {
        recommendations.push('reasoning-specialized');
      }
    }

    // 检测多模态相关内容
    if (lowerContent.includes('视觉') || lowerContent.includes('看图') || 
        lowerContent.includes('图片分析') || lowerContent.includes('多模态')) {
      if (!recommendations.includes('multimodal-vision')) {
        recommendations.push('multimodal-vision');
      }
    }
    
    // 过滤掉不在预设模型列表中的推荐
    const validRecommendations = recommendations.filter(model => availableModels.includes(model));
    
    // 确保至少有一个推荐，如果没有有效推荐则使用默认模型
    if (validRecommendations.length === 0) {
      validRecommendations.push('llm-large');
    }
    
    // 限制推荐数量并去重
    const uniqueRecommendations = Array.from(new Set(validRecommendations));
    return uniqueRecommendations.slice(0, 4);
  }

  /**
   * 后备分析方案（当API调用失败时）
   */
  private getFallbackAnalysis(content: string, currentVersion?: string, isNewPrompt: boolean = false, existingVersions: string[] = []): AIAnalysisResult {
    const variables = this.extractVariables(content);
    const estimatedTokens = Math.ceil(content.length / 4);
    
    // 基于关键词的简单分类
    const category = this.detectCategoryByKeywords(content);
    const tags = this.extractTagsByKeywords(content);
    const recommendedModels = this.recommendCompatibleModels(category, content);
    const suggestedVersion = this.suggestVersion(content, existingVersions, currentVersion, isNewPrompt);

    // 智能生成标题
    const suggestedTitle = this.generateIntelligentTitle(content, category);

    // 调试日志
    console.log('🔍 后备分析调试信息:');
    console.log('- 分类:', category);
    console.log('- 推荐模型:', recommendedModels);
    console.log('- 建议版本:', suggestedVersion);
    console.log('- 建议标题:', suggestedTitle);
    console.log('- 当前版本:', currentVersion);
    console.log('- 是否新提示词:', isNewPrompt);
    console.log('- 已有版本:', existingVersions);

    return {
      category,
      tags,
      difficulty: estimatedTokens > 500 ? 'advanced' : estimatedTokens > 200 ? 'intermediate' : 'beginner',
      estimatedTokens,
      variables,
      improvements: ['建议添加更多上下文信息', '可以优化变量命名'],
      useCases: ['通用AI对话', '内容生成'],
      compatibleModels: recommendedModels, // 使用我们的智能推荐
      version: suggestedVersion,
      confidence: 0.6,
      suggestedTitle: suggestedTitle,
      description: '基于内容特征的自动分析结果'
    };
  }

  /**
   * 智能生成标题
   */
  private generateIntelligentTitle(content: string, category: string): string {
    const lowerContent = content.toLowerCase();
    
    // 特殊类型检测和标题生成
    const specialPatterns = [
      {
        patterns: ['模式', '觉察', '洞察', '系统', '规律', '结构'],
        roleIndicators: ['你拥有', '你是', '你的天赋', '你活着就是为了'],
        titleTemplates: ['模式识别专家', '系统洞察大师', '规律发现者', '跨域分析师']
      },
      {
        patterns: ['思维', '分析', '理性', '逻辑', '推理'],
        roleIndicators: ['专家', '分析师', '顾问'],
        titleTemplates: ['思维分析专家', '逻辑推理助手', '理性分析师', '深度思考者']
      },
      {
        patterns: ['创意', '创作', '灵感', '想象'],
        roleIndicators: ['创作者', '艺术家', '设计师'],
        titleTemplates: ['创意思维激发器', '灵感创作助手', '想象力增强器']
      }
    ];

    // 检查特殊模式
    for (const pattern of specialPatterns) {
      const hasPattern = pattern.patterns.some(p => lowerContent.includes(p));
      const hasRole = pattern.roleIndicators.some(r => content.includes(r));
      
      if (hasPattern && hasRole) {
        return pattern.titleTemplates[0]; // 返回最匹配的标题
      }
    }

    // 基于关键功能词生成标题
    const functionKeywords = {
      '写作': ['写作助手', '文字创作师', '内容生成器'],
      '翻译': ['翻译专家', '语言转换器', '多语言助手'], 
      '编程': ['代码生成器', '编程助手', '开发顾问'],
      '分析': ['数据分析师', '洞察专家', '分析顾问'],
      '设计': ['设计师', '创意总监', '视觉顾问'],
      '教学': ['教学助手', '学习导师', '知识传播者'],
      '咨询': ['专业顾问', '解决方案专家', '策略分析师'],
      '管理': ['管理顾问', '项目专家', '效率优化师']
    };

    let foundKeyword = '';
    for (const [keyword, titles] of Object.entries(functionKeywords)) {
      if (lowerContent.includes(keyword)) {
        return titles[0];
      }
    }

    // 基于类别生成通用标题
    const categoryTitles: Record<string, string[]> = {
      '学术': ['学术研究助手', '知识分析专家', '思维导师', '洞察分析师'],
      '编程': ['代码助手', '编程顾问', '开发专家', '技术助理'],
      '文案': ['文案创作师', '内容生成器', '写作助手', '营销文案专家'],
      '设计': ['设计顾问', '创意助手', '视觉专家', '美学顾问'],
      '翻译': ['翻译专家', '语言助手', '多语言顾问', '国际化专家'],
      '教育': ['教学助手', '学习顾问', '知识导师', '教育专家'],
      '商业': ['商业顾问', '策略专家', '管理助手', '商务分析师'],
      '通用': ['智能助手', '问题解决专家', '多功能顾问', '通用分析师']
    };

    const titles = categoryTitles[category] || categoryTitles['通用'];
    
    // 如果内容包含哲学性、抽象性词汇，优先选择高级标题
    const abstractKeywords = ['哲学', '思想', '智慧', '洞察', '觉悟', '意识', '灵魂', '精神'];
    const hasAbstractConcepts = abstractKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasAbstractConcepts && category === '学术') {
      return '哲学思维导师';
    }

    return titles[0];
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
   * 基于关键词检测分类
   */
  private detectCategoryByKeywords(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // 高优先级：精确匹配专业领域
    const preciseMatches = [
      { keywords: ['import ', 'function ', 'class ', 'def ', 'const ', 'let ', 'var ', '```'], category: '编程' },
      { keywords: ['translate', '翻译', '英文', '中文', '日文', '法文', '德文'], category: '翻译' },
      { keywords: ['论文', '研究', 'research', 'academic', '学术', '引用', 'citation'], category: '学术' },
    ];

    for (const match of preciseMatches) {
      if (match.keywords.some(keyword => content.includes(keyword))) {
        return match.category;
      }
    }

    // 中优先级：角色和思维类型检测
    const roleThinkingMatches = [
      { 
        keywords: ['模式', '系统', '洞察', '分析', '思维', '觉察', '规律', '结构', '逻辑推理'],
        roleKeywords: ['专家', '分析师', '顾问', '助手', '者'],
        category: '学术'
      },
      {
        keywords: ['角色', '扮演', '你是', '你的身份', '你拥有', '你活着就是为了'],
        category: '通用'
      },
      {
        keywords: ['创作', '写作', '文案', '故事', '小说', '诗歌', '剧本'],
        category: '文案'
      },
      {
        keywords: ['设计', '界面', 'UI', 'UX', '布局', '视觉'],
        category: '设计'
      },
      {
        keywords: ['教学', '学习', '教育', '培训', '课程', '指导'],
        category: '教育'
      },
      {
        keywords: ['商业', '营销', '销售', '市场', '策略', '管理'],
        category: '商业'
      }
    ];

    for (const match of roleThinkingMatches) {
      const hasMainKeywords = match.keywords.some(keyword => lowerContent.includes(keyword));
      const hasRoleKeywords = !match.roleKeywords || match.roleKeywords.some(keyword => lowerContent.includes(keyword));
      
      if (hasMainKeywords && hasRoleKeywords) {
        return match.category;
      }
    }

    // 低优先级：通用关键词匹配
    const generalMatches = [
      { keywords: ['音乐', '歌曲', '音符', '旋律', '乐谱', '作曲'], category: '音乐' },
      { keywords: ['视频', '剪辑', '制作', '拍摄'], category: '视频' },
      { keywords: ['健康', '医疗', '营养', '锻炼'], category: '健康' },
      { keywords: ['游戏', '玩法', '关卡', '角色'], category: '游戏' },
      { keywords: ['科技', '技术', '创新', '数字化'], category: '科技' },
    ];

    for (const match of generalMatches) {
      if (match.keywords.some(keyword => lowerContent.includes(keyword))) {
        return match.category;
      }
    }

    // 特殊逻辑：如果是比喻性使用而非真实功能，返回通用
    if (this.isMetaphoricalUsage(content)) {
      return '通用';
    }

    return '通用';
  }

  /**
   * 判断是否为比喻性使用
   */
  private isMetaphoricalUsage(content: string): boolean {
    const metaphorIndicators = [
      '像', '如同', '仿佛', '犹如', '比如', '例如',
      '当别人看见', '当别人听见', '就像', '如同一位'
    ];
    
    return metaphorIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * 基于关键词提取标签
   */
  private extractTagsByKeywords(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const tags: string[] = [];
    
    // 功能类标签检测
    const functionTags = {
      '分析': ['分析', '解析', '研究', '调查', '评估', '检测'],
      '创作': ['创作', '写作', '生成', '创建', '制作', '编写'],
      '翻译': ['翻译', '转换', '语言', '英文', '中文', '多语言'],
      '编程': ['编程', '代码', '开发', '函数', '算法', 'javascript', 'python'],
      '设计': ['设计', '界面', '视觉', '布局', 'ui', 'ux', '美术'],
      '教学': ['教学', '培训', '指导', '辅导', '学习', '课程'],
      '咨询': ['咨询', '建议', '推荐', '指导', '解答', '帮助'],
      '管理': ['管理', '规划', '组织', '协调', '优化', '策略']
    };

    // 思维方式标签检测
    const thinkingTags = {
      '系统思维': ['系统', '整体', '结构', '框架', '体系', '全局'],
      '模式识别': ['模式', '规律', '趋势', '特征', '相似', '重复'],
      '逻辑推理': ['逻辑', '推理', '推断', '演绎', '归纳', '因果'],
      '创意思维': ['创意', '创新', '想象', '灵感', '突破', '原创'],
      '批判思维': ['批判', '质疑', '评价', '判断', '辨析', '反思'],
      '深度洞察': ['洞察', '觉察', '感知', '理解', '领悟', '透视']
    };

    // 角色类标签检测
    const roleTags = {
      '角色扮演': ['你是', '你的身份', '你拥有', '扮演', '角色', '身份'],
      '专家': ['专家', '权威', '资深', '专业人士', '大师'],
      '顾问': ['顾问', '咨询师', '建议者', '指导者'],
      '助手': ['助手', '助理', '帮手', '支持者'],
      '导师': ['导师', '老师', '教练', '引路人'],
      '分析师': ['分析师', '研究员', '调研员', '评估师']
    };

    // 应用场景标签检测
    const scenarioTags = {
      '研究': ['研究', '学术', '论文', '实验', '调研'],
      '办公': ['办公', '工作', '职场', '商务', '企业'],
      '创作': ['创作', '写作', '文学', '艺术', '内容'],
      '学习': ['学习', '教育', '培训', '知识', '技能'],
      '咨询': ['咨询', '服务', '客户', '解决方案'],
      '娱乐': ['娱乐', '游戏', '趣味', '休闲', '放松']
    };

    // 特色标签检测
    const featureTags = {
      '深度分析': ['深度', '深入', '详细', '全面', '透彻'],
      '个性化': ['个性化', '定制', '专属', '量身', '针对性'],
      '结构化': ['结构化', '有序', '条理', '系统性', '规范'],
      '互动式': ['互动', '对话', '交流', '沟通', '问答'],
      '创意输出': ['创意', '新颖', '独特', '原创', '突破性']
    };

    // 检测各类标签
    const allTagCategories = [functionTags, thinkingTags, roleTags, scenarioTags, featureTags];
    
    for (const tagCategory of allTagCategories) {
      for (const [tag, keywords] of Object.entries(tagCategory)) {
        if (keywords.some(keyword => lowerContent.includes(keyword))) {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
    }

    // 特殊情况处理
    // 哲学性/抽象性内容检测
    const philosophicalKeywords = ['哲学', '思想', '智慧', '觉悟', '意识', '精神', '灵魂', '本质', '真理'];
    if (philosophicalKeywords.some(keyword => lowerContent.includes(keyword))) {
      if (!tags.includes('哲学思考')) tags.push('哲学思考');
    }

    // 比喻性表达检测
    const metaphorKeywords = ['像', '如同', '仿佛', '犹如', '当别人看见', '当别人听见'];
    if (metaphorKeywords.some(keyword => content.includes(keyword))) {
      if (!tags.includes('抽象思维')) tags.push('抽象思维');
    }

    // 确保至少有基础标签
    if (tags.length === 0) {
      tags.push('AI助手', '问题解决');
    }

    // 限制标签数量并排序（重要的在前）
    const priorityOrder = ['角色扮演', '系统思维', '模式识别', '深度分析', '分析', '创作', '咨询', '专家'];
    const sortedTags = tags.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    return sortedTags.slice(0, 8); // 最多8个标签
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
  suggestVersion(content: string, existingVersions: string[] = [], currentVersion?: string, isNewPrompt: boolean = false): string {
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
        version = `${major}.${(parseFloat(minor) + (counter * 0.1)).toFixed(1)}`;
        counter++;
      }

      return version;
    }

    // 现有提示词版本必须大于等于当前版本
    if (currentVersion) {
      const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
      let suggestedMajor = currentMajor;
      let suggestedMinor = currentMinor;

      // 基于复杂度和变量数量决定版本增量
      if (complexity > 0.7 || variables.length > 5) {
        // 大幅改动，建议升级主版本
        suggestedMajor = currentMajor + 1;
        suggestedMinor = 0;
      } else if (complexity > 0.5 || variables.length > 2) {
        // 中等改动，建议升级次版本
        suggestedMinor = currentMinor + 1;
      } else {
        // 小幅改动，建议升级小版本
        suggestedMinor = currentMinor + 1;
      }

      let baseVersion = `${suggestedMajor}.${suggestedMinor}`;
      
      // 确保版本号不重复
      let version = baseVersion;
      let counter = 1;
      while (existingVersions.includes(version)) {
        version = `${suggestedMajor}.${(suggestedMinor + counter).toFixed(1)}`;
        counter++;
      }

      return version;
    }

    // 如果没有当前版本信息，按照旧逻辑处理
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
      version = `${major}.${(parseFloat(minor) + (counter * 0.1)).toFixed(1)}`;
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