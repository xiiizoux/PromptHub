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
    
    return `你是一个专业的AI提示词分析专家。请分析用户提供的提示词，并返回JSON格式的分析结果。${incrementalAnalysisHint}

分析要求：
1. 分类（category）- 必须从以下21个预设分类中选择最合适的一个，严格返回下列分类名称：
   选项：${categories.join('、')}
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
10. 标题建议（suggestedTitle）- 基于提示词的功能和目的，生成一个简洁明确的标题（10-30字）。不要直接复制提示词内容，而要总结其核心功能，如："智能客服回复助手"、"产品文案生成器"、"代码注释生成工具"等
11. 描述建议（description）- 生成简洁准确的描述（50-120字），突出核心功能和特点，避免过于技术性的语言，重点说明这个提示词能帮助用户解决什么问题` : ''}

重要提醒：
- 分类必须严格从上述21个预设分类中选择一个
- 兼容模型必须从上述预设模型选项中选择1-3个，返回ID数组格式
- 标签优先使用已有标签，只有在确实需要时才创建新标签${existingTagsHint}
- 不要返回版本号（version），版本由系统自动生成
- 请用${language}回复，返回有效的JSON格式，确保所有字段都存在。

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
    const suggestedTitle = this.generateFallbackTitle(content, category);

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
   * 生成后备标题（当AI不可用时）
   */
  private generateFallbackTitle(content: string, category: string): string {
    // 清理内容，移除多余空格和换行
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // 基于分类的标题模板
    const titleTemplates: { [key: string]: string[] } = {
      '编程': ['代码{功能}助手', '{功能}开发工具', '编程{功能}生成器'],
      '文案': ['{功能}文案生成器', '智能{功能}助手', '{功能}创作工具'],
      '翻译': ['{功能}翻译助手', '多语言{功能}工具', '{功能}语言转换器'],
      '创意写作': ['{功能}创作助手', '智能{功能}工具', '{功能}写作生成器'],
      '学术': ['{功能}学术助手', '学术{功能}工具', '{功能}研究助手'],
      '商业': ['{功能}商业助手', '企业{功能}工具', '{功能}分析助手'],
      '教育': ['{功能}教学助手', '教育{功能}工具', '{功能}学习助手'],
      '设计': ['{功能}设计助手', '创意{功能}工具', '{功能}设计生成器'],
    };

    // 提取关键功能词
    const keywords = this.extractKeywords(cleanContent);
    const mainKeyword = keywords[0] || '智能';

    // 获取分类对应的模板
    const templates = titleTemplates[category] || titleTemplates['通用'] || ['{功能}AI助手'];
    const template = templates[0]; // 使用第一个模板

    // 替换模板中的功能占位符
    let title = template.replace('{功能}', mainKeyword);

    // 确保标题长度合适
    if (title.length > 20) {
      title = mainKeyword + 'AI助手';
    }
    if (title.length < 5) {
      title = '智能AI助手';
    }

    return title;
  }

  /**
   * 从内容中提取关键词
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];
    
    // 常见功能关键词
    const functionKeywords = [
      '写作', '翻译', '编程', '代码', '分析', '总结', '创作', '生成', '优化', '润色',
      '回复', '客服', '营销', '文案', '邮件', '报告', '简历', '方案', '策划', '设计',
      '教学', '学习', '培训', '答疑', '解释', '指导', '建议', '推荐', '评估', '审核'
    ];

    // 查找内容中的功能关键词
    for (const keyword of functionKeywords) {
      if (content.includes(keyword)) {
        keywords.push(keyword);
        if (keywords.length >= 3) break; // 最多提取3个关键词
      }
    }

    // 如果没有找到功能关键词，尝试从句子结构中提取
    if (keywords.length === 0) {
      const sentences = content.split(/[。！？.!?]/);
      for (const sentence of sentences) {
        if (sentence.length > 10 && sentence.length < 50) {
          // 提取动词
          const verbs = sentence.match(/[\u4e00-\u9fa5]{2,4}(助手|工具|器|生成|创建|编写|制作)/g);
          if (verbs && verbs.length > 0) {
            keywords.push(verbs[0].replace(/(助手|工具|器|生成|创建|编写|制作)$/, ''));
            break;
          }
        }
      }
    }

    return keywords.length > 0 ? keywords : ['智能'];
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