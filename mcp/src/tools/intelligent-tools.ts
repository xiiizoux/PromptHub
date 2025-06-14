/**
 * MCP智能工具集
 * 支持第三方客户端AI分析的智能提示词选择和存储功能
 */

import { MCPAIAnalyzer, MCPAIAnalysisResult } from '../ai/mcp-ai-analyzer.js';
import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt, StorageAdapter } from '../types.js';

// 存储适配器实例
const storage: StorageAdapter = StorageFactory.getStorage();
const aiAnalyzer = new MCPAIAnalyzer();

// 智能选择匹配分数接口
interface PromptMatchScore {
  prompt: Prompt;
  score: number;
  reasons: string[];
}

// 外部AI分析结果接口（用于接收第三方客户端的分析）
export interface ExternalAIAnalysis {
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  variables?: string[];
  compatibleModels?: string[];
  improvements?: string[];
  useCases?: string[];
  suggestedTitle?: string;
  description?: string;
  confidence?: number;
  version?: string;
}

/**
 * 智能提示词选择工具定义
 */
export const intelligentPromptSelectionTool: ToolDescription = {
  name: 'intelligent_prompt_selection',
  description: '基于用户需求和上下文智能推荐最合适的提示词。支持语义搜索、分类匹配、模型兼容性等多维度筛选。',
  schema_version: 'v1',
  parameters: {
    user_query: {
      type: 'string',
      description: '用户的需求描述，例如："我需要写一封商务邮件"',
      required: true,
    } as ToolParameter,
    context: {
      type: 'string',
      description: '使用场景上下文，例如："正式商务场合"、"学术论文"等',
      required: false,
    } as ToolParameter,
    preferred_category: {
      type: 'string',
      description: '偏好的分类，例如："商业"、"学术"、"编程"等',
      required: false,
    } as ToolParameter,
    preferred_models: {
      type: 'array',
      description: '用户偏好的AI模型列表，例如：["llm-large", "code-specialized"]',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
    difficulty_level: {
      type: 'string',
      description: '期望的难度级别：beginner、intermediate、advanced',
      required: false,
    } as ToolParameter,
    max_results: {
      type: 'number',
      description: '返回的最大结果数量，默认为5',
      required: false,
    } as ToolParameter,
    include_reasoning: {
      type: 'boolean',
      description: '是否包含推荐理由，默认为true',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 智能提示词存储工具定义（支持外部AI分析）
 */
export const intelligentPromptStorageTool: ToolDescription = {
  name: 'intelligent_prompt_storage',
  description: '智能分析并存储提示词到数据库。支持使用第三方客户端AI分析结果，也支持本地AI分析作为后备。',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string',
      description: '提示词内容',
      required: true,
    } as ToolParameter,
    external_analysis: {
      type: 'object',
      description: '第三方客户端提供的AI分析结果（可选）。如果提供，将优先使用此分析结果。',
      required: false,
    } as ToolParameter,
    user_provided_info: {
      type: 'object',
      description: '用户提供的额外信息，可以覆盖AI分析结果',
      required: false,
    } as ToolParameter,
    force_local_analysis: {
      type: 'boolean',
      description: '强制使用本地AI分析，忽略外部分析结果',
      required: false,
    } as ToolParameter,
    auto_enhance: {
      type: 'boolean',
      description: '是否启用AI自动增强和优化',
      required: false,
    } as ToolParameter,
    skip_duplicate_check: {
      type: 'boolean',
      description: '跳过重复内容检查，直接存储',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 外部AI分析工具定义
 */
export const externalAIAnalysisTool: ToolDescription = {
  name: 'analyze_prompt_with_external_ai',
  description: '使用第三方客户端的AI分析提示词。客户端可以调用此工具来获取分析指导，然后传递分析结果给其他工具。',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string',
      description: '要分析的提示词内容',
      required: true,
    } as ToolParameter,
    analysis_type: {
      type: 'string',
      description: '分析类型：full（完整分析）、quick（快速分析）、classify（仅分类）、tags（仅标签）',
      required: false,
    } as ToolParameter,
    existing_tags: {
      type: 'array',
      description: '系统中已存在的标签列表，用于标签合并参考',
      items: { type: 'string' },
      required: false,
    } as ToolParameter,
  },
};

/**
 * 处理智能提示词选择
 */
export async function handleIntelligentPromptSelection(params: any): Promise<MCPToolResponse> {
  try {
    const {
      user_query,
      context = '',
      preferred_category,
      preferred_models = [],
      difficulty_level,
      max_results = 5,
      include_reasoning = true
    } = params;

    console.log('[MCP智能选择] 处理选择请求:', { user_query, context, preferred_category });

    // 1. 基础搜索
    let candidates: Prompt[] = [];
    
    // 先尝试关键词搜索
    const searchResults = await storage.searchPrompts(user_query);
    candidates.push(...searchResults);

    // 如果指定了分类，添加分类相关的提示词
    if (preferred_category) {
      const categoryPrompts = await storage.getPromptsByCategory(preferred_category);
      candidates.push(...categoryPrompts);
    }

    // 如果候选结果太少，获取一些热门提示词
    if (candidates.length < max_results * 2) {
      const allPrompts = await storage.getPrompts({ sortBy: 'popular', pageSize: 20 });
      candidates.push(...allPrompts.data);
    }

    // 去重
    const uniqueCandidates = Array.from(new Map(candidates.map(p => [p.id || p.name, p])).values());

    // 2. 计算匹配分数
    const scoredPrompts: PromptMatchScore[] = uniqueCandidates.map(prompt => {
      const matchResult = calculatePromptMatchScore(prompt, {
        user_query,
        context,
        preferred_category,
        preferred_models,
        difficulty_level
      });
      return matchResult;
    });

    // 3. 排序并获取最佳匹配
    const bestMatches = scoredPrompts
      .sort((a, b) => b.score - a.score)
      .slice(0, max_results);

    // 4. 构建响应
    const recommendations = bestMatches.map(match => ({
      prompt: {
        name: match.prompt.name,
        description: match.prompt.description,
        category: match.prompt.category,
        tags: match.prompt.tags,
        messages: match.prompt.messages,
        version: match.prompt.version,
        difficulty: match.prompt.difficulty || 'intermediate',
        estimatedTokens: match.prompt.messages?.reduce((sum, msg) => 
          sum + (msg.content?.text?.length || 0), 0) / 4 || 0
      },
      matchScore: match.score,
      reasons: include_reasoning ? match.reasons : undefined
    }));

    const response = {
      success: true,
      query: user_query,
      context: context,
      totalCandidates: uniqueCandidates.length,
      recommendations,
      bestMatch: recommendations[0] || null,
      searchStrategy: {
        keywordSearch: searchResults.length,
        categoryFilter: preferred_category ? 'applied' : 'none',
        scoringFactors: ['semantic_similarity', 'category_match', 'model_compatibility', 'difficulty_match']
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP智能选择] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          fallback: '建议使用基础搜索功能：search_prompts'
        })
      }]
    };
  }
}

