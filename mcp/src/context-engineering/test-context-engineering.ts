/**
 * Context Engineering 功能测试脚本
 * 验证核心功能是否正常工作
 */

import { contextManager, ContextRequest } from './context-manager.js';
import { contextOrchestrator } from './context-orchestrator.js';
import { contextStateManager } from './state-manager.js';
import logger from '../utils/logger.js';

/**
 * 测试Context Engineering基本功能
 */
async function testBasicContextEngineering() {
  console.log('🧪 开始测试Context Engineering基本功能...\n');

  try {
    // 1. 测试基本上下文处理
    console.log('1️⃣ 测试基本上下文处理...');
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

    const result = await contextManager.processContextRequest(request);
    console.log('✅ 基本处理结果:', {
      adaptedContent: result.adaptedContent.substring(0, 100) + '...',
      processingTime: result.metadata.processingTime + 'ms',
      contextSources: result.metadata.contextSources.length
    });

    // 2. 测试编排器
    console.log('\n2️⃣ 测试Context Engineering编排器...');
    const orchestrationResult = await contextOrchestrator.orchestrateContext(request, 'fast');
    console.log('✅ 编排结果:', {
      success: orchestrationResult.success,
      stagesExecuted: orchestrationResult.stagesExecuted,
      totalTime: orchestrationResult.totalTime + 'ms'
    });

    // 3. 测试状态管理
    console.log('\n3️⃣ 测试状态管理器...');
    const sessionIds = await contextStateManager.getUserActiveSessions('test-user-001');
    console.log('✅ 用户活跃会话数:', sessionIds.length);

    // 4. 测试流水线管理
    console.log('\n4️⃣ 测试流水线管理...');
    const pipelineConfig = contextOrchestrator.getPipelineConfig('default');
    console.log('✅ 默认流水线配置:', {
      stagesCount: pipelineConfig?.stages.length,
      timeout: pipelineConfig?.totalTimeout + 'ms'
    });

    console.log('\n🎉 所有基本功能测试通过！');
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
  console.log('\n🏃 开始性能基准测试...\n');

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

      const result = await contextOrchestrator.orchestrateContext(request, testCase.pipeline);
      const totalTime = performance.now() - startTime;

      console.log(`📊 ${testCase.description} 性能结果:`, {
        success: result.success,
        totalTime: totalTime.toFixed(2) + 'ms',
        stagesExecuted: result.stagesExecuted.length,
        processingTime: result.result?.metadata.processingTime || 0
      });

    } catch (error) {
      console.error(`❌ ${testCase.description} 测试失败:`, error instanceof Error ? error.message : error);
    }
  }
}

/**
 * 测试状态持久化
 */
async function testStatePersistence() {
  console.log('\n💾 开始状态持久化测试...\n');

  try {
    const userId = 'persistence-test-user';
    const sessionId = `persistence-session-${Date.now()}`;

    // 1. 测试用户偏好保存和加载
    console.log('1️⃣ 测试用户偏好...');
    await contextStateManager.updateUserPreferences(userId, {
      responseStyle: 'casual',
      complexity: 'advanced',
      language: 'zh-CN'
    });
    
    const profile = await contextStateManager.loadUserProfile(userId);
    console.log('✅ 用户偏好:', profile?.preferences);

    // 2. 测试适应规则管理
    console.log('\n2️⃣ 测试适应规则...');
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
    const rules = await contextStateManager.loadAdaptationRules(userId);
    console.log('✅ 适应规则数量:', rules.length);

    // 3. 测试交互历史
    console.log('\n3️⃣ 测试交互历史...');
    await contextStateManager.saveInteraction(userId, sessionId, {
      timestamp: Date.now(),
      triggerEvent: 'test_interaction',
      contextData: { testData: 'value' },
      metadata: { source: 'test' }
    });

    const history = await contextStateManager.getInteractionHistory(userId, sessionId);
    console.log('✅ 交互历史数量:', history.length);

    console.log('\n💾 状态持久化测试完成！');

  } catch (error) {
    console.error('❌ 状态持久化测试失败:', error instanceof Error ? error.message : error);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 Context Engineering 完整测试套件');
  console.log('=====================================\n');

  const startTime = performance.now();

  // 运行基本功能测试
  const basicTestResult = await testBasicContextEngineering();
  
  // 运行性能测试
  await testPerformanceBenchmark();
  
  // 运行状态持久化测试
  await testStatePersistence();

  const totalTime = performance.now() - startTime;

  console.log('\n=====================================');
  console.log('📋 测试总结:');
  console.log(`⏱️  总耗时: ${totalTime.toFixed(2)}ms`);
  console.log(`✅ 基本功能: ${basicTestResult ? '通过' : '失败'}`);
  console.log('📊 性能测试: 已完成');
  console.log('💾 状态测试: 已完成');
  
  if (basicTestResult) {
    console.log('\n🎉 Context Engineering系统测试通过！');
    console.log('💡 系统已准备好处理智能上下文工程请求');
  } else {
    console.log('\n⚠️  部分测试失败，请检查日志');
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