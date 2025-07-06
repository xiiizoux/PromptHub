import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters, ImportData } from '@/types';
import { supabase } from '@/lib/supabase';

// API响应的具体数据类型
export interface ApiResponseData {
  [key: string]: unknown;
}

// 网络响应类型
export interface NetworkResponse {
  data?: {
    success?: boolean;
    data?: unknown;
    error?: string;
    message?: string;
  };
  status?: number;
}

// 错误类型定义
export interface ApiError {
  message: string;
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
}

// 用户会话类型
export interface UserSession {
  user?: {
    id: string;
    email?: string;
  };
  access_token?: string;
}

// Supabase认证响应类型
export interface SupabaseAuthResponse {
  data: {
    session: UserSession | null;
  };
  error?: {
    message: string;
  };
}

// 定义一个更符合后端实际响应结构的泛型类型
interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 数据访问助手函数，统一处理多层嵌套问题
function extractData<T>(response: NetworkResponse, fallback: T): T {
  // 处理常见的嵌套结构：response.data.data
  if (response?.data?.success && response.data.data !== undefined) {
    return response.data.data as T;
  }
  // 处理单层结构：response.data
  if (response?.data !== undefined) {
    return response.data as T;
  }
  // 返回fallback值
  return fallback;
}

// 安全的数组访问助手
function extractArrayData<T>(response: NetworkResponse, fallback: T[] = []): T[] {
  const data = extractData(response, fallback);
  return Array.isArray(data) ? data : fallback;
}

// 安全的分页数据访问助手
function extractPaginatedData<T>(response: NetworkResponse): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const responseData = response?.data;
  if (!responseData?.success || !responseData.data) {
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const innerData = responseData.data as {
    data?: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  
  return {
    data: Array.isArray(innerData.data) ? innerData.data : [],
    total: typeof innerData.total === 'number' ? innerData.total : 0,
    page: typeof innerData.page === 'number' ? innerData.page : 1,
    pageSize: typeof innerData.pageSize === 'number' ? innerData.pageSize : 10,
    totalPages: typeof innerData.totalPages === 'number' ? innerData.totalPages : 0,
  };
}

// 创建Axios实例 - Docker部署配置
const api = axios.create({
  baseURL: '/api',
  timeout: 8000, // 大幅减少到8秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// MCP API 实例已移除，完全使用 Web API

// 网络状态检测
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // 简单的连通性测试
    const response = await fetch('/api/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(1000), // 减少到1秒超时
    });
    return response.ok;
  } catch (error) {
    console.warn('网络连接检测失败:', error);
    return false;
  }
};

// 改进的token获取函数
const getAuthTokenWithRetry = async (maxRetries: number = 3): Promise<string | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        throw new Error('网络连接已断开');
      }

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth.token');
        if (token) {return token;}

        const { supabase } = await import('@/lib/supabase');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {throw new Error(`Supabase认证错误: ${error.message}`);}
        
        if (session?.access_token) {
          localStorage.setItem('auth.token', session.access_token);
          return session.access_token;
        }
      }

      // 如果在服务器端或无法获取，则返回 null
      if (attempt === 1) {return null;}

    } catch (error: ApiError) {
      console.error(`[Token获取] 第${attempt}次尝试失败:`, error.message);
      if (attempt >= maxRetries) {
        throw new Error(`获取认证token失败: ${error.message}`);
      }
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // 减少重试延迟
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
};

// 通用重试机制函数 - 减少重试次数和延迟
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2, // 从3减少到2
  retryDelay: number = 500, // 从1000减少到500
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`[API重试] 第${attempt}次尝试失败:`, error.message);
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // 检查是否是需要重试的错误 - 更严格的条件
      const isRetryableError = error.code === 'ECONNABORTED' || 
                             error.code === 'ECONNRESET' ||
                             error.code === 'ETIMEDOUT' ||
                             (error.response?.status >= 500 && error.response?.status < 600);
      
      if (!isRetryableError) {
        throw error;
      }
      
      const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 2000); // 最大延迟从5000减少到2000
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('重试次数已耗尽');
};