/**
 * 处理智能提示词存储
 */
export async function handleIntelligentPromptStorage(params: any): Promise<MCPToolResponse> {
  try {
    const {
      content,
      external_analysis,
      user_provided_info = {},
      force_local_analysis = false,
      auto_enhance = true,
      skip_duplicate_check = false
    } = params;

    console.log('[MCP智能存储] 处理存储请求:', { 
      contentLength: content.length, 
      hasExternalAnalysis: !!external_analysis,
      forceLocal: force_local_analysis 
    });

    // 1. 获取分析结果
    let analysisResult: MCPAIAnalysisResult;
    
    if (external_analysis && !force_local_analysis) {
      // 使用外部AI分析结果
      analysisResult = await processExternalAnalysis(external_analysis, content);
      console.log('[MCP智能存储] 使用外部AI分析结果');
    } else {
      // 使用本地AI分析
      const existingTags = await storage.getTags();
      analysisResult = await aiAnalyzer.analyzePrompt(
        content,
        { 
          includeImprovements: auto_enhance,
          includeSuggestions: auto_enhance,
          language: 'zh'
        },
        existingTags,
        undefined,
        true,
        []
      );
      console.log('[MCP智能存储] 使用本地AI分析');
    }

    // 2. 合并用户提供的信息
    const finalData = {
      ...analysisResult,
      ...user_provided_info,
      content: content
    };

    // 3. 检查重复内容（如果需要）
    if (!skip_duplicate_check) {
      const duplicateCheck = await checkForDuplicateContent(content, finalData);
      if (duplicateCheck.isDuplicate) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              isDuplicate: true,
              duplicateInfo: duplicateCheck,
              suggestion: '检测到相似内容，请确认是否要创建新版本或修改现有提示词'
            })
          }]
        };
      }
    }

    // 4. 创建提示词对象
    const promptData: Prompt = {
      name: finalData.suggestedTitle || `提示词_${Date.now()}`,
      description: finalData.description || '通过MCP智能分析创建',
      category: finalData.category,
      tags: finalData.tags,
      messages: convertContentToMessages(content),
      version: parseFloat(finalData.version) || 1.0,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 5. 存储到数据库
    const storedPrompt = await storage.createPrompt(promptData);

    // 6. 生成存储报告
    const report = {
      success: true,
      prompt: storedPrompt,
      analysis: {
        source: external_analysis ? 'external_ai' : 'local_ai',
        confidence: finalData.confidence,
        category: finalData.category,
        tags: finalData.tags,
        difficulty: finalData.difficulty,
        estimatedTokens: finalData.estimatedTokens,
        variables: finalData.variables,
        compatibleModels: finalData.compatibleModels
      },
      enhancements: auto_enhance ? {
        improvements: finalData.improvements,
        useCases: finalData.useCases
      } : undefined,
      metadata: {
        createdBy: 'mcp_intelligent_storage',
        analysisTimestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(report, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP智能存储] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          fallback: '请尝试使用基础创建功能：create_prompt',
          troubleshooting: [
            '检查提示词内容是否有效',
            '确认外部分析结果格式正确',
            '验证数据库连接状态'
          ]
        })
      }]
    };
  }
}

