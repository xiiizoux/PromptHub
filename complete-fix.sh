#!/bin/sh
# 容器内执行的综合修复脚本

echo "开始在容器内执行综合修复..."

# 创建直接修复特定问题的临时脚本
cat > /app/direct-fix.js << 'JSEOF'
const fs = require('fs');
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 读取文件
try {
  console.log("执行直接修复操作...");
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 创建备份
  fs.writeFileSync(`${filePath}.final-backup`, content);
  
  // 综合所有修复，按特定顺序应用
  let fixed = content;
  
  // 1. 修复TypeScript枚举
  fixed = fixed.replace(
    /enum\s+ErrorCode\s+{[\s\S]*?}/,
    `// 错误码枚举 - 改为JavaScript对象
const ErrorCode = {
  InvalidParams: 1,
  MethodNotFound: 2,
  InternalError: 3,
  Unauthorized: 4
};`
  );
  
  // 2. 修复重复导入
  fixed = fixed.replace(
    /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g, 
    "import apiKeysRouter from './api/api-keys-router.js';"
  );
  
  // 3. 修复TypeScript类型声明
  fixed = fixed.replace(
    /function\s+getAuthValue\s*\(\s*request\s*:\s*any\s*,\s*key\s*:\s*string\s*\)\s*:\s*string\s*{/g,
    "function getAuthValue(request, key) {"
  );
  
  // 4. 修复所有其他类型注解
  fixed = fixed.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*([,)=;])/g, "$2");
  fixed = fixed.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*(\{)/g, " $2");
  
  // 5. 修复类型断言
  fixed = fixed.replace(/as\s+(string|number|boolean|any)/g, "");
  
  // 6. 修复第74行message语法问题
  fixed = fixed.replace(
    /res\.json\(\{\s*message:\s*\n\s*\}\);/g, 
    'res.json({ message: "Welcome to Prompt Server API" });\n'
  );
  
  // 7. 修复第92行引号问题
  fixed = fixed.replace(
    /console\.error\('获取分类失败;/g,
    "console.error('获取分类失败:',"
  );
  
  // 8. 修复第112行引号问题
  fixed = fixed.replace(
    /console\.error\('获取标签失败;/g,
    "console.error('获取标签失败:',"
  );
  
  // 9. 修复所有控制台日志字符串
  fixed = fixed.replace(
    /console\.(log|error|warn|info)\('([^']*)(?=[^']$)/g, 
    "console.$1('$2')"
  );
  
  // 10. 修复类成员声明
  fixed = fixed.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*;/gm, "");
  
  // 11. 修复健康检查端点中的JSON语法
  fixed = fixed.replace(
    /res\.json\(\{\s*\n\s*status,\s*\n/g,
    'res.json({\n        status: "healthy",\n'
  );
  
  // 写入修复后的内容
  fs.writeFileSync(filePath, fixed);
  console.log("直接修复操作完成！");
} catch (error) {
  console.error("修复过程中出错:", error);
  process.exit(1);
}
JSEOF

# 执行直接修复脚本
echo "执行直接修复脚本..."
node /app/direct-fix.js

# 执行其他修复脚本
echo "执行字符串引号修复脚本..."
node /app/fix-string-quotes.cjs

echo "容器内修复完成！"
