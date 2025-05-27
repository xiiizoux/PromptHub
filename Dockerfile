FROM node:18-alpine AS base

# 创建应用目录
WORKDIR /app

# 复制项目配置文件
COPY package*.json ./
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/

# 安装所有依赖
RUN npm install && cd mcp && npm install && cd ../web && npm install

# 复制应用程序代码
COPY . .

# 构建MCP服务和Web应用
RUN cd mcp && npm run build && cd ../web && npm run build

# 设置环境变量 - 严格按照端口规定
ENV NODE_ENV=production
ENV PORT=9010
ENV FRONTEND_PORT=9011
ENV TRANSPORT_TYPE=sse

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口：MCP=9010, Web=9011
EXPOSE 9010 9011

# 添加Docker启动脚本
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# 安装serve用于提供Web应用静态文件服务和curl用于健康检查
RUN npm install -g serve && apk add --no-cache curl

# 启动应用
CMD ["/app/docker-start.sh"]
