#!/usr/bin/env node

// CommonJS入口点，用于加载ES模块
async function main() {
  try {
    // 动态加载ES模块
    const { PromptServer } = await import('./dist/src/mcp-server.js');
    
    // 创建并启动服务器
    const server = new PromptServer();
    await server.start();
    
    console.log('MCP Prompt Server started successfully');
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 运行主函数
main();
