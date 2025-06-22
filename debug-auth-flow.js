#!/usr/bin/env node

/**
 * 详细调试认证流程
 */

const crypto = require('crypto');
const https = require('https');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
const MCP_SERVER_URL = 'https://mcp.prompt-hub.cc';

async function debugAuthFlow() {
  console.log('🔍 详细调试认证流程...');
  console.log(`API密钥: ${API_KEY.substring(0, 8)}...`);
  
  // 计算密钥哈希
  const keyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
  console.log(`密钥哈希: ${keyHash.substring(0, 16)}...`);
  
  // 测试各种认证方式
  const testCases = [
    {
      name: '使用 X-Api-Key 头',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
      }
    },
    {
      name: '使用 x-api-key 头 (小写)',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
      }
    },
    {
      name: '使用 api_key 头',
      headers: {
        'api_key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
      }
    },
    {
      name: '使用 Authorization Bearer',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
      }
    },
    {
      name: '使用查询参数',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PromptHub-MCP-Adapter/1.0.0'
      },
      queryParam: true
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.name}`);
    await testAuthMethod(testCase);
  }
}

function testAuthMethod(testCase) {
  return new Promise((resolve) => {
    let path = '/tools';
    if (testCase.queryParam) {
      path += `?api_key=${API_KEY}`;
    }
    
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: path,
      method: 'GET',
      headers: testCase.headers
    };
    
    console.log('请求头:', JSON.stringify(testCase.headers, null, 2));
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头:`, JSON.stringify(res.headers, null, 2));
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`✅ 成功: 找到 ${result.tools ? result.tools.length : 0} 个工具`);
          } catch (e) {
            console.log(`✅ 成功: 响应数据长度 ${data.length}`);
          }
        } else {
          console.log(`❌ 失败响应:`, data);
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

debugAuthFlow();