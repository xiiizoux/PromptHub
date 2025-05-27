#!/bin/bash

# 设置环境变量
export API_URL=http://localhost:9010
export API_KEY=mcp-prompt-server-key

# 安装依赖
echo "正在安装依赖..."
npm install

# 启动开发服务器
echo "启动Prompt Hub前端开发服务器..."
npm run dev
