#!/usr/bin/env node
// 专门修复Express路由处理函数语法问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复路由处理函数语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-routes`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 修复路由处理函数语法问题
    let lines = originalContent.split('\n');
    
    // 专门修复第145行的问题
    if (lines.length >= 145) {
      console.log(`修复前的第145行内容: ${lines[144]}`);
      
      // 修复 '/api/prompts/search/=> {' 这种格式的路由
      if (lines[144].includes("'/api/prompts/search/=>")) {
        lines[144] = lines[144].replace("'/api/prompts/search/=> {", "'/api/prompts/search', (req, res) => {");
        console.log(`修复后的第145行内容: ${lines[144]}`);
      }
    }
    
    // 全面修复所有的路由处理函数语法问题
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 1. 修复 'route/=>{'  格式的错误
      if (line.includes("=>") && line.includes("get(") && !line.includes("req, res")) {
        lines[i] = line.replace(/(['"])([^'"]*?)\/=>(\s*){/g, "$1$2', (req, res) =>$3{");
      }
      
      // 2. 修复 'route/ => {'  格式的错误（带空格）
      if (line.includes(" =>") && line.includes("get(") && !line.includes("req, res")) {
        lines[i] = line.replace(/(['"])([^'"]*?)\/\s*=>\s*{/g, "$1$2', (req, res) => {");
      }
      
      // 3. 修复特殊格式的路由
      if (line.includes("app.get") || line.includes("app.post") || line.includes("app.put") || line.includes("app.delete")) {
        // 检查是否缺少参数
        if (line.includes("=>") && !line.includes("req") && !line.includes("res")) {
          lines[i] = line.replace(/=>\s*{/g, "(req, res) => {");
        }
        
        // 修复路径和处理函数之间的分隔符
        lines[i] = lines[i].replace(/(['"])([^'"]*?)[\/,]\s*=>/g, "$1$2', =>");
        
        // 修复特殊的路由格式
        lines[i] = lines[i].replace(/(['"]\S+['"])\s*=>/g, "$1, (req, res) =>");
      }
    }
    
    // 特别检查Express路由格式
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 查找所有Express路由定义行
      if ((line.startsWith("this.app.get(") || 
           line.startsWith("this.app.post(") || 
           line.startsWith("this.app.put(") || 
           line.startsWith("this.app.delete(")) && 
           line.includes("=>")) {
        
        // 检查是否是错误的格式
        if (!line.includes("req, res") && !line.includes("request, response")) {
          // 分析行内容
          const httpMethod = line.includes("get(") ? "get" : 
                            line.includes("post(") ? "post" : 
                            line.includes("put(") ? "put" : "delete";
                            
          const routePattern = /['"]([^'"]*)['"]/;
          const routeMatch = line.match(routePattern);
          
          if (routeMatch) {
            const route = routeMatch[1];
            // 重新格式化完整的路由定义
            const fixedLine = `this.app.${httpMethod}('${route}', (req, res) => {`;
            lines[i] = lines[i].replace(/this\.app\.\w+\([^{]*/, fixedLine);
          }
        }
      }
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