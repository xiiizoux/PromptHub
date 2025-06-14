# 🔐 MCP用户认证和搜索功能指南

## 📋 概述

MCP Prompt Server支持完整的用户认证系统，用户可以通过API密钥访问公开提示词和个人私有提示词。搜索功能经过优化，提供清晰的结果展示和便捷的选择逻辑。

## 🔑 用户认证方式

### 1. API密钥认证（推荐）

**获取API密钥：**
```bash
# 通过web界面或API生成用户API密钥
curl -X POST http://localhost:9011/api/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "MCP Client Key", "expiresInDays": 365}'
```

**使用API密钥：**
```bash
# 方式1：通过Header
curl -H "x-api-key: YOUR_API_KEY" http://localhost:9010/api/mcp/tools

# 方式2：通过查询参数
curl "http://localhost:9010/api/mcp/tools?api_key=YOUR_API_KEY"

# 方式3：通过Bearer Token
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:9010/api/mcp/tools
```

### 2. JWT Token认证

```bash
# 使用JWT Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:9010/api/mcp/tools

# 或通过查询参数
curl "http://localhost:9010/api/mcp/tools?token=YOUR_JWT_TOKEN"
```

### 3. 系统级访问

```bash
# 使用系统API密钥（来自.env配置）
curl -H "server-key: YOUR_SERVER_KEY" http://localhost:9010/api/mcp/tools
```

### 4. 公开访问

```bash
# 仅访问公开内容，无需认证
curl -H "x-public-access: true" http://localhost:9010/api/mcp/tools
```

## 🔍 搜索功能详解

### 基础搜索工具：`search_prompts`

**功能特点：**
- ✅ 自动包含公开提示词
- ✅ 认证用户可访问私有提示词
- ✅ 清晰的结果展示格式
- ✅ 包含选择指导

**使用示例：**
```bash
# 基础搜索
curl -X POST http://localhost:9010/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "search_prompts",
    "arguments": {
      "query": "编程助手"
    }
  }'
```

**响应格式：**
```json
{
  "success": true,
  "query": "编程助手",
  "summary": {
    "totalFound": 5,
    "includePublic": true,
    "includePrivate": true,
    "userAuthenticated": true
  },
  "results": [
    {
      "index": 0,
      "name": "Python编程助手",
      "description": "专业的Python编程问题解决工具",
      "category": "编程",
      "tags": ["Python", "编程", "助手"],
      "isPublic": true,
      "isOwner": false,
      "version": 1.0,
      "difficulty": "intermediate",
      "preview": "你是一个专业的Python编程助手，可以帮助用户解决编程问题...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "instructions": {
    "selectPrompt": "使用 get_prompt_details 工具获取完整提示词内容，参数：{\"name\": \"提示词名称\"}",
    "enhancedSearch": "使用 enhanced_search_prompts 工具进行更高级的搜索和选择",
    "quickAccess": "使用 quick_access_prompts 工具快速访问分类和热门内容"
  }
}
```

### 增强搜索工具：`enhanced_search_prompts`

**功能特点：**
- 🎯 多维度搜索条件
- 📊 智能排序和过滤
- 🔄 搜索会话管理
- 📋 多种展示格式

**参数说明：**
```json
{
  "query": "搜索关键词（可选）",
  "category": "分类筛选（可选）",
  "tags": ["标签1", "标签2"],
  "difficulty": "beginner|intermediate|advanced",
  "include_public": true,
  "include_private": true,
  "sort_by": "relevance|latest|popular|name",
  "max_results": 10,
  "show_preview": true,
  "format": "detailed|summary|list"
}
```

**使用示例：**
```bash
# 高级搜索
curl -X POST http://localhost:9010/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "enhanced_search_prompts",
    "arguments": {
      "query": "编程",
      "category": "编程",
      "difficulty": "intermediate",
      "sort_by": "relevance",
      "max_results": 5,
      "format": "detailed"
    }
  }'
```

### 提示词选择工具：`select_prompt_by_index`

**功能特点：**
- 🎯 基于搜索会话的精确选择
- 📋 完整的提示词信息
- 📊 版本历史和使用统计
- 🔐 权限验证

