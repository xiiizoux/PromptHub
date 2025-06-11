#!/usr/bin/env node
// 专门修复对象属性引号问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复对象属性引号问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-objects`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 修复对象属性引号问题
    let fixedContent = originalContent;
    
    // 1. 修复未闭合的路径字符串
    fixedContent = fixedContent.replace(/path:\s*['"]\/api\/prompts\/,/g, "path: '/api/prompts/',");
    
    // 2. 修复带中文的description属性
    // 替换所有不正确的description属性格式
    fixedContent = fixedContent.replace(/description:\s*['"]([^'"]*)['"]\s*([^,}])/g, "description: '$1'$2");
    
    // 3. 专门修复第119行的问题
    const line119Pattern = /{[\s]*path:[\s]*['"]\/api\/prompts\/,[\s]*method,[\s]*description:[\s]*['"]获取特定提示词详情['"]\s*},/g;
    fixedContent = fixedContent.replace(line119Pattern, "{ path: '/api/prompts/', method, description: '获取特定提示词详情' },");
    
    // 4. 全面处理对象属性
    // 4.1 修复所有对象属性中未闭合的字符串
    let lines = fixedContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // 对每一行单独处理
      let line = lines[i];
      
      // 如果这行包含对象属性定义
      if (line.includes(':') && (line.includes('{') || line.includes(','))) {
        // 检查路径属性
        if (line.includes('path:')) {
          line = line.replace(/path:\s*['"]([^'"]*?)(?=[,}]|$)/g, "path: '$1'");
        }
        
        // 检查描述属性
        if (line.includes('description:')) {
          line = line.replace(/description:\s*['"]([^'"]*?)(?=[,}]|$)/g, "description: '$1'");
        }
        
        // 检查方法属性
        if (line.includes('method:')) {
          line = line.replace(/method:\s*['"]([^'"]*?)(?=[,}]|$)/g, "method: '$1'");
        }
        
        // 检查任何其他属性
        line = line.replace(/(\w+):\s*['"]([^'"]*?)(?=[,}]|$)/g, "$1: '$2'");
      }
      
      lines[i] = line;
    }
    
    // 5. 特殊处理中文字符串
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 如果行中包含中文字符
      if (/[\u4e00-\u9fa5]/.test(line)) {
        // 确保所有中文周围都有适当的引号
        lines[i] = line.replace(/:\s*([\u4e00-\u9fa5][^,}]*?)(?=[,}]|$)/g, ": '$1'");
      }
    }
    
    fixedContent = lines.join('\n');
    
    // 6. 全面清理双引号内的单引号和单引号内的双引号
    fixedContent = fixedContent.replace(/"([^"]*)'([^"']*)'/g, "\"$1\\\'$2\\\'\"");
    fixedContent = fixedContent.replace(/'([^']*)"([^"']*)"/g, "'$1\\\"$2\\\"'");
    
    // 7. 修复第119行及其周围内容
    const lineIndex = 118; // 0-based index for line 119
    if (lines.length > lineIndex) {
      const problematicLine = lines[lineIndex];
      console.log(`修复前的第119行内容: ${problematicLine}`);
      
      // 直接替换为正确的格式
      lines[lineIndex] = "    { path: '/api/prompts/', method: 'GET', description: '获取特定提示词详情' },";
      console.log(`修复后的第119行内容: ${lines[lineIndex]}`);
      
      fixedContent = lines.join('\n');
    }
    
    // 写入修复后的内容
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