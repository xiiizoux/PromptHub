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

// 社交API端点
export namespace SocialApi {
  // 关注相关
  export interface UserFollowRequest {
    followingId: string;
  }
  export type UserFollowResponse = ApiResponse<{ success: boolean }>;
  
  // 点赞、收藏等互动
  export interface InteractionRequest {
    promptId: string;
    type: 'like' | 'bookmark' | 'share';
  }
  export type InteractionResponse = ApiResponse<{ success: boolean }>;
  
  // 评论相关
  export interface CommentRequest {
    promptId: string;
    content: string;
    parentId?: string;
  }
  export type CommentResponse = ApiResponse<any>;
  
  // 话题相关
  export interface TopicRequest {
    title: string;
    description?: string;
  }
  export type TopicResponse = ApiResponse<any>;
  
  // 话题帖子
  export interface TopicPostRequest {
    topicId: string;
    title: string;
    content: string;
  }
  export type TopicPostResponse = ApiResponse<any>;
}

// 通知API端点
export namespace NotificationApi {
  // 通知类型
  export type NotificationType =
    | 'follow'       // 关注通知
    | 'like'         // 点赞通知
    | 'comment'      // 评论通知
    | 'reply'        // 回复通知
    | 'mention'      // 提及通知
    | 'system';      // 系统通知

  // 通知汇总频率
  export type DigestFrequency = 'daily' | 'weekly';
  
  // 通知对象
  export interface Notification {
    id?: string;
    user_id: string;
    type: NotificationType;
    content: string;
    related_id?: string;  // 关联的资源ID（提示词、评论等）
    actor_id?: string;    // 触发通知的用户ID
    is_read: boolean;
    created_at: string;
    actor?: {
      id: string;
      email: string;
      display_name?: string;
    };
    group_id?: string;    // 通知分组ID
  }
  
  // 通知偏好设置
  export interface NotificationPreference {
    id?: string;
    user_id: string;
    follow_notifications: boolean;
    like_notifications: boolean;
    comment_notifications: boolean;
    reply_notifications: boolean;
    mention_notifications: boolean;
    system_notifications: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    digest_notifications: boolean;
    digest_frequency: DigestFrequency;
    created_at?: string;
    updated_at?: string;
  }
  
  // 获取通知
  export type GetNotificationsResponse = ApiResponse<PaginatedResponse<Notification>>;
  
  // 获取未读通知数量
  export type GetUnreadCountResponse = ApiResponse<{ count: number }>;
  
  // 标记通知为已读
  export interface MarkAsReadRequest {
    notificationId?: string;
    allNotifications?: boolean;
  }
  export type MarkAsReadResponse = ApiResponse<{ success: boolean }>;
  
  // 获取通知偏好设置
  export type GetPreferencesResponse = ApiResponse<NotificationPreference>;
  
  // 更新通知偏好设置
  export type UpdatePreferencesResponse = ApiResponse<NotificationPreference>;
}
