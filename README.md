# Prompt Hub - 提示词综合服务平台

一个全功能的提示词管理、共享、优化和分析平台，支持用户认证、API密钥管理、性能分析和多种部署选项。

## 概述

Prompt Hub是一个综合性的提示词服务平台，专为大型语言模型(LLM)提示词的管理、共享和优化而设计。不仅提供完整的提示词生命周期管理，还支持用户认证、API密钥管理、社区共享和深度性能分析，帮助个人和团队创建、共享和优化高效的AI提示词。

### 主要功能

#### 用户和认证
- **用户管理**: 支持用户注册、登录和个人资料管理
- **API密钥管理**: 生成和管理安全的API密钥，实现无密码应用集成
- **权限控制**: 细粒度的权限系统，控制提示词的访问和修改权限

#### 提示词管理
- **[提示词管理](./docs/basic-features.md)**: 创建、更新、搜索和删除提示词
- **[分类和标签](./docs/basic-features.md)**: 组织和快速查找提示词
- **[版本控制](./docs/basic-features.md#提示词版本控制)**: 跟踪提示词的历史版本和变更
- **[导入导出](./docs/basic-features.md)**: 方便地在不同环境间迁移提示词

#### 性能优化
- **[性能分析](./docs/performance-analysis.md)**: 记录和分析提示词使用数据
- **[用户反馈](./docs/performance-analysis.md#提交用户反馈)**: 收集和分析用户对提示词的评价
- **[A/B测试](./docs/performance-analysis.md#ab测试)**: 比较不同提示词版本的效果
- **[AI辅助优化](./docs/basic-features.md#ai辅助功能)**: 使用AI自动提取和优化提示词

#### 集成和扩展
- **REST API**: 完整的REST API，支持与其他系统集成
- **MCP支持**: 兼容Model Context Protocol，实现标准化的提示词交互
- **多种存储选项**: 支持本地存储和Supabase云存储

## 快速开始

### 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/xiiizoux/mcp-prompt-server.git
   cd mcp-prompt-server
   ```

2. 安装依赖（前后端）：
   ```bash
   # 安装所有依赖（MCP服务和Web应用）
   npm run install:all
   
   # 或者分别安装
   npm run mcp:install  # 安装MCP服务依赖
   npm run web:install  # 安装Web应用依赖
   ```

   **注意**: 在全新的机器上，启动脚本会自动检查并安装缺失的依赖，无需手动安装。

### 配置

1. 创建 `.env` 文件（根据 `.env.example` 模板）：
   ```env
   PORT=9010                       # MCP服务器端口
   FRONTEND_PORT=9011             # Web应用端口
   API_KEY=your-secure-api-key
   TRANSPORT_TYPE=stdio
   SUPABASE_URL=your-supabase-url  # Supabase 项目 URL
   SUPABASE_ANON_KEY=your-supabase-anon-key  # Supabase 匿名密钥
   ```
   
   注意：Web应用会自动使用环境变量中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 进行认证。

2. 设置数据库（如果使用 Supabase）：
   - 在 Supabase 控制台的 SQL 编辑器中执行 `supabase/schema.sql` 脚本

### 运行

#### 本地运行

1. 编译前后端项目：
   ```bash
   # 编译所有项目（MCP服务和Web应用）
   npm run build:all
   
   # 或者分别编译
   npm run mcp:build  # 编译MCP服务
   npm run web:build  # 编译Web应用
   ```

2. 使用一键启动脚本运行全部服务：
   ```bash
   npm start
   # 或者直接运行脚本
   ./start.sh
   ```
   脚本会自动：
   - 检查端口可用性
   - 检查并安装缺失的依赖
   - 构建MCP服务和Web应用
   - 启动所有服务

3. 使用一键关闭脚本停止所有服务：
   ```bash
   npm run stop
   # 或者直接运行脚本
   ./stop.sh
   ```

4. 分别运行开发服务：
   ```bash
   # 运行MCP服务（开发模式）
   npm run mcp:dev
   
   # 运行Web应用（开发模式）
   npm run web:dev
   
   # 运行MCP服务测试
   npm run mcp:test
   ```

5. 访问服务：
   - Web应用： http://localhost:9011
   - MCP服务健康检查： http://localhost:9010/api/health
   - MCP服务API文档： http://localhost:9010/api/docs

#### Docker运行

使用Docker容器部署完整的PromptHub MCP服务和Web应用：

1. **构建Docker镜像**：
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

更多部署选项及高级配置，请参考[部署选项文档](./docs/deployment-options.md)

### 一键部署

使用项目提供的部署脚本，可以快速在VPS上部署完整的PromptHub应用：

```bash
# 给脚本执行权限
chmod +x deploy-docker.sh

# 运行一键部署
./deploy-docker.sh
```

部署脚本会自动：
- 检查Docker环境
- 创建必要目录和配置
- 构建和启动所有服务
- 提供可选服务选择（数据库、缓存、代理等）

更多详细信息，请参考[Docker部署指南](./docs/docker-deployment.md)。

## 故障排除

### 常见问题

#### TypeScript编译错误 (`tsc: not found`)
如果在新机器上遇到TypeScript编译错误，通常是因为依赖未安装：

```bash
# 解决方案1: 使用启动脚本（推荐）
./start.sh  # 脚本会自动检查并安装依赖

# 解决方案2: 手动安装依赖
npm run install:all

# 解决方案3: 仅安装MCP服务依赖
cd mcp && npm install
```

#### 端口占用错误
如果端口被占用，请先停止现有服务：

```bash
./stop.sh  # 停止项目服务
# 或手动查找并终止进程
lsof -i :9010  # 查看9010端口占用
lsof -i :9011  # 查看9011端口占用
```

#### 数据库连接错误
检查Supabase配置：

```bash
# 验证环境变量
cat .env | grep SUPABASE

# 测试数据库连接
cd supabase/tests && ./validate_schema.sh
```

## 详细文档

详细信息请参考以下文档：

- **[开发者指南](./docs/developer-guide.md)**: 完整的开发指南，包括项目架构、环境配置、安全最佳实践、缓存系统和重定向功能
- **[基本功能](./docs/basic-features.md)**: 提示词管理、版本控制和AI辅助功能
- **[性能分析](./docs/performance-analysis.md)**: 跟踪提示词使用、收集反馈和A/B测试
- **[部署选项](./docs/deployment-options.md)**: 本地部署、Docker和云部署指南
- **[数据库结构](./docs/database-structure.md)**: 详细的数据库表和关系
- **[API参考](./docs/api-reference.md)**: 完整的API和MCP工具文档
- **[测试指南](./docs/testing-guide.md)**: 测试最佳实践、性能跟踪和服务器测试
- **[Web应用文档](./docs/frontend.md)**: Web应用功能、结构和开发指南

## 快速参考

### 主要API端点

#### 基本端点
- `GET /` - API欢迎页
- `GET /api/health` - 服务器健康检查
- `GET /api/docs` - API文档概览

#### 提示词管理
- `GET /api/prompts` - 获取所有提示词
- `GET /api/prompts/:name` - 获取特定提示词详情
- `POST /api/prompts` - 创建新提示词
- `PUT /api/prompts/:name` - 更新现有提示词
- `GET /api/prompts/search/:query` - 搜索提示词

#### 版本控制
- `GET /api/prompts/:name/versions` - 获取提示词版本列表
- `GET /api/prompts/:name/versions/:version` - 获取特定版本的提示词

#### 导入导出
- `GET /api/export` - 导出提示词
- `POST /api/import` - 导入提示词

### 项目管理命令

#### 安装和构建
- `npm run install:all` - 安装所有依赖（MCP服务和Web应用）
- `npm run mcp:install` - 安装MCP服务依赖
- `npm run web:install` - 安装Web应用依赖
- `npm run build:all` - 构建所有项目
- `npm run mcp:build` - 构建MCP服务
- `npm run web:build` - 构建Web应用

#### 开发和运行
- `npm start` 或 `./start.sh` - 一键启动所有服务
- `npm run stop` 或 `./stop.sh` - 一键停止所有服务
- `npm run mcp:dev` - 运行MCP服务（开发模式）
- `npm run web:dev` - 运行Web应用（开发模式）
- `npm run mcp:test` - 运行MCP服务测试

### 性能分析工具

- `track_prompt_usage` - 记录提示词使用数据
- `submit_prompt_feedback` - 提交提示词使用反馈
- `get_prompt_performance` - 获取提示词性能数据
- `generate_performance_report` - 生成详细性能报告
- `create_ab_test` - 创建提示词版本的A/B测试

## 项目结构

```
PromptHub/
├─ mcp/                      # MCP服务目录
│   ├─ api/                  # API服务器入口
│   ├─ client/               # API客户端库
│   ├─ src/                  # MCP服务源代码
│   │   ├─ api/              # API端点实现
│   │   │   ├─ auth-middleware.ts  # 认证中间件
│   │   │   ├─ api-keys-router.ts  # API密钥管理
│   │   │   └─ mcp-router.ts       # MCP功能路由
│   │   ├─ performance/      # 性能分析功能
│   │   ├─ storage/          # 存储适配器
│   │   │   └─ supabase-adapter.ts # Supabase适配器
│   │   ├─ utils/            # 工具函数
│   │   │   └─ logger.ts     # 日志和审计系统
│   │   ├─ prompts/          # 提示词定义目录
│   │   ├─ tests/            # 单元测试
│   │   │   └─ api-keys.test.ts  # API密钥单元测试
│   │   └─ types.ts          # 类型定义
│   ├─ tests/                # 集成测试和性能测试
│   │   ├─ mcp/              # MCP协议测试
│   │   ├─ performance/      # 性能测试
│   │   ├─ utils/            # 测试工具
│   │   └─ setup.mjs         # 测试环境设置
│   ├─ package.json          # MCP服务依赖和脚本
│   └─ tsconfig.json         # TypeScript配置
├─ web/                      # Web应用目录
│   ├─ src/                  # Web应用源代码
│   │   ├─ pages/            # 页面组件
│   │   │   ├─ auth/         # 认证相关页面
│   │   │   │   ├─ login.tsx # 登录页面
│   │   │   │   └─ register.tsx # 注册页面
│   │   │   ├─ profile/      # 用户资料页面
│   │   │   │   └─ api-keys.tsx # API密钥管理页面
│   │   │   └─ prompts/      # 提示词相关页面
│   │   ├─ components/       # 通用组件
│   │   └─ contexts/         # 上下文和状态管理
│   │       └─ AuthContext.tsx # 认证上下文
│   ├─ tests/                # Web应用测试页面
│   │   ├─ test-redirect.tsx # 重定向功能测试
│   │   ├─ test-categories-tags.tsx # 分类标签API测试
│   │   ├─ api-test.tsx      # API端点测试
│   │   └─ keys-test.tsx     # API密钥测试
│   ├─ package.json          # Web应用依赖和脚本
│   └─ next.config.js        # Next.js配置
├─ docs/                     # 详细文档
├─ supabase/                 # Supabase相关文件
│   ├─ tests/                # 数据库测试脚本
│   │   └─ validate_schema.sh # Schema验证脚本
│   └─ schema.sql           # 数据库表结构和策略
├─ logs/                     # 日志文件目录
├─ .env                      # 环境变量文件（统一配置）
├─ package.json              # 项目根目录依赖和脚本
├─ start.sh                  # 项目一键启动脚本
├─ stop.sh                   # 项目一键停止脚本
└─ README.md                 # 项目概述文档