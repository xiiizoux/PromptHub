FROM node:18-alpine AS base

# 创建应用目录
WORKDIR /app

# 复制项目配置文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装所有依赖
RUN npm install && \
    cd mcp && \
    # 先安装关键依赖，确保它们可用
    npm install --save-dev dotenv-cli@latest tsx@latest && \
    npm install --save dotenv@latest && \
    npm install && \
    # 检查关键依赖是否安装成功
    test -f ./node_modules/.bin/dotenv && \
    test -f ./node_modules/.bin/tsx && \
    cd ../web && npm install && cd ../supabase && npm install

# 复制应用程序代码
COPY . .

# 构建MCP服务和Web应用
RUN cd mcp && npm run build && cd ../web && npm run build

# 设置环境变量 - 严格按照端口规定
ENV NODE_ENV=production
ENV PORT=9010
ENV FRONTEND_PORT=9011
ENV TRANSPORT_TYPE=sse
ENV API_KEY=default-api-key-for-build
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口：MCP=9010, Web=9011
EXPOSE 9010 9011

# 添加Docker启动脚本
COPY docker-start.sh /app/
RUN chmod +x /app/docker-start.sh && \
    cat /app/docker-start.sh > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# 安装serve用于提供Web应用静态文件服务和curl用于健康检查
RUN npm install -g serve && apk add --no-cache curl

# 启动应用
CMD ["/bin/bash", "/app/entrypoint.sh"]
