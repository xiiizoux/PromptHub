#!/usr/bin/env node
// 全面修复TypeScript编译问题的脚本 - CommonJS版本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复JS语法问题: ${filePath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return false;
    }
    
    // 读取文件内容
    const originalContent = fs.readFileSync(filePath, 'utf8');
    console.log(`原始文件大小：${originalContent.length} 字节`);
    
    // 创建备份
    const backupPath = `${filePath}.backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 检查原始文件是否存在重复导入
    if (originalContent.includes('import apiKeysRouter from') &&
        originalContent.indexOf('import apiKeysRouter from') !==
        originalContent.lastIndexOf('import apiKeysRouter from')) {
      console.log('检测到重复导入，修复中...');
    }

    // 完全替换文件内容 - 手动修复关键错误
    // 这是为了避免复杂的正则表达式可能会错误替换其他内容
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

    // 保留文件其余部分
    const restOfFile = originalContent.split('import apiKeysRouter from')[1];
    if (restOfFile) {
      fixedContent += 'import apiKeysRouter from' + restOfFile;
    } else {
      // 如果找不到分割点，就保留从第30行开始的内容
      const lines = originalContent.split('\n');
      if (lines.length > 30) {
        fixedContent += '\n' + lines.slice(30).join('\n');
      }
    }
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 打印文件前30行以帮助调试
    const lines = fixedContent.split('\n').slice(0, 30);
    console.log("修复后文件的前30行内容（帮助调试）:");
    lines.forEach((line, i) => {
      console.log(`${i+1}: ${line}`);
    });
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixJsFile();
process.exit(result ? 0 : 1);