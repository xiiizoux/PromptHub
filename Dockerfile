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

# 更新包索引并安装系统依赖
RUN apk update && apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    python3-dev \
    make \
    g++ \
    git \
    curl

# 复制package.json文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装根目录依赖
RUN npm install --only=production

# 安装MCP依赖
RUN cd mcp && npm install --only=production && \
    npm install --save-dev tsx@latest dotenv-cli@latest typescript@latest

# 安装Web依赖
RUN cd web && NODE_OPTIONS="--max-old-space-size=4096" npm install --only=production

# 安装Supabase依赖（如果需要）
RUN cd supabase && npm install --only=production || echo "Supabase依赖安装跳过"

# 复制所有项目文件
COPY . .

# 跳过MCP构建 - 运行时使用tsx直接运行TypeScript

# 构建Web应用
RUN cd web && \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NODE_ENV=production \
    npm run build

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
