#!/usr/bin/env node

/**
 * MCP协议测试脚本
 * 模拟Cursor与适配器的交互
 */

const { spawn } = require('child_process');

const API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';

function testMCPProtocol() {
  console.log('🧪 开始MCP协议测试...');
  
  // 启动适配器
  const adapter = spawn('node', ['prompthub-mcp-adapter/index.js'], {
    env: {
      ...process.env,
      API_KEY: API_KEY,
      MCP_SERVER_URL: 'https://mcp.prompt-hub.cc'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responses = [];
  let testStep = 0;
  
  // 监听标准输出（MCP响应）
  adapter.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const response = JSON.parse(line);
        console.log(`📥 收到响应 ${testStep}:`, JSON.stringify(response, null, 2));
        responses.push(response);
        
        // 处理下一步测试
        handleNextTest();
      } catch (error) {
        console.log(`📥 收到非JSON响应:`, line);
      }
    });
  });

  // 监听标准错误（日志）
  adapter.stderr.on('data', (data) => {
    console.log(`📋 适配器日志:`, data.toString().trim());
  });

  // 适配器退出处理
  adapter.on('close', (code) => {
    console.log(`🔚 适配器退出，代码: ${code}`);
    console.log(`📊 总共收到 ${responses.length} 个响应`);
    
    // 分析结果
    analyzeResults();
  });

  // 发送MCP消息
  function sendMessage(message) {
    console.log(`📤 发送消息 ${testStep}:`, JSON.stringify(message, null, 2));
    adapter.stdin.write(JSON.stringify(message) + '\n');
    testStep++;
  }

  // 处理下一步测试
  function handleNextTest() {
    setTimeout(() => {
      switch (testStep) {
        case 1:
          // 第一步：初始化
          sendMessage({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: {
                name: 'Test Client',
                version: '1.0.0'
              }
            }
          });
          break;
          
        case 2:
          // 第二步：获取工具列表
          sendMessage({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          });
          break;
          
        case 3:
          // 第三步：调用一个工具
          sendMessage({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'get_categories',
              arguments: {}
            }
          });
          break;
          
        default:
          // 测试完成，关闭适配器
          setTimeout(() => {
            adapter.stdin.end();
          }, 1000);
      }
    }, 500);
  }

  // 分析测试结果
  function analyzeResults() {
    console.log('\n🔍 测试结果分析:');
    
    // 检查初始化响应
    const initResponse = responses.find(r => r.id === 1);
    if (initResponse && initResponse.result) {
      console.log('✅ 初始化成功');
      console.log(`   协议版本: ${initResponse.result.protocolVersion}`);
      console.log(`   服务器名称: ${initResponse.result.serverInfo?.name}`);
    } else {
      console.log('❌ 初始化失败');
    }
    
    // 检查工具列表响应
    const toolsResponse = responses.find(r => r.id === 2);
    if (toolsResponse && toolsResponse.result && toolsResponse.result.tools) {
      const toolCount = toolsResponse.result.tools.length;
      console.log(`✅ 工具列表获取成功: ${toolCount} 个工具`);
      
      if (toolCount === 0) {
        console.log('⚠️  警告: 工具数量为0，这可能是问题所在');
      } else {
        console.log('   前5个工具:');
        toolsResponse.result.tools.slice(0, 5).forEach((tool, i) => {
          console.log(`   ${i + 1}. ${tool.name}: ${tool.description}`);
        });
      }
    } else {
      console.log('❌ 工具列表获取失败');
      if (toolsResponse && toolsResponse.error) {
        console.log(`   错误: ${toolsResponse.error.message}`);
      }
    }
    
    // 检查工具调用响应
    const callResponse = responses.find(r => r.id === 3);
    if (callResponse && callResponse.result) {
      console.log('✅ 工具调用成功');
    } else {
      console.log('❌ 工具调用失败');
      if (callResponse && callResponse.error) {
        console.log(`   错误: ${callResponse.error.message}`);
      }
    }
    
    console.log('\n🎯 问题诊断:');
    if (responses.length === 0) {
      console.log('❌ 没有收到任何响应，适配器可能无法启动');
    } else if (!responses.find(r => r.id === 2)?.result?.tools?.length) {
      console.log('❌ 工具列表为空，这是Cursor显示0个工具的原因');
      console.log('   可能原因:');
      console.log('   1. API密钥无效或过期');
      console.log('   2. MCP服务器认证失败');
      console.log('   3. 网络连接问题');
      console.log('   4. 服务器端点配置错误');
    } else {
      console.log('✅ 适配器工作正常');
    }
  }

  // 开始测试
  setTimeout(() => {
    handleNextTest();
  }, 2000); // 等待适配器初始化
}

// 运行测试
testMCPProtocol(); 