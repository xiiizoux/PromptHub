/**
 * MCP自动提示词存储工具 - 新基类版本
 * 专为第三方客户端设计的简化存储功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';
import { MCPAIAnalysisResult } from '../../ai/mcp-ai-analyzer.js';
import { unifiedStoreTool } from './unified-store.js';

/**
 * 一键存储工具类 - 最简化的存储体验
 */
// 定义参数类型
interface QuickStoreParams {
  content: string;
  title?: string;
  make_public?: boolean;
}

export class QuickStoreTool extends BaseMCPTool {
  readonly name = 'quick_store';
  readonly description = '一键存储提示词。系统将自动分析并填充所有参数，智能判断公开/私有设置，最大程度减少人工干预。';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: {
          type: 'string',
          description: '要存储的提示词内容',
          required: true,
        } as ToolParameter,
        title: {
          type: 'string',
          description: '自定义标题（可选）。如不提供，系统将自动生成',
          required: false,
        } as ToolParameter,
        make_public: {
          type: 'boolean',
          description: '是否设为公开。如不指定，系统将根据内容中的关键词智能判断',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: QuickStoreParams, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);

    const { content, title, make_public } = params;
    const isPublic = make_public !== undefined ? make_public : this.detectPrivacyPreference(content, title);

    this.logExecution('一键存储', context, {
      contentLength: content.length,
      hasTitle: !!title,
      isPublic
    });

    // 迁移到使用unified_store核心实现
    try {
      const unifiedParams = {
        content: content,
        title: title,
        is_public: isPublic,
        auto_analyze: true,
        skip_ai_analysis: false
      };

      const result = await unifiedStoreTool.execute(unifiedParams, context);
      
      if (result.success) {
        // 转换为QuickStore格式的返回数据
        // 转换为QuickStore格式的返回数据
        const resultData = result.data as {
          prompt?: { id?: string; name?: string };
          final_params?: { category?: string; tags?: string[] };
        };
        
        return {
          success: true,
          data: {
            prompt_id: resultData?.prompt?.id,
            prompt_name: resultData?.prompt?.name,
            is_public: isPublic,
            analysis_summary: {
              category: resultData?.final_params?.category,
              tags_count: resultData?.final_params?.tags?.length || 0
            }
          },
          message: `✅ 提示词已成功存储: ${resultData?.prompt?.name}`
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        message: '存储失败，请重试'
      };
    }
  }

  private detectPrivacyPreference(content: string, title?: string): boolean {
    const text = `${content} ${title || ''}`.toLowerCase();
    const privateKeywords = ['个人', '私有', '私人', '私密', 'private', 'personal'];
    const publicKeywords = ['公开', '分享', '共享', 'public', 'share'];
    
    if (privateKeywords.some(k => text.includes(k))) return false;
    if (publicKeywords.some(k => text.includes(k))) return true;
    return true; // 默认公开
  }

  private convertContentToMessages(content: string) {
    return [{ role: 'system' as const, content: content.trim() }]; // 统一使用system角色，避免显示"用户:"前缀
  }
}

/**
 * 智能存储工具类
 */
export class SmartStoreTool extends BaseMCPTool {
  readonly name = 'smart_store';
  readonly description = '智能存储提示词。利用AI进行分析，智能判断设置';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: { type: 'string', description: '要存储的提示词内容', required: true } as ToolParameter,
        auto_analyze: { type: 'boolean', description: '是否自动AI分析', required: false } as ToolParameter,
        make_public: { type: 'boolean', description: '是否公开', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: { content: string; auto_analyze?: boolean; make_public?: boolean }, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);
    
    const { content, auto_analyze = true, make_public } = params;
    this.logExecution('智能存储', context, { contentLength: content.length, auto_analyze });

    // 迁移到使用unified_store核心实现
    try {
      const isPublic = make_public !== undefined ? make_public : this.detectPrivacyPreference(content);
      
      const unifiedParams = {
        content: content,
        is_public: isPublic,
        auto_analyze: auto_analyze,
        skip_ai_analysis: !auto_analyze
      };

      const result = await unifiedStoreTool.execute(unifiedParams, context);
      
      if (result.success) {
        const resultData = result.data as {
          prompt?: { id?: string; name?: string };
          analysis_report?: { ai_analysis?: unknown };
        };
        
        // 转换为SmartStore格式的返回数据
        return {
          success: true,
          data: {
            prompt_id: resultData?.prompt?.id,
            prompt_name: resultData?.prompt?.name,
            analysis_result: resultData?.analysis_report?.ai_analysis,
            is_public: isPublic
          },
          message: `✅ 智能存储完成: ${resultData?.prompt?.name}`
        };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, message: '智能存储失败，请重试' };
    }
  }

  private detectPrivacyPreference(content: string): boolean {
    const privateKeywords = ['个人', '私有', '私密', 'private', 'personal'];
    return !privateKeywords.some(k => content.toLowerCase().includes(k));
  }
}

