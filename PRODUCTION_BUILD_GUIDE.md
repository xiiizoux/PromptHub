# 生产环境构建指南

## 问题诊断

当在生产服务器上构建 Docker 时出现以下错误：

```
Missing environment variable: NEXT_PUBLIC_SUPABASE_URL
Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
Error: supabaseUrl is required.
```

**原因**: Next.js 在构建时（build time）需要访问这些环境变量，但 Docker 构建过程中没有获取到这些变量。

## 解决方案

### 方案 1: 使用 .env 文件（推荐）✅

#### Step 1: 确保生产服务器有 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 在生产服务器上
cd /path/to/PromptHub
nano .env
```

添加以下内容（替换为实际值）：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js 公开环境变量（构建时必需）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# JWT 配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# API 密钥
API_KEY=your-api-key
SERVER_KEY=your-server-key

# 存储配置
STORAGE_TYPE=supabase
```

#### Step 2: 使用构建脚本

```bash
# 使用提供的构建脚本（会自动读取 .env）
./build-docker.sh
```

**或者** 使用 docker-compose：

```bash
# docker-compose 会自动读取 .env 文件
docker compose build
docker compose up -d
```

### 方案 2: 直接传递构建参数

如果不想使用 `.env` 文件，可以手动传递参数：

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  --build-arg SUPABASE_URL="https://your-project.supabase.co" \
  -t prompthub:latest \
  .
```

### 方案 3: 使用 docker-compose.override.yml（推荐用于多环境）

创建 `docker-compose.override.yml`（此文件不会被 git 追踪）：

```yaml
services:
  prompthub:
    build:
      args:
        NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co"
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-anon-key"
        SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key"
        SUPABASE_URL: "https://your-project.supabase.co"
```

然后运行：

```bash
docker compose build
docker compose up -d
```

## 验证步骤

### 1. 验证 .env 文件存在

```bash
ls -la .env
cat .env | grep SUPABASE  # 确保变量已设置
```

### 2. 验证 docker-compose 读取环境变量

```bash
docker compose config | grep -A 5 "args:"
```

应该看到：

```yaml
args:
  NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: your-anon-key
  SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
  SUPABASE_URL: https://your-project.supabase.co
```

### 3. 重新构建（清理缓存）

如果问题仍然存在，清理 Docker 缓存：

```bash
# 清理构建缓存
docker builder prune -f

# 重新构建（不使用缓存）
docker compose build --no-cache

# 或使用构建脚本
./build-docker.sh
```

## 常见问题

### Q1: 为什么本地构建成功，生产环境失败？

**A**: 本地可能使用了 `build-docker.sh` 脚本，该脚本会读取 `.env` 文件并传递参数。生产环境如果直接使用 `docker build` 或 `docker compose build`，需要确保 `.env` 文件存在。

### Q2: .env 文件应该放在哪里？

**A**: `.env` 文件应该放在项目根目录（与 `docker-compose.yml` 同级）。

```
/path/to/PromptHub/
├── .env                 ← 这里
├── docker-compose.yml
├── Dockerfile
├── build-docker.sh
├── mcp/
├── web/
└── supabase/
```

### Q3: 如何安全地管理 .env 文件？

**A**: 
1. **本地开发**: 使用 `.env.example` 作为模板
2. **生产环境**: 
   - 手动在服务器上创建 `.env`
   - 或使用密钥管理服务（如 Vault、AWS Secrets Manager）
   - 设置正确的文件权限：`chmod 600 .env`
3. **永远不要提交 .env 到 git**（已在 `.gitignore` 中）

### Q4: NEXT_PUBLIC_ 前缀的变量为什么特殊？

**A**: Next.js 的 `NEXT_PUBLIC_*` 变量会在构建时被内联到前端代码中，因此：
- 必须在构建时（build time）可用
- 会暴露给浏览器，不要包含敏感信息
- 只能包含公开的 API 端点和 Anon Key

### Q5: 构建时报 "Node.js 18 deprecated" 警告

**A**: 这是警告，不是错误。Supabase 推荐使用 Node.js 20+，但 Node.js 18 仍然可以工作。未来可以升级：

```dockerfile
# 在 Dockerfile 中
FROM node:20-alpine AS dependencies  # 改为 Node.js 20
```

## 推荐的生产部署流程

### 完整流程

```bash
# 1. 拉取最新代码
cd /path/to/PromptHub
git pull origin main

