#!/bin/bash
# docker-start.sh - PromptHub容器启动脚本

# 全局变量
MCP_PORT=9010
WEB_PORT=9011

echo "启动PromptHub服务..."

# 加载用户的.env文件如果存在
if [ -f /app/.env ]; then
  echo "找到用户提供的.env文件，将进行加载"
  set -a
  . /app/.env
  set +a
fi

# 设置基本环境变量
export MCP_PORT=${MCP_PORT}
export WEB_PORT=${WEB_PORT}
export NODE_ENV=production

# 为UI库设置足够的内存
export NODE_OPTIONS="--max-old-space-size=4096"

# 确保关键环境变量存在，即使用户没有提供
# 设置存储类型，默认使用supabase
export STORAGE_TYPE=${STORAGE_TYPE:-supabase}
# 注意: FORCE_LOCAL_STORAGE已经被移除，不再支持

# 设置虚拟Supabase参数，避免连接错误
# 只有当用户没有提供这些参数时才会使用这些虚拟值
export SUPABASE_URL=${SUPABASE_URL:-http://localhost:54321}
export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU}

# 复制到Web服务的环境变量
export NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

echo "环境变量设置完成"

# 创建数据目录
mkdir -p /app/mcp/data

# ====== 启动MCP服务 ======
echo "正在启动MCP服务 (端口: $MCP_PORT)..."

cd /app/mcp

# 确保所有上下文环境变量都设置好
echo "初始化MCP服务环境变量..."
export NODE_ENV=production
# 使用之前设置的STORAGE_TYPE环境变量
# FORCE_LOCAL_STORAGE环境变量已经被移除
export API_KEY=default-api-key-for-docker

# 先运行引号修复脚本
echo "运行代码修复脚本修复潜在的引号问题..."
cd /app/mcp && node fix-quotes.js

# 修复enum语法问题
echo "运行修复脚本处理enum语法问题..."
cd /app && node fix-docker-enum.cjs

# 修复重复导入问题
echo "运行修复脚本处理重复导入问题..."
cd /app && node fix-docker-import.cjs

# 直接使用node运行编译后的代码
echo "尝试使用编译后的代码启动MCP服务"
# 使用正确的路径启动MCP服务
# 根据容器中的实际路径启动
cd /app/mcp && node dist/src/index.js > /app/logs/mcp.log 2>&1 &

MCP_PID=$!

# 等待服务启动
echo "等待MCP服务启动 (15秒)..."
sleep 15

# 检查服务是否还在运行
if ! kill -0 $MCP_PID 2>/dev/null; then
  echo "MCP服务进程已终止，启动失败!"
  # 显示日志以帮助诊断
  echo "显示MCP日志最后几行:"
  tail -n 20 /app/logs/mcp.log
  exit 1
fi

# ====== 启动Web服务 ======
echo "正在启动Web服务 (端口: $WEB_PORT)..."

cd /app/web

# 检查并安装必要依赖
echo "检查Web服务必要依赖..."
npm install

# 使用环境变量启动Web服务
echo "启动Next.js Web服务"
# 使用next start命令启动Next.js应用
NODE_ENV=production PORT=$WEB_PORT npx next start > /app/logs/web.log 2>&1 &
WEB_PID=$!

# 等待Web服务启动
echo "等待Web服务启动 (10秒)..."
sleep 10

# 检查Web服务是否还在运行
if ! kill -0 $WEB_PID 2>/dev/null; then
  echo "Web服务进程已终止，启动失败!"
  # 显示日志以帮助诊断
  echo "显示Web日志最后几行:"
  tail -n 20 /app/logs/web.log
  exit 1
fi

# 显示成功信息
echo "===================================="
echo "所有服务启动成功!"
echo "MCP服务: http://localhost:$MCP_PORT"
echo "Web服务: http://localhost:$WEB_PORT"
echo "===================================="

# 保持容器运行
echo "服务已成功启动，监控日志..."
tail -f /app/logs/mcp.log /app/logs/web.log

echo "一个或多个服务已停止，退出容器..."
exit 1 