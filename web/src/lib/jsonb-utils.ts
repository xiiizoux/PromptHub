/**
 * Web JSONB 数据处理工具函数
 * 与 mcp/src/utils/jsonb-utils.ts 和 supabase/lib/jsonb-utils.ts 保持同步
 */

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
 * 从 JSONB 优化模板中提取模板文本
 */
export function extractTemplateFromJsonb(template: OptimizationTemplateJsonb | string): string {
  if (typeof template === 'string') {
    return template;
  }

  if (!isJsonbTemplate(template)) {
    return '';
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
        data: content
      };
    }

    const jsonbContent: PromptContentJsonb = {
      type: 'simple_text',
      static_content: content,
      migrated_at: new Date().toISOString()
    };

    return {
      success: true,
      data: jsonbContent
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败',
      data: content
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
        data: template
      };
    }

    const jsonbTemplate: OptimizationTemplateJsonb = {
      type: 'legacy_text',
      template: template,
      migrated_at: new Date().toISOString()
    };

    return {
      success: true,
      data: jsonbTemplate
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败',
      data: template
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
        example_pool: []
      },
      tools: {
        available_tools: [],
        tool_selection_criteria: 'task_relevance'
      },
      state: {
        conversation_history: [],
        user_preferences: {},
        context_variables: {}
      }
    },
    migrated_at: new Date().toISOString()
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
      adaptation_strategies: {}
    },
    context_engineering: {
      dynamic_adaptation: true,
      user_context_integration: true,
      example_selection_strategy: 'relevance',
      tool_integration: true
    },
    migrated_at: new Date().toISOString()
  };
}