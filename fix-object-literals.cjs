#!/usr/bin/env node
// 专门修复对象字面量语法问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试修复对象字面量语法问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.backup-object-literals`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 将内容分割成行
    let lines = originalContent.split('\n');
    
    // 查找第112行附近的问题
    if (lines.length >= 112) {
      console.log(`修复前的第112行内容: ${lines[111]}`);
      
      // 如果endpoints: [在第112行出现，可能是对象字面量语法错误
      if (lines[111].trim() === 'endpoints: [') {
        // 往前查找可能的上下文
        let contextStart = 111;
        while (contextStart > 0) {
          contextStart--;
          if (lines[contextStart].includes('{')) {
            break;
          }
        }
        
        // 往后查找可能的上下文
        let contextEnd = 111;
        while (contextEnd < lines.length - 1) {
          contextEnd++;
          if (lines[contextEnd].includes(']')) {
            break;
          }
        }
        
        // 输出上下文帮助调试
        console.log("问题区域上下文:");
        for (let i = Math.max(0, contextStart - 3); i <= Math.min(lines.length - 1, contextEnd + 3); i++) {
          console.log(`${i+1}: ${lines[i]}`);
        }
        
        // 修复可能的情况：endpoints不在对象字面量内
        if (!lines[contextStart].includes('{')) {
          // 前面添加对象字面量的开始
          lines[111] = `const endpointsConfig = {
  endpoints: [`;
          
          // 找到数组结尾
          let arrayEnd = 111;
          while (arrayEnd < lines.length - 1) {
            arrayEnd++;
            if (lines[arrayEnd].trim() === ']') {
              // 在数组结尾添加对象字面量的结束
              lines[arrayEnd] = `]
};`;
              break;
            }
          }
        }
        // 如果已经在对象字面量内，但可能是语法错误
        else {
          // 检查前面的行是否有逗号或开始符号
          if (!lines[110].trim().endsWith(',') && !lines[110].trim().endsWith('{')) {
            lines[110] = lines[110] + ',';
          }
        }
      }
    }
    
    // 全面检查对象字面量语法问题
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // 如果行以属性名和冒号开始，但不在对象字面量内
      if (/^\w+\s*:/.test(line) && !line.includes('function') && !line.includes('=>')) {
        // 往前查找是否有对象字面量开始符
        let foundObjectStart = false;
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (lines[j].includes('{')) {
            foundObjectStart = true;
            break;
          }
        }
        
        // 如果没有找到对象字面量开始符，可能是错误的属性定义
        if (!foundObjectStart) {
          // 将属性转换为变量定义
          const propertyName = line.split(':')[0].trim();
          lines[i] = `const ${propertyName} = ${line.split(':').slice(1).join(':').trim()}`;
        }
      }
      
      // 直接替换112行附近的endpoints定义
      if (i === 111 && line === 'endpoints: [') {
        // 检查前后上下文
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
        
        // 如果不是有效的对象属性上下文，重写为一个有效的对象
        if (!prevLine.endsWith('{') && !prevLine.endsWith(',')) {
          lines[i] = 'const apiEndpoints = {';
          lines.splice(i+1, 0, '  endpoints: [');
          // 继续查找数组的结束位置
          let arrayEnd = i + 2;
          while (arrayEnd < lines.length) {
            if (lines[arrayEnd].trim() === ']') {
              lines[arrayEnd] = '  ]';
              lines.splice(arrayEnd + 1, 0, '};');
              break;
            }
            arrayEnd++;
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