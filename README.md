# PromptHub - AI提示词管理平台

PromptHub是一个全面的提示词管理平台，为AI开发者、内容创作者和企业用户提供创建、管理、分享和分析AI提示词的工具。

## ✨ 核心特性

- 🤖 **智能提示词管理** - 创建、编辑、版本控制和分类管理
- 🔌 **MCP协议支持** - 与Claude Desktop、Cursor等AI工具无缝集成
- 📊 **性能分析** - 详细的使用统计和优化建议
- 🚀 **RESTful API** - 完整的API支持，方便第三方集成
- 🛡️ **安全认证** - 用户管理、权限控制和API密钥管理
- ⚡ **AI智能辅助** - 自动分类、标签提取和内容优化

## 📁 项目结构

```
PromptHub/
├── web/                      # Next.js前端应用
│   ├── src/pages/docs/       # 用户文档（使用指南）
│   ├── src/components/       # React组件
│   └── src/lib/              # 工具函数和API客户端
├── mcp/                      # MCP服务器
│   ├── src/                  # 核心业务逻辑
│   └── tools/                # MCP工具实现
├── supabase/                 # 数据库配置
│   ├── migrations/           # 数据库迁移
│   └── schema.sql            # 数据库架构
├── docs/                     # 开发者技术文档
├── scripts/                  # 辅助脚本
└── .env                      # 环境配置（统一配置文件）
```

## 📚 文档分类

### 用户文档（Web端）
位置：`web/src/pages/docs/`
- **入门指南** - 快速开始使用PromptHub
- **基础功能** - 核心功能详解和使用方法
- **MCP集成** - 与AI工具的集成指南
- **API集成** - REST API使用指南
- **最佳实践** - 提示词设计和优化技巧
- **示例库** - 丰富的使用示例和模板

### 开发者文档（docs文件夹）
位置：`docs/`
- `developer-guide.md` - 项目开发指南和架构说明
- `docker-deployment.md` - Docker部署配置和说明
- `database-structure.md` - 数据库设计和表结构
- `security-guide.md` - 安全配置和最佳实践
- `security-implementation.md` - 友好安全增强实施方案
- `security-audit-fixes.md` - 安全审计报告与修复方案
- `permission-management.md` - 权限管理系统设计

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18.0.0
- Docker & Docker Compose
- PostgreSQL（或使用Supabase）

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/xiiizoux/PromptHub.git
   cd PromptHub
   ```

2. **环境配置**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

3. **安装依赖**
   ```bash
   # 安装所有依赖
   npm run install:all
   ```

4. **启动服务**
   ```bash
   # 启动开发环境
   npm run dev
   
   # 或使用Docker
   docker-compose up -d
   ```

5. **访问应用**
   - Web界面：http://localhost:9011
   - MCP服务器：http://localhost:9010
   - 文档中心：http://localhost:9011/docs

## 🔧 配置说明

### 环境变量

项目使用统一的`.env`文件进行配置：

```bash
# 数据库配置
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI服务配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE_URL=https://api.openai.com/v1

# 服务端口
WEB_PORT=9011
MCP_PORT=9010

# JWT配置
JWT_SECRET=your-jwt-secret

# 安全配置
SECURITY_LEVEL=balanced  # loose/balanced/strict

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### MCP工具集成

支持与多种AI工具集成：

- **Claude Desktop** - Anthropic官方桌面应用
- **Cursor IDE** - AI编程开发环境
- **自定义工具** - 任何支持MCP协议的工具

详细配置请参考：[MCP集成指南](http://localhost:9011/docs/mcp-integration)

## 📊 主要功能

### 提示词管理
- 创建和编辑提示词
- 版本控制和历史记录
- 分类和标签管理
- 批量导入导出

### AI智能辅助
- 自动分类和标签提取
- 模板变量识别
- 改进建议生成
- 使用场景分析

### 性能分析
- 使用统计和趋势分析
- 响应时间监控
- Token消耗统计
- A/B测试支持

### 集成能力
- RESTful API
- MCP协议支持
- Webhook通知
- 第三方工具集成

## 🛠️ 开发指南

### 前端开发
```bash
cd web
npm run dev
```

### 后端开发
```bash
cd mcp
npm run dev
```

### 数据库迁移
```bash
cd supabase
npx supabase db push
```

### 构建部署
```bash
# 构建所有服务
npm run build

# Docker部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🔗 相关链接

- **在线文档**：[http://localhost:9011/docs](http://localhost:9011/docs)
- **API参考**：[http://localhost:9011/docs/api-integration](http://localhost:9011/docs/api-integration)
- **MCP集成**：[http://localhost:9011/docs/mcp-integration](http://localhost:9011/docs/mcp-integration)
- **开发者指南**：[docs/developer-guide.md](docs/developer-guide.md)
- **安全配置**：[docs/security-guide.md](docs/security-guide.md)
- **安全实施方案**：[docs/security-implementation.md](docs/security-implementation.md)
- **安全审计报告**：[docs/security-audit-fixes.md](docs/security-audit-fixes.md)
- **安全使用指南**：[docs/security-usage-guide.md](docs/security-usage-guide.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或需要帮助：

1. 查看[在线文档](http://localhost:9011/docs)
2. 搜索[已知问题](../../issues)
3. 创建[新问题](../../issues/new)

---

**PromptHub** - 让AI提示词管理变得简单高效 🚀