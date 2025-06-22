#!/usr/bin/env node

/**
 * 生产环境认证调试脚本
 * 测试用户API密钥在生产环境的认证情况
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const PRODUCTION_SERVER = 'https://mcp.prompt-hub.cc';
const USER_API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

console.log('🔍 生产环境认证调试');
console.log('='.repeat(50));
console.log(`服务器: ${PRODUCTION_SERVER}`);
console.log(`API密钥: ${USER_API_KEY.substring(0, 8)}...`);
console.log(`密钥哈希: ${crypto.createHash('sha256').update(USER_API_KEY).digest('hex').substring(0, 16)}...`);
console.log('');

// HTTP请求工具函数
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PRODUCTION_SERVER);
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-Debug/1.0',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试函数
async function testHealthCheck() {
  console.log('1️⃣ 测试健康检查...');
  try {
    const response = await makeRequest('/health');
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testToolsDiscovery() {
  console.log('2️⃣ 测试工具发现 (无认证)...');
  try {
    const response = await makeRequest('/tools');
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testToolsWithApiKey() {
  console.log('3️⃣ 测试工具发现 (使用API密钥)...');
  try {
    const response = await makeRequest('/tools', {
      headers: {
        'X-Api-Key': USER_API_KEY
      }
    });
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testToolsWithAuthorizationHeader() {
  console.log('4️⃣ 测试工具发现 (使用Authorization头)...');
  try {
    const response = await makeRequest('/tools', {
      headers: {
        'Authorization': `Bearer ${USER_API_KEY}`
      }
    });
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testToolsWithQueryParam() {
  console.log('5️⃣ 测试工具发现 (使用查询参数)...');
  try {
    const response = await makeRequest(`/tools?api_key=${USER_API_KEY}`);
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testSpecificTool() {
  console.log('6️⃣ 测试特定工具调用...');
  try {
    const response = await makeRequest('/tools/enhanced_search/invoke', {
      method: 'POST',
      headers: {
        'X-Api-Key': USER_API_KEY
      },
      body: {
        query: 'test search'
      }
    });
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testServerInfo() {
  console.log('7️⃣ 测试服务器信息...');
  try {
    const response = await makeRequest('/api/debug/server-info', {
      headers: {
        'X-Api-Key': USER_API_KEY
      }
    });
    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('开始生产环境认证测试...\n');

  const results = [];
  
  results.push(await testHealthCheck());
  console.log('');
  
  results.push(await testToolsDiscovery());
  console.log('');
  
  results.push(await testToolsWithApiKey());
  console.log('');
  
  results.push(await testToolsWithAuthorizationHeader());
  console.log('');
  
  results.push(await testToolsWithQueryParam());
  console.log('');
  
  results.push(await testSpecificTool());
  console.log('');
  
  results.push(await testServerInfo());
  console.log('');

  // 汇总结果
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(30));
  
  const tests = [
    '健康检查',
    '工具发现 (无认证)',
    '工具发现 (X-Api-Key)',
    '工具发现 (Authorization)',
    '工具发现 (查询参数)',
    '特定工具调用',
    '服务器信息'
  ];
  
  tests.forEach((test, index) => {
    const status = results[index] ? '✅ 通过' : '❌ 失败';
    console.log(`   ${test}: ${status}`);
  });

  const passedTests = results.filter(r => r).length;
  console.log(`\n总计: ${passedTests}/${results.length} 个测试通过`);

  if (passedTests === 0) {
    console.log('\n🚨 所有测试都失败了，可能的原因:');
    console.log('   1. 生产服务器未正确部署');
    console.log('   2. API密钥在数据库中不存在或已过期');
    console.log('   3. 认证中间件配置错误');
    console.log('   4. 网络连接问题');
  } else if (passedTests < results.length) {
    console.log('\n⚠️  部分测试失败，需要检查认证配置');
  } else {
    console.log('\n🎉 所有测试都通过了！');
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}