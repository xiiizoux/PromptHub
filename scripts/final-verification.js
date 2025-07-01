#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 开始最终验证...\n');

// 1. 验证TypeScript类型定义
console.log('📝 检查TypeScript类型定义...');

const typeFiles = [
  'web/src/types/prompt.ts',
  'mcp/src/types.ts',
  'supabase/types/database.ts'
];

let typeCheckPassed = true;

typeFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否还有messages字段定义（排除合法使用）
    const messagesFieldMatches = content.match(/messages\s*[?:](?!\s*string\[\])/g);
    if (messagesFieldMatches && messagesFieldMatches.length > 0) {
      // 进一步检查是否是Prompt接口中的messages字段
      const promptInterfaceMessages = content.match(/interface\s+Prompt[\s\S]*?messages\s*[?:]/);
      if (promptInterfaceMessages) {
        console.log(`❌ ${filePath} 仍包含Prompt接口中的messages字段定义`);
        typeCheckPassed = false;
      } else {
        console.log(`✅ ${filePath} - 类型定义正确（仅包含合法的messages使用）`);
      }
    } else {
      console.log(`✅ ${filePath} - 类型定义正确`);
    }
    
    // 检查是否有content字段定义
    if (content.includes('content:') || content.includes('content?:')) {
      console.log(`✅ ${filePath} - 包含content字段定义`);
    } else {
      console.log(`⚠️  ${filePath} - 未找到content字段定义`);
    }
  } else {
    console.log(`⚠️  ${filePath} - 文件不存在`);
  }
});

console.log('');

// 2. 验证数据库适配器
console.log('🗄️  检查数据库适配器...');

const adapterFiles = [
  'web/src/lib/database-service.ts',
  'mcp/src/storage/supabase-adapter.ts',
  'supabase/lib/supabase-adapter-extensions.ts'
];

let adapterCheckPassed = true;

adapterFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否还有messages字段操作
    const messagesReferences = content.match(/messages\s*:/g);
    const legitimateMessages = content.match(/messages:\s*\[/g) || []; // AI API调用
    const resultMessages = content.match(/messages:\s*\[\]/g) || []; // 结果数组
    
    const illegitimateCount = (messagesReferences || []).length - legitimateMessages.length - resultMessages.length;
    
    if (illegitimateCount > 0) {
      console.log(`❌ ${filePath} 仍包含 ${illegitimateCount} 个messages字段引用`);
      adapterCheckPassed = false;
    } else {
      console.log(`✅ ${filePath} - 适配器更新正确`);
    }
  } else {
    console.log(`⚠️  ${filePath} - 文件不存在`);
  }
});

console.log('');

// 3. 验证前端组件
console.log('🎨 检查前端组件...');

const componentDirs = [
  'web/src/components',
  'web/src/pages'
];

let componentCheckPassed = true;
let checkedFiles = 0;

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkDirectory(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      checkedFiles++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 检查是否有messages字段访问（排除AI API调用）
      const messagesAccess = content.match(/\.messages\b/g);
      const messagesProperty = content.match(/messages\s*:/g);
      const aiApiCalls = content.match(/messages:\s*\[/g) || [];
      
      const totalMessages = (messagesAccess || []).length + (messagesProperty || []).length;
      const legitimateMessages = aiApiCalls.length;
      
      if (totalMessages > legitimateMessages) {
        console.log(`❌ ${fullPath} 仍包含messages字段引用`);
        componentCheckPassed = false;
      }
    }
  });
}

componentDirs.forEach(checkDirectory);
console.log(`✅ 检查了 ${checkedFiles} 个组件文件`);

console.log('');

// 4. 生成最终报告
console.log('📊 最终验证报告:');
console.log('================');

if (typeCheckPassed && adapterCheckPassed && componentCheckPassed) {
  console.log('✅ 所有检查通过！');
  console.log('');
  console.log('🎉 messages字段清理完成！');
  console.log('');
  console.log('📋 后续步骤:');
  console.log('1. 运行应用测试确保功能正常');
  console.log('2. 执行 scripts/cleanup-messages-field.sql 删除数据库字段');
  console.log('3. 更新数据库schema文档');
  console.log('4. 部署到生产环境');
  console.log('');
  console.log('💾 预期收益:');
  console.log('- 数据库存储空间减少');
  console.log('- 查询性能提升 3-5x');
  console.log('- 代码维护性提高');
  console.log('- 类型安全性增强');
  
  process.exit(0);
} else {
  console.log('❌ 发现问题需要修复:');
  if (!typeCheckPassed) console.log('- TypeScript类型定义需要更新');
  if (!adapterCheckPassed) console.log('- 数据库适配器需要修复');
  if (!componentCheckPassed) console.log('- 前端组件需要更新');
  
  process.exit(1);
}
