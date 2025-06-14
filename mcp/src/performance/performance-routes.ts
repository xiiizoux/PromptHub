import express from 'express';
import { performanceTracker } from './performance-tracker.js';
import { PromptUsage, PromptFeedback, ABTestConfig } from './performance-tracker.js';
import { authenticateRequest } from '../api/auth-middleware.js';

// 不在这里扩展请求类型，避免类型冲突
// 类型声明已在其他文件中定义

const router = express.Router();

// 中间件：所有性能分析相关的API都需要身份验证
router.use((req, res, next) => {
  return authenticateRequest(req, res, next);
});

/**
 * 记录提示词使用数据
 * POST /api/performance/track
 */
router.post('/track', async (req, res) => {
  try {
    const usageData: PromptUsage = req.body;
    
    // 验证必要字段
    if (!usageData.promptId || usageData.inputTokens === undefined || usageData.outputTokens === undefined || usageData.latencyMs === undefined || !usageData.model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (promptId, inputTokens, outputTokens, latencyMs, model)'
      });
    }
    
    // 添加用户ID（如果已登录）
    if (req.user && req.user.id) {
      usageData.userId = req.user.id;
    }
    
    // 记录使用数据
    const usageId = await performanceTracker.trackUsage(usageData);
    
    return res.json({
      success: true,
      data: { usageId }
    });
  } catch (error) {
    console.error('记录使用数据时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 提交提示词使用反馈
 * POST /api/performance/feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const feedbackData: PromptFeedback = req.body;
    
    // 验证必要字段
    if (!feedbackData.usageId || feedbackData.rating === undefined || feedbackData.rating < 1 || feedbackData.rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields or invalid rating (must be 1-5)'
      });
    }
    
    // 添加用户ID（如果已登录）
    if (req.user && req.user.id) {
      feedbackData.userId = req.user.id;
    }
    
    // 提交反馈
    const success = await performanceTracker.submitFeedback(feedbackData);
    
    if (success) {
      return res.json({
        success: true,
        message: '反馈已成功提交'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '提交反馈失败'
      });
    }
  } catch (error) {
    console.error('提交反馈时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取提示词性能数据
 * GET /api/performance/:promptId
 */
router.get('/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;
    const version = req.query.version ? parseFloat(req.query.version as string) : undefined;
    
    if (!promptId) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt ID'
      });
    }
    
    const performanceData = await performanceTracker.getPerformance(promptId, version);
    
    return res.json({
      success: true,
      data: { performance: performanceData }
    });
  } catch (error) {
    console.error('获取性能数据时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 生成性能报告
 * GET /api/performance/:promptId/report
 */
router.get('/:promptId/report', async (req, res) => {
  try {
    const { promptId } = req.params;
    
    if (!promptId) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt ID'
      });
    }
    
    const report = await performanceTracker.generatePerformanceReport(promptId);
    
    if (report) {
      return res.json({
        success: true,
        data: { report }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: '无法生成性能报告，可能是提示词不存在或没有足够的数据'
      });
    }
  } catch (error) {
    console.error('生成性能报告时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 创建A/B测试
 * POST /api/performance/ab-test
 */
router.post('/ab-test', async (req, res) => {
  try {
    const testConfig: ABTestConfig = req.body;
    
    // 验证必要字段
    if (!testConfig.name || !testConfig.promptId || 
        testConfig.versionA === undefined || testConfig.versionB === undefined || 
        !testConfig.metric) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for A/B test'
      });
    }
    
    // 创建A/B测试
    const testId = await performanceTracker.createABTest(testConfig);
    
    if (testId) {
      return res.json({
        success: true,
        data: { testId }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: '创建A/B测试失败'
      });
    }
  } catch (error) {
    console.error('创建A/B测试时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取A/B测试结果
 * GET /api/performance/ab-test/:testId
 */
router.get('/ab-test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    
    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'Missing test ID'
      });
    }
    
    const results = await performanceTracker.getABTestResults(testId);
    
    if (results) {
      return res.json({
        success: true,
        data: { results }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: '找不到测试或无法获取结果'
      });
    }
  } catch (error) {
    console.error('获取A/B测试结果时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取提示词使用历史
 * GET /api/performance/:promptId/history
 */
router.get('/:promptId/history', async (req, res) => {
  try {
    const { promptId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    if (!promptId) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt ID'
      });
    }
    
    const history = await performanceTracker.getUsageHistory(promptId, limit, offset);
    
    return res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('获取使用历史时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;
