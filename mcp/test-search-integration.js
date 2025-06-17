#!/usr/bin/env node

/**
 * MCP搜索功能整合测试脚本
 * 验证统一搜索引擎是否正常工作
 */

const http = require('http');

// MCP服务器配置
const MCP_HOST = 'localhost';
const MCP_PORT = 9010;

/**
 * 发送HTTP请求到MCP服务器
 */
function makeRequest(path, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 测试MCP服务器健康状态
 */
async function testServerHealth() {
  console.log('🔍 测试MCP服务器健康状态...');
  
  try {
    const response = await makeRequest('/api/health', {}, 'GET');
    console.log('✅ MCP服务器健康检查通过:', response.status);
    return true;
  } catch (error) {
    console.error('❌ MCP服务器健康检查失败:', error.message);
    return false;
  }
}

/**
 * 测试获取工具列表
 */
async function testGetTools() {
  console.log('\n🔧 测试获取工具列表...');
  
  try {
    const response = await makeRequest('/tools', {}, 'GET');
    const searchTools = response.filter(tool => 
      tool.name.includes('search') || tool.name === 'unified_search'
    );
    
    console.log('✅ 发现搜索相关工具:');
    searchTools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    return searchTools.length > 0;
  } catch (error) {
    console.error('❌ 获取工具列表失败:', error.message);
    return false;
  }
}

/**
 * 测试快速搜索功能
 */
async function testQuickSearch() {
  console.log('\n⚡ 测试快速搜索功能...');
  
  try {
    const response = await makeRequest('/tools/search/invoke', {
      params: {
        q: '写邮件',
        limit: 3
      }
    });
    
    if (response.error) {
      console.error('❌ 快速搜索失败:', response.error.message);
      return false;
    }
    
    console.log('✅ 快速搜索成功');
    
    // 尝试解析响应内容
    try {
      const content = JSON.parse(response.content[0].text);
      console.log(`  - 找到 ${content.data?.count || 0} 个结果`);
      console.log('  - 搜索响应格式正确');
    } catch (parseError) {
      console.log('  - 搜索返回了响应，但格式可能不是JSON');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 快速搜索测试失败:', error.message);
    return false;
  }
}

/**
 * 测试统一搜索引擎
 */
async function testUnifiedSearch() {
  console.log('\n🔍 测试统一搜索引擎...');
  
  try {
    const response = await makeRequest('/tools/unified_search/invoke', {
      params: {
        query: '我需要写一份商务邮件',
        algorithm: 'smart',
        max_results: 5
      }
    });
    
    if (response.error) {
      console.error('❌ 统一搜索失败:', response.error.message);
      return false;
    }
    
    console.log('✅ 统一搜索成功');
    
    // 尝试解析响应内容
    try {
      const content = JSON.parse(response.content[0].text);
      console.log(`  - 找到 ${content.data?.results?.length || 0} 个结果`);
      console.log(`  - 搜索算法: ${content.data?.search_config?.algorithm || '未知'}`);
      console.log(`  - 平均置信度: ${content.data?.performance?.average_confidence || 0}`);
    } catch (parseError) {
      console.log('  - 统一搜索返回了响应，但格式可能不是JSON');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 统一搜索测试失败:', error.message);
    return false;
  }
}

/**
 * 测试语义搜索算法
 */
async function testSemanticSearch() {
  console.log('\n🧠 测试语义搜索算法...');
  
  try {
    const response = await makeRequest('/tools/unified_search/invoke', {
      params: {
        query: '帮我写一封正式的道歉邮件',
        algorithm: 'semantic',
        context: '商务环境',
        max_results: 3
      }
    });
    
    if (response.error) {
      console.error('❌ 语义搜索失败:', response.error.message);
      return false;
    }
    
    console.log('✅ 语义搜索成功');
    
    try {
      const content = JSON.parse(response.content[0].text);
      console.log(`  - 找到 ${content.data?.results?.length || 0} 个语义匹配结果`);
      
      if (content.data?.results?.length > 0) {
        const firstResult = content.data.results[0];
        console.log(`  - 第一个结果置信度: ${Math.round((firstResult.confidence || 0) * 100)}%`);
        console.log(`  - 匹配理由: ${firstResult.reasons?.join(', ') || '未提供'}`);
      }
    } catch (parseError) {
      console.log('  - 语义搜索返回了响应，但格式解析失败');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 语义搜索测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始MCP搜索功能整合测试\n');
  
  const results = [];
  
  // 1. 健康检查
  results.push(await testServerHealth());
  
  // 2. 工具列表
  results.push(await testGetTools());
  
  // 3. 快速搜索
  results.push(await testQuickSearch());
  
  // 4. 统一搜索
  results.push(await testUnifiedSearch());
  
  // 5. 语义搜索
  results.push(await testSemanticSearch());
  
  // 测试结果汇总
  const passCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log('\n📊 测试结果汇总:');
  console.log(`通过: ${passCount}/${totalCount}`);
  console.log(`成功率: ${Math.round((passCount / totalCount) * 100)}%`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 所有测试通过！MCP搜索功能整合成功');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查MCP服务器状态');
    process.exit(1);
  }
}

// 添加优雅的错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的Promise拒绝:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testServerHealth,
  testGetTools,
  testQuickSearch,
  testUnifiedSearch,
  testSemanticSearch,
  runAllTests
}; 