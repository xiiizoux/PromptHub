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

# 主函数
main() {
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
