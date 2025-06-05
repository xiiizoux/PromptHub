// 修复enum关键字的脚本 - ESM版本
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixEnumInFile() {
  console.log(`尝试修复enum问题: ${filePath}`);
  
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
    
    // 替换enum定义为const对象
    let fixedContent = originalContent.replace(
      /enum\s+ErrorCode\s*{([^}]*)}/s,
      'const ErrorCode = {$1};'
    );
    
    // 再次检查是否有其他enum定义
    fixedContent = fixedContent.replace(/enum\s+(\w+)\s*{([^}]*)}/gs, 'const $1 = {$2};');
    
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
const result = fixEnumInFile();
if (!result) {
  process.exit(1);
} else {
  process.exit(0);
}