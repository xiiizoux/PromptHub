/**
 * MCP智能工具集 - 新基类版本
 * 支持第三方客户端AI分析的智能提示词选择和存储功能
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt, PromptContentJsonb } from '../../types.js';


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

  /**
   * 从 PromptContentJsonb | string 类型中提取字符串内容
   */
  private extractStringContent(content: PromptContentJsonb | string): string {
    if (typeof content === 'string') {
      return content;
    }
    
    // 如果是 JSONB 对象，按优先级提取内容
    if (content.static_content) {
      return content.static_content;
    }
    
    if (content.legacy_content) {
      return content.legacy_content;
    }
    
    return '';
  }

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

  async execute(params: any, _context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['user_query']);
    const { user_query, max_results = 5 } = params;

    try {
      const storage = this.getStorage();
      const searchResults = await storage.searchPrompts(user_query, _context.userId);
      const results = Array.isArray(searchResults) ? searchResults.slice(0, max_results) : [];

      // 格式化结果
      const formattedOutput = this.formatForConversationalDisplay(results, user_query);

      return {
        success: true,
        data: { 
          matches: results, 
          conversation_display: formattedOutput,
          total: results.length
        },
        message: `🎯 智能选择完成，找到 ${results.length} 个匹配的提示词`
      };
    } catch (error) {
      return { success: false, message: '❌ 智能选择失败' };
    }
  }

  /**
   * 格式化搜索结果为对话式显示
   */
  private formatForConversationalDisplay(results: Prompt[], query: string): string {
    if (results.length === 0) {
      return `😔 抱歉，没有找到与"${query}"相关的提示词。\n\n🔍 建议：\n• 尝试使用更简单的关键词\n• 检查是否有拼写错误\n• 或者浏览我们的分类目录`;
    }

    let output = `🎯 智能为您推荐 ${results.length} 个与"${query}"相关的提示词：\n\n`;

    results.forEach((prompt, index) => {
      const emoji = this.getEmojiForCategory(prompt.category);
      
      output += `**${index + 1}. ${emoji} ${prompt.name}**\n`;
      output += `📝 **描述：** ${prompt.description || '暂无描述'}\n`;
      
      const content = this.extractContentPreview(prompt);
      if (content && content.trim()) {
        output += `📄 **内容（点击右上角复制按钮即可一键复制）：**\n\n${content}\n\n⬆️ 以上是完整的提示词内容，请在内容区域右上角点击复制按钮进行一键复制\n`;
      }
      
      if (prompt.category) {
        output += `📂 **分类：** ${prompt.category}\n`;
      }
      
      if (prompt.tags && prompt.tags.length > 0) {
        output += `🏷️ ${prompt.tags.slice(0, 3).join(' • ')}\n`;
      }
      
      if (index < results.length - 1) {
        output += '\n---\n\n';
      }
    });

    output += `\n\n💬 **使用说明：**\n`;
    output += `上述提示词经过智能分析推荐，每个都包含了完整的内容预览。\n`;
    output += `您可以在提示词内容区域右上角点击复制按钮进行一键复制，或者说"我要第X个提示词"获取更多详细信息。`;

    return output;
  }

  private getEmojiForCategory(category?: string): string {
    if (!category) return '📝';

    // 基于分类名称关键词智能匹配emoji
    const keywordEmojiRules = [
      // 对话交流类
      { keywords: ['对话', '交流', '聊天', '沟通'], emoji: '💬' },

      // 学术研究类
      { keywords: ['学术', '研究', '论文', '科研'], emoji: '🎓' },

      // 编程开发类
      { keywords: ['编程', '开发', '代码', '程序'], emoji: '💻' },

      // 文案写作类
      { keywords: ['文案', '写作', '创作', '文字'], emoji: '✍️' },

      // 翻译语言类
      { keywords: ['翻译', '语言', '多语言'], emoji: '🌐' },

      // 设计艺术类
      { keywords: ['设计', '艺术', '绘画', '美术'], emoji: '🎨' },

      // 摄影图像类
      { keywords: ['摄影', '拍摄', '照片'], emoji: '📷' },

      // 视频制作类
      { keywords: ['视频', '影像', '动画'], emoji: '📹' },

      // 商业金融类
      { keywords: ['商业', '金融', '投资', '财务'], emoji: '💰' },

      // 教育学习类
      { keywords: ['教育', '学习', '培训'], emoji: '📚' },

      // 健康医疗类
      { keywords: ['健康', '医疗', '养生'], emoji: '💊' },

      // 科技创新类
      { keywords: ['科技', '技术', '创新'], emoji: '🔬' },

      // 音乐音频类
      { keywords: ['音乐', '音频', '播客'], emoji: '🎵' },

      // 游戏娱乐类
      { keywords: ['游戏', '娱乐', '趣味'], emoji: '🎮' },

      // 生活日常类
      { keywords: ['生活', '日常', '家庭'], emoji: '🏠' },
    ];

    // 查找匹配的规则
    for (const rule of keywordEmojiRules) {
      if (rule.keywords.some(keyword => category.includes(keyword))) {
        return rule.emoji;
      }
    }

    // 默认图标
    return '📝';
  }

  private extractContentPreview(prompt: Prompt): string {
    let content = '';

    // 使用content字段
    if (prompt.content) {
      content = this.extractStringContent(prompt.content);
    }

    if (content.length > 500) {
      content = content.substring(0, 500) + '...';
    }

    return content;
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

  async execute(params: any, _context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);
    const { content } = params;

    try {
      const storage = this.getStorage();
      const promptData: Prompt = {
        name: `智能提示词_${Date.now()}`,
        description: '通过智能分析创建',
        category: 'general',
        tags: [],
        content: content,
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

  async execute(params: any, _context: ToolContext): Promise<ToolResult> {
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
export async function handleIntelligentPromptSelection(params: any, _userId?: string) {
  return intelligentPromptSelectionTool.handleExecution(params, _userId);
}

export async function handleIntelligentPromptStorage(params: any, _userId?: string) {
  return intelligentPromptStorageTool.handleExecution(params, _userId);
}

export async function handleExternalAIAnalysis(params: any, _userId?: string) {
  return externalAIAnalysisTool.handleExecution(params, _userId);
}

// 工具定义导出
export const intelligentPromptSelectionToolDef = intelligentPromptSelectionTool.getToolDefinition();
export const intelligentPromptStorageToolDef = intelligentPromptStorageTool.getToolDefinition();
export const externalAIAnalysisToolDef = externalAIAnalysisTool.getToolDefinition(); 