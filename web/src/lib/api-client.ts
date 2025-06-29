/**
 * API客户端
 * 用于前端组件访问Next.js API Routes
 */

import axios, { AxiosInstance } from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse,
  PromptFilterParams,
  PromptApi, 
  UserApi, 
  McpApi, 
} from '@/types/api';
import { Prompt, PromptVersion } from '../../../supabase/lib/types';

// 统一的数据提取助手，消除多层嵌套问题
function extractResponseData<T>(response: any, fallback: T): T {
  // 处理标准API响应格式: response.data.data
  if (response?.data?.success && response.data.data !== undefined) {
    return response.data.data;
  }
  // 处理简单格式: response.data
  if (response?.data !== undefined) {
    return response.data;
  }
  return fallback;
}

// 安全的可选数据提取
function extractOptionalData<T>(response: any, fallback: T | null = null): T | null {
  try {
    return extractResponseData(response, fallback);
  } catch {
    return fallback;
  }
}

// 创建主API实例 - 访问Next.js API Routes
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建MCP API实例 - 直接访问MCP服务器
// 注意：大部分情况下应该通过Next.js API Routes代理请求，这里提供作为备选
const mcpApiClient = axios.create({
  baseURL: 'http://localhost:9010/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证信息
const addAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 从localStorage获取API密钥
    const apiKey = localStorage.getItem('api_key');
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    
    return config;
  });
};

// 响应拦截器：统一错误处理
const addResponseInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // 处理401未授权错误，但要避免过于激进的清除认证
      if (error.response?.status === 401) {
        // 获取请求的URL路径，避免在某些特定API调用失败时清除认证
        const requestUrl = error.config?.url || '';
        
        // 只有在关键认证路径失败时才清除认证信息
        const shouldClearAuth = 
          requestUrl.includes('/auth/') || 
          requestUrl.includes('/user') ||
          (error.response?.data?.error && 
           (error.response.data.error.includes('令牌') || 
            error.response.data.error.includes('token') ||
            error.response.data.error.includes('未登录')));
        
        if (shouldClearAuth) {
          console.warn('认证失败，清除认证信息:', requestUrl);
          
          // 清除认证信息
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          // 如果不是登录页面，重定向到登录页
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/signin')) {
            // 延迟重定向，避免在正常操作中意外跳转
            setTimeout(() => {
              window.location.href = '/auth/signin';
            }, 1000);
          }
        } else {
          console.warn('API请求401错误，但不清除认证:', requestUrl, error.response?.data);
        }
      }
      
      console.error('API请求错误:', error.response?.data || error.message);
      return Promise.reject(error);
    },
  );
};

// 添加拦截器
addAuthInterceptor(apiClient);
addAuthInterceptor(mcpApiClient);
addResponseInterceptor(apiClient);
addResponseInterceptor(mcpApiClient);

/**
 * 提示词相关API
 */
