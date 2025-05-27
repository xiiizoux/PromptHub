#!/bin/bash
# stop.sh - 简化的Prompt Hub停止脚本

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在停止Prompt Hub...${NC}"

# 通过端口停止服务
stop_by_port() {
  local port=$1
  local service_name=$2
  
  local pids=$(lsof -i :$port -t 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}停止端口 $port 上的 $service_name...${NC}"
    for pid in $pids; do
      kill -TERM "$pid" 2>/dev/null
    done
    
    # 等待进程退出
    sleep 2
    
    # 检查是否还有进程，如果有则强制终止
    local remaining_pids=$(lsof -i :$port -t 2>/dev/null)
    if [ ! -z "$remaining_pids" ]; then
      echo -e "${YELLOW}强制停止 $service_name...${NC}"
      for pid in $remaining_pids; do
        kill -9 "$pid" 2>/dev/null
      done
    fi
    echo -e "${GREEN}✓ $service_name 已停止${NC}"
  else
    echo -e "${YELLOW}端口 $port 上没有运行的服务${NC}"
  fi
}

# 停止服务
echo -e "${YELLOW}停止服务...${NC}"

# 通过端口停止服务
stop_by_port 9010 "MCP服务"
stop_by_port 9011 "Web服务"

# 验证服务状态
echo -e "${YELLOW}验证服务状态...${NC}"

if lsof -i :9010 >/dev/null 2>&1 || lsof -i :9011 >/dev/null 2>&1; then
  echo -e "${RED}✗ 警告: 仍有服务在运行${NC}"
  if lsof -i :9010 >/dev/null 2>&1; then
    echo -e "  端口 9010 仍被占用"
  fi
  if lsof -i :9011 >/dev/null 2>&1; then
    echo -e "  端口 9011 仍被占用"
  fi
else
  echo -e "${GREEN}✓ 所有服务已停止${NC}"
fi

echo ""
echo -e "${GREEN}服务停止完成!${NC}"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo -e "  启动服务: ./start.sh"
echo -e "  检查端口: lsof -i :9010 -i :9011"
