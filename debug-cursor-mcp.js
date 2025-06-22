#!/usr/bin/env node

/**
 * Cursor MCP调试工具
 * 模拟Cursor调用NPX包的过程
 */

const { spawn } = require('child_process');
const path = require('path');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 Cursor MCP调试工具');
console.log('===================');

// 检查环境
function checkEnvironment() {
  console.log('\n📋 环境检查:');
  
  // Node.js版本
  console.log(`✅ Node.js版本: ${process.version}`);
  
  // 工作目录
  console.log(`📁 工作目录: ${process.cwd()}`);
  
  // 环境变量
  const apiKey = process.env.API_KEY;
  console.log(`🔑 API密钥: ${apiKey ? '已设置' : '❌ 未设置'}`);
  
  if (apiKey && apiKey !== 'your-api-key-here' && apiKey !== 'your-actual-api-key-here') {
    console.log(`   密钥长度: ${apiKey.length} 字符`);
  } else {
    console.log('   ⚠️  请设置真实的API密钥');
  }
}

// 测试网络连接
async function testConnection() {
  console.log('\n🌐 网络连接测试:');
  
  try {
    const result = await makeRequest('/api/health');
    if (result.status === 200) {
      console.log('✅ 服务器连接正常');
    } else {
      console.log(`❌ 服务器连接失败: ${result.status}`);
    }
  } catch (error) {
    console.log(`❌ 网络错误: ${error.message}`);
  }
}

// 测试API认证
async function testAuthentication() {
  console.log('\n🔐 API认证测试:');
  
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'your-actual-api-key-here') {
    console.log('⚠️  跳过认证测试 - 未设置有效API密钥');
    return;
  }
  
  try {
    const result = await makeRequest('/tools', { 'X-Api-Key': apiKey });
    if (result.status === 200) {
      console.log('✅ API认证成功');
      if (result.data && result.data.tools) {
        console.log(`✅ 发现 ${result.data.tools.length} 个工具`);
        result.data.tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
      }
    } else if (result.status === 401) {
      console.log('❌ API密钥无效');
    } else if (result.status === 403) {
      console.log('❌ API密钥权限不足');
    } else {
      console.log(`❌ 认证失败: ${result.status}`);
    }
  } catch (error) {
    console.log(`❌ 认证测试错误: ${error.message}`);
  }
}

// 测试MCP协议
async function testMCPProtocol() {
  console.log('\n🔌 MCP协议测试:');
  
  // 模拟MCP初始化请求
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'debug-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('📤 发送MCP初始化请求...');
  console.log(JSON.stringify(initMessage, null, 2));
  
  // 这里我们无法直接测试MCP协议，因为它需要stdio通信
  console.log('ℹ️  MCP协议需要通过stdio通信，无法在此直接测试');
}

// 生成配置建议
function generateConfigSuggestions() {
  console.log('\n💡 配置建议:');
  
  const apiKey = process.env.API_KEY;
  const hasValidKey = apiKey && apiKey !== 'your-api-key-here' && apiKey !== 'your-actual-api-key-here';
  
  console.log('\n🏆 推荐配置 (本地文件方案):');
  console.log('1. 下载适配器文件:');
  console.log('   curl -o auto-download-adapter.js https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js');
  
  console.log('\n2. Cursor配置:');
  console.log(JSON.stringify({
    mcpServers: {
      prompthub: {
        command: 'node',
        args: ['./auto-download-adapter.js'],
        env: {
          API_KEY: hasValidKey ? apiKey : 'your-actual-api-key-here'
        }
      }
    }
  }, null, 2));
  
  console.log('\n🔄 备选配置 (Node.js内联):');
  console.log(JSON.stringify({
    mcpServers: {
      prompthub: {
        command: 'node',
        args: ['-e', "require('https').get('https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => eval(data)); })"],
        env: {
          API_KEY: hasValidKey ? apiKey : 'your-actual-api-key-here'
        }
      }
    }
  }, null, 2));
}

// HTTP请求工具函数
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mcp.prompt-hub.cc',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cursor-MCP-Debug/1.0.0',
        ...headers
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 主函数
async function main() {
  try {
    checkEnvironment();
    await testConnection();
    await testAuthentication();
    await testMCPProtocol();
    generateConfigSuggestions();
    
    console.log('\n🎯 调试完成!');
    console.log('\n📞 如果问题仍然存在，请提供以上输出信息以获得进一步帮助。');
    
  } catch (error) {
    console.error('\n❌ 调试过程中发生错误:', error.message);
  }
}

// 运行调试
if (require.main === module) {
  main();
}