// 请求拦截器添加认证和API密钥
api.interceptors.request.use(async (config) => {
  // 从环境变量或本地存储获取API密钥
  const apiKey = process.env.API_KEY || localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  
  // 添加认证token
  try {
    // 只在客户端添加认证头
    if (typeof window !== 'undefined') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }
  } catch (error) {
    console.warn('获取认证token失败:', error);
  }
  
  return config;
});

// MCP API 拦截器已移除，完全使用 Web API

// 响应拦截器处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求错误:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

/**
 * 提示词相关API
 */

// 分类类型定义
export interface Category {
  id?: string;
  name: string;
  name_en?: string;
  alias?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 获取所有分类（完整信息）
export const getCategories = async (type?: string): Promise<Array<{
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  type: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}>> => {
  const url = type ? `/categories?type=${type}` : '/categories';
  const response = await api.get<BackendApiResponse<Array<{
    id: string;
    name: string;
    name_en?: string;
    icon?: string;
    description?: string;
    type: string;
    sort_order?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  }>>>(url);

  const categories = extractArrayData(response, []);
  if (categories.length === 0 && !response.data?.success) {
    const errorMessage = response.data?.error || 'API未返回成功状态';
    throw new Error(`获取分类失败: ${errorMessage}`);
  }

  return categories;
};

// 获取分类名称列表（向后兼容）
export const getCategoryNames = async (type?: string): Promise<string[]> => {
  const url = type ? `/categories?type=${type}&namesOnly=true` : '/categories?namesOnly=true';
  const response = await api.get<BackendApiResponse<string[]>>(url);

  const categories = extractArrayData<string>(response, []);
  if (categories.length === 0 && !response.data?.success) {
    const errorMessage = response.data?.error || 'API未返回成功状态';
    throw new Error(`获取分类失败: ${errorMessage}`);
  }

  return categories;
};
;

// 获取所有标签
export const getTags = async (): Promise<string[]> => {
  const response = await api.get<BackendApiResponse<string[]>>('/tags');

  const tags = extractArrayData<string>(response, []);
  if (tags.length === 0 && !response.data?.success) {
    const errorMessage = response.data?.error || 'API未返回成功状态';
    throw new Error(`获取标签失败: ${errorMessage}`);
  }
  
  return tags;
};
;

// 获取带使用频率的标签统计
export const getTagsWithStats = async (): Promise<Array<{tag: string, count: number}>> => {
  try {
    const response = await api.get<NetworkResponse>('/tags?withStats=true');

    const stats = extractArrayData<{tag: string, count: number}>(response, []);
    if (stats.length > 0) {
      return stats;
    }

    // 如果API返回空数据或失败，返回默认统计
    const defaultTags = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
    return defaultTags.map((tag, index) => ({ tag, count: 10 - index }));
  } catch (error) {
    console.error('获取标签统计失败:', error);
    // 发生错误时也返回默认统计
    const defaultTags = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
    return defaultTags.map((tag, index) => ({ tag, count: 10 - index }));
  }
};

// 获取所有提示词名称
export const getPromptNames = async (): Promise<string[]> => {
  try {
    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.get<NetworkResponse>('/prompts');
    const data = extractData(response, { names: [] }) as { names?: string[] };
    return data.names || [];
  } catch (error) {
    console.error('获取提示词名称失败:', error);
    return [];
  }
};

// 获取提示词列表（带分页和过滤）
export const getPrompts = async (filters?: PromptFilters): Promise<PaginatedResponse<PromptInfo>> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }
    if (filters?.category && filters.category !== '全部') {
      queryParams.append('category', filters.category);
    }
    if (filters?.tags && filters.tags.length > 0) {
      queryParams.append('tag', filters.tags[0]);
    }
    if (filters?.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
    }
    
    // 添加分页参数
    if (filters?.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      queryParams.append('pageSize', filters.pageSize.toString());
    }
    if (filters?.category_type) {
      queryParams.append('category_type', filters.category_type);
    }

    // 获取当前用户ID（如果有的话）
    let userId = null;
    if (typeof window !== 'undefined') {
      try {
        // 使用 Supabase 客户端直接获取用户ID
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch (e) {
        console.error('获取用户会话信息失败:', e);
      }
    }

    // 使用新的解耦API端点
    const response = await api.get<NetworkResponse>(`/prompts?${queryParams.toString()}`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });

    // 使用统一的分页数据提取助手
    const paginatedData = extractPaginatedData<PromptInfo>(response);
    
    // 清理和映射每个prompt对象，确保字段符合预期
    const cleanedData = paginatedData.data.map((item: Record<string, unknown>) => {
      // 使用服务端返回的category_type字段，不再使用硬编码分类判断
      const guessedType = item.category_type || 'chat'; // 默认为chat类型
      
      return {
        id: item.id || `fallback-${Math.random()}`,
        name: item.name || '无标题',
        description: item.description || '无描述',
        category: item.category || '通用',
        category_type: item.category_type || guessedType,
        tags: Array.isArray(item.tags) ? item.tags : [],
        version: item.version || 1,
        created_at: item.created_at,
        updated_at: item.updated_at,
        author: item.author || '匿名',
        usageCount: item.usageCount || 0,
        rating: item.rating || 0,
        preview_asset_url: item.preview_asset_url,
        parameters: item.parameters || {},
      };
    });

    return {
      data: cleanedData,
      total: paginatedData.total,
      page: paginatedData.page,
      pageSize: paginatedData.pageSize,
      totalPages: paginatedData.totalPages,
    };
  } catch (error) {
    console.error('获取提示词列表失败:', error);
    // 在捕获到错误时也返回一个保证结构正确的空对象
    return { data: [], total: 0, page: 1, pageSize: filters?.pageSize || 10, totalPages: 0 };
  }
};

