#!/bin/bash
# docker-start.sh - 用于Docker容器中启动PromptHub前后端服务

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}在Docker环境中启动PromptHub服务...${NC}"

# 设置端口，使用环境变量或默认值
BACKEND_PORT=${PORT:-9010}
FRONTEND_PORT=${FRONTEND_PORT:-9011}

# 当前目录路径
PROJECT_DIR=$(pwd)

# 检查Supabase环境变量
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}警告: 未设置Supabase环境变量，使用本地文件存储${NC}"
  export STORAGE_TYPE=file
  export FORCE_LOCAL_STORAGE=true
fi

# 启动MCP服务
echo -e "${YELLOW}正在启动MCP服务 (端口: $BACKEND_PORT)...${NC}"
cd $PROJECT_DIR/mcp && node dist/api/index.js &
BACKEND_PID=$!

# 等待后端启动
echo -e "${YELLOW}等待后端服务启动...${NC}"
sleep 5

# 检查MCP服务是否成功启动
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${RED}MCP服务启动失败!${NC}"
  exit 1
fi

# 启动Web服务 - 使用Next.js
echo -e "${YELLOW}正在启动Web服务 (端口: $FRONTEND_PORT)...${NC}"
cd $PROJECT_DIR/web && npm start &
FRONTEND_PID=$!

# 等待前端启动
sleep 3

# 检查前端是否成功启动
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${RED}前端服务启动失败!${NC}"
  kill $BACKEND_PID
  exit 1
fi

echo -e "${GREEN}✓ 服务启动完成!${NC}"
echo -e "${GREEN}✓ MCP服务运行于: http://localhost:$BACKEND_PORT${NC}"
echo -e "${GREEN}✓ Web服务运行于: http://localhost:$FRONTEND_PORT${NC}"

# 保持脚本运行，这样容器不会退出
# 同时监听进程状态，如果任一进程退出则退出容器
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
  sleep 10
done

# 如果到达这里，说明至少有一个进程已经结束
echo -e "${RED}一个或多个服务已停止，退出容器...${NC}"
exit 1
