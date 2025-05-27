#!/bin/bash
# deploy-docker.sh - PromptHub Docker部署脚本

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 PromptHub Docker部署脚本${NC}"
echo "=================================="

# 检查Docker和Docker Compose
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose未安装，请先安装Docker Compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker环境检查通过${NC}"
}

# 创建必要的目录
create_directories() {
    echo -e "${YELLOW}创建必要目录...${NC}"
    mkdir -p data logs ssl
    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 检查环境变量文件
check_env_file() {
    echo -e "${YELLOW}检查环境变量配置...${NC}"
    
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  未找到.env文件，从示例文件创建...${NC}"
        if [ -f docker.env.example ]; then
            cp docker.env.example .env
            echo -e "${YELLOW}📝 请编辑.env文件配置您的环境变量${NC}"
            echo -e "${YELLOW}特别注意修改API_KEY和其他敏感信息${NC}"
        else
            echo -e "${RED}❌ 未找到docker.env.example文件${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 环境变量文件存在${NC}"
    fi
}

# 构建和启动服务
deploy_services() {
    echo -e "${YELLOW}构建和启动服务...${NC}"
    
    # 停止现有服务
    echo "停止现有服务..."
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    echo "构建Docker镜像..."
    docker-compose build --no-cache
    
    # 启动基础服务
    echo "启动PromptHub服务..."
    docker-compose up -d prompthub
    
    echo -e "${GREEN}✅ 基础服务启动完成${NC}"
}

# 可选服务部署
deploy_optional_services() {
    echo -e "${YELLOW}是否启动可选服务？${NC}"
    
    # PostgreSQL数据库
    read -p "启动本地PostgreSQL数据库? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "启动PostgreSQL..."
        docker-compose --profile local-db up -d postgres
        echo -e "${GREEN}✅ PostgreSQL已启动${NC}"
    fi
    
    # Redis缓存
    read -p "启动Redis缓存? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "启动Redis..."
        docker-compose --profile cache up -d redis
        echo -e "${GREEN}✅ Redis已启动${NC}"
    fi
    
    # Nginx代理
    read -p "启动Nginx反向代理? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "启动Nginx..."
        docker-compose --profile proxy up -d nginx
        echo -e "${GREEN}✅ Nginx已启动${NC}"
        echo -e "${BLUE}📝 通过 http://localhost 访问应用${NC}"
    fi
}

# 显示服务状态
show_status() {
    echo -e "${YELLOW}服务状态:${NC}"
    docker-compose ps
    
    echo -e "\n${YELLOW}服务日志 (最近10行):${NC}"
    docker-compose logs --tail=10 prompthub
}

# 显示访问信息
show_access_info() {
    echo -e "\n${GREEN}🎉 部署完成！${NC}"
    echo "=================================="
    echo -e "${BLUE}📱 Web应用: http://localhost:9011${NC}"
    echo -e "${BLUE}🔧 MCP API: http://localhost:9010${NC}"
    
    if docker-compose ps nginx | grep -q "Up"; then
        echo -e "${BLUE}🌐 Nginx代理: http://localhost${NC}"
    fi
    
    echo -e "\n${YELLOW}常用命令:${NC}"
    echo "查看日志: docker-compose logs -f"
    echo "重启服务: docker-compose restart"
    echo "停止服务: docker-compose down"
    echo "更新服务: ./deploy-docker.sh"
}

# 主函数
main() {
    check_dependencies
    create_directories
    check_env_file
    deploy_services
    
    # 等待服务启动
    echo -e "${YELLOW}等待服务启动...${NC}"
    sleep 10
    
    deploy_optional_services
    show_status
    show_access_info
}

# 如果直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 