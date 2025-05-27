#!/bin/bash
# start-enhanced.sh - 增强版 Prompt Hub 启动脚本
# 包含全面的环境检测和自动修复功能

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Prompt Hub 增强启动脚本${NC}"
echo "======================================"

# 全局变量
MIN_NODE_VERSION="18"
MIN_NPM_VERSION="9"
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
        echo -e "${YELLOW}请安装Node.js ${MIN_NODE_VERSION}+: https://nodejs.org/${NC}"
        return 1
    fi
    
    # 检查Node.js版本
    local node_version=$(node --version | sed 's/v//')
    echo -e "${BLUE}   Node.js版本: v${node_version}${NC}"
    
    if ! version_ge "$node_version" "$MIN_NODE_VERSION"; then
        echo -e "${RED}❌ Node.js版本过低 (需要 ${MIN_NODE_VERSION}+)${NC}"
        return 1
    fi
    
    # 检查npm是否安装
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm未安装${NC}"
        return 1
    fi
    
    # 检查npm版本
    local npm_version=$(npm --version)
    echo -e "${BLUE}   npm版本: v${npm_version}${NC}"
    
    if ! version_ge "$npm_version" "$MIN_NPM_VERSION"; then
        echo -e "${YELLOW}⚠️  npm版本较低，建议升级到 ${MIN_NPM_VERSION}+${NC}"
    fi
    
    echo -e "${GREEN}✅ Node.js环境检查通过${NC}"
    return 0
}

