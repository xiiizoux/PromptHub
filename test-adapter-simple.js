#!/usr/bin/env node

/**
 * 简单的适配器测试脚本
 */

const { PromptHubMCPAdapter } = require('./prompthub-mcp-adapter/index.js');

async function testAdapter() {
  console.log('🧪 测试PromptHub MCP适配器');
  console.log('='.repeat(40));

  // 设置环境变量
  process.env.API_KEY = 'aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653';
  process.env.MCP_SERVER_URL = 'https://mcp.prompt-hub.cc';

  const adapter = new PromptHubMCPAdapter();

  try {
    // 1. 测试初始化
    console.log('1️⃣ 测试初始化...');
    await adapter.initialize();
    console.log('   ✅ 初始化成功');

    // 2. 测试获取工具列表
    console.log('\n2️⃣ 测试获取工具列表...');
    const tools = adapter.getAvailableTools();
    console.log(`   ✅ 获取到 ${tools.length} 个工具`);
    console.log(`   前3个工具: ${tools.slice(0, 3).map(t => t.name).join(', ')}`);

    // 3. 测试工具调用
    console.log('\n3️⃣ 测试工具调用...');
    console.log('   调用 get_categories...');
    const result = await adapter.handleToolCall('get_categories', {});
    console.log('   ✅ 工具调用成功');
    console.log(`   响应长度: ${JSON.stringify(result).length} 字符`);

    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('   错误详情:', error);
  }
}

// 运行测试
if (require.main === module) {
  testAdapter().catch(console.error);
}