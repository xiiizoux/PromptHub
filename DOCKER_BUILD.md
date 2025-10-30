# Docker 构建指南

本文档说明如何构建和运行 PromptHub 的 Docker 镜像。

## 🏗️ 构建 Docker 镜像

### 前置条件

1. **环境变量配置**
   - 确保项目主目录存在 `.env` 文件
   - `.env` 文件必须包含所有必需的环境变量（Supabase、MCP等）
   - 项目统一使用主文件夹的 `.env` 文件，不要在子文件夹创建额外的 `.env` 文件

2. **系统要求**
   - Docker 已安装并运行
   - 至少 4GB 可用磁盘空间
   - 建议 8GB+ RAM（构建 Next.js 时需要）

### 快速构建

使用提供的构建脚本（推荐）：

```bash
./build-docker.sh
```

构建脚本会自动：
- 从主文件夹的 `.env` 文件读取环境变量
- 验证必需的环境变量是否存在
- 将环境变量传递给 Docker 构建过程
- 构建生产级镜像

### 手动构建

如果需要手动构建，可以使用以下命令：

```bash
# 加载环境变量
source .env

# 构建镜像
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  --build-arg SUPABASE_URL="${SUPABASE_URL}" \
  -t prompthub:production \
  -t prompthub:latest \
  .
```

## 📦 镜像架构

### 多阶段构建

Dockerfile 使用多阶段构建来优化镜像大小和安全性：

1. **dependencies** - 安装所有依赖（包括构建工具）
2. **web-builder** - 构建 Next.js 应用
3. **production** - 最终的生产镜像（仅包含运行时依赖）

### 镜像特性

- ✅ 基于 Alpine Linux（轻量级）
- ✅ 多阶段构建（减小镜像大小）
- ✅ 非 root 用户运行（安全）
- ✅ 健康检查配置
- ✅ 使用 tini 作为 init 进程
- ✅ 生产优化的 Node.js 配置

### 镜像大小

- 最终生产镜像：~1.3GB
- 包含内容：
  - Next.js Web 应用（已构建）
  - MCP 服务器
  - Supabase 客户端
  - 运行时依赖
  - Canvas 支持库（图像处理）

## 🚀 运行容器

### 使用 Docker Compose（推荐）

```bash
# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 使用 Docker Run

```bash
docker run -d \
  --name prompthub \
  --env-file .env \
  -p 9010:9010 \
  -p 9011:9011 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/mcp/data:/app/mcp/data \
  prompthub:production
```

## 🔍 验证部署

构建完成后，验证镜像：

```bash
# 查看镜像
docker images | grep prompthub

# 检查镜像详情
docker inspect prompthub:production

# 查看镜像层
docker history prompthub:production
```

启动后，访问：
- **Web 应用**: http://localhost:9011
- **MCP 服务器**: http://localhost:9010
- **健康检查**: http://localhost:9011/api/health

## 📋 环境变量说明

### 构建时需要的变量

以下变量在构建 Next.js 应用时必需：

```bash
# Supabase 公共配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase 服务端配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 运行时需要的变量

完整的环境变量列表请参考 `.env.example`。主要包括：

- **Supabase**: 数据库和存储配置
- **MCP**: AI 模型配置
- **应用配置**: 端口、模式等

## 🛠️ 故障排查

### 构建失败

1. **环境变量缺失**
   ```
   错误: NEXT_PUBLIC_SUPABASE_URL 未设置
   ```
   解决：检查 `.env` 文件是否存在且包含所有必需变量

2. **内存不足**
   ```
   ERROR: failed to build: process exited with code 137
   ```
   解决：增加 Docker 内存限制（至少 4GB）

3. **依赖安装失败**
   ```
   npm ERR! network timeout
   ```
   解决：检查网络连接，或使用国内镜像源

### 运行失败

1. **端口冲突**
   ```
   Error: Port 9011 is already in use
   ```
   解决：停止占用端口的服务，或修改 `docker-compose.yml` 中的端口映射

2. **权限问题**
   ```
   Error: EACCES: permission denied
   ```
   解决：确保挂载的目录有正确的权限

## 📊 性能优化

### 构建优化

1. **使用构建缓存**
   ```bash
   # Docker 会自动使用缓存
   # 如需强制重新构建
   docker build --no-cache -t prompthub:production .
   ```

2. **并行构建**
   ```bash
   # Docker BuildKit 默认启用
   DOCKER_BUILDKIT=1 docker build -t prompthub:production .
   ```

### 运行时优化

1. **资源限制**
   ```yaml
   # docker-compose.yml
   services:
     prompthub:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
           reservations:
             memory: 1G
   ```

2. **日志管理**
   ```yaml
   services:
     prompthub:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

## 🔐 安全注意事项

1. **不要将 .env 文件提交到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 使用 `.env.example` 作为模板

2. **生产环境建议**
   - 使用 Docker secrets 管理敏感信息
   - 定期更新基础镜像
   - 启用容器扫描（如 Trivy）

3. **网络安全**
   - 使用反向代理（Nginx/Traefik）
   - 启用 HTTPS
   - 配置防火墙规则

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [Alpine Linux](https://alpinelinux.org/)

## 🆘 获取帮助

如果遇到问题：
1. 查看构建日志：`docker build ... 2>&1 | tee build.log`
2. 查看运行日志：`docker compose logs -f`
3. 检查容器状态：`docker ps -a`
4. 进入容器调试：`docker exec -it prompthub sh`

