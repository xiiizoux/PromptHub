#!/bin/bash
# 全面修复Docker构建问题的脚本

# 设置错误处理
set -e
echo "开始执行Docker构建全面修复..."

# 添加执行权限
chmod +x docker-build-fix.cjs

# 检查docker-build-fix.cjs是否存在
if [ ! -f "docker-build-fix.cjs" ]; then
  echo "错误：找不到修复脚本 docker-build-fix.cjs"
  exit 1
fi

# 停止并移除现有容器
echo "停止并移除现有容器..."
sudo docker stop prompthub 2>/dev/null || true
sudo docker rm prompthub 2>/dev/null || true

# 创建修改后的Dockerfile
echo "创建优化的Dockerfile..."
cp Dockerfile Dockerfile.bak

# 替换Dockerfile中的构建命令
cat > Dockerfile.new << 'EOF'
FROM node:18-alpine

# 设置内存限制，支持重型UI库构建
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 创建应用目录
WORKDIR /app

# 设置基本环境变量
ENV NODE_ENV=production \
    PORT=9010 \
    FRONTEND_PORT=9011 \
    TRANSPORT_TYPE=sse

# 安装系统依赖
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    make \
    g++

# 复制package.json文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装依赖
RUN npm install

# 安装MCP依赖
RUN cd mcp && npm install && \
    npm install --save-dev dotenv-cli@latest tsx@latest typescript@latest && \
    npm install --save dotenv@latest

# 安装Web依赖
RUN cd web && NODE_OPTIONS="--max-old-space-size=4096" npm install --legacy-peer-deps

# 安装Supabase依赖
RUN cd supabase && npm install

# 全局安装TypeScript
RUN npm install -g typescript

# 复制所有项目文件
COPY . .

# 构建MCP服务 - 使用修复后的构建脚本
COPY docker-build-fix.cjs ./mcp/
RUN cd mcp && NODE_OPTIONS="--max-old-space-size=4096" node docker-build-fix.cjs

# 构建Web应用
RUN cd web && \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NODE_ENV=production \
    npm run build --legacy-peer-deps

# 创建必要的目录
RUN mkdir -p /app/logs /app/mcp/data

# 暴露端口
EXPOSE 9010 9011

# 复制Docker启动脚本
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# 清除默认entrypoint
ENTRYPOINT []

# 启动命令
CMD ["/bin/sh", "/app/docker-start.sh"]
EOF

mv Dockerfile.new Dockerfile
echo "已更新Dockerfile"

# 开始构建新镜像
echo "开始构建新的Docker镜像..."
echo "这可能需要几分钟时间，请耐心等待..."
sudo docker build -t prompthub:latest .

# 启动新容器
echo "启动新容器..."
sudo docker run -d \
  --name prompthub \
  -p 9010:9010 \
  -p 9011:9011 \
  prompthub:latest

echo "等待服务启动 (30秒)..."
sleep 30

# 检查容器是否正在运行
if sudo docker ps | grep -q "prompthub"; then
  echo "容器已成功启动!"
  echo "查看容器日志..."
  sudo docker logs prompthub | tail -n 50
  
  echo ""
  echo "===== 修复操作完成 ====="
  echo "MCP服务地址: http://localhost:9010"
  echo "Web服务地址: http://localhost:9011"
  echo ""
  echo "如需查看更多日志，请运行: sudo docker logs prompthub"
else
  echo "错误: 容器未成功启动"
  echo "查看日志以获取更多信息..."
  sudo docker logs prompthub
  exit 1
fi