/**
 * 处理外部AI分析指导
 */
export async function handleExternalAIAnalysis(params: any): Promise<MCPToolResponse> {
  try {
    const {
      content,
      analysis_type = 'full',
      existing_tags = []
    } = params;

    // 获取系统中的标签和分类信息
    const systemTags = existing_tags.length > 0 ? existing_tags : await storage.getTags();
    const categories = await storage.getCategories();

    // 构建分析指导提示词
    const analysisPrompt = buildAnalysisPromptForExternalAI(content, analysis_type, systemTags, categories);

    const response = {
      success: true,
      analysisType: analysis_type,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      analysisPrompt: analysisPrompt,
      expectedFormat: getExpectedAnalysisFormat(analysis_type),
      systemContext: {
        availableCategories: categories,
        existingTags: systemTags.slice(0, 20), // 只返回前20个标签
        presetModels: [
          'llm-large', 'llm-medium', 'llm-small',
          'code-specialized', 'translation-specialized', 'reasoning-specialized',
          'multimodal-vision', 'image-generation', 'audio-generation'
        ]
      },
      instructions: [
        '1. 使用您的AI客户端运行上述analysisPrompt',
        '2. 将AI返回的分析结果传递给 intelligent_prompt_storage 工具的 external_analysis 参数',
        '3. 如需调整分析结果，可通过 user_provided_info 参数覆盖特定字段'
      ]
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('[MCP外部AI分析] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        })
      }]
    };
  }
}

/**
 * 计算提示词匹配分数
 */
function calculatePromptMatchScore(prompt: Prompt, criteria: any): PromptMatchScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. 语义相似度（40%权重）
  const semanticScore = calculateSemanticSimilarity(
    prompt.description + ' ' + prompt.tags?.join(' '), 
    criteria.user_query
  );
  score += semanticScore * 0.4;
  if (semanticScore > 0.7) reasons.push('内容高度相关');

  // 2. 分类匹配度（20%权重）
  if (criteria.preferred_category && prompt.category === criteria.preferred_category) {
    score += 0.2;
    reasons.push(`分类匹配: ${prompt.category}`);
  }

  // 3. 模型兼容性（20%权重）
  if (criteria.preferred_models?.length > 0 && prompt.compatible_models) {
    const compatibilityScore = calculateArrayOverlap(criteria.preferred_models, prompt.compatible_models);
    score += compatibilityScore * 0.2;
    if (compatibilityScore > 0.5) reasons.push('模型兼容性良好');
  }

  // 4. 难度匹配度（10%权重）
  if (criteria.difficulty_level && prompt.difficulty === criteria.difficulty_level) {
    score += 0.1;
    reasons.push(`难度匹配: ${prompt.difficulty}`);
  }

  // 5. 上下文匹配度（10%权重）
  if (criteria.context) {
    const contextScore = calculateSemanticSimilarity(prompt.description, criteria.context);
    score += contextScore * 0.1;
    if (contextScore > 0.6) reasons.push('使用场景匹配');
  }

  return { prompt, score, reasons };
}

/**
 * 简单的语义相似度计算
 */
function calculateSemanticSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

/**
 * 计算数组重叠度
 */
function calculateArrayOverlap(arr1: string[], arr2: string[]): number {
  if (!arr1?.length || !arr2?.length) return 0;
  
  const intersection = arr1.filter(item => arr2.includes(item));
  const union = [...new Set([...arr1, ...arr2])];
  
  return intersection.length / union.length;
}

/**
 * 处理外部AI分析结果
 */
