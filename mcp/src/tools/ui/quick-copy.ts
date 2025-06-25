/**
 * 快速复制工具 - 新基类风格示例
 * 展示如何将现有工具迁移到新的基类架构
 */

import { BaseMCPTool, ToolContext, ToolResult } from '../../shared/base-tool.js';
import { ToolDescription, ToolParameter, Prompt } from '../../types.js';

/**
 * 快速复制工具类
 */
export class QuickCopyTool extends BaseMCPTool {
  readonly name = 'quick_copy_prompt';
  readonly description = '快速获取提示词内容，支持多种格式输出，便于复制到第三方AI客户端';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        prompt_id: {
          type: 'string',
          description: '提示词ID或名称',
          required: true,
        } as ToolParameter,
        format: {
          type: 'string',
          description: '输出格式：plain（纯文本）、markdown（Markdown格式）、json（JSON格式）、template（模板格式）',
          required: false,
        } as ToolParameter,
        include_variables: {
          type: 'boolean',
          description: '是否包含变量说明，默认为true',
          required: false,
        } as ToolParameter,
        custom_variables: {
          type: 'object',
          description: '自定义变量值，用于替换提示词中的占位符',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    // 验证必需参数
    this.validateParams(params, ['prompt_id']);

    const {
      prompt_id,
      format = 'plain',
      include_variables = true,
      custom_variables = {}
    } = params;

    this.logExecution('开始快速复制', context, { prompt_id, format });

    // 获取存储实例
    const storage = this.getStorage();

    // 获取提示词
    const prompt = await this.getPromptById(prompt_id, context.userId);
    if (!prompt) {
      return {
        success: false,
        message: '未找到指定的提示词'
      };
    }

    // 格式化输出
    const formattedContent = this.formatPromptForCopy(
      prompt,
      format,
      include_variables,
      custom_variables
    );

    return {
      success: true,
      data: {
        prompt_id,
        format,
        content: formattedContent,
        metadata: {
          prompt_name: prompt.name,
          prompt_category: prompt.category,
          variables_included: include_variables
        }
      },
      message: `已成功格式化提示词 "${prompt.name}"`
    };
  }

  /**
   * 获取提示词
   */
  private async getPromptById(idOrName: string, userId?: string): Promise<Prompt | null> {
    const storage = this.getStorage();
    
    try {
      // 尝试按ID获取
      let prompt = await storage.getPrompt(idOrName, userId);
      
      if (!prompt) {
        // 尝试搜索匹配的提示词
        const searchResults = await storage.searchPrompts(idOrName, userId);
        prompt = searchResults.find(p => 
          p.name?.toLowerCase() === idOrName.toLowerCase() ||
          p.id === idOrName
        ) || null;
      }
      
      return prompt;
    } catch (error) {
      console.error('[快速复制] 获取提示词失败:', error);
      return null;
    }
  }

