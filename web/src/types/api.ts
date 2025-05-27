/**
 * API类型定义
 * 前端和API Routes共享的类型定义
 */

import { Prompt, User, ApiKey, PromptVersion } from '../../../supabase/lib/types';

// 通用API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页响应格式
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 提示词过滤参数
export interface PromptFilterParams extends PaginationParams {
  category?: string;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  userId?: string;
  sortBy?: 'latest' | 'popular' | 'rating';
}

// 提示词API端点
export namespace PromptApi {
  // GET /api/prompts
  export type GetPromptsResponse = ApiResponse<PaginatedResponse<Prompt>>;
  
  // GET /api/prompts/:id
  export type GetPromptResponse = ApiResponse<Prompt>;
  
  // POST /api/prompts
  export type CreatePromptRequest = Omit<Prompt, 'id' | 'created_at' | 'updated_at'>;
  export type CreatePromptResponse = ApiResponse<Prompt>;
  
  // PUT /api/prompts/:id
  export type UpdatePromptRequest = Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at'>>;
  export type UpdatePromptResponse = ApiResponse<Prompt>;
  
  // DELETE /api/prompts/:id
  export type DeletePromptResponse = ApiResponse<{ deleted: boolean }>;
  
  // GET /api/categories
  export type GetCategoriesResponse = ApiResponse<string[]>;
  
  // GET /api/tags
  export type GetTagsResponse = ApiResponse<string[]>;
  
  // GET /api/prompts/versions/:promptId
  export type GetVersionsResponse = ApiResponse<PromptVersion[]>;
  
  // POST /api/prompts/restore/:promptId/:version
  export type RestoreVersionResponse = ApiResponse<Prompt>;
}

// 用户API端点
export namespace UserApi {
  // POST /api/auth/signin
  export interface SignInRequest {
    email: string;
    password: string;
  }
  export interface SignInResponse extends ApiResponse {
    data?: {
      user: User;
      token: string;
    };
  }
  
  // POST /api/auth/signup
  export interface SignUpRequest {
    email: string;
    password: string;
    displayName?: string;
  }
  export type SignUpResponse = SignInResponse;
  
  // GET /api/auth/user
  export type GetUserResponse = ApiResponse<User>;
  
  // GET /api/auth/signout
  export type SignOutResponse = ApiResponse<{ success: boolean }>;
  
  // GET /api/keys
  export type GetApiKeysResponse = ApiResponse<ApiKey[]>;
  
  // POST /api/keys
  export interface CreateApiKeyRequest {
    name: string;
    expiresInDays?: number;
  }
  export type CreateApiKeyResponse = ApiResponse<{ key: string }>;
  
  // DELETE /api/keys/:id
  export type DeleteApiKeyResponse = ApiResponse<{ deleted: boolean }>;
}

// MCP代理API端点
export namespace McpApi {
  // POST /api/mcp/tools
  export interface McpToolRequest {
    name: string;
    arguments?: Record<string, any>;
  }
  
  export interface McpToolResponse extends ApiResponse {
    data?: {
      content: {
        type: string;
        text: string;
      }[];
    };
  }
}