**使用示例：**
```bash
# 选择搜索结果中的第一个提示词
curl -X POST http://localhost:9010/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "select_prompt_by_index",
    "arguments": {
      "search_id": "search_1704067200000_abc123def",
      "index": 0,
      "include_versions": true,
      "include_usage_stats": true
    }
  }'
```

### 快速访问工具：`quick_access_prompts`

**功能特点：**
- 📂 快速访问分类列表
- 🔥 热门提示词推荐
- 📅 最近使用记录
- ⭐ 收藏功能（开发中）

**使用示例：**
```bash
# 获取所有分类
curl -X POST http://localhost:9010/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "quick_access_prompts",
    "arguments": {
      "access_type": "categories"
    }
  }'

# 获取热门提示词
curl -X POST http://localhost:9010/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "quick_access_prompts",
    "arguments": {
      "access_type": "popular",
      "limit": 10
    }
  }'
```

## 🎯 用户体验优化

### 1. 清晰的权限提示

每个搜索结果都包含权限信息：
- `isPublic`: 是否为公开提示词
- `isOwner`: 当前用户是否为所有者
- `canEdit`: 是否可以编辑
- `canDelete`: 是否可以删除

### 2. 智能搜索建议

搜索结果包含操作指导：
```json
{
  "instructions": {
    "selectPrompt": "选择提示词的具体方法",
    "enhancedSearch": "使用高级搜索的建议",
    "quickAccess": "快速访问的方式"
  }
}
```

### 3. 搜索会话管理

- 🔄 搜索结果缓存1小时
- 🎯 基于会话ID的精确选择
- 🧹 自动清理过期会话

### 4. 多种展示格式

**列表格式（list）：**
```json
{
  "index": 0,
  "name": "提示词名称",
  "category": "分类",
  "isPublic": true
}
```

**摘要格式（summary）：**
```json
{
  "index": 0,
  "name": "提示词名称",
  "description": "描述",
  "category": "分类",
  "tags": ["标签"],
  "preview": "内容预览..."
}
```

**详细格式（detailed）：**
```json
{
  "index": 0,
  "name": "提示词名称",
  "description": "描述",
  "category": "分类",
  "tags": ["标签"],
  "preview": "完整内容预览",
  "estimatedTokens": 150,
  "variables": ["变量1", "变量2"],
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

## 🔧 第三方客户端配置

### Claude Desktop配置

```json
{
  "mcpServers": {
    "prompt-hub": {
      "command": "node",
      "args": ["path/to/mcp/dist/src/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-key",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### 在Claude Desktop中使用

```
# 搜索编程相关提示词
使用enhanced_search_prompts工具搜索编程相关的提示词

# 快速访问分类
使用quick_access_prompts工具查看所有可用分类

# 选择特定提示词
使用select_prompt_by_index工具选择搜索结果中的第一个提示词
```

## 📊 权限矩阵

| 认证状态 | 公开提示词 | 私有提示词 | 创建提示词 | 编辑提示词 | 删除提示词 |
|---------|-----------|-----------|-----------|-----------|-----------|
| 未认证   | ✅ 只读    | ❌        | ❌        | ❌        | ❌        |
| 用户认证 | ✅ 只读    | ✅ 自己的  | ✅        | ✅ 自己的  | ✅ 自己的  |
| 系统级   | ✅ 全部    | ✅ 全部    | ✅        | ✅ 全部    | ✅ 全部    |

## 🚀 最佳实践

### 1. 认证方式选择
- **第三方客户端**：推荐使用API密钥
- **开发测试**：可使用系统密钥
- **公开访问**：使用公开访问模式

### 2. 搜索策略
- **精确查找**：使用`get_prompt_details`
- **探索发现**：使用`enhanced_search_prompts`
- **快速访问**：使用`quick_access_prompts`

### 3. 结果处理
- **大量结果**：使用分页和过滤
- **精确选择**：使用搜索会话ID
- **批量操作**：结合多个工具使用

这个设计确保了MCP服务器提供清晰、安全、高效的用户认证和搜索体验！ 