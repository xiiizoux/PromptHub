#!/usr/bin/env node
// 修复Docker容器中重复导入的问题
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复重复导入问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.bak`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 检查是否存在重复导入
    const hasDoubleImport = originalContent.includes('import apiKeysRouter from') && 
                           originalContent.indexOf('import apiKeysRouter from') !== 
                           originalContent.lastIndexOf('import apiKeysRouter from');
    
    if (hasDoubleImport) {
      console.log('检测到重复导入，正在修复...');
      
      // 修复重复导入问题
      let fixedContent = originalContent.replace(
        /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g, 
        "import apiKeysRouter from './api/api-keys-router.js';"
      );
      
      // 写入修复后的内容
      fs.writeFileSync(filePath, fixedContent);
      console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
      
      // 打印文件部分内容以帮助调试
      const importLine = fixedContent.indexOf('import apiKeysRouter from');
      const startLine = Math.max(0, importLine - 5);
      const endLine = Math.min(fixedContent.length, importLine + 15);
      const debugContent = fixedContent.substring(startLine, endLine);
      console.log("修复后的相关部分内容（帮助调试）:");
      console.log(debugContent);
      
      return true;
    } else {
      console.log('未检测到重复导入问题，文件看起来没有问题');
      return true;
    }
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixJsFile();
process.exit(result ? 0 : 1);