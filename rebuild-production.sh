#!/bin/bash

# =========================================================
# PromptHub 生产环境重新构建脚本
# 用于清理 Docker 缓存并使用最新环境变量重新构建
# =========================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "PromptHub 生产环境重新构建"
echo -e "==========================================${NC}"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}✗ 错误: .env 文件不存在${NC}"
    echo ""
    echo "请先创建 .env 文件："
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ .env 文件存在${NC}"

# 加载环境变量
set -a
source .env
set +a

# 验证必需的环境变量
echo ""
echo "验证环境变量..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}✗ $VAR 未设置${NC}"
        MISSING=1
    else
        echo -e "${GREEN}✓ $VAR 已设置${NC}"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}错误: 缺少必需的环境变量${NC}"
    exit 1
fi

# 显示将使用的环境变量（脱敏）
echo ""
echo -e "${BLUE}将使用以下环境变量进行构建:${NC}"
echo "  NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
echo "  SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# 步骤 1: 停止运行中的容器
echo -e "${YELLOW}步骤 1/5: 停止运行中的容器...${NC}"
if docker compose ps | grep -q "Up"; then
    docker compose down
    echo -e "${GREEN}✓ 容器已停止${NC}"
else
    echo -e "${GREEN}✓ 没有运行中的容器${NC}"
fi
echo ""

# 步骤 2: 删除旧镜像
echo -e "${YELLOW}步骤 2/5: 删除旧镜像...${NC}"
if docker images | grep -q "prompthub"; then
    docker rmi prompthub:latest 2>/dev/null || echo "无法删除镜像（可能被使用中）"
    echo -e "${GREEN}✓ 旧镜像已删除${NC}"
else
    echo -e "${GREEN}✓ 没有找到旧镜像${NC}"
fi
echo ""

# 步骤 3: 清理 Docker 构建缓存
echo -e "${YELLOW}步骤 3/5: 清理 Docker 构建缓存...${NC}"
echo "这将删除所有未使用的构建缓存，确保使用最新的环境变量..."
docker builder prune -af
echo -e "${GREEN}✓ 构建缓存已清理${NC}"
echo ""

# 步骤 4: 重新构建（不使用缓存）
echo -e "${YELLOW}步骤 4/5: 重新构建 Docker 镜像...${NC}"
echo "使用 Node.js 20 和最新的环境变量..."
echo ""

# 显示构建参数
echo "构建参数:"
echo "  --no-cache (强制重新构建所有层)"
echo "  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=***"
echo "  --build-arg SUPABASE_URL=$SUPABASE_URL"
echo "  --build-arg SUPABASE_SERVICE_ROLE_KEY=***"
echo ""

if docker compose build --no-cache; then
    echo ""
    echo -e "${GREEN}✓ Docker 镜像构建成功！${NC}"
else
    echo ""
    echo -e "${RED}✗ Docker 镜像构建失败${NC}"
    echo ""
    echo "常见问题排查："
    echo "  1. 检查网络连接"
    echo "  2. 检查 Docker 内存限制（建议至少 4GB）"
    echo "  3. 检查环境变量是否正确"
    echo ""
    exit 1
fi
echo ""

# 步骤 5: 启动服务
echo -e "${YELLOW}步骤 5/5: 启动服务...${NC}"

read -p "是否现在启动服务？(y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker compose up -d; then
        echo -e "${GREEN}✓ 服务启动成功！${NC}"
        echo ""
        echo "等待服务就绪..."
        sleep 10
        
        echo ""
        echo "容器状态:"
        docker compose ps
        
        echo ""
        echo -e "${GREEN}=========================================="
        echo "部署完成！"
        echo -e "==========================================${NC}"
        echo ""
        echo "访问地址："
        echo "  🌐 Web 应用: http://localhost:9011"
        echo "  🔌 MCP 服务: http://localhost:9010"
        echo ""
        echo "查看日志："
        echo "  docker compose logs -f"
        echo ""
        echo "检查健康状态："
        echo "  curl http://localhost:9011/api/health"
        echo "  curl http://localhost:9010/api/health"
        echo ""
    else
        echo -e "${RED}✗ 服务启动失败${NC}"
        echo ""
        echo "查看日志："
        echo "  docker compose logs"
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}构建完成！${NC}"
    echo ""
    echo "要启动服务，请运行："
    echo "  docker compose up -d"
    echo ""
fi