async function processExternalAnalysis(externalAnalysis: ExternalAIAnalysis, content: string): Promise<MCPAIAnalysisResult> {
  // 提取变量
  const variables = extractVariables(content);
  
  // 估算token数
  const estimatedTokens = Math.ceil(content.length / 4);
  
  return {
    category: externalAnalysis.category || '通用',
    tags: externalAnalysis.tags || ['AI', '提示词'],
    suggestedTitle: externalAnalysis.suggestedTitle || content.substring(0, 30) + '...',
    description: externalAnalysis.description || '通过外部AI分析创建',
    difficulty: externalAnalysis.difficulty || 'intermediate',
    estimatedTokens: estimatedTokens,
    variables: externalAnalysis.variables || variables,
    improvements: externalAnalysis.improvements || [],
    useCases: externalAnalysis.useCases || [],
    compatibleModels: externalAnalysis.compatibleModels || ['llm-large'],
    version: externalAnalysis.version || '0.1',
    confidence: externalAnalysis.confidence || 0.8
  };
}

/**
 * 检查重复内容
 */
async function checkForDuplicateContent(content: string, analysisData: any) {
  try {
    // 搜索相似内容
    const searchResults = await storage.searchPrompts(content.substring(0, 100));
    
    for (const prompt of searchResults) {
      const similarity = calculateSemanticSimilarity(
        prompt.messages?.[0]?.content?.text || prompt.description,
        content
      );
      
      if (similarity > 0.8) {
        return {
          isDuplicate: true,
          similarPrompt: prompt,
          similarity: similarity,
          suggestion: `发现相似提示词："${prompt.name}"，相似度：${(similarity * 100).toFixed(1)}%`
        };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.warn('[重复检查] 检查失败:', error);
    return { isDuplicate: false };
  }
}

/**
 * 转换内容为消息格式
 */
function convertContentToMessages(content: string) {
  return [{
    role: 'system' as const,
    content: {
      type: 'text' as const,
      text: content
    }
  }];
}

/**
 * 提取变量
 */
function extractVariables(content: string): string[] {
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
 * 为外部AI构建分析提示词
 */
function buildAnalysisPromptForExternalAI(content: string, analysisType: string, systemTags: string[], categories: string[]): string {
  const basePrompt = `请分析以下提示词内容，并返回JSON格式的分析结果：

${content}

要求：`;

  switch (analysisType) {
    case 'full':
      return basePrompt + `
1. 分类（category）- 必须从以下选项中选择：${categories.join('、')}
2. 标签（tags）- 提取3-8个相关标签，优先使用：${systemTags.slice(0, 10).join('、')}
3. 难度级别（difficulty）- beginner/intermediate/advanced
4. 变量提取（variables）- 找出所有{{变量名}}格式的变量
5. 兼容模型（compatibleModels）- 从以下选择1-3个：llm-large, llm-medium, code-specialized, translation-specialized
6. 改进建议（improvements）- 3-5个具体建议
7. 使用场景（useCases）- 3-5个应用场景
8. 建议标题（suggestedTitle）- 简洁明确的标题
9. 描述（description）- 清晰的描述
10. 置信度（confidence）- 0-1之间的数值

返回JSON格式，包含所有字段。`;

    case 'quick':
      return basePrompt + `
快速分析，只需返回：
1. 分类（category）- 从以下选择：${categories.join('、')}
2. 标签（tags）- 3-5个相关标签
3. 难度（difficulty）- beginner/intermediate/advanced

返回JSON格式。`;

    case 'classify':
      return basePrompt + `
仅进行分类，从以下选项中选择最合适的一个：
${categories.join('、')}

返回JSON格式：{"category": "选择的分类"}`;

    case 'tags':
      return basePrompt + `
仅提取标签，提取3-6个相关标签。
优先使用现有标签：${systemTags.slice(0, 15).join('、')}

返回JSON格式：{"tags": ["标签1", "标签2", "标签3"]}`;

    default:
      return basePrompt + '请进行基础分析并返回JSON格式结果。';
  }
}

/**
 * 获取预期的分析格式
 */
function getExpectedAnalysisFormat(analysisType: string) {
  const formats = {
    full: {
      category: "string",
      tags: ["string"],
      difficulty: "beginner|intermediate|advanced",
      variables: ["string"],
      compatibleModels: ["string"],
      improvements: ["string"],
      useCases: ["string"],
      suggestedTitle: "string",
      description: "string",
      confidence: "number (0-1)"
    },
    quick: {
      category: "string",
      tags: ["string"],
      difficulty: "beginner|intermediate|advanced"
    },
    classify: {
      category: "string"
    },
    tags: {
      tags: ["string"]
    }
  };

  return formats[analysisType as keyof typeof formats] || formats.full;
}