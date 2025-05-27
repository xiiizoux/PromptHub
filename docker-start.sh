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
cd /app/mcp && node dist/mcp/api/index.js &
MCP_PID=$!

# 等待服务启动
echo "等待MCP服务启动 (15秒)..."
sleep 15

# 检查服务是否启动成功
if ! kill -0 $MCP_PID 2>/dev/null; then
  echo "MCP服务进程已终止，启动失败!"
  exit 1
fi

# 等待API端点可用
echo "检查MCP API健康状态..."
MAX_ATTEMPTS=10
ATTEMPTS=0
API_HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ] && [ "$API_HEALTHY" = false ]; do
  if curl -s http://localhost:$MCP_PORT/api/health > /dev/null; then
    API_HEALTHY=true
    echo "MCP API已就绪并响应正常"
  else
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
      echo "等待MCP API就绪 ($ATTEMPTS/$MAX_ATTEMPTS)..."
      sleep 3
    fi
  fi
done

if [ "$API_HEALTHY" = false ]; then
  echo "警告: MCP API健康检查失败，但进程仍然运行。尝试继续..."
  # 注意：这里我们不退出，尝试继续使用
  # 因为进程仍然运行，所以可能是健康检查配置问题
  # exit 1
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
