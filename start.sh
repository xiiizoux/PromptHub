#!/bin/bash
# start.sh - 一键启动Prompt Hub前后端服务

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

# 设置端口，如果环境变量不存在则使用默认值
MCP_PORT=${MCP_PORT:-9010}
WEB_PORT=${WEB_PORT:-9011}

# 当前目录路径
PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)

# 检查端口是否被占用
check_port() {
  local port=$1
  local service_name=$2
  
  local pid=$(lsof -i :$port -t 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo -e "${RED}错误: 端口 $port 已被占用 (PID: $pid)${NC}"
    echo -e "${YELLOW}请先运行 ./stop.sh 停止现有服务${NC}"
    return 1
  fi
  return 0
}

# 清理旧的PID文件
cleanup_old_pids() {
  echo -e "${YELLOW}清理旧的PID文件...${NC}"
  if [ -f "$PROJECT_DIR/mcp.pid" ]; then
    rm "$PROJECT_DIR/mcp.pid"
  fi
  if [ -f "$PROJECT_DIR/web.pid" ]; then
    rm "$PROJECT_DIR/web.pid"
  fi
}

# 启动服务并记录PID
start_service() {
  local service_dir=$1
  local service_name=$2
  local pid_file=$3
  local port=$4
  
  echo -e "${YELLOW}正在启动$service_name (端口: $port)...${NC}"
  
  cd "$PROJECT_DIR/$service_dir"
  
  # 设置环境变量
  if [ "$service_name" = "web" ]; then
    export FRONTEND_PORT=$port
  fi
  
  # 启动服务并获取PID
  npm run dev > /tmp/${service_name}.log 2>&1 &
  local service_pid=$!
  
  # 记录PID
  echo $service_pid > "$PROJECT_DIR/$pid_file"
  
  echo "  PID: $service_pid"
  echo "  日志文件: /tmp/${service_name}.log"
  
  # 返回原目录
  cd "$PROJECT_DIR"
  
  return 0
}

# 检查端口
echo -e "${YELLOW}检查端口可用性...${NC}"
if ! check_port $MCP_PORT "MCP服务"; then
  exit 1
fi

if ! check_port $WEB_PORT "Web服务"; then
  exit 1
fi

# 清理旧的PID文件
cleanup_old_pids

# 编译MCP服务代码
echo -e "${YELLOW}正在编译MCP服务代码...${NC}"
cd "$PROJECT_DIR/mcp"
if npm run build; then
echo -e "${GREEN}✓ MCP服务代码编译成功${NC}"
else
  echo -e "${RED}✗ MCP服务代码编译失败${NC}"
  exit 1
fi
cd "$PROJECT_DIR"

# 启动MCP服务
start_service "mcp" "mcp" "mcp.pid" $MCP_PORT

# 启动Web服务
start_service "web" "web" "web.pid" $WEB_PORT

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 验证服务是否正常运行
echo -e "${YELLOW}验证服务状态...${NC}"

# 检查MCP服务
mcp_running=$(lsof -i :$MCP_PORT -t 2>/dev/null)
if [ ! -z "$mcp_running" ]; then
  echo -e "${GREEN}✓ MCP服务运行正常 (PID: $mcp_running)${NC}"
else
  echo -e "${RED}✗ MCP服务启动失败${NC}"
  echo "  查看日志: tail -f /tmp/mcp.log"
fi

# 检查Web服务  
web_running=$(lsof -i :$WEB_PORT -t 2>/dev/null)
if [ ! -z "$web_running" ]; then
  echo -e "${GREEN}✓ Web服务运行正常 (PID: $web_running)${NC}"
else
  echo -e "${RED}✗ Web服务启动失败${NC}"
  echo "  查看日志: tail -f /tmp/web.log"
fi

echo ""
echo -e "${GREEN}服务启动完成!${NC}"
echo -e "${GREEN}✓ MCP服务: http://localhost:$MCP_PORT${NC}"
echo -e "${GREEN}✓ Web服务: http://localhost:$WEB_PORT${NC}"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo -e "  停止服务: ./stop.sh"
echo -e "  查看日志: tail -f /tmp/mcp.log 或 tail -f /tmp/web.log"
echo -e "  检查状态: ps aux | grep -E 'next|tsx'"