// 获取提示词详情
export const getPromptDetails = async (identifier: string): Promise<PromptDetails> => {
  try {
    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.get(`/prompts/${encodeURIComponent(identifier)}`);
    if (!response.data.success) {
      throw new Error(response.data.error || '获取提示词详情失败');
    }
    return response.data.prompt as PromptDetails;
  } catch (error) {
    console.error(`获取提示词 ${identifier} 详情失败:`, error);
    throw error;
  }
};

// 创建提示词
export const createPrompt = async (prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.post('/prompts', prompt);
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || '创建提示词失败');
    }
    return response.data.data;
  } catch (error: ApiError) {
    console.error('创建提示词失败:', error);
    const errorMessage = error.response?.data?.error || error.message || '创建提示词失败';
    throw new Error(errorMessage);
  }
};

// 更新提示词
export const updatePrompt = async (id: string, prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.put(`/prompts/${id}`, prompt);
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || '更新提示词失败');
    }
    return response.data.data;
  } catch (error: ApiError) {
    console.error(`更新提示词 ${id} 失败:`, error);
    const errorMessage = error.response?.data?.error || error.message || '更新提示词失败';
    throw new Error(errorMessage);
  }
};

// 删除提示词
export const deletePrompt = async (id: string): Promise<void> => {
  try {
    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.delete(`/prompts/${id}`);
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || '删除提示词失败');
    }
  } catch (error: ApiError) {
    console.error(`删除提示词 ${id} 失败:`, error);
    const errorMessage = error.response?.data?.error || error.message || '删除提示词失败';
    throw new Error(errorMessage);
  }
};









/**
 * MCP工具调用API
 */

