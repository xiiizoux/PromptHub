export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

export interface Prompt {
  id?: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  messages: PromptMessage[];
  created_at?: string;
  updated_at?: string;
  version?: number;
  is_public?: boolean;
  user_id?: string;
}

export interface PromptVersion {
  id?: string;
  prompt_id: string;
  version: number;
  messages: PromptMessage[];
  description: string;
  category: string;
  tags: string[];
  created_at?: string;
  user_id?: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 提取功能已移除

// MCP请求类型
export interface McpRequest {
  params: {
    name: string;
    arguments: any;
  };
  auth?: {
    [key: string]: string;
  };
  headers?: {
    [key: string]: string;
  };
  query?: {
    [key: string]: string;
  };
}

// 提示词过滤器接口
export interface PromptFilters {
  category?: string;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular';
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
  
  // 获取所有分类
  getCategories(): Promise<string[]>;
  
  // 获取所有标签
  getTags(): Promise<string[]>;
  getPromptsByCategory(category: string, userId?: string, includePublic?: boolean): Promise<Prompt[]>;
  
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
}

export interface MCPToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
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
  params: Record<string, any>;
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
