#!/usr/bin/env node

import { PromptServer } from './mcp-server.js';
import { validateConfig } from './config.js';

async function main() {
  try {
    // 验证配置
    validateConfig();
    
    // 创建并启动提示词服务器
    const server = new PromptServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
