/**
 * MCP JSONB 数据处理工具函数
 * 与 supabase/lib/jsonb-utils.ts 保持同步
 */

import { 
  PromptContentJsonb, 
  OptimizationTemplateJsonb,
  ContentConversionResult,
  OptimizationTemplateConversionResult
} from '../types.js';

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
    ['context_engineering', 'simple_template'].includes(template.type)
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
      return template.base_template || '';
    case 'simple_template':
      return template.template_content || '';
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
      type: 'simple_template',
      template_content: template,
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
    base_template: '',
    context_adaptation: {
      task_analysis: {
        complexity_assessment: true,
        domain_identification: true,
        user_intent_analysis: true
      },
      dynamic_examples: {
        example_selection_strategy: 'relevance',
        max_examples: 3,
        context_aware_filtering: true
      },
      tool_integration: {
        available_tools: [],
        tool_selection_criteria: 'task_relevance',
        dynamic_tool_binding: true
      },
      state_management: {
        conversation_tracking: true,
        preference_learning: true,
        context_persistence: true
      }
    },
    migrated_at: new Date().toISOString()
  };
}
