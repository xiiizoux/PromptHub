#!/usr/bin/env node
// 专门修复路由引号问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复路由引号问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-route-quotes`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 查找和修复145行的问题
    let lines = originalContent.split('\n');
    
    // 专门修复第145行的问题
    if (lines.length >= 145) {
      console.log(`修复前的第145行内容: ${lines[144]}`);
      
      // 修复 this.app.get('/api/prompts/search', (req, res) => {' 这种格式的问题
      if (lines[144].includes("this.app.get") && lines[144].includes("(req, res) => {'")) {
        lines[144] = lines[144].replace("(req, res) => {'", "(req, res) => {");
        console.log(`修复后的第145行内容: ${lines[144]}`);
      }
    }
    
    // 全面检查和修复所有Express路由处理函数的引号问题
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 1. 修复路由处理函数中多余的引号
      if (line.includes("this.app.") && line.includes("=>") && line.includes("'")) {
        // 检查并修复 (req, res) => {' 模式
        lines[i] = line.replace(/\(req,\s*res\)\s*=>\s*{'/g, "(req, res) => {");
        lines[i] = line.replace(/\(request,\s*response\)\s*=>\s*{'/g, "(request, response) => {");
        
        // 检查并修复 (req, res) => '{' 模式
        lines[i] = line.replace(/\(req,\s*res\)\s*=>\s*'{'/g, "(req, res) => {");
        lines[i] = line.replace(/\(request,\s*response\)\s*=>\s*'{'/g, "(request, response) => {");
      }
      
      // 2. 修复路由路径和处理函数中间的引号问题
      if (line.includes("this.app.") && line.includes("get(") && line.includes("'")) {
        // 检查引号配对情况
        const singleQuoteCount = (line.match(/'/g) || []).length;
        const doubleQuoteCount = (line.match(/"/g) || []).length;
        
        if (singleQuoteCount % 2 !== 0) {
          // 如果单引号数量为奇数，尝试修复
          // 查找路由路径和处理函数之间可能出现问题的部分
          const fixedLine = line.replace(/(['"])([^'"]+)(['"])[,]?\s*\(/g, "$1$2$1, (");
          if (fixedLine !== line) {
            lines[i] = fixedLine;
          }
        }
      }
    }
    
    // 将修复后的内容写回文件
    const fixedContent = lines.join('\n');
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 手动检查已知问题区域
    const problemText = "this.app.get('/api/prompts/search', (req, res) => {'";
    if (fixedContent.includes(problemText)) {
      console.log("警告：仍然存在路由引号问题！");
      // 使用完全替换方法
      const finalContent = fixedContent.replace(
        problemText,
        "this.app.get('/api/prompts/search', (req, res) => {"
      );
      fs.writeFileSync(filePath, finalContent);
      console.log("已应用强制替换方法");
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