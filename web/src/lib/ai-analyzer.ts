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
    existingTags: string[] = [],
    currentVersion?: string,
    isNewPrompt: boolean = false,
    existingVersions: string[] = []
  ): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('AI分析服务未配置API密钥，请联系管理员配置');
    }

    const finalConfig: AnalysisConfig = {
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
            { role: 'system', content: this.buildSystemPrompt(finalConfig, existingTags) },
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
        console.error('AI API返回格式异常:', response.data);
        throw new Error('AI服务返回格式异常，请重试');
      }

      const choice = response.data.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        console.error('AI API返回内容为空:', choice);
        throw new Error('AI服务返回内容为空，请重试');
      }

      const result = choice.message.content;
      
      try {
        const parsedResult = JSON.parse(result);
        return this.validateAndFormatResult(parsedResult, content, currentVersion, isNewPrompt, existingVersions);
      } catch (parseError) {
        console.error('AI返回结果解析失败:', parseError);
        console.error('原始返回内容:', result);
        throw new Error('AI分析结果格式错误，请重试');
      }

    } catch (error: any) {
      console.error('AI分析失败:', error);
      
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
    
    return `你是一个专业的AI提示词分析专家。请根据提供的提示词内容，生成合适的分类、标签、标题、描述等分析结果。${incrementalAnalysisHint}

## 分析任务

请根据提供的提示词内容，理解其核心功能和用途，然后生成以下分析结果：

### 1. 分类（category）
请根据提示词的主要功能和用途，从以下分类中选择最合适的一个：
${categories.join('、')}

### 2. 兼容模型（compatibleModels）
请根据提示词的复杂度和能力需求，从以下模型中选择1-3个最适合的：
${modelOptionsText}
返回格式：模型ID数组，如 ["llm-large", "reasoning-specialized"]

### 3. 标签（tags）
请提取3-8个能够准确描述提示词特征的标签，包括：
- 功能类型（如：分析、创作、翻译、编程等）
- 应用场景（如：办公、学习、研究等）
- 特色功能（如：角色扮演、深度分析等）

### 4. 其他字段
- 难度级别（difficulty）：beginner/intermediate/advanced
- 变量提取（variables）：找出所有{{变量名}}格式的变量
- 预估token数（estimatedTokens）：预估处理所需token数量
- 置信度（confidence）：分析结果的置信度（0-1）

${config.includeSuggestions ? `
### 5. 建议内容
- **标题建议（suggestedTitle）**：请根据提示词的核心价值生成一个准确、吸引人的标题（10-25字）
- **描述建议（description）**：请概括提示词的核心能力和价值（60-150字），说明它能帮助用户解决什么问题
- **使用场景（useCases）**：请列出3-5个典型的应用场景` : ''}

${config.includeImprovements ? `
- **改进建议（improvements）**：请提供3-5个具体的优化建议，帮助提升提示词的效果` : ''}

${existingTagsHint}

## 分析要求
- 请仔细理解提示词的实际功能，而不是被表面词汇误导
- 如果提示词中的某些词汇是比喻性使用，请根据实际功能进行分类
- 请用${language}回复，返回有效的JSON格式

## 返回格式示例
{
  "category": "学术",
  "compatibleModels": ["llm-large", "reasoning-specialized"],
  "tags": ["模式识别", "系统思维", "角色扮演", "分析", "洞察"],
  "difficulty": "advanced",
  "variables": [],
  "estimatedTokens": 300,
  "confidence": 0.92,
  "improvements": ["可以增加具体应用示例", "建议明确输出格式"],
  "useCases": ["复杂问题分析", "系统性思维训练", "创新思维启发"],
  "suggestedTitle": "跨域模式识别思维专家",
  "description": "具有深度洞察能力的AI角色，专门用于发现复杂系统中的隐藏模式和规律。通过独特的觉察视角，帮助用户在看似无关的事物间建立联系，从而获得更高层次的系统性理解。"
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
   * 推荐兼容的模型
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
   * 智能生成描述
   */
  private generateIntelligentDescription(content: string, category: string, tags: string[]): string {
    const lowerContent = content.toLowerCase();
    
    // 检测角色扮演类型
    const isRolePlay = tags.includes('角色扮演') || content.includes('你是') || content.includes('你拥有') || content.includes('你的身份');
    
    // 检测核心能力
    const coreAbilities = [];
    if (tags.includes('系统思维') || lowerContent.includes('系统')) coreAbilities.push('系统性思维');
    if (tags.includes('模式识别') || lowerContent.includes('模式')) coreAbilities.push('模式识别');
    if (tags.includes('深度洞察') || lowerContent.includes('洞察')) coreAbilities.push('深度洞察');
    if (tags.includes('分析') || lowerContent.includes('分析')) coreAbilities.push('智能分析');
    if (tags.includes('创作') || lowerContent.includes('创作')) coreAbilities.push('创意生成');
    
    // 检测独特方法/视角
    const uniqueMethods = [];
    if (lowerContent.includes('跨域') || lowerContent.includes('跨领域')) uniqueMethods.push('跨领域连接');
    if (lowerContent.includes('直觉') || lowerContent.includes('感知')) uniqueMethods.push('直觉感知');
    if (lowerContent.includes('抽象') || lowerContent.includes('本质')) uniqueMethods.push('抽象思维');
    if (lowerContent.includes('结构') || lowerContent.includes('框架')) uniqueMethods.push('结构化分析');
    
    // 检测解决的问题
    const problemsSolved = [];
    if (lowerContent.includes('复杂') || lowerContent.includes('系统')) problemsSolved.push('复杂问题分析');
    if (lowerContent.includes('隐藏') || lowerContent.includes('潜在')) problemsSolved.push('隐藏规律发现');
    if (lowerContent.includes('联系') || lowerContent.includes('关系')) problemsSolved.push('要素关联识别');
    if (lowerContent.includes('决策') || lowerContent.includes('选择')) problemsSolved.push('决策支持');
    
    // 根据类型生成描述
    if (isRolePlay && category === '学术') {
      const ability = coreAbilities.length > 0 ? coreAbilities[0] : '深度分析';
      const method = uniqueMethods.length > 0 ? uniqueMethods[0] : '专业视角';
      const problem = problemsSolved.length > 0 ? problemsSolved[0] : '复杂问题解决';
      const value = '更高层次的理解和洞察';
      
      return `具有${ability}能力的AI角色，专门用于发现复杂系统中的隐藏模式和规律。通过${method}，帮助用户进行${problem}，从而获得${value}。`;
    }
    
    if (category === '编程') {
      return `专业的编程开发工具，能够生成高质量代码和提供技术解决方案。支持多种编程语言和开发场景，帮助用户提升开发效率和代码质量。`;
    }
    
    if (category === '文案') {
      return `创意文案创作助手，结合营销策略和用户心理生成吸引人的文案内容。适用于广告、营销、品牌传播等场景，帮助用户实现更好的传播效果。`;
    }
    
    if (category === '翻译') {
      return `智能多语言翻译工具，通过上下文理解和文化适配提供准确的翻译服务。支持多种语言对，帮助用户实现跨语言沟通和内容本地化。`;
    }
    
    if (category === '设计') {
      return `专业设计顾问工具，能够提供创意设计方案和视觉建议。结合美学原理和用户体验，帮助用户创造出色的设计作品。`;
    }
    
    if (category === '视频') {
      return `专业视频制作助手，提供从策划到后期的全流程支持。擅长剪辑技巧、视觉效果和叙事结构，帮助用户创作引人入胜的视频内容。`;
    }
    
    if (category === '音乐') {
      return `智能音乐创作工具，能够协助旋律创作、歌词编写和编曲制作。结合音乐理论和情感表达，帮助用户创造动人的音乐作品。`;
    }
    
    if (category === 'TTS音频') {
      return `专业语音合成助手，提供自然流畅的语音生成服务。支持多种音色和情感表达，适用于有声读物、配音和语音导航等场景。`;
    }
    
    if (category === '图片') {
      return `智能图像设计工具，能够生成各类视觉内容和设计方案。结合美学原理和用户需求，帮助用户创作专业的图像作品。`;
    }
    
    if (category === '播客') {
      return `专业播客制作助手，提供节目策划、内容创作和制作指导。帮助用户打造高质量的音频节目，实现有效的知识传播和观众互动。`;
    }
    
    // 通用描述模板
    const mainFunction = coreAbilities.length > 0 ? coreAbilities.join('和') : '智能分析';
    const approach = uniqueMethods.length > 0 ? uniqueMethods[0] : '专业方法';
    const outcome = problemsSolved.length > 0 ? problemsSolved[0] : '问题解决';
    
    return `智能${mainFunction}工具，通过${approach}深入理解用户需求。提供专业的分析和建议，帮助用户实现${outcome}和效率提升。`;
  }

  /**
   * 智能生成改进建议
   */
  private generateIntelligentImprovements(content: string, category: string, tags: string[]): string[] {
    const improvements: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // 基于内容长度的建议
    if (content.length < 50) {
      improvements.push('建议增加更详细的描述和上下文信息');
    } else if (content.length > 2000) {
      improvements.push('考虑将长提示词拆分为多个更专注的子提示词');
    }
    
    // 基于变量使用的建议
    const variables = this.extractVariables(content);
    if (variables.length === 0 && content.length > 100) {
      improvements.push('考虑添加变量以提高提示词的复用性');
    } else if (variables.length > 5) {
      improvements.push('变量较多，建议优化变量命名和组织结构');
    }
    
    // 基于分类的专业建议
    switch (category) {
      case '编程':
        if (!lowerContent.includes('示例') && !lowerContent.includes('example')) {
          improvements.push('建议添加代码示例以提高输出质量');
        }
        if (!lowerContent.includes('格式') && !lowerContent.includes('format')) {
          improvements.push('明确指定代码格式和注释要求');
        }
        break;
      case '文案':
        if (!lowerContent.includes('目标') && !lowerContent.includes('受众')) {
          improvements.push('建议明确目标受众和传播目标');
        }
        if (!lowerContent.includes('风格') && !lowerContent.includes('tone')) {
          improvements.push('指定文案风格和语调要求');
        }
        break;
      case '学术':
        if (!lowerContent.includes('引用') && !lowerContent.includes('参考')) {
          improvements.push('考虑添加引用格式和参考文献要求');
        }
        if (!lowerContent.includes('结构') && !lowerContent.includes('框架')) {
          improvements.push('建议明确论述结构和逻辑框架');
        }
        break;
      case '翻译':
        if (!lowerContent.includes('语境') && !lowerContent.includes('context')) {
          improvements.push('建议提供更多语境信息以提高翻译准确性');
        }
        break;
      case '视频':
        if (!lowerContent.includes('时长') && !lowerContent.includes('duration')) {
          improvements.push('建议明确视频时长和节奏要求');
        }
        if (!lowerContent.includes('风格') && !lowerContent.includes('style')) {
          improvements.push('指定视频风格和视觉效果要求');
        }
        if (!lowerContent.includes('目标') && !lowerContent.includes('audience')) {
          improvements.push('明确目标观众和传播平台');
        }
        break;
      case '音乐':
        if (!lowerContent.includes('风格') && !lowerContent.includes('genre')) {
          improvements.push('建议指定音乐风格和流派');
        }
        if (!lowerContent.includes('时长') && !lowerContent.includes('duration')) {
          improvements.push('明确音乐时长和结构要求');
        }
        if (!lowerContent.includes('情感') && !lowerContent.includes('mood')) {
          improvements.push('描述期望的情感表达和氛围');
        }
        break;
      case 'TTS音频':
        if (!lowerContent.includes('语速') && !lowerContent.includes('speed')) {
          improvements.push('建议指定语速和停顿要求');
        }
        if (!lowerContent.includes('音色') && !lowerContent.includes('voice')) {
          improvements.push('明确音色和语调风格');
        }
        if (!lowerContent.includes('情感') && !lowerContent.includes('emotion')) {
          improvements.push('描述期望的情感表达方式');
        }
        break;
      case '图片':
        if (!lowerContent.includes('尺寸') && !lowerContent.includes('size')) {
          improvements.push('建议明确图片尺寸和分辨率要求');
        }
        if (!lowerContent.includes('风格') && !lowerContent.includes('style')) {
          improvements.push('指定图片风格和视觉效果');
        }
        if (!lowerContent.includes('用途') && !lowerContent.includes('purpose')) {
          improvements.push('明确图片用途和应用场景');
        }
        break;
      case '播客':
        if (!lowerContent.includes('时长') && !lowerContent.includes('duration')) {
          improvements.push('建议明确播客时长和节目结构');
        }
        if (!lowerContent.includes('受众') && !lowerContent.includes('audience')) {
          improvements.push('明确目标听众和内容定位');
        }
        if (!lowerContent.includes('风格') && !lowerContent.includes('style')) {
          improvements.push('指定播客风格和主持方式');
        }
        break;
    }
    
    // 基于标签的建议
    if (tags.includes('角色扮演')) {
      if (!lowerContent.includes('背景') && !lowerContent.includes('身份')) {
        improvements.push('丰富角色背景设定，增强角色扮演效果');
      }
    }
    
    if (tags.includes('创作')) {
      if (!lowerContent.includes('创意') && !lowerContent.includes('原创')) {
        improvements.push('强调创意性和原创性要求');
      }
    }
    
    // 通用改进建议
    if (!lowerContent.includes('输出') && !lowerContent.includes('格式')) {
      improvements.push('明确输出格式和结构要求');
    }
    
    // 确保至少有2-3个建议
    if (improvements.length === 0) {
      improvements.push('建议添加更多上下文信息以提高输出质量');
      improvements.push('考虑明确输出格式和期望结果');
    } else if (improvements.length === 1) {
      improvements.push('可以添加示例来指导AI更好地理解需求');
    }
    
    return improvements.slice(0, 5); // 最多返回5个建议
  }

  /**
   * 智能生成使用场景
   */
  private generateIntelligentUseCases(content: string, category: string, tags: string[]): string[] {
    const useCases: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // 基于分类的使用场景
    switch (category) {
      case '编程':
        useCases.push('代码开发与调试', '技术文档编写', '代码审查与优化');
        break;
      case '文案':
        useCases.push('营销文案创作', '品牌内容策划', '社交媒体运营');
        break;
      case '学术':
        useCases.push('学术研究辅助', '论文写作支持', '知识整理分析');
        break;
      case '翻译':
        useCases.push('多语言翻译', '文档本地化', '跨文化交流');
        break;
      case '设计':
        useCases.push('创意设计指导', '视觉方案策划', '用户体验优化');
        break;
      case '教育':
        useCases.push('教学内容设计', '学习辅导支持', '知识传授优化');
        break;
      case '商业':
        useCases.push('商业策略分析', '市场调研支持', '决策辅助工具');
        break;
      case '视频':
        useCases.push('短视频制作', '宣传片策划', '教学视频创作', '社交媒体内容', '品牌推广视频');
        break;
      case '音乐':
        useCases.push('原创音乐创作', '背景音乐制作', '广告配乐', '情感表达音乐', '主题歌创作');
        break;
      case 'TTS音频':
        useCases.push('有声读物制作', '语音导航系统', '教学音频', '广告配音', '播客内容');
        break;
      case '图片':
        useCases.push('海报设计', '社交媒体配图', '产品展示图', '插画创作', '品牌视觉设计');
        break;
      case '播客':
        useCases.push('知识分享节目', '访谈类节目', '故事播讲', '新闻解读', '专业领域讨论');
        break;
      default:
        useCases.push('通用AI对话', '内容生成辅助', '问题解决支持');
    }
    
    // 基于标签的额外场景
    if (tags.includes('角色扮演')) {
      useCases.push('情景模拟训练', '角色对话练习');
    }
    
    if (tags.includes('分析')) {
      useCases.push('数据分析解读', '趋势预测分析');
    }
    
    if (tags.includes('创作')) {
      useCases.push('创意内容生成', '灵感激发工具');
    }
    
    if (tags.includes('咨询')) {
      useCases.push('专业咨询服务', '解决方案提供');
    }
    
    // 基于内容特征的场景
    if (lowerContent.includes('步骤') || lowerContent.includes('流程')) {
      useCases.push('流程指导工具', '操作步骤生成');
    }
    
    if (lowerContent.includes('比较') || lowerContent.includes('对比')) {
      useCases.push('对比分析工具', '选择决策支持');
    }
    
    if (lowerContent.includes('总结') || lowerContent.includes('摘要')) {
      useCases.push('内容总结工具', '信息提炼助手');
    }
    
    // 去重并限制数量
    const uniqueUseCases = Array.from(new Set(useCases));
    return uniqueUseCases.slice(0, 5); // 最多返回5个使用场景
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
      '视频': ['视频制作专家', '影像创作师', '视觉导演', '多媒体制作师'],
      '音乐': ['音乐创作大师', '作曲家助手', '音频制作师', '旋律创作者'],
      'TTS音频': ['语音合成专家', '音频制作师', '配音导师', '声音设计师'],
      '图片': ['图像设计师', '视觉创作者', '插画师助手', '图形设计专家'],
      '播客': ['播客制作人', '节目策划师', '音频内容创作者', '主播助手'],
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
      '管理': ['管理', '规划', '组织', '协调', '优化', '策略'],
      '视频制作': ['视频', '剪辑', '制作', '拍摄', '后期', '特效', '蒙太奇'],
      '音乐创作': ['音乐', '歌曲', '旋律', '歌词', '编曲', '作曲', '乐谱'],
      '语音合成': ['语音', '音频', 'tts', '朗读', '播音', '配音', '声音'],
      '图像设计': ['图片', '图像', '照片', '绘画', '插画', '海报', '设计图'],
      '播客制作': ['播客', 'podcast', '电台', '广播', '节目', '主持']
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
      return '通用'; // 没有API密钥时返回默认分类
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
全部、通用、学术、职业、文案、设计、绘画、教育、情感、娱乐、游戏、生活、商业、办公、编程、翻译、视频、播客、音乐、健康、科技

请仔细理解提示词的实际功能，而不是被表面词汇误导。如果提示词中的某些词汇是比喻性使用，请根据实际功能进行分类。

只返回分类名称，不要其他内容。` 
            },
            { role: 'user', content: `请为以下提示词分类：\n\n${content}` }
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

      const result = response.data.choices[0].message.content.trim();
      
      // 验证返回的分类是否在预设列表中
      const validCategories = [
        '全部', '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
      ];
      
      if (validCategories.includes(result)) {
        return result;
      } else {
        return '通用'; // 如果AI返回的分类不在预设列表中，返回默认分类
      }

    } catch (error) {
      console.error('Quick classify failed:', error);
      return '通用'; // API调用失败时返回默认分类
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
      return this.extractTagsByKeywords(content); // 没有API密钥时使用基础关键词提取
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

返回格式：用逗号分隔的标签列表，如：分析,角色扮演,学术研究` 
            },
            { role: 'user', content: `请为以下提示词提取标签：\n\n${content}` }
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

      const result = response.data.choices[0].message.content.trim();
      const aiTags = result.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      
      // 与现有标签智能合并
      if (existingTags.length > 0) {
        return this.mergeTagsIntelligently(aiTags, existingTags);
      }
      
      return aiTags.slice(0, 8); // 最多返回8个标签

    } catch (error) {
      console.error('AI tag extraction failed:', error);
      return this.extractTagsByKeywords(content); // API调用失败时使用基础关键词提取
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