#!/usr/bin/env node
// 后端API服务器启动脚本 - 重组项目结构后版本

// 设置环境变量，表明这是开发环境
process.env.NODE_ENV = 'development';

// 加载根目录的环境变量
import './load-env.js';

// 导入必要的模块
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('正在启动API服务器...');

// 手动设置端口（避免与自动启动冲突）
process.env.PORT = process.env.PORT || '9010';
const port = parseInt(process.env.PORT, 10);

// 启动API服务器
try {
  // 导入API模块但不自动启动监听
  const apiModule = await import('./dist/api/index.js');
  
  // 显示信息
  console.log(`\n后端API服务准备就绪!`);
  console.log(`运行在端口: ${port}`);
  console.log(`健康检查: http://localhost:${port}/api/health`);
  console.log(`\n可用的API端点:`);
  console.log('- GET  /api/health');
  console.log('- GET  /api/prompts/names');
  console.log('- GET  /api/prompts/:name');
  console.log('- POST /api/prompts');
  console.log('- PUT  /api/prompts/:name');
  console.log('- DELETE /api/prompts/:name');
  console.log('- GET  /api/prompts/search/:query');
  console.log('- GET  /api/template');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/logout');
} catch (error) {
  console.error('启动API服务器失败:', error);
  process.exit(1);
}