/**
 * 分析并存储工具类
 */
export class AnalyzeAndStoreTool extends BaseMCPTool {
  readonly name = 'analyze_and_store';
  readonly description = '先分析后存储。分步式存储流程，适合精确控制';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: { type: 'string', description: '要分析的提示词内容', required: true } as ToolParameter,
        analysis_only: { type: 'boolean', description: '仅分析不存储', required: false } as ToolParameter,
        analysis_result: { type: 'object', description: '已有分析结果', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: { content: string; analysis_only?: boolean; analysis_result?: MCPAIAnalysisResult }, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);

    const { content, analysis_only = false, analysis_result } = params;
    this.logExecution('分析并存储', context, { contentLength: content.length, analysis_only });

    // 迁移到使用unified_store核心实现
    try {
      if (analysis_only) {
        // 仅分析模式：使用unified_store的AI分析能力，但不存储
        const unifiedParams = {
          content: content,
          skip_ai_analysis: false
        };

        // 先获取AI分析结果（模拟分析）
        const dummyContext = { ...context, userId: 'analysis_only' };
        const result = await unifiedStoreTool.execute({
          ...unifiedParams,
          title: 'temp_analysis',
          auto_analyze: true
        }, dummyContext);

        if (result.success) {
          const resultData = result.data as {
            analysis_report?: { ai_analysis?: unknown };
            final_params?: { category?: string };
          };
          
          return {
            success: true,
            data: {
              analysis_result: resultData?.analysis_report?.ai_analysis,
              content_stats: { 
                length: content.length, 
                estimated_category: resultData?.final_params?.category 
              },
              next_steps: ['确认分析结果', '调整设置', '执行存储']
            },
            message: '分析完成，可查看结果并决定是否存储'
          };
        }
      }

      if (analysis_result) {
        // 使用已有分析结果存储
        const unifiedParams = {
          content: content,
          title: analysis_result.suggestedTitle,
          category: analysis_result.category,
          description: analysis_result.description,
          tags: analysis_result.tags,
          is_public: this.detectPrivacyPreference(content),
          skip_ai_analysis: true  // 跳过AI分析，使用提供的结果
        };

        const result = await unifiedStoreTool.execute(unifiedParams, context);
        
        if (result.success) {
          const resultData = result.data as {
            prompt?: { id?: string; name?: string };
            final_params?: { category?: string; tags?: string[] };
          };
          
          return {
            success: true,
            data: {
              prompt_id: resultData?.prompt?.id,
              prompt_name: resultData?.prompt?.name,
              final_settings: { 
                category: resultData?.final_params?.category, 
                tags: resultData?.final_params?.tags 
              }
            },
            message: `✅ 分析并存储完成: ${resultData?.prompt?.name}`
          };
        } else {
          return result;
        }
      }

      return { success: false, message: '请提供要分析的内容或分析结果' };

    } catch (error) {
      return { success: false, message: '分析或存储失败，请重试' };
    }
  }

  private detectPrivacyPreference(content: string): boolean {
    const privateIndicators = ['个人', '私有', '内部', 'private', 'personal'];
    return !privateIndicators.some(indicator => content.toLowerCase().includes(indicator));
  }
}

// 创建工具实例
export const quickStoreTool = new QuickStoreTool();
export const smartStoreTool = new SmartStoreTool();
export const analyzeAndStoreTool = new AnalyzeAndStoreTool();

// 向后兼容的函数导出
export async function handleQuickStore(params: QuickStoreParams, userId?: string) {
  return quickStoreTool.handleExecution(params, userId);
}

export async function handleSmartStore(params: { content: string; auto_analyze?: boolean; make_public?: boolean }, userId?: string) {
  return smartStoreTool.handleExecution(params, userId);
}

export async function handleAnalyzeAndStore(params: { content: string; analysis_only?: boolean; analysis_result?: MCPAIAnalysisResult }, userId?: string) {
  return analyzeAndStoreTool.handleExecution(params, userId);
}

// 工具定义导出
export const quickStoreToolDef = quickStoreTool.getToolDefinition();
export const smartStoreToolDef = smartStoreTool.getToolDefinition();
export const analyzeAndStoreToolDef = analyzeAndStoreTool.getToolDefinition(); 