# MCP零配置示例

## 🎯 一键复制配置

以下是各种AI客户端的零配置示例，**复制粘贴即可使用**！

**🔗 自动连接到**: `https://mcp.prompt-hub.cc` （无需手动设置URL）

## 🏆 Claude Desktop

文件位置: `~/.config/claude-desktop/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here",
        "MCP_SERVER_URL": "https://mcp.ptompt-hb.cc"
      }
    }
  }
}
```

## 🚀 Cursor IDE

在Cursor的MCP设置中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here",
        "MCP_SERVER_URL": "https://mcp.ptompt-hb.cc"
      }
    }
  }
}
```

## 🔧 Continue.dev

在Continue配置中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🎨 Codeium

在Codeium的MCP配置中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🌟 通用MCP客户端

对于任何支持MCP协议的客户端：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "curl",
      "args": ["-s", "https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js", "|", "node"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🔄 备选方案（Node.js内联）

如果你的环境不支持curl，可以使用Node.js内联下载：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["-e", "require('https').get('https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => eval(data)); })"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hb.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🔑 获取API密钥

1. 访问 [PromptHub](https://prompt-hub.cc)
2. 注册或登录账户
3. 进入用户设置页面
4. 生成新的API密钥
5. 将密钥替换配置中的 `your-api-key-here`

## ✨ 配置完成后

配置完成后，你的AI客户端将自动获得以下工具：

- 🔍 **search** - 快速搜索提示词
- ⚡ **quick_store** - 快速存储提示词
- 🎯 **unified_search** - 高级统一搜索
- 🧠 **smart_store** - 智能分析并存储
- 📂 **get_categories** - 获取分类列表
- 📋 **get_prompt_names** - 获取提示词列表
- 📄 **get_prompt_details** - 获取提示词详情
- 📊 **track_prompt_usage** - 跟踪使用情况

## 🎯 优势总结

- ✅ **零文件管理**: 无需下载或管理任何文件
- ✅ **自动更新**: 始终使用最新版本的适配器
- ✅ **智能缓存**: 自动缓存到 `~/.prompthub-mcp/`
- ✅ **工具发现**: 自动发现所有可用工具
- ✅ **一键配置**: 复制粘贴即可使用
- ✅ **跨平台**: 支持所有主流操作系统

## 🔧 故障排除

### 常见问题

1. **网络连接问题**
   - 确保能访问GitHub
   - 检查防火墙设置

2. **权限问题**
   - 确保有写入 `~/.prompthub-mcp/` 的权限
   - 检查Node.js和curl是否可执行

3. **API密钥问题**
   - 确认API密钥正确
   - 检查密钥是否过期

### 清理缓存

如果遇到问题，可以清理缓存：

```bash
rm -rf ~/.prompthub-mcp/
```

---

**🎉 现在你可以在任何MCP客户端中使用PromptHub的所有功能了！**
