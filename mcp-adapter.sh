#!/bin/bash

# MCP协议适配器启动脚本
# 用于简化MCP协议适配器的使用

# 设置默认值
MCP_SERVER_URL=${MCP_SERVER_URL:-"https://mcp.prompt-hub.cc"}
API_KEY=${API_KEY:-""}
MCP_TIMEOUT=${MCP_TIMEOUT:-"60000"}

# 检查API密钥
if [ -z "$API_KEY" ]; then
    echo "错误: 请设置API_KEY环境变量"
    echo "使用方法: API_KEY=your-api-key ./mcp-adapter.sh"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查适配器文件
ADAPTER_PATH="./mcp/src/adapters/mcp-protocol-adapter.js"
if [ ! -f "$ADAPTER_PATH" ]; then
    echo "错误: 未找到适配器文件: $ADAPTER_PATH"
    exit 1
fi

# 导出环境变量
export MCP_SERVER_URL
export API_KEY
export MCP_TIMEOUT

echo "启动MCP协议适配器..."
echo "服务器地址: $MCP_SERVER_URL"
echo "超时时间: ${MCP_TIMEOUT}ms"
echo "---"

# 启动适配器
node "$ADAPTER_PATH"
