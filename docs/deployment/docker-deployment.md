# 🐳 Docker部署指南

本指南将帮助您使用Docker在VPS上部署PromptHub，实现Web和MCP服务的统一部署。

## 🚀 统一管理脚本

使用 `docker-start.sh` 脚本来管理整个 Docker 部署流程。

### 📋 可用命令

```bash
# 显示帮助
./docker-start.sh help

# 启动服务 (默认命令)
./docker-start.sh
./docker-start.sh start

# 重建镜像并启动 (推荐用于首次部署或修复问题)
./docker-start.sh rebuild

# 诊断部署问题
./docker-start.sh diagnose

# 停止服务
./docker-start.sh stop
```

### 🛠️ 快速部署步骤

#### 1. 首次部署

```bash
# 1. 克隆项目
git clone <项目地址>
cd PromptHub

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 3. 重建并启动 (包含所有修复)
./docker-start.sh rebuild
```

#### 2. 日常使用

```bash
# 启动服务
./docker-start.sh start

# 停止服务
./docker-start.sh stop

# 查看实时日志
docker-compose logs -f
```

#### 3. 问题排查

```bash
# 诊断问题
./docker-start.sh diagnose

# 如果有问题，重建解决
./docker-start.sh rebuild
```

### 🔧 已修复的Docker问题

- ✅ **MCP启动路径错误**: 修复了编译后文件路径问题
- ✅ **Web服务构建检查**: 确保Next.js构建文件存在
- ✅ **环境变量配置**: 优化了容器环境变量设置
- ✅ **错误恢复机制**: 添加了自动重建和错误检测
- ✅ **SSR问题修复**: 解决了React服务端渲染错误

### 🔄 更新部署

当代码更新后：

```bash
# 停止服务
./docker-start.sh stop

# 拉取最新代码
git pull

# 重建并启动
./docker-start.sh rebuild
```

## 📦 详细部署选项

### 本地开发部署

#### 快速开始

1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-username/mcp-prompt-server.git
   cd PromptHub
   ```

2. **安装依赖**：
   ```bash
   npm run install:all
   ```

3. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

4. **启动开发服务器**：
   ```bash
   npm start
   ```

5. **访问应用**：
   - API服务器：http://localhost:9010
   - Web界面：http://localhost:9011

### Docker Compose高级配置

#### 服务组合选项

```bash
# 基础服务（仅PromptHub）
docker-compose up -d prompthub

# 包含PostgreSQL数据库
docker-compose --profile local-db up -d

# 包含Redis缓存
docker-compose --profile cache up -d

# 完整部署（包含Nginx代理）
docker-compose --profile local-db --profile cache --profile proxy up -d
```

#### 存储选项配置

##### 仅本地文件存储
```bash
docker run -p 9010:9010 -p 9011:9011 \
  -v /path/to/data:/app/data \
  -e API_KEY=your-secure-api-key \
  -e STORAGE_TYPE=file \
  -e FORCE_LOCAL_STORAGE=true \
  prompthub:latest
```

##### Supabase云存储
```bash
docker run -p 9010:9010 -p 9011:9011 \
  -e API_KEY=your-secure-api-key \
  -e STORAGE_TYPE=supabase \
  -e SUPABASE_URL=your-supabase-url \
  -e SUPABASE_ANON_KEY=your-supabase-anon-key \
  prompthub:latest
```

### 生产环境部署

#### 高可用性配置

**负载均衡**：
- 使用Nginx或HAProxy进行负载均衡
- 配置多个应用实例
- 实现健康检查和故障转移

**数据库优化**：
- 使用PostgreSQL主从复制
- 配置连接池
- 定期备份数据

**监控和日志**：
- 集成Prometheus和Grafana
- 配置日志聚合
- 设置告警机制

#### 生产环境安全配置

**网络安全**：
- 配置防火墙规则
- 使用HTTPS/TLS加密
- 限制API访问频率

**数据安全**：
- 定期备份数据
- 加密敏感信息
- 实施访问控制

**系统安全**：
- 定期更新系统和依赖
- 监控安全漏洞
- 实施安全审计

#### 性能优化配置

**应用级优化**：
```bash
# 生产环境变量
NODE_ENV=production
LOG_LEVEL=warn
CACHE_TTL=3600
ENABLE_CACHE=true
```

**系统级优化**：
```bash
# 增加文件描述符限制
ulimit -n 65536

