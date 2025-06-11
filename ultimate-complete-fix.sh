#!/bin/bash
# 终极综合修复MCP服务Docker问题脚本 - 完整版

# 设置错误处理
set -e
echo "开始执行终极综合修复脚本 - 完整版..."

# 为所有修复脚本添加执行权限
chmod +x fix-function-return-types.cjs fix-quotes-errors.cjs fix-object-properties.cjs fix-route-handlers.cjs fix-route-quotes.cjs

# 复制所有修复脚本到Docker容器
echo "复制所有修复脚本到Docker容器..."
sudo docker cp fix-function-return-types.cjs prompthub:/app/fix-function-return-types.cjs
sudo docker cp fix-quotes-errors.cjs prompthub:/app/fix-quotes-errors.cjs
sudo docker cp fix-object-properties.cjs prompthub:/app/fix-object-properties.cjs
sudo docker cp fix-route-handlers.cjs prompthub:/app/fix-route-handlers.cjs
sudo docker cp fix-route-quotes.cjs prompthub:/app/fix-route-quotes.cjs

# 在Docker容器中按顺序执行所有修复脚本
echo "1. 在Docker容器中执行函数返回类型修复脚本..."
sudo docker exec prompthub node /app/fix-function-return-types.cjs

echo "2. 在Docker容器中执行引号错误修复脚本..."
sudo docker exec prompthub node /app/fix-quotes-errors.cjs

echo "3. 在Docker容器中执行对象属性修复脚本..."
sudo docker exec prompthub node /app/fix-object-properties.cjs

echo "4. 在Docker容器中执行路由处理函数修复脚本..."
sudo docker exec prompthub node /app/fix-route-handlers.cjs

echo "5. 在Docker容器中执行路由引号修复脚本..."
sudo docker exec prompthub node /app/fix-route-quotes.cjs

# 重启容器
echo "重启整个Docker容器以确保干净启动..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启 (45秒)..."
sleep 45

# 查看容器日志
echo "显示容器日志以检查启动状态:"
sudo docker logs prompthub | tail -n 100

# 检查MCP服务是否运行
echo "检查MCP服务进程状态..."
sudo docker exec prompthub sh -c "ps aux | grep node" || true

# 检查网络端口是否开放
echo "检查MCP服务端口状态..."
sudo docker exec prompthub sh -c "netstat -tuln | grep 9010" || true

echo "终极综合修复脚本执行完成"
echo "如果MCP服务仍未启动，请使用 'sudo docker logs prompthub' 检查完整日志"