#!/usr/bin/env node

/**
 * MCP协议测试脚本
 * 测试生产环境的MCP协议实现方式
 */

const https = require('https');

const PRODUCTION_SERVER = 'https://mcp.prompt-hub.cc';
const USER_API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

console.log('🔍 MCP协议测试');
console.log('='.repeat(50));

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
        'User-Agent': 'PromptHub-MCP-Test/1.0',
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

async function testMcpJsonRpc() {
  console.log('1️⃣ 测试标准MCP JSON-RPC协议...');
  
  // 测试initialize
  console.log('   测试initialize...');
  try {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const response = await makeRequest('/', {
      method: 'POST',
      headers: { 'X-Api-Key': USER_API_KEY },
      body: initRequest
    });

    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 测试tools/list
  console.log('\n   测试tools/list...');
  try {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await makeRequest('/', {
      method: 'POST',
      headers: { 'X-Api-Key': USER_API_KEY },
      body: toolsRequest
    });

    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }
}

async function testRestApi() {
  console.log('\n2️⃣ 测试REST API方式...');
  
  // 测试GET /tools
  console.log('   测试GET /tools...');
  try {
    const response = await makeRequest('/tools', {
      headers: { 'X-Api-Key': USER_API_KEY }
    });

    console.log(`   状态: ${response.status}`);
    if (response.status === 200) {
      console.log(`   工具数量: ${response.data.tools ? response.data.tools.length : 0}`);
      if (response.data.tools && response.data.tools.length > 0) {
        console.log(`   第一个工具: ${response.data.tools[0].name}`);
      }
    } else {
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 测试POST /tools/get_categories/invoke
  console.log('\n   测试POST /tools/get_categories/invoke...');
  try {
    const response = await makeRequest('/tools/get_categories/invoke', {
      method: 'POST',
      headers: { 'X-Api-Key': USER_API_KEY },
      body: {}
    });

    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }
}

async function testMixedProtocol() {
  console.log('\n3️⃣ 测试混合协议方式...');
  
  // 测试JSON-RPC格式发送到REST端点
  console.log('   测试JSON-RPC -> REST端点...');
  try {
    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_categories',
        arguments: {}
      }
    };

    const response = await makeRequest('/tools/get_categories/invoke', {
      method: 'POST',
      headers: { 'X-Api-Key': USER_API_KEY },
      body: toolCallRequest
    });

    console.log(`   状态: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }
}

async function main() {
  console.log('开始MCP协议测试...\n');

  await testMcpJsonRpc();
  await testRestApi();
  await testMixedProtocol();

  console.log('\n📊 测试完成');
  console.log('='.repeat(30));
  console.log('基于测试结果，我们可以确定生产环境使用的协议类型');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}