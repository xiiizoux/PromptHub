# 🔧 远程服务器手动修复指南

## 🎯 问题诊断
远程服务器API密钥认证失败，返回401错误。**根本原因**：
- ✅ 远程服务器运行正常 (`/info` 端点返回200)
- ❌ 远程服务器连接了不同的Supabase数据库实例
- ❌ 或者关键环境变量配置不正确

## 🔍 关键发现
- **本地API密钥**: `aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653`
- **本地Supabase**: `https://meyzdumdbjiebtnjifcc.supabase.co`
- **远程服务器**: 可能连接了不同的数据库实例

## 🛠️ 修复步骤

### 方法1: 直接访问服务器修复 (推荐)

如果您有服务器SSH访问权限：

```bash
# 1. 登录远程服务器
ssh root@mcp.prompt-hub.cc  # 或您的实际SSH配置

# 2. 找到MCP服务部署目录
find / -name "*.env" -path "*/mcp*" 2>/dev/null
# 或常见位置:
cd /opt/prompthub
# cd /var/www/prompthub
# cd /home/app/prompthub

# 3. 备份现有配置
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 4. 编辑环境配置
nano .env  # 或 vim .env
```

**关键配置项** (必须与本地完全相同):
```env
# Supabase配置 (🔑 最关键!)
SUPABASE_URL=https://meyzdumdbjiebtnjifcc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTAwNjUsImV4cCI6MjA2MzY2NjA2NX0.lU2sJcctRltQja7q17UEDNEJUB0KIyvldzqJz15DBhc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZWJ0bmppZmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA5MDA2NSwiZXhwIjoyMDYzNjY2MDY1fQ.yBhS-Mf8KE49yuWgbZ5auTA-Xp5G-JBoshwiC6Xz4Q4

# JWT配置
JWT_SECRET=ZTuTVrMASWAI6vNvICNqbY0a4jtLuNNhNlGihe9o+IsniKzk5hzcK+ceDX+tRx7fvainBzPcTFTZ8zXO8E/cGQ==

# 存储类型
STORAGE_TYPE=supabase
```

**重启服务**:
```bash
# 选择适合的重启方式
pm2 restart all
# 或
systemctl restart mcp-server  
# 或
docker-compose restart
# 或
supervisorctl restart mcp-server
```

### 方法2: 通过CI/CD或自动化部署

如果使用GitHub Actions或其他CI/CD：

1. 更新部署配置中的环境变量
2. 确保Supabase配置与本地相同
3. 重新部署

### 方法3: 联系服务器管理员

如果您无法直接访问服务器，请联系管理员：

```text
请帮忙检查远程MCP服务器的环境配置，确保以下配置项与本地相同：

SUPABASE_URL=https://meyzdumdbjiebtnjifcc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTAwNjUsImV4cCI6MjA2MzY2NjA2NX0.lU2sJcctRltQja7q17UEDNEJUB0KIyvldzqJz15DBhc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leXpkdW1kYmppZWJ0bmppZWJ0bmppZWJ0bmppZmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA5MDA2NSwiZXhwIjoyMDYzNjY2MDY1fQ.yBhS-Mf8KE49yuWgbZ5auTA-Xp5G-JBoshwiC6Xz4Q4
JWT_SECRET=ZTuTVrMASWAI6vNvICNqbY0a4jtLuNNhNlGihe9o+IsniKzk5hzcK+ceDX+tRx7fvainBzPcTFTZ8zXO8E/cGQ==
```

## 🧪 验证修复

修复后，运行以下测试：

```bash
# 1. 测试API密钥认证
curl -H "X-Api-Key: aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653" \
     https://mcp.prompt-hub.cc/tools

# 期望结果: 返回200状态码和工具列表JSON
```

如果成功，您应该看到类似这样的响应：
```json
{
  "schema_version": "v1",
  "tools": [
    {
      "name": "get_categories",
      "description": "获取所有提示词分类",
      ...
    }
  ]
}
```

## 📊 监控建议

修复后建议监控：
- ✅ API响应时间 (`/tools` 端点)
- ✅ 认证成功率
- ✅ 数据库连接状态
- ✅ 错误日志

## 🚨 紧急方案

如果无法立即修复远程服务器，可以临时：

1. **使用本地服务器**:
   ```json
   // ~/.cursor/mcp.json
   {
     "mcpServers": {
       "prompthub": {
         "command": "node",
         "args": ["/home/zou/PromptHub/local-mcp-adapter.js"],
         "env": {
           "API_KEY": "aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653",
           "MCP_SERVER_URL": "http://localhost:9010"
         }
       }
     }
   }
   ```

2. **启动本地MCP服务**:
   ```bash
   cd /home/zou/PromptHub/mcp
   npm start
   ```

## 📞 技术支持

如需进一步帮助，请提供：
- 远程服务器的实际部署路径
- 当前使用的服务管理器 (pm2/systemctl/docker)
- 错误日志 (`/var/log/` 或应用日志)