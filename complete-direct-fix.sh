#!/bin/bash
# 最终完整修复方案 - 修复所有已知问题

# 设置错误处理
set -e
echo "开始执行终极直接修复脚本..."

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 创建修复脚本
echo "创建修复脚本..."
cat > direct-fix.cjs << 'EOF'
#!/usr/bin/env node
// 最终直接修复脚本 - CommonJS版本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 执行修复
function fixFile() {
  console.log(`开始全面直接修复: ${filePath}`);
  
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
    
    // 特定问题修复
    let fixed = originalContent;
    
    // 1. 修复重复导入问题
    fixed = fixed.replace(
      /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g, 
      "import apiKeysRouter from './api/api-keys-router.js';"
    );
    
    // 2. 修复TypeScript类型语法
    fixed = fixed.replace(
      /function\s+getAuthValue\s*\(\s*request\s*(?::\s*any)?\s*,\s*key\s*(?::\s*string)?\s*\)\s*(?::\s*string)?\s*{/g,
      "function getAuthValue(request, key) {"
    );
    
    // 3. 修复console.error语句中的未闭合字符串
    fixed = fixed.replace(
      /console\.error\('获取分类失败:'/g,
      "console.error('获取分类失败:', error)"
    );
    
    fixed = fixed.replace(
      /console\.error\('获取标签失败:'/g,
      "console.error('获取标签失败:', error)"
    );
    
    // 4. 逐行处理修复更复杂的问题
    const lines = fixed.split('\n');
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // 特殊处理第92行问题
      if (line.includes("console.error('获取分类失败") && !line.includes(");")) {
        result.push("        console.error('获取分类失败:', error);");
        continue;
      }
      
      // 特殊处理第112行问题
      if (line.includes("console.error('获取标签失败") && !line.includes(");")) {
        result.push("        console.error('获取标签失败:', error);");
        continue;
      }
      
      // 修复JSON对象语法错误
      if (line.includes("res.json({ message:") && !line.includes("}")) {
        result.push("      res.json({ message: \"Welcome to Prompt Server API\" });");
        continue;
      }
      
      // 修复健康检查端点中的JSON语法
      if (line.includes("status,") && lines[i-1].includes("res.json({")) {
        result.push("        status: \"healthy\",");
        continue;
      }
      
      // 检查每一行的引号平衡
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      
      // 如果单引号不平衡
      if (singleQuotes % 2 !== 0) {
        // 尝试修复
        if (line.startsWith("console.") && line.includes("('") && !line.includes("');")) {
          line = line + "');";
        }
      }
      
      result.push(line.startsWith(' ') ? lines[i] : line);
    }
    
    // 将处理过的行重新组合成完整文件
    const fixedContent = result.join('\n');
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, fixedContent);
    console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
    
    return true;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixFile();
process.exit(result ? 0 : 1);
EOF

# 设置脚本权限
chmod +x direct-fix.cjs

# 复制脚本到容器
echo "复制脚本到容器..."
sudo docker cp direct-fix.cjs prompthub:/app/direct-fix.cjs

# 在容器内执行修复脚本
echo "在容器内执行修复脚本..."
sudo docker exec prompthub node /app/direct-fix.cjs

# 重启容器
echo "重启容器..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (20秒)..."
sleep 20

# 检查日志
echo "检查容器日志..."
sudo docker logs prompthub | tail -n 30

# 检查进程
echo "检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node"

echo "终极直接修复脚本执行完成"