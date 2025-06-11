#!/usr/bin/env node
// 专门修复函数返回类型注解的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复函数返回类型注解问题: ${filePath}`);
  
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
    
    // 修复函数返回类型注解 - 匹配所有可能的模式
    let fixedContent = originalContent;
    
    // 1. 最具体的模式：getAuthValue函数
    fixedContent = fixedContent.replace(
      /function\s+getAuthValue\s*\(\s*request\s*,\s*key\s*\)\s*:\s*string\s*{/g,
      "function getAuthValue(request, key) {"
    );
    
    // 2. 通用模式：所有函数的返回类型注解
    fixedContent = fixedContent.replace(
      /function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*{/g,
      "function $1($2) {"
    );
    
    // 3. 箭头函数的返回类型注解
    fixedContent = fixedContent.replace(
      /\)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*=>/g,
      ") =>"
    );
    
    // 4. 方法定义的返回类型注解
    fixedContent = fixedContent.replace(
      /([a-zA-Z0-9_]+)\s*\([^)]*\)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*{/g,
      "$1($2) {"
    );
    
    // 5. 异步函数的返回类型注解
    fixedContent = fixedContent.replace(
      /async\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*{/g,
      "async function $1($2) {"
    );
    
    // 6. 异步方法的返回类型注解
    fixedContent = fixedContent.replace(
      /async\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*{/g,
      "async $1($2) {"
    );
    
    // 7. 参数类型注解
    fixedContent = fixedContent.replace(/([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)(\s*[,)])/g, "$1$3");
    
    // 8. 变量类型注解
    fixedContent = fixedContent.replace(/(\bconst|\blet|\bvar)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>[\]{}|&]+)\s*=/g, "$1 $2 =");
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 检查是否成功修复
    const hasTypeError = fixedContent.includes('function getAuthValue(request, key): string');
    if (hasTypeError) {
      console.log("警告：仍然存在TypeScript类型声明！");
      
      // 如果仍然存在问题，使用更直接的字符串替换
      const problemString = 'function getAuthValue(request, key): string {';
      const fixedString = 'function getAuthValue(request, key) {';
      
      if (fixedContent.includes(problemString)) {
        fixedContent = fixedContent.replace(problemString, fixedString);
        fs.writeFileSync(filePath, fixedContent);
        console.log("已应用最终修复，强制替换类型声明语法");
      }
    }
    
    // 打印修复后的getAuthValue函数部分
    const getAuthValueIndex = fixedContent.indexOf('function getAuthValue');
    if (getAuthValueIndex > -1) {
      const contextStart = Math.max(0, getAuthValueIndex - 10);
      const contextEnd = Math.min(fixedContent.length, getAuthValueIndex + 100);
      const contextContent = fixedContent.substring(contextStart, contextEnd);
      console.log("修复后的getAuthValue函数（帮助调试）:");
      console.log(contextContent);
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