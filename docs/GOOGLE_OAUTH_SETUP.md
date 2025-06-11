# Google OAuth 设置指南

本文档将指导您如何为 PromptHub 配置 Google OAuth 登录功能。

## 🔧 第一步：Google Cloud Console 配置

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API 和 Google OAuth2 API

### 2. 配置 OAuth 2.0 客户端

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

## 🔧 第二步：Supabase 配置

### 1. 登录 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目

### 2. 配置 Google OAuth Provider

1. 导航到 "Authentication" > "Providers"
2. 找到 Google 提供商并启用它
3. 配置以下信息：
   - **Client ID**: 从 Google Cloud Console 获取
   - **Client Secret**: 从 Google Cloud Console 获取
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

### 3. 配置网站 URL

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

## 🔧 第三步：环境变量配置

### 1. 更新 `.env` 文件

复制 `.env.example` 为 `.env` 并填入以下配置：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth 配置
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Docker 配置

如果使用 Docker，确保在 `docker-compose.yml` 或运行命令中正确传递环境变量。

## 🧪 测试配置

### 1. 启动应用

```bash
# 开发环境
npm run dev

# 或 Docker 环境
sudo docker run --name prompthub-test -p 9010:9010 -p 9011:9011 --env-file .env -d prompthub
```

### 2. 测试 Google 登录

1. 访问 `http://localhost:9011/auth/login`
2. 点击 "使用 Google 登录" 按钮
3. 完成 Google OAuth 流程
4. 确认用户被正确重定向并登录

## 🔧 故障排除

### 常见问题

1. **"redirect_uri_mismatch" 错误**
   - 检查 Google Cloud Console 中的重定向 URI 配置
   - 确保 URI 精确匹配（包括协议、端口、路径）

2. **"Invalid client_id" 错误**
   - 验证 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 环境变量
   - 确保客户端 ID 正确且有效

3. **Supabase 配置错误**
   - 检查 Supabase Dashboard 中的 Google Provider 配置
   - 确认网站 URL 和重定向 URL 设置正确

4. **回调页面错误**
   - 确保 `/auth/callback` 路由正常工作
   - 检查浏览器控制台和网络标签页的错误信息

### 调试提示

1. 检查浏览器开发者工具的网络标签页
2. 查看 Supabase Dashboard 的 Auth 日志
3. 检查应用控制台输出的错误信息

## 🎯 功能特性

配置完成后，您的应用将支持：

- ✅ Google 一键登录
- ✅ 用户数据自动同步到数据库
- ✅ 美观的登录界面动画
- ✅ 错误处理和用户反馈
- ✅ 登录状态持久化
- ✅ 自动重定向到目标页面

## 🔒 安全注意事项

1. **客户端密钥安全性**: 永远不要在客户端代码中暴露 Google Client Secret
2. **环境变量保护**: 确保 `.env` 文件不被提交到版本控制
3. **HTTPS 强制**: 生产环境必须使用 HTTPS
4. **域名验证**: 只允许信任的域名作为重定向 URI

## 📚 相关文档

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication) 