// 注意: 这是ESM模块版本的修复脚本
import fs from 'fs';

// 目标文件
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 读取文件
const content = fs.readFileSync(filePath, 'utf8');
console.log(`读取文件，大小: ${content.length} 字节`);

// 创建备份
const backupPath = `${filePath}.esm-backup`;
fs.writeFileSync(backupPath, content);
console.log(`已创建备份: ${backupPath}`);

// 删除多余的右大括号
let fixed = content;

// 查找并移除多余的右大括号 (在PromptServerError类定义后)
fixed = fixed.replace(
  /class\s+PromptServerError\s+extends\s+Error\s*\{[\s\S]*?this\.name\s*=\s*['"]PromptServerError['"];\s*}\s*}\s*\n/,
  `class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}

`);

// 写入修复后的内容
fs.writeFileSync(filePath, fixed);
console.log(`已保存修复后的文件: ${filePath}`);

// 查看修复后的内容
const lines = fixed.split('\n').slice(0, 30);
console.log("\n修复后文件的前30行:");
lines.forEach((line, i) => console.log(`${i+1}: ${line}`));