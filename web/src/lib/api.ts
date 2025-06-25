import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters } from '@/types';
import { supabase } from '@/lib/supabase';

// 定义一个更符合后端实际响应结构的泛型类型
interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 创建Axios实例 - Docker部署配置
const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 增加到2分钟超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 注意：MCP API实例已弃用，现在通过Web API代理访问MCP服务
// const mcpApi = axios.create({
//   baseURL: '/api/mcp',
//   timeout: 120000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// 网络状态检测
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // 简单的连通性测试
    const response = await fetch('/api/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3秒超时
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
        if (token) return token;

        const { supabase } = await import('@/lib/supabase');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw new Error(`Supabase认证错误: ${error.message}`);
        
        if (session?.access_token) {
          localStorage.setItem('auth.token', session.access_token);
          return session.access_token;
        }
      }

      // 如果在服务器端或无法获取，则返回 null
      if (attempt === 1) return null;

    } catch (error: any) {
      console.error(`[Token获取] 第${attempt}次尝试失败:`, error.message);
      if (attempt >= maxRetries) {
        throw new Error(`获取认证token失败: ${error.message}`);
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
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

// 注意：MCP API拦截器已弃用，现在通过Web API代理访问MCP服务
// mcpApi.interceptors.request.use(async (config) => {
//   const apiKey = process.env.API_KEY || localStorage.getItem('api_key');
//   if (apiKey) {
//     config.headers['x-api-key'] = apiKey;
//   }
//
//   // 添加认证token
//   try {
//     if (typeof window !== 'undefined') {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (session?.access_token) {
//         config.headers['Authorization'] = `Bearer ${session.access_token}`;
//       }
//     }
//   } catch (error) {
//     console.warn('获取认证token失败:', error);
//   }
//
//   return config;
// });

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

// 获取所有分类
export const getCategories = async (): Promise<string[]> => {
  console.log('前端API：开始获取分类数据');
  const response = await api.get<BackendApiResponse<string[]>>('/categories');

  console.log('前端API：分类API响应', response.data);

  if (response.data.success && Array.isArray(response.data.data)) {
    console.log('前端API：成功获取分类数据，数量:', response.data.data.length);
    return response.data.data;
  }

  // 如果API报告失败，抛出错误让调用方处理
  const errorMessage = response.data.error || 'API未返回成功状态';
  console.error('前端API：获取分类失败:', errorMessage);
  throw new Error(`获取分类失败: ${errorMessage}`);
};
;

// 获取所有标签
export const getTags = async (): Promise<string[]> => {
               try {
                 console.log('前端API：开始获取标签数据');
                 const response = await api.get<BackendApiResponse<string[]>>('/tags');
                 
                 console.log('前端API：标签API响应', response.data);
                 
                 if (response.data.success && Array.isArray(response.data.data)) {
                   console.log('前端API：成功获取标签数据，数量:', response.data.data.length);
                   return response.data.data;
                 }
                 
                 // API报告失败或数据格式不正确
                 console.warn('前端API：获取标签失败或返回数据格式不正确:', response.data.error || 'API未返回成功状态');
                 
                 // 返回默认标签以确保UI正常工作
                 const defaultTags = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
                 console.log('前端API：使用默认标签数据');
                 return defaultTags;
                 
               } catch (error) {
                 console.error('前端API：获取标签时发生网络或服务器错误:', error);
                 
                 // 提供用户友好的错误信息
                 const errorMessage = error instanceof Error ? error.message : '未知网络错误';
                 console.error('前端API：标签获取失败详情:', errorMessage);
                 
                 // 即使出错也返回默认标签，确保UI不会崩溃
                 const defaultTags = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
                 console.log('前端API：网络错误，使用默认标签数据');
                 return defaultTags;
               }
             };
;

// 获取带使用频率的标签统计
export const getTagsWithStats = async (): Promise<Array<{tag: string, count: number}>> => {
  try {
    const response = await api.get<any>('/tags?withStats=true');
    console.log('标签统计API响应:', response.data);
    
    if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    console.log('API返回空统计数据，使用默认数据');
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
    const response = await api.get<any>('/prompts');
    return response.data?.data?.names || [];
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

    // 获取当前用户ID（如果有的话）
    let userId = null;
    if (typeof localStorage !== 'undefined') {
      const userSession = localStorage.getItem('supabase.auth.token');
      if (userSession) {
        try {
          const parsedSession = JSON.parse(userSession);
          const sessionUserId = parsedSession?.currentSession?.user?.id;
          userId = sessionUserId !== null && sessionUserId !== undefined ? sessionUserId : undefined;
        } catch (e) {
          console.error('解析用户会话信息失败:', e);
        }
      }
    }

    // 使用新的REST API端点
    console.log('发送请求到:', `/public-prompts?${queryParams.toString()}`, '用户ID:', userId);
    const response = await api.get<any>(`/public-prompts?${queryParams.toString()}`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });
    
    // 1. 验证响应的基础结构
    if (!response || !response.data || typeof response.data !== 'object') {
      console.error('API响应格式无效或为空:', response);
      return { data: [], total: 0, page: 1, pageSize: filters?.pageSize || 10, totalPages: 0 };
    }

    const responseData = response.data;
    console.log('获取提示词原始响应:', responseData);

    // 2. 检查成功状态
    if (responseData.success === false || !responseData.data) {
      console.error('API报告获取失败:', responseData.error || '未知错误');
      return { data: [], total: 0, page: 1, pageSize: filters?.pageSize || 10, totalPages: 0 };
    }

    // 3. 验证核心数据data是否为数组
    if (!Array.isArray(responseData.data)) {
      console.error('API返回的data字段不是一个数组:', responseData.data);
      return { data: [], total: 0, page: 1, pageSize: filters?.pageSize || 10, totalPages: 0 };
    }

    // 4. (可选但推荐) 清理和映射每个prompt对象，确保字段符合预期
    const cleanedData = responseData.data.map((item: any) => ({
      id: item.id || `fallback-${Math.random()}`,
      name: item.name || '无标题',
      description: item.description || '无描述',
      category: item.category || '通用',
      tags: Array.isArray(item.tags) ? item.tags : [],
      version: item.version || 1,
      created_at: item.created_at,
      updated_at: item.updated_at,
      author: item.author || '匿名',
      usageCount: item.usageCount || 0,
      rating: item.rating || 0,
    }));

    const total = typeof responseData.total === 'number' ? responseData.total : 0;
    const page = typeof responseData.page === 'number' ? responseData.page : 1;
    const pageSize = typeof responseData.pageSize === 'number' ? responseData.pageSize : 10;
    const totalPages = typeof responseData.totalPages === 'number' ? responseData.totalPages : 0;

    console.log('清理后的提示词数据:', cleanedData.length, '总数:', total, '页面:', page, '总页数:', totalPages);

    return { 
      data: cleanedData,
      total,
      page,
      pageSize,
      totalPages,
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error(`删除提示词 ${id} 失败:`, error);
    const errorMessage = error.response?.data?.error || error.message || '删除提示词失败';
    throw new Error(errorMessage);
  }
};









/**
 * MCP工具调用API
 */

// 调用MCP工具
export const invokeMcpTool = async (toolName: string, params: any): Promise<any> => {
  // 使用Web API代理调用MCP工具
  const response = await api.post<any>('/mcp/tools', { name: toolName, arguments: params });
  return response.data;
};

// 获取可用工具列表
export const getMcpTools = async (): Promise<any> => {
  // 使用Web API代理获取MCP工具列表
  const response = await api.get<any>('/mcp/tools');
  return response.data;
};

// 移除社交功能接口定义 - MCP服务专注于提示词管理

// 社交互动接口
export interface PromptInteractions {
  likes: number;
  bookmarks: number;
  userLiked: boolean;
  userBookmarked: boolean;
}

export async function getPromptInteractions(promptId: string): Promise<PromptInteractions> {
  try {
    const response = await api.get(`/social/interactions?promptId=${promptId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '获取互动数据失败');
    }
    
    const data = response.data.data;
    return {
      likes: data.likes || 0,
      bookmarks: data.bookmarks || 0,
      userLiked: data.userLiked || false,
      userBookmarked: data.userBookmarked || false,
    };
  } catch (error: any) {
    console.error('获取提示词互动状态失败:', error);
    // 返回默认值而不是抛出错误，避免组件崩溃
    return {
      likes: 0,
      bookmarks: 0,
      userLiked: false,
      userBookmarked: false,
    };
  }
}

export async function toggleBookmark(promptId: string): Promise<{ bookmarked: boolean }> {
  try {
    // 先获取当前状态
    const currentState = await getPromptInteractions(promptId);
    
    if (currentState.userBookmarked) {
      // 取消收藏
      const response = await api.delete('/social/interactions', {
        data: { promptId, type: 'bookmark' },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '取消收藏失败');
      }
      
      return { bookmarked: false };
    } else {
      // 添加收藏
      const response = await api.post('/social/interactions', {
        promptId,
        type: 'bookmark',
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '收藏失败');
      }
      
      return { bookmarked: true };
    }
  } catch (error: any) {
    console.error('切换收藏状态失败:', error);
    throw new Error(error.message || '切换收藏状态失败');
  }
}

export async function toggleLike(promptId: string): Promise<{ liked: boolean }> {
  try {
    // 先获取当前状态
    const currentState = await getPromptInteractions(promptId);
    
    if (currentState.userLiked) {
      // 取消点赞
      const response = await api.delete('/social/interactions', {
        data: { promptId, type: 'like' },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '取消点赞失败');
      }
      
      return { liked: false };
    } else {
      // 添加点赞
      const response = await api.post('/social/interactions', {
        promptId,
        type: 'like',
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '点赞失败');
      }
      
      return { liked: true };
    }
  } catch (error: any) {
    console.error('切换点赞状态失败:', error);
    throw new Error(error.message || '切换点赞状态失败');
  }
}

export async function getUserBookmarks(): Promise<PromptDetails[]> {
  const apiKey = process.env.API_KEY || localStorage.getItem('api_key');
  const response = await fetch(`${process.env.API_BASE_URL}/api/user/bookmarks`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

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
  } catch (error: any) {
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

export async function importPrompts(importData: any, options?: {
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
