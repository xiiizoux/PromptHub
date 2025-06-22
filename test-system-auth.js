#!/usr/bin/env node

/**
 * 测试系统级API密钥认证
 */

const https = require('https');
require('dotenv').config();

async function testSystemAuth() {
  console.log('🔍 测试系统级API密钥认证...');
  
  const systemApiKey = process.env.API_KEY;
  const serverKey = process.env.SERVER_KEY;
  
  console.log(`系统API密钥存在: ${!!systemApiKey}`);
  console.log(`服务器密钥存在: ${!!serverKey}`);
  
  if (systemApiKey) {
    console.log(`系统API密钥前8位: ${systemApiKey.substring(0, 8)}...`);
  }
  
  if (serverKey) {
    console.log(`服务器密钥前8位: ${serverKey.substring(0, 8)}...`);
  }
  
  // 测试系统级API密钥
  if (systemApiKey) {
    console.log('\n📋 测试系统级API密钥...');
    await testAuthWithKey('X-Api-Key', systemApiKey, '系统API密钥');
  }
  
  if (serverKey && serverKey !== systemApiKey) {
    console.log('\n📋 测试服务器密钥...');
    await testAuthWithKey('X-Api-Key', serverKey, '服务器密钥');
  }
}

function testAuthWithKey(headerName, key, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: '/tools',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'System-Test/1.0.0'
      }
    };
    
    options.headers[headerName] = key;
    
    console.log(`测试 ${description}: ${key.substring(0, 8)}...`);
    
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
            console.log(`✅ ${description} 认证成功: 找到 ${result.tools ? result.tools.length : 0} 个工具`);
          } catch (e) {
            console.log(`✅ ${description} 认证成功: 响应数据长度 ${data.length}`);
          }
        } else {
          console.log(`❌ ${description} 认证失败: ${data}`);
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

testSystemAuth();