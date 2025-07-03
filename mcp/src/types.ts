// =============================================
// 共享类型定义 (与 supabase/lib/types.ts 保持同步)
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

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

// 类型已在上面定义，不需要重新导出

// 分类接口 - 扩展共享类型
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

// 媒体参数接口
export interface MediaParameters {
  // 通用参数
  model?: string;
  style?: string;
  resolution?: string;
  quality?: string;
  
  // 图像特定参数
  aspect_ratio?: string;
  steps?: number;
  guidance_scale?: number;
  seed?: number;
  negative_prompt?: string;
  artistic_style?: string;
  
  // 视频特定参数
  duration?: number | string;
  fps?: number;
  motion_strength?: number;
  camera_movement?: string;
  background_music_url?: string;
  
  // 其他自定义参数
  [key: string]: string | number | boolean | undefined;
}

export interface PromptVariable {
  name: string;
  description?: string;
  type?: string;
  default?: string;
}

export interface Prompt {
  id?: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  // JSONB 内容字段 - 支持 Context Engineering
  content: PromptContentJsonb | string;  // 支持新的 JSONB 格式和向后兼容的字符串格式
  created_at?: string;
  updated_at?: string;
  version?: number;
  is_public?: boolean;
  allow_collaboration?: boolean; // 新增：是否允许协作编辑
  edit_permission?: 'owner' | 'collaborators' | 'public'; // 更新：编辑权限级别
  user_id?: string;
  error?: string;  // 添加错误属性，用于存储错误信息
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // 新增：难度级别
  compatible_models?: string[]; // 新增：兼容模型列表
  variables?: string[]; // 新增：模板变量
  improvements?: string[]; // 新增：改进建议
  use_cases?: string[]; // 新增：使用场景
  estimated_tokens?: number; // 新增：预估token数
  usage_count?: number; // 新增：使用次数
  examples?: Array<{
    input: string;
    output: string;
    description?: string;
  }>; // 新增：示例

  // 媒体相关字段
  preview_asset_url?: string; // 预览资源URL（图像或视频）
  parameters?: MediaParameters; // 生成参数（JSON格式）
  category_id?: string; // 分类ID，关联到categories表
  category_type?: CategoryType; // 分类类型，从关联的category获取

  // 扩展字段以匹配数据库 schema
  created_by?: string;
  last_modified_by?: string;
  view_count?: number;
  input_variables?: any[] | string[];
  template_format?: string;
  migration_status?: string;

  // Context Engineering 字段
  context_engineering_enabled?: boolean;
  context_variables?: Record<string, any>;
  adaptation_rules?: any[];
  effectiveness_score?: number;
}

export interface PromptVersion {
  id?: string;
  prompt_id: string;
  version: number;
  // JSONB 内容字段
  content: PromptContentJsonb | string;  // 支持新的 JSONB 格式和向后兼容
  description: string;
  category: string;
  tags: string[];
  created_at?: string;
  user_id?: string;
  // 媒体相关字段
  preview_asset_url?: string;
  parameters?: MediaParameters;
  category_id?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
}

