# 安全配置指南

## 环境变量配置

为了确保应用的安全性，所有敏感信息都应该通过环境变量进行配置，而不是硬编码在源代码中。

### 必需的环境变量

请在项目根目录创建 `.env` 文件，并设置以下环境变量：

```bash
# MCP 服务器配置
API_URL=http://localhost:9010
API_KEY=your-secure-api-key-here
MCP_URL=http://localhost:9010
BACKEND_URL=http://localhost:9010

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# JWT 配置
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=9010
NODE_ENV=development
LOG_LEVEL=info
```

### 安全注意事项

1. **永远不要将 `.env` 文件提交到版本控制系统**
   - `.env` 文件已经在 `.gitignore` 中被排除
   - 使用 `.env.example` 文件作为模板

2. **使用强密码和密钥**
   - API_KEY: 使用至少32位的随机字符串
   - JWT_SECRET: 使用至少64位的随机字符串
   - 定期轮换密钥

3. **生产环境配置**
   - 在生产环境中，通过部署平台的环境变量设置这些值
   - 不要在生产环境中使用默认值

4. **Supabase 密钥管理**
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: 可以在客户端使用的公开密钥
   - SUPABASE_SERVICE_ROLE_KEY: 仅在服务端使用的私有密钥，具有完全访问权限

### 环境变量验证

应用启动时会检查必需的环境变量是否已设置。如果缺少关键配置，应用会抛出错误并拒绝启动。

### 密钥生成

可以使用以下命令生成安全的随机密钥：

```bash
# 生成API密钥
openssl rand -hex 32

# 生成JWT密钥
openssl rand -hex 64
```

### 故障排除

如果遇到以下错误：
- "Supabase配置缺失": 检查 NEXT_PUBLIC_SUPABASE_URL 和相关密钥是否正确设置
- "API_KEY环境变量未设置": 确保在 .env 文件中设置了 API_KEY

### 最佳实践

1. 使用不同的密钥用于开发、测试和生产环境
2. 定期审查和轮换密钥
3. 限制对环境变量的访问权限
4. 监控异常的API使用情况
5. 使用HTTPS确保传输安全 