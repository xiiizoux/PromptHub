/**
 * 测试性能分析API的修复情况
 * 这个脚本用于验证性能分析API是否正常工作
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:9011';

// 测试用的提示词ID（需要在数据库中存在）
const TEST_PROMPT_ID = 'test-prompt-id';

async function testPerformanceAPIs() {
  console.log('🧪 开始测试性能分析API修复情况...\n');

  const tests = [
    {
      name: '获取提示词性能数据',
      url: `${BASE_URL}/api/performance/${TEST_PROMPT_ID}`,
      method: 'GET'
    },
    {
      name: '生成性能报告',
      url: `${BASE_URL}/api/performance/report/${TEST_PROMPT_ID}`,
      method: 'GET'
    },
    {
      name: '记录提示词使用',
      url: `${BASE_URL}/api/performance/track`,
      method: 'POST',
      data: {
        prompt_id: TEST_PROMPT_ID,
        prompt_version: 1,
        model: 'gpt-3.5-turbo',
        input_tokens: 100,
        output_tokens: 50,
        latency_ms: 1500,
        user_id: 'test-user-id',
        session_id: 'test-session-id'
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📡 测试: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   📊 响应数据:`, JSON.stringify(response.data, null, 2));
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      if (error.response) {
        console.log(`   📊 错误响应:`, JSON.stringify(error.response.data, null, 2));
      }
      console.log('');
    }
  }

  console.log('🏁 测试完成！');
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ 服务器正在运行');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行或无法访问');
    console.log('请确保运行: cd web && npm run dev');
    return false;
  }
}

async function main() {
  console.log('🔍 检查服务器状态...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testPerformanceAPIs();
  } else {
    console.log('\n📝 修复总结:');
    console.log('1. ✅ 扩展了 DatabaseService 类，添加了性能分析相关方法');
    console.log('2. ✅ 修改了 /api/performance/[promptId].ts - 使用数据库服务替代MCP代理');
    console.log('3. ✅ 修改了 /api/performance/report/[promptId].ts - 使用数据库服务替代MCP代理');
    console.log('4. ✅ 修改了 /api/performance/track.ts - 使用数据库服务替代MCP代理');
    console.log('5. ✅ 重写了 /api/performance/metrics.ts - 使用数据库服务替代MCP代理');
    console.log('\n🎯 问题根因: 性能分析API仍在尝试代理到已解耦的MCP服务，导致404错误');
    console.log('🔧 解决方案: 将所有性能分析API改为直接访问数据库，符合项目的解耦架构');
    console.log('\n⚠️  注意: 需要确保数据库中有相关的性能分析表结构');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPerformanceAPIs, checkServer };
