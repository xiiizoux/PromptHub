/**
 * JSONB 数据转换工具函数
 * 用于处理 prompts.content 和 categories.optimization_template 字段的 JSONB 格式转换
 * 确保向后兼容性和数据完整性
 */

import type { 
  PromptContentJsonb, 
  OptimizationTemplateJsonb,
  ContentConversionResult,
  OptimizationTemplateConversionResult
} from './types.js';

// =============================================
// 提示词内容转换工具
// =============================================

/**
 * 将字符串内容转换为 JSONB 格式
 */
export function convertStringToPromptContentJsonb(content: string): PromptContentJsonb {
  // 检查是否已经是 JSON 格式
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type && (parsed.static_content !== undefined || parsed.dynamic_context !== undefined)) {
        return parsed as PromptContentJsonb;
      }
    } catch (error) {
      // 如果解析失败，继续作为普通字符串处理
    }
  }

  // 转换为 Context Engineering 格式
  return {
    type: 'legacy_text',
    static_content: content,
    dynamic_context: {
      adaptation_rules: {},
      examples: {
        selection_strategy: 'similarity_based',
        max_examples: 3,
        example_pool: []
      },
      tools: {
        available_tools: [],
        tool_selection_criteria: 'task_based'
      },
      state: {
        conversation_history: [],
        user_preferences: {},
        context_variables: {}
      }
    },
    legacy_content: content,
    migrated_at: new Date().toISOString()
  };
}

/**
 * 从 JSONB 格式提取可显示的字符串内容
 */
export function extractContentFromJsonb(content: PromptContentJsonb | string): string {
  if (typeof content === 'string') {
    return content;
  }

  // 优先返回静态内容
  if (content.static_content) {
    return content.static_content;
  }

  // 如果有遗留内容，返回遗留内容
  if (content.legacy_content) {
    return content.legacy_content;
  }

  // 如果是 Context Engineering 格式但没有静态内容，尝试构建内容
  if (content.type === 'context_engineering' && content.dynamic_context) {
    return '[Context Engineering Prompt - Dynamic Content]';
  }

  // 最后的备选方案
  return JSON.stringify(content, null, 2);
}

/**
 * 安全地转换内容，包含错误处理
 */
export function safeConvertPromptContent(content: any): ContentConversionResult {
  try {
    if (!content) {
      return {
        success: false,
        error: 'Content is null or undefined'
      };
    }

    if (typeof content === 'string') {
      return {
        success: true,
        data: convertStringToPromptContentJsonb(content),
        isLegacy: true
      };
    }

    if (typeof content === 'object') {
      // 验证 JSONB 结构
      if (content.type && (content.static_content !== undefined || content.dynamic_context !== undefined)) {
        return {
          success: true,
          data: content as PromptContentJsonb,
          isLegacy: false
        };
      }
    }

    // 如果不是预期格式，尝试转换为字符串再处理
    const stringContent = JSON.stringify(content);
    return {
      success: true,
      data: convertStringToPromptContentJsonb(stringContent),
      isLegacy: true
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error'
    };
  }
}

// =============================================
// 优化模板转换工具
// =============================================

/**
 * 将字符串模板转换为 JSONB 格式
 */
export function convertStringToOptimizationTemplateJsonb(template: string): OptimizationTemplateJsonb {
  // 检查是否已经是 JSON 格式
  if (template.trim().startsWith('{') && template.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(template);
      if (parsed.type && (parsed.template !== undefined || parsed.structure !== undefined)) {
        return parsed as OptimizationTemplateJsonb;
      }
    } catch (error) {
      // 如果解析失败，继续作为普通字符串处理
    }
  }

  // 转换为结构化格式
  return {
    type: 'legacy_text',
    template: template,
    structure: {
      system_prompt: template,
      optimization_rules: [],
      context_variables: {},
      adaptation_strategies: {}
    },
    migrated_at: new Date().toISOString()
  };
}

/**
 * 从优化模板 JSONB 格式提取可用的模板字符串
 */
export function extractTemplateFromJsonb(template: OptimizationTemplateJsonb | string): string {
  if (typeof template === 'string') {
    return template;
  }

  // 优先返回模板字段
  if (template.template) {
    return template.template;
  }

  // 如果有结构化数据，返回系统提示
  if (template.structure?.system_prompt) {
    return template.structure.system_prompt;
  }

  // 最后的备选方案
  return JSON.stringify(template, null, 2);
}

/**
 * 安全地转换优化模板，包含错误处理
 */
export function safeConvertOptimizationTemplate(template: any): OptimizationTemplateConversionResult {
  try {
    if (!template) {
      return {
        success: true,
        data: null,
        isLegacy: false
      };
    }

    if (typeof template === 'string') {
      return {
        success: true,
        data: convertStringToOptimizationTemplateJsonb(template),
        isLegacy: true
      };
    }

    if (typeof template === 'object') {
      // 验证 JSONB 结构
      if (template.type && (template.template !== undefined || template.structure !== undefined)) {
        return {
          success: true,
          data: template as OptimizationTemplateJsonb,
          isLegacy: false
        };
      }
    }

    // 如果不是预期格式，尝试转换为字符串再处理
    const stringTemplate = JSON.stringify(template);
    return {
      success: true,
      data: convertStringToOptimizationTemplateJsonb(stringTemplate),
      isLegacy: true
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error'
    };
  }
}

// =============================================
// 通用工具函数
// =============================================

/**
 * 检查内容是否为 JSONB 格式
 */
export function isJsonbContent(content: any): content is PromptContentJsonb {
  return typeof content === 'object' && 
         content !== null && 
         content.type && 
         (content.static_content !== undefined || content.dynamic_context !== undefined);
}

/**
 * 检查模板是否为 JSONB 格式
 */
export function isJsonbTemplate(template: any): template is OptimizationTemplateJsonb {
  return typeof template === 'object' && 
         template !== null && 
         template.type && 
         (template.template !== undefined || template.structure !== undefined);
}

/**
 * 创建空的 Context Engineering 内容结构
 */
export function createEmptyContextEngineeringContent(): PromptContentJsonb {
  return {
    type: 'context_engineering',
    static_content: '',
    dynamic_context: {
      adaptation_rules: {},
      examples: {
        selection_strategy: 'similarity_based',
        max_examples: 3,
        example_pool: []
      },
      tools: {
        available_tools: [],
        tool_selection_criteria: 'task_based'
      },
      state: {
        conversation_history: [],
        user_preferences: {},
        context_variables: {}
      }
    }
  };
}

/**
 * 创建空的优化模板结构
 */
export function createEmptyOptimizationTemplate(): OptimizationTemplateJsonb {
  return {
    type: 'structured',
    template: '',
    structure: {
      system_prompt: '',
      optimization_rules: [],
      context_variables: {},
      adaptation_strategies: {}
    }
  };
}