export interface ApiKey {
  id?: string;
  user_id: string;
  name: string;
  key_hash?: string;
  last_used_at?: string;
  created_at?: string;
  expires_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// MCP请求类型
// MCP 请求参数的联合类型
export type McpArguments = 
  | string 
  | number 
  | boolean 
  | string[] 
  | Record<string, unknown> 
  | undefined;

export interface McpRequest {
  params: {
    name: string;
    arguments: McpArguments;
  };
  auth?: Record<string, string>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

// 提示词过滤器接口
export interface PromptFilters {
  category?: string;
  category_type?: CategoryType; // 新增：按分类类型筛选
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular' | 'trending';
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StorageAdapter {
  // 存储适配器类型
  getType(): string;
  
  // 基本提示词管理
  getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>>;
  getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null>;
  createPrompt(prompt: Prompt): Promise<Prompt>;
  updatePrompt(nameOrId: string, prompt: Partial<Prompt>, userId?: string): Promise<Prompt>;
  deletePrompt(nameOrId: string, userId?: string): Promise<boolean>;
  searchPrompts(query: string, userId?: string, includePublic?: boolean): Promise<Prompt[]>;
  
  // 分类管理 - 新增方法
  getCategories(): Promise<string[]>; // 保持向后兼容
  getCategoriesWithType(): Promise<Category[]>; // 新增：获取完整分类信息
  getCategoriesByType(type: CategoryType): Promise<Category[]>; // 新增：按类型获取分类
  
  // 获取所有标签
  getTags(): Promise<string[]>;
  getPromptsByCategory(category: string, userId?: string, includePublic?: boolean, limit?: number): Promise<Prompt[]>;
  getPromptsByType(type: CategoryType, userId?: string, includePublic?: boolean, limit?: number): Promise<Prompt[]>; // 新增：按类型获取提示词
  getPromptById?(idOrName: string, userId?: string): Promise<Prompt | null>;
  
  // 版本控制相关
  getPromptVersions(promptId: string, userId?: string): Promise<PromptVersion[]>;
  getPromptVersion(promptId: string, version: number, userId?: string): Promise<PromptVersion | null>;
  createPromptVersion(promptVersion: PromptVersion): Promise<PromptVersion>;
  restorePromptVersion(promptId: string, version: number, userId?: string): Promise<Prompt>;
  
  // 导入导出相关
  exportPrompts(userId?: string, promptIds?: string[]): Promise<Prompt[]>;
  importPrompts(prompts: Prompt[], userId?: string): Promise<{success: number; failed: number; messages: string[]}>;
  
  // 认证相关方法
  signUp(email: string, password: string, displayName?: string): Promise<AuthResponse>;
  signIn(email: string, password: string): Promise<AuthResponse>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  verifyToken(token: string): Promise<User | null>;
  
  // API密钥管理
  generateApiKey(userId: string, name: string, expiresInDays?: number): Promise<string>;
  verifyApiKey(apiKey: string): Promise<User | null>;
  updateApiKeyLastUsed(apiKey: string): Promise<void>;
  listApiKeys(userId: string): Promise<ApiKey[]>;
  deleteApiKey(userId: string, keyId: string): Promise<boolean>;
  
  // 文件存储相关（可选实现）
  uploadAsset?(fileBuffer: Buffer, filename: string, mimetype: string, categoryType: 'image' | 'video'): Promise<{success: boolean; url?: string; message?: string}>;
  getAssetInfo?(filename: string): Promise<{success: boolean; data?: unknown; message?: string}>;
  deleteAsset?(filename: string): Promise<{success: boolean; message?: string}>;
  validateAssetUrl?(url: string): Promise<boolean>;
}

export interface MCPToolRequest {
  name: string;
  arguments?: Record<string, McpArguments>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  success?: boolean; // 新增：支持成功标识
  error?: {
    message: string;
  }; // 新增：支持错误信息
}

// MCP 工具类型定义
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  items?: {
    type: string;
  };
}

export interface ToolDescription {
  name: string;
  description: string;
  schema_version: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolInvocationRequest {
  name: string;
  params: Record<string, McpArguments>;
}

export interface ToolInvocationResponse {
  schema_version: string;
  content: {
    type: 'text';
    text: string;
  };
  error?: {
    message: string;
  };
}

// =============================================
// JSONB 数据转换工具类型 (MCP 特定)
// =============================================

// 内容提取选项
export interface ContentExtractionOptions {
  preferJsonb?: boolean;
  fallbackToString?: boolean;
  validateStructure?: boolean;
}

// 内容转换结果
export interface ContentConversionResult {
  success: boolean;
  data: PromptContentJsonb | string;
  error?: string;
}

// 优化模板转换结果
export interface OptimizationTemplateConversionResult {
  success: boolean;
  data: OptimizationTemplateJsonb | string;
  error?: string;
}

// 内容提取结果
export interface ContentExtractionResult {
  content: string;
  isJsonb: boolean;
  structure?: PromptContentJsonb;
  error?: string;
}

// 优化模板提取结果
export interface OptimizationTemplateExtractionResult {
  template: string;
  isJsonb: boolean;
  structure?: OptimizationTemplateJsonb;
  error?: string;
}
