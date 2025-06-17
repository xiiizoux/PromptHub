/**
 * MCP智能工具集 - 新基类版本
 * 支持第三方客户端AI分析的智能提示词选择和存储功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../types.js';
import { MCPAIAnalysisResult } from '../ai/mcp-ai-analyzer.js';

// 智能选择匹配分数接口
interface PromptMatchScore {
  prompt: Prompt;
  score: number;
  reasons: string[];
}

// 外部AI分析结果接口
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
 * 智能提示词选择工具类
 */
export class IntelligentPromptSelectionTool extends BaseMCPTool {
  readonly name = 'intelligent_prompt_selection';
  readonly description = '智能推荐最合适的提示词';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        user_query: { type: 'string', description: '用户需求描述', required: true } as ToolParameter,
        max_results: { type: 'number', description: '最大结果数', required: false } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['user_query']);
    const { user_query, max_results = 5 } = params;

    try {
      const storage = this.getStorage();
      const searchResults = await storage.searchPrompts(user_query, context.userId);
      const results = Array.isArray(searchResults) ? searchResults.slice(0, max_results) : [];

      return {
        success: true,
        data: { matches: results, total: results.length },
        message: `🎯 找到 ${results.length} 个匹配的提示词`
      };
    } catch (error) {
      return { success: false, message: '❌ 智能选择失败' };
    }
  }
}

/**
 * 智能提示词存储工具类
 */
export class IntelligentPromptStorageTool extends BaseMCPTool {
  readonly name = 'intelligent_prompt_storage';
  readonly description = '智能分析并存储提示词';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: { type: 'string', description: '提示词内容', required: true } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);
    const { content } = params;

    try {
      const storage = this.getStorage();
      const promptData: Prompt = {
        name: `智能提示词_${Date.now()}`,
        description: '通过智能分析创建',
        category: 'general',
        tags: [],
        messages: [{ role: 'user' as const, content }],
        version: 1.0,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const saved = await storage.createPrompt(promptData);
      return {
        success: true,
        data: { prompt_id: saved.id, name: saved.name },
        message: `✅ 存储完成: ${saved.name}`
      };
    } catch (error) {
      return { success: false, message: '❌ 存储失败' };
    }
  }
}

/**
 * 外部AI分析工具类
 */
export class ExternalAIAnalysisTool extends BaseMCPTool {
  readonly name = 'analyze_prompt_with_external_ai';
  readonly description = '外部AI分析指导';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: { type: 'string', description: '分析内容', required: true } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);
    const { content } = params;

    return {
      success: true,
      data: {
        analysis_prompt: `请分析以下内容：${content}`,
        expected_format: { category: 'string', tags: 'string[]' }
      },
      message: '📋 分析指导已生成'
    };
  }
}

// 工具实例
export const intelligentPromptSelectionTool = new IntelligentPromptSelectionTool();
export const intelligentPromptStorageTool = new IntelligentPromptStorageTool();
export const externalAIAnalysisTool = new ExternalAIAnalysisTool();

// 兼容函数
export async function handleIntelligentPromptSelection(params: any, userId?: string) {
  return intelligentPromptSelectionTool.handleExecution(params, userId);
}

export async function handleIntelligentPromptStorage(params: any, userId?: string) {
  return intelligentPromptStorageTool.handleExecution(params, userId);
}

export async function handleExternalAIAnalysis(params: any, userId?: string) {
  return externalAIAnalysisTool.handleExecution(params, userId);
}

// 工具定义导出
export const intelligentPromptSelectionToolDef = intelligentPromptSelectionTool.getToolDefinition();
export const intelligentPromptStorageToolDef = intelligentPromptStorageTool.getToolDefinition();
export const externalAIAnalysisToolDef = externalAIAnalysisTool.getToolDefinition(); 