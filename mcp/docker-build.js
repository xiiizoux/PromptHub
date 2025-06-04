// 为Docker构建创建的专用构建脚本，跳过TypeScript类型检查
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 递归复制目录函数
const copyDirectory = (source, destination) => {
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
      
      // 移除类型注释和声明
      content = content
        .replace(/import\s+type[^;]+;/g, '')                // 移除类型导入
        .replace(/:\s*[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+(?=[=,)])/g, '') // 移除类型注解
        .replace(/<[A-Za-z0-9_<>\[\]|&,\s.'"()\{\}]+>/g, '')  // 移除泛型参数
        .replace(/implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, '') // 移除interface实现声明
        .replace(/extends\s+[A-Za-z0-9_<>\[\]|&,\s.]+\s+implements\s+[A-Za-z0-9_<>\[\]|&,\s.]+/g, 'extends') // 修复extends+implements
        .replace(/interface\s+[^{]+\{[^}]+\}/g, ''); // 移除接口定义
      
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

// 复制并转换src目录
copyDirectory('./src', './dist/src');

// 创建package.json到dist目录
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
pkg.type = 'module'; // 确保使用ESM
fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, null, 2));

console.log('构建完成！');
