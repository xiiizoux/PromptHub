#!/bin/bash
# 这是一个临时脚本，用于修复Docker容器中的MCP服务启动问题

# 确保脚本在错误时停止
set -e

echo "===== PromptHub MCP修复脚本 ====="
echo "此脚本将修复Docker容器中的MCP服务启动问题"

# 检查Docker是否正在运行
if ! docker ps &>/dev/null; then
  echo "错误: Docker服务未运行，请先启动Docker"
  exit 1
fi

# 检查PromptHub容器是否存在
if ! docker ps -a | grep -q "prompthub"; then
  echo "错误: 未找到PromptHub容器"
  exit 1
fi

# 进入容器并修复问题
echo "进入容器并替换问题文件..."
docker exec -it prompthub bash -c '
  # 备份原始文件
  mkdir -p /app/backups
  cp /app/mcp/dist/src/index.js /app/backups/index.js.bak
  echo "已创建备份: /app/backups/index.js.bak"
  
  # 创建修复后的index.js文件
  cat > /app/mcp/dist/src/index.js << "EOF"
import { startMCPServer } from "./mcp-server.js";

// 主函数
async function main() {
  try {
    await startMCPServer();
  } catch (error) {
    console.error("Failed to start MCP Prompt Server:", error);
    process.exit(1);
  }
}

// 启动主函数
main();

// 处理未捕获的异常
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// 处理SIGINT信号（Ctrl+C）
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

// 处理SIGTERM信号
process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});
EOF
  
  echo "已替换问题文件"
  echo "文件大小: $(wc -c < /app/mcp/dist/src/index.js) 字节"
  
  # 禁用原来的修复脚本，避免它再次破坏文件
  mv /app/mcp/fix-quotes.js /app/mcp/fix-quotes.js.disabled
  echo "已禁用原始修复脚本"
'

echo "文件修复完成，现在重启容器..."
docker restart prompthub

echo "等待服务启动 (20秒)..."
sleep 20

echo "查看容器日志..."
docker logs prompthub | tail -n 50

echo "修复完成！如果上面没有显示错误，MCP服务应该已经成功启动"
echo "可以通过 'docker logs prompthub' 查看更多日志"