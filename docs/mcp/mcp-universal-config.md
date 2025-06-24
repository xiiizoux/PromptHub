# MCP通用配置指南

## 🎯 概述

现在你可以使用**通用配置**来访问PromptHub的所有MCP工具，无需为每个工具单独配置！

## 🚀 零配置方案（推荐）

**完全自动化！无需手动下载任何文件！只需要URL和API密钥！**

### 方式一：超简洁配置

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

### 方式二：Node.js内联下载

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

**🎯 优势**：
- ✅ **零文件管理**: 无需下载或管理任何文件
- ✅ **自动更新**: 始终使用最新版本的适配器
- ✅ **智能缓存**: 自动缓存到 `~/.prompthub-mcp/`，避免重复下载
- ✅ **一键配置**: 复制粘贴即可使用
- ✅ **版本控制**: 自动检测和更新到最新版本

## 🔧 传统配置方案（备选）

如果你的环境不支持在线下载，可以使用传统方案：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["/path/to/auto-download-adapter.js"],
      "env": {
        "MCP_SERVER_URL": "https://mcp.prompt-hub.cc",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 文件准备

#### 方式一：自动下载脚本（推荐）

```bash
# 下载自动下载适配器
curl -o auto-download-adapter.js https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js
```

#### 方式二：直接下载适配器

```bash
# 下载MCP协议适配器
curl -o mcp-protocol-adapter.js https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/mcp-protocol-adapter.js
```

### 环境要求

```bash
# 检查Node.js版本（需要12+）
node --version

# 如果没有安装Node.js，请先安装
```

## 🔧 配置示例

### Claude Desktop配置（零配置方案）

在 `~/.config/claude-desktop/claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["-e", "require('https').get('https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => eval(data)); })"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor IDE配置（零配置方案）

在Cursor的MCP设置中添加：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["-e", "require('https').get('https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => eval(data)); })"],
      "env": {
        "API_KEY": "your-api-key-here",
        "MCP_TIMEOUT": "60000"
      }
    }
  }
}
```

### 其他MCP客户端（零配置方案）

对于支持MCP协议的其他客户端：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["-e", "require('https').get('https://raw.githubusercontent.com/xiiizoux/PromptHub/main/mcp/src/adapters/auto-download-adapter.js', res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => eval(data)); })"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 传统配置方案（如果需要本地文件）

如果你的环境不支持在线下载，可以先下载文件：

```json
{
  "mcpServers": {
    "prompthub": {
      "command": "node",
      "args": ["/path/to/auto-download-adapter.js"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🔑 环境变量说明

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `MCP_SERVER_URL` | 否 | `https://mcp.prompt-hub.cc` | MCP服务器地址（自动设置） |
| `API_KEY` | 是 | - | 你的API密钥 |
| `MCP_TIMEOUT` | 否 | `60000` | 请求超时时间（毫秒） |

**重要说明**：
- ✅ **MCP_SERVER_URL 已自动配置**为正式部署地址 `https://mcp.prompt-hub.cc`
- ✅ **无需手动设置URL**，适配器会自动连接到正确的服务器
- ✅ **只需要设置API_KEY**即可使用所有功能

## ✨ 工作原理

1. **工具发现**: 适配器自动连接到MCP服务器，获取所有可用工具列表
2. **动态调用**: 客户端可以调用任何发现的工具，无需预先配置
3. **协议转换**: 适配器将MCP协议调用转换为HTTP API调用
4. **统一接口**: 所有工具通过统一的MCP接口访问

## 🎯 优势

### ✅ 相比传统配置的优势

- **🚀 零配置**: 无需为每个工具单独配置
- **🔄 自动发现**: 新工具自动可用，无需更新配置
- **🛠️ 统一管理**: 一个配置管理所有工具
- **📈 易于维护**: 服务器更新工具，客户端自动同步

### ✅ 相比直接HTTP API的优势

- **🔌 标准协议**: 符合MCP标准，兼容所有MCP客户端
- **🎨 原生集成**: 在AI客户端中获得更好的用户体验
- **🔧 工具发现**: 自动发现和展示可用工具
- **📋 类型安全**: 提供工具参数的类型信息

## 🧪 测试配置

### 1. 测试适配器脚本

```bash
# 设置环境变量
export API_KEY="your-api-key-here"
export MCP_SERVER_URL="https://mcp.prompt-hub.cc"

# 测试适配器
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp-protocol-adapter.js
```

### 2. 验证工具列表

成功的响应应该包含可用工具列表：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search",
        "description": "快速搜索提示词",
        "inputSchema": {...}
      },
      {
        "name": "quick_store",
        "description": "快速存储提示词",
        "inputSchema": {...}
      }
    ]
  }
}
```

## 🔧 故障排除

### 常见问题

1. **适配器启动失败**
   - 检查Node.js是否正确安装
   - 确认适配器脚本路径正确
   - 验证文件权限

2. **API认证失败**
   - 确认API密钥正确
   - 检查环境变量设置
   - 验证网络连接

3. **工具调用失败**
   - 检查服务器状态
   - 验证工具参数格式
   - 查看适配器日志

### 调试模式

启用详细日志：

```bash
# 设置调试环境变量
export DEBUG=mcp-adapter
export NODE_ENV=development

# 运行适配器
node mcp-protocol-adapter.js
```

## 📚 下一步

1. **配置完成后**: 在你的AI客户端中应该能看到PromptHub工具
2. **开始使用**: 尝试搜索、存储、分析提示词
3. **探索功能**: 查看所有可用工具和参数
4. **反馈问题**: 遇到问题请及时反馈

## 🔗 相关资源

- [MCP简化配置指南](./mcp-simple-config.md) - HTTP API直接调用方式
- [MCP使用指南](./mcp-usage-guide.md) - 完整的MCP功能说明
- [API文档](./api-documentation.md) - 详细的API参考

---

**总结**: 通过这种通用配置，你只需要一次设置就能访问所有PromptHub工具，大大简化了配置和维护工作！
