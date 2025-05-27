#!/bin/bash
# start.sh - 简化的Prompt Hub启动脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在启动Prompt Hub...${NC}"

# 加载环境变量
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 检查端口是否被占用
check_port() {
  local port=$1
  local service_name=$2
  
  if lsof -i :$port >/dev/null 2>&1; then
    echo -e "${RED}错误: 端口 $port 已被占用${NC}"
    echo -e "${YELLOW}请先运行 ./stop.sh 停止现有服务${NC}"
    return 1
  fi
  return 0
}

# 检查端口
echo -e "${YELLOW}检查端口可用性...${NC}"
if ! check_port 9010 "MCP服务"; then
  exit 1
fi

if ! check_port 9011 "Web服务"; then
  exit 1
fi

# 检查并安装依赖
echo -e "${YELLOW}检查依赖...${NC}"

# 检查MCP依赖
if [ ! -d "mcp/node_modules" ]; then
  echo -e "${YELLOW}安装MCP服务依赖...${NC}"
  if ! npm run mcp:install; then
    echo -e "${RED}✗ MCP依赖安装失败${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ MCP依赖安装成功${NC}"
fi

# 检查Web依赖
if [ ! -d "web/node_modules" ]; then
  echo -e "${YELLOW}安装Web应用依赖...${NC}"
  if ! npm run web:install; then
    echo -e "${RED}✗ Web依赖安装失败${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Web依赖安装成功${NC}"
fi

# 检查Supabase共享模块依赖
if [ ! -d "supabase/node_modules" ]; then
  echo -e "${YELLOW}安装Supabase共享模块依赖...${NC}"
  if ! (cd supabase && npm install); then
    echo -e "${RED}✗ Supabase共享模块依赖安装失败${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Supabase共享模块依赖安装成功${NC}"
fi

# 构建MCP服务
echo -e "${YELLOW}构建MCP服务...${NC}"
if ! npm run mcp:build; then
  echo -e "${RED}✗ MCP服务构建失败${NC}"
  echo -e "${YELLOW}提示: 请检查TypeScript是否正确安装${NC}"
  echo -e "${YELLOW}尝试手动安装: cd mcp && npm install${NC}"
  exit 1
fi

echo -e "${GREEN}✓ MCP服务构建成功${NC}"

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"

# 启动MCP服务（后台运行）
npm run mcp:dev > /tmp/mcp.log 2>&1 &
MCP_PID=$!
echo $MCP_PID > mcp.pid

# 启动Web服务（后台运行）
npm run web:dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > web.pid

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 验证服务状态
echo -e "${YELLOW}验证服务状态...${NC}"

if lsof -i :9010 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ MCP服务运行正常 (端口: 9010)${NC}"
else
  echo -e "${RED}✗ MCP服务启动失败${NC}"
  echo "  查看日志: tail -f /tmp/mcp.log"
fi

if lsof -i :9011 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Web服务运行正常 (端口: 9011)${NC}"
else
  echo -e "${RED}✗ Web服务启动失败${NC}"
  echo "  查看日志: tail -f /tmp/web.log"
fi

echo ""
echo -e "${GREEN}服务启动完成!${NC}"
echo -e "${GREEN}✓ MCP服务: http://localhost:9010${NC}"
echo -e "${GREEN}✓ Web服务: http://localhost:9011${NC}"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo -e "  停止服务: ./stop.sh"
echo -e "  查看日志: tail -f /tmp/mcp.log 或 tail -f /tmp/web.log"
echo -e "  MCP测试: npm run mcp:test"
