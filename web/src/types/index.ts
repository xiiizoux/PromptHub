/**
 * 提示词相关类型定义
 */

// 简化权限类型定义（避免循环依赖）
export type SimplePermissionType = 'private' | 'public_read' | 'team_edit' | 'public_edit';

// 提示词参数类型定义
export interface PromptParameters {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

// 示例输入类型定义
export interface PromptExampleInput {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

// 审计日志变更记录类型
export type AuditLogChanges = Array<{
  field: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
}>;

// 导入数据类型定义
export interface ImportData {
  prompts?: Array<Partial<PromptDetails>>;
  version?: string;
  metadata?: {
    source?: string;
    exportedAt?: string;
    totalCount?: number;
  };
}

// 提示词历史版本类型定义
export interface PromptVersion {
  id: string;                                 // 版本记录ID
  prompt_id: string;                          // 关联的提示词ID
  version: number;                            // 版本号 (数值型，如1.0, 1.1, 2.0)
  content: string;                            // 版本内容
  description?: string;                       // 版本描述
  tags?: string[];                            // 标签
  category?: string;                          // 分类
  category_id?: string;                       // 分类ID
  parameters?: PromptParameters;              // 参数配置
  preview_asset_url?: string;                 // 预览资源URL
  created_at: string;                         // 创建时间
  user_id: string;                            // 创建者ID
}

// 智能删除保护系统相关类型定义

/**
 * 提示词删除/归档类型枚举
 */
export type PromptDeletionType = 'deleted' | 'archived' | 'restored' | 'error';

/**
 * 提示词删除/归档结果类型
 */
export interface PromptDeletionResult {
  success: boolean;
  type: PromptDeletionType;
  message: string;
  details?: string;
  affectedUsers?: number;
  preservedData?: Record<string, unknown>;
  transferredAt?: string;
  error?: string;
  canRestore?: boolean;           // 是否可以恢复
  transferReason?: string;        // 转移原因
}


// 版本比较结果
export interface VersionComparison {
  current: PromptVersion;
  previous: PromptVersion;
  changes: {
    content?: boolean;
    description?: boolean;
    tags?: boolean;
    category?: boolean;
    parameters?: boolean;
  };
}

// 提示词基本信息
export interface PromptInfo {
  id: string;                             // id字段是必需的
  name: string;
  description: string;
  category?: string;
  category_type?: 'chat' | 'image' | 'video'; // 分类类型
  tags?: string[];
  version?: number;  // 改为数字类型以匹配数据库结构
  created_at?: string;
  updated_at?: string;
  author?: string;
  usageCount?: number;
  rating?: number;
  average_rating?: number;               // 添加平均评分字段
  rating_count?: number;                 // 添加评分数量字段
  preview_asset_url?: string;            // 预览资源URL
  parameters?: PromptParameters;         // 生成参数
}

// Context Engineering内容结构
export interface PromptContentJsonb {
  type: 'context_engineering';
  static_content: string;
  dynamic_context: {
    adaptation_rules?: Record<string, unknown>[];
    examples?: {
      selection_strategy: string;
      max_examples: number;
      example_pool: Record<string, unknown>[];
    };
    tools?: {
      available_tools: string[];
      tool_selection_criteria: string;
    };
  };
  fallback_content: string;
  metadata?: {
    version: string;
    created_at: string;
    last_modified: string;
  };
}

// 提示词详情
export interface PromptDetails extends PromptInfo {
  content: string | PromptContentJsonb;    // 内容字段，支持JSONB格式
  template_format?: string;
  input_variables?: string[];
  examples?: PromptExample[];
  versions?: PromptVersion[];
  compatible_models?: string[];
  is_public?: boolean;                    // 是否公开
  allow_collaboration?: boolean;          // 是否允许协作编辑
  collaborators?: string[];               // 指定的协作者列表
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 编辑权限级别
  simple_permission?: SimplePermissionType; // 简化权限模式
  user_id?: string;                       // 所有者用户ID
  created_by?: string;                    // 创建者ID
  last_modified_by?: string;              // 最后修改者ID
  category_id?: string;                   // 分类 ID，对应数据库中的category_id字段
  
  // Context Engineering相关字段
  content_text?: string;                  // 从 JSONB 提取的可编辑文本内容
  content_structure?: PromptContentJsonb; // 完整的 JSONB 结构
  context_engineering_enabled?: boolean; // 是否启用 Context Engineering
  
  // 表单专用字段
  preview_assets?: Array<{
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

// 提示词示例
export interface PromptExample {
  input: PromptExampleInput;
  output: string;
  description?: string;
}

// 提示词版本接口已在上方定义，删除重复定义



/**
 * 用户相关类型定义
 */

// 用户信息
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  display_name?: string; // 显示名称
  created_at: string;
  role: 'user' | 'admin' | 'contributor';
}

// 用户登录信息
export interface LoginCredentials {
  email: string;
  password: string;
}

// 用户注册信息
export interface RegisterData extends LoginCredentials {
  username: string;
  confirmPassword: string;
}

/**
 * API相关类型定义
 */

// API响应基础接口
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 提示词过滤条件
export interface PromptFilters {
  category?: string;
  tags?: string[];
  search?: string;
  author?: string;
  sortBy?: 'latest' | 'oldest' | 'name' | 'updated';
  model?: string;
  page?: number;
  pageSize?: number;
  category_type?: 'chat' | 'image' | 'video'; // 添加类型过滤
}

/**
 * 权限管理相关类型
 */

// 权限检查结果
export interface PermissionCheck {
  canEdit: boolean;
  reason: 'owner' | 'admin' | 'contributor' | 'collaborator' | 'no_permission';
  message: string;
}

// 协作者信息
export interface Collaborator {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  permission_level: 'edit' | 'review' | 'admin';
  granted_by: string;
  granted_at: string;
}

// 审计日志
export interface AuditLog {
  id: string;
  prompt_id: string;
  user_id: string;
  username?: string;
  action: string;
  changes?: AuditLogChanges;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 权限申请
export interface PermissionRequest {
  id: string;
  resource_type: 'prompt';
  resource_id: string;
  user_id: string;
  permission_type: 'edit' | 'review' | 'admin';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

/**
 * UI组件相关类型
 */

// 提示词卡片属性
export interface PromptCardProps {
  prompt: PromptInfo;
  onClick?: () => void;
}

// 页面导航路径
export interface Breadcrumb {
  label: string;
  href: string;
  current?: boolean;
}

// 通知消息
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// 分类类型
export interface Category {
  id?: string;
  name: string;
  name_en?: string;
  alias?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * 模板相关类型定义
 */

// 模板分类
export interface TemplateCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 提示词模板
export interface PromptTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  variables: TemplateVariable[];
  fields: TemplateField[];
  author?: string;
  likes: number;
  usage_count: number;
  rating: number;
  estimated_time?: string;
  language: string;
  is_featured: boolean;
  is_premium: boolean;
  is_official: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  category_info?: {
    name: string;
    display_name: string;
    icon?: string;
    color?: string;
  };
}

// 模板变量定义
export interface TemplateVariable {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
  description: string;
  required: boolean;
  options?: string[];
  default?: string;
}

// 模板字段定义（用于动态表单）
export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
  placeholder?: string;
  required: boolean;
  options?: string[];
  example?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}



// 模板评分
export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// 模板过滤条件
export interface TemplateFilters {
  category?: string;
  subcategory?: string;
  difficulty?: string;
  featured?: boolean;
  premium?: boolean;
  official?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
