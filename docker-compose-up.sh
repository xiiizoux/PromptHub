#!/bin/bash
# docker-compose-up.sh - 使用docker-compose构建和启动PromptHub

set -e

echo "===== PromptHub Docker Compose启动脚本 ====="

# 检查Docker是否运行
if ! docker ps &>/dev/null; then
  echo "错误: Docker服务未运行，请先启动Docker"
  exit 1
fi

# 检查Docker Compose命令
if docker compose version &>/dev/null; then
  DOCKER_COMPOSE="docker compose"
  echo "使用Docker Compose V2命令格式: docker compose"
elif docker-compose --version &>/dev/null; then
  DOCKER_COMPOSE="docker-compose"
  echo "使用Docker Compose V1命令格式: docker-compose"
else
  echo "错误: 未找到Docker Compose命令，请确保已安装Docker Compose"
  exit 1
fi

# 检查必要文件
if [ ! -f "docker-compose.yml" ]; then
  echo "错误: 未找到docker-compose.yml文件"
  exit 1
fi

# 创建必要目录
mkdir -p data logs

# 停止现有容器
echo "停止现有容器（如果存在）..."
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true

# 强制移除同名容器（避免冲突）
echo "清理同名容器（如果存在）..."
if docker ps -a | grep -q "prompthub"; then
  echo "发现同名容器，强制移除..."
  docker rm -f prompthub 2>/dev/null || true
fi

# 提示用户选择操作
echo ""
echo "请选择操作:"
echo "1) 重新构建并启动 (完全重建，耗时较长)"
echo "2) 仅启动已有镜像 (快速启动)"
read -p "选择 [2]: " choice
choice=${choice:-2}

if [ "$choice" = "1" ]; then
  echo ""
  echo "开始重新构建Docker镜像..."
  echo "这可能需要几分钟时间，请耐心等待..."
  $DOCKER_COMPOSE build
  
  if [ $? -ne 0 ]; then
    echo "错误: Docker镜像构建失败"
    exit 1
  fi
  echo "镜像构建成功!"
fi

echo ""
echo "启动Docker容器..."
$DOCKER_COMPOSE up -d

if [ $? -ne 0 ]; then
  echo "错误: 容器启动失败"
  exit 1
fi

echo "容器已启动，等待服务初始化 (30秒)..."
sleep 30

# 检查容器状态
echo ""
echo "检查容器状态..."
$DOCKER_COMPOSE ps

# 检查服务可用性
echo ""
echo "检查服务可用性..."
if curl -s -f http://localhost:9010 > /dev/null 2>&1; then
  echo "✅ MCP服务运行正常 (http://localhost:9010)"
else
  echo "❌ MCP服务可能未正常运行"
fi

if curl -s -f http://localhost:9011 > /dev/null 2>&1; then
  echo "✅ Web服务运行正常 (http://localhost:9011)"
else
  echo "❌ Web服务可能未正常运行"
fi

echo ""
echo "===== PromptHub已启动 ====="
echo "服务地址:"
echo "- MCP服务: http://localhost:9010"
echo "- Web服务: http://localhost:9011"
echo ""
echo "常用命令:"
echo "- 查看日志: $DOCKER_COMPOSE logs -f"
echo "- 停止服务: $DOCKER_COMPOSE down"
echo "- 重启服务: $DOCKER_COMPOSE restart"