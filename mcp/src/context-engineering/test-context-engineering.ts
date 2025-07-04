/**
 * Context Engineering 功能测试脚本
 * 验证核心功能是否正常工作
 */

import { contextManager, ContextRequest } from './context-manager.js';
import { contextOrchestrator } from './context-orchestrator.js';
import { contextStateManager } from './state-manager.js';

/**
 * 测试Context Engineering基本功能
 */
async function testBasicContextEngineering() {

  try {
    // 1. 测试基本上下文处理
    const request: ContextRequest = {
      promptId: 'test-prompt-001',
      userId: 'test-user-001',
      currentInput: '请帮我写一个关于AI的介绍',
      sessionId: `test-session-${Date.now()}`,
      preferences: {
        responseStyle: 'professional',
        language: 'zh-CN'
      }
    };

    const _result = await contextManager.processContextRequest(request);

    // 2. 测试编排器
    const _orchestrationResult = await contextOrchestrator.orchestrateContext(request, 'fast');

    // 3. 测试状态管理
    const _sessionIds = await contextStateManager.getUserActiveSessions('test-user-001');

    // 4. 测试流水线管理
    const _pipelineConfig = contextOrchestrator.getPipelineConfig('default');

    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * 测试性能基准
 */
async function testPerformanceBenchmark() {

  const testCases = [
    { pipeline: 'fast', description: '快速流水线' },
    { pipeline: 'default', description: '默认流水线' },
    { pipeline: 'deep', description: '深度流水线' }
  ];

  for (const testCase of testCases) {
    try {
      const startTime = performance.now();
      
      const request: ContextRequest = {
        promptId: 'perf-test-prompt',
        userId: 'perf-test-user',
        currentInput: '这是一个性能测试输入，用于测量不同流水线的处理速度和效果。',
        sessionId: `perf-session-${Date.now()}`
      };

      const _result = await contextOrchestrator.orchestrateContext(request, testCase.pipeline);
      const _totalTime = performance.now() - startTime;


    } catch (error) {
      console.error(`❌ ${testCase.description} 测试失败:`, error instanceof Error ? error.message : error);
    }
  }
}

/**
 * 测试状态持久化
 */
async function testStatePersistence() {

  try {
    const userId = 'persistence-test-user';
    const sessionId = `persistence-session-${Date.now()}`;

    // 1. 测试用户偏好保存和加载
    await contextStateManager.updateUserPreferences(userId, {
      responseStyle: 'casual',
      complexity: 'advanced',
      language: 'zh-CN'
    });
    
    const _profile = await contextStateManager.loadUserProfile(userId);

    // 2. 测试适应规则管理
    const testRule = {
      id: 'test-rule-001',
      name: '测试规则',
      condition: 'contains(input, "测试")',
      action: {
        type: 'modify' as const,
        target: 'content',
        value: '添加测试前缀'
      },
      priority: 10,
      isActive: true
    };

    await contextStateManager.addAdaptationRule(userId, testRule);
    const _rules = await contextStateManager.loadAdaptationRules(userId);

    // 3. 测试交互历史
    await contextStateManager.saveInteraction(userId, sessionId, {
      timestamp: Date.now(),
      triggerEvent: 'test_interaction',
      contextData: { testData: 'value' },
      metadata: { source: 'test' }
    });

    const _history = await contextStateManager.getInteractionHistory(userId, sessionId);


  } catch (error) {
    console.error('❌ 状态持久化测试失败:', error instanceof Error ? error.message : error);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {

  const startTime = performance.now();

  // 运行基本功能测试
  const basicTestResult = await testBasicContextEngineering();
  
  // 运行性能测试
  await testPerformanceBenchmark();
  
  // 运行状态持久化测试
  await testStatePersistence();

  const _totalTime = performance.now() - startTime;

  
  if (basicTestResult) {
    // 测试通过
  } else {
    // 测试失败
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testBasicContextEngineering,
  testPerformanceBenchmark,
  testStatePersistence,
  runAllTests
};