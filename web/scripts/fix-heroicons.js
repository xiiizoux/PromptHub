#!/usr/bin/env node

/**
 * 脚本：修复Heroicons v2.x导入问题
 * 
 * 这个脚本会扫描所有前端源代码文件，
 * 将Heroicons v1.x的导入路径更新为v2.x格式，
 * 并修复已更名的图标组件名称。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 需要重命名的图标映射表
const iconRenameMap = {
  'CodeIcon': 'CodeBracketIcon',
  'TerminalIcon': 'CommandLineIcon',
  'SupportIcon': 'QuestionMarkCircleIcon',
  'MailIcon': 'EnvelopeIcon',
  'MenuIcon': 'Bars3Icon',
  'XIcon': 'XMarkIcon',
  'PlusIcon': 'PlusCircleIcon',
  // 添加更多需要重命名的图标...
};

// 源码目录
const srcDir = path.resolve(__dirname, '../src');

// 查找所有JS/TS/TSX文件
const findFiles = (dir) => {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(itemPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
      results.push(itemPath);
    }
  }
  
  return results;
};

// 修复文件中的导入语句
const fixImportStatements = (filePath) => {
  try {
    console.log(`检查文件: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 检查导入语句
    const oldImportRegex = /@heroicons\/react\/(outline|solid)/g;
    if (oldImportRegex.test(content)) {
      content = content.replace(/@heroicons\/react\/outline/g, '@heroicons/react/24/outline');
      content = content.replace(/@heroicons\/react\/solid/g, '@heroicons/react/24/solid');
      modified = true;
      console.log('  修复导入路径');
    }
    
    // 修复已重命名的图标
    for (const [oldName, newName] of Object.entries(iconRenameMap)) {
      const iconRegex = new RegExp(`\\b${oldName}\\b`, 'g');
      if (iconRegex.test(content)) {
        content = content.replace(iconRegex, newName);
        modified = true;
        console.log(`  重命名图标: ${oldName} -> ${newName}`);
      }
    }
    
    // 保存修改后的文件
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  已更新文件: ${filePath}`);
    }
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error);
  }
};

// 主函数
const main = () => {
  console.log('开始修复Heroicons导入问题...');
  const files = findFiles(srcDir);
  console.log(`找到 ${files.length} 个文件需要检查`);
  
  let fixedCount = 0;
  for (const file of files) {
    const beforeContent = fs.readFileSync(file, 'utf8');
    fixImportStatements(file);
    const afterContent = fs.readFileSync(file, 'utf8');
    
    if (beforeContent !== afterContent) {
      fixedCount++;
    }
  }
  
  console.log(`完成! 已修复 ${fixedCount} 个文件`);
  
  // 提示重新启动开发服务器
  if (fixedCount > 0) {
    console.log('\n修复完成，请重新启动前端开发服务器以应用更改:');
    console.log('cd frontend && npm run dev');
  }
};

// 执行主函数
main();
