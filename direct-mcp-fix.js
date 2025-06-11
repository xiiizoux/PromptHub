const fs = require('fs');

// 目标文件
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 读取文件
const content = fs.readFileSync(filePath, 'utf8');
console.log(`读取文件，大小: ${content.length} 字节`);

// 创建备份
const backupPath = `${filePath}.direct-backup`;
fs.writeFileSync(backupPath, content);
console.log(`已创建备份: ${backupPath}`);

// 完全重写错误类定义部分
// 使用更精确的方式识别并替换错误类
const errorClassPattern = /class\s+PromptServerError\s+extends\s+Error\s*\{[\s\S]*?constructor[\s\S]*?\}/;
const fixedErrorClass = `
// 自定义错误类
class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}`;

let fixed = content;

// 替换错误类定义
if (errorClassPattern.test(content)) {
  fixed = content.replace(errorClassPattern, fixedErrorClass);
  console.log('已替换错误类定义');
} else {
  // 如果模式匹配失败，尝试更简单的方法
  console.log('未找到匹配的错误类定义，尝试直接替换...');
  
  // 查找导入声明后的位置
  const importEnd = content.lastIndexOf('import');
  if (importEnd > 0) {
    // 找到该导入行的结束位置
    const nextSemicolon = content.indexOf(';', importEnd);
    if (nextSemicolon > 0) {
      // 在最后一个导入后插入新的错误类定义
      fixed = content.substring(0, nextSemicolon + 1) + 
              fixedErrorClass + 
              content.substring(nextSemicolon + 1);
      console.log('已在导入声明后插入新的错误类定义');
    }
  }
}

// 写入修复后的内容
fs.writeFileSync(filePath, fixed);
console.log(`已保存修复后的文件: ${filePath}`);

// 查看修复后的内容
const lines = fixed.split('\n').slice(0, 30);
console.log("\n修复后文件的前30行:");
lines.forEach((line, i) => console.log(`${i+1}: ${line}`));