export const promptsApi = {
  // 获取提示词列表
  getPrompts: async (filters?: PromptFilterParams): Promise<PaginatedResponse<Prompt>> => {
    const response = await apiClient.get<PromptApi.GetPromptsResponse>('/prompts', { params: filters });
    return extractResponseData(response, { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  },
  
  // 获取单个提示词详情
  getPrompt: async (id: string): Promise<Prompt> => {
    const response = await apiClient.get<PromptApi.GetPromptResponse>(`/prompts/${id}`);
    const data = extractResponseData(response, null);
    if (!data) {
      throw new Error(`提示词 ${id} 不存在`);
    }
    return data;
  },
  
  // 创建新提示词
  createPrompt: async (prompt: PromptApi.CreatePromptRequest): Promise<Prompt> => {
    const response = await apiClient.post<PromptApi.CreatePromptResponse>('/prompts', prompt);
    const data = extractResponseData(response, null);
    if (!data) {
      throw new Error('创建提示词失败');
    }
    return data;
  },
  
  // 更新提示词
  updatePrompt: async (id: string, prompt: PromptApi.UpdatePromptRequest): Promise<Prompt> => {
    const response = await apiClient.put<PromptApi.UpdatePromptResponse>(`/prompts/${id}`, prompt);
    const data = extractResponseData(response, null);
    if (!data) {
      throw new Error(`更新提示词 ${id} 失败`);
    }
    return data;
  },
  
  // 删除提示词
  deletePrompt: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete<PromptApi.DeletePromptResponse>(`/prompts/${id}`);
    const data = extractResponseData(response, { deleted: false });
    return data.deleted || false;
  },
  
  // 获取分类列表
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<PromptApi.GetCategoriesResponse>('/categories');
    return extractResponseData(response, []);
  },
  
  // 获取标签列表
  getTags: async (): Promise<string[]> => {
    const response = await apiClient.get<PromptApi.GetTagsResponse>('/tags');
    return extractResponseData(response, []);
  },
  
  // 获取提示词版本历史
  getVersions: async (promptId: string): Promise<PromptVersion[]> => {
    const response = await apiClient.get<PromptApi.GetVersionsResponse>(`/prompts/versions/${promptId}`);
    return extractResponseData(response, []);
  },
  
  // 恢复到之前的版本
  restoreVersion: async (promptId: string, version: number): Promise<Prompt> => {
    const response = await apiClient.post<PromptApi.RestoreVersionResponse>(
      `/prompts/restore/${promptId}/${version}`,
    );
    const data = extractResponseData(response, null);
    if (!data) {
      throw new Error(`恢复提示词 ${promptId} 版本 ${version} 失败`);
    }
    return data;
  },
};

/**
 * 用户认证相关API
 */
export const authApi = {
  // 用户登录
  signIn: async (email: string, password: string): Promise<UserApi.SignInResponse['data']> => {
    const response = await apiClient.post<UserApi.SignInResponse>(
      '/auth/signin', 
      { email, password },
    );
    
    const data = extractResponseData(response, null) as UserApi.SignInResponse['data'] | null;
    if (data) {
      // 保存认证信息
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },
  
  // 用户注册
  signUp: async (email: string, password: string, displayName?: string): Promise<UserApi.SignUpResponse['data']> => {
    const response = await apiClient.post<UserApi.SignUpResponse>(
      '/auth/signup', 
      { email, password, displayName },
    );
    
    const data = extractResponseData(response, null) as UserApi.SignUpResponse['data'] | null;
    if (data) {
      // 保存认证信息
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },
  
  // 退出登录
  signOut: async (): Promise<boolean> => {
    const response = await apiClient.get<UserApi.SignOutResponse>('/auth/signout');
    
    // 清除本地存储的认证信息
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    return response.data.success;
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiClient.get<UserApi.GetUserResponse>('/auth/user');
    return extractOptionalData(response, null);
  },
  
  // 获取API密钥列表
  getApiKeys: async () => {
    const response = await apiClient.get<UserApi.GetApiKeysResponse>('/keys');
    return extractResponseData(response, []);
  },
  
  // 创建新的API密钥
  createApiKey: async (name: string, expiresInDays?: number) => {
    const response = await apiClient.post<UserApi.CreateApiKeyResponse>(
      '/keys', 
      { name, expiresInDays },
    );
    const data = extractResponseData(response, null) as { key?: string } | null;
    return data?.key;
  },
  
  // 删除API密钥
  deleteApiKey: async (keyId: string) => {
    const response = await apiClient.delete<UserApi.DeleteApiKeyResponse>(`/keys/${keyId}`);
    const data = extractResponseData(response, { deleted: false });
    return data.deleted || false;
  },
};

/**
 * MCP工具调用API
 */
export const mcpApi = {
  // 调用MCP工具
  invokeTool: async (name: string, args: Record<string, any> = {}): Promise<McpApi.McpToolResponse['data']> => {
    const response = await apiClient.post<McpApi.McpToolResponse>('/mcp/tools', { name, arguments: args });
    return extractResponseData(response, null) as McpApi.McpToolResponse['data'];
  },
  
  // 获取可用工具列表
  getTools: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/mcp/tools');
    return extractResponseData(response, []);
  },
};

export default {
  prompts: promptsApi,
  auth: authApi,
  mcp: mcpApi,
};
