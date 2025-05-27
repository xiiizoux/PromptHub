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

// 提示词相关类型
export interface Prompt {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  variables?: string[];
  messages?: any[];
  user_id?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  version?: number;
  author?: string;
  rating?: number;
  usageCount?: number;
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
  messages: any[];
  created_at: string;
  user_id?: string;
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
  tags?: string[];
  search?: string;
  userId?: string;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular' | 'rating';
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