// MCP工具调用参数类型
export interface McpToolParams {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

// MCP工具响应类型
export interface McpToolResponse {
  content?: Array<{
    type: string;
    text: string;
  }>;
  [key: string]: unknown;
}



// 移除社交功能接口定义 - MCP服务专注于提示词管理

// 社交互动接口
export interface PromptInteractions {
  likes: number;
  bookmarks: number;
  userLiked: boolean;
  userBookmarked: boolean;
}

// 请求缓存机制
const interactionCache = new Map<string, {
  data: PromptInteractions;
  timestamp: number;
  ttl: number;
}>();

/**
 * @deprecated 此函数已弃用，不再使用 MCP 服务
 * 现在使用 InteractionsContext 提供的本地默认数据
 */
export async function getPromptInteractions(promptId: string): Promise<PromptInteractions> {
  // 输入验证
  if (!promptId || typeof promptId !== 'string' || promptId.trim() === '') {
    throw new Error('Invalid promptId provided');
  }
  
  // 直接返回默认数据，不再请求 MCP 服务
  return {
    likes: 0,
    bookmarks: 0,
    userLiked: false,
    userBookmarked: false,
    shares: 0,
    comments: 0,
  };
}

/**
 * @deprecated 此函数已弃用，不再使用 MCP 服务
 * 现在使用本地状态管理收藏功能
 */
export async function toggleBookmark(promptId: string): Promise<{ bookmarked: boolean }> {
  try {
    // 模拟切换收藏状态，实际应通过 InteractionsContext 管理
    const isBookmarked = Math.random() > 0.5; // 随机模拟状态
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { bookmarked: isBookmarked };
  } catch (error: any) {
    console.error('切换收藏状态失败:', error);
    throw new Error(error.message || '切换收藏状态失败');
  }
}

/**
 * @deprecated 此函数已弃用，不再使用 MCP 服务
 * 现在使用本地状态管理点赞功能
 */
export async function toggleLike(promptId: string): Promise<{ liked: boolean }> {
  try {
    // 模拟切换点赞状态，实际应通过 InteractionsContext 管理
    const isLiked = Math.random() > 0.5; // 随机模拟状态
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { liked: isLiked };
  } catch (error: any) {
    console.error('切换点赞状态失败:', error);
    throw new Error(error.message || '切换点赞状态失败');
  }
}

export async function getUserBookmarks(): Promise<PromptDetails[]> {
  const response = await fetch('/api/user/bookmarks', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('获取收藏列表失败');
  }

  return response.json();
}

// 移除社交互动相关函数 - MCP服务专注于提示词管理



// 评分和评论系统 API
export interface Rating {
  id: string;
  prompt_id: string;
  user_id: string;
  rating: number; // 1-5星
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    display_name?: string;
    email?: string;
  };
}

export async function submitRating(promptId: string, data: {
  rating: number;
  comment?: string;
}): Promise<{ success: boolean }> {
  const response = await api.post('/prompts/rating', { promptId, ...data });
  
  if (!response.data.success) {
    throw new Error('提交评分失败');
  }

  return response.data;
}

