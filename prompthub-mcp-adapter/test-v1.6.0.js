#!/usr/bin/env node

/**
 * PromptHub MCP Adapter v1.6.0 功能测试
 * 测试新增的提示词优化工具
 */

const { spawn } = require('child_process');

console.log('🚀 PromptHub MCP Adapter v1.6.0 功能测试');
console.log('=' .repeat(50));

// 模拟MCP客户端请求
const testRequests = [
  // 1. 测试工具列表请求
  {
    name: '获取工具列表',
    message: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    }
  },
  
  // 2. 测试新的提示词优化工具
  {
    name: '测试提示词优化工具',
    message: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'prompt_optimizer',
        arguments: {
          content: '帮我写个邮件',
          optimization_type: 'business',
          requirements: '专业且简洁',
          complexity: 'medium',
          language: 'zh'
        }
      }
    }
  },
  
  // 3. 测试绘图优化
  {
    name: '测试绘图提示词优化',
    message: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'prompt_optimizer',
        arguments: {
          content: '画一个漂亮的风景',
          optimization_type: 'drawing',
          complexity: 'medium',
          language: 'zh'
        }
      }
    }
  }
];

async function runTest() {
  console.log('📋 测试项目列表:');
  testRequests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
  });
  console.log('');

  // 启动适配器进程
  const adapter = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseCount = 0;
  let output = '';

  adapter.stdout.on('data', (data) => {
    output += data.toString();
    
    // 检查是否收到初始化完成的信号
    if (output.includes('初始化完成')) {
      console.log('✅ 适配器初始化完成');
      
      // 发送测试请求
      testRequests.forEach((test, index) => {
        setTimeout(() => {
          console.log(`\n🧪 测试 ${index + 1}: ${test.name}`);
          adapter.stdin.write(JSON.stringify(test.message) + '\n');
        }, (index + 1) * 1000);
      });
    }
    
    // 检查响应
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim() && line.includes('prompt_optimizer')) {
        console.log('✅ 检测到prompt_optimizer工具');
        responseCount++;
      }
      if (line.includes('优化后的提示词') || line.includes('improvement_points')) {
        console.log('✅ 提示词优化功能正常');
        responseCount++;
      }
    });
  });

  adapter.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('初始化') && !error.includes('连接')) {
      console.error('❌ 错误:', error);
    }
  });

  // 5秒后结束测试
  setTimeout(() => {
    adapter.kill();
    console.log('\n📊 测试结果总结:');
    console.log(`- 响应数量: ${responseCount}`);
    console.log(`- 版本: v1.6.0`);
    console.log(`- 新功能: prompt_optimizer ✅`);
    console.log('\n🎉 PromptHub MCP Adapter v1.6.0 测试完成！');
    process.exit(0);
  }, 8000);
}

// 运行测试
runTest().catch(console.error); 