/**
 * AI智能提示词分析服务
 * 使用ChatGPT API实现自动分类、标签提取、版本号建议等功能
 */

import axios from 'axios';
import { MODEL_TAGS } from '@/constants/ai-models';
import { categoryService } from '@/services/categoryService';

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
      hasApiKey: !!this.apiKey,
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
    existingVersions: string[] = [],
  ): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('AI分析服务未配置API密钥，请联系管理员配置');
    }

    const finalConfig: AnalysisConfig = {
      includeImprovements: true,
      includeSuggestions: true,
      language: 'zh',
      strictMode: false,
      ...config,
    };

    try {
      const systemPrompt = await this.buildSystemPrompt(finalConfig, existingTags);
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.fullAnalysisModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: this.buildUserPrompt(content, finalConfig) },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
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
  private async buildSystemPrompt(config: AnalysisConfig, existingTags: string[] = []): Promise<string> {
      const language = config.language === 'zh' ? '中文' : 'English';

      // 动态获取分类列表
      let categories: string[] = [];
      try {
        const categoryInfos = await categoryService.getCategories('chat');
        categories = categoryInfos.map(cat => cat.name);

        if (categories.length === 0) {
          throw new Error('API返回空分类列表');
        }
      } catch (error) {
        console.error('获取分类失败，无法进行分析', error);
        throw new Error('分类服务不可用，请稍后重试');
      }
      
      // 预设的兼容模型选项（从MODEL_TAGS中获取）
      const compatibleModelOptions = MODEL_TAGS.map(tag => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        type: tag.type,
      }));
      
      // 构建模型选项字符串
      const modelOptionsText = compatibleModelOptions.map(model => 
        `${model.id}(${model.name})`,
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
  
  请根据提供的提示词内容，深入理解其核心功能和用途，然后生成以下分析结果：
  
  ### 1. 分类（category）
  请根据提示词的主要功能和用途，从以下分类中选择最合适的一个：
  ${categories.join('、')}
  
  **分类原则**：
  - 优先考虑提示词的核心功能领域，而非表面词汇
  - 如果提示词涉及多个领域，选择最主要的功能领域
  - 避免被提示词中的比喻性或示例性词汇误导
  - 考虑实际使用场景和目标用户群体
  
  ### 2. 兼容模型（compatibleModels）
  请根据提示词的复杂度和能力需求，从以下模型中选择1-3个最适合的：
  ${modelOptionsText}
  
  **选择原则**：
  - 简单文本生成：优选中等规模模型
  - 复杂推理任务：需要大规模或推理专用模型
  - 代码相关任务：优先选择代码专用模型
  - 图像/视频内容：必须包含相应模型
  - 专业领域：考虑领域专用模型
  
  返回格式：模型ID数组，如 ["llm-large", "reasoning-specialized"]
  
  ### 3. 标签（tags）
  请提供4-8个能够准确描述提示词特征的标签，包括：
  - 功能类型（如：分析、创作、翻译、编程等）
  - 应用场景（如：办公、学习、研究等）
  - 特色功能（如：角色扮演、深度分析等）
  - 技能水平（如：初学者、高级等）
  - 输出特征（如：长文本、结构化输出等）
  
  **标签原则**：
  - 标签要具有描述性和搜索价值
  - 避免过于宽泛的标签（如"AI"、"助手"）
  - 优先使用用户常用的搜索关键词
  - 保持标签的一致性和规范性
  
  ### 4. 其他字段
  - 难度级别（difficulty）：beginner/intermediate/advanced
    - beginner：简单指令，直接输出
    - intermediate：需要一定理解和转换
    - advanced：复杂推理、多步骤或专业知识
  - 变量提取（variables）：找出所有{{变量名}}格式的变量
  - 预估token数（estimatedTokens）：预估处理所需token数量
  - 置信度（confidence）：分析结果的置信度（0-1）
  
  ${config.includeSuggestions ? `
  ### 5. 建议内容
  - **标题建议（suggestedTitle）**：请根据提示词的核心价值生成一个准确、吸引人的标题（10-25字）
    - 突出核心功能和价值
    - 使用用户易懂的词汇
    - 避免过于技术性的表述
  - **描述建议（description）**：请概括提示词的核心能力和价值（60-150字），说明它能帮助用户解决什么问题
    - 明确说明主要功能
    - 突出独特价值和优势
    - 描述适用场景和用户群体
  - **使用场景（useCases）**：请列出3-5个典型的应用场景
    - 具体而非抽象的场景描述
    - 涵盖不同的使用情况
    - 体现提示词的实用价值` : ''}
  
  ${config.includeImprovements ? `
  - **改进建议（improvements）**：请提供3-5个具体的优化建议，帮助提升提示词的效果
    - 结构优化建议
    - 表达清晰度改进
    - 功能扩展建议
    - 适用性提升方案` : ''}
  
  ${existingTagsHint}
  
  ## 分析要求
  - 请仔细理解提示词的实际功能，而不是被表面词汇误导
  - 如果提示词中的某些词汇是比喻性使用，请根据实际功能进行分类
  - 分析时要考虑提示词的完整性和实用性
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
  \`\`\`
  
  内容特征：
  - 长度：${content.length}字符
  - 复杂度：${this.assessComplexity(content)}
  - 包含变量：${this.extractVariables(content).length > 0 ? '是' : '否'}`;
  
      // 如果是增量分析，提供原始内容比较
      if (config.incrementalAnalysis && config.originalContent) {
        const changes = this.analyzeContentChanges(config.originalContent, content);
        prompt += `
  
  【原始内容】（用于比较分析）：
  \`\`\`
  ${config.originalContent}
  \`\`\`
  
  变化分析：
  - 内容变化程度：${changes.changeLevel}
  - 主要变化类型：${changes.changeType}
  - 核心功能是否改变：${changes.functionChanged ? '是' : '否'}
  - 建议版本增量：${changes.suggestedIncrement}
  
  请比较新旧内容，评估变化程度，并根据变化程度决定是否需要更新分类、标签、兼容模型等参数。
  特别注意：如果核心功能没有根本性改变，请保持原有分类不变。`;
      }
  
      prompt += `
  
  请返回JSON格式的分析结果，包含所有必需字段。确保JSON格式正确且可解析。
  
  分析重点：
  1. 深入理解提示词的实际用途和核心价值
  2. 根据功能本质而非表面词汇进行分类
  3. 选择最匹配的兼容模型
  4. 提取具有搜索价值的标签
  5. 生成吸引人且准确的标题和描述`;
  
      return prompt;
    }
  
    /**
     * 评估提示词复杂度
     */
    private assessComplexity(content: string): string {
      const length = content.length;
      const complexWords = ['分析', '详细', '步骤', '系统', '深入', 'analysis', 'detailed', 'step', 'comprehensive'];
      const hasComplexWords = complexWords.some(word => content.toLowerCase().includes(word));
      const hasVariables = this.extractVariables(content).length > 0;
      const hasMultipleRequests = content.split(/[。！？\n]/).filter(s => s.trim()).length > 3;
      
      if (length > 300 || (hasComplexWords && hasMultipleRequests) || hasVariables) {
        return '高';
      } else if (length > 100 || hasComplexWords || hasMultipleRequests) {
        return '中';
      } else {
        return '低';
      }
    }
  
    /**
     * 分析内容变化
     */
    private analyzeContentChanges(originalContent: string, newContent: string): {
      changeLevel: string;
      changeType: string;
      functionChanged: boolean;
      suggestedIncrement: string;
    } {
      // 计算内容相似度
      const similarity = this.calculateSimilarity(originalContent, newContent);
      const lengthChange = Math.abs(newContent.length - originalContent.length) / originalContent.length;
      
      let changeLevel: string;
      let suggestedIncrement: string;
      
      if (similarity > 0.8 && lengthChange < 0.2) {
        changeLevel = '轻微';
        suggestedIncrement = '+0.1';
      } else if (similarity > 0.5 && lengthChange < 0.5) {
        changeLevel = '中等';
        suggestedIncrement = '+0.5';
      } else {
        changeLevel = '重大';
        suggestedIncrement = '+1.0';
      }
      
      // 判断变化类型
      let changeType = '内容修改';
      if (lengthChange > 0.3) {
        changeType = newContent.length > originalContent.length ? '内容扩展' : '内容简化';
      } else if (similarity < 0.6) {
        changeType = '结构重组';
      }
      
      // 判断核心功能是否改变（基于关键词分析）
      const originalCategory = this.classifyByKeywords(originalContent);
      const newCategory = this.classifyByKeywords(newContent);
      const functionChanged = originalCategory !== newCategory && newCategory !== '通用';
      
      return {
        changeLevel,
        changeType,
        functionChanged,
        suggestedIncrement,
      };
    }
  
    /**
     * 计算两个文本的相似度
     */
    private calculateSimilarity(text1: string, text2: string): number {
      // 简单的基于单词重叠的相似度计算
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      
      const intersection = new Set([...words1].filter(word => words2.has(word)));
      const union = new Set([...words1, ...words2]);
      
      return intersection.size / union.size;
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
        validModelIds.includes(model),
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
      description: result.description || '',
    };

    console.log('✅ 最终验证结果:', {
      version: validated.version,
      compatibleModels: validated.compatibleModels,
      category: validated.category,
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
      
      // 基于分类关键词的智能推荐
      const getRecommendationsByKeywords = (category: string): string[] => {
        const lowerCategory = category.toLowerCase();

        if (lowerCategory.includes('编程') || lowerCategory.includes('代码') || lowerCategory.includes('开发')) {
          return ['code-specialized', 'llm-large'];
        }
        if (lowerCategory.includes('文案') || lowerCategory.includes('写作') || lowerCategory.includes('创作')) {
          return ['llm-large', 'llm-medium'];
        }
        if (lowerCategory.includes('翻译') || lowerCategory.includes('语言')) {
          return ['translation-specialized', 'llm-large'];
        }
        if (lowerCategory.includes('设计') || lowerCategory.includes('绘画') || lowerCategory.includes('图像')) {
          return ['image-generation'];
        }
        if (lowerCategory.includes('视频') || lowerCategory.includes('影像')) {
          return ['video-generation'];
        }
        if (lowerCategory.includes('播客') || lowerCategory.includes('音乐') || lowerCategory.includes('音频')) {
          return ['audio-generation', 'audio-tts'];
        }
        if (lowerCategory.includes('学术') || lowerCategory.includes('研究') || lowerCategory.includes('科研')) {
          return ['llm-large', 'reasoning-specialized'];
        }
        if (lowerCategory.includes('商业') || lowerCategory.includes('管理') || lowerCategory.includes('营销')) {
          return ['llm-large', 'llm-medium'];
        }

        // 默认推荐
        return ['llm-medium', 'llm-large'];
      };

      // 获取基础推荐
      const baseRecommendations = getRecommendationsByKeywords(category);
      recommendations.push(...baseRecommendations);
      
      // 基于内容特征的智能推荐
      const lowerContent = content.toLowerCase();
      const contentFeatures = {
        // 图像相关关键词（更全面）
        image: ['图片', '图像', '画', '设计', '绘制', '视觉', '图表', '插画', '海报', '封面', 'image', 'draw', 'design', 'visual'],
        // 音频相关关键词
        audio: ['音频', '语音', '音乐', '声音', '录音', '播客', '配音', 'audio', 'voice', 'music', 'sound'],
        // 视频相关关键词  
        video: ['视频', '动画', '影片', '短片', '录制', 'video', 'animation', 'film'],
        // 代码相关关键词（更精确）
        code: ['代码', '编程', '函数', '算法', '脚本', '开发', 'code', 'program', 'function', 'script', 'development', 'python', 'javascript', 'java', 'c++'],
        // 推理相关关键词
        reasoning: ['推理', '逻辑', '数学', '计算', '分析', '证明', '推导', 'reasoning', 'logic', 'math', 'analysis', 'proof'],
        // 长文本相关关键词
        longText: ['长文', '文章', '报告', '论文', '详细', '深入', 'long text', 'article', 'detailed', 'comprehensive'],
        // 创意相关关键词
        creative: ['创意', '创作', '创新', '想象', '原创', 'creative', 'original', 'innovative', 'imagination'],
        // 翻译相关关键词
        translation: ['翻译', '转换', '语言', '中文', '英文', 'translate', 'translation', 'language', 'chinese', 'english'],
      };
      
      // 计算内容特征权重
      const featureScores: { [key: string]: number } = {};
      Object.entries(contentFeatures).forEach(([feature, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
          // 完全匹配得2分，包含匹配得1分
          if (lowerContent === keyword) score += 2;
          else if (lowerContent.includes(keyword)) score += 1;
        });
        featureScores[feature] = score;
      });
      
      // 根据特征分数进行智能推荐
      if (featureScores.image > 0) {
        if (!recommendations.includes('image-generation')) {
          recommendations.push('image-generation');
        }
        if (featureScores.image > 2 && !recommendations.includes('image-generation')) {
          recommendations.push('image-generation');
        }
      }
      
      if (featureScores.audio > 0) {
        if (!recommendations.includes('audio-generation')) {
          recommendations.push('audio-generation');
        }
        if (featureScores.audio > 1 && !recommendations.includes('audio-tts')) {
          recommendations.push('audio-tts');
        }
      }
      
      if (featureScores.video > 0) {
        if (!recommendations.includes('video-generation')) {
          recommendations.push('video-generation');
        }
        if (!recommendations.includes('video-generation')) {
          recommendations.push('video-generation');
        }
      }
      
      if (featureScores.code > 0) {
        if (!recommendations.includes('code-specialized')) {
          recommendations.unshift('code-specialized'); // 代码任务优先推荐代码模型
        }
      }
      
      if (featureScores.reasoning > 2) {
        if (!recommendations.includes('reasoning-specialized')) {
          recommendations.push('reasoning-specialized');
        }
      }
      
      if (featureScores.image > 0 || featureScores.video > 0) {
        if (featureScores.image > 0 && !recommendations.includes('image-generation')) {
          recommendations.push('image-generation');
        }
        if (featureScores.video > 0 && !recommendations.includes('video-generation')) {
          recommendations.push('video-generation');
        }
      }
      
      if (featureScores.translation > 1) {
        if (!recommendations.includes('translation-specialized')) {
          recommendations.unshift('translation-specialized'); // 翻译任务优先推荐翻译模型
        }
      }
      
      // 基于内容长度和复杂度调整模型选择
      const contentLength = content.length;
      const complexityIndicators = ['步骤', '详细', '分析', 'step', 'detailed', 'analysis'];
      const isComplex = complexityIndicators.some(indicator => lowerContent.includes(indicator));
      
      if (contentLength > 500 || isComplex) {
        // 复杂任务优先推荐大模型
        if (recommendations.includes('llm-medium')) {
          const index = recommendations.indexOf('llm-medium');
          recommendations.splice(index, 1);
          recommendations.unshift('llm-large');
        }
        if (!recommendations.includes('llm-large')) {
          recommendations.unshift('llm-large');
        }
      } else if (contentLength < 100 && !isComplex) {
        // 简单任务可以使用中等模型
        if (!recommendations.includes('llm-medium') && recommendations.includes('llm-large')) {
          recommendations.push('llm-medium');
        }
      }
      
      // 过滤掉不在预设模型列表中的推荐
      const validRecommendations = recommendations.filter(model => availableModels.includes(model));
      
      // 确保至少有一个推荐，如果没有有效推荐则使用默认模型
      if (validRecommendations.length === 0) {
        validRecommendations.push('llm-large');
      }
      
      // 限制推荐数量并去重，优先保留前面的推荐
      const uniqueRecommendations = Array.from(new Set(validRecommendations));
      
      // 根据任务类型限制推荐数量
      const maxRecommendations = featureScores.image > 0 || featureScores.video > 0 || featureScores.audio > 0 ? 3 : 2;
      
      return uniqueRecommendations.slice(0, maxRecommendations);
    }




  /**
   * 提取变量（正则表达式方法）
   */
  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    const uniqueVariables = new Set(
      matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
    );
    return Array.from(uniqueVariables).filter(variable => variable.length > 0);
  }

  /**
   * 基于关键词提取标签
   */
  private extractTagsByKeywords(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const tags: string[] = [];

    // 基于关键词动态生成功能标签
    const generateFunctionTags = (content: string): string[] => {
      const lowerContent = content.toLowerCase();
      const detectedTags: string[] = [];

      // 功能类关键词检测规则
      const functionRules = [
        { keywords: ['分析', '解析', '研究', '调查', '评估', '检测'], tag: '分析' },
        { keywords: ['创作', '写作', '生成', '创建', '制作', '编写'], tag: '创作' },
        { keywords: ['翻译', '转换', '语言', '英文', '中文', '多语言'], tag: '翻译' },
        { keywords: ['编程', '代码', '开发', '函数', '算法', 'javascript', 'python'], tag: '编程' },
        { keywords: ['设计', '界面', '视觉', '布局', 'ui', 'ux', '美术'], tag: '设计' },
        { keywords: ['教学', '培训', '指导', '辅导', '学习', '课程'], tag: '教学' },
        { keywords: ['咨询', '建议', '推荐', '指导', '解答', '帮助'], tag: '咨询' },
        { keywords: ['管理', '规划', '组织', '协调', '优化', '策略'], tag: '管理' },
        { keywords: ['视频', '剪辑', '制作', '拍摄', '后期', '特效', '蒙太奇'], tag: '视频制作' },
        { keywords: ['音乐', '歌曲', '旋律', '歌词', '编曲', '作曲', '乐谱'], tag: '音乐创作' },
        { keywords: ['语音', '音频', 'tts', '朗读', '播音', '配音', '声音'], tag: '语音合成' },
        { keywords: ['图片', '图像', '照片', '绘画', '插画', '海报', '设计图'], tag: '图像设计' },
        { keywords: ['播客', 'podcast', '电台', '广播', '节目', '主持'], tag: '播客制作' },
      ];

      functionRules.forEach(rule => {
        if (rule.keywords.some(keyword => lowerContent.includes(keyword))) {
          detectedTags.push(rule.tag);
        }
      });

      return detectedTags;
    };

    const functionTags = generateFunctionTags(lowerContent);

    // 思维方式标签检测
    const thinkingTags = {
      '系统思维': ['系统', '整体', '结构', '框架', '体系', '全局'],
      '模式识别': ['模式', '规律', '趋势', '特征', '相似', '重复'],
      '逻辑推理': ['逻辑', '推理', '推断', '演绎', '归纳', '因果'],
      '创意思维': ['创意', '创新', '想象', '灵感', '突破', '原创'],
      '批判思维': ['批判', '质疑', '评价', '判断', '辨析', '反思'],
      '深度洞察': ['洞察', '觉察', '感知', '理解', '领悟', '透视'],
    };

    // 角色类标签检测
    const roleTags = {
      '角色扮演': ['你是', '你的身份', '你拥有', '扮演', '角色', '身份'],
      '专家': ['专家', '权威', '资深', '专业人士', '大师'],
      '顾问': ['顾问', '咨询师', '建议者', '指导者'],
      '助手': ['助手', '助理', '帮手', '支持者'],
      '导师': ['导师', '老师', '教练', '引路人'],
      '分析师': ['分析师', '研究员', '调研员', '评估师'],
    };

    // 应用场景标签检测
    const scenarioTags = {
      '研究': ['研究', '学术', '论文', '实验', '调研'],
      '办公': ['办公', '工作', '职场', '商务', '企业'],
      '创作': ['创作', '写作', '文学', '艺术', '内容'],
      '学习': ['学习', '教育', '培训', '知识', '技能'],
      '咨询': ['咨询', '服务', '客户', '解决方案'],
      '娱乐': ['娱乐', '游戏', '趣味', '休闲', '放松'],
    };

    // 特色标签检测
    const featureTags = {
      '深度分析': ['深度', '深入', '详细', '全面', '透彻'],
      '个性化': ['个性化', '定制', '专属', '量身', '针对性'],
      '结构化': ['结构化', '有序', '条理', '系统性', '规范'],
      '互动式': ['互动', '对话', '交流', '沟通', '问答'],
      '创意输出': ['创意', '新颖', '独特', '原创', '突破性'],
    };

    // 检测各类标签
    const allTagCategories = [functionTags, thinkingTags, roleTags, scenarioTags, featureTags];

    for (const tagCategory of allTagCategories) {
      for (const [tag, keywords] of Object.entries(tagCategory)) {
        if ((keywords as string[]).some((keyword: string) => lowerContent.includes(keyword))) {
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
   * 基于关键词的本地分类算法（已废弃 - 使用数据库动态分类）
   */
  private classifyByKeywords(_content: string): string {
    // 此函数已废弃，不再使用硬编码分类
    // 所有分类应通过数据库动态获取
    console.warn('classifyByKeywords函数已废弃，请使用数据库动态分类');
    return '通用对话'; // 返回默认分类
  }



  /**
   * 快速分类（仅返回分类，不调用完整API）
   */
  async quickClassify(content: string): Promise<string> {
      if (!this.apiKey) {
        // 没有API密钥时使用本地智能分类算法
        return this.classifyByKeywords(content);
      }

      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: this.quickTasksModel,
            messages: [
              {
                role: 'system',
                content: `你是一个专业的AI提示词分类专家。请根据提示词内容，从以下分类中选择最合适的一个：

  通用、学术、职业、文案、设计、绘画、教育、情感、娱乐、游戏、生活、商业、办公、编程、翻译、视频、播客、音乐、健康、科技

  分类原则：
  1. 优先考虑提示词的核心功能领域，而非表面词汇
  2. 仔细理解提示词的实际功能，避免被比喻性或示例性词汇误导
  3. 如果涉及多个领域，选择最主要的功能领域
  4. 考虑实际使用场景和目标用户群体

  示例：
  - "请帮我写一个健康管理的应用程序" → 编程（因为核心任务是编程开发）
  - "分析这个商业计划的可行性" → 商业（核心功能是商业分析）
  - "设计一个健康主题的海报" → 设计（核心功能是设计工作）

  只返回分类名称，不要其他内容。`,
              },
              { role: 'user', content: `请为以下提示词分类：\n\n${content}` },
            ],
            temperature: 0.1,
            max_tokens: 50,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const result = response.data.choices[0].message.content.trim();

        // 验证返回的分类是否在有效列表中
        let validCategories: string[] = [];
        try {
          const categoryInfos = await categoryService.getCategories('chat');
          validCategories = categoryInfos.map(cat => cat.name);

          if (validCategories.length === 0) {
            throw new Error('无法获取有效分类列表');
          }
        } catch (error) {
          console.error('获取分类验证列表失败', error);
          // 如果无法获取分类列表，跳过分类验证
          validCategories = [];
        }

        // 如果有有效分类列表，进行验证
        if (validCategories.length > 0) {
          if (validCategories.includes(result)) {
            return result;
          } else {
            console.warn(`AI返回了无效分类: ${result}，使用本地分类算法`);
            return this.classifyByKeywords(content);
          }
        } else {
          // 如果无法获取分类列表，直接返回AI的结果
          console.warn('无法验证分类有效性，直接使用AI返回结果');
          return result;
        }

      } catch (error) {
        console.error('Quick classify failed:', error);
        // API调用失败时使用本地分类算法
        return this.classifyByKeywords(content);
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
      '自动化': ['automation', '自动'],
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
          matrix[j - 1][i - 1] + indicator,  // substitution
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
                content: `你是一个专业的AI提示词标签提取专家。请为提示词提取4-8个准确的标签，标签应该体现提示词的核心特征。
  
  请提取以下类型的标签：
  - 功能类型（如：分析、创作、翻译、编程等）
  - 应用场景（如：办公、学习、研究等）
  - 特色功能（如：角色扮演、深度分析等）
  - 技能水平（如：初学者、高级等）
  - 输出特征（如：长文本、结构化输出等）
  
  标签要求：
  1. 仔细理解提示词的实际功能，而不是被表面词汇误导
  2. 标签要具有描述性和搜索价值
  3. 避免过于宽泛的标签（如"AI"、"助手"）
  4. 优先使用用户常用的搜索关键词
  5. 保持标签的一致性和规范性
  
  示例好标签：
  - 功能明确：数据分析、代码生成、文本润色
  - 场景具体：学术写作、商业策划、日常办公
  - 特征突出：步骤指导、创意激发、问题解决
  
  返回格式：用逗号分隔的标签列表，如：分析,角色扮演,学术研究,深度思考`, 
              },
              { role: 'user', content: `请为以下提示词提取标签：\n\n${content}` },
            ],
            temperature: 0.3,
            max_tokens: 100,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
  
        const result = response.data.choices[0].message.content.trim();
        const aiTags = result.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        
        // 验证和清理AI返回的标签
        const validTags = aiTags.filter((tag: string) => 
          tag.length > 0 && 
          tag.length < 20 && 
          !['AI', '助手', '工具'].includes(tag), // 过滤过于宽泛的标签
        ).slice(0, 8);
        
        // 与现有标签智能合并
        if (existingTags.length > 0) {
          return this.mergeTagsIntelligently(validTags, existingTags);
        }
        
        // 如果AI返回的标签质量不高，补充关键词标签
        if (validTags.length < 3) {
          const keywordTags = this.extractTagsByKeywords(content);
          const combinedTags = [...validTags, ...keywordTags];
          return Array.from(new Set(combinedTags)).slice(0, 8);
        }
        
        return validTags;
  
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

    // 如果没有当前版本信息，默认为1.0
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
      content.toLowerCase().includes(keyword.toLowerCase()),
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
          error: 'API密钥未配置',
        };
      }

      // 发送一个简单的请求来测试连接
      await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.quickTasksModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10秒超时
        },
      );

      return {
        isHealthy: true,
        endpoint: this.baseURL,
        models: { full: this.fullAnalysisModel, quick: this.quickTasksModel },
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        endpoint: this.baseURL,
        models: { full: this.fullAnalysisModel, quick: this.quickTasksModel },
        error: error.message || '连接失败',
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
        quickTasks: this.quickTasksModel,
      },
      hasApiKey: !!this.apiKey,
      isCustomEndpoint: this.baseURL !== 'https://api.openai.com/v1',
    };
  }
}

// 创建单例实例
export const aiAnalyzer = new AIAnalyzer();

// 导出类型
export default AIAnalyzer; 