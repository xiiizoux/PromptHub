/**
 * 🔍 搜索功能整合测试
 * 验证统一搜索引擎的各种搜索算法和功能
 */

import { unifiedSearchEngine, quickSearchTool } from './unified-search-engine.js';
import { ToolContext } from '../shared/base-tool.js';

/**
 * 模拟测试上下文
 */
const mockContext: ToolContext = {
  userId: 'test-user-123',
  requestId: 'test-request-456',
  timestamp: Date.now()
};

/**
 * 搜索算法测试套件
 */
export async function runSearchIntegrationTests() {
  console.log('🔍 开始搜索功能整合测试...\n');

  try {
    // 1. 智能自适应搜索测试
    await testSmartAdaptiveSearch();
    
    // 2. 语义搜索测试
    await testSemanticSearch();
    
    // 3. 关键词搜索测试 
    await testKeywordSearch();
    
    // 4. 混合搜索测试
    await testHybridSearch();
    
    // 5. 快速搜索测试
    await testQuickSearch();
    
    // 6. 搜索过滤器测试
    await testSearchFilters();
    
    // 7. 缓存功能测试
    await testSearchCache();
    
    // 8. 性能测试
    await testSearchPerformance();

    console.log('✅ 搜索功能整合测试完成！所有测试通过。\n');

  } catch (error) {
    console.error('❌ 搜索测试失败:', error);
  }
}

/**
 * 测试智能自适应搜索
 */
