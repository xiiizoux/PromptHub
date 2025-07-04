import { BaseMCPTool } from '../../shared/base-tool.js';
import type { ToolDescription, ToolParameter } from '../../types.js';
import type { ToolContext, ToolResult } from '../../shared/base-tool.js';

// 优化模板类型
interface OptimizationTemplate {
  system: string;
  user: string;
}

// 优化参数接口
import { MODEL_TAGS, getModelTagsByType, ModelType } from '../../constants/ai-models.js';
import { mcpPromptCategoryMatcher, MCPCategoryInfo, MCPOptimizationTemplateResult } from '../../services/mcp-category-matcher.js';
import { extractSystemUserTemplate, SystemUserTemplate } from '../../utils/jsonb-utils.js';

interface PromptOptimizationParams {
  content: string;
  // 新增参数：类型选择和分类选择
  type?: 'chat' | 'image' | 'video';
  category?: string; // 手动指定分类名称
  // 保持向后兼容的旧参数（已废弃，不再支持）
  optimization_type?: string;
  requirements?: string;
  context?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  include_analysis?: boolean;
  language?: 'zh' | 'en';
  // 迭代优化专用参数
  original_prompt?: string;
  current_prompt?: string;
  iteration_type?: string;
}

// 优化结果接口
interface OptimizationResult {
  optimization_type: string;
  original_prompt: string;
  optimized_prompt?: string;
  analysis?: string;
  improvement_points: string[];
  usage_suggestions: string[];
  optimization_template: OptimizationTemplate;
  quality_score?: {
    clarity: number;
    specificity: number;
    completeness: number;
    structure: number;
    operability: number;
    overall: number;
  };
  // 新增字段：分类信息和置信度
  matched_category?: MCPCategoryInfo;
  confidence?: number;
  matching_reason?: string;
  is_manual_selection?: boolean;
  techniques?: string[];
  guide?: string[];
  parameters?: string;
  complexity: string;
}

/**
 * 提示词优化MCP工具
 * 为第三方AI客户端提供结构化的提示词优化指导
 */
export class PromptOptimizerMCPTool extends BaseMCPTool {
  readonly name = 'prompt_optimizer';
  readonly description = '🎯 智能提示词优化器 - 支持类型选择(chat/image/video)和智能分类匹配，提供基于数据库优化模板的专业优化指导';

  // 注意：旧的硬编码优化模板已删除，现在使用数据库中的动态模板
  // private readonly OPTIMIZATION_TEMPLATES: Record<string, OptimizationTemplate> = {
    // 硬编码模板已删除，现在使用数据库动态模板



  // 硬编码模板已全部删除，现在完全使用数据库中的动态模板
  // };

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: {
          type: 'string',
          description: '要优化的提示词内容',
          required: true,
        } as ToolParameter,

        type: {
          type: 'string',
          description: '提示词类型：chat(对话)|image(图像)|video(视频)，用于筛选相应类型的分类',
          required: false,
        } as ToolParameter,

        category: {
          type: 'string',
          description: '手动指定分类名称（如"通用对话"、"艺术绘画"等）。如不指定，将使用AI智能匹配最适合的分类',
          required: false,
        } as ToolParameter,

        optimization_type: {
          type: 'string',
          description: '【已废弃】旧的优化类型参数，不再支持。请使用type和category参数',
          required: false,
        } as ToolParameter,

        requirements: {
          type: 'string',
          description: '特殊要求或约束条件',
          required: false,
        } as ToolParameter,

        context: {
          type: 'string',
          description: '使用场景和上下文信息',
          required: false,
        } as ToolParameter,

        complexity: {
          type: 'string',
          description: '复杂度级别：simple|medium|complex',
          required: false,
        } as ToolParameter,

        include_analysis: {
          type: 'boolean',
          description: '是否包含详细分析',
          required: false,
        } as ToolParameter,

        language: {
          type: 'string',
          description: '优化语言：zh(中文)|en(英文)，默认中文',
          required: false,
        } as ToolParameter,

        // 迭代优化专用参数
        original_prompt: {
          type: 'string',
          description: '原始提示词（用于迭代优化）',
          required: false,
        } as ToolParameter,

        current_prompt: {
          type: 'string',
          description: '当前提示词（用于迭代优化）',
          required: false,
        } as ToolParameter,

