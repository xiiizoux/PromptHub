# Package.json 重写改进文档

## 概述
已完全重写项目根目录的 `package.json` 文件，添加了大量新功能、脚本和配置，以提升开发体验和项目管理效率。

## 新增功能

### 1. 项目元数据改进
- **描述更新**：明确标注为"专注Docker部署"
- **作者信息**：添加"PromptHub Team"
- **关键词扩展**：增加docker、nextjs、supabase等标签
- **引擎要求**：指定Node.js >= 18.0.0, npm >= 9.0.0

### 2. 脚本功能大幅扩展

#### 开发脚本
```bash
# 并发启动MCP和Web服务
npm run dev

# 类型检查
npm run typecheck

# 代码检查和格式化
npm run lint
npm run lint:fix
```

#### 构建和启动脚本
```bash
# 构建所有子项目
npm run build:all

# 启动各个服务
npm run mcp:start
npm run web:start
```

#### 测试脚本
```bash
# 运行所有测试
npm test

# 分别测试各组件
npm run mcp:test
npm run web:test
```

#### Docker管理脚本
```bash
# 构建Docker镜像
npm run docker:build
npm run docker:build:optimized

# Docker Compose操作
npm run docker:run
npm run docker:stop
npm run docker:logs
npm run docker:restart
npm run docker:clean

# Docker测试和部署
npm run docker:test
npm run docker:deploy
```

#### Supabase管理脚本
```bash
# Supabase本地开发
npm run supabase:start
npm run supabase:stop
npm run supabase:reset
npm run supabase:migrate
```

#### 依赖管理脚本
```bash
# 检查依赖状态
npm run deps:check

# 更新所有依赖
npm run deps:update

# 清理和重置
npm run clean
npm run reset
```

#### 健康检查脚本
```bash
# 检查服务状态（端口9010和9011）
npm run health:check
```

### 3. 开发工具配置

#### ESLint配置
- 继承Airbnb规范和TypeScript推荐配置
- 强制使用箭头函数、const声明
- 禁止var和全局变量赋值
- 优先使用模板字符串

#### Prettier配置
- 使用分号
- 单引号
- 行宽80字符
- 2空格缩进
- ES5尾随逗号

#### Jest配置
- TypeScript预设
- Node环境
- 支持MCP测试目录结构

### 4. 工作区配置
配置了monorepo工作区：
- `mcp` - MCP服务器
- `web` - Next.js前端应用
- `supabase` - 数据库配置

### 5. 依赖项优化

#### 生产依赖
- 保留核心MCP和数据库依赖
- 添加认证和日志工具

#### 开发依赖
- 完整的TypeScript支持
- 测试框架（Jest、Mocha、Chai）
- 代码质量工具（ESLint、Prettier）
- 构建工具（Babel、TSX）
- 并发执行工具（Concurrently）
- 依赖检查工具（Depcheck）

## 修复的问题

### 1. 包名冲突
- MCP项目：`@prompt-hub/mcp`
- Web项目：`@prompt-hub/web`
- 避免工作区命名冲突

### 2. 端口配置统一
- MCP服务：9010端口
- Web服务：9011端口
- 符合 `.cursorrules` 规范

### 3. 脚本路径问题
- 修复TypeScript类型检查命令
- 统一构建和启动脚本
- 添加错误处理

## 使用示例

### 快速开始
```bash
# 安装所有依赖
npm run install:all

# 开发模式启动
npm run dev

# 生产构建
npm run build:all

# Docker部署
npm run docker:deploy
```

### 开发工作流
```bash
# 1. 类型检查
npm run typecheck

# 2. 代码检查
npm run lint:fix

# 3. 运行测试
npm test

# 4. 健康检查
npm run health:check
```

### 部署工作流
```bash
# 1. 清理环境
npm run clean

# 2. 重新安装
npm run install:all

# 3. 构建项目
npm run build:all

# 4. Docker部署
npm run docker:deploy
```

## 符合规范

### .cursorrules要求
- ✅ 使用函数式编程
- ✅ 避免全局变量
- ✅ 符合ESLint规则
- ✅ 优先使用箭头函数
- ✅ 使用async/await
- ✅ 端口配置正确（9010/9011）

### 项目架构
- ✅ 前端通过Next.js API Routes调用后端
- ✅ MCP专注AI模型交互
- ✅ 禁止敏感信息泄露
- ✅ 统一环境变量管理

## 总结

重写的package.json为项目提供了：
1. **完整的开发工具链**
2. **标准化的代码质量控制**
3. **简化的Docker部署流程**
4. **统一的依赖管理**
5. **便捷的测试和健康检查**

这些改进大大提升了开发效率和项目的可维护性，为团队协作提供了坚实的基础。 