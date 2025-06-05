#!/bin/bash
# 专门修复重复导入问题的脚本

echo "开始修复重复导入问题..."

# 创建临时修复脚本
cat > fix-import.cjs << 'EOF'
#!/usr/bin/env node
// 专门修复重复导入问题的脚本
const fs = require('fs');

// 需要修复的文件路径
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 执行修复
function fixDuplicateImport() {
  console.log(`开始修复重复导入问题: ${filePath}`);
  
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
    const backupPath = `${filePath}.import-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`已创建备份文件: ${backupPath}`);
    
    // 强制替换重复导入
    const fixedContent = originalContent.replace(
      /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g,
      "import apiKeysRouter from './api/api-keys-router.js';"
    );
    
    // 检查替换是否成功
    if (fixedContent === originalContent) {
      console.log("未检测到重复导入，尝试另一种模式...");
      
      // 尝试另一种匹配模式
      const altFixed = originalContent.replace(
        /import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];(\s*)import apiKeysRouter from ['"]\.\/api\/api-keys-router\.js['"];/g,
        "import apiKeysRouter from './api/api-keys-router.js';"
      );
      
      if (altFixed === originalContent) {
        console.log("仍未检测到重复导入，尝试直接替换第27行...");
        
        // 如果仍然没有匹配，尝试直接替换第27行
        const lines = originalContent.split('\n');
        if (lines.length >= 27 && lines[26].includes("import apiKeysRouter")) {
          lines[26] = "import apiKeysRouter from './api/api-keys-router.js';";
          const directFixed = lines.join('\n');
          
          fs.writeFileSync(filePath, directFixed);
          console.log(`已直接替换第27行并保存文件，大小：${directFixed.length} 字节`);
          return true;
        }
      } else {
        fs.writeFileSync(filePath, altFixed);
        console.log(`已使用替代模式修复并保存文件，大小：${altFixed.length} 字节`);
        return true;
      }
    } else {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`已保存修复后的文件，大小：${fixedContent.length} 字节`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`修复过程中出错:`, error);
    return false;
  }
}

// 执行修复
const result = fixDuplicateImport();
process.exit(result ? 0 : 1);
EOF

# 设置权限
chmod +x fix-import.cjs

# 复制脚本到容器
echo "复制脚本到容器..."
sudo docker cp fix-import.cjs prompthub:/app/fix-import.cjs

# 在容器内执行脚本
echo "在容器内执行脚本..."
sudo docker exec prompthub node /app/fix-import.cjs

# 重启容器
echo "重启容器..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (20秒)..."
sleep 20

# 检查日志
echo "检查容器日志..."
sudo docker logs prompthub | tail -n 30

echo "重复导入修复脚本执行完成"