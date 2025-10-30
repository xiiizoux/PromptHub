#!/bin/bash

# ===========================================
# PromptHub 生产环境部署脚本
# ===========================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "PromptHub 生产环境部署检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_passed() {
    echo -e "${GREEN}✓${NC} $1"
}

check_failed() {
    echo -e "${RED}✗${NC} $1"
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ===========================================
# 1. 检查 .env 文件
# ===========================================
echo "1️⃣  检查 .env 文件..."

if [ ! -f .env ]; then
    check_failed ".env 文件不存在"
    echo ""
    echo "请创建 .env 文件："
    echo "  cp .env.example .env"
    echo "  nano .env  # 编辑并填入实际值"
    echo ""
    exit 1
else
    check_passed ".env 文件存在"
fi

# ===========================================
# 2. 检查必需的环境变量
# ===========================================
echo ""
echo "2️⃣  检查必需的环境变量..."

# 加载 .env 文件
set -a
source .env
set +a

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=0

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        check_failed "$VAR 未设置"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        # 只显示前20个字符，避免泄露密钥
        VALUE="${!VAR}"
        MASKED_VALUE="${VALUE:0:20}..."
        check_passed "$VAR = $MASKED_VALUE"
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    check_failed "发现 $MISSING_VARS 个缺失的环境变量"
    echo ""
    echo "请在 .env 文件中设置以下变量："
    for VAR in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!VAR}" ]; then
            echo "  $VAR=your-value-here"
        fi
    done
    echo ""
    exit 1
fi

# ===========================================
# 3. 验证 docker-compose.yml 配置
# ===========================================
echo ""
echo "3️⃣  验证 docker-compose.yml 配置..."

if ! command -v docker &> /dev/null; then
    check_failed "Docker 未安装"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    check_failed "Docker Compose 未安装或版本过旧"
    exit 1
fi

check_passed "Docker 和 Docker Compose 已安装"

# 验证 docker-compose 是否能读取环境变量
echo ""
echo "验证 docker-compose 配置..."
if docker compose config > /dev/null 2>&1; then
    check_passed "docker-compose.yml 配置有效"
    
    # 检查构建参数
    if docker compose config | grep -q "NEXT_PUBLIC_SUPABASE_URL"; then
        check_passed "构建参数已正确配置"
    else
        check_warning "构建参数可能未正确配置"
    fi
else
    check_failed "docker-compose.yml 配置无效"
    exit 1
fi

# ===========================================
# 4. 清理旧的构建缓存
# ===========================================
echo ""
echo "4️⃣  清理 Docker 构建缓存..."

read -p "是否清理 Docker 构建缓存？这将确保使用最新的环境变量 (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker builder prune -f
    check_passed "构建缓存已清理"
else
    check_warning "跳过缓存清理（如果遇到问题，建议清理缓存）"
fi

# ===========================================
# 5. 构建 Docker 镜像
# ===========================================
echo ""
echo "5️⃣  构建 Docker 镜像..."
echo ""

read -p "开始构建？(y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "构建已取消"
    exit 0
fi

# 显示将要使用的环境变量（脱敏）
echo "将使用以下环境变量进行构建："
echo "  NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
echo "  SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# 使用 --no-cache 确保完全重新构建
if docker compose build --no-cache; then
    check_passed "Docker 镜像构建成功"
else
    check_failed "Docker 镜像构建失败"
    echo ""
    echo "请检查构建日志，常见问题："
    echo "  1. 环境变量是否正确设置"
    echo "  2. 网络连接是否正常"
    echo "  3. Docker 是否有足够的内存（建议至少 4GB）"
    echo ""
    exit 1
fi

# ===========================================
# 6. 启动服务
# ===========================================
echo ""
echo "6️⃣  启动服务..."
echo ""

read -p "是否现在启动服务？(y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 停止旧的容器
    docker compose down
    
    # 启动新的容器
    if docker compose up -d; then
        check_passed "服务启动成功"
        echo ""
        echo "等待服务就绪..."
        sleep 5
        
        # 检查容器状态
        docker compose ps
        
        echo ""
        check_passed "部署完成！"
        echo ""
        echo "访问地址："
        echo "  Web 应用: http://localhost:9011"
        echo "  MCP 服务: http://localhost:9010"
        echo ""
        echo "查看日志："
        echo "  docker compose logs -f"
        echo ""
    else
        check_failed "服务启动失败"
        exit 1
    fi
else
    echo ""
    echo "构建完成！要启动服务，请运行："
    echo "  docker compose up -d"
    echo ""
fi

echo "=========================================="
echo "部署检查完成"
echo "=========================================="

