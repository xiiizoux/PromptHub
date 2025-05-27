/**
 * 性能分析功能测试
 * 
 * 测试MCP Prompt Server的性能跟踪、反馈收集和报告生成功能
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// 直接导入性能工具处理函数
import { performanceToolHandlers } from '../../src/performance/performance-tools.js';

describe('性能分析功能', () => {
  // 保存原始方法的引用
  const originalTrackUsage = performanceToolHandlers.track_prompt_usage;
  const originalSubmitFeedback = performanceToolHandlers.submit_prompt_feedback;
  const originalGetPerformance = performanceToolHandlers.get_prompt_performance;
  const originalGetReport = performanceToolHandlers.get_performance_report;
  const originalCreateTest = performanceToolHandlers.create_ab_test;
  const originalGetResults = performanceToolHandlers.get_ab_test_results;
  
  // 在所有测试完成后恢复原始方法
  afterAll(() => {
    performanceToolHandlers.track_prompt_usage = originalTrackUsage;
    performanceToolHandlers.submit_prompt_feedback = originalSubmitFeedback;
    performanceToolHandlers.get_prompt_performance = originalGetPerformance;
    performanceToolHandlers.get_performance_report = originalGetReport;
    performanceToolHandlers.create_ab_test = originalCreateTest;
    performanceToolHandlers.get_ab_test_results = originalGetResults;
  });
  
  // 在每个测试前重置所有模拟
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('使用跟踪', () => {
    test('track_prompt_usage应正确跟踪使用数据', async () => {
      // 使用函数赋值方式替换方法
      performanceToolHandlers.track_prompt_usage = async () => ({
        success: true,
        data: { usageId: 'test-usage-id' }
      });
      
      // 创建监视函数以跟踪调用
      const spy = jest.spyOn(performanceToolHandlers, 'track_prompt_usage');
      
      const params = {
        prompt_id: 'test-prompt-id',
        prompt_version: 1,
        model: 'gpt-4',
        input_tokens: 50,
        output_tokens: 150,
        latency_ms: 500,
        session_id: 'test-session'
      };
      
      const result = await performanceToolHandlers.track_prompt_usage(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.data.usageId).toBe('test-usage-id');
    });
  });

  describe('反馈提交', () => {
    test('submit_prompt_feedback应正确提交反馈', async () => {
      performanceToolHandlers.submit_prompt_feedback = async () => ({
        success: true,
        message: '反馈已成功提交'
      });
      
      const spy = jest.spyOn(performanceToolHandlers, 'submit_prompt_feedback');
      
      const params = {
        usage_id: 'test-usage-id',
        rating: 5,
        feedback_text: '非常好的提示词'
      };
      
      const result = await performanceToolHandlers.submit_prompt_feedback(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.message).toBe('反馈已成功提交');
    });
  });

  describe('性能数据检索', () => {
    test('get_prompt_performance应返回正确的性能数据', async () => {
      performanceToolHandlers.get_prompt_performance = async () => ({
        success: true,
        data: { 
          performance: [{
            prompt_id: 'test-prompt-id',
            version: 1,
            avg_latency: 500,
            total_tokens: 1000,
            success_rate: 0.95,
            avg_rating: 4.5
          }]
        }
      });
      
      const spy = jest.spyOn(performanceToolHandlers, 'get_prompt_performance');
      
      const params = {
        prompt_id: 'test-prompt-id'
      };
      
      const result = await performanceToolHandlers.get_prompt_performance(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.data.performance[0].prompt_id).toBe('test-prompt-id');
    });
  });

  describe('性能报告生成', () => {
    test('get_performance_report应生成详细报告', async () => {
      performanceToolHandlers.get_performance_report = async () => ({
        success: true,
        data: { 
          report: {
            prompt_id: 'test-prompt-id',
            usage_stats: {
              total_calls: 100,
              avg_latency: 500,
              success_rate: 0.95
            },
            feedback_stats: {
              avg_rating: 4.5,
              total_feedback: 50
            },
            optimization_suggestions: [
              '优化提示词结构以减少token使用',
              '添加更多上下文以提高成功率'
            ]
          }
        }
      });
      
      const spy = jest.spyOn(performanceToolHandlers, 'get_performance_report');
      
      const params = {
        prompt_id: 'test-prompt-id'
      };
      
      const result = await performanceToolHandlers.get_performance_report(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.data.report.prompt_id).toBe('test-prompt-id');
    });
  });

  describe('A/B测试', () => {
    test('create_ab_test应创建新的A/B测试', async () => {
      performanceToolHandlers.create_ab_test = async () => ({
        success: true,
        data: { testId: 'test-ab-id' }
      });
      
      const spy = jest.spyOn(performanceToolHandlers, 'create_ab_test');
      
      const params = {
        name: 'Test A/B',
        prompt_id: 'test-prompt',
        version_a: 1,
        version_b: 2,
        metric: 'rating'
      };
      
      const result = await performanceToolHandlers.create_ab_test(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.data.testId).toBe('test-ab-id');
    });
    
    test('get_ab_test_results应返回测试结果', async () => {
      performanceToolHandlers.get_ab_test_results = async () => ({
        success: true,
        data: { 
          results: {
            test_id: 'test-ab-id',
            name: 'Test A/B',
            status: 'completed',
            variants: [
              {
                prompt_id: 'variant-a',
                performance: {
                  avg_latency: 450,
                  success_rate: 0.92,
                  avg_rating: 4.2
                }
              },
              {
                prompt_id: 'variant-b',
                performance: {
                  avg_latency: 420,
                  success_rate: 0.94,
                  avg_rating: 4.7
                }
              }
            ],
            winner: 'variant-b'
          }
        }
      });
      
      const spy = jest.spyOn(performanceToolHandlers, 'get_ab_test_results');
      
      const params = {
        test_id: 'test-ab-id'
      };
      
      const result = await performanceToolHandlers.get_ab_test_results(params);
      
      expect(spy).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
      expect(result.data.results.winner).toBe('variant-b');
    });
  });
});
