FROM node:18-alpine

# 设置内存限制，支持重型UI库构建
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 创建应用目录
WORKDIR /app

# 设置基本环境变量 (注意: 实际配置应通过挂载.env文件提供)
ENV NODE_ENV=production \
    PORT=9010 \
    FRONTEND_PORT=9011 \
    TRANSPORT_TYPE=sse

# 安装系统依赖，包含Three.js和其他UI库可能需要的依赖
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

# 安装依赖 - 优化顺序，分步安装以提高构建稳定性
RUN npm install

# 安装MCP依赖
RUN cd mcp && npm install && \
    npm install --save-dev dotenv-cli@latest tsx@latest typescript@latest && \
    npm install --save dotenv@latest

# 安装Web依赖 - 为UI库预留更多内存并解决依赖冲突
RUN cd web && NODE_OPTIONS="--max-old-space-size=4096" npm install --legacy-peer-deps

# 安装Supabase依赖
RUN cd supabase && npm install

# 全局安装TypeScript以确保tsc可用
RUN npm install -g typescript

# 复制所有项目文件
COPY . .

# 构建MCP服务 - 使用更宽松的TS配置进行构建
RUN cd mcp && NODE_OPTIONS="--max-old-space-size=4096" npx tsc --project tsconfig.docker.json

# 构建Web应用 - 为重型UI库构建预留更多内存和时间并解决依赖冲突
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
