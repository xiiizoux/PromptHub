# PromptHub v1.8.1 部署检查清单

## 📋 部署前准备

### ✅ 已完成项目
- [x] 更新prompthub-mcp-adapter到v1.8.1
- [x] 创建数据库修复脚本 (`scripts/fix_foreign_key_constraints.sql`)
- [x] 修复代码层面的存储逻辑
- [x] 打包适配器版本：`prompthub-mcp-adapter-1.8.1.tgz`
- [x] 创建发布说明文档
- [x] 更新changelog记录

## 🚀 部署步骤

### 1. 备份生产环境（建议）
```bash
# 备份数据库
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份当前代码
cp -r /path/to/current/mcp /path/to/backup/mcp_backup_$(date +%Y%m%d_%H%M%S)
```

### 2. 更新MCP服务器代码
```bash
# 拉取最新代码
git pull origin main

# 安装依赖（如有变更）
cd mcp && npm install

# 构建项目
npm run build
```

### 3. 执行数据库修复（关键步骤）
```bash
# 连接到生产数据库
psql postgresql://user:password@host:port/database

# 或使用文件方式
psql postgresql://user:password@host:port/database < scripts/fix_foreign_key_constraints.sql
```

### 4. 重启MCP服务器
```bash
# 停止服务
pm2 stop mcp-server  # 或对应的进程管理方式

# 启动服务
pm2 start mcp-server  # 或 npm start
```

## 🧪 部署后验证

### 1. 搜索功能测试（应保持正常）
```bash
curl -X POST https://mcp.prompt-hub.cc/tools/unified_search/invoke \
  -H "X-Api-Key: aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653" \
  -H "Content-Type: application/json" \
  -d '{"query": "测试搜索"}'
```

### 2. 存储功能测试（修复重点）
```bash
curl -X POST https://mcp.prompt-hub.cc/tools/unified_store/invoke \
  -H "X-Api-Key: aceb020aa5b61b7cac2d35a03d97cfdfb34ba93c2ef5b8911218d19a80ab8653" \
  -H "Content-Type: application/json" \
  -d '{"content": "部署后测试提示词", "title": "部署验证-'$(date +%s)'", "auto_analyze": false}'
```

### 3. 预期结果

#### 搜索功能 ✅
```json
{
  "schema_version": "v1",
  "data": [
    {
      "name": "示例提示词",
      "description": "...",
      "category": "..."
    }
  ]
}
```

#### 存储功能 ✅ (修复后应该成功)
```json
{
  "schema_version": "v1", 
  "data": {
    "success": true,
    "prompt": {
      "id": "uuid-here",
      "name": "部署验证-timestamp",
      "user_id": "530d5152-bf3e-4bc4-9d78-106a065fa826"
    }
  }
}
```

## 🚨 故障排查

### 如果存储功能仍然失败

1. **检查数据库修复是否成功**：
```sql
-- 查看外键约束状态
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'prompts'
    AND kcu.column_name = 'user_id';
```

2. **验证用户是否存在**：
```sql
-- 检查用户表
SELECT id, email, display_name FROM users 
WHERE id = '530d5152-bf3e-4bc4-9d78-106a065fa826';

-- 检查API密钥表
SELECT user_id, name FROM api_keys 
WHERE user_id = '530d5152-bf3e-4bc4-9d78-106a065fa826';
```

3. **查看服务器日志**：
```bash
# 查看MCP服务器日志
pm2 logs mcp-server

# 或查看特定日志文件
tail -f /path/to/mcp/logs/app.log
```

## 📞 回滚计划（紧急情况）

如果部署出现严重问题：

1. **代码回滚**：
```bash
git checkout previous_stable_commit
npm run build
pm2 restart mcp-server
```

2. **数据库回滚**：
```bash
# 恢复备份
psql your_database < backup_file.sql
```

## ✅ 部署完成检查

- [ ] 数据库修复脚本执行成功
- [ ] MCP服务器重启成功
- [ ] 搜索功能正常
- [ ] 存储功能修复成功
- [ ] API响应时间正常
- [ ] 错误日志无异常

---

**部署负责人**: ________________  
**部署时间**: ________________  
**验证时间**: ________________  
**备注**: ________________