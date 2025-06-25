/**
 * 优化并询问保存工具
 * 
 * 提供"优化+询问保存"的完整工作流程
 * 1. 优化提示词
 * 2. 展示优化结果
 * 3. 询问用户是否保存
 * 4. 如果用户确认，则保存到数据库
 */

import { BaseMCPTool, ToolContext } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter } from '../../types.js';
import { PromptOptimizerMCPTool } from './prompt-optimizer.js';
import { UnifiedStoreTool } from '../storage/unified-store.js';

// 定义本地类型接口
interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * 优化并询问保存参数
 */
interface OptimizeAndSaveParams {
  content: string;
  optimization_type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'analysis' | 'iteration';
  requirements?: string;
  context?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  include_analysis?: boolean;
  language?: 'zh' | 'en';
  
  // 保存相关参数（可选）
  save_title?: string;
  save_category?: string;
  save_description?: string;
  save_tags?: string[];
  save_is_public?: boolean;
  
  // 控制参数
  auto_save?: boolean; // 如果为true，优化后自动保存；如果为false或未设置，则询问用户
}

/**
 * 优化并询问保存工具类
 */
export class OptimizeAndSaveTool extends BaseMCPTool {
  readonly name = 'optimize_and_save';
  readonly description = '🎯 优化并询问保存 - 优化提示词后询问用户是否保存到数据库';

  private optimizerTool: PromptOptimizerMCPTool;
  private storeTool: UnifiedStoreTool;

