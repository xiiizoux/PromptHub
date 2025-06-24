#!/usr/bin/env node

/**
 * MCP服务器性能追踪测试脚本
 * 
 * 测试MCP服务器的搜索操作是否正确记录到数据库
 */

const fetch = require('node-fetch');

// 配置
const MCP_SERVER_URL = 'http://localhost:9010';
const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

// 测试用例
const testCases = [
  {
    name: 'unified_search',
    params: {
      query: '写邮件',
      max_results: 5
    }
  },
  {
    name: 'smart_semantic_search',
    params: {
      query: '商务邮件模板',
      max_results: 3
    }
  },
  {
    name: 'enhanced_search_prompts',
    params: {
      query: '分析',
      category: '商务',
      max_results: 5
    }
  }
];

/**
 * 调用MCP工具
 */
async function callMCPTool(toolName, params) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🚀 测试工具: ${toolName}`);
    console.log(`   参数: ${JSON.stringify(params, null, 2)}`);
    
    const response = await fetch(`${MCP_SERVER_URL}/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Request-ID': `test_${toolName}_${Date.now()}`
      },
      body: JSON.stringify({
        name: toolName,
        arguments: params
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ 工具调用成功`);
    console.log(`   响应时间: ${duration}ms`);
    console.log(`   响应状态: ${response.status}`);
    
    if (result.content && result.content.text) {
      const textLength = result.content.text.length;
      console.log(`   响应内容长度: ${textLength} 字符`);
      
      // 显示前200个字符的预览
      const preview = result.content.text.substring(0, 200);
      console.log(`   内容预览: ${preview}${textLength > 200 ? '...' : ''}`);
    }

    return {
      success: true,
      toolName,
      duration,
      responseSize: JSON.stringify(result).length,
      result
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`❌ 工具调用失败: ${error.message}`);
    console.error(`   响应时间: ${duration}ms`);
    
    return {
      success: false,
      toolName,
      duration,
      error: error.message
    };
  }
}

/**
 * 检查数据库中的性能记录
 */
async function checkPerformanceRecords() {
  try {
    console.log(`\n📊 检查数据库中的性能记录...`);
    
    // 检查最近的搜索操作记录
    const response = await fetch(`${MCP_SERVER_URL}/api/performance/search-stats?timeRange=24h`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const stats = result.data;
      console.log(`✅ 搜索统计获取成功:`);
      console.log(`   总搜索次数: ${stats.summary.totalSearches}`);
      console.log(`   平均响应时间: ${stats.summary.avgResponseTime}ms`);
      console.log(`   工具统计:`);
      
      stats.toolStats.forEach(tool => {
        console.log(`     - ${tool.tool}: ${tool.count}次, 平均${tool.avgResponseTime}ms`);
      });
      
      return stats;
    } else {
      console.error(`❌ 搜索统计获取失败: ${result.error || '未知错误'}`);
      return null;
    }

  } catch (error) {
    console.error(`❌ 检查性能记录失败: ${error.message}`);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🧪 开始MCP服务器性能追踪测试');
  console.log(`   服务器地址: ${MCP_SERVER_URL}`);
  console.log(`   API密钥: ${API_KEY.substring(0, 10)}...`);
  
  const results = [];
  
  // 执行所有测试用例
  for (const testCase of testCases) {
    const result = await callMCPTool(testCase.name, testCase.params);
    results.push(result);
    
    // 等待一秒，确保数据库记录完成
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 等待几秒钟让数据库处理完成
  console.log('\n⏳ 等待数据库处理完成...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 检查数据库记录
  const performanceStats = await checkPerformanceRecords();
  
  // 生成测试报告
  console.log('\n📋 测试报告:');
  console.log('=' * 50);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功数: ${successCount}`);
  console.log(`失败数: ${totalCount - successCount}`);
  console.log(`成功率: ${Math.round(successCount / totalCount * 100)}%`);
  
  if (successCount > 0) {
    const avgDuration = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0) / successCount;
    console.log(`平均响应时间: ${Math.round(avgDuration)}ms`);
  }
  
  console.log('\n详细结果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.toolName}: ${result.duration}ms`);
    if (!result.success) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  if (performanceStats) {
    console.log('\n📊 数据库性能统计:');
    console.log(`   记录的搜索次数: ${performanceStats.summary.totalSearches}`);
    console.log(`   数据库平均响应时间: ${performanceStats.summary.avgResponseTime}ms`);
    
    if (performanceStats.summary.totalSearches >= successCount) {
      console.log('✅ 性能追踪正常工作 - 所有成功的搜索都被记录到数据库');
    } else {
      console.log('⚠️  性能追踪可能有问题 - 数据库记录数少于成功的搜索数');
    }
  } else {
    console.log('❌ 无法获取数据库性能统计');
  }
  
  console.log('\n🎯 测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests, callMCPTool, checkPerformanceRecords };
