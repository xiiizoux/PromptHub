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
  error?: string;  // 添加错误属性，用于存储错误信息
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

// 用户关注关系
export interface UserFollow {
  id?: string;
  follower_id: string;
  following_id: string;
  created_at?: string;
}

// 社交互动（点赞、收藏、分享）
export interface SocialInteraction {
  id?: string;
  prompt_id: string;
  user_id: string;
  type: 'like' | 'bookmark' | 'share';
  created_at?: string;
}

// 评论
export interface Comment {
  id?: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
  user?: User; // 关联的用户信息（可选）
  replies?: Comment[]; // 回复（可选）
}

// 话题
export interface Topic {
  id?: string;
  title: string;
  description?: string;
  creator_id: string;
  created_at?: string;
  updated_at?: string;
  post_count?: number; // 帖子数量
  creator?: User; // 创建者信息
}

// 话题帖子
export interface TopicPost {
  id?: string;
  topic_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  user?: User; // 用户信息
}

// 通知类型枚举
export type NotificationType =
  | 'follow'       // 关注通知
  | 'like'         // 点赞通知
  | 'comment'      // 评论通知
  | 'reply'        // 回复通知
  | 'mention'      // 提及通知
  | 'system';      // 系统通知

// 通知汇总频率
export type DigestFrequency = 'daily' | 'weekly';

// 通知接口
export interface Notification {
  id?: string;
  user_id: string;
  type: NotificationType;
  content: string;
  related_id?: string;  // 关联的资源ID（提示词、评论等）
  actor_id?: string;    // 触发通知的用户ID
  is_read: boolean;
  created_at: string;
  actor?: User;         // 触发通知的用户信息（可选）
  group_id?: string;    // 通知分组ID，用于将相关通知分组显示
}

// 通知偏好设置接口
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
  
  // 社交关系管理
  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<User>>;
  getUserFollowing(userId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<User>>;
  checkIfFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // 社交互动（点赞、收藏、分享）
  createSocialInteraction(userId: string, promptId: string, type: string): Promise<SocialInteraction>;
  removeSocialInteraction(userId: string, promptId: string, type: string): Promise<boolean>;
  getPromptInteractions(promptId: string, type?: string, userId?: string): Promise<{
    likes: number;
    bookmarks: number;
    shares: number;
    userInteraction?: {
      liked: boolean;
      bookmarked: boolean;
      shared: boolean;
    }
  }>;
  
  // 评论管理
  createComment(userId: string, promptId: string, content: string, parentId?: string): Promise<Comment>;
  getPromptComments(promptId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<Comment>>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
  
  // 话题管理
  createTopic(topic: Topic): Promise<Topic>;
  getTopics(page?: number, pageSize?: number): Promise<PaginatedResponse<Topic>>;
  getTopic(topicId: string): Promise<Topic | null>;
  
  // 话题帖子管理
  createTopicPost(post: TopicPost): Promise<TopicPost>;
  getTopicPosts(topicId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<TopicPost>>;
  getTopicPost(postId: string): Promise<TopicPost | null>;
  
  // 通知管理
  createNotification(notification: Notification): Promise<Notification>;
  getUserNotifications(userId: string, page?: number, pageSize?: number, unreadOnly?: boolean): Promise<PaginatedResponse<Notification>>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  deleteNotification(notificationId: string, userId: string): Promise<boolean>;
  getGroupedNotifications(userId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<Notification[]>>;
  
  // 通知偏好设置
  getUserNotificationPreferences(userId: string): Promise<NotificationPreference>;
  updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<NotificationPreference>;
  shouldSendNotification(userId: string, type: NotificationType): Promise<boolean>;
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
