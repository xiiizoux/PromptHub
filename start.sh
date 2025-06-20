#!/bin/bash
# start.sh - 优化版 Prompt Hub 启动脚本
# 仅负责启动服务，不执行构建过程

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Prompt Hub 启动脚本${NC}"
echo "======================================"

# 全局变量
PROJECT_DIR=$(pwd)

# 版本比较函数
version_ge() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# 检查Node.js环境
check_node_environment() {
    echo -e "${YELLOW}🔍 检查Node.js环境...${NC}"
    
    # 检查Node.js是否安装
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js未安装${NC}"
        echo -e "${YELLOW}请安装Node.js 18+: https://nodejs.org/${NC}"
        return 1
    fi
    
    # 检查Node.js版本
    local node_version=$(node --version | sed 's/v//')
    echo -e "${BLUE}   Node.js版本: v${node_version}${NC}"
    
    if ! version_ge "$node_version" "18"; then
        echo -e "${RED}❌ Node.js版本过低 (需要 18+)${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Node.js环境检查通过${NC}"
    return 0
}

# 检查项目构建
check_project_build() {
    echo -e "${YELLOW}🔍 检查项目构建...${NC}"
    
    # 检查MCP构建
    if [ ! -d "mcp/dist" ]; then
        echo -e "${RED}❌ MCP服务未构建${NC}"
        echo -e "${YELLOW}请先运行 ./build.sh 构建项目${NC}"
        return 1
    fi
    
    # 检查Web构建
    if [ ! -d "web/.next" ] || [ ! -f "web/.next/prerender-manifest.json" ]; then
        echo -e "${RED}❌ Web应用未构建或构建不完整${NC}"
        echo -e "${YELLOW}请先运行 ./build.sh 构建项目${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 项目构建检查通过${NC}"
    return 0
}

# 检查端口是否被占用
check_ports() {
    echo -e "${YELLOW}🔍 检查端口可用性...${NC}"
    
    if lsof -i :9010 >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口 9010 已被占用${NC}"
        echo -e "${YELLOW}   请先运行 ./stop.sh 停止现有服务${NC}"
        return 1
    fi
    
    if lsof -i :9011 >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口 9011 已被占用${NC}"
        echo -e "${YELLOW}   请先运行 ./stop.sh 停止现有服务${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 端口检查通过${NC}"
    return 0
}

# 启动服务
start_services() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"

    # 创建日志目录
    mkdir -p logs

    # 启动MCP服务（后台运行）
    echo -e "${YELLOW}   启动MCP服务 (端口: 9010)...${NC}"

    cd "$PROJECT_DIR/mcp"

    # 检查并安装关键依赖
    if [ ! -f "./node_modules/.bin/tsx" ]; then
        echo -e "${YELLOW}   安装关键依赖...${NC}"
        npm install --save-dev tsx@latest dotenv-cli@latest
    fi

    # 检查环境变量文件
    if [ ! -f "../.env" ]; then
        echo -e "${YELLOW}   警告: 未找到.env文件，使用默认配置${NC}"
    fi

    # 启动MCP服务，使用更健壮的启动方式
    echo -e "${YELLOW}   启动MCP服务进程...${NC}"
    if [ -f "dist/src/index.js" ]; then
        # 使用编译后的文件
        NODE_ENV=production node dist/src/index.js > ../logs/mcp.log 2>&1 &
    else
        # 使用tsx直接运行源码
        npm run start > ../logs/mcp.log 2>&1 &
    fi

    MCP_PID=$!
    echo "MCP_PID=$MCP_PID" > ../logs/mcp.pid

    cd "$PROJECT_DIR"

    # 启动Web服务（生产模式，后台运行）
    echo -e "${YELLOW}   启动Web服务 (端口: 9011)...${NC}"
    cd web

    # 检查Web构建文件
    if [ ! -d ".next" ]; then
        echo -e "${YELLOW}   Web应用未构建，请先运行 ./build.sh${NC}"
        return 1
    fi

    NODE_ENV=production FRONTEND_PORT=9011 npm run start > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo "WEB_PID=$WEB_PID" > ../logs/web.pid

    cd "$PROJECT_DIR"

    # 等待服务启动
    echo -e "${YELLOW}   等待服务启动...${NC}"
    sleep 10

    # 检查进程是否还在运行
    if ! kill -0 $MCP_PID 2>/dev/null; then
        echo -e "${RED}   MCP服务启动失败${NC}"
        return 1
    fi

    if ! kill -0 $WEB_PID 2>/dev/null; then
        echo -e "${RED}   Web服务启动失败${NC}"
        return 1
    fi

    return 0
}

# 验证服务状态
verify_services() {
    echo -e "${YELLOW}🔍 验证服务状态...${NC}"
    
    local all_good=true
    
    if lsof -i :9010 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP服务运行正常 (端口: 9010)${NC}"
    else
        echo -e "${RED}❌ MCP服务启动失败${NC}"
        echo -e "${YELLOW}   查看日志: tail -f logs/mcp.log${NC}"
        all_good=false
    fi
    
    if lsof -i :9011 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Web服务运行正常 (端口: 9011)${NC}"
    else
        echo -e "${RED}❌ Web服务启动失败${NC}"
        echo -e "${YELLOW}   查看日志: tail -f logs/web.log${NC}"
        all_good=false
    fi
    
    if [ "$all_good" = true ]; then
        return 0
    else
        return 1
    fi
}

# 显示启动完成信息
show_completion_info() {
    echo ""
    echo -e "${GREEN}🎉 服务启动完成！${NC}"
    echo "======================================"
    echo -e "${GREEN}✓ MCP服务: http://localhost:9010${NC}"
    echo -e "${GREEN}✓ Web服务: http://localhost:9011${NC}"
    echo ""
    echo -e "${YELLOW}📋 管理命令:${NC}"
    echo -e "  停止服务: ${BLUE}./stop.sh${NC}"
    echo -e "  查看日志: ${BLUE}tail -f logs/mcp.log${NC} 或 ${BLUE}tail -f logs/web.log${NC}"
    echo ""
}

# 主函数
main() {
    # 加载环境变量
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # 执行所有检查和启动步骤
    if ! check_node_environment; then
        exit 1
    fi
    
    if ! check_project_build; then
        exit 1
    fi
    
    if ! check_ports; then
        exit 1
    fi
    
    if ! start_services; then
        exit 1
    fi
    
    if ! verify_services; then
        echo -e "${RED}❌ 部分服务启动失败，请检查日志${NC}"
        exit 1
    fi
    
    show_completion_info
}

# 运行主函数
main "$@" 