// 为Docker构建创建的专用构建脚本，集成所有修复
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 递归复制目录函数
const copyDirectory = (source, destination) => {
  console.log(`复制目录: ${source} -> ${destination}`);
  // 确保目标目录存在
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // 读取源目录中的所有文件/文件夹
  const items = fs.readdirSync(source);

  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    // 如果是目录，递归复制
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } 
    // 如果是TypeScript文件，转换为JavaScript
    else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      // 简单转换TS为JS (仅用于Docker构建)
      let content = fs.readFileSync(srcPath, 'utf-8');
      
      try {
        // 基础转换：保留字符串完整性
        // 首先检查文件内容字符串引号是否匹配
        const singleQuotes = (content.match(/'/g) || []).length;
        const doubleQuotes = (content.match(/"/g) || []).length;
        
        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
          console.warn(`警告：文件 ${srcPath} 中引号不匹配，尝试保守转换`);  
        }
        
        // 使用更安全的处理来移除TypeScript特性
        content = content
          // 移除类型导入
          .replace(/import\s+type[^;]+;/g, '')
          // 移除类型注解，小心不要破坏字符串
          .replace(/([^'"]):\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+(?=[=,);])/g, '$1')
          // 移除interface实现声明
          .replace(/implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, '')
          // 修复extends+implements
          .replace(/extends\s+[A-Za-z0-9_<>\[\]|&,\s.]+\s+implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, 'extends')
          // 移除接口定义
          .replace(/interface\s+[^{]+\{[^}]+\}/g, '');
      } catch (err) {
        console.warn(`转换文件 ${srcPath} 时出错：${err.message}，将使用原始内容`);  
      }
      
      // 将.ts扩展名改为.js
      const jsFileName = item.replace(/\.tsx?$/, '.js');
      const jsFilePath = path.join(destination, jsFileName);
      
      // 写入转换后的JS文件
      fs.writeFileSync(jsFilePath, content);
    } 
    // 其他文件直接复制
    else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

console.log('开始Docker专用构建过程...');
console.log('复制并转换TS文件到dist目录...');

// 确保dist目录存在
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}

// 检测当前工作目录并根据实际情况运行
const workingDir = process.cwd(); // 获取工作目录
const mcpDir = path.resolve(__dirname, '.');
const runFromRoot = !workingDir.endsWith('/mcp') && !workingDir.endsWith('\\mcp');

// 确定源目录和目标目录的路径
let srcDir, distDir, mcpBaseDir;

if (runFromRoot) {
  // 从项目根目录运行
  mcpBaseDir = './mcp';
  srcDir = './mcp/src';
  distDir = './mcp/dist/src';
} else {
  // 从mcp目录运行
  mcpBaseDir = '.';
  srcDir = './src';
  distDir = './dist/src';
}

console.log(`检测到运行目录: ${__dirname}`);
console.log(`当前工作目录: ${workingDir}`);
console.log(`是否从根目录运行: ${runFromRoot}`);
console.log(`源代码目录: ${srcDir}`);
console.log(`目标目录: ${distDir}`);

// 复制并转换src目录
copyDirectory(srcDir, distDir);

// 创建package.json到dist目录
const pkgPath = path.join(mcpBaseDir, 'package.json');
const distPkgPath = runFromRoot ? './mcp/dist/package.json' : './dist/package.json';
console.log(`读取package.json：${pkgPath}`);
console.log(`写入package.json：${distPkgPath}`);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.type = 'module'; // 确保使用ESM
fs.writeFileSync(distPkgPath, JSON.stringify(pkg, null, 2));

// ============ 集成所有修复逻辑 ============

// 1. 重写主入口文件，解决引号问题
console.log('执行特殊后处理：重写主入口文件...');
const indexPath = runFromRoot ? './mcp/dist/src/index.js' : './dist/src/index.js';
console.log(`处理index文件：${indexPath}`);
if (fs.existsSync(indexPath)) {
  // 直接创建一个全新的index.js，而不是尝试修复现有文件
  const newIndexContent = `
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
  
  fs.writeFileSync(indexPath, newIndexContent);
  console.log(`已完全重写 ${indexPath} 文件，避免引号问题`);
}

// 2. 修复enum语法问题
console.log('执行特殊后处理：修复enum语法问题...');
const mcpServerPath = runFromRoot ? './mcp/dist/src/mcp-server.js' : './dist/src/mcp-server.js';
console.log(`处理mcp-server文件：${mcpServerPath}`);
if (fs.existsSync(mcpServerPath)) {
  const originalContent = fs.readFileSync(mcpServerPath, 'utf8');
  console.log(`原始文件大小：${originalContent.length} 字节`);
  
  // 创建备份
  const backupPath = `${mcpServerPath}.backup`;
  fs.writeFileSync(backupPath, originalContent);
  console.log(`已创建备份文件: ${backupPath}`);
  
  // 修复枚举和重复导入问题
  let fixedContent = `import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { authenticateRequest, optionalAuthMiddleware, publicAccessMiddleware } from './api/auth-middleware.js';

// 错误码枚举 - 改为JavaScript对象
const ErrorCode = {
  InvalidParams: 1,
  MethodNotFound: 2,
  InternalError: 3,
  Unauthorized: 4
};

// 自定义错误类
class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}

import { config } from './config.js';
import { StorageFactory } from './storage/storage-factory.js';
import { Prompt, PromptVersion, StorageAdapter } from './types.js';
import mcpRouter from './api/mcp-router.js';
import apiKeysRouter from './api/api-keys-router.js';`;

  // 保留文件其余部分，但去除已添加的导入
  const importStartPos = originalContent.indexOf('import apiKeysRouter from');
  const restOfFile = originalContent.substring(importStartPos);
  
  if (restOfFile) {
    // 跳过所有的apiKeysRouter导入（我们已经在上面添加过一个了）
    const parts = restOfFile.split('import apiKeysRouter from');
    // 找到最后一段（即最后一个导入后的内容）
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      // 找到分号之后的内容
      const contentAfterImport = lastPart.substring(lastPart.indexOf(';') + 1);
      fixedContent += contentAfterImport;
    }
  } else {
    // 如果找不到分割点，就保留从第30行开始的内容
    const lines = originalContent.split('\n');
    if (lines.length > 30) {
      fixedContent += '\n' + lines.slice(30).join('\n');
    }
  }
  
  // 写入修复后的内容
  fs.writeFileSync(mcpServerPath, fixedContent);
  console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
}

console.log('构建完成！已集成所有修复逻辑');
