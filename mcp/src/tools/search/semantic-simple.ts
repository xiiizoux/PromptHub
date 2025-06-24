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
 * 简单语义搜索结果接口
 */
interface SimpleSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  confidence: number;
  matchReason: string;
}

/**
 * 简单语义搜索工具
 * 
 * 专为Cursor等AI客户端设计的简化搜索工具：
 * - 单一query参数，支持自然语言描述
 * - 全局搜索：标题、描述、内容、分类、标签
 * - 简洁的结果格式，便于对话框展示和选择
 * - 智能相关性排序
 */
export class SimpleSemanticSearchTool extends BaseMCPTool {
  readonly name = 'simple_search';
  readonly description = '🔍 简单语义搜索 - 已废弃，请使用 smart_semantic_search 获得更好体验';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description + ' (已废弃，请使用 smart_semantic_search)',
      schema_version: 'v1',
      parameters: {
        query: {
          type: 'string',
          description: '搜索描述，推荐使用 smart_semantic_search 获得更好体验',
          required: true,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    return {
      success: false,
      message: '⚠️ 此工具已被废弃，请使用 smart_semantic_search 获得更好的搜索体验。\n\n新工具提供:\n• 更智能的语义理解\n• 更简洁的结果展示\n• 更准确的相关性排序\n• 对话式的选择界面'
    };
  }
}


// 导出工具实例
export const simpleSemanticSearchTool = new SimpleSemanticSearchTool();

// 导出工具定义
export const simpleSemanticSearchToolDef = simpleSemanticSearchTool.getToolDefinition();

// 导出处理函数  
export const handleSimpleSearch = async (params: any, context: ToolContext): Promise<ToolResult> => {
  return await simpleSemanticSearchTool.execute(params, context);
};