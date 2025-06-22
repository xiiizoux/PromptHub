#!/usr/bin/env node

/**
 * 测试服务器环境配置
 */

const https = require('https');
require('dotenv').config();

async function testServerEnv() {
  console.log('🔍 测试服务器环境配置...');
  
  // 获取本地环境变量
  const localApiKey = process.env.API_KEY;
  const localServerKey = process.env.SERVER_KEY;
  
  console.log(`本地API密钥: ${localApiKey ? localApiKey.substring(0, 8) + '...' : '未设置'}`);
  console.log(`本地服务器密钥: ${localServerKey ? localServerKey.substring(0, 8) + '...' : '未设置'}`);
  
  // 测试用户API密钥
  const userApiKey = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
  console.log(`用户API密钥: ${userApiKey.substring(0, 8)}...`);
  
  // 测试各种认证方式
  const testCases = [
    {
      name: '本地API密钥 (X-Api-Key)',
      key: localApiKey,
      header: 'X-Api-Key'
    },
    {
      name: '本地服务器密钥 (X-Api-Key)',
      key: localServerKey,
      header: 'X-Api-Key'
    },
    {
      name: '用户API密钥 (X-Api-Key)',
      key: userApiKey,
      header: 'X-Api-Key'
    },
    {
      name: '本地API密钥 (x-api-key)',
      key: localApiKey,
      header: 'x-api-key'
    },
    {
      name: '用户API密钥 (x-api-key)',
      key: userApiKey,
      header: 'x-api-key'
    }
  ];
  
  for (const testCase of testCases) {
    if (testCase.key) {
      console.log(`\n📋 测试: ${testCase.name}`);
      await testAuth(testCase.header, testCase.key);
    }
  }
}

function testAuth(headerName, key) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: '/tools',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Env-Test/1.0.0'
      }
    };
    
    options.headers[headerName] = key;
    
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
            console.log(`✅ 认证成功: 找到 ${result.tools ? result.tools.length : 0} 个工具`);
          } catch (e) {
            console.log(`✅ 认证成功: 响应长度 ${data.length}`);
          }
        } else {
          console.log(`❌ 认证失败: ${data}`);
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

testServerEnv();