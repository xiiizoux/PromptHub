# MCP Prompt Server 部署选项

MCP Prompt Server 提供多种部署选项，满足不同的使用场景和需求。

## 本地部署

### 基本本地部署

最简单的部署方式，适合开发和测试环境：

1. **准备环境**：
   - 确保已安装Node.js (v14或更高版本)
   - 克隆项目代码库

2. **安装依赖**：
   ```bash
   npm install
   ```

3. **配置环境变量**：
   - 创建`.env`文件，参考`.env.example`
   - 至少配置以下必要变量：
     ```
     PORT=9010
     API_KEY=your-secure-api-key
     TRANSPORT_TYPE=stdio
     SUPABASE_URL=your-supabase-url
     SUPABASE_ANON_KEY=your-supabase-key
     ```

4. **编译代码**：
   ```bash
   npm run build
   ```

5. **运行服务器**：
   ```bash
   npm run server
   ```

服务器将在指定端口上运行（默认9010），并提供所有API和MCP工具端点。

### 使用Docker部署

使用Docker容器部署PromptHub前后端应用，提供更好的隔离和可移植性：

1. **构建Docker镜像**：
   ```bash
   docker build -t prompthub:latest .
   ```

2. **运行容器**：
   ```bash
   docker run -p 9010:9010 -p 9011:9011 \
     -e API_KEY=your-secure-api-key \
     -e SUPABASE_URL=your-supabase-url \
     -e SUPABASE_ANON_KEY=your-supabase-key \
     -e JWT_SECRET=your-jwt-secret \
     -e PORT=9010 \
     -e FRONTEND_PORT=9011 \
     -e TRANSPORT_TYPE=sse \
     prompthub:latest
   ```

3. **使用映射卷**：
   ```bash
   docker run -p 9010:9010 -p 9011:9011 \
     -v /path/to/logs:/app/logs \
     -e API_KEY=your-secure-api-key \
     -e SUPABASE_URL=your-supabase-url \
     -e SUPABASE_ANON_KEY=your-supabase-key \
     -e JWT_SECRET=your-jwt-secret \
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

## 云部署

### Vercel部署

将Prompt Hub完整的前后端应用部署到Vercel平台：

#### 准备项目

1. **代码仓库准备**：
   - 确保项目已推送到GitHub、GitLab或Bitbucket仓库
   - 确保所有依赖已正确安装，并且所有代码可以本地构建和运行

2. **创建Vercel配置文件**：
   - 在项目根目录创建`vercel.json`文件，配置如下：
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

#### 配置应用

1. **前端配置**：
   - 在前端源代码中确保API地址配置可以使用环境变量，例如：
     ```typescript
     // 在前端的API客户端中
     const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
     
     async function fetchPrompts() {
       const response = await fetch(`${API_BASE_URL}/prompts/names`);
       // ... 其余代码
     }
     ```
   - 创建或更新`.env.production`文件指定生产环境变量：
     ```
     NEXT_PUBLIC_API_URL=/api
     ```

2. **创建后端适配器**：
   - 在项目根目录创建`api`文件夹
   - 在`api`文件夹中创建`index.js`文件作为Vercel的Serverless函数入口点：
     ```javascript
     // /api/index.js
     const { createServer } = require('http');
     const { parse } = require('url');
     const app = require('../backend/dist/src/index.js');
     
     module.exports = (req, res) => {
       // 确保环境变量可用
       if (process.env.API_KEY) {
         process.env.API_KEY = process.env.API_KEY;
       }
       if (process.env.SUPABASE_URL) {
         process.env.SUPABASE_URL = process.env.SUPABASE_URL;
       }
       if (process.env.SUPABASE_ANON_KEY) {
         process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
       }
       
       // 启动Express应用
       app.handle(req, res);
     };
     ```

#### Vercel部署步骤

1. **创建部署**：
   - 注册或登录[Vercel控制面板](https://vercel.com/dashboard)
   - 点击"New Project"按钮导入您的Git仓库
   - 选择项目后，进入项目配置页面

2. **配置项目设置**：
   - 在Framework Preset选项中选择"Other"
   - 在Build and Output Settings中选择"Override"并设置：
     - Build Command: `npm run build:all`
     - Output Directory: `frontend/dist`
     - Install Command: `npm run install:all`
     
3. **配置环境变量**：
   - 在部署设置页面中，找到"Environment Variables"部分
   - 添加以下环境变量：
     ```
     API_KEY=your-secure-api-key
     TRANSPORT_TYPE=sse
     SUPABASE_URL=your-supabase-url
     SUPABASE_ANON_KEY=your-supabase-anon-key
     JWT_SECRET=your-jwt-secret
     NODE_ENV=production
     NEXT_PUBLIC_API_URL=/api
     ```

4. **执行部署**：
   - 点击"Deploy"按钮开始部署过程
   - 等待部署完成，这可能需要几分钟时间

#### Supabase配置

1. **创建Supabase项目**：
   - 登录[Supabase控制面板](https://app.supabase.io/)
   - 点击"New Project"创建新项目
   - 完成项目创建过程并获取项目的URL和密钥

2. **数据库初始化**：
   - 在Supabase项目中打开SQL编辑器
   - 将`supabase/schema.sql`文件中的内容复制到SQL编辑器中
   - 执行脚本创建必要的表和触发器

3. **配置CORS设置**：
   - 在Supabase项目设置中，进入API设置页面
   - 在“CORS”部分，添加您的Vercel部署URL到允许列表：
     ```
     https://your-project-name.vercel.app
     ```

4. **配置JWT密钥**：
   - 在Supabase的“设置 > API”页面中，找到JWT密钥
   - 确保Vercel环境变量中的JWT_SECRET与此密钥一致

#### 验证与维护

1. **验证部署**：
   - 访问您的Vercel部署URL：`https://your-project-name.vercel.app`
   - 测试前端功能：尝试注册、登录和管理提示词
   - 测试API功能：如`https://your-project-name.vercel.app/api/health`
   - 测试MCP功能：如`https://your-project-name.vercel.app/tools`

