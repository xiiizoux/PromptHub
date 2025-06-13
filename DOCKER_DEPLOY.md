# PromptHub Docker 部署指南

## 🚀 统一管理脚本

使用 `docker-start.sh` 脚本来管理整个 Docker 部署流程。

## 📋 可用命令

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

## 🛠️ 部署步骤

### 1. 首次部署

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

### 2. 日常使用

```bash
# 启动服务
./docker-start.sh start

# 停止服务
./docker-start.sh stop

# 查看实时日志
docker-compose logs -f
```

### 3. 问题排查

```bash
# 诊断问题
./docker-start.sh diagnose

# 如果有问题，重建解决
./docker-start.sh rebuild
```

## 🔧 已修复的Docker问题

- ✅ **MCP启动路径错误**: 修复了编译后文件路径问题
- ✅ **Web服务构建检查**: 确保Next.js构建文件存在
- ✅ **环境变量配置**: 优化了容器环境变量设置
- ✅ **错误恢复机制**: 添加了自动重建和错误检测
- ✅ **SSR问题修复**: 解决了React服务端渲染错误

## 📱 访问地址

- **前端Web界面**: http://localhost:9011
- **后端API**: http://localhost:9010

## 🐛 常见问题

### 问题1: 页面无法显示
```bash
# 重建镜像
./docker-start.sh rebuild
```

### 问题2: 登录失败
```bash
# 检查诊断
./docker-start.sh diagnose
# 检查.env文件中的Supabase配置
```

### 问题3: 服务启动失败
```bash
# 查看详细日志
docker-compose logs

# 进入容器检查
docker-compose exec prompthub /bin/sh
```

## 📂 项目结构

```
PromptHub/
├── docker-start.sh          # 统一管理脚本
├── docker-compose.yml       # Docker配置
├── Dockerfile              # Docker镜像定义
├── .env                    # 环境变量配置
├── web/                    # 前端应用
├── mcp/                    # 后端MCP服务
└── logs/                   # 容器日志
```

## 🔄 更新部署

当代码更新后：

```bash
# 停止服务
./docker-start.sh stop

# 拉取最新代码
git pull

# 重建并启动
./docker-start.sh rebuild
``` 