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

## Google OAuth 设置

### Google Cloud Console 配置

#### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 和 Google OAuth2 API

#### 2. 配置 OAuth 2.0 客户端

1. 在 Google Cloud Console 中，导航到 "APIs & Services" > "Credentials"
2. 点击 "Create Credentials" > "OAuth 2.0 Client IDs"
3. 选择应用程序类型为 "Web application"
4. 配置重定向 URI：
   ```
   # 开发环境
   http://localhost:9011/auth/callback
   
   # 生产环境（替换为您的域名）
   https://yourdomain.com/auth/callback
   ```
5. 保存客户端 ID 和客户端密钥

### Supabase OAuth 配置

#### 1. 配置 Google OAuth Provider

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 导航到 "Authentication" > "Providers"
3. 找到 Google 提供商并启用它
4. 配置以下信息：
   - **Client ID**: 从 Google Cloud Console 获取
   - **Client Secret**: 从 Google Cloud Console 获取
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

#### 2. 配置网站 URL

1. 在 "Authentication" > "URL Configuration" 中设置：
   ```
   Site URL: http://localhost:9011  # 开发环境
   # 或 https://yourdomain.com      # 生产环境
   ```

2. 添加重定向 URL：
   ```
   http://localhost:9011/auth/callback  # 开发环境
   # 或 https://yourdomain.com/auth/callback  # 生产环境
   ```

### Google OAuth 环境变量

```bash
# Google OAuth 配置
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### OAuth 故障排除

#### 常见问题

1. **"redirect_uri_mismatch" 错误**
   - 检查 Google Cloud Console 中的重定向 URI 配置
   - 确保 URI 精确匹配（包括协议、端口、路径）

2. **"Invalid client_id" 错误**
   - 验证 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 环境变量
   - 确保客户端 ID 正确且有效

3. **Supabase 配置错误**
   - 检查 Supabase Dashboard 中的 Google Provider 配置
   - 确认网站 URL 和重定向 URL 设置正确

#### 测试 OAuth 配置

1. 启动应用：`npm run dev`
2. 访问 `http://localhost:9011/auth/login`
3. 点击 "使用 Google 登录" 按钮
4. 完成 Google OAuth 流程
5. 确认用户被正确重定向并登录

### OAuth 安全注意事项

1. **客户端密钥安全性**: 永远不要在客户端代码中暴露 Google Client Secret
2. **环境变量保护**: 确保 `.env` 文件不被提交到版本控制
3. **HTTPS 强制**: 生产环境必须使用 HTTPS
4. **域名验证**: 只允许信任的域名作为重定向 URI
