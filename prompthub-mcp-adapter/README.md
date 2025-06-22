# PromptHub MCP Adapter

[![npm version](https://badge.fury.io/js/prompthub-mcp.svg)](https://badge.fury.io/js/prompthub-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) adapter for connecting AI clients like Cursor and Claude Desktop to PromptHub server.

## 🚀 Quick Start

### Install and Run with npx (Recommended)

```bash
npx prompthub-mcp
```

### Install Globally

```bash
npm install -g prompthub-mcp
prompthub-mcp
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
      "args": ["prompthub-mcp"],
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
      "args": ["prompthub-mcp"],
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

The adapter provides 30+ tools including:

### Basic Management
- `get_categories` - Get all prompt categories
- `get_tags` - Get all prompt tags
- `get_prompt_names` - Get all available prompt names
- `get_prompt_details` - Get specific prompt details
- `create_prompt` - Create new prompt
- `update_prompt` - Update existing prompt
- `search_prompts` - Search prompts by keywords

### Intelligent Features
- `intelligent_prompt_selection` - Smart prompt recommendations
- `intelligent_prompt_storage` - Smart prompt analysis and storage
- `quick_store` - One-click prompt storage
- `smart_store` - Intelligent prompt storage

### Advanced Search
- `unified_search` - Unified search engine
- `advanced_search` - Advanced search with filters
- `multi_field_search` - Multi-field search
- `smart_filter` - Intelligent filtering

### Performance Analytics
- `track_prompt_usage` - Track prompt usage data
- `get_prompt_performance` - Get prompt performance metrics
- `generate_performance_report` - Generate performance reports
- `create_ab_test` - Create A/B tests

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