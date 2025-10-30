# 🚀 PromptHub Docker 快速启动指南

## 一分钟快速部署

### 前置条件

- Docker 已安装
- Docker Compose 已安装
- 项目主目录存在 `.env` 文件（包含所有必需的环境变量）

### 快速启动（三步完成）

```bash
# 1. 构建镜像
./build-docker.sh

# 2. 启动服务
docker compose up -d

# 3. 查看日志
docker compose logs -f
```

就这么简单！✨

### 验证部署

访问以下地址：
- **Web 应用**: http://localhost:9011
- **MCP API**: http://localhost:9010/api/health

### 常用命令

```bash
# 查看状态
docker ps | grep prompthub

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 查看日志（最后100行）
docker compose logs --tail=100

# 进入容器调试
docker exec -it prompthub sh

# 完全清理
docker compose down -v
```

## 📖 详细文档

- [完整构建指南](./DOCKER_BUILD.md) - 详细的构建和配置说明
- [部署成功报告](./DEPLOYMENT_SUCCESS.md) - 当前部署状态和架构
- [构建总结](./BUILD_SUMMARY.md) - 技术细节和改进说明

## ⚠️ 重要提示

1. **环境变量**: 确保主目录的 `.env` 文件包含所有必需变量
2. **端口冲突**: 确保 9010 和 9011 端口未被占用
3. **资源要求**: 建议至少 4GB 可用内存
4. **首次构建**: 首次构建可能需要 3-5 分钟，请耐心等待

## 🐛 故障排查

### 构建失败

```bash
# 查看完整构建日志
./build-docker.sh 2>&1 | tee build.log

# 检查环境变量
cat .env | grep SUPABASE
```

### 服务无法启动

```bash
# 查看容器日志
docker compose logs

# 检查容器状态
docker inspect prompthub

# 重新构建并启动
docker compose down
./build-docker.sh
docker compose up -d
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :9010
lsof -i :9011

# 或修改 docker-compose.yml 中的端口映射
```

## 💡 提示

- 使用 `docker compose logs -f` 实时查看日志
- 修改代码后需要重新构建镜像：`./build-docker.sh`
- 环境变量更改后重启容器：`docker compose restart`
- 数据持久化在 `./logs` 和 `./mcp/data` 目录

## 🎉 享受使用 PromptHub！

有问题？查看 [完整文档](./DOCKER_BUILD.md) 或提交 Issue。

