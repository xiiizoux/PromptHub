# 🐳 Docker部署指南

本指南将帮助您使用Docker在VPS上部署PromptHub，实现Web和MCP服务的统一部署。

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
./deploy-docker.sh

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
chmod +x deploy-docker.sh docker-start.sh
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