import { performanceTracker } from './performance-tracker.js';
import { PromptUsage, PromptFeedback, ABTestConfig } from './performance-tracker.js';
import { PromptServerError, ErrorCode } from '../errors.js';
import type { Request } from 'express';

/**
 * 性能分析相关的MCP工具定义
 */
export const performanceTools = {
  /**
   * 追踪提示词使用并记录性能数据
   */
  track_prompt_usage: {
    description: '记录提示词使用数据，用于性能分析',
    parameters: [
      {
        name: 'prompt_id',
        type: 'string',
        description: '提示词ID',
        required: true
      },
      {
        name: 'prompt_version',
        type: 'number',
        description: '提示词版本号',
        required: true
      },
      {
        name: 'model',
        type: 'string',
        description: '使用的模型，例如 "gpt-4"',
        required: true
      },
      {
        name: 'input_tokens',
        type: 'number',
        description: '输入token数量',
        required: true
      },
      {
        name: 'output_tokens',
        type: 'number',
        description: '输出token数量',
        required: true
      },
      {
        name: 'latency_ms',
        type: 'number',
        description: '响应延迟(毫秒)',
        required: true
      },
      {
        name: 'session_id',
        type: 'string',
        description: '会话标识符（可选）'
      },
      {
        name: 'client_metadata',
        type: 'object',
        description: '客户端元数据（可选）'
      }
    ],
    returns: {
      type: 'object',
      description: '返回操作结果和使用记录ID'
    }
  },
  
  /**
   * 提交提示词使用反馈
   */
  submit_prompt_feedback: {
    description: '提交提示词使用的反馈，包括评分和文本评论',
    parameters: [
      {
        name: 'usage_id',
        type: 'string',
        description: '使用记录ID',
        required: true
      },
      {
        name: 'rating',
        type: 'number',
        description: '评分（1-5星）',
        required: true
      },
      {
        name: 'feedback_text',
        type: 'string',
        description: '文本反馈（可选）'
      },
      {
        name: 'categories',
        type: 'array',
        description: '反馈分类标签（可选）',
        items: {
          type: 'string'
        }
      }
    ],
    returns: {
      type: 'object',
      description: '返回操作结果'
    }
  },
  
  /**
   * 获取提示词性能数据
   */
  get_prompt_performance: {
    description: '获取提示词的性能数据',
    parameters: [
      {
        name: 'prompt_id',
        type: 'string',
        description: '提示词ID',
        required: true
      },
      {
        name: 'version',
        type: 'number',
        description: '提示词版本（可选，如果不提供则返回所有版本）'
      }
    ],
    returns: {
      type: 'object',
      description: '返回提示词的性能数据'
    }
  },
  
  /**
   * 获取提示词性能报告
   */
  get_performance_report: {
    description: '生成提示词的详细性能报告，包括使用统计、评分、成本和优化建议',
    parameters: [
      {
        name: 'prompt_id',
        type: 'string',
        description: '提示词ID',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: '返回详细的性能报告'
    }
  },
  
  /**
   * 创建A/B测试
   */
  create_ab_test: {
    description: '创建提示词版本的A/B测试',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: '测试名称',
        required: true
      },
      {
        name: 'prompt_id',
        type: 'string',
        description: '提示词ID',
        required: true
      },
      {
        name: 'version_a',
        type: 'number',
        description: '比较的版本A',
        required: true
      },
      {
        name: 'version_b',
        type: 'number',
        description: '比较的版本B',
        required: true
      },
      {
        name: 'metric',
        type: 'string',
        description: '主要比较指标（rating, latency, tokens）',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: '测试描述（可选）'
      },
      {
        name: 'end_date',
        type: 'string',
        description: '测试结束日期，ISO格式（可选）'
      }
    ],
    returns: {
      type: 'object',
      description: '返回测试ID'
    }
  },
  
  /**
   * 获取A/B测试结果
   */
  get_ab_test_results: {
    description: '获取A/B测试的结果数据',
    parameters: [
      {
        name: 'test_id',
        type: 'string',
        description: '测试ID',
        required: true
      }
    ],
    returns: {
      type: 'object',
      description: '返回测试结果数据'
    }
  }
};

/**
 * 性能分析工具处理函数
 */
