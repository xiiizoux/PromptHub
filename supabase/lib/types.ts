/**
 * 共享类型定义
 * 这个文件包含MCP服务和Web服务之间共享的类型定义
 */

// 用户相关类型
export interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
}

// =============================================
// JSONB 数据结构类型定义
// =============================================

// 提示词内容 JSONB 结构 (Context Engineering)
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
  // 向后兼容：如果是从旧的 TEXT 格式迁移过来的
  legacy_content?: string;
  migrated_at?: string;
}

// 分类优化模板 JSONB 结构
export interface OptimizationTemplateJsonb {
  type: 'legacy_text' | 'structured' | 'context_engineering';
  template?: string;
  structure?: {
    system_prompt?: string;
    optimization_rules?: any[];
    context_variables?: Record<string, any>;
    adaptation_strategies?: Record<string, any>;
  };
  // Context Engineering 扩展
  context_engineering?: {
    dynamic_adaptation?: boolean;
    user_context_integration?: boolean;
    example_selection_strategy?: string;
    tool_integration?: boolean;
  };
  migrated_at?: string;
}

// 分类类型枚举
export type CategoryType = 'chat' | 'image' | 'video';

// 分类接口
export interface Category {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  type: CategoryType;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  optimization_template?: OptimizationTemplateJsonb | null;
}

// 提示词相关类型
export interface Prompt {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  variables?: string[];
  // JSONB 内容字段 - 支持 Context Engineering
  content: PromptContentJsonb | string;  // 支持新的 JSONB 格式和向后兼容的字符串格式
  user_id?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  version?: number;
  author?: string;
  rating?: number;
  usageCount?: number;

  // 扩展字段以匹配数据库 schema
  category_id?: string;
  category_type?: CategoryType;
  allow_collaboration?: boolean;
  edit_permission?: 'owner' | 'collaborators' | 'public';
  created_by?: string;
  last_modified_by?: string;
  view_count?: number;
  input_variables?: any[] | string[];
  compatible_models?: string[];
  template_format?: string;
  preview_asset_url?: string;
  parameters?: Record<string, any>;
  migration_status?: string;

  // Context Engineering 字段
  context_engineering_enabled?: boolean;
  context_variables?: Record<string, any>;
  adaptation_rules?: any[];
  effectiveness_score?: number;
}

// 提示词版本相关类型
export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  description: string;
  category: string;
  tags: string[];
  variables?: string[];
  // JSONB 内容字段
  content: PromptContentJsonb | string;  // 支持新的 JSONB 格式和向后兼容
  created_at: string;
  user_id?: string;

  // 扩展字段
  category_id?: string;
  preview_asset_url?: string;
  parameters?: Record<string, any>;
}

// API密钥相关类型
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

// 认证相关类型
export interface AuthResponse {
  user: User | null;
  token?: string;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 提示词过滤器类型
export interface PromptFilters {
  category?: string;
  category_type?: CategoryType;  // 新增：按分类类型筛选
  tags?: string[];
  search?: string;
  userId?: string;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular' | 'rating';
}

// =============================================
// JSONB 数据转换结果类型
// =============================================

// 内容转换结果
export interface ContentConversionResult {
  success: boolean;
  data?: PromptContentJsonb;
  isLegacy?: boolean;
  error?: string;
}

// 优化模板转换结果
export interface OptimizationTemplateConversionResult {
  success: boolean;
  data?: OptimizationTemplateJsonb | null;
  isLegacy?: boolean;
  error?: string;
}

// =============================================
// 数据转换工具类型
// =============================================

// 内容转换结果
export interface ContentConversionResult {
  success: boolean;
  data?: PromptContentJsonb;
  error?: string;
  isLegacy?: boolean;
}

// 优化模板转换结果
export interface OptimizationTemplateConversionResult {
  success: boolean;
  data?: OptimizationTemplateJsonb;
  error?: string;
  isLegacy?: boolean;
}

// 提示词使用统计类型
export interface PromptUsage {
  usage_id: string;
  prompt_id: string;
  user_id?: string;
  session_id: string;
  input_tokens?: number;
  output_tokens?: number;
  duration_ms?: number;
  created_at: string;
  model?: string;
}

// 提示词反馈类型
export interface PromptFeedback {
  id: string;
  usage_id: string;
  prompt_id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  categories?: string[];
  created_at: string;
}

// 提示词性能数据类型
export interface PromptPerformance {
  prompt_id: string;
  average_rating?: number;
  total_usages?: number;
  average_tokens?: number;
  average_duration_ms?: number;
  usage_by_day?: Record<string, number>;
  ratings_distribution?: Record<string, number>;
}
