# 生产环境构建问题修复指南

## 问题原因

生产服务器构建失败的两个主要原因：

1. **Docker 构建缓存问题**
   - Docker 使用了旧的构建层缓存
   - 旧缓存中没有包含必需的环境变量
   - 导致 Next.js 构建时无法访问 `NEXT_PUBLIC_SUPABASE_URL` 等变量

2. **Node.js 版本过旧**
   - 之前使用 Node.js 18
   - Supabase 要求 Node.js 20+
   - 警告: `Node.js 18 and below are deprecated`

## 已修复的问题

### 1. ✅ 升级 Node.js 版本

已将所有 Docker 构建阶段从 `node:18-alpine` 升级到 `node:20-alpine`：

- Stage 1 (dependencies): Node.js 20
- Stage 2 (web-builder): Node.js 20
- Stage 3 (production): Node.js 20

### 2. ✅ 创建自动化重建脚本

提供了 `rebuild-production.sh` 脚本，自动执行以下步骤：

1. 验证 `.env` 文件和必需环境变量
2. 停止运行中的容器
3. 删除旧镜像
4. **清理所有 Docker 构建缓存** ⬅️ 关键步骤
5. 使用 `--no-cache` 重新构建
6. 启动新服务

## 解决方案：立即执行

### 方法 1: 使用自动化脚本（推荐）✨

```bash
# 在生产服务器上执行
cd /home/zou/PromptHub
./rebuild-production.sh
```

脚本会自动：
- ✅ 验证环境变量
- ✅ 清理所有缓存
- ✅ 强制完全重新构建
- ✅ 启动服务

### 方法 2: 手动执行

如果你想手动控制每一步：

```bash
# 1. 停止容器
docker compose down

# 2. 删除旧镜像
docker rmi prompthub:latest

# 3. 清理构建缓存（关键！）
docker builder prune -af

# 4. 重新构建（不使用缓存）
docker compose build --no-cache

# 5. 启动服务
docker compose up -d
```

## 验证修复

构建成功后，你应该看到：

```bash
# ✅ 不再有 Node.js 18 警告
# ✅ 不再有 "Missing environment variable" 错误
# ✅ 构建成功完成

✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

检查服务状态：

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试访问
curl http://localhost:9011/api/health
curl http://localhost:9010/api/health
```

## 为什么本地构建成功，生产失败？

**本地环境**:
- 可能使用了 `build-docker.sh` 脚本
- 该脚本显式传递了环境变量作为构建参数
- 或者之前的成功构建已经在缓存中

**生产环境**:
- 直接使用 `docker compose build`
- Docker 使用了旧的缓存层
- 旧缓存中环境变量为空
- 需要清理缓存强制重新构建

## 关键要点

🔑 **核心问题**: Docker 构建缓存导致环境变量未更新

🔑 **解决方法**: 清理缓存 + 强制重建

🔑 **预防措施**: 
- 修改环境变量后，使用 `--no-cache` 重建
- 或使用提供的 `rebuild-production.sh` 脚本
- 定期清理 Docker 缓存: `docker builder prune -f`

## 环境变量检查清单

确保 `.env` 文件包含以下必需变量：

```bash
# ✅ 必需：Next.js 构建时需要
NEXT_PUBLIC_SUPABASE_URL=https://supabase.prompt-hub.cc
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ 必需：服务端 API 需要
SUPABASE_URL=https://supabase.prompt-hub.cc
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ✅ 可选但推荐
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=3600
```

## 故障排查

### 如果构建仍然失败

1. **检查环境变量**
   ```bash
   cat .env | grep SUPABASE
   ```

2. **验证 docker-compose 读取配置**
   ```bash
   docker compose config | grep -A 10 "build:"
   ```

3. **检查 Docker 内存**
   ```bash
   docker info | grep Memory
   ```
   建议至少 4GB 内存

4. **查看详细构建日志**
   ```bash
   docker compose build --no-cache --progress=plain
   ```

### 如果服务启动失败

```bash
# 查看容器日志
docker compose logs

# 进入容器检查
docker compose exec prompthub sh

# 检查环境变量是否正确注入
docker compose exec prompthub env | grep SUPABASE
```

## 总结

- ✅ Node.js 已升级到 20
- ✅ 提供自动化重建脚本
- ✅ 清理 Docker 缓存的重要性
- ✅ 环境变量正确传递

使用 `./rebuild-production.sh` 一键解决所有问题！

