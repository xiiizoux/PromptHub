#!/usr/bin/env node

/**
 * MCP配置测试脚本
 * 验证零配置方案是否能正确连接到MCP服务器
 */

const https = require('https');

// 测试配置
const TEST_CONFIG = {
  serverUrl: 'https://mcp.prompt-hub.cc',
  apiKey: process.env.API_KEY || 'test-key',
  timeout: 10000
};

console.log('🧪 MCP配置测试开始...');
console.log(`📡 服务器地址: ${TEST_CONFIG.serverUrl}`);
console.log(`🔑 API密钥: ${TEST_CONFIG.apiKey ? '已设置' : '未设置'}`);
console.log('---');

/**
 * 测试HTTP请求
 */
function testHttpRequest(path, description) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TEST_CONFIG.serverUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Config-Test/1.0.0'
      },
      timeout: TEST_CONFIG.timeout
    };

    // 添加API密钥（如果有）
    if (TEST_CONFIG.apiKey && TEST_CONFIG.apiKey !== 'test-key') {
      options.headers['X-Api-Key'] = TEST_CONFIG.apiKey;
    }

    console.log(`🔍 测试: ${description}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${description}: 成功 (${res.statusCode})`);
            resolve(result);
          } else {
            console.log(`❌ ${description}: 失败 (${res.statusCode})`);
            console.log(`   响应: ${data}`);
            resolve(result);
          }
        } catch (error) {
          console.log(`⚠️  ${description}: 响应解析失败`);
          console.log(`   原始响应: ${data}`);
          resolve({ status: res.statusCode, data: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: 网络错误`);
      console.log(`   错误: ${error.message}`);
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`⏰ ${description}: 请求超时`);
      resolve({ error: 'timeout' });
    });

    req.end();
  });
}

/**
 * 运行所有测试
 */
async function runTests() {
  const tests = [
    {
      path: '/api/health',
      description: '健康检查（无需认证）'
    },
    {
      path: '/tools',
      description: '工具列表（需要认证）'
    },
    {
      path: '/',
      description: '根路径'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testHttpRequest(test.path, test.description);
    results.push({ ...test, result });
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * 分析测试结果
 */
function analyzeResults(results) {
  console.log('\n📊 测试结果分析:');
  console.log('---');
  
  let successCount = 0;
  let totalCount = results.length;
  
  results.forEach(({ description, result }) => {
    if (result.status >= 200 && result.status < 300) {
      successCount++;
    }
  });
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  
  // 详细分析
  const healthCheck = results.find(r => r.path === '/api/health');
  const toolsList = results.find(r => r.path === '/tools');
  
  if (healthCheck?.result?.status === 200) {
    console.log('\n🎉 服务器连接正常！');
    console.log('   ✅ MCP服务器运行正常');
    console.log('   ✅ 网络连接正常');
    console.log('   ✅ 域名解析正确');
  } else {
    console.log('\n❌ 服务器连接失败！');
    console.log('   请检查:');
    console.log('   - 网络连接是否正常');
    console.log('   - 域名是否正确解析');
    console.log('   - 服务器是否运行');
  }
  
  if (toolsList?.result?.status === 200) {
    console.log('\n🔑 API认证成功！');
    console.log('   ✅ API密钥有效');
    console.log('   ✅ 可以访问工具列表');
    
    if (toolsList.result.data?.tools) {
      console.log(`   ✅ 发现 ${toolsList.result.data.tools.length} 个工具`);
    }
  } else if (toolsList?.result?.status === 401) {
    console.log('\n🔑 API认证失败！');
    console.log('   ❌ API密钥无效或未设置');
    console.log('   请检查API_KEY环境变量');
  } else if (toolsList?.result?.status === 403) {
    console.log('\n🔑 API权限不足！');
    console.log('   ❌ API密钥权限不足');
    console.log('   请检查API密钥权限设置');
  }
  
  console.log('\n🔧 配置建议:');
  
  if (healthCheck?.result?.status === 200) {
    console.log('✅ 你的零配置方案应该可以正常工作：');
    console.log('```json');
    console.log('{');
    console.log('  "mcpServers": {');
    console.log('    "prompthub": {');
    console.log('      "command": "curl",');
    console.log('      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],');
    console.log('      "env": {');
    console.log('        "API_KEY": "your-api-key-here"');
    console.log('      }');
    console.log('    }');
    console.log('  }');
    console.log('}');
    console.log('```');
  } else {
    console.log('❌ 请先解决服务器连接问题');
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const results = await runTests();
    analyzeResults(results);
    
    console.log('\n🎯 测试完成！');
    
    if (!process.env.API_KEY || process.env.API_KEY === 'test-key') {
      console.log('\n💡 提示: 设置真实的API密钥以测试完整功能');
      console.log('   export API_KEY=your-real-api-key');
      console.log('   node test-mcp-config.js');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}
