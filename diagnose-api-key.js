#!/usr/bin/env node

/**
 * API密钥诊断脚本
 * 帮助诊断API密钥认证问题
 */

const https = require('https');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const SERVER_URL = 'https://mcp.prompt-hub.cc';

console.log('🔍 API密钥诊断工具');
console.log('==================');
console.log(`🔑 测试密钥: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-8)}`);
console.log(`📡 服务器: ${SERVER_URL}`);
console.log('');

// 测试不同的认证方式
const authMethods = [
  {
    name: 'X-Api-Key 头部',
    headers: { 'X-Api-Key': API_KEY }
  },
  {
    name: 'Server-Key 头部',
    headers: { 'Server-Key': API_KEY }
  },
  {
    name: 'Authorization Bearer',
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  },
  {
    name: 'api_key 查询参数',
    query: `?api_key=${API_KEY}`
  }
];

// 测试端点
const endpoints = [
  { path: '/api/health', description: '健康检查（通常不需要认证）' },
  { path: '/tools', description: '工具列表（需要认证）' },
  { path: '/api/prompts', description: '提示词列表（需要认证）' },
  { path: '/', description: '根路径' }
];

function makeRequest(path, headers = {}, query = '') {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${path}${query}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Key-Diagnostic/1.0.0',
        ...headers
      },
      timeout: 10000
    };

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
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
}

async function testEndpoint(endpoint, authMethod) {
  const { path, description } = endpoint;
  const { name, headers = {}, query = '' } = authMethod;
  
  console.log(`🧪 测试: ${description} - ${name}`);
  
  try {
    const result = await makeRequest(path, headers, query);
    
    if (result.error) {
      console.log(`   ❌ 网络错误: ${result.error}`);
      return { success: false, error: result.error };
    }
    
    const status = result.status;
    const success = status >= 200 && status < 300;
    
    if (success) {
      console.log(`   ✅ 成功 (${status})`);
      if (result.data && result.data.tools) {
        console.log(`   📋 发现 ${result.data.tools.length} 个工具`);
      }
    } else if (status === 401) {
      console.log(`   🔐 认证失败 (${status}): ${result.data?.error || '未授权'}`);
    } else if (status === 403) {
      console.log(`   🚫 权限不足 (${status}): ${result.data?.error || '禁止访问'}`);
    } else if (status === 429) {
      console.log(`   ⏰ 请求过于频繁 (${status}): ${result.data?.error || '速率限制'}`);
    } else {
      console.log(`   ❌ 失败 (${status}): ${result.data?.error || '未知错误'}`);
    }
    
    // 显示响应头中的有用信息
    if (result.headers) {
      const rateLimitRemaining = result.headers['x-ratelimit-remaining'];
      const rateLimitReset = result.headers['x-ratelimit-reset'];
      
      if (rateLimitRemaining !== undefined) {
        console.log(`   📊 剩余请求: ${rateLimitRemaining}`);
      }
      
      if (rateLimitReset !== undefined) {
        const resetTime = new Date(parseInt(rateLimitReset) * 1000);
        console.log(`   ⏰ 重置时间: ${resetTime.toLocaleString()}`);
      }
    }
    
    return { success, status, data: result.data };
    
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🚀 开始诊断...\n');
  
  const results = [];
  
  // 首先测试健康检查（不需要认证）
  console.log('📋 第一步: 测试服务器连接');
  const healthResult = await testEndpoint(
    { path: '/api/health', description: '健康检查' },
    { name: '无认证', headers: {} }
  );
  
  if (!healthResult.success) {
    console.log('\n❌ 服务器连接失败，无法继续测试');
    return;
  }
  
  console.log('\n📋 第二步: 测试不同认证方式');
  
  // 测试需要认证的端点
  for (const endpoint of endpoints.slice(1)) { // 跳过健康检查
    console.log(`\n--- 测试端点: ${endpoint.description} ---`);
    
    for (const authMethod of authMethods) {
      const result = await testEndpoint(endpoint, authMethod);
      results.push({
        endpoint: endpoint.path,
        authMethod: authMethod.name,
        ...result
      });
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 诊断结果汇总');
  console.log('================');
  
  const successfulMethods = results.filter(r => r.success);
  const authFailures = results.filter(r => r.status === 401);
  const permissionFailures = results.filter(r => r.status === 403);
  const rateLimitFailures = results.filter(r => r.status === 429);
  
  console.log(`✅ 成功的请求: ${successfulMethods.length}`);
  console.log(`🔐 认证失败: ${authFailures.length}`);
  console.log(`🚫 权限不足: ${permissionFailures.length}`);
  console.log(`⏰ 速率限制: ${rateLimitFailures.length}`);
  
  if (successfulMethods.length > 0) {
    console.log('\n🎉 找到有效的认证方式:');
    successfulMethods.forEach(method => {
      console.log(`   ✅ ${method.endpoint} - ${method.authMethod}`);
    });
  } else {
    console.log('\n❌ 没有找到有效的认证方式');
    
    if (authFailures.length > 0) {
      console.log('\n🔍 可能的问题:');
      console.log('   1. API密钥无效或已过期');
      console.log('   2. API密钥未激活');
      console.log('   3. 服务器配置问题');
      console.log('   4. 数据库连接问题');
    }
  }
  
  console.log('\n💡 建议的解决方案:');
  console.log('   1. 检查API密钥是否正确');
  console.log('   2. 确认API密钥是否已激活');
  console.log('   3. 联系管理员检查服务器配置');
  console.log('   4. 尝试重新生成API密钥');
}

// 运行诊断
runDiagnostics().catch(error => {
  console.error('❌ 诊断过程中发生错误:', error.message);
});
