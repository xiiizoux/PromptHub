#!/usr/bin/env node
// 全面修复TypeScript编译问题的脚本 - 处理所有TypeScript特性
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 在Docker容器内读取文件内容
function fixJsFile() {
  console.log(`尝试全面修复所有TypeScript语法问题: ${filePath}`);
  
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

    // 存储修复过程
    let fixedContent = originalContent;

    // 修复1: 解决枚举类型问题
    fixedContent = fixedContent.replace(
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
    fixedContent = fixedContent.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*([,)=;])/g, "$2");
    fixedContent = fixedContent.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*(\{)/g, " $2");
    
    // 修复类型断言
    fixedContent = fixedContent.replace(/as\s+(string|number|boolean|any)/g, "");
    
    // 修复构造函数参数类型
    fixedContent = fixedContent.replace(/constructor\s*\(([^)]*:)/g, "constructor(");

    // 修复4: 解决TypeScript类成员声明语法问题
    // 替换private/public/protected关键字成员声明
    fixedContent = fixedContent.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*;/gm, "");
    fixedContent = fixedContent.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*:/gm, "$2:");
    
    // 修复类成员类型注解
    fixedContent = fixedContent.replace(/([a-zA-Z0-9_]+)\s*:\s*(string|number|boolean|any|void|Object|Array|Function)\s*;/g, "$1;");
    
    // 修复5: 修复类方法的private/public/protected声明
    fixedContent = fixedContent.replace(/^\s*(private|public|protected)\s+(async\s+)?([a-zA-Z0-9_]+)\s*\(/gm, "$2$3(");
    
    // 修复6: 去除接口和类型定义
    fixedContent = fixedContent.replace(/interface\s+\w+\s*{[\s\S]*?}/g, "");
    fixedContent = fixedContent.replace(/type\s+\w+\s*=[\s\S]*?;/g, "");
    
    // 修复7: 将PromptServer类成员变量从声明式改为在构造函数中定义
    fixedContent = fixedContent.replace(
      /export class PromptServer {(\s*)(private|public|protected)?\s*app:[^;]*;(\s*)(private|public|protected)?\s*server:[^;]*;(\s*)(private|public|protected)?\s*storage:[^;]*;(\s*)(private|public|protected)?\s*port:[^;]*;/,
      `export class PromptServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.storage = null;
    this.port = null;
    
    this.storage = StorageFactory.getStorage();
    this.port = config.port || 9010;
    
    // 初始化Express服务器
    this.app = express();
    this.configureServer();
  }`
    );
    
    // 移除原构造函数内容 (如果存在)
    fixedContent = fixedContent.replace(
      /constructor\(\) {(\s*)this\.storage = StorageFactory\.getStorage\(\);(\s*)this\.port = config\.port \|\| 9010;(\s*)(\s*)\/\/ 初始化Express服务器(\s*)this\.app = express\(\);(\s*)this\.configureServer\(\);(\s*)}/,
      ""
    );
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    // 打印关键部分
    console.log("\n类声明部分内容（帮助调试）:");
    const classStartIndex = fixedContent.indexOf('export class PromptServer');
    if (classStartIndex > -1) {
      const contextStart = classStartIndex;
      const contextEnd = Math.min(fixedContent.length, contextStart + 300);
      const contextContent = fixedContent.substring(contextStart, contextEnd);
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