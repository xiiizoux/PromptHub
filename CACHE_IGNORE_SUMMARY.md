# 缓存和临时文件排除配置总结

## 更新的 .gitignore 文件

已更新 `.gitignore` 文件以包含所有需要排除的缓存和临时文件：

### 新增的缓存目录排除规则

1. **构建工具缓存**
   - `.turbo/` - Turbo 构建缓存
   - `.swc/` - SWC 编译器缓存
   - `.webpack/` - Webpack 缓存
   - `.babel-cache/` - Babel 缓存
   - `.vite/` - Vite 缓存
   - `.rollup.cache/` - Rollup 缓存
   - `.parcel-cache/` - Parcel 缓存
   - `.nuxt/` - Nuxt 缓存

2. **TypeScript 构建信息**
   - `*.tsbuildinfo` - TypeScript 增量构建信息
   - `tsconfig.tsbuildinfo`
   - `web/tsconfig.tsbuildinfo`
   - `mcp/tsconfig.tsbuildinfo`

3. **代码质量工具缓存**
   - `.eslintcache` - ESLint 缓存
   - `.prettiercache` - Prettier 缓存
   - `.stylelintcache` - Stylelint 缓存

4. **测试工具缓存**
   - `.jest/` - Jest 测试缓存
   - `.cypress/` - Cypress 测试缓存

5. **开发工具缓存**
   - `.storybook-cache/` - Storybook 缓存

6. **临时文件**
   - `*.tmp` - 临时文件
   - `*.temp` - 临时文件
   - `.tmp/` - 临时目录
   - `.temp/` - 临时目录

7. **系统缓存文件**
   - `.DS_Store?` - macOS 系统文件
   - `.Spotlight-V100` - macOS Spotlight 索引
   - `.Trashes` - macOS 回收站
   - `ehthumbs.db` - Windows 缩略图缓存
   - `Thumbs.db` - Windows 缩略图缓存

8. **项目特定缓存**
   - `web/src/lib/cache-data/` - 我们的API缓存实现目录

## 更新的 .dockerignore 文件

已更新 `.dockerignore` 文件以确保Docker构建时排除所有不必要的文件：

### 新增的排除规则

1. **完整的缓存目录列表**
   - 包含所有上述缓存目录
   - 确保Docker镜像不包含缓存文件

2. **测试文件**
   - `*.test.js`, `*.test.ts`
   - `*.spec.js`, `*.spec.ts`
   - 测试目录和配置文件

3. **开发工具配置**
   - 编辑器配置文件
   - 代码质量工具配置

4. **运行时数据**
   - `*.pid` - 进程ID文件
   - `*.sqlite`, `*.db` - 本地数据库文件

5. **部署相关**
   - `.vercel`, `.now` - 部署平台文件

## 项目结构更新

确保以下目录结构的缓存文件都被正确排除：

```
PromptHub/
├── web/                    # Next.js 前端
│   ├── .next/             # Next.js 构建输出 (排除)
│   ├── node_modules/      # 依赖 (排除)
│   └── src/lib/cache-data/ # API缓存 (排除)
├── mcp/                   # MCP 服务器
│   ├── dist/              # 构建输出 (排除)
│   └── node_modules/      # 依赖 (排除)
├── logs/                  # 日志文件 (排除)
├── node_modules/          # 根目录依赖 (排除)
└── .env                   # 环境变量 (排除)
```

## 缓存功能说明

项目中实现了多层缓存机制：

1. **内存缓存** (`web/src/lib/cache.ts`)
   - 用于缓存频繁请求的数据
   - 自动过期清理机制
   - 减少数据库和MCP服务器负载

2. **API响应缓存** (`web/src/lib/api-handler.ts`)
   - GET请求的自动缓存
   - 可配置的缓存TTL
   - 缓存命中/未命中标头

3. **搜索结果缓存** (`web/src/pages/api/prompts/search.ts`)
   - 搜索结果的智能缓存
   - 热门搜索更长的缓存时间

4. **文件系统缓存目录** (`web/src/lib/cache-data/`)
   - 持久化缓存数据存储
   - 已在忽略文件中排除

## 验证配置

可以使用以下命令验证忽略配置是否正确：

```bash
# 检查 git 状态，确保缓存文件不被跟踪
git status

# 检查 Docker 构建上下文大小
docker build --no-cache -t prompthub .
```

## 注意事项

1. **开发环境**：缓存文件会在开发过程中自动生成，但不会被提交到版本控制
2. **生产环境**：Docker镜像不会包含任何缓存文件，确保镜像大小最小化
3. **清理缓存**：如果遇到问题，可以手动删除缓存目录重新生成

## 环境变量配置

确保在 `.env` 文件中正确配置缓存相关的环境变量：

```bash
# 缓存配置
CACHE_TTL=300              # 默认缓存时间（秒）
ENABLE_CACHE=true          # 是否启用缓存
LOG_LEVEL=info             # 日志级别
```

这些配置确保了项目的缓存系统能够正常工作，同时保持代码仓库和Docker镜像的清洁。 