        iteration_type: {
          type: 'string',
          description: '迭代类型（用于迭代优化）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: PromptOptimizationParams, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);

    const startTime = performance.now();

    try {
      this.logExecution('智能提示词优化开始', context, {
        type: params.type,
        category: params.category,
        optimizationType: params.optimization_type,
        contentLength: params.content.length,
        hasRequirements: !!params.requirements,
        includeAnalysis: params.include_analysis || false
      });

      // 新的智能优化逻辑
      let templateResult: MCPOptimizationTemplateResult | null = null;
      let isManualSelection = false;
      let optimizationType = '';

      // 1. 优先使用新的智能分类匹配
      if (params.category) {
        // 手动指定分类
        console.log(`[MCP优化器] 使用手动指定分类: ${params.category}`);
        const categoryInfo = await mcpPromptCategoryMatcher.getCategoryByName(params.category, params.type);

        if (categoryInfo && categoryInfo.optimization_template) {
          templateResult = {
            template: categoryInfo.optimization_template,
            category: categoryInfo,
            confidence: 1.0 // 手动选择置信度100%
          };
          isManualSelection = true;
          optimizationType = categoryInfo.name;
        } else {
          return {
            success: false,
            message: `指定的分类 "${params.category}" 不存在或没有配置优化模板${params.type ? `（类型：${params.type}）` : ''}`
          };
        }
      } else {
        // 智能匹配分类
        console.log(`[MCP优化器] 使用智能分类匹配${params.type ? `（类型：${params.type}）` : ''}`);
        try {
          templateResult = await mcpPromptCategoryMatcher.getOptimizationTemplate(params.content, params.type);
          optimizationType = templateResult.category.name;
          console.log(`[MCP优化器] 智能匹配到分类: ${optimizationType}, 置信度: ${templateResult.confidence.toFixed(2)}`);
        } catch (error) {
          console.warn(`[MCP优化器] 智能分类匹配失败，回退到传统模式: ${error}`);
          // 回退到传统的硬编码模板
          templateResult = null;
        }
      }

      // 2. 回退到传统的硬编码模板（向后兼容）
      if (!templateResult && params.optimization_type) {
        return {
          success: false,
          message: `硬编码优化类型已不再支持，请使用智能分类匹配或手动选择分类`
        };
      }

      // 3. 最终回退到默认
      if (!templateResult && !params.optimization_type) {
        optimizationType = 'general';
      }

      // 构建优化结果
      const result = await this.buildOptimizationResult(params, optimizationType, templateResult, isManualSelection);

      this.logExecution('智能提示词优化完成', context, {
        optimizationType: result.optimization_type,
        matchedCategory: result.matched_category?.name,
        confidence: result.confidence,
        isManualSelection: result.is_manual_selection,
        hasOptimizedPrompt: !!result.optimized_prompt,
        improvementCount: result.improvement_points.length,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      const categoryInfo = result.matched_category ?
        `\n🎯 **匹配分类**: ${result.matched_category.name}${result.matched_category.name_en ? ` (${result.matched_category.name_en})` : ''}
📊 **置信度**: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '100%'}${result.is_manual_selection ? ' (手动选择)' : ' (智能匹配)'}
📝 **分类描述**: ${result.matched_category.description || '暂无描述'}` :
        `\n🔧 **优化类型**: ${optimizationType} (传统模式)`;

      return {
        success: true,
        data: result,
        message: `✅ 智能提示词优化指导已生成！${categoryInfo}${params.include_analysis ? '\n📈 **包含详细分析**' : ''}

📝 **重要提示：** 此工具仅提供优化建议，不会自动保存提示词。

💡 **是否需要保存优化后的提示词？**
如需保存，请使用 unified_store 工具：
\`\`\`
unified_store({
  content: "优化后的提示词内容",
  title: "自定义标题",
  category: "合适的分类"
})
\`\`\`

**保存步骤：**
1. 复制上方优化后的提示词内容
2. 调用 unified_store 工具进行智能保存
3. 系统将自动分析并补全标题、分类、标签等信息

🆕 **新功能说明：**
- **类型选择**: 使用 \`type\` 参数指定 chat/image/video 类型
- **智能匹配**: 不指定 \`category\` 时自动智能匹配最适合的分类
- **手动选择**: 使用 \`category\` 参数手动指定分类名称（如"通用对话"、"艺术绘画"等）
- **动态模板**: 优化模板来自数据库，支持最新的分类和模板配置`
      };

    } catch (error) {
      console.error('[PromptOptimizerMCP] 优化失败:', error);
      return {
        success: false,
        message: `提示词优化失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 构建优化结果
   */
  private async buildOptimizationResult(
    params: PromptOptimizationParams,
    optimizationType: string,
    templateResult?: MCPOptimizationTemplateResult | null,
    isManualSelection: boolean = false
  ): Promise<OptimizationResult> {
    // 优先使用智能匹配的模板，否则使用硬编码模板
    let template: OptimizationTemplate;

    if (templateResult) {
      // 从数据库模板中提取System+User结构
      const systemUserTemplate = extractSystemUserTemplate(templateResult.template);
      template = {
        system: systemUserTemplate.system,
        user: systemUserTemplate.user
      };
    } else {
      // 硬编码模板已删除，这种情况不应该发生
      throw new Error('硬编码模板已删除，请使用数据库模板');
    }

    // 构建基础结果
    const result: OptimizationResult = {
      optimization_type: optimizationType,
      original_prompt: params.content,
      improvement_points: this.generateImprovementPoints(params, optimizationType),
      usage_suggestions: this.generateUsageSuggestions(params, optimizationType),
      optimization_template: template,
      complexity: params.complexity || 'medium',
      // 新增字段
      matched_category: templateResult?.category,
      confidence: templateResult?.confidence,
      is_manual_selection: isManualSelection
    };

    // 处理模板参数替换
    if (templateResult) {
      // 使用智能匹配的模板
      const requirementsText = params.requirements ? `\n\n特殊要求：${params.requirements}` : '';
      const contextText = params.context ? `\n\n使用场景：${params.context}` : '';

      result.optimization_template = {
        system: '',
        user: templateResult.template
          .replace('{prompt}', params.content)
          .replace('{requirements}', requirementsText + contextText)
      };
    } else {
      // 使用硬编码模板的原有逻辑
      if (optimizationType === 'iteration') {
        if (params.original_prompt) {
          result.optimization_template = {
            ...template,
            user: template.user
              .replace('{originalPrompt}', params.original_prompt)
              .replace('{currentPrompt}', params.current_prompt || params.content)
              .replace('{requirements}', params.requirements || '')
              .replace('{type}', params.iteration_type || 'general')
          };
        }
      } else {
        // 普通优化类型的模板参数替换
        result.optimization_template = {
          ...template,
          user: template.user
            .replace('{prompt}', params.content)
            .replace('{requirements}', params.requirements ? `\n\n特殊要求：${params.requirements}` : '')
        };
      }
    }

    // 如果需要分析，添加质量评分
    if (params.include_analysis || optimizationType === 'analysis') {
      result.quality_score = this.generateQualityScore(params.content);
      result.analysis = this.generateAnalysisText(params.content, result.quality_score);
    }

    // 为绘图类型添加额外信息
    if (optimizationType === 'drawing') {
      result.techniques = this.generateDrawingTechniques();
      result.guide = this.generateDrawingGuide();
      result.parameters = this.generateDrawingParameters();
    }

    return result;
  }

  /**
   * 生成改进建议
   */
  private generateImprovementPoints(params: PromptOptimizationParams, type: string): string[] {
    const content = params.content.toLowerCase();
    const points: string[] = [];

    // 通用改进点（不再基于硬编码类型）
    const generalImprovements = [
      '使用更具体和明确的指令',
      '添加预期输出格式说明',
      '包含必要的上下文信息',
      '设置清晰的约束条件',
      '增加激发想象力的描述性语言',
      '使用准确的技术术语',
      '明确业务目标和成功指标',
      '采用循序渐进的学习结构'
    ];

    // 使用通用改进点
    points.push(...generalImprovements.slice(0, 3));

    // 基于内容长度的改进点
    if (params.content.length < 50) {
      points.push('增加更多详细描述和要求');
    } else if (params.content.length > 500) {
      points.push('优化结构，提高可读性');
    }

    // 基于内容特征的改进点
    if (!content.includes('格式') && !content.includes('format')) {
      points.push('添加输出格式要求');
    }

    return [...new Set(points)].slice(0, 5);
  }

  /**
   * 生成使用建议
   */
  private generateUsageSuggestions(params: PromptOptimizationParams, type: string): string[] {
    const suggestions: string[] = [];

    // 通用使用建议
    const generalSuggestions = [
      '在具体任务中测试优化后的提示词',
      '根据AI反馈进一步调整参数',
      '保持提示词的简洁性和清晰性',
      '鼓励AI产生多个创意选项',
      '在开发环境中先行测试',
      '定期评估商业效果和ROI',
      '根据学习者反馈调整难度',
      '针对不同AI模型调整关键词'
    ];

    suggestions.push(...generalSuggestions.slice(0, 3));

    // 通用建议
    suggestions.push('定期迭代和改进提示词');
    suggestions.push('记录使用效果以便后续优化');

    return suggestions.slice(0, 4);
  }

  /**
   * 生成质量评分
   */
  private generateQualityScore(content: string): {
    clarity: number;
    specificity: number;
    completeness: number;
    structure: number;
    operability: number;
    overall: number;
  } {
    const contentLower = content.toLowerCase();
    
    // 清晰性评分（基于指令明确性）
    let clarity = 5;
    if (content.includes('请') || content.includes('帮')) clarity += 1;
    if (content.includes('需要') || content.includes('要求')) clarity += 1;
    if (content.length > 20) clarity += 1;
    if (!content.includes('...') && !content.includes('等等')) clarity += 1;

    // 具体性评分（基于具体要求）
    let specificity = 5;
    if (contentLower.includes('格式') || contentLower.includes('format')) specificity += 1;
    if (contentLower.includes('步骤') || contentLower.includes('step')) specificity += 1;
    if (content.match(/\d+/)) specificity += 1; // 包含数字
    if (content.includes('：') || content.includes(':')) specificity += 1;

    // 完整性评分（基于信息完整性）
    let completeness = 5;
    if (content.length > 100) completeness += 1;
    if (contentLower.includes('背景') || contentLower.includes('context')) completeness += 1;
    if (contentLower.includes('目标') || contentLower.includes('goal')) completeness += 1;
    if (contentLower.includes('限制') || contentLower.includes('constraint')) completeness += 1;

    // 结构性评分（基于组织结构）
    let structure = 5;
    if (content.includes('\n')) structure += 1;
    if (content.includes('1.') || content.includes('一、')) structure += 1;
    if (content.includes('###') || content.includes('#')) structure += 1;
    if (content.includes('- ') || content.includes('* ')) structure += 1;

    // 可操作性评分（基于执行难度）
    let operability = 5;
    if (content.length < 200) operability += 1; // 不过于复杂
    if (!contentLower.includes('可能') && !contentLower.includes('也许')) operability += 1; // 避免模糊性
    if (contentLower.includes('具体') || contentLower.includes('明确')) operability += 1;
    if (content.split('?').length <= 2) operability += 1; // 避免过多问题

    // 限制最大值
    clarity = Math.min(clarity, 10);
    specificity = Math.min(specificity, 10);
    completeness = Math.min(completeness, 10);
    structure = Math.min(structure, 10);
    operability = Math.min(operability, 10);

    const overall = Number(((clarity + specificity + completeness + structure + operability) / 5).toFixed(1));

    return {
      clarity,
      specificity,
      completeness,
      structure,
      operability,
      overall
    };
  }

  /**
   * 生成分析文本
   */
  private generateAnalysisText(content: string, score: any): string {
    const analysis = [];
    
    analysis.push(`**清晰性 (${score.clarity}/10)**: ${score.clarity >= 7 ? '指令相对明确' : '指令需要更加明确'}`);
    analysis.push(`**具体性 (${score.specificity}/10)**: ${score.specificity >= 7 ? '要求比较具体' : '需要更具体的要求描述'}`);
    analysis.push(`**完整性 (${score.completeness}/10)**: ${score.completeness >= 7 ? '信息相对完整' : '缺少必要的上下文信息'}`);
    analysis.push(`**结构性 (${score.structure}/10)**: ${score.structure >= 7 ? '结构较为合理' : '建议优化内容结构'}`);
    analysis.push(`**可操作性 (${score.operability}/10)**: ${score.operability >= 7 ? 'AI较容易理解执行' : '需要简化或明确操作要求'}`);
    
    return analysis.join('\n');
  }

  /**
   * 生成绘图技巧
   */
  private generateDrawingTechniques(): string[] {
    return [
      '使用具体的艺术风格关键词',
      '添加光影和构图描述',
      '指定画面质量增强词',
      '使用情感色彩描述',
      '添加细节和纹理说明'
    ];
  }

  /**
   * 生成绘图指南
   */
  private generateDrawingGuide(): string[] {
    return [
      '主体在前，背景在后的描述顺序',
      '使用英文关键词提高识别率',
      '避免过于复杂的复合场景',
      '根据AI模型特点调整关键词',
      '保存成功的提示词模板'
    ];
  }

  /**
   * 生成绘图参数建议
   */
  private generateDrawingParameters(): string {
    return 'high quality, detailed, professional, 8k resolution, masterpiece';
  }
}

// 导出工具实例
export const promptOptimizerMCPTool = new PromptOptimizerMCPTool();

// 导出工具定义
export const promptOptimizerMCPToolDef = promptOptimizerMCPTool.getToolDefinition();

// 导出处理函数
export const handlePromptOptimization = (params: PromptOptimizationParams, context: ToolContext) => 
  promptOptimizerMCPTool.execute(params, context);