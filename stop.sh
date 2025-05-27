#!/bin/bash
# stop.sh - 一键关闭Prompt Hub前后端服务

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在关闭Prompt Hub...${NC}"

# 关闭指定端口上的进程
kill_by_port() {
  local port=$1
  local service_name=$2
  
  echo -e "${YELLOW}正在关闭$service_name (端口: $port)...${NC}"
  
  # 查找监听指定端口的进程
  local pids=$(lsof -i :$port -t 2>/dev/null)
  
  if [ ! -z "$pids" ]; then
    for pid in $pids; do
      echo -e "  终止进程 $pid"
      kill -TERM $pid 2>/dev/null || true
    done
    
    # 等待2秒让进程优雅退出
    sleep 2
    
    # 检查是否还有进程在运行，如果有则强制杀死
    local remaining_pids=$(lsof -i :$port -t 2>/dev/null)
    if [ ! -z "$remaining_pids" ]; then
      echo -e "  强制终止残留进程..."
      for pid in $remaining_pids; do
        kill -9 $pid 2>/dev/null || true
      done
    fi
    echo -e "${GREEN}✓ $service_name 已停止${NC}"
  else
    echo -e "  端口 $port 上没有运行的服务"
  fi
}

# 通过进程名查找并终止进程
kill_by_name() {
  local pattern=$1
  local service_name=$2
  
  echo -e "${YELLOW}正在查找并关闭 $service_name...${NC}"
  
  local pids=$(pgrep -f "$pattern" 2>/dev/null)
  
  if [ ! -z "$pids" ]; then
    for pid in $pids; do
      local process_name=$(ps -p $pid -o comm= 2>/dev/null)
      echo -e "  终止进程 $pid ($process_name)"
      kill -TERM $pid 2>/dev/null || true
    done
    
    # 等待2秒让进程优雅退出
    sleep 2
    
    # 检查是否还有进程在运行，如果有则强制杀死
    local remaining_pids=$(pgrep -f "$pattern" 2>/dev/null)
    if [ ! -z "$remaining_pids" ]; then
      echo -e "  强制终止残留进程..."
      for pid in $remaining_pids; do
        kill -9 $pid 2>/dev/null || true
      done
    fi
    echo -e "${GREEN}✓ $service_name 已停止${NC}"
  else
    echo -e "  没有找到匹配的进程"
  fi
}

# 清理PID文件
cleanup_pid_files() {
  local project_dir=$(cd "$(dirname "$0")" && pwd)
  
  echo -e "${YELLOW}清理PID文件...${NC}"
  
  local cleaned=0
  if [ -f "$project_dir/mcp.pid" ]; then
    echo -e "  清理 MCP PID 文件"
    rm "$project_dir/mcp.pid"
    cleaned=1
  fi
  
  if [ -f "$project_dir/web.pid" ]; then
    echo -e "  清理 Web PID 文件"  
    rm "$project_dir/web.pid"
    cleaned=1
  fi
  
  if [ $cleaned -eq 1 ]; then
    echo -e "${GREEN}✓ PID文件已清理${NC}"
  else
    echo -e "  没有找到PID文件"
  fi
}

echo ""
echo -e "${YELLOW}第一步: 通过端口关闭服务...${NC}"
kill_by_port 9010 "MCP服务"
kill_by_port 9011 "Web服务"

echo ""
echo -e "${YELLOW}第二步: 通过进程名关闭相关进程...${NC}"
kill_by_name "tsx.*src/index.ts" "MCP进程"
kill_by_name "next dev.*9011" "Next.js开发服务器"
kill_by_name "next-router-worker" "Next.js路由工作进程"

echo ""
echo -e "${YELLOW}第三步: 清理文件...${NC}"
cleanup_pid_files

echo ""
echo -e "${YELLOW}验证服务状态...${NC}"
remaining_9010=$(lsof -i :9010 -t 2>/dev/null)
remaining_9011=$(lsof -i :9011 -t 2>/dev/null)

if [ ! -z "$remaining_9010" ] || [ ! -z "$remaining_9011" ]; then
  echo -e "${RED}✗ 警告: 仍有进程在运行指定端口${NC}"
  if [ ! -z "$remaining_9010" ]; then
    local process_name=$(ps -p $remaining_9010 -o comm= 2>/dev/null)
    echo -e "  端口 9010: PID $remaining_9010 ($process_name)"
  fi
  if [ ! -z "$remaining_9011" ]; then
    local process_name=$(ps -p $remaining_9011 -o comm= 2>/dev/null)
    echo -e "  端口 9011: PID $remaining_9011 ($process_name)"
  fi
else
  echo -e "${GREEN}✓ 所有端口已释放${NC}"
fi

echo ""
echo -e "${GREEN}服务关闭完成!${NC}"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo -e "  启动服务: ./start.sh"
echo -e "  检查状态: ps aux | grep -E 'next|tsx'"
echo -e "  检查端口: lsof -i :9010 -i :9011"