2. **日志和监控**：
   - 在Vercel控制面板中查看部署日志
   - 如需要，集成外部日志服务，如Papertrail或Logtail

3. **持续集成**：
   - 在Vercel项目设置中启用“自动部署”
   - 为拉取请求启用预览部署
   - 在Git仓库中添加Vercel部署状态弹出窗口

4. **定制域名**：
   - 在Vercel的“域名”部分添加您自己的域名
   - 配置DNS记录以指向Vercel服务
   - 启用自动SSL证书管理

### 其他云平台

MCP Prompt Server也可以部署到其他云平台：

1. **AWS Lambda**：
   - 使用Serverless框架部署
   - 为API端点配置API Gateway
   - 使用DynamoDB或RDS替代Supabase

2. **Google Cloud Run**：
   - 构建并推送Docker镜像到Google Container Registry
   - 使用Cloud Run部署容器
   - 配置环境变量和服务设置

3. **Azure Functions**：
   - 使用Azure Function App部署
   - 配置HTTP触发器映射到API端点
   - 使用Azure Database作为存储后端

## 数据库设置

MCP Prompt Server使用Supabase作为数据库后端，提供高性能存储与分析功能：

### Supabase配置

1. **准备Supabase项目**：
   - 在[Supabase控制面板](https://app.supabase.io/)创建新项目
   - 获取项目URL和匿名密钥

2. **配置数据库**：
   - 在SQL编辑器中执行`supabase/schema.sql`脚本
   - 创建必要的表和触发器

3. **配置环境变量**：
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-key
   JWT_SECRET=your-jwt-secret
   ```

### 数据库功能

Supabase提供以下核心功能：

1. **提示词管理**：
   - 存储提示词定义、版本和元数据
   - 支持复杂的分类和标签系统

2. **性能分析**：
   - 跟踪提示词使用情况和性能指标
   - 存储用户反馈和评分
   - 支持A/B测试

## 身份验证

MCP Prompt Server提供多种身份验证选项：

1. **API密钥认证**：
   - 在请求头中包含`Authorization: Bearer your-api-key`
   - 或在查询参数中添加`?api_key=your-api-key`

2. **Supabase认证**：
   - 使用JWT令牌进行用户认证
   - 支持登录、注册和注销功能

## 高级配置

### 自定义端口

默认端口为9010，可通过以下方式修改：

1. **环境变量**：
   ```
   PORT=8080
   ```

2. **启动命令**：
   ```bash
   PORT=8080 npm run server
   ```

### 日志级别

控制日志输出详细程度：

```
LOG_LEVEL=debug  # 详细日志，用于开发
LOG_LEVEL=info   # 标准日志，用于生产
LOG_LEVEL=error  # 仅错误日志，最小化输出
```

### MCP传输类型

根据部署环境选择适当的传输类型：

```
TRANSPORT_TYPE=stdio  # 本地开发环境
TRANSPORT_TYPE=sse    # 远程/云部署环境
```
