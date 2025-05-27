#!/bin/bash
# build.sh - Prompt Hub 构建脚本
# 专注于构建项目，不负责启动服务

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Prompt Hub 构建脚本${NC}"
echo "======================================"

# 全局变量
PROJECT_DIR=$(pwd)

# 清理构建缓存
clean_build() {
    echo -e "${YELLOW}🧹 清理构建缓存...${NC}"
    
    # 清理 web 构建缓存
    echo -e "${YELLOW}   清理 Web 构建缓存...${NC}"
    rm -rf web/.next web/dist web/.turbo web/.vercel web/.cache
    
    # 清理 mcp 构建缓存
    echo -e "${YELLOW}   清理 MCP 构建缓存...${NC}"
    rm -rf mcp/dist mcp/build
    
    echo -e "${GREEN}✅ 构建缓存清理完成${NC}"
}

# 构建 MCP 服务
build_mcp() {
    echo -e "${YELLOW}🔨 构建 MCP 服务...${NC}"
    
    cd mcp
    if npm run build; then
        echo -e "${GREEN}✅ MCP 服务构建成功${NC}"
        cd "$PROJECT_DIR"
        return 0
    else
        echo -e "${RED}❌ MCP 服务构建失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
}

# 构建 Web 应用
build_web() {
    echo -e "${YELLOW}🔨 构建 Web 应用...${NC}"
    
    cd web
    
    # 清理 .next 目录
    echo -e "${YELLOW}   清理 .next 目录...${NC}"
    rm -rf .next
    
    # 检查 build 脚本是否包含 SKIP_STATIC_EXPORT
    if grep -q "SKIP_STATIC_EXPORT=true" package.json; then
        echo -e "${YELLOW}   修改 package.json 中的 build 脚本...${NC}"
        sed -i 's/"build": "SKIP_STATIC_EXPORT=true next build"/"build": "next build"/g' package.json
    fi
    
    # 执行构建
    echo -e "${YELLOW}   执行 Web 应用构建...${NC}"
    if npm run build; then
        echo -e "${GREEN}✅ Web 应用构建成功${NC}"
        
        # 检查 prerender-manifest.json 文件
        if [ -f ".next/prerender-manifest.json" ]; then
            echo -e "${GREEN}✅ 成功生成 prerender-manifest.json 文件${NC}"
            ls -la .next/prerender-manifest.json
        else
            echo -e "${RED}❌ 未生成 prerender-manifest.json 文件${NC}"
            cd "$PROJECT_DIR"
            return 1
        fi
        
        cd "$PROJECT_DIR"
        return 0
    else
        echo -e "${RED}❌ Web 应用构建失败${NC}"
        cd "$PROJECT_DIR"
        return 1
    fi
}

