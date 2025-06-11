const fs = require('fs');
const path = require('path');

// 需要修复的主要文件
const filePath = '/app/mcp/dist/src/mcp-server.js';
const indexPath = '/app/mcp/dist/src/index.js';

// 修复mcp-server.js文件
function fixMcpServerFile() {
  console.log(`修复文件: ${filePath}`);
  
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
    const backupPath = `${filePath}.final-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 综合所有修复，按特定顺序应用
    let fixed = originalContent;
    
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
      /function\s+getAuthValue\s*\(\s*request\s*,\s*key\s*\)\s*:\s*string\s*{/g,
      "function getAuthValue(request, key) {"
    );
    fixed = fixed.replace(
      /function\s+getAuthValue\s*\(\s*request\s*:\s*any\s*,\s*key\s*:\s*string\s*\)\s*:\s*string\s*{/g,
      "function getAuthValue(request, key) {"
    );
    
    // 4. 修复所有其他类型注解
    fixed = fixed.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*([,)=;])/g, "$2");
    fixed = fixed.replace(/:\s*(string|number|boolean|any|void|Object|Array|Function)\s*(\{)/g, " $2");
    
    // 5. 修复类型断言
    fixed = fixed.replace(/as\s+(string|number|boolean|any)/g, "");
    
    // 6. 修复JSON语法问题
    fixed = fixed.replace(
      /res\.json\(\{\s*message:\s*\n\s*\}\);/g, 
      'res.json({ message: "Welcome to Prompt Server API" });\n'
    );
    
    // 7. 修复引号问题
    fixed = fixed.replace(
      /console\.error\('获取分类失败;/g,
      "console.error('获取分类失败:',"
    );
    fixed = fixed.replace(
      /console\.error\('获取标签失败;/g,
      "console.error('获取标签失败:',"
    );
    
    // 8. 修复所有控制台日志字符串
    fixed = fixed.replace(
      /console\.(log|error|warn|info)\('([^']*)(?=[^']$)/g, 
      "console.$1('$2')"
    );
    
    // 9. 移除类成员声明
    fixed = fixed.replace(/^\s*(private|public|protected)\s+([a-zA-Z0-9_]+)\s*;/gm, "");
    
    // 10. 修复健康检查端点中的JSON语法
    fixed = fixed.replace(
      /res\.json\(\{\s*\n\s*status,\s*\n/g,
      'res.json({\n        status: "healthy",\n'
    );
    
    // 11. 修复其他不完整的JSON对象
    const lines = fixed.split('\n');
    let newContent = [];
    let openBraces = 0;
    let inResJson = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 检测res.json调用的开始
      if (line.includes('res.json({') && !line.includes('});')) {
        inResJson = true;
        openBraces = (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
      } 
      // 在res.json内部统计括号
      else if (inResJson) {
        openBraces += (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
        
        // 如果括号已关闭但没有结束语句
        if (openBraces === 0 && !line.includes('});')) {
          line = line.replace(/\}\s*$/, '});');
          inResJson = false;
        }
        // 如果行结束但JSON对象未关闭
        else if (openBraces > 0 && i === lines.length - 1) {
          line += ' });';
          inResJson = false;
        }
      }
      
      // 修复不完整的键值对
      if (line.match(/:\s*$/)) {
        // 如果键后面没有值，添加空字符串
        if (i === lines.length - 1 || !lines[i+1].trim().startsWith('"')) {
          line = line + ' "",';
        }
      }
      
      newContent.push(line);
    }
    
    fixed = newContent.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixed);
    console.log(`已保存修复后的文件，大小：${fixed.length} 字节`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 修复index.js文件
function fixIndexFile() {
  console.log(`修复文件: ${indexPath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(indexPath)) {
      console.error(`文件不存在: ${indexPath}`);
      return false;
    }
    
    // 创建备份
    const backupPath = `${indexPath}.final-backup`;
    fs.writeFileSync(backupPath, fs.readFileSync(indexPath, 'utf8'));
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 直接创建一个全新的index.js，避免所有潜在问题
    const newIndexContent = `
import { startMCPServer } from './mcp-server.js';

// 主函数
async function main() {
  try {
    await startMCPServer();
  } catch (error) {
    console.error('Failed to start MCP Prompt Server:', error);
    process.exit(1);
  }
}

// 启动主函数
main();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 处理SIGINT信号（Ctrl+C）
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// 处理SIGTERM信号
process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
`;
    
    // 写入新内容
    fs.writeFileSync(indexPath, newIndexContent);
    console.log(`已重写 ${indexPath} 文件`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行所有修复
console.log("开始执行综合修复...");
const mcpServerFixed = fixMcpServerFile();
const indexFixed = fixIndexFile();

if (mcpServerFixed && indexFixed) {
  console.log("所有修复操作已成功完成！");
  process.exit(0);
} else {
  console.error("修复过程中出现错误，请检查日志！");
  process.exit(1);
}
