#!/usr/bin/env node

/**
 * 测试HTTP头大小写问题
 */

const https = require('https');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const MCP_SERVER_URL = 'https://mcp.prompt-hub.cc';

async function testHeaders() {
  console.log('🔍 测试HTTP头大小写问题...');
  
  // 测试1: 使用X-Api-Key (大写)
  console.log('\n📋 测试1: 使用X-Api-Key (大写)');
  await testRequest('X-Api-Key', API_KEY);
  
  // 测试2: 使用x-api-key (小写)
  console.log('\n📋 测试2: 使用x-api-key (小写)');
  await testRequest('x-api-key', API_KEY);
  
  // 测试3: 使用Authorization Bearer
  console.log('\n📋 测试3: 使用Authorization Bearer');
  await testRequest('Authorization', `Bearer ${API_KEY}`);
}

function testRequest(headerName, headerValue) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: '/tools',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0.0'
      }
    };
    
    options.headers[headerName] = headerValue;
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`✅ 成功: 找到 ${result.tools ? result.tools.length : 0} 个工具`);
          } catch (e) {
            console.log(`✅ 成功: 响应数据长度 ${data.length}`);
          }
        } else {
          console.log(`❌ 失败: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求错误: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

testHeaders();