#!/bin/bash
# 修复构造函数语法错误并重启容器

# 设置错误处理
set -e
echo "开始执行构造函数语法错误修复..."

# 添加执行权限
chmod +x fix-constructor-syntax.cjs

# 检查脚本是否存在
if [ ! -f "fix-constructor-syntax.cjs" ]; then
  echo "错误：找不到修复脚本 fix-constructor-syntax.cjs"
  exit 1
fi

# 停止容器（如果正在运行）
echo "停止现有容器..."
sudo docker stop prompthub 2>/dev/null || true

# 启动容器以运行修复脚本
echo "启动容器..."
sudo docker start prompthub || sudo docker run -d --name prompthub -p 9010:9010 -p 9011:9011 prompthub:latest

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 复制修复脚本到容器
echo "复制修复脚本到容器..."
sudo docker cp fix-constructor-syntax.cjs prompthub:/app/fix-constructor-syntax.cjs

# 在容器内执行修复脚本
echo "在容器内执行修复脚本..."
sudo docker exec prompthub node /app/fix-constructor-syntax.cjs

# 重启容器以应用修复
echo "重启容器以应用修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启并检查服务状态 (20秒)..."
sleep 20

# 查看容器日志
echo "显示容器日志最后30行以检查启动状态:"
sudo docker logs prompthub | tail -n 30

# 检查容器是否正在运行
if sudo docker ps | grep -q "prompthub"; then
  echo "容器已成功启动!"
  
  # 检查服务进程
  echo "检查服务进程..."
  sudo docker exec prompthub ps aux | grep node
  
  echo ""
  echo "===== 修复操作完成 ====="
  echo "MCP服务地址: http://localhost:9010"
  echo "Web服务地址: http://localhost:9011"
  echo ""
  echo "如需查看完整日志，请运行: sudo docker logs prompthub"
else
  echo "错误: 容器未成功启动"
  echo "查看完整日志以获取更多信息..."
  sudo docker logs prompthub
  exit 1
fi