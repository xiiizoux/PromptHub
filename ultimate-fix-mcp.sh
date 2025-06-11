#!/bin/bash
# 终极版MCP服务Docker问题修复脚本

# 设置错误处理
set -e
echo "开始执行终极修复脚本..."

# 为修复脚本添加执行权限
chmod +x fix-function-return-types.cjs fix-quotes-errors.cjs fix-object-properties.cjs

# 复制修复脚本到Docker容器
echo "复制修复脚本到Docker容器..."
sudo docker cp fix-function-return-types.cjs prompthub:/app/fix-function-return-types.cjs
sudo docker cp fix-quotes-errors.cjs prompthub:/app/fix-quotes-errors.cjs
sudo docker cp fix-object-properties.cjs prompthub:/app/fix-object-properties.cjs

# 在Docker容器中按顺序执行修复脚本
echo "在Docker容器中执行函数返回类型修复脚本..."
sudo docker exec prompthub node /app/fix-function-return-types.cjs

echo "在Docker容器中执行引号错误修复脚本..."
sudo docker exec prompthub node /app/fix-quotes-errors.cjs

echo "在Docker容器中执行对象属性修复脚本..."
sudo docker exec prompthub node /app/fix-object-properties.cjs

# 重启容器
echo "重启整个Docker容器以确保干净启动..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (30秒)..."
sleep 30

# 查看容器日志
echo "显示容器日志以检查启动状态:"
sudo docker logs prompthub | tail -n 100

# 最终状态检查
echo "检查服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || true

echo "终极修复脚本执行完成"
echo "如果MCP服务仍未启动，请使用 'sudo docker logs prompthub' 检查完整日志"