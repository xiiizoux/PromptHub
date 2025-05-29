#!/bin/bash
# test-docker-ui.sh - 测试UI更新后的Docker构建

set -e

echo "🚀 开始测试UI更新后的Docker构建..."

# 检查必要文件
echo "📁 检查必要文件..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ 未找到Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 未找到docker-compose.yml"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，使用默认配置"
fi

# 清理旧的容器和镜像
echo "🧹 清理旧的Docker资源..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# 构建镜像
echo "🔨 构建Docker镜像..."
echo "ℹ️  注意：由于新增了Three.js、framer-motion等UI库，构建时间可能较长"
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Docker镜像构建失败"
    exit 1
fi

echo "✅ Docker镜像构建成功"

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ 服务启动失败"
    exit 1
fi

echo "⏳ 等待服务启动（60秒）..."
sleep 60

# 测试服务健康状态
echo "🔍 检查服务状态..."

# 检查容器状态
echo "📊 容器状态："
docker ps --filter "name=prompthub-app"

# 检查MCP服务
echo "🔌 测试MCP服务（端口9010）..."
if curl -f http://localhost:9010 >/dev/null 2>&1; then
    echo "✅ MCP服务正常"
else
    echo "❌ MCP服务异常"
    echo "📄 MCP日志："
    docker logs prompthub-app --tail 20 | grep -A10 -B10 "mcp"
fi

# 检查Web服务
echo "🌐 测试Web服务（端口9011）..."
if curl -f http://localhost:9011 >/dev/null 2>&1; then
    echo "✅ Web服务正常"
else
    echo "❌ Web服务异常"
    echo "📄 Web日志："
    docker logs prompthub-app --tail 20 | grep -A10 -B10 "web"
fi

# 检查UI组件是否正确加载
echo "🎨 测试UI组件加载..."
if curl -s http://localhost:9011 | grep -q "framer-motion\|tsparticles\|three"; then
    echo "✅ UI组件脚本已包含"
else
    echo "⚠️  UI组件脚本可能未正确加载"
fi

# 显示容器资源使用情况
echo "💾 容器资源使用情况："
docker stats prompthub-app --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# 显示完整日志
echo "📄 完整日志："
docker logs prompthub-app --tail 50

echo ""
echo "🎯 测试完成！"
echo "📋 访问方式："
echo "   - Web界面: http://localhost:9011"
echo "   - MCP服务: http://localhost:9010"
echo ""
echo "🛠️  管理命令："
echo "   - 查看日志: docker logs prompthub-app -f"
echo "   - 停止服务: docker-compose down"
echo "   - 重启服务: docker-compose restart" 