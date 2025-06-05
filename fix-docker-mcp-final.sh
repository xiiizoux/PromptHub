#!/bin/bash
# 全面修复MCP服务的Docker启动脚本 - 最终版本

# 设置错误处理
set -e
echo "开始执行最终修复脚本..."

# 为修复脚本添加执行权限
chmod +x fix-all-typescript.cjs

# 复制修复脚本到Docker容器
echo "复制最终修复脚本到Docker容器..."
sudo docker cp fix-all-typescript.cjs prompthub:/app/fix-all-typescript.cjs

# 在Docker容器中执行修复脚本
echo "在Docker容器中执行最终修复脚本..."
sudo docker exec prompthub node /app/fix-all-typescript.cjs

# 重启容器
echo "重启整个Docker容器以确保干净启动..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (20秒)..."
sleep 20

# 查看容器日志
echo "显示容器日志以检查启动状态:"
sudo docker logs prompthub | tail -n 50

# 最终状态检查
echo "检查服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || true

echo "修复脚本执行完成"
echo "如果MCP服务仍未启动，请使用 'sudo docker logs prompthub' 检查完整日志"