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

// 获取所有分类
export const getCategories = async (): Promise<string[]> => {
  try {
    // 通过Next.js API Routes调用，符合项目架构
    const response = await api.get<{success: boolean; data: string[]}>('/categories');
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
    
    const response = await axios.get<any>(`${baseUrl}/api/prompts/${name}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || '获取提示词详情失败');
    }
    
    return response.data.data as PromptDetails;
  } catch (error) {
    console.error(`获取提示词 ${name} 详情失败:`, error);
    throw error;
  }
};

// 创建新提示词
export const createPrompt = async (prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    // 获取认证令牌
    let token = null;
    if (typeof window !== 'undefined') {
      // 尝试从浏览器存储中获取令牌
      token = localStorage.getItem('auth.token'); // Supabase令牌
      
      // 如果没有找到令牌，检查其他可能的存储地点
      if (!token) {
        try {
          // 尝试从会话存储中获取
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
    
    // 执行创建请求
    console.log('发送创建提示词请求:', { prompt, hasToken: !!token });
    const response = await api.post<ApiResponse<PromptDetails>>('/prompts', prompt, { 
      headers 
    });
    
    if (!response.data || !response.data.data) {
      throw new Error((response.data as any)?.message || '创建提示词失败');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('创建提示词失败:', error.response?.data || error);
    throw error;
  }
};

// 更新提示词
export const updatePrompt = async (name: string, prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
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

    console.log('发送更新提示词请求:', { name, prompt, hasToken: !!token });
    
    // 直接调用Web服务API，不再依赖MCP服务
    const response = await api.put<any>(`/prompts/${encodeURIComponent(name)}`, prompt, {
      headers
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || '更新提示词失败');
    }

    console.log('提示词更新成功:', response.data.data);
    return response.data.data as PromptDetails;

  } catch (error: any) {
    console.error(`更新提示词 ${name} 失败:`, error);
    throw new Error(`更新提示词失败: ${error.response?.data?.message || error.message}`);
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

export default api;