export const performanceToolHandlers = {
  /**
   * 处理追踪提示词使用的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async track_prompt_usage(params: any, req?: Request): Promise<any> {
    const usageData: PromptUsage = {
      promptId: params.prompt_id,
      promptVersion: params.prompt_version,
      model: params.model,
      inputTokens: params.input_tokens,
      outputTokens: params.output_tokens,
      latencyMs: params.latency_ms,
      sessionId: params.session_id,
      clientMetadata: params.client_metadata,
      userId: req?.user?.id // 添加用户ID
    };
    
    const usageId = await performanceTracker.trackUsage(usageData);
    
    if (!usageId) {
      throw new PromptServerError('Failed to track prompt usage', ErrorCode.InternalError);
    }
    
    return {
      success: true,
      data: { usageId }
    };
  },
  
  /**
   * 处理提交提示词反馈的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async submit_prompt_feedback(params: any, req?: Request): Promise<any> {
    const feedbackData: PromptFeedback = {
      usageId: params.usage_id,
      rating: params.rating,
      feedbackText: params.feedback_text,
      categories: params.categories
    };
    
    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      throw new PromptServerError('Rating must be between 1 and 5', ErrorCode.InvalidParams);
    }
    
    const success = await performanceTracker.submitFeedback(feedbackData);
    
    if (!success) {
      throw new PromptServerError('Failed to submit feedback', ErrorCode.InternalError);
    }
    
    return {
      success: true,
      message: '反馈已成功提交'
    };
  },
  
  /**
   * 处理获取提示词性能数据的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async get_prompt_performance(params: any, req?: Request): Promise<any> {
    const promptId = params.prompt_id;
    const version = params.version;
    
    if (!promptId) {
      throw new PromptServerError('Missing prompt ID', ErrorCode.InvalidParams);
    }
    
    const performanceData = await performanceTracker.getPerformance(promptId, version);
    
    return {
      success: true,
      data: { performance: performanceData }
    };
  },
  
  /**
   * 处理获取性能报告的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async get_performance_report(params: any, req?: Request): Promise<any> {
    const promptId = params.prompt_id;
    
    if (!promptId) {
      throw new PromptServerError('Missing prompt ID', ErrorCode.InvalidParams);
    }
    
    const report = await performanceTracker.generatePerformanceReport(promptId);
    
    if (!report) {
      throw new PromptServerError('Could not generate performance report', ErrorCode.ResourceNotFound);
    }
    
    return {
      success: true,
      data: { report }
    };
  },
  
  /**
   * 处理创建A/B测试的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async create_ab_test(params: any, req?: Request): Promise<any> {
    const testConfig: ABTestConfig = {
      name: params.name,
      promptId: params.prompt_id,
      versionA: params.version_a,
      versionB: params.version_b,
      metric: params.metric as any,
      description: params.description,
      endDate: params.end_date ? new Date(params.end_date) : undefined
    };
    
    if (!testConfig.name || !testConfig.promptId || 
        testConfig.versionA === undefined || testConfig.versionB === undefined || 
        !testConfig.metric) {
      throw new PromptServerError('Missing required fields for A/B test', ErrorCode.InvalidParams);
    }
    
    if (!['rating', 'latency', 'tokens'].includes(testConfig.metric)) {
      throw new PromptServerError('Invalid metric. Must be one of: rating, latency, tokens', ErrorCode.InvalidParams);
    }
    
    const testId = await performanceTracker.createABTest(testConfig);
    
    if (!testId) {
      throw new PromptServerError('Failed to create A/B test', ErrorCode.InternalError);
    }
    
    return {
      success: true,
      data: { testId }
    };
  },
  
  /**
   * 处理获取A/B测试结果的请求
   * @param params 参数
   * @param req Express请求对象（可选）
   */
  async get_ab_test_results(params: any, req?: Request): Promise<any> {
    const testId = params.test_id;
    
    if (!testId) {
      throw new PromptServerError('Missing test ID', ErrorCode.InvalidParams);
    }
    
    const results = await performanceTracker.getABTestResults(testId);
    
    if (!results) {
      throw new PromptServerError('Could not find test or get results', ErrorCode.ResourceNotFound);
    }
    
    return {
      success: true,
      data: { results }
    };
  }
};