# 检查TypeScript环境
check_typescript_environment() {
    echo -e "${YELLOW}🔍 检查TypeScript环境...${NC}"
    
    # 检查全局TypeScript
    if command -v tsc &> /dev/null; then
        local ts_version=$(tsc --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
        echo -e "${BLUE}   全局TypeScript版本: ${ts_version}${NC}"
    else
        echo -e "${YELLOW}⚠️  未安装全局TypeScript${NC}"
    fi
    
    # 检查项目本地TypeScript
    if [ -f "node_modules/.bin/tsc" ]; then
        echo -e "${GREEN}✅ 项目本地TypeScript可用${NC}"
    elif [ -f "mcp/node_modules/.bin/tsc" ]; then
        echo -e "${GREEN}✅ MCP项目TypeScript可用${NC}"
    else
        echo -e "${YELLOW}⚠️  项目本地TypeScript未找到，将在依赖安装时解决${NC}"
    fi
    
    return 0
}

# 检查项目结构
check_project_structure() {
    echo -e "${YELLOW}🔍 检查项目结构...${NC}"
    
    local required_dirs=("mcp" "web" "supabase")
    local required_files=("package.json" "mcp/package.json" "web/package.json")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            echo -e "${RED}❌ 缺少目录: $dir${NC}"
            return 1
        fi
    done
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 缺少文件: $file${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ 项目结构检查通过${NC}"
    return 0
}

# 清理并重新安装依赖
clean_and_install_dependencies() {
    echo -e "${YELLOW}🧹 清理并重新安装所有依赖...${NC}"
    
    # 清理所有node_modules
    echo -e "${YELLOW}   清理旧的node_modules...${NC}"
    rm -rf node_modules mcp/node_modules web/node_modules supabase/node_modules
    rm -f package-lock.json mcp/package-lock.json web/package-lock.json supabase/package-lock.json
    
    # 安装根目录依赖
    echo -e "${YELLOW}   安装根目录依赖...${NC}"
    if ! npm install; then
        echo -e "${RED}❌ 根目录依赖安装失败${NC}"
        return 1
    fi
    
    # 安装MCP依赖
    echo -e "${YELLOW}   安装MCP服务依赖...${NC}"
    cd mcp
    if ! npm install; then
        echo -e "${RED}❌ MCP依赖安装失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
    cd "$PROJECT_DIR"
    
    # 安装Web依赖
    echo -e "${YELLOW}   安装Web应用依赖...${NC}"
    cd web
    if ! npm install; then
        echo -e "${RED}❌ Web依赖安装失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
    cd "$PROJECT_DIR"
    
    # 安装Supabase依赖
    echo -e "${YELLOW}   安装Supabase共享模块依赖...${NC}"
    cd supabase
    if ! npm install; then
        echo -e "${RED}❌ Supabase依赖安装失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
    cd "$PROJECT_DIR"
    
    echo -e "${GREEN}✅ 所有依赖安装成功${NC}"
    return 0
}

# 检查并安装依赖
check_and_install_dependencies() {
    echo -e "${YELLOW}🔍 检查项目依赖...${NC}"
    
    local need_install=false
    
    # 检查各个项目的依赖
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        echo -e "${YELLOW}   根目录依赖缺失${NC}"
        need_install=true
    fi
    
    if [ ! -d "mcp/node_modules" ]; then
        echo -e "${YELLOW}   MCP服务依赖缺失${NC}"
        need_install=true
    fi
    
    if [ ! -d "web/node_modules" ]; then
        echo -e "${YELLOW}   Web应用依赖缺失${NC}"
        need_install=true
    fi
    
    if [ ! -d "supabase/node_modules" ]; then
        echo -e "${YELLOW}   Supabase共享模块依赖缺失${NC}"
        need_install=true
    fi
    
    # 检查关键模块
    if [ ! -f "mcp/node_modules/winston/package.json" ]; then
        echo -e "${YELLOW}   MCP关键依赖winston缺失${NC}"
        need_install=true
    fi
    
    if [ ! -f "mcp/node_modules/typescript/package.json" ]; then
        echo -e "${YELLOW}   MCP TypeScript依赖缺失${NC}"
        need_install=true
    fi
    
    if [ "$need_install" = true ]; then
        echo -e "${YELLOW}🔧 需要安装/更新依赖...${NC}"
        if ! clean_and_install_dependencies; then
            echo -e "${RED}❌ 依赖安装失败${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ 所有依赖已存在${NC}"
    fi
    
    return 0
}

# 验证依赖完整性
verify_dependencies() {
    echo -e "${YELLOW}🔍 验证依赖完整性...${NC}"
    
    # 验证关键模块
    local critical_modules=(
        "mcp/node_modules/winston"
        "mcp/node_modules/typescript"
        "mcp/node_modules/@types/node"
        "web/node_modules/next"
        "web/node_modules/react"
    )
    
    for module in "${critical_modules[@]}"; do
        if [ ! -d "$module" ]; then
            echo -e "${RED}❌ 关键模块缺失: $module${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ 依赖完整性验证通过${NC}"
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

# 构建项目
build_projects() {
    echo -e "${YELLOW}🔨 构建项目...${NC}"
    
    # 构建MCP服务
    echo -e "${YELLOW}   构建MCP服务...${NC}"
    cd mcp
    if ! npm run build; then
        echo -e "${RED}❌ MCP服务构建失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ MCP服务构建成功${NC}"
    
    # 构建Web应用
    echo -e "${YELLOW}   构建Web应用...${NC}"
    cd web
    if ! npm run build; then
        echo -e "${RED}❌ Web应用构建失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ Web应用构建成功${NC}"
    
    return 0
}

# 启动服务
start_services() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动MCP服务（后台运行）
    echo -e "${YELLOW}   启动MCP服务 (端口: 9010)...${NC}"
    cd mcp && npm run dev > ../logs/mcp.log 2>&1 &
    MCP_PID=$!
    echo $MCP_PID > ../mcp.pid
    cd "$PROJECT_DIR"
    
    # 启动Web服务（后台运行）
    echo -e "${YELLOW}   启动Web服务 (端口: 9011)...${NC}"
    cd web && npm run dev > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > ../web.pid
    cd "$PROJECT_DIR"
    
    # 等待服务启动
    echo -e "${YELLOW}   等待服务启动...${NC}"
    sleep 8
    
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
    
    return $($all_good && echo 0 || echo 1)
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
    echo -e "  健康检查: ${BLUE}npm run health:check${NC}"
    echo -e "  MCP测试: ${BLUE}npm run mcp:test${NC}"
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
    
    if ! check_typescript_environment; then
        exit 1
    fi
    
    if ! check_project_structure; then
        exit 1
    fi
    
    if ! check_ports; then
        exit 1
    fi
    
    if ! check_and_install_dependencies; then
        exit 1
    fi
    
    if ! verify_dependencies; then
        exit 1
    fi
    
    if ! build_projects; then
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