# 优化内存使用
NODE_OPTIONS="--max-old-space-size=4096"
```

### 云平台部署

#### Vercel部署（Web应用）

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 配置环境变量
4. 点击部署

#### Railway部署

1. 连接GitHub仓库到Railway
2. 配置环境变量
3. 部署MCP服务和Web应用

#### DigitalOcean App Platform

1. 创建新的App
2. 连接GitHub仓库
3. 配置环境变量和服务
4. 部署应用

## 📋 前置要求

### 系统要求
- Linux VPS (Ubuntu 20.04+ 推荐)
- 至少 2GB RAM
- 至少 10GB 可用磁盘空间
- Docker 和 Docker Compose

### 安装Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用组权限
logout
```

## 🚀 快速部署

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd PromptHub
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp docker.env.example .env

# 编辑环境变量
nano .env
```

**重要配置项**：
```bash
# 必须修改的配置
API_KEY=your-secure-api-key-here
JWT_SECRET=your-jwt-secret-here

# 端口配置（严格按照项目规定）
PORT=9010          # MCP服务端口
FRONTEND_PORT=9011 # Web服务端口

# 存储配置
STORAGE_TYPE=file  # 或 supabase
FORCE_LOCAL_STORAGE=true

# 如果使用Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

### 3. 一键部署

```bash
# 使用部署脚本（推荐）
./docker-deploy.sh

# 或手动部署
docker-compose up -d
```

## 📦 部署选项

### 基础部署（仅PromptHub）

```bash
# 启动基础服务
docker-compose up -d prompthub
```

访问地址：
- **Web应用**: http://your-vps-ip:9011
- **MCP API**: http://your-vps-ip:9010

### 完整部署（包含数据库和代理）

```bash
# 启动所有服务
docker-compose --profile local-db --profile cache --profile proxy up -d
```

访问地址：
- **Web应用**: http://your-vps-ip （通过Nginx代理）
- **直接访问**: http://your-vps-ip:9011
- **MCP API**: http://your-vps-ip:9010/api

### 可选服务

#### PostgreSQL数据库
```bash
docker-compose --profile local-db up -d postgres
```

#### Redis缓存
```bash
docker-compose --profile cache up -d redis
```

#### Nginx反向代理
```bash
docker-compose --profile proxy up -d nginx
```

## 🔧 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f prompthub
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart prompthub
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 更新服务
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d
```

## 🔒 安全配置

### 防火墙设置

```bash
# Ubuntu UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 9010  # MCP API
sudo ufw allow 9011  # Web App
sudo ufw enable
```

### SSL证书配置

1. 获取SSL证书（Let's Encrypt推荐）：
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

2. 将证书复制到ssl目录：
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

3. 启用HTTPS配置：
编辑 `nginx.conf`，取消HTTPS配置的注释。

### 环境变量安全

- 使用强密码和随机密钥
- 定期轮换API密钥
- 不要在代码中硬编码敏感信息

## 📊 监控和维护

### 健康检查

```bash
# 检查服务健康状态
curl http://localhost:9010/api/health
curl http://localhost:9011

# 通过Nginx代理检查
curl http://localhost/health
```

### 数据备份

```bash
# 备份数据目录
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# 备份PostgreSQL数据库
docker-compose exec postgres pg_dump -U prompthub prompthub > backup-db-$(date +%Y%m%d).sql
```

### 日志轮转

创建 `/etc/logrotate.d/prompthub`：
```
/path/to/PromptHub/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart prompthub
    endscript
}
```

## 🐛 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
sudo netstat -tlnp | grep :9010
sudo netstat -tlnp | grep :9011

# 停止冲突的服务
sudo systemctl stop <service-name>
```

#### 2. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER .
chmod +x docker-deploy.sh docker-start.sh
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. 服务无法启动
```bash
# 查看详细错误日志
docker-compose logs prompthub

# 检查配置文件
docker-compose config

# 重新构建镜像
docker-compose build --no-cache prompthub
```

### 调试模式

```bash
# 启用调试日志
echo "LOG_LEVEL=debug" >> .env
docker-compose restart prompthub

# 进入容器调试
docker-compose exec prompthub /bin/sh
```

## 🔄 升级指南

### 版本升级

1. 备份数据：
```bash
./backup.sh  # 如果有备份脚本
```

2. 拉取新版本：
```bash
git pull origin main
```

3. 更新服务：
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

4. 验证升级：
```bash
curl http://localhost:9010/api/health
```

## 📞 支持

如果遇到问题：

1. 查看日志：`docker-compose logs -f`
2. 检查配置：`docker-compose config`
3. 重启服务：`docker-compose restart`
4. 查看文档：`docs/` 目录
5. 提交Issue：GitHub Issues

---

**注意**：确保严格按照端口规定（MCP:9010, Web:9011），这是项目架构的核心要求。 