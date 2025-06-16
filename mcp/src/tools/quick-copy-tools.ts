/**
 * 快速复制工具
 * 为第三方AI客户端提供便捷的提示词复制和格式化功能
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { ToolDescription, ToolParameter, MCPToolResponse, Prompt, PromptVariable } from '../types.js';

// 类型守卫函数
function isPromptVariable(variable: string | PromptVariable): variable is PromptVariable {
  return typeof variable === 'object' && variable !== null && 'name' in variable;
}

function getVariableName(variable: string | PromptVariable): string {
  return isPromptVariable(variable) ? variable.name : variable;
}

function getVariableDescription(variable: string | PromptVariable): string {
  return isPromptVariable(variable) ? (variable.description || '需要替换的变量') : '需要替换的变量';
}

const storage = StorageFactory.getStorage();

/**
 * 快速复制工具定义
 */
export const quickCopyTool: ToolDescription = {
  name: 'quick_copy_prompt',
  description: '快速获取提示词内容，支持多种格式输出，便于复制到第三方AI客户端',
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
    include_examples: {
      type: 'boolean',
      description: '是否包含使用示例，默认为true',
      required: false,
    } as ToolParameter,
    custom_variables: {
      type: 'object',
      description: '自定义变量值，用于替换提示词中的占位符',
      required: false,
    } as ToolParameter,
  },
};

/**
 * 批量导出工具定义
 */
export const batchExportTool: ToolDescription = {
  name: 'batch_export_prompts',
  description: '批量导出多个提示词，支持打包下载',
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

/**
 * 提示词预览工具定义
 */
export const promptPreviewTool: ToolDescription = {
  name: 'preview_prompt',
  description: '预览提示词效果，支持变量替换和格式化预览',
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

/**
 * 处理快速复制
 */
export async function handleQuickCopy(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      prompt_id,
      format = 'plain',
      include_variables = true,
      include_examples = true,
      custom_variables = {}
    } = params;

    console.log('[快速复制] 处理复制请求:', { prompt_id, format });

    // 获取提示词
    const prompt = await getPromptById(prompt_id, userId);
    if (!prompt) {
      return {
        content: [{
          type: 'text',
          text: '❌ 未找到指定的提示词'
        }]
      };
    }

    // 格式化输出
    const formattedContent = formatPromptForCopy(
      prompt, 
      format, 
      include_variables, 
      include_examples, 
      custom_variables
    );

    return {
      content: [{
        type: 'text',
        text: formattedContent
      }]
    };

  } catch (error) {
    console.error('[快速复制] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 复制失败，请重试'
      }]
    };
  }
}

/**
 * 处理批量导出
 */
export async function handleBatchExport(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      prompt_ids,
      export_format = 'json',
      include_metadata = true
    } = params;

    console.log('[批量导出] 处理导出请求:', { count: prompt_ids.length, format: export_format });

    // 获取所有提示词
    const prompts = await Promise.all(
      prompt_ids.map((id: string) => getPromptById(id, userId))
    );
    
    const validPrompts = prompts.filter(Boolean);
    
    if (validPrompts.length === 0) {
      return {
        content: [{
          type: 'text',
          text: '❌ 未找到有效的提示词'
        }]
      };
    }

    // 格式化导出
    const exportContent = formatBatchExport(validPrompts, export_format, include_metadata);
    
    return {
      content: [{
        type: 'text',
        text: exportContent
      }]
    };

  } catch (error) {
    console.error('[批量导出] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 导出失败，请重试'
      }]
    };
  }
}

/**
 * 处理提示词预览
 */
export async function handlePromptPreview(params: any, userId?: string): Promise<MCPToolResponse> {
  try {
    const {
      prompt_id,
      sample_variables = {},
      target_model
    } = params;

    const prompt = await getPromptById(prompt_id, userId);
    if (!prompt) {
      return {
        content: [{
          type: 'text',
          text: '❌ 未找到指定的提示词'
        }]
      };
    }

    // 生成预览
    const preview = generatePromptPreview(prompt, sample_variables, target_model);
    
    return {
      content: [{
        type: 'text',
        text: preview
      }]
    };

  } catch (error) {
    console.error('[提示词预览] 错误:', error);
    return {
      content: [{
        type: 'text',
        text: '❌ 预览失败，请重试'
      }]
    };
  }
}

