#!/usr/bin/env node
// 修复JSON语法错误的专用脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复JSON语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.json-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 读取文件的行
    const lines = originalContent.split('\n');
    let fixedContent = '';
    let inJsonObject = false;
    let braceCount = 0;
    
    // 逐行处理
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 检测进入JSON对象定义
      if (line.includes('res.json({') || line.includes('json({')) {
        inJsonObject = true;
        braceCount++;
      }
      
      // 在JSON对象中
      if (inJsonObject) {
        // 修复错误的JSON属性定义
        if (line.match(/\{\s*[a-zA-Z0-9_]+\s*;/)) {
          console.log(`第${i+1}行检测到JSON语法错误，正在修复...`);
          line = line.replace(/(\{\s*[a-zA-Z0-9_]+)\s*;/, '$1:');
        }
        
        // 修复属性分隔符
        if (line.match(/([a-zA-Z0-9_]+)\s*;(\s*[a-zA-Z0-9_]+)/)) {
          line = line.replace(/([a-zA-Z0-9_]+)\s*;(\s*[a-zA-Z0-9_]+)/g, '$1, $2');
        }
        
        // 修复属性值定义
        if (line.match(/([a-zA-Z0-9_]+)\s*;\s*$/)) {
          line = line.replace(/([a-zA-Z0-9_]+)\s*;\s*$/, '$1');
        }
        
        // 计算大括号
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        // 检测退出JSON对象
        if (braceCount === 0) {
          inJsonObject = false;
        }
      }
      
      // 专门处理第74行附近的错误
      if (i >= 70 && i <= 80) {
        // 对于 res.json({ message; 这样的错误
        line = line.replace(/\{\s*message\s*;/, '{ message:');
        
        // 对于其他可能的格式错误
        line = line.replace(/\{\s*([a-zA-Z0-9_]+)\s*;/g, '{ $1:');
        line = line.replace(/([a-zA-Z0-9_]+)\s*;\s*([a-zA-Z0-9_]+)\s*:/g, '$1, $2:');
      }
      
      // 修复所有TypeScript类型声明问题
      line = line.replace(/\)\s*:\s*(string|number|boolean|any|void)\s*{/, ') {');
      line = line.replace(/\w+\s*:\s*(string|number|boolean|any|void)\s*(,|;|\))/g, '$1$2');
      
      fixedContent += line + '\n';
    }
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 获取70-80行的内容用于调试
    console.log("修复后的70-80行内容（帮助调试）:");
    const debugLines = fixedContent.split('\n').slice(69, 80);
    debugLines.forEach((line, i) => {
      console.log(`${i+70}: ${line}`);
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