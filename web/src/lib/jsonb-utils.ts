/**
 * Web JSONB 数据处理工具函数
 * 与 mcp/src/utils/jsonb-utils.ts 和 supabase/lib/jsonb-utils.ts 保持同步
 */

import { getOptimizationSystemTemplate } from '@/constants/system-templates';

// 共享类型定义
export interface PromptContentJsonb {
  type: 'context_engineering' | 'legacy_text' | 'simple_text';
  static_content?: string;
  dynamic_context?: {
    adaptation_rules?: Record<string, any>;
    examples?: {
      selection_strategy?: string;
      max_examples?: number;
      example_pool?: any[];
    };
    tools?: {
      available_tools?: any[];
      tool_selection_criteria?: string;
    };
    state?: {
      conversation_history?: any[];
      user_preferences?: Record<string, any>;
      context_variables?: Record<string, any>;
    };
  };
  legacy_content?: string;
  migrated_at?: string;
}

export interface OptimizationTemplateJsonb {
  type: 'legacy_text' | 'structured' | 'context_engineering';
  template?: string;
  structure?: {
    system_prompt?: string;
    optimization_rules?: any[];
    context_variables?: Record<string, any>;
    adaptation_strategies?: Record<string, any>;
  };
  context_engineering?: {
    dynamic_adaptation?: boolean;
    user_context_integration?: boolean;
    example_selection_strategy?: string;
    tool_integration?: boolean;
  };
  migrated_at?: string;
}

export interface ContentConversionResult {
  success: boolean;
  data: PromptContentJsonb | string;
  error?: string;
}

export interface OptimizationTemplateConversionResult {
  success: boolean;
  data: OptimizationTemplateJsonb | string;
  error?: string;
}

/**
 * System+User模板结构接口
 */
export interface SystemUserTemplate {
  system: string;
  user: string;
}

/**
 * 检查是否为 JSONB 内容格式
 */
export function isJsonbContent(content: any): content is PromptContentJsonb {
  return (
    typeof content === 'object' &&
    content !== null &&
    typeof content.type === 'string' &&
    ['context_engineering', 'legacy_text', 'simple_text'].includes(content.type)
  );
}

/**
 * 检查是否为 JSONB 优化模板格式
 */
export function isJsonbTemplate(template: any): template is OptimizationTemplateJsonb {
  return (
    typeof template === 'object' &&
    template !== null &&
    typeof template.type === 'string' &&
    ['legacy_text', 'structured', 'context_engineering'].includes(template.type)
  );
}

/**
 * 从 JSONB 内容中提取可编辑的文本
 */
export function extractContentFromJsonb(content: PromptContentJsonb | string): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!isJsonbContent(content)) {
    return '';
  }

  switch (content.type) {
    case 'context_engineering':
      return content.static_content || '';
    case 'legacy_text':
      return content.legacy_content || '';
    case 'simple_text':
      return content.static_content || '';
    default:
      return '';
  }
}

/**
 * 从JSONB优化模板中提取System和User角色模板
 * System角色使用硬编码模板，User角色从数据库提取
 */
export function extractSystemUserTemplate(template: any): SystemUserTemplate {
  // System角色始终使用硬编码模板
  const systemTemplate = getOptimizationSystemTemplate();

  if (!template) {
    return {
      system: systemTemplate,
      user: '',
    };
  }

  let templateObj = template;

  // 如果是字符串，先尝试解析
  if (typeof template === 'string') {
    try {
      templateObj = JSON.parse(template);
    } catch {
      // 如果解析失败，作为user模板返回
      return {
        system: systemTemplate,
        user: template,
      };
    }
  }

  // 如果不是对象，作为user模板返回
  if (typeof templateObj !== 'object' || templateObj === null) {
    return {
      system: systemTemplate,
      user: String(template),
    };
  }

  // 提取User角色模板
  let userTemplate = '';

  // 优先使用user字段（当前格式）
  if (templateObj.user) {
    userTemplate = templateObj.user;
  }
  // 兼容user_template字段（迁移过程中的临时格式）
  else if (templateObj.user_template) {
    userTemplate = templateObj.user_template;
  }
  // 兼容旧格式：从legacy结构中提取
  else if (templateObj.template) {
    userTemplate = templateObj.template;
  } else if (templateObj.structure?.system_prompt) {
    userTemplate = templateObj.structure.system_prompt;
  } else if (templateObj.system_prompt) {
    userTemplate = templateObj.system_prompt;
  } else {
    userTemplate = JSON.stringify(templateObj);
  }

  return {
    system: systemTemplate,
    user: userTemplate,
  };
}

/**
 * 从 JSONB 优化模板中提取模板文本（向后兼容）
 */
export function extractTemplateFromJsonb(template: OptimizationTemplateJsonb | string): string {
  if (typeof template === 'string') {
    return template;
  }

  if (!isJsonbTemplate(template)) {
    // 尝试提取System+User结构
    const systemUser = extractSystemUserTemplate(template);
    if (systemUser.system) {
      return `${systemUser.system}\n\n${systemUser.user}`;
    }
    return systemUser.user;
  }

  switch (template.type) {
    case 'context_engineering':
    case 'structured':
    case 'legacy_text':
      return template.template || '';
    default:
      return '';
  }
}

/**
 * 安全转换字符串为 JSONB 内容格式
 */
export function safeConvertPromptContent(content: string): ContentConversionResult {
  try {
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: '内容不能为空',
        data: content,
      };
    }

    const jsonbContent: PromptContentJsonb = {
      type: 'simple_text',
      static_content: content,
      migrated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: jsonbContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败',
      data: content,
    };
  }
}

/**
 * 安全转换字符串为 JSONB 优化模板格式
 */
export function safeConvertOptimizationTemplate(template: string): OptimizationTemplateConversionResult {
  try {
    if (!template || typeof template !== 'string') {
      return {
        success: false,
        error: '模板不能为空',
        data: template,
      };
    }

    const jsonbTemplate: OptimizationTemplateJsonb = {
      type: 'legacy_text',
      template: template,
      migrated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: jsonbTemplate,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败',
      data: template,
    };
  }
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
        selection_strategy: 'relevance',
        max_examples: 3,
        example_pool: [],
      },
      tools: {
        available_tools: [],
        tool_selection_criteria: 'task_relevance',
      },
      state: {
        conversation_history: [],
        user_preferences: {},
        context_variables: {},
      },
    },
    migrated_at: new Date().toISOString(),
  };
}

/**
 * 创建空的 Context Engineering 优化模板结构
 */
export function createEmptyContextEngineeringTemplate(): OptimizationTemplateJsonb {
  return {
    type: 'context_engineering',
    template: '',
    structure: {
      system_prompt: '',
      optimization_rules: [],
      context_variables: {},
      adaptation_strategies: {},
    },
    context_engineering: {
      dynamic_adaptation: true,
      user_context_integration: true,
      example_selection_strategy: 'relevance',
      tool_integration: true,
    },
    migrated_at: new Date().toISOString(),
  };
}