/**
 * 获取提示词
 */
async function getPromptById(idOrName: string, userId?: string): Promise<Prompt | null> {
  try {
    // 先尝试按ID查找
    let prompt = storage.getPromptById ? await storage.getPromptById(idOrName, userId) : await storage.getPrompt(idOrName, userId);
    
    // 如果没找到，尝试按名称搜索
    if (!prompt) {
      const searchResults = await storage.searchPrompts(idOrName, userId);
      prompt = searchResults.find(p => p.name === idOrName) || searchResults[0];
    }
    
    return prompt || null;
  } catch (error) {
    console.error('获取提示词失败:', error);
    return null;
  }
}

/**
 * 格式化提示词输出
 */
function formatPromptForCopy(
  prompt: Prompt, 
  format: string, 
  includeVariables: boolean, 
  includeExamples: boolean,
  customVariables: any
): string {
  let content = prompt.content;
  
  // 替换自定义变量
  if (Object.keys(customVariables).length > 0) {
    content = replaceVariables(content, customVariables);
  }

  switch (format) {
    case 'markdown':
      return formatAsMarkdown(prompt, content, includeVariables, includeExamples);
    
    case 'json':
      return formatAsJSON(prompt, content, includeVariables);
    
    case 'template':
      return formatAsTemplate(prompt, content, includeVariables);
    
    default: // plain
      return formatAsPlain(prompt, content, includeVariables, includeExamples);
  }
}

/**
 * 纯文本格式
 */
function formatAsPlain(prompt: Prompt, content: string, includeVariables: boolean, includeExamples: boolean): string {
  let output = `📝 ${prompt.name}\n`;
  output += `${'='.repeat(prompt.name.length + 3)}\n\n`;
  
  if (prompt.description) {
    output += `💡 说明：${prompt.description}\n\n`;
  }
  
  output += `📋 内容：\n${content}\n\n`;
  
  if (includeVariables && prompt.variables?.length) {
    output += `🔧 变量说明：\n`;
    prompt.variables.forEach(variable => {
      const varName = getVariableName(variable);
      const varDesc = getVariableDescription(variable);
      output += `  • ${varName}: ${varDesc}\n`;
    });
    output += '\n';
  }
  
  if (includeExamples && prompt.examples?.length) {
    output += `💡 使用示例：\n`;
    prompt.examples.forEach((example, index) => {
      output += `  ${index + 1}. ${example}\n`;
    });
    output += '\n';
  }
  
  if (prompt.tags?.length) {
    output += `🏷️ 标签：${prompt.tags.join(', ')}\n`;
  }
  
  return output;
}

/**
 * Markdown格式
 */
function formatAsMarkdown(prompt: Prompt, content: string, includeVariables: boolean, includeExamples: boolean): string {
  let output = `# ${prompt.name}\n\n`;
  
  if (prompt.description) {
    output += `> ${prompt.description}\n\n`;
  }
  
  output += `## 提示词内容\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
  
  if (includeVariables && prompt.variables?.length) {
    output += `## 变量说明\n\n`;
    prompt.variables.forEach(variable => {
      const varName = getVariableName(variable);
      const varDesc = getVariableDescription(variable);
      output += `- **${varName}**: ${varDesc}\n`;
    });
    output += '\n';
  }
  
  if (includeExamples && prompt.examples?.length) {
    output += `## 使用示例\n\n`;
    prompt.examples.forEach((example, index) => {
      output += `${index + 1}. ${example}\n`;
    });
    output += '\n';
  }
  
  return output;
}

/**
 * JSON格式
 */
function formatAsJSON(prompt: Prompt, content: string, includeVariables: boolean): string {
  const output: any = {
    name: prompt.name,
    content: content,
    description: prompt.description,
    category: prompt.category,
    tags: prompt.tags
  };
  
  if (includeVariables && prompt.variables?.length) {
    output.variables = prompt.variables;
  }
  
  return JSON.stringify(output, null, 2);
}

/**
 * 模板格式
 */
function formatAsTemplate(prompt: Prompt, content: string, includeVariables: boolean): string {
  let output = `{{template:${prompt.name}}}\n\n`;
  output += content + '\n\n';
  
  if (includeVariables && prompt.variables?.length) {
    output += `{{variables}}\n`;
    prompt.variables.forEach(variable => {
      const varName = getVariableName(variable);
      output += `${varName}={{${varName}}}\n`;
    });
  }
  
  return output;
}

