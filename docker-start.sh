#!/bin/bash
# 简化版Docker启动脚本

echo "启动PromptHub服务..."

# 设置端口
MCP_PORT=${PORT:-9010}
WEB_PORT=${FRONTEND_PORT:-9011}

# 检查Supabase环境变量
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "警告: 未设置Supabase环境变量，使用本地文件存储"
  export STORAGE_TYPE=file
  export FORCE_LOCAL_STORAGE=true
fi

# 启动MCP服务
echo "正在启动MCP服务 (端口: $MCP_PORT)..."
cd /app/mcp && node dist/api/index.js &
MCP_PID=$!

# 等待服务启动
sleep 5

# 检查服务是否启动成功
if ! kill -0 $MCP_PID 2>/dev/null; then
  echo "MCP服务启动失败!"
  exit 1
fi

# 启动Web服务
echo "正在启动Web服务 (端口: $WEB_PORT)..."
cd /app/web && npm start &
WEB_PID=$!

# 等待服务启动
sleep 3

# 检查服务是否启动成功
if ! kill -0 $WEB_PID 2>/dev/null; then
  echo "Web服务启动失败!"
  kill $MCP_PID
  exit 1
fi

echo "服务启动完成!"
echo "MCP服务运行于: http://localhost:$MCP_PORT"
echo "Web服务运行于: http://localhost:$WEB_PORT"

# 保持容器运行
while kill -0 $MCP_PID 2>/dev/null && kill -0 $WEB_PID 2>/dev/null; do
  sleep 10
done

echo "一个或多个服务已停止，退出容器..."
exit 1
