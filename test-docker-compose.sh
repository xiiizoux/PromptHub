#!/bin/bash
# test-docker-compose.sh - 测试使用docker-compose构建和运行PromptHub容器

set -e

echo "===== 测试Docker Compose构建PromptHub ====="

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
echo "检查必要文件..."
if [ ! -f "Dockerfile" ]; then
    echo "错误: 未找到Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "错误: 未找到docker-compose.yml"
    exit 1
fi

# 创建必要目录
echo "创建必要目录..."
mkdir -p ./data ./logs

# 检查.env文件
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "未找到.env文件，将从.env.example复制一份"
    cp .env.example .env
fi

# 停止现有容器
echo "停止现有容器（如果存在）..."
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true

# 强制移除同名容器（避免冲突）
echo "清理同名容器（如果存在）..."
if docker ps -a | grep -q "prompthub"; then
  echo "发现同名容器，强制移除..."
  docker rm -f prompthub 2>/dev/null || true
fi

# 使用docker-compose构建镜像
echo "开始使用docker-compose构建镜像..."
echo "注意: 这可能需要几分钟时间，请耐心等待..."

# 确保logs目录存在
mkdir -p logs

# 记录构建过程到日志文件
$DOCKER_COMPOSE build --no-cache 2>&1 | tee logs/docker-compose-build.log

if [ $? -ne 0 ]; then
    echo "错误: Docker镜像构建失败"
    echo "查看日志文件logs/docker-compose-build.log获取更多信息"
    exit 1
fi

echo "Docker镜像构建成功!"

# 使用docker-compose启动容器
echo "启动PromptHub容器..."
$DOCKER_COMPOSE up -d

if [ $? -ne 0 ]; then
    echo "错误: 容器启动失败"
    exit 1
fi

echo "容器已启动，等待服务初始化 (30秒)..."
sleep 30

# 监控容器日志以查看启动过程
echo "显示容器启动日志..."
$DOCKER_COMPOSE logs prompthub | tail -n 30
echo "继续等待服务完全初始化 (30秒)..."
sleep 30

# 检查容器状态
echo "检查容器状态..."
$DOCKER_COMPOSE ps

# 测试MCP服务
echo "测试MCP服务 (端口9010)..."
echo "测试MCP服务 (端口9010)..."
if curl -s -f http://localhost:9010 > /dev/null 2>&1; then
    echo "MCP服务运行正常!"
else
    echo "警告: MCP服务可能未正常运行"
    echo "显示MCP日志:"
    $DOCKER_COMPOSE logs prompthub | grep -A10 -B10 "mcp"
fi

# 测试Web服务
echo "测试Web服务 (端口9011)..."
echo "测试Web服务 (端口9011)..."
if curl -s -f http://localhost:9011 > /dev/null 2>&1; then
    echo "Web服务运行正常!"
else
    echo "警告: Web服务可能未正常运行"
    echo "显示Web日志:"
    $DOCKER_COMPOSE logs prompthub | grep -A10 -B10 "web"
fi

# 检查容器内部是否运行了修复脚本
echo "检查修复脚本是否执行..."
$DOCKER_COMPOSE exec prompthub ls -la /app/mcp/fix-quotes.js* 2>/dev/null || echo "没有找到修复脚本文件"
$DOCKER_COMPOSE exec prompthub ls -la /app/fix-docker-enum.cjs 2>/dev/null || echo "没有找到枚举修复脚本"

# 显示日志文件内容
echo "显示MCP服务日志内容..."
$DOCKER_COMPOSE exec prompthub cat /app/logs/mcp.log | tail -n 20 || echo "无法读取MCP日志"

echo "显示Web服务日志内容..."
$DOCKER_COMPOSE exec prompthub cat /app/logs/web.log | tail -n 20 || echo "无法读取Web日志"

# 显示资源使用情况
echo "容器资源使用情况:"
docker stats prompthub --no-stream || echo "无法获取资源使用情况"

echo "===== Docker Compose测试完成 ====="
echo "服务访问地址:"
echo "- MCP服务: http://localhost:9010"
echo "- Web服务: http://localhost:9011"
echo ""
echo "常用命令:"
echo "- 查看日志: $DOCKER_COMPOSE logs -f"
echo "- 停止服务: $DOCKER_COMPOSE down"
echo "- 重启服务: $DOCKER_COMPOSE restart"