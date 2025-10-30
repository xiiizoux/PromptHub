# 生产环境部署指南

## 问题说明

在生产服务器上构建 Docker 镜像时，即使 `.env` 文件存在，Docker 也不会自动将 `.env` 文件中的变量传递给构建参数（`ARG`）。这会导致 Next.js 构建阶段缺少必需的 Supabase 环境变量。

## 解决方案

`docker-start.sh` 脚本的 `rebuild` 命令已经修改为：
1. ✅ 自动加载 `.env` 文件
2. ✅ 验证必需的环境变量
3. ✅ 显式传递环境变量给 Docker 构建

## 生产部署步骤

### 1. 准备环境

确保在项目根目录有 `.env` 文件，包含以下必需变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
```

### 2. 部署命令

```bash
# 在生产服务器上执行
cd /path/to/PromptHub
./docker-start.sh rebuild
```

### 3. 脚本会自动完成

- ✅ 检查 `.env` 文件是否存在
- ✅ 加载并验证环境变量
- ✅ 停止旧容器
- ✅ 清理旧镜像和缓存
- ✅ 构建新镜像（传递环境变量）
- ✅ 启动服务

## 常见问题

### Q1: 构建时提示 "Missing environment variable"？

**原因**：`.env` 文件中缺少必需的环境变量

**解决**：检查 `.env` 文件，确保包含所有必需的 Supabase 配置

### Q2: `.env` 文件存在但仍然报错？

**原因**：可能使用了错误的命令（直接运行 `docker-compose build`）

**解决**：必须使用 `./docker-start.sh rebuild` 命令，它会正确加载和传递环境变量

### Q3: 本地开发环境如何使用？

本地开发时，`docker-compose` 会自动读取 `.env` 文件作为运行时环境变量，但**不会**自动传递给构建参数。因此：

```bash
# 本地也建议使用统一命令
./docker-start.sh rebuild
```

## 技术细节

### 为什么需要显式传递构建参数？

Docker Compose 的行为：
- ✅ **运行时环境变量**：自动从 `.env` 文件加载
- ❌ **构建时参数（ARG）**：不会自动从 `.env` 文件加载

Next.js 构建时需要 `NEXT_PUBLIC_*` 变量来打包到客户端代码中，因此必须在构建阶段传递。

### Dockerfile 构建流程

```dockerfile
# Stage 2: Web 构建阶段
ARG NEXT_PUBLIC_SUPABASE_URL          # ← 必须通过 --build-arg 传入
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY     # ← 必须通过 --build-arg 传入

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN cd web && npm run build            # ← Next.js 构建需要这些环境变量
```

### docker-start.sh 的解决方案

```bash
# 1. 加载 .env 文件
source .env

# 2. 验证变量
# ... 验证逻辑 ...

# 3. 显式传递给构建
docker-compose build --no-cache \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    --build-arg SUPABASE_URL="$SUPABASE_URL"
```

## 其他有用命令

```bash
# 启动服务（不重建）
./docker-start.sh start

# 停止服务
./docker-start.sh stop

# 诊断问题
./docker-start.sh diagnose

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

## 总结

✅ **正确方式**：使用 `./docker-start.sh rebuild`  
❌ **错误方式**：直接使用 `docker-compose build`

`docker-start.sh` 是唯一推荐的构建和部署工具，它会正确处理所有环境变量的加载和传递。

