/**
 * 提示词相关类型定义
 */

// 提示词基本信息
export interface PromptInfo {
  id?: string;                            // 添加id字段作为可选属性
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  version?: number;  // 改为数字类型以匹配数据库结构
  created_at?: string;
  updated_at?: string;
  author?: string;
  usageCount?: number;
  rating?: number;
}

// 提示词详情
export interface PromptDetails extends PromptInfo {
  id: string;                             // 提示词ID
  content?: string;                       // 原始内容（用于表单，但不存在于数据库中）
  messages?: Array<{role: string; content: string}>; // 消息数组，对应数据库中的JSONB字段
  template_format?: string;
  input_variables?: string[];
  examples?: PromptExample[];
  versions?: PromptVersion[];
  compatible_models?: string[];
  is_public?: boolean;                    // 是否公开
  allow_collaboration?: boolean;          // 是否允许协作编辑
  collaborators?: string[];               // 指定的协作者列表
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 编辑权限级别
  user_id?: string;                       // 所有者用户ID
  created_by?: string;                    // 创建者ID
  last_modified_by?: string;              // 最后修改者ID
  category_id?: string;                   // 分类 ID，对应数据库中的category_id字段
}

// 提示词示例
export interface PromptExample {
  input: Record<string, any>;
  output: string;
  description?: string;
}

// 提示词版本
export interface PromptVersion {
  version: number;  // 改为数字类型以匹配数据库结构
  content: string;
  created_at: string;
  author?: string;
  notes?: string;
}

// 提示词使用数据
export interface PromptUsage {
  usage_id: string;
  prompt_id: string;
  version: number;  // 改为数字类型以匹配数据库结构
  input_tokens: number;
  output_tokens: number;
  latency: number;
  success: boolean;
  created_at: string;
  model?: string;
}

// 提示词反馈
export interface PromptFeedback {
  usage_id: string;
  rating: number;
  comments?: string;
  created_at: string;
}

// 提示词性能报告
export interface PromptPerformance {
  prompt_id: string;
  total_usage: number;
  average_rating: number;
  success_rate: number;
  average_latency: number;
  token_stats: {
    input_avg: number;
    output_avg: number;
    total_input: number;
    total_output: number;
  };
  feedback_count: number;
  version_distribution?: Record<string, number>;
}

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
  sortBy?: 'latest' | 'popular' | 'rating';
  model?: string;
  page?: number;
  pageSize?: number;
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
  changes?: any;
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
