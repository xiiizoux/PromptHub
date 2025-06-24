/**
 * 统一存储工具
 * 
 * 智能分析用户提示词内容，自动补全所有参数并存储到数据库
 * - AI智能分析：自动分析分类、标题、描述、标签、兼容模型等
 * - 用户优先：优先使用用户明确指定的参数
 * - 自然语言：支持自然语言指令解析
 * - 统一入口：一个工具满足所有存储需求
 */

import { BaseMCPTool } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter } from '../../types.js';

// 定义本地类型接口
interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
}

interface ToolContext {
  userId?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
}

/**
 * AI分析结果接口
 */
interface AIAnalysisResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
  compatible_models: string[];
  difficulty: 'simple' | 'medium' | 'complex';
  domain: string;
  use_cases: string[];
  confidence: number;
}

/**
 * 用户指定参数接口
 */
interface UserSpecifiedParams {
  title?: string;
  category?: string;
  description?: string;
  tags?: string[];
  difficulty?: string;
  is_public?: boolean;
  allow_collaboration?: boolean;
  collaborative_level?: 'creator_only' | 'invite_only' | 'public_edit';
}

/**
 * 指令解析结果接口
 */
interface InstructionParseResult {
  action: 'save' | 'store' | 'create';
  specified_params: UserSpecifiedParams;
  analysis_hints: string[];
}

/**
 * 统一存储参数
 */
interface UnifiedStoreParams {
  content: string;
  instruction?: string;
  
  // 用户可直接指定的参数
  title?: string;
  category?: string;
  description?: string;
  tags?: string[];
  difficulty?: string;
  is_public?: boolean;
  allow_collaboration?: boolean;
  collaborative_level?: 'creator_only' | 'invite_only' | 'public_edit';
  
  // 控制参数
  auto_analyze?: boolean;
  skip_ai_analysis?: boolean;
  force_overwrite?: boolean;
}

/**
 * 统一存储工具类
 */
export class UnifiedStoreTool extends BaseMCPTool {
  readonly name = 'unified_store';
  readonly description = '🤖 智能存储 - AI分析提示词内容，自动补全参数并保存到数据库';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: {
          type: 'string',
          description: '要保存的提示词内容',
          required: true,
        } as ToolParameter,
        
        instruction: {
          type: 'string',
          description: '用户的存储指令，如"保存此提示词，使用xxx标题，存储到教育分类"等自然语言指令',
          required: false,
        } as ToolParameter,
        
        // 用户可直接指定的参数
        title: {
          type: 'string',
          description: '提示词标题（用户指定时优先使用）',
          required: false,
        } as ToolParameter,
        
        category: {
          type: 'string',
          description: '分类（用户指定时优先使用）',
          required: false,
        } as ToolParameter,
        
        description: {
          type: 'string',
          description: '描述（用户指定时优先使用）',
          required: false,
        } as ToolParameter,
        
        tags: {
          type: 'array',
          description: '标签列表（用户指定时优先使用）',
          required: false,
          items: { type: 'string' },
        } as ToolParameter,
        
        difficulty: {
          type: 'string',
          description: '难度级别：simple | medium | complex',
          required: false,
        } as ToolParameter,
        
        is_public: {
          type: 'boolean',
          description: '是否公开，默认true',
          required: false,
        } as ToolParameter,
        
        allow_collaboration: {
          type: 'boolean',
          description: '是否允许协作编辑，默认true',
          required: false,
        } as ToolParameter,
        
        collaborative_level: {
          type: 'string',
          description: '协作编辑级别：creator_only(仅创建者) | invite_only(邀请制) | public_edit(公开编辑)，默认creator_only',
          required: false,
        } as ToolParameter,
        
        // 控制参数
        auto_analyze: {
          type: 'boolean',
          description: '是否启用AI自动分析，默认true',
          required: false,
        } as ToolParameter,
        
        skip_ai_analysis: {
          type: 'boolean',
          description: '跳过AI分析，仅使用用户提供的参数',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: UnifiedStoreParams, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);

