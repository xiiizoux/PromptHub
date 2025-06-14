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

    const systemPrompt = this.buildAnalysisSystemPrompt();
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
   * 构建分析系统提示词
   */
  private buildAnalysisSystemPrompt(): string {
    return `你是一个专业的AI提示词分析专家，擅长深度理解和分析各种类型的提示词内容。请仔细分析用户提供的提示词，并返回JSON格式的分析结果。

## 分析方法论
在进行分析时，请遵循以下步骤：
1. **核心功能识别**：这个提示词的主要目的是什么？它要解决什么问题？
2. **使用场景判断**：用户在什么情况下会使用这个提示词？
3. **能力层次评估**：这个提示词展现了什么样的AI能力需求？
4. **风格特征识别**：是技术性的、创意性的、还是哲学性的？

## 具体分析要求

### 1. 分类（category）
必须从以下预设分类中选择最合适的一个：
通用、编程、文案、设计、绘画、教育、学术、职业、商业、办公、翻译、视频、播客、音乐、健康、科技、生活、娱乐、游戏、情感、创意写作

**分类判断准则**：
- 不要被表面词汇误导，要理解内容的本质功能
- 如果提示词包含角色设定+思维方法，通常属于"学术"或"通用"
- 如果包含创作指导，属于"文案"或"创意写作"
- 如果包含代码或技术内容，属于"编程"
- 如果只是比喻性地提到某个领域（如音乐、绘画），不代表属于该分类

### 2. 标签（tags）
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

### 3. 其他字段
- 难度级别（difficulty）：beginner/intermediate/advanced
- 变量提取（variables）：找出所有{{变量名}}格式的变量
- 预估token数（estimatedTokens）：预估处理所需token数量
- 置信度（confidence）：分析结果的置信度（0-1）
- 建议标题（suggestedTitle）：基于提示词的核心价值生成准确标题（10-25字）
- 建议描述（description）：概括核心能力和价值（60-150字）
- 使用场景（useCases）：列出3-5个典型应用场景
- 改进建议（improvements）：提供3-5个优化建议

## 重要提醒
- **深度理解胜过表面分析**：不要被某个词汇误导，要理解整体意图
- **功能导向分类**：按照提示词的实际功能分类，而非表面主题
- **准确性第一**：宁可保守也不要过度解读
- 请用中文回复，返回有效的JSON格式

## 返回格式示例
{
  "category": "学术",
  "tags": ["模式识别", "系统思维", "角色扮演", "分析", "洞察", "哲学思考"],
  "difficulty": "advanced",
  "variables": [],
  "estimatedTokens": 300,
  "confidence": 0.92,
  "suggestedTitle": "跨域模式识别思维专家",
  "description": "具有深度洞察能力的AI角色，专门用于发现复杂系统中的隐藏模式和规律。通过独特的觉察视角，帮助用户在看似无关的事物间建立联系，识别递归结构和韵律节奏，从而获得更高层次的系统性理解。",
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

    // 智能生成标题
    const suggestedTitle = this.generateIntelligentTitle(content, category);

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
      suggestedTitle: suggestedTitle,
      description: '基于内容特征的自动分析结果'
    };
  }

  /**
   * 智能生成标题（当AI不可用时）
   */
  private generateIntelligentTitle(content: string, category: string): string {
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
    const templates = titleTemplates[category] || ['{功能}AI助手'];
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
        version = `${major}.${parseFloat(minor) + (counter * 0.1)}`;
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