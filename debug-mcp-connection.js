#!/usr/bin/env node

/**
 * MCP连接调试脚本
 * 用于诊断Cursor配置问题
 */

const https = require('https');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const SERVER_URL = 'https://mcp.prompt-hub.cc';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'User-Agent': 'MCP-Debug/1.0.0'
      }
    };

    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n=== ${method} ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        try {
          const result = responseData ? JSON.parse(responseData) : {};
          console.log(`Response:`, JSON.stringify(result, null, 2));
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          console.log(`Raw Response:`, responseData);
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request failed: ${error.message}`);
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function debugMCPConnection() {
  console.log('🔍 开始MCP连接调试...');
  console.log(`服务器: ${SERVER_URL}`);
  console.log(`API密钥: ${API_KEY.substring(0, 8)}...`);

  try {
    // 1. 测试健康检查
    console.log('\n📋 1. 测试健康检查端点');
    await makeRequest('/api/health');

    // 2. 测试服务器信息
    console.log('\n📋 2. 测试服务器信息端点');
    await makeRequest('/info');

    // 3. 测试工具列表（需要认证）
    console.log('\n📋 3. 测试工具列表端点');
    await makeRequest('/tools');

    // 4. 测试调用一个简单工具
    console.log('\n📋 4. 测试调用get_categories工具');
    await makeRequest('/tools/get_categories/invoke', 'POST', {});

    // 5. 测试无效的工具调用
    console.log('\n📋 5. 测试无效工具调用');
    await makeRequest('/tools/invalid_tool/invoke', 'POST', {});

  } catch (error) {
    console.error('调试过程中发生错误:', error.message);
  }

  console.log('\n🎉 调试完成!');
}

// 运行调试
debugMCPConnection(); 