# 🚀 PromptHub MCP Adapter - NPM 快速开始

## 📦 通过 NPM 使用 PromptHub MCP 适配器

### 🎯 一键安装和运行

```bash
# 使用 npx 直接运行（推荐）
npx prompthub-mcp
```

### 🔧 AI 客户端配置

#### Cursor 配置

在 Cursor 设置中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Claude Desktop 配置

在 `~/.claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 🔑 获取 API 密钥

1. 访问 [PromptHub官网](https://prompt-hub.cc)
2. 注册账号
3. 在个人设置中生成 API 密钥

### ✨ 优势

- **零配置**: 无需下载文件，直接使用 npx
- **自动更新**: 每次运行都使用最新版本
- **跨平台**: 支持 Windows、macOS、Linux
- **简单配置**: 只需设置 API 密钥

### 🛠️ 可用工具

- **提示词管理**: 创建、更新、搜索提示词
- **智能推荐**: AI 驱动的提示词推荐
- **性能分析**: 使用数据追踪和分析
- **协作功能**: 团队共享和版本控制

### 🔍 故障排除

#### 常见问题

1. **"API_KEY not set"**
   ```bash
   # 确保在配置中设置了 API_KEY
   ```

2. **"Connection failed"**
   ```bash
   # 检查网络连接和 API 密钥有效性
   ```

3. **NPX 缓存问题**
   ```bash
   # 清除 npx 缓存
   npx --yes prompthub-mcp
   ```

### 📚 更多资源

- [完整文档](./prompthub-mcp-adapter/README.md)
- [发布指南](./prompthub-mcp-adapter/PUBLISH.md)
- [GitHub 仓库](https://github.com/xiiizoux/PromptHub)

---

**现在就开始使用 PromptHub MCP 适配器，让 AI 客户端连接到强大的提示词管理平台！** 🎉 