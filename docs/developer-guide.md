# 开发者指南

本文档为PromptHub项目的开发者提供全面的开发指南，包括项目架构、开发环境配置、安全最佳实践、测试指南和缓存优化等内容。

## 目录

- [项目架构](#项目架构)
- [开发环境配置](#开发环境配置)
- [安全配置](#安全配置)
- [Web应用开发](#web应用开发)
- [缓存系统](#缓存系统)
- [重定向功能](#重定向功能)
- [测试指南](#测试指南)
- [部署指南](#部署指南)

## 项目架构

PromptHub采用前后端分离的架构设计：

```
PromptHub/
├── mcp/                      # MCP服务目录
│   ├── src/                  # MCP服务源代码
│   ├── tests/                # 测试目录
│   └── package.json          # MCP服务依赖和脚本
├── web/                      # Web应用目录
│   ├── src/                  # Web应用源代码
│   │   ├── components/       # React组件
│   │   ├── pages/            # Next.js页面
│   │   ├── lib/              # 工具函数和API客户端
│   │   └── hooks/            # 自定义React Hooks
│   └── package.json          # Web应用依赖和脚本
├── docs/                     # 详细文档
├── .env                      # 环境变量文件（统一配置）
└── package.json              # 项目根目录依赖和脚本
```

### 架构原则

- **MCP服务(端口9010)**：专注于AI模型交互和工具调用，不直接与前端交互
- **Next.js API Routes**：作为中间层，处理REST风格的API请求，为前端提供统一的API接口
- **Web应用(端口9011)**：只能通过Next.js API Routes调用后端，禁止直接调用MCP服务器

## 开发环境配置

### 前置条件

- Node.js 18.x 或更高版本
- npm 或 yarn 包管理器
- Git 版本控制

### 安装和启动

1. **克隆仓库**：
   ```bash
   git clone https://github.com/xiiizoux/mcp-prompt-server.git
   cd PromptHub
   ```

2. **安装依赖**：
   ```bash
   # 安装所有依赖（MCP服务和Web应用）
   npm run install:all
   
   # 或者分别安装
   npm run mcp:install  # 安装MCP服务依赖
   npm run web:install  # 安装Web应用依赖
   ```

3. **环境变量配置**：
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

4. **启动开发服务**：
   ```bash
   # 一键启动所有服务
   npm start
   
   # 或者分别启动
   npm run mcp:dev    # 启动MCP服务
   npm run web:dev    # 启动Web应用
   ```

### 开发命令

```bash
# 构建项目
npm run build:all      # 构建所有项目
npm run mcp:build      # 构建MCP服务
npm run web:build      # 构建Web应用

# 测试
npm run mcp:test       # 运行MCP服务测试

# 停止服务
npm run stop           # 停止所有服务
```

## 安全配置

### 环境变量配置

为了确保应用的安全性，所有敏感信息都应该通过环境变量进行配置。在项目根目录的 `.env` 文件中设置以下环境变量：

```bash
# MCP 服务器配置
API_URL=http://localhost:9010
API_KEY=your-secure-api-key-here
MCP_URL=http://localhost:9010
BACKEND_URL=http://localhost:9010

# Web应用配置
FRONTEND_PORT=9011
CORS_ORIGIN=http://localhost:9011

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# JWT 配置
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=9010
NODE_ENV=development
LOG_LEVEL=info
```

### 安全最佳实践

1. **密钥管理**：
   - 使用强密码和密钥（API_KEY至少32位，JWT_SECRET至少64位）
   - 定期轮换密钥
   - 永远不要将 `.env` 文件提交到版本控制系统

2. **密钥生成**：
   ```bash
   # 生成API密钥
   openssl rand -hex 32
   
   # 生成JWT密钥
   openssl rand -hex 64
   ```

3. **生产环境**：
   - 通过部署平台的环境变量设置敏感信息
   - 不要在生产环境中使用默认值
   - 使用HTTPS确保传输安全

## Web应用开发

### 技术栈

- **前端框架**: Next.js (React)
- **样式**: Tailwind CSS
- **状态管理**: React Hooks + Context API
- **API通信**: Axios
- **表单处理**: React Hook Form
- **数据获取**: SWR

### 组件结构

```
src/components/
├── layout/               # 布局组件（导航栏、页脚等）
├── prompts/              # 提示词相关组件
├── ui/                   # 通用UI组件
└── auth/                 # 认证相关组件
```

### 开发指南

1. **添加新页面**：
   - 在`src/pages/`目录下创建新的`.tsx`文件
   - 使用Next.js的文件系统路由
   - 导入必要的组件和钩子

2. **添加新组件**：
   - 在适当的目录下创建新的`.tsx`文件
   - 定义TypeScript接口（Props）
   - 实现组件功能并导出

3. **样式指南**：
   - 使用Tailwind CSS类进行样式设计
   - 遵循项目中定义的设计系统
   - 对于复杂组件，可以使用`@apply`定义组合类

### API集成

Web应用通过Next.js API Routes与MCP服务通信：

```typescript
// 示例：调用API
import { apiClient } from '@/lib/api';

const fetchPrompts = async () => {
  const response = await apiClient.get('/api/prompts');
  return response.data;
};
```

## 缓存系统

项目实现了多层缓存机制以提高性能：

### 1. 内存缓存

位置：`web/src/lib/cache.ts`

```typescript
// 使用内存缓存
import { cache } from '@/lib/cache';

const cachedData = cache.get('key');
cache.set('key', data, 300); // 缓存5分钟
```

### 2. API响应缓存

位置：`web/src/lib/api-handler.ts`

- GET请求的自动缓存
- 可配置的缓存TTL
- 缓存命中/未命中标头

### 3. 搜索结果缓存

位置：`web/src/pages/api/prompts/search.ts`

- 搜索结果的智能缓存
- 热门搜索更长的缓存时间

### 缓存配置

在 `.env` 文件中配置缓存相关参数：

```bash
CACHE_TTL=300              # 默认缓存时间（秒）
ENABLE_CACHE=true          # 是否启用缓存
```

### 缓存文件排除

项目配置了完整的缓存文件排除规则：

#### .gitignore 排除规则

- 构建工具缓存：`.turbo/`, `.swc/`, `.webpack/`, `.babel-cache/`
- TypeScript构建信息：`*.tsbuildinfo`
- 代码质量工具缓存：`.eslintcache`, `.prettiercache`
- 测试工具缓存：`.jest/`, `.cypress/`
- 临时文件：`*.tmp`, `*.temp`
- 项目特定缓存：`web/src/lib/cache-data/`

#### .dockerignore 排除规则

确保Docker构建时排除所有不必要的缓存文件，保持镜像大小最小化。

## 重定向功能

实现了完整的用户登录/注册重定向功能，确保用户在认证完成后能够返回到原本想要访问的页面。

### 重定向工具函数

位置：`web/src/lib/redirect.ts`

```typescript
import { 
  getRedirectUrl, 
  buildUrlWithRedirect, 
  redirectToLogin, 
  handlePostLoginRedirect 
} from '@/lib/redirect';

// 重定向到登录页面
redirectToLogin(router);

// 构建带重定向的链接
const loginUrl = buildUrlWithRedirect('/auth/login', '/create');

// 处理登录后重定向
handlePostLoginRedirect(router, '/dashboard');
```

### 安全考虑

1. **开放重定向防护**：`isSafeRedirectUrl()` 函数确保只能重定向到同域URL
2. **URL编码**：所有重定向URL都经过适当的编码处理
3. **参数验证**：检查重定向参数的有效性

### 测试重定向功能

访问测试页面验证重定向功能：`http://localhost:9011/test-redirect`

## 测试指南

### 单元测试

```bash
# 运行MCP服务测试
npm run mcp:test

# 运行特定测试文件
cd mcp && npm test -- --testNamePattern="API Keys"
```

### 功能测试

1. **重定向功能测试**：
   - 未登录用户访问受保护页面
   - 登录后自动跳转到原页面
   - 注册流程的重定向保持

2. **API端点测试**：
   ```bash
   # 测试健康检查
   curl http://localhost:9010/api/health
   
   # 测试提示词API
   curl http://localhost:9011/api/prompts
   ```

3. **缓存功能测试**：
   - 验证缓存命中率
   - 测试缓存过期机制
   - 检查缓存文件生成

### 性能测试

- 使用浏览器开发者工具监控性能
- 检查缓存效果和API响应时间
- 验证内存使用情况

## 部署指南

### 本地部署

```bash
# 构建项目
npm run build:all

# 启动生产服务
npm start
```

### Docker部署

```bash
# 构建Docker镜像
docker build -t prompthub:latest .

# 运行容器
docker run -p 9010:9010 -p 9011:9011 \
  -e API_KEY=your-secure-api-key \
  -e SUPABASE_URL=your-supabase-url \
  -e SUPABASE_ANON_KEY=your-supabase-anon-key \
  prompthub:latest
```

### 生产环境注意事项

1. **环境变量**：通过部署平台设置所有必需的环境变量
2. **数据库**：确保Supabase配置正确
3. **监控**：设置日志监控和错误追踪
4. **备份**：定期备份数据库和重要配置

## 故障排除

### 常见问题

1. **端口冲突**：
   ```bash
   # 检查端口占用
   lsof -i :9010
   lsof -i :9011
   
   # 停止服务
   npm run stop
   ```

2. **环境变量问题**：
   - 检查 `.env` 文件是否存在
   - 验证所有必需的环境变量是否设置
   - 确保环境变量格式正确

3. **缓存问题**：
   ```bash
   # 清理缓存
   rm -rf web/.next
   rm -rf mcp/dist
   rm -rf node_modules/.cache
   ```

4. **数据库连接问题**：
   - 验证Supabase URL和密钥
   - 检查网络连接
   - 确认数据库表结构正确

### 调试技巧

1. **日志查看**：
   ```bash
   # 查看服务日志
   tail -f /tmp/mcp.log
   tail -f /tmp/web.log
   ```

2. **开发者工具**：
   - 使用浏览器开发者工具检查网络请求
   - 查看控制台错误信息
   - 监控性能指标

3. **API测试**：
   ```bash
   # 测试MCP服务
   curl -H "Authorization: Bearer $API_KEY" http://localhost:9010/api/health
   
   # 测试Web API
   curl http://localhost:9011/api/prompts
   ```

## 贡献指南

1. **代码规范**：
   - 使用TypeScript进行类型检查
   - 遵循ESLint规则
   - 使用Prettier格式化代码

2. **提交规范**：
   - 使用清晰的提交信息
   - 每个提交只包含一个功能或修复
   - 在提交前运行测试

3. **Pull Request**：
   - 创建功能分支
   - 编写测试用例
   - 更新相关文档
   - 通过代码审查

## 许可证

MIT License - 详见 LICENSE 文件。 