# 2. 确认 .env 文件存在且正确
cat .env | grep -E "SUPABASE_URL|NEXT_PUBLIC"

# 3. 停止现有服务
docker compose down

# 4. 清理旧镜像（可选）
docker image prune -f

# 5. 构建新镜像
./build-docker.sh
# 或
docker compose build --no-cache

# 6. 启动服务
docker compose up -d

# 7. 查看日志
docker compose logs -f --tail=100

# 8. 验证服务
curl http://localhost:9010/api/health
curl http://localhost:9011/api/health
```

### 使用 CI/CD（推荐）

如果使用 GitHub Actions 或其他 CI/CD：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up environment
        run: |
          echo "NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}" >> .env
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}" >> .env
          echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" >> .env
          echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env
      
      - name: Build and deploy
        run: |
          docker compose build
          docker compose up -d
```

## 环境变量清单

### 构建时必需（Build-time required）

这些变量必须在 Docker 构建时可用：

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL（公开）
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key（公开）
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key（私密）
- ✅ `SUPABASE_URL` - Supabase URL（可与 NEXT_PUBLIC_SUPABASE_URL 相同）

### 运行时需要（Runtime required）

这些变量在容器运行时需要：

- `NODE_ENV` - 默认 `production`
- `PORT` - MCP 服务端口，默认 `9010`
- `FRONTEND_PORT` - Web 服务端口，默认 `9011`
- `STORAGE_TYPE` - 存储类型，默认 `supabase`
- `JWT_SECRET` - JWT 签名密钥
- `API_KEY` - API 访问密钥
- `SERVER_KEY` - 服务器密钥

## 故障排除

### 症状: Missing environment variable

```
Missing environment variable: NEXT_PUBLIC_SUPABASE_URL
```

**解决**:
1. 检查 `.env` 文件是否存在
2. 检查变量名拼写是否正确
3. 使用 `docker compose config` 验证配置

### 症状: supabaseUrl is required

```
Error: supabaseUrl is required.
```

**解决**:
1. 确保 `NEXT_PUBLIC_SUPABASE_URL` 在构建时可用
2. 清理 Docker 缓存重新构建
3. 检查 Dockerfile 中 ARG 和 ENV 定义

### 症状: 本地构建成功，服务器构建失败

**解决**:
1. 对比本地和服务器的 `.env` 文件
2. 确保使用相同的构建命令
3. 检查服务器上的文件权限

## 安全建议

1. **保护 .env 文件**
   ```bash
   chmod 600 .env
   chown root:root .env  # 或适当的用户
   ```

2. **使用环境隔离**
   - 开发环境：`.env.development`
   - 生产环境：`.env.production`

3. **定期轮换密钥**
   - Service Role Key
   - JWT Secret
   - API Keys

4. **监控和日志**
   ```bash
   docker compose logs -f --tail=100 | grep -i error
   ```

## 相关文档

- `README.md` - 项目总览
- `DOCKERFILE_OPTIMIZATION.md` - Docker 优化说明
- `REACT19_UPGRADE_REPORT.md` - React 19 升级报告
- `docker-compose.yml` - Docker Compose 配置
- `build-docker.sh` - 构建脚本

## 总结

✅ **推荐方案**: 在生产服务器上创建 `.env` 文件，然后使用：

```bash
./build-docker.sh
# 或
docker compose build && docker compose up -d
```

🔑 **关键点**:
- Next.js 需要在**构建时**访问 `NEXT_PUBLIC_*` 变量
- `.env` 文件必须在项目根目录
- docker-compose.yml 已配置为自动读取 `.env`
- 使用 `build-docker.sh` 最简单可靠

---

**最后更新**: 2025-10-30  
**适用版本**: PromptHub v1.0.0+  
**Docker**: 24.0+  
**Docker Compose**: v2.0+

