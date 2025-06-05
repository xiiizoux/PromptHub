// 为Docker构建创建的专用构建脚本，跳过TypeScript类型检查
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 递归复制目录函数
const copyDirectory = (source, destination) => {
  console.log(`复制目录: ${source} -> ${destination}`);
  // 确保目标目录存在
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // 读取源目录中的所有文件/文件夹
  const items = fs.readdirSync(source);

  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    // 如果是目录，递归复制
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } 
    // 如果是TypeScript文件，转换为JavaScript
    else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      // 简单转换TS为JS (仅用于Docker构建)
      let content = fs.readFileSync(srcPath, 'utf-8');
      
      try {
        // 基础转换：保留字符串完整性
        // 首先检查文件内容字符串引号是否匹配
        const singleQuotes = (content.match(/'/g) || []).length;
        const doubleQuotes = (content.match(/"/g) || []).length;
        
        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
          console.warn(`警告：文件 ${srcPath} 中引号不匹配，尝试保守转换`);  
        }
        
        // 使用更安全的处理来移除TypeScript特性
        content = content
          // 移除类型导入
          .replace(/import\s+type[^;]+;/g, '')
          // 移除类型注解，小心不要破坏字符串
          .replace(/([^'"]):\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+(?=[=,);])/g, '$1')
          // 移除interface实现声明
          .replace(/implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, '')
          // 修复extends+implements
          .replace(/extends\s+[A-Za-z0-9_<>\[\]|&,\s.]+\s+implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, 'extends')
          // 移除接口定义
          .replace(/interface\s+[^{]+\{[^}]+\}/g, '');
      } catch (err) {
        console.warn(`转换文件 ${srcPath} 时出错：${err.message}，将使用原始内容`);  
      }
      
      // 将.ts扩展名改为.js
      const jsFileName = item.replace(/\.tsx?$/, '.js');
      const jsFilePath = path.join(destination, jsFileName);
      
      // 写入转换后的JS文件
      fs.writeFileSync(jsFilePath, content);
    } 
    // 其他文件直接复制
    else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

console.log('开始Docker专用构建过程...');
console.log('复制并转换TS文件到dist目录...');

// 确保dist目录存在
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist', { recursive: true });
}

// 检测当前工作目录并根据实际情况运行
const workingDir = process.cwd(); // 获取工作目录
const mcpDir = path.resolve(__dirname, '.');
const runFromRoot = !workingDir.endsWith('/mcp') && !workingDir.endsWith('\\mcp');

// 确定源目录和目标目录的路径
let srcDir, distDir, mcpBaseDir;

if (runFromRoot) {
  // 从项目根目录运行
  mcpBaseDir = './mcp';
  srcDir = './mcp/src';
  distDir = './mcp/dist/src';
} else {
  // 从mcp目录运行
  mcpBaseDir = '.';
  srcDir = './src';
  distDir = './dist/src';
}

console.log(`检测到运行目录: ${__dirname}`);
console.log(`当前工作目录: ${workingDir}`);
console.log(`是否从根目录运行: ${runFromRoot}`);
console.log(`源代码目录: ${srcDir}`);
console.log(`目标目录: ${distDir}`);

// 复制并转换src目录
copyDirectory(srcDir, distDir);

// 创建package.json到dist目录
const pkgPath = path.join(mcpBaseDir, 'package.json');
const distPkgPath = runFromRoot ? './mcp/dist/package.json' : './dist/package.json';
console.log(`读取package.json：${pkgPath}`);
console.log(`写入package.json：${distPkgPath}`);
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.type = 'module'; // 确保使用ESM
fs.writeFileSync(distPkgPath, JSON.stringify(pkg, null, 2));

// 特殊后处理：修复编译后的主文件中的引号问题
console.log('执行特殊后处理修复...');
const indexPath = runFromRoot ? './mcp/dist/src/index.js' : './dist/src/index.js';
console.log(`处理index文件：${indexPath}`);
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // 特殊修复引号问题
  indexContent = indexContent
    // 修复单引号问题
    .replace(/console\.error\('([^']*)/g, (match, p1) => {
      return `console.error('${p1}'`;
    })
    // 修复双引号问题
    .replace(/console\.error\("([^"]*)/g, (match, p1) => {
      return `console.error("${p1}"`;  
    })
    // 完全替换出问题的错误语句
    .replace(/console\.error\('Failed to start MCP Prompt Server[^']*/, "console.error('Failed to start MCP Prompt Server:'");
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`已修复 ${indexPath} 文件中的引号问题`);
}

console.log('构建完成！');
