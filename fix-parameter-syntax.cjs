#!/usr/bin/env node
// 专门修复括号匹配和参数语法问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复括号匹配和参数语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-params`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 将内容分割成行
    let lines = originalContent.split('\n');
    
    // 专门修复第149行的问题
    if (lines.length >= 149) {
      console.log(`修复前的第149行内容: ${lines[148]}`);
      
      // 修复 throw new PromptServerError("Missing required parameter" 缺少右括号的问题
      if (lines[148].includes('throw new PromptServerError("Missing required parameter"')) {
        lines[148] = lines[148].replace(
          'throw new PromptServerError("Missing required parameter"', 
          'throw new PromptServerError("Missing required parameter", ErrorCode.InvalidParams)'
        );
        console.log(`修复后的第149行内容: ${lines[148]}`);
      }
    }
    
    // 全面检查所有行中的括号匹配问题
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 1. 修复 PromptServerError 构造函数调用
      if (line.includes('PromptServerError(') && !line.includes(', ErrorCode.')) {
        // 如果是错误构造函数但缺少错误码参数
        if (line.match(/PromptServerError\(["'][^"']*["']\s*\)/)) {
          line = line.replace(
            /PromptServerError\(["']([^"']*)["']\s*\)/g, 
            'PromptServerError("$1", ErrorCode.InvalidParams)'
          );
        }
        // 如果只有开始括号没有结束括号
        else if (line.match(/PromptServerError\(["'][^"']*["']\s*$/)) {
          line = line.replace(
            /PromptServerError\(["']([^"']*)["']\s*$/g, 
            'PromptServerError("$1", ErrorCode.InvalidParams)'
          );
        }
      }
      
      // 2. 修复可能存在的缺少右括号的函数调用
      if ((line.includes('(') && !line.includes(')')) || 
          (line.match(/\(/g) || []).length > (line.match(/\)/g) || []).length) {
        
        // 如果是 throw new PromptServerError 且缺少右括号
        if (line.includes('throw new PromptServerError(')) {
          if (!line.endsWith(')')) {
            line = line + ')';
          }
        }
        
        // 如果是 res.json( 且缺少右括号
        if (line.includes('res.json(') && !line.includes(')')) {
          line = line + ')';
        }
        
        // 如果是 res.status( 且缺少右括号
        if (line.includes('res.status(') && !line.includes(')')) {
          if (line.includes('.json(') && !line.endsWith(')')) {
            line = line + ')';
          } else if (!line.includes('.json(')) {
            line = line + ')';
          }
        }
      }
      
      // 3. 修复特定行的问题
      // 如果是第149行且仍然有问题
      if (i === 148 && line.includes('throw new PromptServerError("Missing required parameter"')) {
        line = 'throw new PromptServerError("Missing required parameter", ErrorCode.InvalidParams);';
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