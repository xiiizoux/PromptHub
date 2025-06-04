# 部署选项

本文档介绍了MCP Prompt Server的各种部署选项，包括本地开发、Docker容器化部署等。

## 本地开发

### 快速开始

1. **克隆仓库**：
   ```bash
   git clone https://github.com/your-username/mcp-prompt-server.git
   cd mcp-prompt-server
   ```

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

4. **启动开发服务器**：
   ```bash
   npm run dev
   ```

5. **访问应用**：
   - API服务器：http://localhost:9010
   - Web界面：http://localhost:9011

## Docker部署

Docker部署是推荐的生产环境部署方式，提供了完整的容器化解决方案。

### 基础Docker部署

1. **构建镜像**：
   ```bash
   docker build -t prompthub:latest .
   ```

2. **运行容器**：
   ```bash
   docker run -p 9010:9010 -p 9011:9011 \
     -e API_KEY=your-secure-api-key \
     -e SUPABASE_URL=your-supabase-url \
     -e SUPABASE_ANON_KEY=your-supabase-anon-key \
     -e JWT_SECRET=your-jwt-secret \
     prompthub:latest
   ```

3. **仅使用本地文件存储（无需Supabase）**：
   ```bash
   docker run -p 9010:9010 -p 9011:9011 \
     -v /path/to/data:/app/data \
     -e API_KEY=your-secure-api-key \
     -e STORAGE_TYPE=file \
     -e FORCE_LOCAL_STORAGE=true \
     prompthub:latest
   ```

4. **只使用本地存储（无需Supabase）**：
   ```bash
   docker run -p 9010:9010 -p 9011:9011 \
     -v /path/to/data:/app/data \
     -e API_KEY=your-secure-api-key \
     -e STORAGE_TYPE=file \
     -e FORCE_LOCAL_STORAGE=true \
     prompthub:latest
   ```

5. **查看容器日志**：
   ```bash
   docker logs [container_id]
   ```

6. **进入容器进行调试**：
   ```bash
   docker exec -it [container_id] /bin/sh
   ```

### Docker Compose部署

使用Docker Compose可以更方便地管理多个服务：

1. **启动所有服务**：
   ```bash
   docker-compose up -d
   ```

2. **启动特定服务组合**：
   ```bash
   # 基础服务
   docker-compose up -d prompthub
   
   # 包含数据库
   docker-compose --profile local-db up -d
   
   # 包含缓存
   docker-compose --profile cache up -d
   
   # 完整部署（包含Nginx代理）
   docker-compose --profile local-db --profile cache --profile proxy up -d
   ```

3. **查看服务状态**：
   ```bash
   docker-compose ps
   ```

4. **查看日志**：
   ```bash
   docker-compose logs -f prompthub
   ```

5. **停止服务**：
   ```bash
   docker-compose down
   ```

### 一键部署脚本

项目提供了一键部署脚本，简化部署流程：

```bash
# 给脚本执行权限
chmod +x docker-deploy.sh

# 运行部署脚本
./docker-deploy.sh
```

部署脚本会自动：
- 检查Docker环境
- 创建必要目录
- 配置环境变量
- 构建和启动服务
- 提供可选服务选择

## 生产环境部署

### 高可用性配置

对于生产环境，建议使用以下配置：

1. **负载均衡**：
   - 使用Nginx或HAProxy进行负载均衡
   - 配置多个应用实例
   - 实现健康检查和故障转移

2. **数据库优化**：
   - 使用PostgreSQL主从复制
   - 配置连接池
   - 定期备份数据

3. **监控和日志**：
   - 集成Prometheus和Grafana
   - 配置日志聚合
   - 设置告警机制

### 安全配置

1. **网络安全**：
   - 配置防火墙规则
   - 使用HTTPS/TLS加密
   - 限制API访问频率

2. **数据安全**：
   - 定期备份数据
   - 加密敏感信息
   - 实施访问控制

3. **系统安全**：
   - 定期更新系统和依赖
   - 监控安全漏洞
   - 实施安全审计

## 环境变量配置

### 必需环境变量

```bash
# API配置
API_KEY=your-secure-api-key-here
PORT=9010
FRONTEND_PORT=9011

# 存储配置
STORAGE_TYPE=file  # 或 supabase
FORCE_LOCAL_STORAGE=true

# 如果使用Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

### 可选环境变量

```bash
# 传输配置
TRANSPORT_TYPE=sse

# 日志配置
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# 安全配置
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:9011

# 性能配置
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000
```

## 故障排除

### 常见问题

1. **端口冲突**：
   - 检查端口占用：`netstat -tlnp | grep :9010`
   - 修改端口配置或停止冲突服务

2. **权限问题**：
   - 确保Docker有足够权限
   - 检查文件和目录权限

3. **内存不足**：
   - 监控内存使用：`docker stats`
   - 增加系统内存或优化配置

4. **网络连接问题**：
   - 检查防火墙设置
   - 验证网络连接
   - 检查DNS解析

### 调试技巧

1. **查看日志**：
   ```bash
   # Docker容器日志
   docker logs [container_id]
   
   # Docker Compose日志
   docker-compose logs -f
   ```

2. **进入容器调试**：
   ```bash
   docker exec -it [container_id] /bin/sh
   ```

3. **健康检查**：
   ```bash
   curl http://localhost:9010/api/health
   curl http://localhost:9011
   ```

## 性能优化

### 系统优化

1. **资源配置**：
   - 根据负载调整CPU和内存
   - 优化磁盘I/O性能
   - 配置适当的并发连接数

2. **缓存策略**：
   - 启用Redis缓存
   - 配置静态文件缓存
   - 实施API响应缓存

3. **数据库优化**：
   - 创建适当的索引
   - 优化查询语句
   - 配置连接池

### 监控指标

1. **系统指标**：
   - CPU使用率
   - 内存使用率
   - 磁盘I/O
   - 网络流量

2. **应用指标**：
   - 响应时间
   - 错误率
   - 并发用户数
   - API调用频率

3. **业务指标**：
   - 用户活跃度
   - 提示词使用情况
   - 功能使用统计

---

更多详细信息，请参考：
- [Docker部署指南](./docker-deployment.md)
- [安全配置指南](./security-guide.md)
- [性能优化指南](./performance-guide.md)
