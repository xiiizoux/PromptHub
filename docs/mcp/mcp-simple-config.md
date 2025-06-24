# MCP服务简化配置指南

## 🎯 核心要点

**你的MCP服务器实际上是一个HTTP REST API服务器，可以通过简单的HTTP请求调用，无需复杂的MCP协议配置！**

## 🚀 推荐方式：直接HTTP API调用

### 基本信息
- **服务器地址**: `https://mcp.prompt-hub.cc`
- **认证方式**: API密钥（通过 `X-Api-Key` 头部）
- **内容类型**: `application/json`

### 快速开始

#### 1. 获取API密钥
访问你的PromptHub账户设置页面获取API密钥。

#### 2. 测试连接
```bash
curl -X GET "https://mcp.prompt-hub.cc/api/health" \
  -H "Content-Type: application/json"
```

#### 3. 获取可用工具
```bash
curl -X GET "https://mcp.prompt-hub.cc/tools" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json"
```

#### 4. 调用工具示例
```bash
# 搜索提示词
curl -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "React hooks", "limit": 5}'

# 快速存储提示词
curl -X POST "https://mcp.prompt-hub.cc/tools/quick_store/invoke" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你是一个React专家，帮助用户解决React相关问题。",
    "title": "React专家助手"
  }'
```

## 🔧 AI客户端集成

### 方式一：🏆 零配置MCP方案（最推荐）

**完全自动化！无需下载文件！一次配置，访问所有工具！**

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**🎯 优势**：
- ✅ **零文件管理**: 无需下载或管理任何文件
- ✅ **自动发现所有工具**: 新工具自动可用
- ✅ **自动更新**: 始终使用最新版本
- ✅ **符合MCP标准**: 更好的AI客户端集成
- ✅ **智能缓存**: 避免重复下载

👉 **详细配置指南**: [MCP通用配置指南](./mcp-universal-config.md)

### 方式二：直接HTTP API配置

#### Cursor IDE配置

在Cursor的设置中添加自定义工具：

```json
{
  "customTools": {
    "promptHub": {
      "name": "PromptHub工具",
      "baseUrl": "https://mcp.prompt-hub.cc",
      "headers": {
        "X-Api-Key": "your-api-key",
        "Content-Type": "application/json"
      },
      "tools": [
        {
          "name": "搜索提示词",
          "endpoint": "/tools/search/invoke",
          "method": "POST",
          "description": "搜索相关的提示词"
        },
        {
          "name": "存储提示词",
          "endpoint": "/tools/quick_store/invoke",
          "method": "POST",
          "description": "快速存储新的提示词"
        }
      ]
    }
  }
}
```

#### 其他AI客户端

大多数AI客户端都支持HTTP API调用，你只需要：

1. **配置基础URL**: `https://mcp.prompt-hub.cc`
2. **添加认证头**: `X-Api-Key: your-api-key`
3. **设置工具端点**: `/tools/{tool_name}/invoke`

## 📋 常用工具端点

| 工具名称 | 端点 | 描述 |
|---------|------|------|
| `search` | `/tools/search/invoke` | 快速搜索提示词 |
| `unified_search` | `/tools/unified_search/invoke` | 高级统一搜索 |
| `quick_store` | `/tools/quick_store/invoke` | 快速存储提示词 |
| `smart_store` | `/tools/smart_store/invoke` | 智能分析并存储 |
| `get_categories` | `/tools/get_categories/invoke` | 获取分类列表 |
| `get_prompt_names` | `/tools/get_prompt_names/invoke` | 获取提示词名称列表 |

## 🔍 工具参数示例

### 搜索工具 (`search`)
```json
{
  "query": "搜索关键词",
  "limit": 10,
  "category": "可选分类"
}
```

### 存储工具 (`quick_store`)
```json
{
  "content": "提示词内容",
  "title": "提示词标题",
  "category": "分类（可选）",
  "tags": ["标签1", "标签2"]
}
```

### 统一搜索 (`unified_search`)
```json
{
  "query": "搜索查询",
  "algorithm": "smart",
  "limit": 10,
  "include_content": true
}
```

## ❓ 为什么推荐HTTP API而不是MCP协议？

1. **简单直接**: 无需复杂的协议配置
2. **通用兼容**: 所有HTTP客户端都支持
3. **易于调试**: 可以直接用curl测试
4. **性能更好**: 减少协议转换开销
5. **更稳定**: 避免协议兼容性问题

## 🆘 如果必须使用MCP协议

如果你的AI客户端严格要求MCP协议，请参考 [MCP使用指南](./mcp-usage-guide.md) 中的传统配置方式。

## 🔧 故障排除

### 常见问题

1. **401 Unauthorized**: 检查API密钥是否正确
2. **404 Not Found**: 确认工具名称和端点路径
3. **500 Server Error**: 检查请求参数格式

### 调试技巧

```bash
# 启用详细输出
curl -v -X POST "https://mcp.prompt-hub.cc/tools/search/invoke" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

## 📞 获取帮助

如果遇到问题，请：
1. 检查 [健康检查端点](https://mcp.prompt-hub.cc/api/health)
2. 查看服务器日志
3. 联系技术支持

---

**总结**: 使用HTTP API调用比复杂的MCP协议配置简单得多，推荐优先使用这种方式！
