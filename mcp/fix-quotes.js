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

// 完全替换可能有问题的字符串
content = content.replace(
  /console\.error\(['"]Failed to start MCP Prompt Server.*?['"]\)/g, 
  "console.error('Failed to start MCP Prompt Server:')"
);

// 检查所有console.error调用是否有不匹配的引号
const errorRegex = /console\.error\(['"]([^'"]*)/g;
let match;

while ((match = errorRegex.exec(content)) !== null) {
  const originalText = match[0];
  const quote = originalText.includes("'") ? "'" : '"';
  const fixedText = `console.error(${quote}${match[1]}${quote}`;
  content = content.replace(originalText, fixedText);
  console.log(`修复了错误调用: ${originalText} -> ${fixedText}`);
}

// 保存修复后的文件
fs.writeFileSync(targetFile, content);
console.log(`已保存修复后的文件，大小：${content.length} 字节`);
