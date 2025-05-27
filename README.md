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
   # 安装所有依赖（前端和后端）
   npm run install:all
   
   # 或者分别安装
   npm run backend:install  # 安装后端依赖
   npm run frontend:install # 安装前端依赖
   ```

### 配置

1. 创建 `.env` 文件（根据 `.env.example` 模板）：
   ```env
   PORT=9010                       # 后端服务器端口
   FRONTEND_PORT=9011             # 前端服务器端口
   API_KEY=your-secure-api-key
   TRANSPORT_TYPE=stdio
   SUPABASE_URL=your-supabase-url  # Supabase 项目 URL
   SUPABASE_ANON_KEY=your-supabase-anon-key  # Supabase 匿名密钥
   ```
   
   注意：前端会自动使用环境变量中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 进行认证。

2. 设置数据库（如果使用 Supabase）：
   - 在 Supabase 控制台的 SQL 编辑器中执行 `supabase/schema.sql` 脚本

### 运行

#### 本地运行

1. 编译前后端项目：
   ```bash
   # 编译所有项目（前端和后端）
   npm run build:all
   
   # 或者分别编译
   npm run backend:build  # 编译后端
   npm run frontend:build # 编译前端
   ```

2. 使用一键启动脚本运行全部服务：
   ```bash
   npm start
   # 或者直接运行脚本
   ./start.sh
   ```
   脚本会自动处理端口冲突并启动前端和后端服务。

3. 使用一键关闭脚本停止所有服务：
   ```bash
   npm run stop
   # 或者直接运行脚本
   ./stop.sh
   ```

4. 访问服务：
   - 前端应用： http://localhost:9011
   - 后端健康检查： http://localhost:9010/api/health
   - 后端API文档： http://localhost:9010/api/docs

#### Docker运行

使用Docker容器部署完整的PromptHub前后端应用：

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

### Vercel部署

Prompt Hub支持完整的前后端应用通过Vercel进行快速部署，特别适合需要公开访问的场景：

1. **准备项目**：
   - 将项目推送到GitHub、GitLab或Bitbucket仓库
   - 在项目根目录创建`vercel.json`配置文件：
     ```json
     {
       "version": 2,
       "buildCommand": "npm run build:all",
       "outputDirectory": "frontend/dist",
       "installCommand": "npm run install:all",
       "rewrites": [
         { "source": "/api/(.*)", "destination": "/api/index.js" },
         { "source": "/sse", "destination": "/api/index.js" },
         { "source": "/tools(.*)", "destination": "/api/index.js" }
       ],
       "functions": {
         "api/index.js": {
           "memory": 1024,
           "maxDuration": 10
         }
       }
     }
     ```

2. **前端配置**：
   - 确保前端代码中的API请求URL配置为相对路径或环境变量：
     ```js
     // 前端环境变量配置示例
     const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
     ```
   - 更新前端的`.env.production`文件指向同一域名下的API端点

3. **后端适配**：
   - 创建`/api/index.js`文件，该文件将作为Vercel的Serverless函数入口点：
     ```js
     // /api/index.js
     const { createServer } = require('http');
     const { parse } = require('url');
     const next = require('next');
     const app = require('../backend/dist/src/index.js');
     
     module.exports = (req, res) => {
       // 启动Express应用
       app.handle(req, res);
     };
     ```

4. **部署步骤**：
   - 注册/登录[Vercel](https://vercel.com)
   - 点击"New Project"导入您的Git仓库
   - 配置以下环境变量：
     ```
     API_KEY=your-secure-api-key
     TRANSPORT_TYPE=sse
     SUPABASE_URL=your-supabase-url
     SUPABASE_ANON_KEY=your-supabase-anon-key
     JWT_SECRET=your-jwt-secret
     NODE_ENV=production
     NEXT_PUBLIC_API_URL=/api
     ```
   - 在项目设置中选择"Override":
     - Build Command: `npm run build:all`
     - Output Directory: `frontend/dist`
     - Install Command: `npm run install:all`
   - 点击"Deploy"按钮开始部署

5. **Supabase设置**：
   - 在[Supabase](https://app.supabase.io/)创建项目
   - 在SQL编辑器中执行`supabase/schema.sql`脚本
   - 在Supabase项目设置中的API设置页面中，添加Vercel部署URL到CORS允许列表
   - 安全设置中配置JWT密钥，确保与Vercel环境变量中的JWT_SECRET一致

6. **验证部署**：
   - 访问您的Vercel部署URL：`https://your-project-name.vercel.app`
   - 测试前端功能：注册、登录、提示词管理等
   - 检查API健康状态：`https://your-project-name.vercel.app/api/health`
   - 确认MCP工具端点：`https://your-project-name.vercel.app/tools`

7. **持续集成**：
   - 配置Git仓库的Webhook，实现代码提交后自动部署
   - 在Vercel中设置预览部署，为每个拉取请求生成预览环境

更多详细信息，请参考[部署选项文档](./docs/deployment-options.md)。

## 详细文档

详细信息请参考以下文档：

- **[基本功能](./docs/basic-features.md)**: 提示词管理、版本控制和AI辅助功能
- **[性能分析](./docs/performance-analysis.md)**: 跟踪提示词使用、收集反馈和A/B测试
- **[部署选项](./docs/deployment-options.md)**: 本地部署、Docker和云部署指南
- **[数据库结构](./docs/database-structure.md)**: 详细的数据库表和关系
- **[API参考](./docs/api-reference.md)**: 完整的API和MCP工具文档
- **[测试指南](./docs/testing-guide.md)**: 测试最佳实践、性能跟踪和服务器测试
- **[前端文档](./docs/frontend.md)**: 前端应用功能、结构和开发指南

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

### 性能分析工具

- `track_prompt_usage` - 记录提示词使用数据
- `submit_prompt_feedback` - 提交提示词使用反馈
- `get_prompt_performance` - 获取提示词性能数据
- `generate_performance_report` - 生成详细性能报告
- `create_ab_test` - 创建提示词版本的A/B测试

## 项目结构

```
mcp-prompt-server/
├─ backend/                   # 后端目录
│   ├─ api/                  # API服务器入口
│   ├─ client/               # API客户端库
│   ├─ src/                  # 后端源代码
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
│   │   └─ types.ts          # 类型定义
│   ├─ tests/                # 测试目录
│   │   └─ api-keys.test.ts  # API密钥单元测试
│   ├─ package.json          # 后端依赖和脚本
│   └─ tsconfig.json         # TypeScript配置
├─ frontend/                 # 前端应用目录
│   ├─ src/                  # 前端源代码
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
├─ docs/                     # 详细文档
├─ supabase/                 # Supabase相关文件
│   └─ schema.sql           # 数据库表结构和策略
├─ logs/                     # 日志文件目录
├─ .env                      # 环境变量文件
├─ .env.example              # 环境变量模板
├─ package.json              # 项目根目录依赖和脚本
├─ start.sh                  # 项目一键启动脚本
├─ stop.sh                   # 项目一键停止脚本
└─ README.md                 # 项目概述文档