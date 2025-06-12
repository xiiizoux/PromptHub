import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters, PromptUsage, PromptFeedback, PromptPerformance } from '@/types';

// 创建Axios实例 - Docker部署配置
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建MCP API实例 - Docker部署时通过代理访问
const mcpApi = axios.create({
  baseURL: '/api/mcp',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器添加API密钥
api.interceptors.request.use((config) => {
  // 从环境变量或本地存储获取API密钥
  const apiKey = process.env.API_KEY || localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// 也为MCP API实例添加相同的拦截器
mcpApi.interceptors.request.use((config) => {
  const apiKey = process.env.API_KEY || localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// 响应拦截器处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API请求错误:', error.response?.data || error.message);
    return Promise.reject(error);
  }
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
export const getCategories = async (): Promise<Category[]> => {
  try {
    // 通过Next.js API Routes调用，符合项目架构
    const response = await api.get<{success: boolean; data: Category[]}>('/categories');
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
};

// 获取所有标签
export const getTags = async (): Promise<string[]> => {
  try {
    // 直接调用Web服务API，不再依赖MCP服务
    const response = await api.get<any>('/tags');
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('获取标签失败:', error);
    return [];
  }
};

// 获取所有提示词名称
export const getPromptNames = async (): Promise<string[]> => {
  try {
    const response = await mcpApi.get<any>('/prompts');
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

    // 获取当前用户ID（如果有的话）
    let userId = null;
    if (typeof localStorage !== 'undefined') {
      const userSession = localStorage.getItem('supabase.auth.token');
      if (userSession) {
        try {
          const parsedSession = JSON.parse(userSession);
          userId = parsedSession?.currentSession?.user?.id;
        } catch (e) {
          console.error('解析用户会话信息失败:', e);
        }
      }
    }

    // 使用新的REST API端点
    console.log('发送请求到:', `/public-prompts?${queryParams.toString()}`, '用户ID:', userId);
    const response = await api.get<any>(`/public-prompts?${queryParams.toString()}`, {
      headers: userId ? { 'x-user-id': userId } : {}
    });
    
    // 输出原始响应信息
    console.log('获取提示词响应:', response.data);
    
    // 直接使用响应数据
    const { data, total, page, pageSize, totalPages, success } = response.data;
    
    // 检查数据格式
    console.log('提示词数据:', data);
    
    // 如果响应失败或数据为空，则返回空数组
    if (!success || !data) {
      console.error('响应成功但没有数据');
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
    
    return { 
      data: data, 
      total: total || 0, 
      page: page || 1, 
      pageSize: pageSize || 10, 
      totalPages: totalPages || 1 
    };
  } catch (error) {
    console.error('获取提示词列表失败:', error);
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }
};

// 获取提示词详情
export const getPromptDetails = async (name: string): Promise<PromptDetails> => {
  try {
    // 在服务端渲染时使用完整URL，在客户端使用相对路径
    const baseUrl = typeof window === 'undefined' 
      ? `http://localhost:${process.env.FRONTEND_PORT || 9011}` 
      : '';
    
    // 获取当前用户ID（如果有的话）
    let userId = null;
    let userToken = null;
    
    // 尝试不同的存储位置获取用户信息
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // 尝试从 Supabase auth token 获取
      try {
        const supabaseAuthStr = localStorage.getItem('supabase.auth.token');
        if (supabaseAuthStr) {
          const supabaseAuth = JSON.parse(supabaseAuthStr);
          userId = supabaseAuth?.currentSession?.user?.id;
          userToken = supabaseAuth?.currentSession?.access_token;
          console.log('从 supabase.auth.token 获取到用户ID:', userId);
        }
      } catch (e) {
        console.error('解析 supabase.auth.token 失败:', e);
      }
      
      // 如果上面的方法失败，尝试从 sb-xxx-auth-token 获取
      if (!userId) {
        try {
          // 遍历所有localStorage条目，寻找 Supabase 令牌
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('-auth-token')) {
              const tokenStr = localStorage.getItem(key);
              if (tokenStr) {
                const tokenData = JSON.parse(tokenStr);
                userId = tokenData?.user?.id;
                userToken = tokenData?.access_token;
                if (userId) {
                  console.log('从', key, '获取到用户ID:', userId);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('遍历localStorage寻找用户ID失败:', e);
        }
      }
    }

    console.log('获取提示词详情:', name, '用户ID:', userId || '未登录');
    
    // 在服务器端渲染时使用完整URL，在客户端使用默认的api实例
    let response;
    if (typeof window === 'undefined') {
      // 服务器端：使用完整URL调用
      response = await axios.get(`${baseUrl}/api/prompts/${encodeURIComponent(name)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'user-id': userId } : {}),
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
    } else {
      // 客户端：使用相对路径
      response = await api.get(`/prompts/${encodeURIComponent(name)}`, {
        headers: {
          ...(userId ? { 'user-id': userId } : {}),
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
    }
    
    if (!response.data.success) {
      throw new Error(response.data.error || '获取提示词详情失败');
    }
    
    return response.data.prompt as PromptDetails;
  } catch (error) {
    console.error(`获取提示词 ${name} 详情失败:`, error);
    throw error;
  }
};

// 创建新提示词
export const createPrompt = async (prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    // 获取认证令牌 - 使用正确的Supabase存储键
    let token = null;
    
    if (typeof window !== 'undefined') {
      // 方法1: 检查PromptHub专用的存储键
      try {
        const authData = localStorage.getItem('prompthub-auth-token');
        if (authData) {
          const parsedAuth = JSON.parse(authData);
          token = parsedAuth?.access_token;
          console.log('从prompthub-auth-token获取到认证令牌');
        }
      } catch (e) {
        console.warn('解析prompthub-auth-token失败:', e);
      }
      
      // 方法2: 检查标准的auth.token（备用）
      if (!token) {
        token = localStorage.getItem('auth.token');
      }
      
      // 方法3: 检查其他Supabase标准格式的令牌存储（备用）
      if (!token) {
        try {
          // 遍历localStorage寻找Supabase会话令牌
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('auth-token')) {
              const tokenData = localStorage.getItem(key);
              if (tokenData) {
                const parsedData = JSON.parse(tokenData);
                token = parsedData?.access_token;
                if (token) {
                  console.log('从其他Supabase存储获取到认证令牌:', key);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.warn('从其他Supabase存储获取令牌失败:', e);
        }
      }
      
      // 方法4: 尝试从supabase.auth.token获取（最后备用）
      if (!token) {
        try {
          const authSession = localStorage.getItem('supabase.auth.token');
          if (authSession) {
            const parsed = JSON.parse(authSession);
            token = parsed?.currentSession?.access_token;
          }
        } catch (e) {
          console.warn('解析supabase.auth.token失败:', e);
        }
      }
    }
    
    console.log('创建提示词 - 认证令牌状态:', { hasToken: !!token, tokenLength: token?.length });
    
    if (!token) {
      throw new Error('未提供认证令牌，请重新登录');
    }
    
    // 添加认证头
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 执行创建请求
    console.log('发送创建提示词请求:', { prompt, hasToken: !!token });
    const response = await api.post('/prompts', prompt, { 
      headers 
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || '创建提示词失败');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('创建提示词失败:', error.response?.data || error);
    throw error;
  }
};

// 更新提示词
export const updatePrompt = async (id: string, prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    // 获取认证令牌 - 使用正确的Supabase存储键
    let token = null;
    
    if (typeof window !== 'undefined') {
      // 方法1: 检查PromptHub专用的存储键
      try {
        const authData = localStorage.getItem('prompthub-auth-token');
        if (authData) {
          const parsedAuth = JSON.parse(authData);
          token = parsedAuth?.access_token;
          console.log('从prompthub-auth-token获取到认证令牌');
        }
      } catch (e) {
        console.warn('解析prompthub-auth-token失败:', e);
      }
      
      // 方法2: 检查标准的auth.token（备用）
      if (!token) {
        token = localStorage.getItem('auth.token');
      }
      
      // 方法3: 检查其他Supabase标准格式的令牌存储（备用）
      if (!token) {
        try {
          // 遍历localStorage寻找Supabase会话令牌
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('auth-token')) {
              const tokenData = localStorage.getItem(key);
              if (tokenData) {
                const parsedData = JSON.parse(tokenData);
                token = parsedData?.access_token;
                if (token) {
                  console.log('从其他Supabase存储获取到认证令牌:', key);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.warn('从其他Supabase存储获取令牌失败:', e);
        }
      }
      
      // 方法4: 尝试从supabase.auth.token获取（最后备用）
      if (!token) {
        try {
          const authSession = localStorage.getItem('supabase.auth.token');
          if (authSession) {
            const parsed = JSON.parse(authSession);
            token = parsed?.currentSession?.access_token;
          }
        } catch (e) {
          console.warn('解析supabase.auth.token失败:', e);
        }
      }
    }
    
    console.log('认证令牌状态:', { hasToken: !!token, tokenLength: token?.length });
    
    if (!token) {
      throw new Error('未提供认证令牌，请重新登录');
    }
    
    // 添加认证头
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('发送更新提示词请求:', { id, prompt, hasToken: !!token });
    
    // 使用我们的新API端点
    const response = await api.put(`/prompts/${encodeURIComponent(id)}`, prompt, {
      headers
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || '更新提示词失败');
    }

    console.log('提示词更新成功:', response.data.prompt);
    return response.data.prompt as PromptDetails;

  } catch (error: any) {
    console.error(`更新提示词 ${id} 失败:`, error);
    if (error.response?.status === 401) {
      throw new Error('认证失败，请重新登录');
    }
    throw new Error(`更新提示词失败: ${error.response?.data?.error || error.message}`);
  }
};

// 删除提示词
export const deletePrompt = async (name: string): Promise<boolean> => {
  try {
    // 获取认证令牌
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth.token');
      
      if (!token) {
        try {
          const authSession = localStorage.getItem('supabase.auth.token');
          if (authSession) {
            const parsed = JSON.parse(authSession);
            token = parsed?.currentSession?.access_token;
          }
        } catch (e) {
          console.warn('解析会话存储令牌失败:', e);
        }
      }
    }
    
    // 添加认证头
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('发送删除提示词请求:', { name, hasToken: !!token });
    
    // 直接调用Web服务API，不再依赖MCP服务
    const response = await api.delete<any>(`/prompts/${encodeURIComponent(name)}`, {
      headers
    });
    
    return response.data.success === true;
  } catch (error: any) {
    console.error(`删除提示词 ${name} 失败:`, error);
    return false;
  }
};

/**
 * 性能追踪相关API
 */

// 记录提示词使用
export const trackPromptUsage = async (data: Omit<PromptUsage, 'usage_id' | 'created_at'>): Promise<{ usage_id: string }> => {
  try {
    const params = {
      prompt_id: data.prompt_id,
      prompt_version: data.version, // 前端使用version而后端使用prompt_version
      model: data.model || 'unknown',
      input_tokens: data.input_tokens,
      output_tokens: data.output_tokens,
      latency_ms: data.latency, // 前端使用latency而后端使用latency_ms
      session_id: 'frontend-session' // 前端没有这个字段，设置一个默认值
    };
    
    const response = await mcpApi.post<any>('/tools/track_prompt_usage/invoke', params);
    const result = response.data;
    return { usage_id: result.data?.usageId || 'unknown' };
  } catch (error) {
    console.error('记录提示词使用失败:', error);
    return { usage_id: 'error' };
  }
};

// 提交提示词反馈
export const submitPromptFeedback = async (feedback: Omit<PromptFeedback, 'created_at'>): Promise<boolean> => {
  try {
    const params = {
      usage_id: feedback.usage_id,
      rating: feedback.rating,
      feedback_text: feedback.comments, // 前端使用comments而后端使用feedback_text
      categories: [] // 前端没有这个字段，设置空数组
    };
    
    const response = await mcpApi.post<any>('/tools/submit_prompt_feedback/invoke', params);
    return response.data.success === true;
  } catch (error) {
    console.error('提交提示词反馈失败:', error);
    return false;
  }
};

// 获取提示词性能数据
export const getPromptPerformance = async (promptId: string): Promise<PromptPerformance> => {
  try {
    // 暂时返回模拟数据，因为性能追踪功能需要MCP服务器
    console.log(`获取提示词 ${promptId} 性能数据 - 返回模拟数据`);
    return {
      prompt_id: promptId,
      total_usage: 156,
      success_rate: 0.94,
      average_rating: 4.2,
      feedback_count: 23,
      average_latency: 1250,
      token_stats: {
        total_input: 12450,
        total_output: 8930,
        input_avg: 79.8,
        output_avg: 57.2
      },
      version_distribution: {
        '1.0': 89,
        '2.0': 67
      }
    };
  } catch (error) {
    console.error(`获取提示词 ${promptId} 性能数据失败:`, error);
    throw error;
  }
};

// 获取性能报告
export const getPerformanceReport = async (promptId: string): Promise<any> => {
  try {
    // 暂时返回模拟数据，因为性能追踪功能需要MCP服务器
    console.log(`获取提示词 ${promptId} 性能报告 - 返回模拟数据`);
    return {
      suggestions: [
        '考虑优化提示词的结构，使其更加清晰和具体',
        '添加更多的示例来提高输出质量',
        '考虑针对不同模型调整提示词内容',
        '收集更多用户反馈以进一步优化'
      ],
      insights: {
        most_common_issues: ['输出格式不一致', '回答过于简短'],
        best_performing_versions: ['2.0'],
        recommended_models: ['gpt-4']
      }
    };
  } catch (error) {
    console.error(`获取提示词 ${promptId} 性能报告失败:`, error);
    throw error;
  }
};

/**
 * MCP工具调用API
 */

// 调用MCP工具
export const invokeMcpTool = async (toolName: string, params: any): Promise<any> => {
  const response = await mcpApi.post<any>(`/tools/${toolName}/invoke`, { params });
  return response.data;
};

// 获取可用工具列表
export const getMcpTools = async (): Promise<any> => {
  const response = await mcpApi.get<any>('/tools');
  return response.data;
};

// 社交互动 API (收藏、点赞、分享)
export interface SocialInteraction {
  id: string;
  prompt_id: string;
  user_id: string;
  type: 'like' | 'bookmark' | 'share';
  created_at: string;
}

export async function toggleBookmark(promptId: string): Promise<{ bookmarked: boolean }> {
  const response = await api.post('/prompts/bookmark', { promptId });

  if (response.data.bookmarked !== undefined) {
    return { bookmarked: response.data.bookmarked };
  }

  throw new Error('切换收藏状态失败');
}

export async function toggleLike(promptId: string): Promise<{ liked: boolean }> {
  const response = await api.post('/prompts/like', { promptId });

  if (response.data.liked !== undefined) {
    return { liked: response.data.liked };
  }

  throw new Error('切换点赞状态失败');
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

export async function getPromptInteractions(promptId: string): Promise<{
  likes: number;
  bookmarks: number;
  userLiked: boolean;
  userBookmarked: boolean;
}> {
  const response = await api.get(`/prompts/interactions?promptId=${promptId}`);

  if (!response.data.success) {
    throw new Error('获取互动信息失败');
  }

  return response.data;
}

// 使用历史记录 API
export interface UsageRecord {
  id: string;
  prompt_id: string;
  prompt_name: string;
  prompt_version: number;
  user_id: string;
  session_id?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  created_at: string;
  client_metadata?: any;
}

export async function recordUsage(promptId: string, metadata?: {
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  session_id?: string;
  client_metadata?: any;
}): Promise<void> {
  const response = await api.post('/prompts/usage', { promptId, ...metadata });
  
  if (!response.data.success) {
    throw new Error('记录使用历史失败');
  }
}

export async function getUserUsageHistory(params?: {
  page?: number;
  pageSize?: number;
  promptId?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  data: UsageRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.promptId) queryParams.append('promptId', params.promptId);
  if (params?.model) queryParams.append('model', params.model);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const response = await api.get(`/user/usage-history?${queryParams}`);

  if (!response.data.success) {
    throw new Error('获取使用历史失败');
  }

  return response.data;
}

export async function getUsageStats(): Promise<{
  totalUsage: number;
  thisWeekUsage: number;
  thisMonthUsage: number;
  favoritePrompts: Array<{
    prompt_id: string;
    prompt_name: string;
    usage_count: number;
  }>;
  modelStats: Array<{
    model: string;
    usage_count: number;
  }>;
}> {
  const response = await api.get('/user/usage-stats');

  if (!response.data.success) {
    throw new Error('获取使用统计失败');
  }

  return response.data;
}

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
  } catch (error) {
    // 如果没有找到用户评分，返回null
    return null;
  }
}

// 导入/导出相关
export async function exportPrompts(promptIds: string[], format: 'json' | 'csv' | 'txt' = 'json'): Promise<Blob> {
  const response = await api.post('/prompts/export', { promptIds, format }, {
    responseType: 'blob'
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
  limit: number = 10
): Promise<RecommendationResult[]> {
  const response = await api.post('/recommendations/get', { type, userId, limit });
  
  if (!response.data.success) {
    throw new Error('获取推荐失败');
  }

  return response.data.recommendations;
}

export async function getPersonalizedRecommendations(
  userId: string, 
  limit: number = 10
): Promise<RecommendationResult[]> {
  const response = await api.get(`/recommendations/personalized?userId=${userId}&limit=${limit}`);
  
  if (!response.data.success) {
    throw new Error('获取个性化推荐失败');
  }

  return response.data.recommendations;
}

export async function getSimilarPrompts(
  promptId: string, 
  limit: number = 10
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
  feedback: 'like' | 'dislike' | 'not_interested'
): Promise<void> {
  const response = await api.post('/recommendations/feedback', {
    userId,
    promptId,
    feedback
  });
  
  if (!response.data.success) {
    throw new Error('更新推荐反馈失败');
  }
}

// 性能监控相关API
export interface PerformanceMetrics {
  overall_score: number;
  avg_response_time: number;
  response_time_trend: 'up' | 'down' | 'stable';
  response_time_change: number;
  success_rate: number;
  success_rate_trend: 'up' | 'down' | 'stable';
  success_rate_change: number;
  avg_tokens: number;
  token_usage_trend: 'up' | 'down' | 'stable';
  user_satisfaction: number;
  satisfaction_trend: 'up' | 'down' | 'stable';
  satisfaction_count: number;
  time_series: {
    labels: string[];
    response_times: number[];
    usage_counts: number[];
  };
  usage_distribution: {
    labels: string[];
    values: number[];
  };
}

export interface PerformanceAnalysis {
  key_findings: string[];
  bottlenecks: string[];
  performance_trends: {
    trend: 'improving' | 'declining' | 'stable';
    factors: string[];
  };
}

export interface OptimizationSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expected_improvement: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

export async function getPerformanceMetrics(
  promptId: string, 
  timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<PerformanceMetrics> {
  const response = await api.get(`/performance/metrics?promptId=${promptId}&timeRange=${timeRange}`);
  
  if (!response.data.success) {
    throw new Error('获取性能指标失败');
  }

  return response.data.metrics;
}

export async function getPerformanceAnalysis(
  promptId: string, 
  timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<PerformanceAnalysis> {
  const response = await api.get(`/performance/analysis?promptId=${promptId}&timeRange=${timeRange}`);
  
  if (!response.data.success) {
    throw new Error('获取性能分析失败');
  }

  return response.data.analysis;
}

export async function getOptimizationSuggestions(promptId: string): Promise<OptimizationSuggestion[]> {
  const response = await api.get(`/performance/suggestions?promptId=${promptId}`);
  
  if (!response.data.success) {
    throw new Error('获取优化建议失败');
  }

  return response.data.suggestions;
}

// 获取系统性能数据
export const getSystemPerformance = async () => {
  try {
    const response = await api.get('/performance/system');
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || '获取系统性能数据失败');
    }
  } catch (error: any) {
    console.error('获取系统性能数据失败:', error);
    throw error;
  }
};

export default api;
