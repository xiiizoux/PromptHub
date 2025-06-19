#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 递归搜索目录
function searchFormFields(dir) {
  const files = fs.readdirSync(dir);
  const issues = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      issues.push(...searchFormFields(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      // 查找input元素
      lines.forEach((line, index) => {
        if (line.includes('<input') && !line.includes('id=') && !line.includes('name=')) {
          issues.push({
            file: fullPath,
            line: index + 1,
            type: 'input-no-id-name',
            content: line.trim()
          });
        }
        
        if (line.includes('<textarea') && !line.includes('id=') && !line.includes('name=')) {
          issues.push({
            file: fullPath,
            line: index + 1,
            type: 'textarea-no-id-name',
            content: line.trim()
          });
        }

        if (line.includes('<select') && !line.includes('id=') && !line.includes('name=')) {
          issues.push({
            file: fullPath,
            line: index + 1,
            type: 'select-no-id-name',
            content: line.trim()
          });
        }
      });
    }
  }

  return issues;
}

// 运行搜索
const issues = searchFormFields('./web/src');
console.log('找到的问题：');
issues.forEach(issue => {
  console.log(`${issue.file}:${issue.line} [${issue.type}] ${issue.content}`);
});

console.log(`\n总计找到 ${issues.length} 个问题`); 