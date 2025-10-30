# ============================================
# 生产级多阶段构建 Dockerfile
# 支持 React 19 + Next.js 15
# ============================================

# ============================================
# Stage 1: 依赖安装阶段
# ============================================
FROM node:20-alpine AS dependencies

# 安装系统依赖
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
    git

WORKDIR /app

# 复制 package.json 文件
COPY mcp/package*.json ./mcp/
COPY web/package*.json ./web/
COPY supabase/package*.json ./supabase/

# 设置内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 安装 MCP 依赖（需要 devDependencies，因为使用 tsx 运行 TypeScript 源码）
# MCP 使用标准 npm ci，不需要 --legacy-peer-deps
RUN cd mcp && npm ci

# 安装 Web 依赖（需要 devDependencies 用于构建）
# React 19 已被所有依赖兼容，使用 npm install 代替 npm ci 以处理依赖升级
RUN cd web && rm -f package-lock.json && npm install

# 安装 Supabase 依赖
RUN cd supabase && npm ci || echo "Supabase 依赖安装跳过"

# ============================================
# Stage 2: Web 构建阶段
# ============================================
FROM node:20-alpine AS web-builder

WORKDIR /app

# 定义构建参数（必须在构建时通过 --build-arg 传入）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_URL

# 复制依赖
COPY --from=dependencies /app/web/node_modules ./web/node_modules
COPY --from=dependencies /app/mcp/node_modules ./mcp/node_modules

# 复制源代码
COPY web ./web
COPY mcp ./mcp

# 设置构建环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# 将构建参数转换为环境变量供 Next.js 构建使用
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}

# 构建 Next.js 应用
RUN cd web && npm run build

# MCP 将在运行时使用 tsx 直接运行 TypeScript 源码（不需要构建）
# 因此不清理 MCP 的 devDependencies（需要保留 tsx 和 typescript）

# 清理 Web 的开发依赖，只保留生产依赖
RUN cd web && npm prune --production

# ============================================
# Stage 3: 生产运行阶段
# ============================================
FROM node:20-alpine AS production

# 安装运行时系统依赖（仅必需的）
RUN apk update && apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    curl \
    tini

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制 MCP 构建产物和生产依赖
COPY --from=web-builder --chown=nodejs:nodejs /app/mcp/node_modules ./mcp/node_modules
COPY --from=web-builder --chown=nodejs:nodejs /app/mcp ./mcp

# 复制 Web 构建产物和生产依赖
COPY --from=web-builder --chown=nodejs:nodejs /app/web/.next ./web/.next
COPY --from=web-builder --chown=nodejs:nodejs /app/web/node_modules ./web/node_modules
COPY --from=web-builder --chown=nodejs:nodejs /app/web/public ./web/public
COPY --chown=nodejs:nodejs web/package*.json ./web/
COPY --chown=nodejs:nodejs web/next.config.js ./web/

# 复制 Supabase 依赖和代码
COPY --from=dependencies --chown=nodejs:nodejs /app/supabase/node_modules ./supabase/node_modules
COPY --chown=nodejs:nodejs supabase ./supabase

# 复制其他必要文件
COPY --chown=nodejs:nodejs docker-start.sh ./
COPY --chown=nodejs:nodejs .env* ./

# 创建必要的目录
RUN mkdir -p /app/logs /app/mcp/data && \
    chown -R nodejs:nodejs /app/logs /app/mcp/data

# 设置权限
RUN chmod +x /app/docker-start.sh

# 设置生产环境变量
ENV NODE_ENV=production \
    PORT=9010 \
    FRONTEND_PORT=9011 \
    TRANSPORT_TYPE=sse \
    NEXT_TELEMETRY_DISABLED=1

# 暴露端口
EXPOSE 9010 9011

# 切换到非 root 用户
USER nodejs

# 使用 tini 作为初始化进程（优雅处理信号）
ENTRYPOINT ["/sbin/tini", "--"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${FRONTEND_PORT}/ || exit 1

# 启动命令
CMD ["/bin/sh", "/app/docker-start.sh"]