# 安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}💾 安装项目依赖...${NC}"
    
    # 安装 MCP 依赖
    echo -e "${YELLOW}   安装 MCP 服务依赖...${NC}"
    cd "$PROJECT_DIR/mcp"
    
    # 检查package.json中是否已有TypeScript
    if ! grep -q '"typescript"' package.json; then
        echo -e "${YELLOW}   添加 TypeScript 作为开发依赖...${NC}"
        npm install --save-dev typescript@latest
    fi
    
    # 特别检查并安装关键依赖
    echo -e "${YELLOW}   确保关键依赖正确安装...${NC}"
    
    # 安装dotenv-cli
    npm install --save-dev dotenv-cli@latest
    
    # 安装tsx
    npm install --save-dev tsx@latest
    
    # 安装dotenv
    npm install --save dotenv@latest
    
    # 执行完整依赖安装
    if npm install; then
        # 确认关键工具是否可用
        local all_tools_installed=true
        
        if [ -f "./node_modules/.bin/dotenv" ]; then
            echo -e "${GREEN}✓ dotenv-cli 安装成功${NC}"
        else
            echo -e "${YELLOW}警告: dotenv-cli 未正确安装，再次安装...${NC}"
            npm install --save-dev dotenv-cli@latest
            all_tools_installed=false
        fi
        
        if [ -f "./node_modules/.bin/tsx" ]; then
            echo -e "${GREEN}✓ tsx 安装成功${NC}"
        else
            echo -e "${YELLOW}警告: tsx 未正确安装，再次安装...${NC}"
            npm install --save-dev tsx@latest
            all_tools_installed=false
        fi
        
        # 如果有工具未安装成功，再次运行npm install
        if [ "$all_tools_installed" = false ]; then
            echo -e "${YELLOW}再次运行 npm install 以确保所有依赖安装完成...${NC}"
            npm install
        fi
        
        echo -e "${GREEN}✓ MCP 依赖安装成功${NC}"
    else
        echo -e "${RED}✗ MCP 依赖安装失败${NC}"
        return 1
    fi
    
    # 安装 Web 依赖
    echo -e "${YELLOW}   安装 Web 应用依赖...${NC}"
    cd "$PROJECT_DIR/web"
    
    # 检查package.json中是否已有TypeScript
    if ! grep -q '"typescript"' package.json; then
        echo -e "${YELLOW}   添加 TypeScript 作为开发依赖...${NC}"
        npm install --save-dev typescript@latest
    fi
    
    if npm install; then
        echo -e "${GREEN}✓ Web 依赖安装成功${NC}"
    else
        echo -e "${RED}✗ Web 依赖安装失败${NC}"
        return 1
    fi
    
    cd "$PROJECT_DIR"
    
    # 检查TypeScript是否安装成功
    echo -e "${YELLOW}   检查 TypeScript 安装状态...${NC}"
    if [ -f "$PROJECT_DIR/mcp/node_modules/.bin/tsc" ] && [ -f "$PROJECT_DIR/web/node_modules/.bin/tsc" ]; then
        local mcp_ts_version=$(cd "$PROJECT_DIR/mcp" && npx tsc --version | awk '{print $2}')
        local web_ts_version=$(cd "$PROJECT_DIR/web" && npx tsc --version | awk '{print $2}')
        echo -e "${GREEN}✓ TypeScript 已安装: MCP(${mcp_ts_version}), Web(${web_ts_version})${NC}"
    else
        echo -e "${YELLOW}警告: TypeScript 可能未完全安装${NC}"
    fi
    
    return 0
}

# 简单环境检查
check_basic_environment() {
    echo -e "${YELLOW}🔍 检查基本环境...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ 未找到 Node.js${NC}"
        echo -e "${YELLOW}   请安装 Node.js 后重试${NC}"
        return 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ 未找到 npm${NC}"
        echo -e "${YELLOW}   请安装 npm 后重试${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ 基本环境检查通过${NC}"
    return 0
}

# 主函数
main() {
    # 检查基本环境
    if ! check_basic_environment; then
        echo -e "${RED}✗ 基本环境检查失败，终止构建流程${NC}"
        exit 1
    fi
    
    # 询问是否需要安装依赖
    echo -e "${YELLOW}是否需要安装/更新项目依赖？ [是/否] (默认否)${NC}"
    read -t 5 need_install
    if [[ "$need_install" =~ ^([yY][eE][sS]|[yY]|是|是的|是已|已是)$ ]]; then
        if ! install_dependencies; then
            echo -e "${RED}✗ 依赖安装失败，终止构建流程${NC}"
            exit 1
        fi
    fi
    
    # 清理构建缓存
    clean_build
    
    # 构建 MCP 服务
    if ! build_mcp; then
        echo -e "${RED}❌ MCP 服务构建失败，终止构建流程${NC}"
        exit 1
    fi
    
    # 构建 Web 应用
    if ! build_web; then
        echo -e "${RED}❌ Web 应用构建失败，终止构建流程${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🎉 所有项目构建成功！${NC}"
    echo "======================================"
    echo -e "${YELLOW}📋 后续步骤:${NC}"
    echo -e "  启动服务: ${BLUE}./start.sh${NC}"
}

# 执行主函数
main
