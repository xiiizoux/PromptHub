#!/bin/bash
# test-docker.sh - 测试Docker构建和运行

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 PromptHub Docker测试脚本${NC}"
echo "=================================="

# 清理旧镜像和容器
cleanup() {
    echo -e "${YELLOW}清理旧的测试容器和镜像...${NC}"
    docker stop prompthub-test 2>/dev/null || true
    docker rm prompthub-test 2>/dev/null || true
    docker rmi prompthub-test 2>/dev/null || true
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 构建镜像
build_image() {
    echo -e "${YELLOW}构建Docker镜像...${NC}"
    if docker build -t prompthub-test . --no-cache; then
        echo -e "${GREEN}✅ Docker镜像构建成功${NC}"
        return 0
    else
        echo -e "${RED}❌ Docker镜像构建失败${NC}"
        return 1
    fi
}

# 创建测试环境变量文件
create_test_env() {
    echo -e "${YELLOW}创建测试环境变量...${NC}"
    cat > .env.test << EOF
NODE_ENV=production
API_KEY=test-api-key-123
PORT=9010
FRONTEND_PORT=9011
TRANSPORT_TYPE=sse
STORAGE_TYPE=file
FORCE_LOCAL_STORAGE=true
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:9011
EOF
    echo -e "${GREEN}✅ 测试环境变量文件创建完成${NC}"
}

# 运行容器
run_container() {
    echo -e "${YELLOW}启动测试容器...${NC}"
    docker run -d \
        --name prompthub-test \
        -p 9010:9010 \
        -p 9011:9011 \
        --env-file .env.test \
        prompthub-test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 容器启动成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 容器启动失败${NC}"
        return 1
    fi
}

# 等待服务启动
wait_for_services() {
    echo -e "${YELLOW}等待服务启动...${NC}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:9010/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ MCP服务启动成功${NC}"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ MCP服务启动超时${NC}"
            return 1
        fi
        
        echo -e "${YELLOW}等待MCP服务启动... (${attempt}/${max_attempts})${NC}"
        sleep 5
        ((attempt++))
    done
    
    # 测试Web服务
    if curl -s http://localhost:9011 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web服务启动成功${NC}"
    else
        echo -e "${YELLOW}⚠️ Web服务可能需要更多时间启动${NC}"
    fi
}

# 测试API
test_api() {
    echo -e "${YELLOW}测试API功能...${NC}"
    
    # 测试健康检查
    if response=$(curl -s http://localhost:9010/api/health); then
        echo -e "${GREEN}✅ 健康检查API正常${NC}"
        echo "响应: $response"
    else
        echo -e "${RED}❌ 健康检查API失败${NC}"
        return 1
    fi
    
    # 测试分类API
    if response=$(curl -s -H "Authorization: Bearer test-api-key-123" http://localhost:9010/api/categories); then
        echo -e "${GREEN}✅ 分类API正常${NC}"
        echo "响应: $response"
    else
        echo -e "${YELLOW}⚠️ 分类API测试需要更多配置${NC}"
    fi
}

# 显示日志
show_logs() {
    echo -e "${YELLOW}容器日志 (最近20行):${NC}"
    docker logs --tail=20 prompthub-test
}

# 清理测试环境
cleanup_test() {
    echo -e "${YELLOW}清理测试环境...${NC}"
    docker stop prompthub-test 2>/dev/null || true
    docker rm prompthub-test 2>/dev/null || true
    rm -f .env.test
    echo -e "${GREEN}✅ 测试环境清理完成${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}开始Docker测试...${NC}"
    
    # 清理
    cleanup
    
    # 构建
    if ! build_image; then
        exit 1
    fi
    
    # 创建测试环境
    create_test_env
    
    # 运行容器
    if ! run_container; then
        cleanup_test
        exit 1
    fi
    
    # 等待服务启动
    if ! wait_for_services; then
        show_logs
        cleanup_test
        exit 1
    fi
    
    # 测试API
    test_api
    
    # 显示状态
    echo -e "\n${GREEN}🎉 Docker测试完成！${NC}"
    echo -e "${BLUE}📱 Web应用: http://localhost:9011${NC}"
    echo -e "${BLUE}🔧 MCP API: http://localhost:9010${NC}"
    
    echo -e "\n${YELLOW}常用命令:${NC}"
    echo "查看日志: docker logs -f prompthub-test"
    echo "停止容器: docker stop prompthub-test"
    echo "清理测试: ./test-docker.sh cleanup"
    
    # 如果第一个参数是 cleanup，则清理并退出
    if [ "$1" = "cleanup" ]; then
        cleanup_test
    fi
}

# 处理命令行参数
if [ "$1" = "cleanup" ]; then
    cleanup_test
    exit 0
fi

# 运行主函数
main "$@" 