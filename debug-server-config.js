#!/usr/bin/env node

/**
 * 调试服务器配置
 */

const https = require('https');

async function debugServerConfig() {
  console.log('🔍 调试服务器配置...');
  
  // 测试各种端点
  const endpoints = [
    '/',
    '/health',
    '/api/health',
    '/tools',
    '/tools/get_categories/invoke'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📋 测试端点: ${endpoint}`);
    await testEndpoint(endpoint);
  }
}

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Client/1.0.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头:`, JSON.stringify(res.headers, null, 2));
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`响应内容:`, JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(`响应内容 (原始):`, data);
          }
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

debugServerConfig();