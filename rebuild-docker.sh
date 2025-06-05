#!/bin/bash
# 重新构建并启动PromptHub Docker容器的脚本

# 确保脚本在错误时停止
set -e

echo "===== PromptHub Docker 重建脚本 ====="
echo "此脚本将重新构建并启动PromptHub Docker容器"

# 检查Docker是否正在运行
if ! docker ps &>/dev/null; then
  echo "错误: Docker服务未运行，请先启动Docker"
  exit 1
fi

# 停止并移除现有容器
echo "停止并移除现有容器..."
docker stop prompthub 2>/dev/null || true
docker rm prompthub 2>/dev/null || true

# 开始构建新镜像
echo "开始构建新的Docker镜像..."
echo "这可能需要几分钟时间，请耐心等待..."
docker build -t prompthub:latest .

# 启动新容器
echo "启动新容器..."
docker run -d \
  --name prompthub \
  -p 9010:9010 \
  -p 9011:9011 \
  prompthub:latest

echo "等待服务启动 (30秒)..."
sleep 30

# 检查容器是否正在运行
if docker ps | grep -q "prompthub"; then
  echo "容器已成功启动!"
  echo "查看容器日志..."
  docker logs prompthub | tail -n 50
  
  echo ""
  echo "===== 操作完成 ====="
  echo "MCP服务地址: http://localhost:9010"
  echo "Web服务地址: http://localhost:9011"
  echo ""
  echo "如需查看更多日志，请运行: docker logs prompthub"
else
  echo "错误: 容器未成功启动"
  echo "查看日志以获取更多信息..."
  docker logs prompthub
  exit 1
fi