#!/usr/bin/env node

import express from 'express';
import { PromptServer } from './mcp-server.js';
import { validateConfig } from './config.js';

export async function startMCPServer() {
  try {
    // 验证配置
    validateConfig();
    
    console.log('正在启动MCP服务器...');
    
    // 创建并启动提示词服务器
    const server = new PromptServer();
    await server.start();
    
    console.log('MCP服务器启动成功');
    return server;
  } catch (error) {
    console.error('启动MCP服务器失败:', error);
    throw error;
  }
}

async function main() {
  try {
    await startMCPServer();
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
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
