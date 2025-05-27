FROM node:18-alpine

# 创建应用目录
WORKDIR /app

# 复制项目配置文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装所有依赖
RUN npm install && \
    cd mcp && npm install && \
    cd ../web && npm install && \
    cd ../supabase && npm install

# 复制应用程序代码
COPY . .

# 构建MCP服务和Web应用
RUN cd mcp && npm run build && cd ../web && npm run build

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=9010
ENV FRONTEND_PORT=9011
ENV TRANSPORT_TYPE=sse
ENV API_KEY=default-api-key-for-build

# 强制使用本地文件存储
ENV STORAGE_TYPE=file
ENV FORCE_LOCAL_STORAGE=true

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口：MCP=9010, Web=9011
EXPOSE 9010 9011

# 添加启动脚本
COPY docker-start.sh /app/start.sh
RUN chmod +x /app/start.sh

# 安装需要的工具
RUN npm install -g serve && apk add --no-cache curl bash

# 启动应用（使用shell形式而非exec形式）
CMD bash /app/start.sh
