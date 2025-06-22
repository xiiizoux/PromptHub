#!/bin/bash
# docker-start.sh - PromptHub多功能管理脚本
# 用法: 
#   ./docker-start.sh            - 启动服务(默认)
#   ./docker-start.sh start      - 启动服务
#   ./docker-start.sh rebuild    - 重建并启动
#   ./docker-start.sh diagnose   - 诊断问题
#   ./docker-start.sh stop       - 停止服务

# 全局变量
MCP_PORT=9010
WEB_PORT=9011
COMMAND=${1:-start}

# 函数定义
show_help() {
    echo "PromptHub Docker 管理脚本"
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start      启动服务 (默认)"
    echo "  rebuild    重建镜像并启动"
    echo "  diagnose   诊断部署问题"
    echo "  stop       停止服务"
    echo "  help       显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0           # 启动服务"
    echo "  $0 rebuild   # 重建并启动"
    echo "  $0 diagnose  # 诊断问题"
}

diagnose_deployment() {
    echo "🔍 PromptHub Docker 部署诊断..."
    echo "=================================="
    
    echo "1. 检查Docker容器状态:"
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        echo "docker-compose 未安装"
        return 1
    fi
    
    echo ""
    echo "2. 检查端口占用:"
    netstat -tulpn | grep -E "(9010|9011)" || echo "没有发现9010/9011端口服务"
    
    echo ""
    echo "3. 检查最近的日志:"
    echo "--- 容器日志 (最近30行) ---"
    docker-compose logs --tail=30 prompthub || echo "无法获取日志"
    
    echo ""
    echo "4. 检查容器内部文件:"
    echo "--- 检查MCP编译文件 ---"
    docker-compose exec prompthub ls -la /app/mcp/dist/src/ 2>/dev/null || echo "无法访问MCP编译文件"
    
    echo "--- 检查Web构建文件 ---"
    docker-compose exec prompthub ls -la /app/web/.next/ 2>/dev/null || echo "无法访问Web构建文件"
    
    echo ""
    echo "5. 测试服务连接:"
    echo -n "MCP服务 (9010): "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9010 2>/dev/null || echo "无法连接"
    echo -n "Web服务 (9011): "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9011 2>/dev/null || echo "无法连接"
    
    echo ""
    echo "=================================="
    echo "诊断完成！"
    echo ""
    echo "常见问题解决:"
    echo "  - 如果服务未启动: $0 start"
    echo "  - 如果有编译问题: $0 rebuild"
    echo "  - 查看实时日志: docker-compose logs -f"
}

rebuild_deployment() {
    echo "🔨 重建PromptHub Docker镜像..."
    
    # 停止现有容器
    echo "停止现有容器..."
    docker-compose down
    
    # 删除现有镜像（强制重建）
    echo "删除现有镜像..."
    docker rmi $(docker images "prompthub*" -q) 2>/dev/null || echo "没有找到现有镜像"
    
    # 清理Docker构建缓存
    echo "清理Docker构建缓存..."
    docker builder prune -f
    
    # 检查关键修复文件
    echo "检查修复文件..."
    if [ ! -f "web/src/lib/dom-utils.ts" ]; then
        echo "❌ 警告: dom-utils.ts 文件不存在"
    else
        echo "✅ 修复文件存在"
    fi
    
    # 重新构建镜像
    echo "重新构建Docker镜像..."
    if docker-compose build --no-cache; then
        echo "✅ 构建成功"
        # 启动服务
        echo "启动服务..."
        docker-compose up -d
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 10
        
        # 显示状态
        echo "服务状态:"
        docker-compose ps
        
        echo ""
        echo "🎉 重建完成！"
        echo "前端访问: http://localhost:9011"
        echo "后端API: http://localhost:9010"
    else
        echo "❌ 构建失败"
        return 1
    fi
}

stop_deployment() {
    echo "停止PromptHub服务..."
    docker-compose down
    echo "✅ 服务已停止"
}

start_deployment() {
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
# 🔧 修复: 完全移除系统级API密钥设置，依赖数据库验证
# MCP服务器现在将通过Supabase验证所有用户API密钥
echo "ℹ️  MCP服务器将通过Supabase数据库验证用户API密钥"
echo "📡 Supabase配置: ${SUPABASE_URL}"

# 确保不设置任何系统级API密钥，强制使用数据库验证
unset API_KEY
unset SERVER_KEY

# 启动MCP服务
echo "启动MCP服务..."

# 检查编译后的文件是否存在
if [ -f "/app/mcp/dist/src/index.js" ]; then
  echo "使用编译后的文件启动MCP服务"
  cd /app/mcp && node dist/src/index.js > /app/logs/mcp.log 2>&1 &
else
  echo "编译文件不存在，使用tsx直接运行源码"
  cd /app/mcp && npx tsx src/index.ts > /app/logs/mcp.log 2>&1 &
fi

MCP_PID=$!
echo "MCP_PID=$MCP_PID" > /app/logs/mcp.pid

# 等待MCP服务启动
echo "等待MCP服务启动..."
for i in {1..30}; do
  if curl -s http://localhost:$MCP_PORT/api/health > /dev/null 2>&1; then
    echo "✅ MCP服务启动成功"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ MCP服务启动超时"
    echo "显示MCP日志:"
    tail -n 20 /app/logs/mcp.log
    exit 1
  fi
  sleep 2
done

# ====== 启动Web服务 ======
echo "正在启动Web服务 (端口: $WEB_PORT)..."

cd /app/web

# 检查构建文件是否存在
if [ ! -d "/app/web/.next" ]; then
  echo "❌ Web应用构建文件不存在"
  echo "请确保在构建Docker镜像时Web应用已正确构建"
  exit 1
fi

# 启动Next.js Web服务
echo "启动Next.js Web服务..."
NODE_ENV=production PORT=$WEB_PORT npx next start > /app/logs/web.log 2>&1 &
WEB_PID=$!
echo "WEB_PID=$WEB_PID" > /app/logs/web.pid

# 等待Web服务启动
echo "等待Web服务启动..."
for i in {1..30}; do
  if curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
    echo "✅ Web服务启动成功"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Web服务启动超时"
    echo "显示Web日志:"
    tail -n 20 /app/logs/web.log
    exit 1
  fi
  sleep 2
done

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
}

# 检测运行环境
if [ -f /.dockerenv ]; then
    # 在Docker容器内部运行 - 直接启动服务
    start_deployment
else
    # 在Docker外部运行 - 执行用户命令
    case "$COMMAND" in
        "start")
            echo "在Docker外部启动服务..."
            docker-compose up -d
            echo "✅ 服务已启动"
            echo "前端访问: http://localhost:9011"
            echo "后端API: http://localhost:9010"
            echo ""
            echo "查看日志: docker-compose logs -f"
            ;;
        "rebuild")
            rebuild_deployment
            ;;
        "diagnose")
            diagnose_deployment
            ;;
        "stop")
            stop_deployment
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "未知命令: $COMMAND"
            echo "使用 '$0 help' 查看可用命令"
            exit 1
            ;;
    esac
fi
