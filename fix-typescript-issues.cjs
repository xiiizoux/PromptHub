#!/usr/bin/env node
// 综合修复TypeScript编译问题的脚本 - 处理类型声明和重复导入
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试全面修复JS语法问题: ${filePath}`);
  
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
    
    // 检查原始文件是否存在重复导入
    const hasDoubleImport = originalContent.includes('import apiKeysRouter from') && 
                           originalContent.indexOf('import apiKeysRouter from') !== 
                           originalContent.lastIndexOf('import apiKeysRouter from');
    
    if (hasDoubleImport) {
      console.log('检测到重复导入，将进行修复');
    }

    // 修复1: 解决枚举类型问题
    let fixedContent = originalContent.replace(
      /enum\s+ErrorCode\s+{[\s\S]*?}/,
      `// 错误码枚举 - 改为JavaScript对象
const ErrorCode = {
  InvalidParams: 1,
  MethodNotFound: 2,
  InternalError: 3,
  Unauthorized: 4
};`
    );

    // 修复2: 解决重复导入问题
    fixedContent = fixedContent.replace(
      /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g, 
      "import apiKeysRouter from './api/api-keys-router.js';"
    );

    // 修复3: 解决TypeScript类型声明语法问题
    // 修复函数参数和返回值的类型注解
    fixedContent = fixedContent.replace(
      /function\s+getAuthValue\s*\(\s*request\s*:\s*any\s*,\s*key\s*:\s*string\s*\)\s*:\s*string\s*{/g,
      "function getAuthValue(request, key) {"
    );

    // 修复所有其他类型注解
    fixedContent = fixedContent.replace(/:\s*(string|number|boolean|any|void)\s*([,)=;])/g, "$2");
    fixedContent = fixedContent.replace(/:\s*(string|number|boolean|any|void)\s*(\{)/g, " $2");
    
    // 修复类型断言
    fixedContent = fixedContent.replace(/as\s+(string|number|boolean|any)/g, "");
    
    // 修复构造函数参数类型
    fixedContent = fixedContent.replace(/constructor\s*\(([^)]*:)/g, "constructor(");
    
    // 修复接口和类型别名
    fixedContent = fixedContent.replace(/interface\s+\w+\s*{[\s\S]*?}/g, "");
    fixedContent = fixedContent.replace(/type\s+\w+\s*=[\s\S]*?;/g, "");
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 检查是否成功修复getAuthValue函数的类型声明
    const hasTypeError = fixedContent.includes('function getAuthValue(request, key): string');
    if (hasTypeError) {
      console.log("警告：仍然存在TypeScript类型声明！");
      
      // 如果仍然存在问题，使用更直接的替换
      let finalFix = fixedContent.replace(
        /function getAuthValue\(request, key\): string {/,
        "function getAuthValue(request, key) {"
      );
      
      fs.writeFileSync(filePath, finalFix);
      console.log("已应用最终修复，强制替换类型声明语法");
    }
    
    // 打印getAuthValue函数部分
    const getAuthValueIndex = fixedContent.indexOf('function getAuthValue');
    if (getAuthValueIndex > -1) {
      const contextStart = Math.max(0, getAuthValueIndex - 10);
      const contextEnd = Math.min(fixedContent.length, getAuthValueIndex + 200);
      const contextContent = fixedContent.substring(contextStart, contextEnd);
      console.log("getAuthValue函数上下文（帮助调试）:");
      console.log(contextContent);
    }
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixJsFile();
process.exit(result ? 0 : 1);