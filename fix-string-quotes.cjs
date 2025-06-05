#!/usr/bin/env node
// 修复未闭合字符串问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复未闭合字符串问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.quotes-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 读取文件的行
    const lines = originalContent.split('\n');
    let fixedLines = [];
    
    // 逐行处理
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 特殊处理第92行问题
      if (i === 91 && line.includes("console.error('获取分类失败;")) {
        line = line.replace("console.error('获取分类失败;", "console.error('获取分类失败:'");
      }
      
      // 检查所有未闭合的单引号字符串
      const singleQuotes = (line.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0 && singleQuotes > 0) {
        console.log(`第${i+1}行检测到未闭合的单引号，修复中...`);
        
        // 如果以单引号开头但未结束
        if (line.indexOf("'") !== -1 && line.lastIndexOf("'") === line.indexOf("'")) {
          line = line + "'";
        }
        
        // 处理console.error, console.log等情况
        if (line.includes('console.error(') || line.includes('console.log(')) {
          if (line.includes("console.error('") && !line.includes("');")) {
            line = line.replace(/console\.error\('([^']*);/, "console.error('$1');");
          }
          if (line.includes("console.log('") && !line.includes("');")) {
            line = line.replace(/console\.log\('([^']*);/, "console.log('$1');");
          }
        }
      }
      
      // 检查所有未闭合的双引号字符串
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (doubleQuotes % 2 !== 0 && doubleQuotes > 0) {
        console.log(`第${i+1}行检测到未闭合的双引号，修复中...`);
        
        // 如果以双引号开头但未结束
        if (line.indexOf('"') !== -1 && line.lastIndexOf('"') === line.indexOf('"')) {
          line = line + '"';
        }
      }
      
      // 修复所有文本字符串中的错误
      // 修复 '获取分类失败; 这样的错误
      line = line.replace(/console\.error\('获取分类失败;/, "console.error('获取分类失败:')");
      line = line.replace(/console\.error\('获取标签失败;/, "console.error('获取标签失败:')");
      
      // 修复所有控制台日志字符串
      line = line.replace(/console\.(log|error|warn|info)\('([^']*)(?=[^']$)/, "console.$1('$2')");
      
      // 修复所有res.status().json调用中的未闭合字符串
      line = line.replace(/res\.status\(\d+\)\.json\(\{\s*error:\s*'([^']*)(?=[^']$)/, "res.status($1).json({ error: '$2' })");
      
      fixedLines.push(line);
    }
    
    const fixedContent = fixedLines.join('\n');
    
    // 特殊修复第92行周围
    let finalContent = fixedContent.replace(
      /console\.error\('获取分类失败;(?:\n|.)*?res\.status\(500\)\.json\(\{ error: '获取分类失败' \}\);/g,
      "console.error('获取分类失败:', error);\n        res.status(500).json({ error: '获取分类失败' });"
    );
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, finalContent);
    console.log(`已保存修复后的文件，大小：${finalContent.length} 字节`);
    
    // 打印第90-100行以检查修复结果
    console.log("\n第90-100行内容（帮助调试）:");
    const debugLines = finalContent.split('\n').slice(89, 100);
    debugLines.forEach((line, i) => {
      console.log(`${i+90}: ${line}`);
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