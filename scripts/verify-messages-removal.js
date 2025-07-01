#!/usr/bin/env node

/**
 * 验证脚本：确认所有messages字段引用都已从代码库中删除
 */

const fs = require('fs');
const path = require('path');

// 需要检查的目录
const checkDirectories = [
  'web/src',
  'mcp/src',
  'supabase/lib',
  'prompthub-mcp-adapter'
];

// 需要检查的文件扩展名
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// 排除的目录
const excludeDirectories = ['node_modules', '.git', 'dist', 'build', '.next'];

// 搜索模式
const searchPatterns = [
  /messages\s*:/,           // messages: 
  /\.messages\b/,           // .messages
  /\bmessages\s*\?/,        // messages?
  /\bmessages\s*\[/,        // messages[
  /prompt\.messages/,       // prompt.messages
  /\bmessages\s*\)/,        // messages)
  /\bmessages\s*,/,         // messages,
  /\bmessages\s*}/,         // messages}
  /\bmessages\s*\]/,        // messages]
  /\bmessages\s*\|\|/,      // messages||
  /\bmessages\s*&&/,        // messages&&
  /typeof.*messages/,       // typeof messages
  /Array\.isArray.*messages/, // Array.isArray(messages)
];

function shouldExcludeDirectory(dirPath) {
  return excludeDirectories.some(exclude => dirPath.includes(exclude));
}

function shouldCheckFile(filePath) {
  return fileExtensions.some(ext => filePath.endsWith(ext));
}

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      searchPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // 排除注释行
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*') && !trimmedLine.startsWith('/*')) {
            // 排除合法的messages使用场景
            const isLegitimate =
              // AI API调用的messages参数
              trimmedLine.includes('messages: [') ||
              // 导入函数返回结果中的messages数组
              trimmedLine.includes('messages: [] as string[]') ||
              trimmedLine.includes('result.messages.push') ||
              trimmedLine.includes('messages: string[]') ||
              trimmedLine.includes('messages: []');

            if (!isLegitimate) {
              matches.push({
                line: index + 1,
                content: line.trim(),
                pattern: pattern.toString()
              });
            }
          }
        }
      });
    });

    return matches;
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return [];
  }
}

function searchInDirectory(dirPath) {
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (!shouldExcludeDirectory(itemPath)) {
          results.push(...searchInDirectory(itemPath));
        }
      } else if (stat.isFile() && shouldCheckFile(itemPath)) {
        const matches = searchInFile(itemPath);
        if (matches.length > 0) {
          results.push({
            file: itemPath,
            matches: matches
          });
        }
      }
    }
  } catch (error) {
    console.error(`读取目录失败: ${dirPath}`, error.message);
  }

  return results;
}

function main() {
  console.log('🔍 开始验证messages字段引用删除情况...\n');

  let totalMatches = 0;
  let hasIssues = false;

  for (const directory of checkDirectories) {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️  目录不存在: ${directory}`);
      continue;
    }

    console.log(`📁 检查目录: ${directory}`);
    const results = searchInDirectory(directory);

    if (results.length === 0) {
      console.log(`✅ ${directory} - 未发现messages字段引用`);
    } else {
      hasIssues = true;
      console.log(`❌ ${directory} - 发现 ${results.length} 个文件包含messages字段引用:`);
      
      results.forEach(result => {
        console.log(`\n  📄 ${result.file}:`);
        result.matches.forEach(match => {
          console.log(`    第${match.line}行: ${match.content}`);
          totalMatches++;
        });
      });
    }
    console.log('');
  }

  console.log('=' * 60);
  if (hasIssues) {
    console.log(`❌ 验证失败: 发现 ${totalMatches} 处messages字段引用需要清理`);
    console.log('\n建议操作:');
    console.log('1. 检查上述文件中的messages字段引用');
    console.log('2. 将messages字段替换为content字段');
    console.log('3. 删除不必要的兼容性代码');
    console.log('4. 重新运行此验证脚本');
    process.exit(1);
  } else {
    console.log('✅ 验证成功: 所有messages字段引用已成功删除');
    console.log('\n可以安全地执行以下操作:');
    console.log('1. 删除数据库中的messages字段');
    console.log('2. 更新数据库schema文件');
    console.log('3. 部署更新后的应用');
  }
}

if (require.main === module) {
  main();
}

module.exports = { searchInDirectory, searchInFile };
