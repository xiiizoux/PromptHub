# PromptHub MCP 适配器使用指南

## 📋 概述

`prompthub-mcp.js` 是用于第三方AI客户端（如Cursor、Claude Desktop等）连接PromptHub MCP服务器的适配器脚本。

## 🚀 快速开始

### 1. 下载适配器

```bash
# 方法1: 直接下载
curl -o prompthub-mcp.js https://raw.githubusercontent.com/xiiizoux/PromptHub/main/prompthub-mcp.js

# 方法2: 从GitHub Release下载
# (待发布时可用)
```

### 2. 获取API密钥

访问 [PromptHub官网](https://prompt-hub.cc) 注册账号并获取API密钥。

### 3. 配置AI客户端

#### Cursor配置

在Cursor设置中添加MCP服务器配置：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["/path/to/prompthub-mcp.js"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hub.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Claude Desktop配置

在 `~/.claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["/absolute/path/to/prompthub-mcp.js"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hub.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🔧 配置选项

### 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `API_KEY` | PromptHub API密钥 | - | ✅ |
| `MCP_SERVER_URL` | MCP服务器地址 | `https://mcp.prompt-hub.cc` | ❌ |
| `MCP_TIMEOUT` | 请求超时时间(毫秒) | `60000` | ❌ |

### 本地开发配置

如果你在本地运行PromptHub服务器：

```json
{
  "env": {
    "MCP_SERVER_URL": "http://localhost:9010",
    "API_KEY": "your-local-api-key"
  }
}
```

## 🛠️ 可用工具

适配器会自动发现服务器上的所有可用工具，包括：

### 基础工具
- `get_categories` - 获取所有提示词分类
- `get_tags` - 获取所有提示词标签
- `get_prompt_names` - 获取所有可用的提示词名称
- `get_prompt_details` - 获取特定提示词的详细信息
- `create_prompt` - 创建新的提示词
- `update_prompt` - 更新现有提示词
- `search_prompts` - 根据关键词搜索提示词

### 智能工具
- `intelligent_prompt_selection` - 智能推荐最合适的提示词
- `intelligent_prompt_storage` - 智能分析并存储提示词
- `quick_store` - 一键存储提示词
- `smart_store` - 智能存储提示词

### 搜索工具
- `unified_search` - 统一搜索引擎
- `advanced_search` - 高级搜索
- `multi_field_search` - 多字段搜索
- `smart_filter` - 智能过滤



## 🔍 故障排除

### 常见问题

#### 1. "未设置API_KEY环境变量"
确保在配置中正确设置了API密钥：
```json
"env": {
  "API_KEY": "your-actual-api-key"
}
```

#### 2. "服务器连接失败"
- 检查网络连接
- 确认服务器地址正确
- 验证API密钥有效性

#### 3. "Tool not found"
- 工具名称可能不正确
- 服务器可能没有该工具
- 尝试使用 `tools/list` 查看可用工具

### 调试模式

适配器会在stderr输出详细的调试信息，包括：
- 初始化过程
- 服务器连接状态
- 工具发现结果
- 消息处理过程

### 日志示例

```
[PromptHub MCP] 正在初始化...
[PromptHub MCP] 服务器: https://mcp.prompt-hub.cc
[PromptHub MCP] API密钥: 已设置
[PromptHub MCP] 服务器连接正常 (状态: healthy)
[PromptHub MCP] 发现 30 个工具
[PromptHub MCP] 初始化完成，等待MCP协议消息...
```

## 📚 使用示例

### 在Cursor中使用

1. 配置完成后，重启Cursor
2. 在聊天中可以直接使用PromptHub的工具：
   - "帮我搜索关于代码优化的提示词"
   - "创建一个新的提示词用于邮件写作"
   - "分析这个提示词的性能数据"

### 工具调用示例

```javascript
// 搜索提示词
await tools.call('search_prompts', {
  query: '代码优化'
});

// 智能推荐
await tools.call('intelligent_prompt_selection', {
  user_query: '我需要写一封商务邮件',
  max_results: 5
});

// 快速存储
await tools.call('quick_store', {
  content: '你是一个专业的代码审查专家...',
  make_public: false
});
```

## 🔒 安全注意事项

1. **API密钥安全**: 不要在代码中硬编码API密钥
2. **网络安全**: 生产环境建议使用HTTPS
3. **权限控制**: API密钥具有相应的访问权限限制

## 🆕 更新适配器

适配器会自动检查更新，但你也可以手动更新：

```bash
# 重新下载最新版本
curl -o prompthub-mcp.js https://raw.githubusercontent.com/xiiizoux/PromptHub/main/prompthub-mcp.js
```

## 📞 支持

如遇问题，请：
1. 查看调试日志
2. 检查网络连接和API密钥
3. 访问 [GitHub Issues](https://github.com/xiiizoux/PromptHub/issues)
4. 联系技术支持

---

**版本**: 1.0.0  
**更新日期**: 2024-06-22  
**兼容性**: MCP协议 2024-11-05