  /**
   * 格式化提示词为复制格式
   */
  private formatPromptForCopy(
    prompt: Prompt,
    format: string,
    includeVariables: boolean,
    customVariables: any
  ): string {
    // 提取消息内容
    let content = '';
    if (prompt.messages && Array.isArray(prompt.messages)) {
      content = prompt.messages
        .map(msg => typeof msg === 'string' ? msg : msg.content || '')
        .join('\n\n');
    } else if (typeof prompt.messages === 'string') {
      content = prompt.messages;
    }

    // 替换自定义变量
    if (Object.keys(customVariables).length > 0) {
      content = this.replaceVariables(content, customVariables);
    }

    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(prompt, content, includeVariables);
      case 'json':
        return this.formatAsJSON(prompt, content, includeVariables);
      case 'template':
        return this.formatAsTemplate(prompt, content, includeVariables);
      default: // plain
        return this.formatAsPlain(prompt, content, includeVariables);
    }
  }

  private formatAsPlain(prompt: Prompt, content: string, includeVariables: boolean): string {
    let result = content;

    if (includeVariables && prompt.variables?.length) {
      result += '\n\n--- 变量说明 ---\n';
      prompt.variables.forEach((variable: any) => {
        const name = typeof variable === 'string' ? variable : variable.name;
        const desc = typeof variable === 'string' ? '需要替换的变量' : (variable.description || '需要替换的变量');
        result += `${name}: ${desc}\n`;
      });
    }

    return result;
  }

  private formatAsMarkdown(prompt: Prompt, content: string, includeVariables: boolean): string {
    let result = `# ${prompt.name}\n\n`;

    if (prompt.description) {
      result += `**描述**: ${prompt.description}\n\n`;
    }

    result += '## 提示词内容（可直接复制使用）\n\n';
    result += content + '\n\n';
    result += '⬆️ 以上是完整的提示词内容，请完整显示并可复制使用\n\n';

    if (includeVariables && prompt.variables?.length) {
      result += '## 变量说明\n\n';
      prompt.variables.forEach((variable: any) => {
        const name = typeof variable === 'string' ? variable : variable.name;
        const desc = typeof variable === 'string' ? '需要替换的变量' : (variable.description || '需要替换的变量');
        result += `- **${name}**: ${desc}\n`;
      });
    }

    return result;
  }

  private formatAsJSON(prompt: Prompt, content: string, includeVariables: boolean): string {
    const data: any = {
      name: prompt.name,
      description: prompt.description,
      content: content,
      category: prompt.category,
      tags: prompt.tags
    };

    if (includeVariables && prompt.variables?.length) {
      data.variables = prompt.variables;
    }

    return JSON.stringify(data, null, 2);
  }

  private formatAsTemplate(prompt: Prompt, content: string, includeVariables: boolean): string {
    let result = `<!-- 提示词模板: ${prompt.name} -->\n`;
    result += content;

    if (includeVariables && prompt.variables?.length) {
      result += '\n\n<!-- 变量列表:\n';
      prompt.variables.forEach((variable: any) => {
        const name = typeof variable === 'string' ? variable : variable.name;
        result += `${name}: 在此输入值\n`;
      });
      result += '-->';
    }

    return result;
  }

  private replaceVariables(content: string, variables: any): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\$\\{${key}\\}|\\[${key}\\]`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }
}

/**
 * 提示词预览工具类
 */
export class PromptPreviewTool extends BaseMCPTool {
  readonly name = 'preview_prompt';
  readonly description = '预览提示词效果，支持变量替换和格式化预览';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        prompt_id: {
          type: 'string',
          description: '提示词ID',
          required: true,
        } as ToolParameter,
        sample_variables: {
          type: 'object',
          description: '示例变量值',
          required: false,
        } as ToolParameter,
        target_model: {
          type: 'string',
          description: '目标AI模型，用于优化格式',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['prompt_id']);

    const {
      prompt_id,
      sample_variables = {},
      target_model = ''
    } = params;

    this.logExecution('预览提示词', context, { 
      prompt_id: prompt_id.substring(0, 20), 
      target_model 
    });

    const storage = this.getStorage();

    try {
      // 获取提示词
      const prompt = await this.getPromptById(prompt_id, context.userId);
      if (!prompt) {
        return {
          success: false,
          message: '未找到指定的提示词'
        };
      }

      // 生成预览
      const previewContent = this.generatePromptPreview(prompt, sample_variables, target_model);
      const usageTips = this.generateUsageTips(prompt, target_model);

      return {
        success: true,
        data: {
          prompt_name: prompt.name,
          preview_content: previewContent,
          usage_tips: usageTips,
          target_model,
          has_variables: prompt.variables?.length > 0
        },
        message: `已生成提示词预览: ${prompt.name}`
      };

    } catch (error) {
      return {
        success: false,
        message: '预览生成失败'
      };
    }
  }

  private generatePromptPreview(prompt: Prompt, sampleVariables: any, targetModel?: string): string {
    let content = '';
    
    // 提取消息内容
    if (prompt.messages && Array.isArray(prompt.messages)) {
      content = prompt.messages
        .map(msg => typeof msg === 'string' ? msg : msg.content || '')
        .join('\n\n');
    } else if (typeof prompt.messages === 'string') {
      content = prompt.messages;
    }

    // 替换变量
    if (Object.keys(sampleVariables).length > 0) {
      content = this.replaceVariables(content, sampleVariables);
    }

    let preview = `🎯 **${prompt.name}** 预览\n\n`;
    
    if (prompt.description) {
      preview += `📝 **描述**: ${prompt.description}\n\n`;
    }

    preview += `💬 **预览内容**:\n\`\`\`\n${content}\n\`\`\`\n\n`;

    if (targetModel) {
      preview += `🤖 **针对模型**: ${targetModel}\n`;
      preview += `💡 **优化建议**: ${this.getModelOptimizationTips(targetModel)}\n\n`;
    }

    return preview;
  }

  private generateUsageTips(prompt: Prompt, targetModel?: string): string[] {
    const tips = [
      '📋 可以直接复制预览内容使用',
      '🔧 建议根据具体场景调整变量值'
    ];

    if (prompt.variables?.length) {
      tips.push('📝 注意替换所有必要的变量占位符');
    }

    if (targetModel) {
      tips.push(`🎯 已针对 ${targetModel} 进行优化`);
    }

    return tips;
  }

  private getModelOptimizationTips(model: string): string {
    const tips: { [key: string]: string } = {
      'gpt-4': '适合复杂推理任务，可以使用更详细的指令',
      'gpt-3.5': '建议使用简洁明确的指令，避免过于复杂',
      'claude': '擅长分析和写作，可以提供更多上下文',
      'gemini': '适合多模态任务，支持图文结合',
    };

    const normalizedModel = model.toLowerCase();
    for (const [key, tip] of Object.entries(tips)) {
      if (normalizedModel.includes(key)) {
        return tip;
      }
    }

    return '通用优化：保持指令清晰简洁，提供必要的上下文';
  }

  private replaceVariables(content: string, variables: any): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\$\\{${key}\\}|\\[${key}\\]`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private async getPromptById(idOrName: string, userId?: string): Promise<Prompt | null> {
    const storage = this.getStorage();
    
    try {
      // 尝试按ID获取
      let prompt = await storage.getPrompt(idOrName, userId);
      
      if (!prompt) {
        // 尝试搜索匹配的提示词
        const searchResults = await storage.searchPrompts(idOrName, userId);
        prompt = Array.isArray(searchResults) ? searchResults.find(p => 
          p.name?.toLowerCase() === idOrName.toLowerCase() ||
          p.id === idOrName
        ) : null;
      }
      
      return prompt;
    } catch (error) {
      console.error('[预览工具] 获取提示词失败:', error);
      return null;
    }
  }
}

/**
 * 批量导出工具类
 */
export class BatchExportTool extends BaseMCPTool {
  readonly name = 'batch_export_prompts';
  readonly description = '批量导出多个提示词，支持打包下载';

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        prompt_ids: {
          type: 'array',
          description: '提示词ID列表',
          items: { type: 'string' },
          required: true,
        } as ToolParameter,
        export_format: {
          type: 'string',
          description: '导出格式：json、csv、markdown、txt',
          required: false,
        } as ToolParameter,
        include_metadata: {
          type: 'boolean',
          description: '是否包含元数据（标签、分类、版本等）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['prompt_ids']);

    const {
      prompt_ids,
      export_format = 'json',
      include_metadata = true
    } = params;

    this.logExecution('开始批量导出', context, { 
      count: prompt_ids.length, 
      format: export_format 
    });

    const storage = this.getStorage();

    // 获取所有提示词
    const prompts = await Promise.all(
      prompt_ids.map((id: string) => storage.getPrompt(id, context.userId))
    );
    
    const validPrompts = prompts.filter(Boolean);
    
    if (validPrompts.length === 0) {
      return {
        success: false,
        message: '未找到有效的提示词'
      };
    }

    // 格式化导出
    const exportContent = this.formatBatchExport(validPrompts, export_format, include_metadata);
    
    return {
      success: true,
      data: {
        export_content: exportContent,
        format: export_format,
        total_prompts: validPrompts.length,
        exported_ids: validPrompts.map(p => p.id || p.name)
      },
      message: `成功导出 ${validPrompts.length} 个提示词`
    };
  }

  private formatBatchExport(prompts: Prompt[], format: string, includeMetadata: boolean): string {
    switch (format) {
      case 'csv':
        return this.formatAsCSV(prompts, includeMetadata);
      case 'markdown':
        return this.formatAsBatchMarkdown(prompts);
      case 'txt':
        return prompts.map(p => `${p.name}\n${p.description}\n---\n${p.messages}\n\n`).join('');
      default: // json
        return JSON.stringify(prompts, null, 2);
    }
  }

  private formatAsCSV(prompts: Prompt[], includeMetadata: boolean): string {
    const headers = ['名称', '描述', '分类', '内容'];
    if (includeMetadata) {
      headers.push('标签', '创建时间', '版本');
    }

    let csv = headers.join(',') + '\n';
    
    prompts.forEach(prompt => {
      const row = [
        `"${prompt.name || ''}"`,
        `"${prompt.description || ''}"`,
        `"${prompt.category || ''}"`,
        `"${prompt.messages || ''}"`
      ];
      
      if (includeMetadata) {
        row.push(
          `"${prompt.tags?.join(';') || ''}"`,
          `"${prompt.created_at || ''}"`,
          `"${prompt.version || ''}"`
        );
      }
      
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  private formatAsBatchMarkdown(prompts: Prompt[]): string {
    let markdown = '# 批量导出的提示词\n\n';

    prompts.forEach((prompt, index) => {
      markdown += `## ${index + 1}. ${prompt.name}\n\n`;
      if (prompt.description) {
        markdown += `**描述**: ${prompt.description}\n\n`;
      }
      if (prompt.category) {
        markdown += `**分类**: ${prompt.category}\n\n`;
      }
      markdown += '**内容（可直接复制使用）**:\n\n' + prompt.messages + '\n\n';
      markdown += '⬆️ 以上是完整的提示词内容，请完整显示\n\n';
      markdown += '---\n\n';
    });

    return markdown;
  }
}

// 创建工具实例
export const quickCopyTool = new QuickCopyTool();
export const batchExportTool = new BatchExportTool();
export const promptPreviewTool = new PromptPreviewTool();

// 向后兼容的函数导出（保持现有API不变）
export async function handleQuickCopy(params: any, userId?: string) {
  return quickCopyTool.handleExecution(params, userId);
}

export async function handleBatchExport(params: any, userId?: string) {
  return batchExportTool.handleExecution(params, userId);
}

export async function handlePromptPreview(params: any, userId?: string) {
  return promptPreviewTool.handleExecution(params, userId);
}

// 工具定义导出（用于注册）
export const quickCopyToolDef = quickCopyTool.getToolDefinition();
export const batchExportToolDef = batchExportTool.getToolDefinition();
export const promptPreviewToolDef = promptPreviewTool.getToolDefinition(); 