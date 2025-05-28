FROM node:18-alpine

# 创建应用目录
WORKDIR /app

# 设置基本环境变量 (注意: 实际配置应通过挂载.env文件提供)
ENV NODE_ENV=production \
    PORT=9010 \
    FRONTEND_PORT=9011 \
    TRANSPORT_TYPE=sse

# 复制package.json文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 安装依赖
RUN npm install && \
    cd mcp && npm install && \
    cd ../web && npm install && \
    cd ../supabase && npm install && \
    # 安装必要的工具依赖
    cd ../mcp && npm install --save-dev dotenv-cli@latest tsx@latest typescript@latest && \
    npm install --save dotenv@latest && \
    # 全局安装TypeScript以确保tsc可用
    npm install -g typescript

# 复制所有项目文件
COPY . .

# 构建MCP服务和Web应用
RUN cd mcp && npm run build && \
    cd ../web && npm run build

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
