#!/usr/bin/env node
// 修复构造函数语法错误的脚本
const fs = require('fs');
const path = require('path');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

function fixConstructorSyntax() {
  console.log(`尝试修复构造函数语法错误: ${filePath}`);
  
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
    const backupPath = `${filePath}.syntax-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 修复构造函数语法错误
    let fixedContent = originalContent;
    
    // 1. 修复已知的构造函数语法错误
    fixedContent = fixedContent.replace(
      /constructor\(message,\s*code;/g,
      'constructor(message, code)'
    );
    
    // 2. 更通用的修复方式 - 修复所有构造函数定义中可能的语法错误
    fixedContent = fixedContent.replace(
      /constructor\s*\(([^)]*?);/g,
      'constructor($1)'
    );
    
    // 3. 修复自定义错误类实现
    fixedContent = fixedContent.replace(
      /class\s+PromptServerError\s+extends\s+Error\s*{[\s\S]*?constructor\([^)]*\)[^}]*}/g,
      `class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}`
    );
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixConstructorSyntax();
process.exit(result ? 0 : 1);