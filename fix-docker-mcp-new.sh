#!/bin/bash
# 全面修复MCP服务的Docker启动脚本

# 设置错误处理
set -e
echo "开始执行全面修复脚本..."

# 复制修复脚本到Docker容器
echo "复制综合修复脚本到Docker容器..."
sudo docker cp fix-typescript-issues.cjs prompthub:/app/fix-typescript-issues.cjs

# 在Docker容器中执行修复脚本
echo "在Docker容器中执行修复脚本..."
sudo docker exec prompthub node /app/fix-typescript-issues.cjs

# 重启MCP服务
echo "重启MCP服务..."
sudo docker exec prompthub sh -c "cd /app/mcp && node dist/src/index.js &"

# 等待MCP服务启动
echo "等待MCP服务启动 (15秒)..."
sleep 15

# 检查MCP服务是否运行
echo "检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || true

echo "修复脚本执行完成"
echo "提示: 如果MCP服务未成功启动，请检查Docker日志"
echo "  sudo docker logs prompthub"