    const startTime = performance.now();
    
    try {
      this.logExecution('智能存储开始', context, {
        contentLength: params.content.length,
        hasInstruction: !!params.instruction,
        hasUserParams: this.hasUserSpecifiedParams(params),
        autoAnalyze: params.auto_analyze !== false
      });

      // 1. 解析用户指令
      const instructionResult = await this.parseUserInstruction(params);
      
      // 2. AI智能分析（如果启用）
      let aiAnalysis: AIAnalysisResult | null = null;
      if (!params.skip_ai_analysis && params.auto_analyze !== false) {
        aiAnalysis = await this.performAIAnalysis(params.content, instructionResult.analysis_hints);
      }
      
      // 3. 合并参数（用户指定优先）
      const finalParams = this.mergeParameters(params, instructionResult.specified_params, aiAnalysis);
      
      // 4. 验证和优化参数
      const optimizedParams = await this.optimizeParameters(finalParams);
      
      // 5. 执行存储
      const storeResult = await this.performStorage(optimizedParams, context);
      
      // 6. 生成详细报告
      const report = this.generateStorageReport(
        optimizedParams,
        aiAnalysis,
        instructionResult,
        performance.now() - startTime
      );

      this.logExecution('智能存储完成', context, {
        promptId: storeResult.data?.id,
        usedAI: !!aiAnalysis,
        userOverrides: Object.keys(instructionResult.specified_params).length,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      return {
        success: true,
        data: {
          prompt: storeResult.data,
          analysis_report: report,
          used_ai_analysis: !!aiAnalysis,
          user_specified_params: instructionResult.specified_params,
          final_params: optimizedParams
        },
        message: `✅ 提示词已成功保存！${aiAnalysis ? ' (AI智能分析已完成)' : ''}`
      };

    } catch (error) {
      console.error('[UnifiedStore] 智能存储失败:', error);
      return {
        success: false,
        message: `智能存储失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查是否有用户指定参数
   */
  private hasUserSpecifiedParams(params: UnifiedStoreParams): boolean {
    return !!(
      params.title ||
      params.category ||
      params.description ||
      params.tags?.length ||
      params.difficulty ||
      params.is_public !== undefined
    );
  }

  /**
   * 解析用户自然语言指令
   */
  private async parseUserInstruction(params: UnifiedStoreParams): Promise<InstructionParseResult> {
    const instruction = params.instruction || '';
    const specified_params: UserSpecifiedParams = {};
    const analysis_hints: string[] = [];

    // 直接参数优先
    if (params.title) specified_params.title = params.title;
    if (params.category) specified_params.category = params.category;
    if (params.description) specified_params.description = params.description;
    if (params.tags) specified_params.tags = params.tags;
    if (params.difficulty) specified_params.difficulty = params.difficulty;
    if (params.is_public !== undefined) specified_params.is_public = params.is_public;
    if (params.allow_collaboration !== undefined) specified_params.allow_collaboration = params.allow_collaboration;
    if (params.collaborative_level) specified_params.collaborative_level = params.collaborative_level;

    if (instruction) {
      // 解析标题指定
      const titleMatch = instruction.match(/(?:使用|标题为|标题是|title[:\s]*[""']?)([^""'，。]+)(?:[""']?)(?:标题|作为标题)/i);
      if (titleMatch && !specified_params.title) {
        specified_params.title = titleMatch[1].trim();
      }

      // 解析分类指定
      const categoryMatch = instruction.match(/(?:存储到|保存到|分类为|类别是|category[:\s]*[""']?)([^""'，。]+)(?:[""']?)(?:分类|类别|category)/i);
      if (categoryMatch && !specified_params.category) {
        specified_params.category = categoryMatch[1].trim();
      }

      // 解析标签指定
      const tagsMatch = instruction.match(/(?:标签为|tags为|标记为|tag[:\s]*[""']?)([^""'，。]+)(?:[""']?)/i);
      if (tagsMatch && !specified_params.tags) {
        specified_params.tags = tagsMatch[1].split(/[，,、\s]+/).map(tag => tag.trim()).filter(Boolean);
      }

      // 解析公开设置
      if (/公开|public/.test(instruction)) {
        specified_params.is_public = true;
      } else if (/私有|private|不公开/.test(instruction)) {
        specified_params.is_public = false;
      }

      // 解析协作设置
      if (/允许协作|可协作|collaboration/.test(instruction)) {
        specified_params.allow_collaboration = true;
      } else if (/禁止协作|不允许协作|no.collaboration/.test(instruction)) {
        specified_params.allow_collaboration = false;
      }

      // 解析协作级别
      if (/仅创建者|只有创建者|creator.only/.test(instruction)) {
        specified_params.collaborative_level = 'creator_only';
      } else if (/邀请制|invite.only/.test(instruction)) {
        specified_params.collaborative_level = 'invite_only';
      } else if (/公开编辑|public.edit/.test(instruction)) {
        specified_params.collaborative_level = 'public_edit';
      }

      // 解析难度
      if (/简单|简易|simple/i.test(instruction)) {
        specified_params.difficulty = 'simple';
      } else if (/复杂|困难|complex/i.test(instruction)) {
        specified_params.difficulty = 'complex';
      } else if (/中等|medium/i.test(instruction)) {
        specified_params.difficulty = 'medium';
      }

      // 提取分析提示
      if (/商务|业务|business/i.test(instruction)) analysis_hints.push('business');
      if (/技术|编程|technical|code/i.test(instruction)) analysis_hints.push('technical');
      if (/创意|创作|creative/i.test(instruction)) analysis_hints.push('creative');
      if (/教育|学习|education/i.test(instruction)) analysis_hints.push('education');
    }

    return {
      action: 'save',
      specified_params,
      analysis_hints
    };
  }

  /**
   * 执行AI智能分析
   */
  private async performAIAnalysis(content: string, hints: string[]): Promise<AIAnalysisResult> {
    try {
      // 模拟AI分析 - 在实际实现中应该调用真正的AI服务
      const analysis = await this.simulateAIAnalysis(content, hints);
      return analysis;
    } catch (error) {
      console.warn('[UnifiedStore] AI分析失败，使用默认分析:', error);
      return this.getDefaultAnalysis(content);
    }
  }

  /**
   * 模拟AI分析（实际应替换为真正的AI调用）
   */
  private async simulateAIAnalysis(content: string, hints: string[]): Promise<AIAnalysisResult> {
    // 基于内容特征进行分析
    const lowerContent = content.toLowerCase();
    
    // 分析分类（基于前端20个预设分类进行智能匹配）
    let category = '通用';
    
    // 根据内容特征和提示进行分类判断
    if (hints.includes('business') || /商务|业务|邮件|客户|合同|市场|销售/.test(lowerContent)) {
      category = '商业';
    } else if (hints.includes('technical') || /代码|编程|技术|开发|bug|算法|数据库/.test(lowerContent)) {
      category = '编程';
    } else if (hints.includes('creative') || /创意|故事|文案|广告|设计|创作/.test(lowerContent)) {
      category = '文案';
    } else if (hints.includes('education') || /教学|教育|学习|解释|课程|培训/.test(lowerContent)) {
      category = '教育';
    } else if (/学术|研究|论文|科研|理论/.test(lowerContent)) {
      category = '学术';
    } else if (/职业|工作|职场|面试|简历/.test(lowerContent)) {
      category = '职业';
    } else if (/设计|视觉|UI|UX|界面/.test(lowerContent)) {
      category = '设计';
    } else if (/绘画|画图|艺术|美术/.test(lowerContent)) {
      category = '绘画';
    } else if (/情感|心理|情绪|感情|关系/.test(lowerContent)) {
      category = '情感';
    } else if (/娱乐|游戏|休闲|趣味/.test(lowerContent)) {
      category = '娱乐';
    } else if (/游戏|电竞|玩法|攻略/.test(lowerContent)) {
      category = '游戏';
    } else if (/生活|日常|家庭|生活方式/.test(lowerContent)) {
      category = '生活';
    } else if (/办公|工作流|效率|文档/.test(lowerContent)) {
      category = '办公';
    } else if (/翻译|语言|转换/.test(lowerContent)) {
      category = '翻译';
    } else if (/视频|影像|剪辑|制作/.test(lowerContent)) {
      category = '视频';
    } else if (/播客|音频|广播|主播/.test(lowerContent)) {
      category = '播客';
    } else if (/音乐|音频|声音|音效/.test(lowerContent)) {
      category = '音乐';
    } else if (/健康|医疗|健身|养生/.test(lowerContent)) {
      category = '健康';
    } else if (/科技|技术|创新|前沿/.test(lowerContent)) {
      category = '科技';
    }

    // 分析标题
    const firstLine = content.split('\n')[0].substring(0, 50);
    const title = firstLine.replace(/^[#\*\-\s]+/, '').trim() || '自动生成的提示词';

    // 分析描述
    const description = this.generateDescription(content, category);

    // 分析标签
    const tags = this.extractTags(content, category);

    // 分析兼容模型
    const compatible_models = this.analyzeCompatibleModels(content);

    // 分析难度
    const difficulty = this.analyzeDifficulty(content);

    // 分析领域
    const domain = this.analyzeDomain(content, category);

    // 分析用例
    const use_cases = this.analyzeUseCases(content, category);

    return {
      title,
      description,
      category,
      tags,
      compatible_models,
      difficulty,
      domain,
      use_cases,
      confidence: 0.85
    };
  }

  /**
   * 生成描述
   */
  private generateDescription(content: string, category: string): string {
    const contentPreview = content.substring(0, 100).replace(/\n/g, ' ');
    const categoryDesc = {
      '商务': '用于商务场景的',
      '技术': '用于技术开发的',
      '创意': '用于创意写作的',
      '教育': '用于教育教学的',
      '通用': '通用型'
    }[category] || '实用的';

    return `${categoryDesc}提示词，${contentPreview}${content.length > 100 ? '...' : ''}`;
  }

  /**
   * 提取标签
   */
  private extractTags(content: string, category: string): string[] {
    const lowerContent = content.toLowerCase();
    const tags: string[] = [];

    // 基于分类的基础标签
    const categoryTags = {
      '商务': ['商务', '专业'],
      '技术': ['技术', '开发'],
      '创意': ['创意', '写作'],
      '教育': ['教育', '学习'],
      '通用': ['通用']
    }[category] || ['通用'];

    tags.push(...categoryTags);

    // 基于内容的标签
    if (/邮件|email/.test(lowerContent)) tags.push('邮件');
    if (/分析|analysis/.test(lowerContent)) tags.push('分析');
    if (/代码|code/.test(lowerContent)) tags.push('编程');
    if (/创作|写作|writing/.test(lowerContent)) tags.push('写作');
    if (/翻译|translate/.test(lowerContent)) tags.push('翻译');
    if (/总结|summary/.test(lowerContent)) tags.push('总结');

    return [...new Set(tags)].slice(0, 5); // 去重并限制数量
  }

  /**
   * 分析兼容模型
   */
  private analyzeCompatibleModels(content: string): string[] {
    const models = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini'];
    
    // 根据复杂度判断兼容模型
    if (content.length > 1000 || /复杂|高级|专业/.test(content)) {
      return ['GPT-4', 'Claude', 'Gemini'];
    }
    
    return models;
  }

  /**
   * 分析难度
   */
  private analyzeDifficulty(content: string): 'simple' | 'medium' | 'complex' {
    if (content.length < 100) return 'simple';
    if (content.length > 500) return 'complex';
    return 'medium';
  }

  /**
   * 分析领域
   */
  private analyzeDomain(content: string, category: string): string {
    const domainMap = {
      '商务': 'business',
      '技术': 'technology',
      '创意': 'creative',
      '教育': 'education',
      '通用': 'general'
    };
    return domainMap[category] || 'general';
  }

  /**
   * 分析用例
   */
  private analyzeUseCases(content: string, category: string): string[] {
    const lowerContent = content.toLowerCase();
    const useCases: string[] = [];

    if (/邮件/.test(lowerContent)) useCases.push('邮件写作');
    if (/分析/.test(lowerContent)) useCases.push('内容分析');
    if (/代码/.test(lowerContent)) useCases.push('代码开发');
    if (/翻译/.test(lowerContent)) useCases.push('文本翻译');
    if (/创作/.test(lowerContent)) useCases.push('创意写作');

    return useCases.length > 0 ? useCases : [category + '场景'];
  }

  /**
   * 获取默认分析结果
   */
  private getDefaultAnalysis(content: string): AIAnalysisResult {
    return {
      title: '自动生成的提示词',
      description: '用户提供的提示词',
      category: '通用',
      tags: ['通用'],
      compatible_models: ['GPT-4', 'GPT-3.5', 'Claude'],
      difficulty: 'medium',
      domain: 'general',
      use_cases: ['通用场景'],
      confidence: 0.5
    };
  }

  /**
   * 合并参数（用户指定优先）
   */
  private mergeParameters(
    originalParams: UnifiedStoreParams,
    userSpecified: UserSpecifiedParams,
    aiAnalysis: AIAnalysisResult | null
  ): any {
    const merged = {
      content: originalParams.content,
      title: userSpecified.title || aiAnalysis?.title || '未命名提示词',
      description: userSpecified.description || aiAnalysis?.description || '用户提供的提示词',
      category: userSpecified.category || aiAnalysis?.category || '通用',
      tags: userSpecified.tags || aiAnalysis?.tags || ['通用'],
      difficulty: userSpecified.difficulty || aiAnalysis?.difficulty || 'medium',
      // 默认设置
      is_public: userSpecified.is_public !== undefined ? userSpecified.is_public : true,
      allow_collaboration: userSpecified.allow_collaboration !== undefined ? userSpecified.allow_collaboration : true,
      collaborative_level: userSpecified.collaborative_level || 'creator_only'
    };

    // 添加AI分析的扩展信息
    if (aiAnalysis) {
      // merged.compatible_models = aiAnalysis.compatible_models;
      // merged.domain = aiAnalysis.domain;
      // merged.use_cases = aiAnalysis.use_cases;
    }

    return merged;
  }

  /**
   * 优化参数
   */
  private async optimizeParameters(params: any): Promise<any> {
    // 优化标题
    if (params.title.length > 100) {
      params.title = params.title.substring(0, 97) + '...';
    }

    // 优化描述
    if (params.description.length > 500) {
      params.description = params.description.substring(0, 497) + '...';
    }

    // 优化标签
    if (params.tags.length > 10) {
      params.tags = params.tags.slice(0, 10);
    }

    // 验证分类必须在20个预设分类中（与前端保持一致）
    const PRESET_CATEGORIES = [
      '通用', '学术', '职业', '文案', '设计', '绘画', '教育', '情感', '娱乐', '游戏', 
      '生活', '商业', '办公', '编程', '翻译', '视频', '播客', '音乐', '健康', '科技'
    ];
    
    if (!params.category || !PRESET_CATEGORIES.includes(params.category)) {
      params.category = '通用';
    }

    return params;
  }

  /**
   * 执行存储
   */
  private async performStorage(params: any, context: ToolContext): Promise<ToolResult> {
      try {
        const storage = this.getStorage();
        
        // 确保用户ID正确传递
        const userId = context.userId || params.created_by || params.user_id;
        
        // 调用存储服务
        const promptData = {
          name: params.title,
          description: params.description,
          content: params.content,
          messages: [{ role: 'user' as const, content: params.content }], // 添加必需的messages字段
          category: params.category,
          tags: params.tags,
          difficulty: params.difficulty,
          is_public: params.is_public || false,
          // 扩展字段（暂时注释，等数据库模式更新）
          // compatible_models: params.compatible_models,
          // domain: params.domain,
          // use_cases: params.use_cases,
          allow_collaboration: params.allow_collaboration,
          collaborative_level: params.collaborative_level,
          user_id: userId, // 确保正确的字段名
          created_at: new Date().toISOString()
        };
  
        console.log('[UnifiedStore] 准备保存提示词:', {
          title: params.title,
          userId: userId,
          category: params.category,
          hasContent: !!params.content
        });
  
        const result = await storage.createPrompt(promptData);
        
        console.log('[UnifiedStore] 提示词保存成功:', {
          promptId: result.id,
          userId: userId,
          title: params.title
        });
  
        return {
          success: true,
          data: result,
          message: '提示词保存成功'
        };
      } catch (error) {
        console.error('[UnifiedStore] 存储失败:', error);
        throw new Error(`存储失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }


  /**
   * 生成存储报告
   */
  private generateStorageReport(
    finalParams: any,
    aiAnalysis: AIAnalysisResult | null,
    instructionResult: InstructionParseResult,
    executionTime: number
  ): any {
    return {
      execution_summary: {
        execution_time_ms: Math.round(executionTime),
        used_ai_analysis: !!aiAnalysis,
        ai_confidence: aiAnalysis?.confidence || 0,
        user_overrides: Object.keys(instructionResult.specified_params).length
      },
      parameter_sources: {
        title: instructionResult.specified_params.title ? 'user' : 'ai',
        category: instructionResult.specified_params.category ? 'user' : 'ai',
        description: instructionResult.specified_params.description ? 'user' : 'ai',
        tags: instructionResult.specified_params.tags ? 'user' : 'ai',
        difficulty: instructionResult.specified_params.difficulty ? 'user' : 'ai',
        is_public: instructionResult.specified_params.is_public !== undefined ? 'user' : 'default',
        allow_collaboration: instructionResult.specified_params.allow_collaboration !== undefined ? 'user' : 'default',
        collaborative_level: instructionResult.specified_params.collaborative_level ? 'user' : 'default'
      },
      ai_analysis: aiAnalysis ? {
        suggested_title: aiAnalysis.title,
        suggested_category: aiAnalysis.category,
        suggested_tags: aiAnalysis.tags,
        confidence: aiAnalysis.confidence,
        // compatible_models: aiAnalysis.compatible_models,
        // domain: aiAnalysis.domain,
        // use_cases: aiAnalysis.use_cases
      } : null,
      final_parameters: {
        title: finalParams.title,
        category: finalParams.category,
        description: finalParams.description,
        tags: finalParams.tags,
        difficulty: finalParams.difficulty,
        is_public: finalParams.is_public,
        allow_collaboration: finalParams.allow_collaboration,
        collaborative_level: finalParams.collaborative_level
      }
    };
  }
}

// 创建工具实例
export const unifiedStoreTool = new UnifiedStoreTool();

// 工具定义导出
export const unifiedStoreToolDef = unifiedStoreTool.getToolDefinition();

// 处理函数导出
export async function handleUnifiedStore(
  params: any,
  context?: { userId?: string; requestId?: string; userAgent?: string }
): Promise<any> {
  const toolContext = {
    userId: context?.userId,
    requestId: context?.requestId || `unified_store_${Date.now()}`,
    timestamp: Date.now(),
    userAgent: context?.userAgent
  };

  const result = await unifiedStoreTool.execute(params, toolContext);
  
  if (result.success) {
    return {
      content: {
        type: 'text',
        text: `✅ ${result.message}\n\n📊 存储报告:\n${JSON.stringify(result.data?.analysis_report, null, 2)}`
      },
      metadata: {
        prompt_id: result.data?.prompt?.id,
        used_ai: result.data?.used_ai_analysis,
        execution_time: result.data?.analysis_report?.execution_summary?.execution_time_ms
      }
    };
  } else {
    throw new Error(result.message || '智能存储失败');
  }
}