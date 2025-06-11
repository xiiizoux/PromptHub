#!/usr/bin/env node
// 专门修复JSON对象语法问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复JSON对象语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-json`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 将内容分割成行
    let lines = originalContent.split('\n');
    
    // 专门修复第79行的问题
    if (lines.length >= 79) {
      console.log(`修复前的第79行内容: ${lines[78]}`);
      
      // 修复 res.json({) 这种格式的错误
      if (lines[78].includes('res.json({)')) {
        lines[78] = lines[78].replace('res.json({)', 'res.json({})');
        console.log(`修复后的第79行内容: ${lines[78]}`);
      }
    }
    
    // 全面修复所有JSON对象语法问题
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 1. 修复 res.json({) 格式
      if (line.includes('res.json({)')) {
        line = line.replace('res.json({)', 'res.json({})');
      }
      
      // 2. 修复 res.json({ 没有闭合的对象
      if (line.includes('res.json({') && !line.includes('}') && !line.trim().endsWith(',')) {
        line = line.replace('res.json({', 'res.json({})');
      }
      
      // 3. 修复 res.json() 括号内的空内容
      if (line.includes('res.json()')) {
        line = line.replace('res.json()', 'res.json({})');
      }
      
      // 4. 修复错误的JSON对象格式
      if (line.includes('{)')) {
        line = line.replace('{)', '{}');
      }
      
      // 5. 修复错误的数组格式
      if (line.includes('[)')) {
        line = line.replace('[)', '[]');
      }
      
      // 6. 修复错误的对象键值对格式
      line = line.replace(/:\s*,/g, ': null,');
      line = line.replace(/:\s*\}/g, ': null}');
      
      // 7. 修复未闭合的对象 - 如果一行以 { 开头并且没有闭合的 }
      if (line.trim().startsWith('{') && !line.includes('}')) {
        line = line + ' }';
      }
      
      // 8. 修复 res.status().json({) 格式
      if (line.includes('.json({)')) {
        line = line.replace('.json({)', '.json({})');
      }
      
      lines[i] = line;
    }
    
    // 将修复后的内容写回文件
    const fixedContent = lines.join('\n');
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixJsFile();
process.exit(result ? 0 : 1);