#!/bin/bash
# 修复mcp-server.js中的多余右大括号并重启容器

# 设置错误处理
set -e
echo "开始执行多余右大括号修复..."

# 确保容器正在运行
echo "确保容器正在运行..."
sudo docker start prompthub || sudo docker run -d --name prompthub -p 9010:9010 -p 9011:9011 prompthub:latest

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 复制ESM修复脚本到容器
echo "复制ESM修复脚本到容器..."
sudo docker cp direct-fix-mcp-server-esm.js prompthub:/app/direct-fix-mcp-server-esm.js

# 在容器内执行修复脚本
echo "在容器内执行ESM修复脚本..."
sudo docker exec prompthub node /app/direct-fix-mcp-server-esm.js

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