  constructor() {
    super();
    this.optimizerTool = new PromptOptimizerMCPTool();
    this.storeTool = new UnifiedStoreTool();
  }

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
        optimization_type: {
          type: 'string',
          description: '优化类型：general(通用) | creative(创意) | technical(技术) | business(商务) | educational(教育) | drawing(绘图) | analysis(分析) | iteration(迭代)',
          required: false,
        } as ToolParameter,
        requirements: {
          type: 'string',
          description: '特殊要求或限制条件',
          required: false,
        } as ToolParameter,
        context: {
          type: 'string',
          description: '使用场景和上下文',
          required: false,
        } as ToolParameter,
        complexity: {
          type: 'string',
          description: '复杂度级别：simple(简单) | medium(中等) | complex(复杂)',
          required: false,
        } as ToolParameter,
        include_analysis: {
          type: 'boolean',
          description: '是否包含详细分析，默认true',
          required: false,
        } as ToolParameter,
        language: {
          type: 'string',
          description: '输出语言：zh(中文) | en(英文)',
          required: false,
        } as ToolParameter,
        save_title: {
          type: 'string',
          description: '保存时使用的标题（可选）',
          required: false,
        } as ToolParameter,
        save_category: {
          type: 'string',
          description: '保存时使用的分类（可选）',
          required: false,
        } as ToolParameter,
        save_description: {
          type: 'string',
          description: '保存时使用的描述（可选）',
          required: false,
        } as ToolParameter,
        save_tags: {
          type: 'array',
          description: '保存时使用的标签列表（可选）',
          required: false,
        } as ToolParameter,
        save_is_public: {
          type: 'boolean',
          description: '保存时是否公开，默认true（可选）',
          required: false,
        } as ToolParameter,
        auto_save: {
          type: 'boolean',
          description: '是否自动保存优化结果，默认false（询问用户）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: OptimizeAndSaveParams, context: ToolContext): Promise<ToolResult> {
    const startTime = performance.now();

    try {
      const fullContext = {
        ...context,
        timestamp: Date.now()
      };

      this.logExecution('优化并询问保存开始', fullContext, {
        contentLength: params.content.length,
        optimizationType: params.optimization_type || 'general',
        autoSave: params.auto_save || false
      });

      // 1. 执行优化
      const optimizationResult = await this.optimizerTool.execute({
        content: params.content,
        optimization_type: params.optimization_type,
        requirements: params.requirements,
        context: params.context,
        complexity: params.complexity,
        include_analysis: params.include_analysis,
        language: params.language
      }, fullContext);

      if (!optimizationResult.success) {
        return optimizationResult;
      }

      // 2. 构建响应消息
      let responseMessage = optimizationResult.message || '';
      
      // 添加优化结果展示
      if (optimizationResult.data?.optimization_template?.user) {
        responseMessage += '\n\n📋 **优化模板：**\n';
        responseMessage += optimizationResult.data.optimization_template.user;
      }

      // 3. 根据auto_save参数决定是否自动保存
      if (params.auto_save) {
        // 自动保存
        const saveResult = await this.performSave(params, optimizationResult.data, fullContext);
        if (saveResult.success) {
          responseMessage += '\n\n✅ **已自动保存优化后的提示词！**';
          responseMessage += `\n📝 保存信息：${saveResult.message}`;
        } else {
          responseMessage += '\n\n❌ **自动保存失败：**';
          responseMessage += `\n错误信息：${saveResult.message}`;
        }
      } else {
        // 询问用户是否保存
        responseMessage += '\n\n💾 **是否保存优化后的提示词？**';
        responseMessage += '\n\n如需保存，请使用以下命令：';
        responseMessage += '\n```';
        responseMessage += '\nunified_store({';
        responseMessage += '\n  content: "优化后的提示词内容",';
        if (params.save_title) responseMessage += `\n  title: "${params.save_title}",`;
        if (params.save_category) responseMessage += `\n  category: "${params.save_category}",`;
        if (params.save_description) responseMessage += `\n  description: "${params.save_description}",`;
        if (params.save_tags?.length) responseMessage += `\n  tags: ${JSON.stringify(params.save_tags)},`;
        responseMessage += `\n  is_public: ${params.save_is_public !== false}`;
        responseMessage += '\n})';
        responseMessage += '\n```';
      }

      this.logExecution('优化并询问保存完成', fullContext, {
        optimizationType: params.optimization_type || 'general',
        autoSaved: params.auto_save || false,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      return {
        success: true,
        data: {
          optimization_result: optimizationResult.data,
          auto_saved: params.auto_save || false,
          save_params: params.auto_save ? this.buildSaveParams(params, optimizationResult.data) : null
        },
        message: responseMessage
      };

    } catch (error) {
      console.error('[OptimizeAndSave] 执行失败:', error);
      return {
        success: false,
        message: `优化并保存失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 执行保存操作
   */
  private async performSave(params: OptimizeAndSaveParams, optimizationData: any, context: ToolContext): Promise<ToolResult> {
    const saveParams = this.buildSaveParams(params, optimizationData);
    return await this.storeTool.execute(saveParams, context);
  }

  /**
   * 构建保存参数
   */
  private buildSaveParams(params: OptimizeAndSaveParams, optimizationData: any): any {
    return {
      content: params.content, // 使用原始内容，用户可以手动替换为优化后的内容
      title: params.save_title,
      category: params.save_category,
      description: params.save_description,
      tags: params.save_tags,
      is_public: params.save_is_public !== false,
      auto_analyze: true // 启用AI分析来补全缺失的参数
    };
  }
}

// 导出工具定义和处理函数供MCP路由器使用
export const optimizeAndSaveToolDef = {
  name: 'optimize_and_save',
  description: '🎯 优化并询问保存 - 优化提示词后询问用户是否保存到数据库',
  schema_version: 'v1',
  parameters: {
    content: {
      type: 'string' as const,
      description: '要优化的提示词内容',
      required: true,
    } as ToolParameter,
    optimization_type: {
      type: 'string' as const,
      description: '优化类型：general(通用) | creative(创意) | technical(技术) | business(商务) | educational(教育) | drawing(绘图) | analysis(分析) | iteration(迭代)',
      required: false,
    } as ToolParameter,
    requirements: {
      type: 'string' as const,
      description: '特殊要求或限制条件',
      required: false,
    } as ToolParameter,
    context: {
      type: 'string' as const,
      description: '使用场景和上下文',
      required: false,
    } as ToolParameter,
    complexity: {
      type: 'string' as const,
      description: '复杂度级别：simple(简单) | medium(中等) | complex(复杂)',
      required: false,
    } as ToolParameter,
    include_analysis: {
      type: 'boolean' as const,
      description: '是否包含详细分析，默认true',
      required: false,
    } as ToolParameter,
    language: {
      type: 'string' as const,
      description: '输出语言：zh(中文) | en(英文)',
      required: false,
    } as ToolParameter,
    save_title: {
      type: 'string' as const,
      description: '保存时使用的标题（可选）',
      required: false,
    } as ToolParameter,
    save_category: {
      type: 'string' as const,
      description: '保存时使用的分类（可选）',
      required: false,
    } as ToolParameter,
    save_description: {
      type: 'string' as const,
      description: '保存时使用的描述（可选）',
      required: false,
    } as ToolParameter,
    save_tags: {
      type: 'array' as const,
      description: '保存时使用的标签列表（可选）',
      required: false,
    } as ToolParameter,
    save_is_public: {
      type: 'boolean' as const,
      description: '保存时是否公开，默认true（可选）',
      required: false,
    } as ToolParameter,
    auto_save: {
      type: 'boolean' as const,
      description: '是否自动保存优化结果，默认false（询问用户）',
      required: false,
    } as ToolParameter,
  },
};

// 处理函数
export async function handleOptimizeAndSave(params: any, userId?: string) {
  const tool = new OptimizeAndSaveTool();
  return await tool.execute(params, {
    userId,
    timestamp: Date.now()
  });
}
