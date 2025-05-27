import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters, PromptUsage, PromptFeedback, PromptPerformance } from '@/types';

// 创建Axios实例
const api = axios.create({
  // Vercel部署时使用相对路径
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建MCP API实例，支持统一部署和分离部署
const mcpApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MCP_API_URL || '/api/mcp',
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
    // 通过Next.js API Routes调用，符合项目架构
    const response = await api.get<{success: boolean; data: string[]}>('/tags');
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
    const response = await mcpApi.get<any>('/prompts/names');
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

    // 使用新的REST API端点
    console.log('发送请求到:', `/public-prompts?${queryParams.toString()}`);
    const response = await api.get<any>(`/public-prompts?${queryParams.toString()}`);
    
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
    // 使用本地API路由
    const response = await api.get<any>(`/prompts/${name}`);
    
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
    const response = await mcpApi.post<any>('/mcp/tools/create_prompt/invoke', prompt);
    const result = response.data?.content?.text ? JSON.parse(response.data.content.text) : {};
    return result as PromptDetails;
  } catch (error) {
    console.error('创建提示词失败:', error);
    throw error;
  }
};

// 更新提示词
export const updatePrompt = async (name: string, prompt: Partial<PromptDetails>): Promise<PromptDetails> => {
  try {
    const response = await mcpApi.post<any>('/mcp/tools/update_prompt/invoke', { name, ...prompt });
    const result = response.data?.content?.text ? JSON.parse(response.data.content.text) : {};
    return result as PromptDetails;
  } catch (error) {
    console.error(`更新提示词 ${name} 失败:`, error);
    throw error;
  }
};

// 删除提示词
export const deletePrompt = async (name: string): Promise<boolean> => {
  try {
    const response = await mcpApi.post<any>('/mcp/tools/delete_prompt/invoke', { name });
    const result = response.data?.content?.text ? JSON.parse(response.data.content.text) : { success: false };
    return !!result.success;
  } catch (error) {
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
    
    const response = await mcpApi.post<any>('/mcp/tools/track_prompt_usage/invoke', params);
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
    
    const response = await mcpApi.post<any>('/mcp/tools/submit_prompt_feedback/invoke', params);
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
  const response = await mcpApi.post<any>(`/mcp/tools/${toolName}/invoke`, { params });
  return response.data;
};

// 获取可用工具列表
export const getMcpTools = async (): Promise<any> => {
  const response = await mcpApi.get<any>('/mcp/tools');
  return response.data;
};

export default api;
