# PromptHub MCP Adapter

[![npm version](https://badge.fury.io/js/prompthub-mcp-adapter.svg)](https://badge.fury.io/js/prompthub-mcp-adapter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **下一代智能提示词管理的MCP适配器** - 连接AI客户端（Cursor、Claude Desktop等）与PromptHub服务器

## ✨ 核心特性

- 🧠 **自然语言理解** - 真正理解用户意图，支持复杂的自然语言查询
- 🔍 **语义搜索引擎** - 多维度相关性计算，精确匹配最相关的提示词
- 📄 **完美结果展示** - 提示词内容完整显示，支持一键复制使用
- 📝 **统一存储接口** - AI智能分析并存储提示词
- 🎯 **提示词优化** - 为第三方AI客户端提供结构化优化指导
- 🔧 **零配置安装** - 使用npx一键安装，无需复杂配置
- 🌐 **跨平台兼容** - 支持所有主流AI客户端和操作系统

## 🚀 Quick Start

### Install and Run with npx (Recommended)

```bash
npx prompthub-mcp-adapter
```

### Install Globally

```bash
npm install -g prompthub-mcp-adapter
prompthub-mcp-adapter
```

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- PromptHub API key (get one at [prompt-hub.cc](https://prompt-hub.cc))

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | Your PromptHub API key | - | ✅ |
| `MCP_SERVER_URL` | PromptHub MCP server URL | `https://mcp.prompt-hub.cc` | ❌ |
| `MCP_TIMEOUT` | Request timeout in milliseconds | `60000` | ❌ |

### Cursor Configuration

Add to your Cursor settings:

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp-adapter"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to `~/.claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "npx",
      "args": ["prompthub-mcp-adapter"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Local Development

For local PromptHub server:

```json
{
  "env": {
    "MCP_SERVER_URL": "http://localhost:9010",
    "API_KEY": "your-local-api-key"
  }
}
```

## 🛠️ Available Tools

### 🚀 核心搜索工具 (推荐)
- `unified_search` - **统一搜索引擎** - 语义理解，智能搜索，完美结果展示 ⭐⭐⭐⭐⭐

### 📝 提示词管理
- `get_categories` - 获取所有提示词分类
- `get_tags` - 获取所有提示词标签
- `get_prompt_names` - 获取所有可用的提示词名称
- `get_prompt_details` - 获取特定提示词详情
- `create_prompt` - 创建新提示词
- `update_prompt` - 更新现有提示词

### 🧠 智能功能
- `unified_store` - **统一存储** - AI智能分析并存储提示词 ⭐⭐⭐⭐⭐
- `prompt_optimizer` - **提示词优化器** - 为第三方AI客户端提供结构化优化指导 ⭐⭐⭐⭐⭐



## 🔍 Usage Examples

### In Cursor

Once configured, you can use PromptHub tools directly in Cursor:

- "Search for code optimization prompts"
- "Create a new prompt for email writing"
- "Analyze the performance of this prompt"

### Programmatic Usage

```javascript
// The adapter handles MCP protocol automatically
// Tools are called through the AI client interface
```

## 🔍 Troubleshooting

### Common Issues

1. **"API_KEY not set"**
   - Ensure API key is properly configured in environment variables

2. **"Connection failed"**
   - Check network connectivity
   - Verify server URL is correct
   - Confirm API key is valid

3. **"Tool not found"**
   - Tool name might be incorrect
   - Use `tools/list` to see available tools

### Debug Mode

The adapter outputs detailed logs to stderr:

```
[PromptHub MCP] Initializing...
[PromptHub MCP] Server: https://mcp.prompt-hub.cc
[PromptHub MCP] API Key: Set
[PromptHub MCP] Server connection: OK
[PromptHub MCP] Discovered 30 tools
[PromptHub MCP] Ready for MCP messages...
```

## 🔒 Security

- Never hardcode API keys in configuration files
- Use environment variables for sensitive data
- Ensure HTTPS is used for production servers

## 📚 Documentation

- [PromptHub Documentation](https://docs.prompt-hub.cc)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/xiiizoux/PromptHub)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/xiiizoux/PromptHub/issues)
- [Documentation](https://docs.prompt-hub.cc)
- [Community Discord](https://discord.gg/prompthub)

---

**Made with ❤️ by the PromptHub Team** 