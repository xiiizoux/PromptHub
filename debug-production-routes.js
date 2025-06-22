#!/usr/bin/env node

/**
 * 生产环境路由调试脚本
 * 测试生产环境的实际路由结构
 */

const https = require('https');

// 配置
const PRODUCTION_SERVER = 'https://mcp.prompt-hub.cc';
const USER_API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

console.log('🔍 生产环境路由调试');
console.log('='.repeat(50));
console.log(`服务器: ${PRODUCTION_SERVER}`);
console.log('');

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
        'User-Agent': 'PromptHub-Debug/1.0',
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

// 测试不同的路由路径
const routesToTest = [
  '/',
  '/api',
  '/api/health',
  '/health',
  '/status',
  '/mcp',
  '/mcp/tools',
  '/mcp/health',
  '/api/mcp',
  '/api/mcp/tools',
  '/api/tools',
  '/v1/tools',
  '/tools',
  '/initialize',
  '/api/initialize'
];

async function testRoute(path) {
  console.log(`测试路由: ${path}`);
  try {
    // 不带认证的请求
    const response1 = await makeRequest(path);
    console.log(`   无认证: ${response1.status} - ${JSON.stringify(response1.data).substring(0, 100)}...`);
    
    // 带API密钥的请求
    const response2 = await makeRequest(path, {
      headers: {
        'X-Api-Key': USER_API_KEY
      }
    });
    console.log(`   有认证: ${response2.status} - ${JSON.stringify(response2.data).substring(0, 100)}...`);
    
    return { path, withoutAuth: response1.status, withAuth: response2.status };
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return { path, error: error.message };
  }
}

// 主函数
async function main() {
  console.log('开始路由发现测试...\n');

  const results = [];
  
  for (const route of routesToTest) {
    const result = await testRoute(route);
    results.push(result);
    console.log('');
  }

  // 汇总结果
  console.log('📊 路由测试结果汇总:');
  console.log('='.repeat(50));
  
  const validRoutes = results.filter(r => !r.error && (r.withoutAuth < 500 || r.withAuth < 500));
  const authRequiredRoutes = results.filter(r => !r.error && r.withoutAuth === 401 && r.withAuth !== 401);
  const publicRoutes = results.filter(r => !r.error && r.withoutAuth === 200);
  
  console.log(`有效路由 (${validRoutes.length}个):`);
  validRoutes.forEach(r => {
    console.log(`   ${r.path}: 无认证=${r.withoutAuth}, 有认证=${r.withAuth}`);
  });
  
  console.log(`\n需要认证的路由 (${authRequiredRoutes.length}个):`);
  authRequiredRoutes.forEach(r => {
    console.log(`   ${r.path}: 认证后状态=${r.withAuth}`);
  });
  
  console.log(`\n公开路由 (${publicRoutes.length}个):`);
  publicRoutes.forEach(r => {
    console.log(`   ${r.path}`);
  });

  // 特别测试MCP协议相关的路由
  console.log('\n🔧 测试MCP协议相关功能...');
  
  // 测试initialize端点
  try {
    const initResponse = await makeRequest('/', {
      method: 'POST',
      headers: {
        'X-Api-Key': USER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: {
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
      }
    });
    console.log(`MCP Initialize: ${initResponse.status}`);
    console.log(`响应: ${JSON.stringify(initResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`MCP Initialize 错误: ${error.message}`);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}