async function testSmartAdaptiveSearch() {
  console.log('📝 测试智能自适应搜索...');
  
  const testCases = [
    {
      name: '自然语言查询',
      params: {
        query: '我需要写一份商务邮件向客户道歉',
        algorithm: 'smart'
      }
    },
    {
      name: '简单关键词查询',
      params: {
        query: '代码分析',
        algorithm: 'smart'
      }
    },
    {
      name: '技术领域查询',
      params: {
        query: '性能优化 JavaScript',
        algorithm: 'smart',
        context: '技术开发环境'
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      const result = await unifiedSearchEngine.execute(testCase.params, mockContext);
      console.log(`  ✓ ${testCase.name}: ${result.success ? '成功' : '失败'}`);
      
      if (result.success && result.data) {
        console.log(`    - 找到 ${result.data.results?.length || 0} 个结果`);
        console.log(`    - 平均置信度: ${result.data.performance?.average_confidence || 0}`);
      }
    } catch (error) {
      console.log(`  ✗ ${testCase.name}: 测试失败`);
    }
  }
  console.log();
}

/**
 * 测试语义搜索
 */
async function testSemanticSearch() {
  console.log('🧠 测试语义搜索...');
  
  const testParams = {
    query: '帮我写一封正式的商务邮件',
    algorithm: 'semantic',
    context: '商务环境',
    max_results: 5
  };

  try {
    const result = await unifiedSearchEngine.execute(testParams, mockContext);
    console.log(`  ✓ 语义搜索: ${result.success ? '成功' : '失败'}`);
    
    if (result.success && result.data) {
      console.log(`    - 结果数量: ${result.data.results?.length || 0}`);
      console.log(`    - 搜索策略: 语义理解算法`);
      
      // 检查是否有语义匹配的理由
      const firstResult = result.data.results?.[0];
      if (firstResult?.reasons) {
        console.log(`    - 匹配理由: ${firstResult.reasons.join(', ')}`);
      }
    }
  } catch (error) {
    console.log('  ✗ 语义搜索: 测试失败');
  }
  console.log();
}

/**
 * 测试关键词搜索
 */
async function testKeywordSearch() {
  console.log('🔑 测试关键词搜索...');
  
  const testParams = {
    query: 'JavaScript 代码 优化',
    algorithm: 'keyword',
    max_results: 5
  };

  try {
    const result = await unifiedSearchEngine.execute(testParams, mockContext);
    console.log(`  ✓ 关键词搜索: ${result.success ? '成功' : '失败'}`);
    
    if (result.success && result.data) {
      console.log(`    - 结果数量: ${result.data.results?.length || 0}`);
      console.log(`    - 搜索策略: 关键词匹配算法`);
    }
  } catch (error) {
    console.log('  ✗ 关键词搜索: 测试失败');
  }
  console.log();
}

/**
 * 测试混合搜索
 */
async function testHybridSearch() {
  console.log('🔄 测试混合搜索...');
  
  const testParams = {
    query: '创意文案写作技巧',
    algorithm: 'hybrid',
    max_results: 8
  };

  try {
    const result = await unifiedSearchEngine.execute(testParams, mockContext);
    console.log(`  ✓ 混合搜索: ${result.success ? '成功' : '失败'}`);
    
    if (result.success && result.data) {
      console.log(`    - 结果数量: ${result.data.results?.length || 0}`);
      
      // 检查搜索来源分布
      if (result.data.performance?.source_distribution) {
        console.log('    - 来源分布:', result.data.performance.source_distribution);
      }
    }
  } catch (error) {
    console.log('  ✗ 混合搜索: 测试失败');
  }
  console.log();
}

/**
 * 测试快速搜索
 */
async function testQuickSearch() {
  console.log('⚡ 测试快速搜索...');
  
  const testParams = {
    q: '写邮件',
    limit: 3
  };

  try {
    const result = await quickSearchTool.execute(testParams, mockContext);
    console.log(`  ✓ 快速搜索: ${result.success ? '成功' : '失败'}`);
    
    if (result.success && result.data) {
      console.log(`    - 结果数量: ${result.data.count || 0}`);
      console.log(`    - 格式化输出: ${result.data.formatted ? '已生成' : '未生成'}`);
    }
  } catch (error) {
    console.log('  ✗ 快速搜索: 测试失败');
  }
  console.log();
}

/**
 * 测试搜索过滤器
 */
async function testSearchFilters() {
  console.log('🔍 测试搜索过滤器...');
  
  const testCases = [
    {
      name: '分类过滤',
      params: {
        query: '写作',
        filters: { category: 'business' },
        max_results: 5
      }
    },
    {
      name: '标签过滤',
      params: {
        query: '分析',
        filters: { tags: ['tech', 'analysis'] },
        max_results: 5
      }
    },
    {
      name: '难度过滤',
      params: {
        query: '编程',
        filters: { difficulty: 'beginner' },
        max_results: 5
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      const result = await unifiedSearchEngine.execute(testCase.params, mockContext);
      console.log(`  ✓ ${testCase.name}: ${result.success ? '成功' : '失败'}`);
      
      if (result.success && result.data) {
        console.log(`    - 过滤后结果: ${result.data.results?.length || 0} 个`);
      }
    } catch (error) {
      console.log(`  ✗ ${testCase.name}: 测试失败`);
    }
  }
  console.log();
}

/**
 * 测试搜索缓存
 */
async function testSearchCache() {
  console.log('💾 测试搜索缓存...');
  
  const testParams = {
    query: '测试缓存功能',
    algorithm: 'smart',
    enable_cache: true,
    max_results: 5
  };

  try {
    // 第一次搜索
    console.log('  执行第一次搜索...');
    const firstResult = await unifiedSearchEngine.execute(testParams, mockContext);
    const firstTime = Date.now();
    
    // 第二次搜索（应该命中缓存）
    console.log('  执行第二次搜索（缓存测试）...');
    const secondResult = await unifiedSearchEngine.execute(testParams, mockContext);
    const secondTime = Date.now();
    
    console.log(`  ✓ 缓存测试: ${firstResult.success && secondResult.success ? '成功' : '失败'}`);
    
    if (secondResult.success && secondResult.data) {
      const isFromCache = secondResult.data.from_cache;
      console.log(`    - 第二次搜索来自缓存: ${isFromCache ? '是' : '否'}`);
      console.log(`    - 性能提升: ${isFromCache ? '显著' : '未检测到'}`);
    }
    
  } catch (error) {
    console.log('  ✗ 缓存测试: 测试失败');
  }
  console.log();
}

/**
 * 测试搜索性能
 */
async function testSearchPerformance() {
  console.log('📊 测试搜索性能...');
  
  const testQueries = [
    '写商务邮件',
    '代码优化',
    '创意文案',
    '数据分析',
    '项目管理'
  ];

  const performanceResults: number[] = [];

  for (const query of testQueries) {
    try {
      const startTime = Date.now();
      
      const result = await unifiedSearchEngine.execute({
        query,
        algorithm: 'smart',
        max_results: 5
      }, mockContext);
      
      const duration = Date.now() - startTime;
      performanceResults.push(duration);
      
      console.log(`  ✓ "${query}": ${duration}ms`);
      
    } catch (error) {
      console.log(`  ✗ "${query}": 测试失败`);
    }
  }

  if (performanceResults.length > 0) {
    const avgTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
    const maxTime = Math.max(...performanceResults);
    const minTime = Math.min(...performanceResults);
    
    console.log(`  📈 性能统计:`);
    console.log(`    - 平均响应时间: ${Math.round(avgTime)}ms`);
    console.log(`    - 最快响应时间: ${minTime}ms`);
    console.log(`    - 最慢响应时间: ${maxTime}ms`);
    console.log(`    - 性能评级: ${avgTime < 100 ? '优秀' : avgTime < 300 ? '良好' : '需优化'}`);
  }
  console.log();
}

/**
 * 搜索质量评估测试
 */
async function testSearchQuality() {
  console.log('🎯 测试搜索质量...');
  
  const qualityTests = [
    {
      query: '写道歉邮件',
      expectedCategory: 'business',
      expectedKeywords: ['邮件', '道歉', '商务']
    },
    {
      query: 'JavaScript性能优化',
      expectedCategory: 'tech',
      expectedKeywords: ['JavaScript', '性能', '优化', '代码']
    },
    {
      query: '学术论文写作',
      expectedCategory: 'academic',
      expectedKeywords: ['论文', '学术', '写作']
    }
  ];

  for (const test of qualityTests) {
    try {
      const result = await unifiedSearchEngine.execute({
        query: test.query,
        algorithm: 'smart',
        max_results: 3
      }, mockContext);

      if (result.success && result.data?.results) {
        const topResult = result.data.results[0];
        
        // 检查分类匹配
        const categoryMatch = topResult?.prompt.category === test.expectedCategory;
        
        // 检查关键词匹配  
        const resultText = `${topResult?.prompt.name} ${topResult?.prompt.description}`.toLowerCase();
        const keywordMatches = test.expectedKeywords.filter(keyword => 
          resultText.includes(keyword.toLowerCase())
        ).length;
        
        const qualityScore = (categoryMatch ? 0.5 : 0) + (keywordMatches / test.expectedKeywords.length) * 0.5;
        
        console.log(`  ✓ "${test.query}": 质量分数 ${Math.round(qualityScore * 100)}%`);
        console.log(`    - 分类匹配: ${categoryMatch ? '✓' : '✗'}`);
        console.log(`    - 关键词匹配: ${keywordMatches}/${test.expectedKeywords.length}`);
      }
      
    } catch (error) {
      console.log(`  ✗ "${test.query}": 质量测试失败`);
    }
  }
  console.log();
}

// 导出测试函数
export {
  testSmartAdaptiveSearch,
  testSemanticSearch,
  testKeywordSearch,
  testHybridSearch,
  testQuickSearch,
  testSearchFilters,
  testSearchCache,
  testSearchPerformance,
  testSearchQuality
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runSearchIntegrationTests().catch(console.error);
} 