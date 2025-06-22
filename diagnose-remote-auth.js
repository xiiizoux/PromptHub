#!/usr/bin/env node

/**
 * 远程认证问题诊断脚本
 * 用于检查远程MCP服务器的认证配置问题
 */

const https = require('https');
const http = require('http');

// 测试配置
const config = {
  remoteUrl: 'https://mcp.prompt-hub.cc',
  localUrl: 'http://localhost:9010',
  apiKey: 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653'
};

console.log('🔍 MCP远程认证问题诊断工具');
console.log('=' .repeat(50));

// HTTP请求封装函数
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

// 诊断步骤
async function runDiagnostics() {
  console.log('📊 开始诊断...\n');

  // 1. 检查远程服务器状态
  console.log('1️⃣  检查远程服务器健康状态...');
  try {
    const healthCheck = await makeRequest(`${config.remoteUrl}/api/health`);
    console.log(`   ✅ 远程服务器状态: ${healthCheck.status === 200 ? '正常' : '异常'}`);
    if (healthCheck.data.storage) {
      console.log(`   📦 存储类型: ${healthCheck.data.storage}`);
    }
    if (healthCheck.data.version) {
      console.log(`   🔢 版本: ${healthCheck.data.version}`);
    }
  } catch (error) {
    console.log(`   ❌ 远程服务器检查失败: ${error.message}`);
    return;
  }

  // 2. 检查本地服务器（如果运行）
  console.log('\n2️⃣  检查本地服务器状态...');
  try {
    const localHealth = await makeRequest(`${config.localUrl}/api/health`);
    console.log(`   ✅ 本地服务器状态: ${localHealth.status === 200 ? '正常' : '异常'}`);
  } catch (error) {
    console.log(`   ⚠️  本地服务器未运行或不可达: ${error.message}`);
  }

  // 3. 测试远程API密钥认证
  console.log('\n3️⃣  测试远程API密钥认证...');
  try {
    const remoteAuth = await makeRequest(`${config.remoteUrl}/tools`, {
      'X-Api-Key': config.apiKey
    });
    
    console.log(`   📡 远程认证状态码: ${remoteAuth.status}`);
    
    if (remoteAuth.status === 200) {
      console.log('   ✅ 远程认证成功');
      if (remoteAuth.data.tools) {
        console.log(`   🔧 可用工具数量: ${remoteAuth.data.tools.length}`);
      }
    } else {
      console.log('   ❌ 远程认证失败');
      console.log(`   📄 错误响应: ${JSON.stringify(remoteAuth.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ 远程认证测试失败: ${error.message}`);
  }

  // 4. 测试本地API密钥认证（对比）
  console.log('\n4️⃣  测试本地API密钥认证（对比）...');
  try {
    const localAuth = await makeRequest(`${config.localUrl}/tools`, {
      'X-Api-Key': config.apiKey
    });
    
    console.log(`   📡 本地认证状态码: ${localAuth.status}`);
    
    if (localAuth.status === 200) {
      console.log('   ✅ 本地认证成功');
      if (localAuth.data.tools) {
        console.log(`   🔧 可用工具数量: ${localAuth.data.tools.length}`);
      }
    } else {
      console.log('   ❌ 本地认证失败');
      console.log(`   📄 错误响应: ${JSON.stringify(localAuth.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  本地认证测试失败: ${error.message}`);
  }

  // 5. 分析和建议
  console.log('\n📋 诊断结果和建议:');
  console.log('=' .repeat(50));
  
  console.log('\n🔧 可能的解决方案:');
  console.log('1. 检查远程环境的.env文件配置');
  console.log('2. 确认远程环境使用相同的Supabase数据库');
  console.log('3. 检查远程环境的代码版本是否与本地一致');
  console.log('4. 验证远程环境的网络和防火墙设置');
  
  console.log('\n🎯 下一步建议:');
  console.log('1. 登录远程服务器检查.env配置');
  console.log('2. 重启远程MCP服务');
  console.log('3. 检查远程服务器的日志');
  
  console.log('\n📧 如需技术支持，请提供以上诊断信息');
}

// 运行诊断
runDiagnostics().catch(console.error); 