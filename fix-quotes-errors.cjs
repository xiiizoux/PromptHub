#!/usr/bin/env node
// 专门修复引号错误的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复引号错误问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-quotes`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 修复引号错误
    let fixedContent = originalContent;
    
    // 1. 修复特定的错误：console.error('获取标签失败');'
    fixedContent = fixedContent.replace(/console\.error\(['"]获取标签失败['"]\);[']/g, "console.error('获取标签失败');");
    
    // 2. 修复所有可能的引号错误
    // 2.1 修复连续单引号
    fixedContent = fixedContent.replace(/';'/g, ";");
    
    // 2.2 修复连续双引号
    fixedContent = fixedContent.replace(/";"/, ";");
    
    // 2.3 修复引号后面跟引号的模式
    fixedContent = fixedContent.replace(/(['"])\);(['"])/g, "$1);");
    
    // 2.4 修复所有引号不匹配的情况
    let lines = fixedContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const singleQuoteCount = (line.match(/'/g) || []).length;
      const doubleQuoteCount = (line.match(/"/g) || []).length;
      
      // 如果单引号数量为奇数，检查是否是错误引号
      if (singleQuoteCount % 2 !== 0) {
        // 检查行末是否有额外的单引号
        if (line.trimEnd().endsWith("'") && line.trimEnd().endsWith("');")) {
          lines[i] = line.substring(0, line.lastIndexOf("'"));
          console.log(`在第 ${i+1} 行修复了多余的单引号`);
        }
      }
      
      // 如果双引号数量为奇数，检查是否是错误引号
      if (doubleQuoteCount % 2 !== 0) {
        // 检查行末是否有额外的双引号
        if (line.trimEnd().endsWith("\"") && line.trimEnd().endsWith("\");")) {
          lines[i] = line.substring(0, line.lastIndexOf("\""));
          console.log(`在第 ${i+1} 行修复了多余的双引号`);
        }
      }
    }
    fixedContent = lines.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 检查第103行是否存在
    const fileLines = fixedContent.split('\n');
    if (fileLines.length >= 103) {
      console.log(`修复后的第103行内容：${fileLines[102]}`);
    }
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixJsFile();
process.exit(result ? 0 : 1);