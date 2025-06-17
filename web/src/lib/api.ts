import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters, PromptUsage, PromptFeedback, PromptPerformance } from '@/types';
import { PromptQualityAnalysis } from '@/types/performance';

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
export const getCategories = async (): Promise<string[]> => {
  try {
    // 通过Next.js API Routes调用，符合项目架构
    const response = await api.get<{success: boolean; data: Category[]}>('/categories');
    console.log('分类API响应:', response.data);
    
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      // 将类别对象数组转换为字符串数组
      const categories = response.data.data.map(category => category.name);
      console.log('获取到的分类:', categories);
      return categories;
    }
    
    // API返回空数据或不成功时，抛出错误而不是使用备用数据
    throw new Error('API返回空数据或请求不成功');
  } catch (error) {
    console.error('获取分类失败:', error);
    // 直接抛出错误，不使用备用机制
    throw new Error(`获取分类失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 获取所有标签
export const getTags = async (): Promise<string[]> => {
  try {
    // 直接调用Web服务API，不再依赖MCP服务
    const response = await api.get<any>('/tags');
    console.log('标签API响应:', response.data);
    
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      return response.data.data;
    }
    
    console.log('API返回空标签数据或不成功，使用默认标签');
    // 如果API返回空数据或失败，返回默认标签
    return ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
  } catch (error) {
    console.error('获取标签失败:', error);
    // 发生错误时也返回默认标签
    return ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
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
    if (filters?.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
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
export const getPromptDetails = async (identifier: string): Promise<PromptDetails> => {
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

    console.log('获取提示词详情:', identifier, '用户ID:', userId || '未登录');
    
    // 在服务器端渲染时使用完整URL，在客户端使用默认的api实例
    let response;
    if (typeof window === 'undefined') {
      // 服务器端：使用完整URL调用
      response = await axios.get(`${baseUrl}/api/prompts/${encodeURIComponent(identifier)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'user-id': userId } : {}),
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
    } else {
      // 客户端：使用相对路径
      response = await api.get(`/prompts/${encodeURIComponent(identifier)}`, {
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
    console.error(`获取提示词 ${identifier} 详情失败:`, error);
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
        token = localStorage.getItem('auth.token') || undefined;
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
export const updatePrompt = async (id: string, prompt: Partial<PromptDetails>, tokenArg?: string): Promise<PromptDetails> => {
  try {
    let token = tokenArg;
    
    // 如果没有提供token，尝试从Supabase获取当前session的token
    if (!token && typeof window !== 'undefined') {
      try {
        // 动态导入Supabase客户端以避免SSR问题
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          token = session.access_token;
          console.log('从Supabase session获取到token');
        }
      } catch (error) {
        console.error('获取Supabase token失败:', error);
      }
    }
    
    if (!token) {
      throw new Error('未找到有效的认证令牌，请重新登录');
    }
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('发送更新提示词请求:', { id, hasToken: !!token });
    
    const response = await api.put(`/prompts/${encodeURIComponent(id)}`, prompt, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.error || '更新提示词失败');
    }
    
    return response.data.prompt as PromptDetails;
  } catch (error: any) {
    console.error('更新提示词失败:', error);
    
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
    console.log(`获取提示词 ${promptId} 性能数据`);
    
    // 尝试从API获取真实数据
    const response = await api.get(`/performance/${promptId}`);
    
    if (response.data.success && response.data.data) {
      const performanceData = response.data.data.performance;
      
      // 如果有真实数据，转换格式并返回
      if (performanceData && performanceData.length > 0) {
        const latestPerformance = performanceData[0];
        return {
          prompt_id: promptId,
          total_usage: latestPerformance.usageCount || 0,
          success_rate: 0.95, // 默认成功率
          average_rating: latestPerformance.avgRating || 0,
          feedback_count: latestPerformance.feedbackCount || 0,
          average_latency: latestPerformance.avgLatencyMs || 0,
          token_stats: {
            total_input: (latestPerformance.avgInputTokens || 0) * (latestPerformance.usageCount || 0),
            total_output: (latestPerformance.avgOutputTokens || 0) * (latestPerformance.usageCount || 0),
            input_avg: latestPerformance.avgInputTokens || 0,
            output_avg: latestPerformance.avgOutputTokens || 0
          },
          version_distribution: {
            [`${latestPerformance.promptVersion || 1}.0`]: latestPerformance.usageCount || 0
          }
        };
      }
    }
    
    // 如果没有真实数据，返回默认值
    console.log(`提示词 ${promptId} 暂无性能数据，返回默认值`);
    return {
      prompt_id: promptId,
      total_usage: 0,
      success_rate: 0,
      average_rating: 0,
      feedback_count: 0,
      average_latency: 0,
      token_stats: {
        total_input: 0,
        total_output: 0,
        input_avg: 0,
        output_avg: 0
      },
      version_distribution: {}
    };
  } catch (error) {
    console.error(`获取提示词 ${promptId} 性能数据失败:`, error);
    
    // 出错时返回默认值
    return {
      prompt_id: promptId,
      total_usage: 0,
      success_rate: 0,
      average_rating: 0,
      feedback_count: 0,
      average_latency: 0,
      token_stats: {
        total_input: 0,
        total_output: 0,
        input_avg: 0,
        output_avg: 0
      },
      version_distribution: {}
    };
  }
};

// 获取性能报告
export const getPerformanceReport = async (promptId: string): Promise<any> => {
  try {
    console.log(`获取提示词 ${promptId} 性能报告`);
    
    // 尝试从API获取真实数据
    const response = await api.get(`/performance/${promptId}/report`);
    
    if (response.data.success && response.data.data && response.data.data.report) {
      const report = response.data.data.report;
      return {
        suggestions: report.optimizationSuggestions || [
          '暂无优化建议，请增加使用量以获得更准确的性能分析'
        ],
        insights: {
          most_common_issues: report.feedbackThemes ? Object.keys(report.feedbackThemes) : [],
          best_performing_versions: report.versionComparison ? 
            report.versionComparison
              .sort((a: any, b: any) => (b.avgRating || 0) - (a.avgRating || 0))
              .slice(0, 3)
              .map((v: any) => `${v.promptVersion}.0`) : [],
          recommended_models: ['gpt-4', 'gpt-3.5-turbo'] // 默认推荐模型
        },
        performance: report.performance,
        prompt: report.prompt
      };
    }
    
    // 如果没有真实数据，返回默认值
    console.log(`提示词 ${promptId} 暂无性能报告数据，返回默认值`);
    return {
      suggestions: [
        '该提示词暂无使用数据，无法生成优化建议',
        '建议开始使用该提示词并收集用户反馈',
        '考虑添加更多示例来提高输出质量'
      ],
      insights: {
        most_common_issues: [],
        best_performing_versions: [],
        recommended_models: ['gpt-4', 'gpt-3.5-turbo']
      }
    };
  } catch (error) {
    console.error(`获取提示词 ${promptId} 性能报告失败:`, error);
    
    // 出错时返回默认值
    return {
      suggestions: [
        '无法获取性能数据，请稍后重试',
        '如果问题持续，请联系技术支持'
      ],
      insights: {
        most_common_issues: [],
        best_performing_versions: [],
        recommended_models: []
      }
    };
  }
};

// 获取提示词质量分析
export const getPromptQualityAnalysis = async (promptId: string): Promise<PromptQualityAnalysis> => {
  try {
    // 模拟API调用，实际应该调用后端API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟返回数据
    const mockData: PromptQualityAnalysis = {
      overallScore: Math.floor(Math.random() * 40) + 60, // 60-100之间的随机分数
      level: Math.random() > 0.7 ? 'excellent' : Math.random() > 0.4 ? 'good' : 'fair',
      dimensions: {
        clarity: {
          name: '清晰度',
          score: Math.floor(Math.random() * 30) + 70,
          description: '指示词的表达是否清晰明确'
        },
        completeness: {
          name: '完整性', 
          score: Math.floor(Math.random() * 25) + 65,
          description: '是否包含所有必要信息'
        },
        professionalism: {
          name: '专业性',
          score: Math.floor(Math.random() * 35) + 65,
          description: '用词和结构是否专业规范'
        },
        actionability: {
          name: '可操作性',
          score: Math.floor(Math.random() * 40) + 60,
          description: 'AI能否根据指令采取具体行动'
        }
      },
      strengths: [
        '指令结构清晰，逻辑性强',
        '使用了具体的示例和场景',
        '语言表达简洁明了'
      ],
      weaknesses: [
        '可以增加更多上下文信息',
        '某些术语需要进一步解释'
      ],
      recommendations: [
        '在开头添加简短的背景说明',
        '使用更具体的动词描述所需行为',
        '考虑添加输出格式的示例',
        '增加约束条件以确保结果准确性'
      ],
      comparisonWithCategory: {
        ranking: Math.floor(Math.random() * 50) + 1,
        totalInCategory: 150,
        percentile: Math.floor(Math.random() * 30) + 70
      },
      historicalData: [
        { date: '2024-01-01', score: 65 },
        { date: '2024-01-15', score: 72 },
        { date: '2024-02-01', score: 78 },
        { date: '2024-02-15', score: 82 }
      ],
      metadata: {
        analysisDate: new Date().toISOString(),
        modelVersion: 'v2.1.0',
        confidence: 0.85
      }
    };

    return mockData;
  } catch (error) {
    console.error('获取质量分析失败:', error);
    throw new Error('获取质量分析失败');
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
        data: { promptId, type: 'bookmark' }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '取消收藏失败');
      }
      
      return { bookmarked: false };
    } else {
      // 添加收藏
      const response = await api.post('/social/interactions', {
        promptId,
        type: 'bookmark'
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
        data: { promptId, type: 'like' }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || '取消点赞失败');
      }
      
      return { liked: false };
    } else {
      // 添加点赞
      const response = await api.post('/social/interactions', {
        promptId,
        type: 'like'
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
