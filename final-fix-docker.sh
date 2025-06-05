#!/bin/bash
# 最终修复MCP服务的Docker启动脚本

# 设置错误处理
set -e
echo "开始执行最终全面修复脚本..."

# 为修复脚本添加执行权限
chmod +x fix-all-typescript.cjs
chmod +x fix-json-syntax.cjs

# 复制修复脚本到Docker容器
echo "复制所有修复脚本到Docker容器..."
sudo docker cp fix-all-typescript.cjs prompthub:/app/fix-all-typescript.cjs
sudo docker cp fix-json-syntax.cjs prompthub:/app/fix-json-syntax.cjs

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 执行TypeScript修复脚本
echo "在Docker容器中执行TypeScript修复脚本..."
sudo docker exec prompthub node /app/fix-all-typescript.cjs

# 执行JSON语法修复脚本
echo "在Docker容器中执行JSON语法修复脚本..."
sudo docker exec prompthub node /app/fix-json-syntax.cjs

# 重启容器以应用所有修复
echo "重启容器以应用所有修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启并检查服务状态 (20秒)..."
sleep 20

# 查看容器日志
echo "显示容器日志以检查启动状态:"
sudo docker logs prompthub | tail -n 30

# 最终状态检查
echo "检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || true

echo "全面修复脚本执行完成"
echo "如果MCP服务仍未成功启动，请使用以下命令检查完整日志:"
echo "  sudo docker logs prompthub"