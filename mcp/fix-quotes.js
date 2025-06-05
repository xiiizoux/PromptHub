#!/usr/bin/env node

/**
 * 修复Docker编译后的JavaScript文件中的引号问题
 * 这个脚本作为启动前的预处理步骤运行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录（ES模块不能直接使用__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 要修复的主文件
const targetFile = path.resolve(__dirname, 'dist/src/index.js');

console.log(`尝试修复引号问题: ${targetFile}`);

if (!fs.existsSync(targetFile)) {
  console.error(`错误：文件不存在 ${targetFile}`);
  process.exit(1);
}

// 读取文件内容
let content = fs.readFileSync(targetFile, 'utf8');
console.log(`原始文件大小：${content.length} 字节`);

// 创建备份文件
const backupFile = targetFile + '.backup';
fs.writeFileSync(backupFile, content);
console.log(`已创建备份文件: ${backupFile}`);

// 完全重写文件内容，而不是尝试修复
// 这是最彻底的解决方案
content = `
import { startMCPServer } from './mcp-server.js';

// 主函数
async function main() {
  try {
    await startMCPServer();
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 启动主函数
main();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 处理SIGINT信号（Ctrl+C）
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// 处理SIGTERM信号
process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
`;

console.log('已完全重写文件内容，修复了所有引号问题');

// 保存修复后的文件
fs.writeFileSync(targetFile, content);
console.log(`已保存修复后的文件，大小：${content.length} 字节`);
