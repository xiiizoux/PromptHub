# PromptHub 项目结构导航指南

本文档提供PromptHub项目的结构概览，帮助开发者快速定位和理解项目中的文件、组件和代码块。随着项目的发展，请保持此文档的更新。

## 目录

- [项目整体结构](#项目整体结构)
- [前端 (web)](#前端-web)
  - [核心组件](#核心组件)
  - [页面](#页面)
  - [上下文与状态管理](#上下文与状态管理)
  - [API客户端](#api客户端)
- [后端 (mcp)](#后端-mcp)
  - [API路由](#api路由)
  - [存储层](#存储层)
  - [性能追踪](#性能追踪)
- [数据库 (supabase)](#数据库-supabase)
  - [模式定义](#模式定义)
  - [安全和访问控制](#安全和访问控制)
- [实用脚本](#实用脚本)

## 项目整体结构

PromptHub项目由三个主要部分组成：

1. **前端 (`/web`)**: Next.js应用，处理用户界面和交互
2. **后端 (`/mcp`)**: MCP服务器，提供API和提示词管理功能
3. **数据库 (`/supabase`)**: Supabase配置和SQL脚本

主要配置文件:
- `/build.sh` - 项目构建脚本
- `/package.json` - 项目依赖
- `/README.md` - 项目说明
- `/start.sh` 和 `/stop.sh` - 启动和停止服务脚本

## 前端 (web)

### 核心组件

#### 布局组件 (`/web/src/components/layout/`)

| 文件 | 功能描述 |
|------|----------|
| `Layout.tsx` | 主布局组件，包含Navbar和Footer |
| `Navbar.tsx` | 导航栏组件，处理导航和用户菜单 |
| `Footer.tsx` | 页脚组件，包含链接和版权信息 |

#### 提示词组件 (`/web/src/components/prompts/`)

| 文件 | 功能描述 |
|------|----------|
| `PromptCard.tsx` | 提示词卡片组件，展示提示词概要信息 |
| `PromptFilters.tsx` | 提示词筛选组件，用于搜索和过滤提示词 |

### 页面

#### 认证页面 (`/web/src/pages/auth/`)

| 文件 | 功能描述 |
|------|----------|
| `login.tsx` | 用户登录页面 |
| `register.tsx` | 用户注册页面，包含表单验证 |

#### 提示词管理页面 (`/web/src/pages/prompts/`)

| 文件 | 功能描述 |
|------|----------|
| `index.tsx` | 提示词列表页面 |
| `[name].tsx` | 提示词详情页面 |
| `[name]/edit.tsx` | 提示词编辑页面 |

#### 用户资料页面 (`/web/src/pages/profile/`)

| 文件 | 功能描述 |
|------|----------|
| `index.tsx` | 用户资料页面，允许用户更新信息 |
| `api-keys.tsx` | API密钥管理页面 |

#### 分析页面 (`/web/src/pages/analytics/`)

| 文件 | 功能描述 |
|------|----------|
| `index.tsx` | 综合分析页面 |
| `[promptId].tsx` | 单个提示词的详细分析 |

#### 文档页面 (`/web/src/pages/docs/`)

多个文档页面，提供使用指南和API参考。

### 上下文与状态管理

| 文件 | 功能描述 |
|------|----------|
| `/web/src/contexts/AuthContext.tsx` | 认证上下文，管理用户登录状态 |

**关键代码块**:
- `AuthProvider` 组件 - 提供认证状态和方法
- `useAuth` Hook - 用于组件中访问认证上下文
- `authRegister`/`login`/`logout` 方法 - 处理用户认证

### API客户端

| 文件 | 功能描述 |
|------|----------|
| `/web/src/lib/api-client.ts` | API客户端，封装API请求 |
| `/web/src/lib/supabase.ts` | Supabase客户端配置 |
| `/web/src/lib/api.ts` | API工具函数 |

## 后端 (mcp)

### API路由

| 文件 | 功能描述 |
|------|----------|
| `/mcp/src/api/mcp-router.ts` | MCP路由器，处理提示词请求 |
| `/mcp/src/api/api-keys-router.ts` | API密钥管理路由 |
| `/mcp/src/api/auth-middleware.ts` | 认证中间件 |

### 存储层

| 文件 | 功能描述 |
|------|----------|
| `/mcp/src/storage/storage-factory.ts` | 存储工厂，创建存储适配器 |
| `/mcp/src/storage/supabase-adapter.ts` | Supabase存储适配器 |

### 性能追踪

| 文件 | 功能描述 |
|------|----------|
| `/mcp/src/performance/performance-tracker.ts` | 性能追踪实现 |
| `/mcp/src/performance/performance-routes.ts` | 性能相关API路由 |

## 数据库 (supabase)

### 模式定义

| 文件 | 功能描述 |
|------|----------|
| `/supabase/schema.sql` | 数据库模式定义，包含所有表和关系 |

### 数据库表及关键字段

#### 用户和认证相关

| 表名 | 描述 | 关键字段 |
|------|----------|----------|
| `users` | 用户信息和认证数据 | `id`, `email`, `display_name`, `created_at` |
| `api_keys` | 存储API密钥 | `id`, `user_id`, `name`, `key_hash`, `expires_at` |

#### 提示词核心相关

| 表名 | 描述 | 关键字段 |
|------|----------|----------|
| `prompts` | 提示词主表 | `id`, `name`, `description`, `category`, `tags`, `messages`, `version`, `is_public`, `user_id` |
| `prompt_versions` | 提示词版本历史 | `id`, `prompt_id`, `version`, `messages`, `user_id`, `created_at` |
| `categories` | 提示词分类信息 | `id`, `name`, `description` |

#### 性能和使用统计

| 表名 | 描述 | 关键字段 |
|------|----------|----------|
| `prompt_usage` | 提示词使用记录 | `id`, `prompt_id`, `prompt_version`, `user_id`, `input_tokens`, `output_tokens`, `latency_ms`, `created_at` |
| `prompt_performance` | 提示词性能汇总 | `id`, `prompt_id`, `prompt_version`, `usage_count`, `avg_rating`, `avg_latency_ms`, `avg_input_tokens`, `avg_output_tokens` |
| `prompt_feedback` | 用户反馈和评分 | `id`, `usage_id`, `rating`, `feedback_text`, `user_id` |

#### 协作和管理

| 表名 | 描述 | 关键字段 |
|------|----------|----------|
| `prompt_ab_tests` | A/B测试配置 | `id`, `name`, `prompt_id`, `version_a`, `version_b`, `metric`, `status`, `result` |
| `prompt_collaborators` | 提示词协作者 | `id`, `prompt_id`, `user_id`, `permission_level` |
| `prompt_audit_logs` | 变更审计记录 | `id`, `prompt_id`, `user_id`, `action`, `changes`, `created_at` |

### 数据库表关系

```
+----------------+       +-------------------+
|     users      |<------|  api_keys        |
+----------------+       +-------------------+
       |^
       ||                +-------------------+
       |+--------------->|  prompt_versions  |
       |                 +-------------------+
       |                         ^
       |                         |
       v                         |
+----------------+       +-------------------+
|    prompts     |------>|  prompt_usage     |
+----------------+       +-------------------+
       |^                         |
       ||                         v
       |+--------------->+-------------------+
       |                 |  prompt_feedback  |
       v                 +-------------------+
+----------------+
| collaborators  |
+----------------+
```

### 核心业务流程

#### 提示词创建和版本管理流程

1. 用户创建提示词 (`prompts` 表)
2. 系统自动创建初始版本 (`prompt_versions` 表)
3. 用户编辑提示词内容
4. 系统创建新版本并逐步递增版本号
5. 提示词主表更新当前版本号

#### 性能跟踪流程

1. 提示词被使用时记录使用情况 (`prompt_usage` 表)
2. 系统自动更新性能汇总 (`prompt_performance` 表)
3. 用户提交反馈 (`prompt_feedback` 表)
4. 反馈数据引发性能汇总的更新

### 安全和访问控制

| 文件 | 功能描述 |
|------|----------|
| `/supabase/migrations/fix_1_auth_rls_initplan.sql` | 优化RLS函数调用 |
| `/supabase/migrations/fix_2_multiple_permissive_policies.sql` | 合并重复策略 |
| `/supabase/migrations/fix_3_rls_disabled_in_public.sql` | 启用users表RLS |
| `/supabase/migrations/fix_4_function_search_path_mutable.sql` | 函数安全性优化 |

**关键函数**:
- `get_auth_uid()` - 获取当前用户ID
- `user_owns_prompt()` - 验证提示词所有权
- `is_prompt_public()` - 检查提示词是否公开

## 高级功能及实现

### API密钥管理

| 文件 | 功能描述 |
|------|----------|
| `/web/src/pages/profile/api-keys.tsx` | 密钥管理前端页面 |
| `/web/src/pages/api/auth/api-keys.ts` | 密钥管理API |
| `/mcp/src/api/api-keys-router.ts` | 密钥后端处理 |

**密钥生成与验证流程**:

1. 用户请求新密钥 → 生成随机密钥 → 存储哈希值 → 返回原始密钥
2. API请求包含密钥 → 验证哈希值匹配 → 检查过期状态 → 授权或拒绝

### A/B测试系统

| 文件 | 功能描述 |
|------|----------|
| `/web/src/pages/analytics/[promptId].tsx` | 测试分析前端 |
| `/web/src/lib/ab-testing.ts` | 测试逻辑库 |

**A/B测试流程**:

1. 创建测试：选择两个版本 → 设置评估指标 → 定义测试周期
2. 执行测试：随机分配版本 → 收集指标数据 → 实时计算统计显著性
3. 完成测试：生成结果报告 → 确定优胜版本 → 更新提示词当前版本

### 协作编辑系统

**权限级别**:
- `edit`: 可编辑内容
- `review`: 可查看但需经审核才能发布
- `admin`: 可管理协作者和分配权限

**协作流程**:

1. 所有者邀请协作者 → 设置权限级别 → 记录到 `prompt_collaborators` 表
2. 协作者编辑提示词 → 创建新版本 → 审计日志记录操作

## 实用脚本

| 文件 | 功能描述 |
|------|----------|
| `/build.sh` | 项目构建脚本 |
| `/start.sh` | 启动所有服务 |
| `/stop.sh` | 停止所有服务 |
| `/web/update-heroicons.sh` | 更新Heroicons图标 |

## 如何使用本指南

1. **定位文件**: 根据功能分类快速找到相关文件
2. **理解关系**: 通过说明了解文件和组件之间的关系
3. **维护更新**: 在添加新文件或更改现有文件功能时更新此文档

## 常见任务指南

### 添加新页面

1. 在 `/web/src/pages/` 中创建新的页面文件
2. 添加到此文档的页面部分
3. 如需添加到导航，修改 `/web/src/components/layout/Navbar.tsx`

### 修改数据库模式

1. 编辑 `/supabase/schema.sql`
2. 创建迁移文件记录更改
3. 更新本文档的数据库部分

### 添加新API端点

1. 在 `/web/src/pages/api/` 添加API路由
2. 添加到此文档的API部分
3. 考虑在 `/web/src/lib/api-client.ts` 中添加客户端方法

## 开发和维护最佳实践

### 代码规范

1. **命名规范**
   - 组件使用 PascalCase（如 `UserProfile`）
   - 函数和变量使用 camelCase（如 `getUserData`）
   - 常量使用大写下划线（如 `MAX_RETRY_COUNT`）

2. **TypeScript 类型定义**
   - 尽量使用明确的类型，避免 `any`
   - 在 `/web/src/types/` 目录下集中定义共用类型

### 更新流程

1. **开发新功能流程**
   - 创建功能分支→ 实现功能 → 编写测试 → 更新文档 → 提交PR
   - 新API端点需要加入到API文档中

2. **数据库更改**
   - 在`/supabase/migrations/`目录创建新的迁移文件
   - 每个迁移文件应包含完整SQL和回滚操作

### 测试策略

1. **前端测试**
   - 组件测试使用 React Testing Library
   - 关键用户流程的端到端测试

2. **后端测试**
   - API端点单元测试
   - 数据库操作函数集成测试

## 文件索引更新规范

为保持本文档的及时更新，每次代码提交应检查以下内容：

1. **新增文件**: 添加到适当的目录索引部分
2. **功能更改**: 更新已存在文件的描述
3. **模式变更**: 更新数据库表或关系图

每月应进行一次文档完整性检查，确保文档和代码保持同步。

---

最后更新时间: 2025-05-28