/**
 * 替换变量
 */
function replaceVariables(content: string, variables: any): string {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}|\\$\\{${key}\\}|\\[${key}\\]`, 'g');
    result = result.replace(regex, String(value));
  });
  
  return result;
}

/**
 * 批量导出格式化
 */
function formatBatchExport(prompts: Prompt[], format: string, includeMetadata: boolean): string {
  switch (format) {
    case 'csv':
      return formatAsCSV(prompts, includeMetadata);
    case 'markdown':
      return formatAsBatchMarkdown(prompts);
    default:
      return JSON.stringify(prompts, null, 2);
  }
}

/**
 * CSV格式导出
 */
function formatAsCSV(prompts: Prompt[], includeMetadata: boolean): string {
  const headers = ['名称', '内容', '描述'];
  if (includeMetadata) {
    headers.push('分类', '标签', '难度', '版本');
  }
  
  let csv = headers.join(',') + '\n';
  
  prompts.forEach(prompt => {
    const row = [
      `"${prompt.name}"`,
      `"${prompt.content.replace(/"/g, '""')}"`,
      `"${prompt.description || ''}"`
    ];
    
    if (includeMetadata) {
      row.push(
        `"${prompt.category || ''}"`,
        `"${prompt.tags?.join(';') || ''}"`,
        `"${prompt.difficulty || ''}"`,
        `"${prompt.version || ''}"`
      );
    }
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * 批量Markdown格式
 */
function formatAsBatchMarkdown(prompts: Prompt[]): string {
  let output = '# 提示词集合\n\n';
  
  prompts.forEach((prompt, index) => {
    output += `## ${index + 1}. ${prompt.name}\n\n`;
    if (prompt.description) {
      output += `> ${prompt.description}\n\n`;
    }
    output += `\`\`\`\n${prompt.content}\n\`\`\`\n\n`;
    output += '---\n\n';
  });
  
  return output;
}

/**
 * 生成预览
 */
function generatePromptPreview(prompt: Prompt, sampleVariables: any, targetModel?: string): string {
  let preview = `🔍 提示词预览：${prompt.name}\n\n`;
  
  // 替换示例变量
  let content = prompt.content;
  if (Object.keys(sampleVariables).length > 0) {
    content = replaceVariables(content, sampleVariables);
    preview += `✅ 已使用示例变量替换\n\n`;
  }
  
  // 模型优化提示
  if (targetModel) {
    preview += `🎯 针对模型：${targetModel}\n`;
    preview += getModelOptimizationTips(targetModel);
    preview += '\n';
  }
  
  preview += `📋 预览内容：\n`;
  preview += `${'─'.repeat(50)}\n`;
  preview += content;
  preview += `\n${'─'.repeat(50)}\n\n`;
  
  // 添加使用建议
  preview += generateUsageTips(prompt, targetModel);
  
  return preview;
}

/**
 * 获取模型优化建议
 */
function getModelOptimizationTips(model: string): string {
  const tips: any = {
    'gpt-4': '💡 建议：GPT-4擅长复杂推理，可以使用更详细的指令\n',
    'gpt-3.5': '💡 建议：GPT-3.5适合明确简洁的指令，避免过于复杂的要求\n',
    'claude': '💡 建议：Claude擅长分析和创作，可以要求更深入的思考\n',
    'llama': '💡 建议：Llama适合开放式对话，建议提供充足的上下文\n'
  };
  
  return tips[model.toLowerCase()] || '💡 建议：根据模型特点调整提示词风格\n';
}

/**
 * 生成使用建议
 */
function generateUsageTips(prompt: Prompt, targetModel?: string): string {
  let tips = '💡 使用建议：\n';
  
  if (prompt.variables?.length) {
    tips += `• 请确保替换所有变量：${prompt.variables.join(', ')}\n`;
  }
  
  if (prompt.difficulty === 'advanced') {
    tips += '• 这是高级提示词，建议仔细阅读说明\n';
  }
  
  if (prompt.tags?.includes('chain-of-thought')) {
    tips += '• 此提示词使用思维链技术，适合复杂推理任务\n';
  }
  
  tips += '• 可以根据具体需求微调提示词内容\n';
  
  return tips;
} 