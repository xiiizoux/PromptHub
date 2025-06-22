#!/usr/bin/env node

/**
 * 调试部署的服务器问题
 */

const https = require('https');
const crypto = require('crypto');

const USER_API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

async function debugDeployedServer() {
  console.log('🔍 调试部署的服务器问题...');
  
  // 1. 测试基本连接
  console.log('\n1. 测试基本连接:');
  await testConnection();
  
  // 2. 测试健康检查
  console.log('\n2. 测试健康检查:');
  await testHealth();
  
  // 3. 测试不同的认证头格式
  console.log('\n3. 测试认证头格式:');
  const headers = [
    'X-Api-Key',
    'x-api-key', 
    'api_key',
    'API_KEY',
    'Authorization'
  ];
  
  for (const header of headers) {
    const value = header === 'Authorization' ? `Bearer ${USER_API_KEY}` : USER_API_KEY;
    await testAuth(header, value);
  }
  
  // 4. 测试查询参数
  console.log('\n4. 测试查询参数:');
  await testQueryParam();
  
  // 5. 测试POST请求
  console.log('\n5. 测试POST请求:');
  await testPostAuth();
}

function testConnection() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'mcp.prompt-hub.cc',
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log(`✅ 连接成功，状态码: ${res.statusCode}`);
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(`❌ 连接失败: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testHealth() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'mcp.prompt-hub.cc',
      path: '/api/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            console.log(`✅ 健康检查通过: ${health.status}, 版本: ${health.version}`);
            console.log(`存储类型: ${health.storage}, 传输类型: ${health.transportType}`);
          } catch (e) {
            console.log('✅ 健康检查通过');
          }
        } else {
          console.log(`❌ 健康检查失败: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 健康检查请求失败: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testAuth(headerName, value) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      path: '/tools',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Auth/1.0.0'
      }
    };
    
    options.headers[headerName] = value;
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const prefix = value.length > 20 ? value.substring(0, 8) + '...' : value;
        console.log(`${headerName}: ${prefix} -> 状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`  ✅ 认证成功`);
        } else {
          console.log(`  ❌ 认证失败`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testQueryParam() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'mcp.prompt-hub.cc',
      path: `/tools?api_key=${USER_API_KEY}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Query/1.0.0'
      }
    }, (res) => {
      console.log(`查询参数认证 -> 状态码: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log(`  ✅ 认证成功`);
      } else {
        console.log(`  ❌ 认证失败`);
      }
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

function testPostAuth() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ test: true });
    
    const req = https.request({
      hostname: 'mcp.prompt-hub.cc',
      path: '/tools/get_categories/invoke',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': USER_API_KEY,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Debug-Post/1.0.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`POST认证 -> 状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`  ✅ 认证成功`);
        } else {
          console.log(`  ❌ 认证失败: ${data.substring(0, 100)}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 请求失败: ${error.message}`);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

debugDeployedServer();