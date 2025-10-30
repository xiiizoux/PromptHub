#!/bin/bash
# ============================================
# Docker 镜像构建脚本
# 从项目主文件夹的 .env 文件读取环境变量并传递给 Docker 构建
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始构建 PromptHub Docker 镜像...${NC}"

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env 文件不存在${NC}"
    echo -e "${YELLOW}请确保项目主文件夹存在 .env 文件${NC}"
    exit 1
fi

# 从 .env 文件读取必要的环境变量
echo -e "${YELLOW}从 .env 文件读取环境变量...${NC}"

# 使用 source 加载 .env 文件
set -a
source .env
set +a

# 验证必需的环境变量
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}错误: $var 未设置${NC}"
        exit 1
    fi
done

echo -e "${GREEN}环境变量验证通过${NC}"
echo -e "  - SUPABASE_URL: ${SUPABASE_URL}"
echo -e "  - NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}"

# 构建 Docker 镜像
echo -e "${GREEN}开始构建 Docker 镜像...${NC}"

docker build \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    --build-arg SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
    --build-arg SUPABASE_URL="${SUPABASE_URL}" \
    -t prompthub:production \
    -t prompthub:latest \
    .

BUILD_STATUS=$?

if [ $BUILD_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Docker 镜像构建成功!${NC}"
    echo -e "${GREEN}镜像标签:${NC}"
    echo -e "  - prompthub:production"
    echo -e "  - prompthub:latest"
    echo ""
    echo -e "${YELLOW}可以使用以下命令运行:${NC}"
    echo -e "  docker compose up -d"
else
    echo -e "${RED}✗ Docker 镜像构建失败${NC}"
    exit 1
fi

