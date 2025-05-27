# MCP Prompt Server 安全配置指南

本指南将帮助您正确配置MCP Prompt Server的安全选项，确保只有授权的AI工具能够访问您的提示词库。

## 密钥配置

MCP Prompt Server使用两种密钥进行身份验证：

1. **API_KEY**：用于HTTP API访问的密钥
2. **SERVER_KEY**：用于MCP协议连接的密钥

### 配置方法

在项目根目录创建`.env`文件（或修改现有文件），设置以下内容：

```
# API 身份验证密钥
API_KEY=your-secure-api-key

# MCP 服务器密钥 (用于 mcprouter 连接)
SERVER_KEY=your-secure-server-key
```

**注意事项**：
- 使用强密码生成器创建安全的密钥
- 不要在公共场合分享这些密钥
- 在生产环境中，应该定期更换密钥

## 请求头身份验证

当使用HTTP API访问MCP Prompt Server时，需要在请求头中包含API密钥：

```javascript
fetch('http://localhost:9010/api/prompts', {
  headers: {
    'x-api-key': 'your-secure-api-key'
  }
})
```

## MCP配置身份验证

当使用MCP协议连接到MCP Prompt Server时，需要在配置文件中包含SERVER_KEY：

```json
{
  "mcpServers": {
    "prompt-server": {
      "command": "node",
      "args": [
        "/path/to/mcp-prompt-server/dist/src/index.js"
      ],
      "env": {
        "PORT": "9010",
        "API_KEY": "your-secure-api-key",
        "SERVER_KEY": "your-secure-server-key",
        "STORAGE_TYPE": "file"
      }
    }
  }
}
```

## CORS配置

默认情况下，MCP Prompt Server的CORS配置允许来自所有域的请求。如果您需要限制只允许特定域访问API，可以修改`src/mcp-server.ts`文件中的CORS配置：

```typescript
// 配置CORS
this.app.use(cors({
  origin: ['https://your-ai-tool-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'server-key']
}));
```

## 数据安全

如果您存储敏感的提示词，请考虑以下额外的安全措施：

1. **使用HTTPS**：在生产环境中，始终使用HTTPS协议保护数据传输
2. **加密存储**：考虑对存储的提示词进行加密
3. **访问控制**：实施细粒度的访问控制，限制谁可以创建、修改或删除提示词
4. **日志记录**：记录所有API访问，以便审计和监控可疑活动

## 安全最佳实践

1. **定期更新**：保持所有依赖包的最新版本，以修复已知的安全漏洞
2. **最小权限原则**：只授予AI工具完成任务所需的最小权限
3. **监控异常活动**：监控大量API请求或异常模式，可能表明系统被滥用
4. **备份提示词**：定期备份您的提示词库，以防数据丢失

遵循这些安全实践，可以有效保护您的MCP Prompt Server和存储的提示词不被未授权访问。
