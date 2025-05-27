#!/bin/bash
# docker-start.sh - 用于Docker容器中启动PromptHub MCP服务和Web应用

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}在Docker环境中启动PromptHub服务...${NC}"

# 设置端口，使用环境变量或默认值
MCP_PORT=${PORT:-9010}
WEB_PORT=${FRONTEND_PORT:-9011}

# 当前目录路径
PROJECT_DIR=$(pwd)

# 检查Supabase环境变量
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}警告: 未设置Supabase环境变量，使用本地文件存储${NC}"
  export STORAGE_TYPE=file
  export FORCE_LOCAL_STORAGE=true
fi

# 启动MCP服务
echo -e "${YELLOW}正在启动MCP服务 (端口: $MCP_PORT)...${NC}"

# 检查关键依赖是否存在
cd $PROJECT_DIR/mcp
if [ ! -f "./node_modules/.bin/dotenv" ] || [ ! -f "./node_modules/.bin/tsx" ]; then
  echo -e "${YELLOW}警告: 检测到关键依赖缺失，尝试安装...${NC}"
  npm install --save-dev dotenv-cli@latest tsx@latest
  npm install --save dotenv@latest
  npm install
fi

# 优先使用编译后的代码，如果存在
if [ -f "$PROJECT_DIR/mcp/dist/api/index.js" ]; then
  echo -e "${GREEN}使用编译后的代码启动MCP服务${NC}"
  NODE_ENV=production npm run start:prod &
  MCP_PID=$!
else
  # 如果编译后的代码不存在，使用开发脚本
  echo -e "${YELLOW}未找到编译后的代码，使用start脚本启动MCP服务${NC}"
  NODE_ENV=production npm run start &
  MCP_PID=$!
fi

# 等待MCP服务启动
echo -e "${YELLOW}等待MCP服务启动...${NC}"
sleep 5

# 检查MCP服务是否成功启动
if ! kill -0 $MCP_PID 2>/dev/null; then
  echo -e "${RED}MCP服务启动失败!${NC}"
  exit 1
fi

# 启动Web服务 - 使用Next.js
echo -e "${YELLOW}正在启动Web服务 (端口: $WEB_PORT)...${NC}"
cd $PROJECT_DIR/web && npm start &
WEB_PID=$!

# 等待Web应用启动
sleep 3

# 检查Web应用是否成功启动
if ! kill -0 $WEB_PID 2>/dev/null; then
  echo -e "${RED}Web应用启动失败!${NC}"
  kill $MCP_PID
  exit 1
fi

echo -e "${GREEN}✓ 服务启动完成!${NC}"
echo -e "${GREEN}✓ MCP服务运行于: http://localhost:$MCP_PORT${NC}"
echo -e "${GREEN}✓ Web服务运行于: http://localhost:$WEB_PORT${NC}"

# 保持脚本运行，这样容器不会退出
# 同时监听进程状态，如果任一进程退出则退出容器
while kill -0 $MCP_PID 2>/dev/null && kill -0 $WEB_PID 2>/dev/null; do
  sleep 10
done

# 如果到达这里，说明至少有一个进程已经结束
echo -e "${RED}一个或多个服务已停止，退出容器...${NC}"
exit 1