export async function getPromptRatings(promptId: string, params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  data: Rating[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
}> {
  const queryParams = new URLSearchParams();
  queryParams.append('promptId', promptId);
  
  if (params?.page) {queryParams.append('page', params.page.toString());}
  if (params?.pageSize) {queryParams.append('pageSize', params.pageSize.toString());}

  const response = await api.get(`/prompts/ratings?${queryParams}`);

  if (!response.data.success) {
    throw new Error('获取评分失败');
  }

  return response.data;
}

export async function updateRating(promptId: string, data: {
  rating: number;
  comment?: string;
}): Promise<{ success: boolean }> {
  const response = await api.put('/prompts/rating', { promptId, ...data });
  
  if (!response.data.success) {
    throw new Error('更新评分失败');
  }

  return response.data;
}

export async function deleteRating(promptId: string): Promise<{ success: boolean }> {
  const response = await api.delete('/prompts/rating', { data: { promptId } });
  
  if (!response.data.success) {
    throw new Error('删除评分失败');
  }

  return response.data;
}

export async function getUserRating(promptId: string): Promise<Rating | null> {
  try {
    const response = await api.get(`/prompts/user-rating?promptId=${promptId}`);
    
    if (!response.data.success) {
      return null;
    }

    return response.data.rating;
  } catch (error: ApiError) {
    // 处理不同类型的错误
    if (error.response?.status === 401) {
      console.warn('用户未登录，无法获取评分信息');
      return null;
    }
    if (error.response?.status === 404) {
      // 用户没有评分记录
      return null;
    }
    
    console.error('获取用户评分失败:', error);
    return null;
  }
}

// 导入/导出相关
export async function exportPrompts(promptIds: string[], format: 'json' | 'csv' | 'txt' = 'json'): Promise<Blob> {
  const response = await api.post('/prompts/export', { promptIds, format }, {
    responseType: 'blob',
  });
  
  return response.data;
}

export async function importPrompts(importData: ImportData, options?: {
  allowDuplicates?: boolean;
  skipDuplicates?: boolean;
}): Promise<{
  success: boolean;
  imported_count: number;
  total_count: number;
  errors?: string[];
  prompts: Array<{ id: string; name: string }>;
}> {
  const response = await api.post('/prompts/import', { importData, options });
  
  if (!response.data.success) {
    throw new Error(response.data.error || '导入失败');
  }

  return response.data;
}

// 语义搜索相关API
export interface SearchSuggestion {
  text: string;
  type: 'keyword' | 'category' | 'semantic' | 'history';
  confidence?: number;
}

export interface SemanticSearchParams {
  query: string;
  mode: 'semantic' | 'keyword';
  limit?: number;
  filters?: {
    categories?: string[];
    tags?: string[];
    minRating?: number;
  };
}

export async function performSemanticSearch(params: SemanticSearchParams): Promise<PromptDetails[]> {
  const response = await api.post('/search/semantic', params);
  
  if (!response.data.success) {
    throw new Error('语义搜索失败');
  }

  return response.data.results;
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
  
  if (!response.data.success) {
    throw new Error('获取搜索建议失败');
  }

  return response.data.suggestions;
}

export async function saveSearchQuery(query: string): Promise<void> {
  try {
    await api.post('/search/save-query', { query });
  } catch (error) {
    // 搜索查询保存失败不影响主要功能，只记录错误
    console.error('保存搜索查询失败:', error);
  }
}

export async function getSearchHistory(): Promise<string[]> {
  try {
    const response = await api.get('/search/history');
    
    if (!response.data.success) {
      return [];
    }

    return response.data.history;
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

export async function getSearchStats(): Promise<{
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularCategories: Array<{ category: string; count: number }>;
  recentTrends: Array<{ query: string; timestamp: string }>;
}> {
  const response = await api.get('/search/stats');
  
  if (!response.data.success) {
    throw new Error('获取搜索统计失败');
  }

  return response.data;
}

// 推荐系统相关API
export type RecommendationType = 'personalized' | 'similar' | 'trending' | 'collaborative';

export interface RecommendationResult {
  prompt: PromptDetails & {
    author?: string;
    likes?: number;
    usage_count?: number;
  };
  score: number;
  reason: string;
  algorithm: string;
}

export async function getRecommendations(
  type: RecommendationType, 
  userId?: string, 
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const response = await api.post('/recommendations/get', { type, userId, limit });
  
  if (!response.data.success) {
    throw new Error('获取推荐失败');
  }

  return response.data.recommendations;
}

export async function getPersonalizedRecommendations(
  userId: string, 
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const response = await api.get(`/recommendations/personalized?userId=${userId}&limit=${limit}`);
  
  if (!response.data.success) {
    throw new Error('获取个性化推荐失败');
  }

  return response.data.recommendations;
}

export async function getSimilarPrompts(
  promptId: string, 
  limit: number = 10,
): Promise<RecommendationResult[]> {
  const response = await api.get(`/recommendations/similar?promptId=${promptId}&limit=${limit}`);
  
  if (!response.data.success) {
    throw new Error('获取相似推荐失败');
  }

  return response.data.recommendations;
}

export async function getTrendingPrompts(limit: number = 10): Promise<RecommendationResult[]> {
  const response = await api.get(`/recommendations/trending?limit=${limit}`);
  
  if (!response.data.success) {
    throw new Error('获取热门推荐失败');
  }

  return response.data.recommendations;
}

export async function updateRecommendationFeedback(
  userId: string,
  promptId: string,
  feedback: 'like' | 'dislike' | 'not_interested',
): Promise<void> {
  const response = await api.post('/recommendations/feedback', {
    userId,
    promptId,
    feedback,
  });
  
  if (!response.data.success) {
    throw new Error('更新推荐反馈失败');
  }
}





export default api;
