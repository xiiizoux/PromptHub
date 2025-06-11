#!/bin/bash
# 直接在容器内查看并修复mcp-server.js文件

# 设置错误处理
set -e
echo "开始执行直接修复..."

# 确保容器正在运行
echo "确保容器正在运行..."
sudo docker start prompthub || sudo docker run -d --name prompthub -p 9010:9010 -p 9011:9011 prompthub:latest

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 先查看出错的文件内容
echo "查看出错文件内容..."
sudo docker exec prompthub cat /app/mcp/dist/src/mcp-server.js | head -n 30 > mcp-server-preview.txt

echo "文件前30行内容："
cat mcp-server-preview.txt

# 创建修复脚本
cat > direct-mcp-fix.js << 'EOF'
const fs = require('fs');

// 目标文件
const filePath = '/app/mcp/dist/src/mcp-server.js';

// 读取文件
const content = fs.readFileSync(filePath, 'utf8');
console.log(`读取文件，大小: ${content.length} 字节`);

// 创建备份
const backupPath = `${filePath}.direct-backup`;
fs.writeFileSync(backupPath, content);
console.log(`已创建备份: ${backupPath}`);

// 完全重写错误类定义部分
// 使用更精确的方式识别并替换错误类
const errorClassPattern = /class\s+PromptServerError\s+extends\s+Error\s*\{[\s\S]*?constructor[\s\S]*?\}/;
const fixedErrorClass = `
// 自定义错误类
class PromptServerError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}`;

let fixed = content;

// 替换错误类定义
if (errorClassPattern.test(content)) {
  fixed = content.replace(errorClassPattern, fixedErrorClass);
  console.log('已替换错误类定义');
} else {
  // 如果模式匹配失败，尝试更简单的方法
  console.log('未找到匹配的错误类定义，尝试直接替换...');
  
  // 查找导入声明后的位置
  const importEnd = content.lastIndexOf('import');
  if (importEnd > 0) {
    // 找到该导入行的结束位置
    const nextSemicolon = content.indexOf(';', importEnd);
    if (nextSemicolon > 0) {
      // 在最后一个导入后插入新的错误类定义
      fixed = content.substring(0, nextSemicolon + 1) + 
              fixedErrorClass + 
              content.substring(nextSemicolon + 1);
      console.log('已在导入声明后插入新的错误类定义');
    }
  }
}

// 写入修复后的内容
fs.writeFileSync(filePath, fixed);
console.log(`已保存修复后的文件: ${filePath}`);

// 查看修复后的内容
const lines = fixed.split('\n').slice(0, 30);
console.log("\n修复后文件的前30行:");
lines.forEach((line, i) => console.log(`${i+1}: ${line}`));
EOF

# 复制修复脚本到容器
echo "复制修复脚本到容器..."
sudo docker cp direct-mcp-fix.js prompthub:/app/direct-mcp-fix.js

# 在容器内执行修复脚本
echo "在容器内执行修复脚本..."
sudo docker exec prompthub node /app/direct-mcp-fix.js

# 重启容器以应用修复
echo "重启容器以应用修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (30秒)..."
sleep 30

# 查看容器日志
echo "显示容器日志..."
sudo docker logs prompthub | tail -n 50

# 检查容器是否成功启动
if sudo docker ps | grep -q "prompthub"; then
  echo "容器已成功启动!"
  
  # 检查服务进程
  echo "检查服务进程状态:"
  sudo docker exec prompthub ps aux | grep node
  
  echo ""
  echo "===== 修复操作完成 ====="
  echo "MCP服务地址: http://localhost:9010"
  echo "Web服务地址: http://localhost:9011"
else
  echo "错误: 容器未成功启动"
  echo "请检查完整日志以获取更多信息"
  exit 1
fi