# MCP API 路由 - 已弃用

⚠️ **重要提醒：此目录中的API路由已被弃用**

为了实现Web服务和MCP服务的完全解耦，所有MCP相关的API路由已被移除或禁用。

## 迁移说明

### 原有的MCP API路由
- `/api/mcp/tools` - 调用MCP工具
- `/api/mcp/tools/[name]` - 调用特定MCP工具

### 新的解耦API路由
- `/api/prompts` - 提示词列表和创建
- `/api/prompts/[name]` - 提示词详情、更新、删除
- `/api/categories` - 分类列表
- `/api/tags` - 标签列表
- `/api/social/*` - 社交功能（使用直接数据库访问）

## 架构变更

### 旧架构（耦合）
```
前端 → Next.js API Routes → MCP服务 → 数据库
```

### 新架构（解耦）
```
前端 → Next.js API Routes → 数据库服务层 → 数据库
```

## 删除的依赖

- 移除了对MCP服务器的直接调用
- 移除了`mcpProxy`函数的使用
- 创建了独立的`DatabaseService`类
- 使用Supabase适配器直接访问数据库

## 注意事项

1. **不要使用**此目录中的任何API路由
2. **使用新的解耦API**进行所有数据操作
3. **MCP服务仍然独立运行**，专注于AI工具功能
4. **两个服务共享同一个数据库**，但访问方式不同

## 相关文件

- `web/src/lib/database-service.ts` - 新的数据库服务层
- `web/src/lib/supabase-adapter.ts` - Supabase数据库适配器
- `web/src/pages/api/prompts/*` - 新的提示词API路由 