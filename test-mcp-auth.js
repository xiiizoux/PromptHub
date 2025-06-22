#!/usr/bin/env node

/**
 * MCP API认证测试脚本
 * 用于测试MCP服务器的API密钥认证功能
 */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const MCP_SERVER_URL = process.env.MCP_URL || 'http://localhost:9010';
const SYSTEM_API_KEY = process.env.API_KEY;

console.log('🧪 MCP API认证测试');
console.log('='.repeat(50));
console.log(`服务器地址: ${MCP_SERVER_URL}`);
console.log(`系统API密钥: ${SYSTEM_API_KEY ? SYSTEM_API_KEY.substring(0, 8) + '...' : '未设置'}`);
console.log('');

/**
 * 测试API端点
 */
async function testEndpoint(endpoint, apiKey, description) {
  console.log(`📡 测试: ${description}`);
  console.log(`   端点: ${endpoint}`);
  console.log(`   API密钥: ${apiKey ? apiKey.substring(0, 8) + '...' : '无'}`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Auth-Test/1.0'
    };
    
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    
    const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, {
      method: 'GET',
      headers,
      timeout: 10000
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }
    
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(responseData, null, 2).substring(0, 200)}...`);
    
    if (response.status === 200) {
      console.log('   ✅ 成功');
    } else if (response.status === 401) {
      console.log('   ❌ 认证失败');
    } else {
      console.log(`   ⚠️  其他错误 (${response.status})`);
    }
    
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 主测试函数
 */
async function runTests() {
  // 1. 测试健康检查端点（不需要认证）
  await testEndpoint('/api/health', null, '健康检查（无认证）');
  
  // 2. 测试根端点（不需要认证）
  await testEndpoint('/', null, '根端点（无认证）');
  
  // 3. 测试工具列表端点（需要认证）
  await testEndpoint('/tools', null, '工具列表（无API密钥）');
  
  // 4. 使用系统API密钥测试工具列表
  if (SYSTEM_API_KEY) {
    await testEndpoint('/tools', SYSTEM_API_KEY, '工具列表（系统API密钥）');
  }
  
  // 5. 使用错误的API密钥测试
  await testEndpoint('/tools', 'invalid-api-key-test', '工具列表（无效API密钥）');
  
  // 6. 测试提示词列表端点
  if (SYSTEM_API_KEY) {
    await testEndpoint('/api/prompts', SYSTEM_API_KEY, '提示词列表（系统API密钥）');
  }
  
  console.log('🏁 测试完成');
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
