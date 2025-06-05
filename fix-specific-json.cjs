#!/usr/bin/env node
// 针对特定JSON对象语法错误的修复脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试精确修复特定JSON语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.specific-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 直接替换具体问题行
    let fixedContent = originalContent.replace(
      /res\.json\(\{\s*message:\s*\n\s*\}\);/g, 
      'res.json({ message: "Welcome to Prompt Server API" });\n'
    );
    
    // 修复第一个特定的JSON对象问题 (第74行问题)
    fixedContent = fixedContent.replace(
      /res\.json\(\{\s*message:\s*(\n\s*\}\);|\s*$)/g,
      'res.json({ message: "Welcome to Prompt Server API" });\n'
    );
    
    // 修复第二个特定问题：health端点中的JSON语法
    fixedContent = fixedContent.replace(
      /res\.json\(\{\s*\n\s*status,\s*\n/g,
      'res.json({\n        status: "healthy",\n'
    );
    
    // 对所有不完整的JSON对象进行检查和修复
    const lines = fixedContent.split('\n');
    let newContent = [];
    let openBraces = 0;
    let inResJson = false;
    let resJsonStartLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 检测res.json调用的开始
      if (line.includes('res.json({') && !line.includes('});')) {
        inResJson = true;
        resJsonStartLine = i;
        openBraces = (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
      } 
      // 在res.json内部统计括号
      else if (inResJson) {
        openBraces += (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
        
        // 如果括号已关闭但没有结束语句
        if (openBraces === 0 && !line.includes('});')) {
          line = line.replace(/\}\s*$/, '});');
          inResJson = false;
        }
        // 如果行结束但JSON对象未关闭
        else if (openBraces > 0 && i === lines.length - 1) {
          line += ' });';
          inResJson = false;
        }
      }
      
      // 修复不完整的键值对
      if (line.match(/:\s*$/)) {
        // 如果键后面没有值，添加空字符串
        if (i === lines.length - 1 || !lines[i+1].trim().startsWith('"')) {
          line = line + ' "",';
        }
      }
      
      // 特殊处理第74行问题
      if (i === 73 && line.includes('message:') && !line.includes('}')) {
        line = '      res.json({ message: "Welcome to Prompt Server API" });';
      }
      
      newContent.push(line);
    }
    
    fixedContent = newContent.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 打印关键行 (问题区域周围的内容)
    console.log("\n第70-80行内容（帮助调试）:");
    for (let i = 69; i < 80 && i < newContent.length; i++) {
      console.log(`${i+1}: ${newContent[i]}`);
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