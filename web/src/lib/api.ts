import axios from 'axios';
import { PromptInfo, PromptDetails, ApiResponse, PaginatedResponse, PromptFilters, PromptUsage, PromptFeedback, PromptPerformance } from '@/types';
import { PromptQualityAnalysis } from '@/types/performance';
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
      signal: AbortSignal.timeout(3000) // 3秒超时
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
    const response = await api.get<BackendApiResponse<Category[]>>('/categories');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(c => c.name);
    }
    
    // 如果API报告失败或数据格式不正确，记录警告但返回空数组以避免UI崩溃
    console.warn('获取分类失败或返回数据格式不正确:', response.data.error || 'API未返回成功状态');
    return [];
  } catch (error) {
    console.error('获取分类时发生网络或服务器错误:', error);
    // 抛出错误，让调用方可以决定如何处理（例如显示toast）
    throw new Error(`获取分类失败: ${error instanceof Error ? error.message : '未知网络错误'}`);
  }
};

// 获取所有标签
export const getTags = async (): Promise<string[]> => {
  try {
    const response = await api.get<BackendApiResponse<string[]>>('/tags');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // API报告失败或数据格式不正确
    console.warn('获取标签失败或返回数据格式不正确:', response.data.error || 'API未返回成功状态');
    throw new Error('未能从服务器获取标签列表。');
  } catch (error) {
    console.error('获取标签时发生网络或服务器错误:', error);
    // 重新抛出错误，以便UI层可以捕获并向用户显示明确的错误信息
    throw new Error(`获取标签失败: ${error instanceof Error ? error.message : '未知网络错误'}`);
  }
};

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
      headers: userId ? { 'x-user-id': userId } : {}
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

    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.post<any>('/usage/track', params);
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

    // 使用新的解耦API而不是已弃用的MCP API
    const response = await api.post<any>('/feedback/submit', params);
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
    
    // 调用真实的API获取性能数据
    const response = await api.get(`/performance/${promptId}`);
    
    if (response.data.success && response.data.data && response.data.data.performance) {
      const performanceData = response.data.data.performance;
      console.log(`提示词 ${promptId} 获取到真实性能数据:`, performanceData);
      
      return {
        prompt_id: promptId,
        total_usage: performanceData.total_usage || 0,
        success_rate: performanceData.success_rate || 0,
        average_rating: performanceData.average_rating || 0,
        feedback_count: performanceData.feedback_count || 0,
        average_latency: performanceData.average_latency || 0,
        token_stats: performanceData.token_stats || {
          total_input: 0,
          total_output: 0,
          input_avg: 0,
          output_avg: 0
        },
        version_distribution: performanceData.version_distribution || {}
      };
    }
    
    // 如果API没有返回数据，尝试从数据库直接获取
    console.log(`API未返回数据，尝试从metrics端点获取`);
    const metricsResponse = await api.get(`/performance/metrics?promptId=${promptId}&timeRange=30d`);
    
    if (metricsResponse.data.success && metricsResponse.data.metrics) {
      const metrics = metricsResponse.data.metrics;
      console.log(`从metrics获取到数据:`, metrics);
      
      return {
        prompt_id: promptId,
        total_usage: metrics.time_series?.usage_counts?.reduce((a: number, b: number) => a + b, 0) || 0,
        success_rate: metrics.success_rate / 100 || 0, // 转换为小数
        average_rating: metrics.user_satisfaction || 0,
        feedback_count: metrics.satisfaction_count || 0,
        average_latency: metrics.avg_response_time || 0,
        token_stats: {
          total_input: 0,
          total_output: 0,
          input_avg: metrics.avg_tokens || 0,
          output_avg: 0
        },
        version_distribution: {}
      };
    }
    
    console.log(`提示词 ${promptId} 暂无真实性能数据，返回默认值`);
    
    // 返回默认性能数据，避免页面崩溃
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
  } catch (error: any) {
    // 静默处理404错误，避免在控制台显示大量错误信息
    if (error.response?.status !== 404) {
      console.warn(`获取提示词 ${promptId} 性能数据失败:`, error.message);
    }

    // 返回默认性能数据，避免页面崩溃
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
    
    // 尝试从MCP API获取真实数据
    const response = await api.get(`/performance/${promptId}/report`);
    
    if (response.data.success && response.data.data && response.data.data.report) {
      const report = response.data.data.report;
      console.log(`提示词 ${promptId} 获取到真实性能报告:`, report);
      
      return {
        suggestions: report.optimizationSuggestions || [
          '基于真实数据的优化建议：请增加使用量以获得更准确的性能分析'
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
    
    // 如果MCP API没有数据，尝试从性能指标API获取
    console.log(`MCP API未返回报告数据，尝试从建议API获取`);
    const suggestionsResponse = await api.get(`/performance/suggestions?promptId=${promptId}`);
    
    if (suggestionsResponse.data.success && suggestionsResponse.data.suggestions) {
      const suggestions = suggestionsResponse.data.suggestions;
      console.log(`从建议API获取到数据:`, suggestions);
      
      return {
        suggestions: suggestions.optimizationSuggestions || [
          '基于当前数据的优化建议',
          '建议继续收集使用数据以获得更精确的分析'
        ],
        insights: {
          most_common_issues: suggestions.issues || [],
          best_performing_versions: suggestions.bestVersions || [],
          recommended_models: suggestions.recommendedModels || ['gpt-4', 'gpt-3.5-turbo']
        }
      };
    }
    
    // 如果没有真实数据，返回基于当前情况的默认值
    console.log(`提示词 ${promptId} 暂无性能报告数据，返回基于实际情况的默认值`);
    return {
      suggestions: [
        '该提示词需要更多使用数据来生成准确的优化建议',
        '建议增加用户反馈收集以改进性能分析',
        '考虑添加更多使用示例来提高输出质量',
        '监控响应时间并根据需要优化提示词长度'
      ],
      insights: {
        most_common_issues: [],
        best_performing_versions: [],
        recommended_models: ['gpt-4', 'gpt-3.5-turbo']
      }
    };
  } catch (error: any) {
    // 静默处理404错误，避免在控制台显示大量错误信息
    if (error.response?.status !== 404) {
      console.warn(`获取提示词 ${promptId} 性能报告失败:`, error.message);
    }

    // 出错时返回合理的默认值
    return {
      suggestions: [
        '暂时无法获取性能数据，请稍后重试',
        '如果问题持续，请检查网络连接或联系技术支持',
        '建议先确保提示词有使用记录后再查看性能分析'
      ],
      insights: {
        most_common_issues: ['数据获取失败'],
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
  try {
    const response = await api.get(`/performance/metrics?promptId=${promptId}&timeRange=${timeRange}`);

    if (!response.data.success) {
      throw new Error('获取性能指标失败');
    }

    return response.data.metrics;
  } catch (error: any) {
    // 静默处理404错误
    if (error.response?.status !== 404) {
      console.warn(`获取性能指标失败:`, error.message);
    }

    // 返回默认指标数据
    return {
      overall_score: 0,
      avg_response_time: 0,
      response_time_trend: 'stable',
      response_time_change: 0,
      success_rate: 0,
      success_rate_trend: 'stable',
      success_rate_change: 0,
      avg_tokens: 0,
      token_usage_trend: 'stable',
      user_satisfaction: 0,
      satisfaction_trend: 'stable',
      satisfaction_count: 0,
      time_series: {
        labels: [],
        response_times: [],
        usage_counts: []
      },
      usage_distribution: {
        labels: [],
        values: []
      }
    };
  }
}

export async function getPerformanceAnalysis(
  promptId: string,
  timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<PerformanceAnalysis> {
  try {
    const response = await api.get(`/performance/analysis?promptId=${promptId}&timeRange=${timeRange}`);

    if (!response.data.success) {
      throw new Error('获取性能分析失败');
    }

    return response.data.analysis;
  } catch (error: any) {
    // 静默处理404错误
    if (error.response?.status !== 404) {
      console.warn(`获取性能分析失败:`, error.message);
    }

    // 返回默认分析数据
    return {
      key_findings: ['暂无足够数据进行分析'],
      bottlenecks: [],
      performance_trends: {
        trend: 'stable',
        factors: []
      }
    };
  }
}

export async function getOptimizationSuggestions(promptId: string): Promise<OptimizationSuggestion[]> {
  try {
    const response = await api.get(`/performance/suggestions?promptId=${promptId}`);

    if (!response.data.success) {
      throw new Error('获取优化建议失败');
    }

    return response.data.suggestions;
  } catch (error: any) {
    // 静默处理404错误
    if (error.response?.status !== 404) {
      console.warn(`获取优化建议失败:`, error.message);
    }

    // 返回默认建议
    return [
      {
        title: '增加使用数据',
        description: '需要更多使用数据来生成个性化的优化建议',
        priority: 'medium',
        expected_improvement: '提高分析准确性',
        implementation_effort: 'low'
      }
    ];
  }
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
