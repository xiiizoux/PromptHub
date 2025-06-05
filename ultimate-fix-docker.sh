#!/bin/bash
# 终极修复MCP服务Docker脚本 - 解决所有已知问题

# 设置错误处理
set -e
echo "开始执行终极修复脚本..."

# 为修复脚本添加执行权限
chmod +x fix-specific-json.cjs

# 复制修复脚本到Docker容器
echo "复制终极修复脚本到Docker容器..."
sudo docker cp fix-specific-json.cjs prompthub:/app/fix-specific-json.cjs

# 停止现有容器
echo "停止现有容器..."
sudo docker stop prompthub || true

# 启动容器
echo "启动容器..."
sudo docker start prompthub

# 等待容器启动
echo "等待容器启动 (5秒)..."
sleep 5

# 在容器内执行修复脚本
echo "在Docker容器中执行针对性JSON修复脚本..."
sudo docker exec prompthub node /app/fix-specific-json.cjs

# 强制解决重复导入问题
echo "强制解决重复导入问题..."
sudo docker exec prompthub sh -c "sed -i 's/import apiKeysRouter from \".\/api\/api-keys-router.js\";import apiKeysRouter from \".\/api\/api-keys-router.js\";/import apiKeysRouter from \".\/api\/api-keys-router.js\";/g' /app/mcp/dist/src/mcp-server.js"

# 强制解决TypeScript类型声明问题
echo "强制解决TypeScript类型声明问题..."
sudo docker exec prompthub sh -c "sed -i 's/function getAuthValue(request, key): string {/function getAuthValue(request, key) {/g' /app/mcp/dist/src/mcp-server.js"

# 重启容器以应用所有修复
echo "重启容器以应用所有修复..."
sudo docker restart prompthub

# 等待容器重启
echo "等待容器重启并检查服务状态 (20秒)..."
sleep 20

# 查看容器日志
echo "显示容器日志最后30行以检查启动状态:"
sudo docker logs prompthub | tail -n 30

# 最终状态检查 - 详细检查MCP进程
echo "详细检查MCP服务状态..."
sudo docker exec prompthub sh -c "ps aux | grep node"

# 检查MCP服务端口是否在监听
echo "检查MCP服务端口是否在监听..."
sudo docker exec prompthub sh -c "netstat -tulpn | grep 9010" || echo "MCP服务可能未启动或netstat未安装"

echo "终极修复脚本执行完成"
echo "如果MCP服务仍未成功启动，请使用以下命令检查完整日志:"
echo "  sudo docker logs prompthub"