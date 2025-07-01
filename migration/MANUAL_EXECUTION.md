# 手动执行迁移指南

由于SQL语法错误已修复，现在可以安全地执行迁移。

## 🚀 推荐执行方式

### 方式一：Supabase Dashboard（最简单）

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择您的 PromptHub 项目

2. **打开 SQL Editor**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **逐步执行SQL文件**

   **步骤1：数据备份**
   ```sql
   -- 复制 01_backup_data.sql 的内容并执行
   -- 这会创建一个带时间戳的备份表
   ```

   **步骤2：添加字段**
   ```sql
   -- 复制 02_add_content_field.sql 的内容并执行
   -- 这会添加 content 字段和索引
   ```

   **步骤3：数据迁移**
   ```sql
   -- 复制 03_migrate_data.sql 的内容并执行
   -- 这会将 messages 转换为 content
   ```

   **步骤4：验证结果**
   ```sql
   -- 复制 04_verify_migration.sql 的内容并执行
   -- 这会验证迁移是否成功
   ```

### 方式二：命令行（如果有psql）

```bash
# 设置数据库连接
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/[database]"

# 执行迁移
psql $DATABASE_URL -f migration/01_backup_data.sql
psql $DATABASE_URL -f migration/02_add_content_field.sql
psql $DATABASE_URL -f migration/03_migrate_data.sql
psql $DATABASE_URL -f migration/04_verify_migration.sql
```

## 📋 执行检查清单

### 执行前检查
- [ ] 已停止应用服务
- [ ] 已确认数据库连接正常
- [ ] 已准备好回滚方案

### 执行步骤
- [ ] **步骤1**：执行 `01_backup_data.sql` - 创建备份
- [ ] **步骤2**：执行 `02_add_content_field.sql` - 添加字段
- [ ] **步骤3**：执行 `03_migrate_data.sql` - 迁移数据
- [ ] **步骤4**：执行 `04_verify_migration.sql` - 验证结果

### 验证检查
- [ ] 备份表已创建（prompts_backup_YYYYMMDD_HHMMSS）
- [ ] content字段已添加
- [ ] 90条记录已成功迁移
- [ ] 搜索索引已创建
- [ ] 无迁移错误

## 🔍 预期输出

### 步骤1输出示例
```
NOTICE:  备份表已创建: prompts_backup_20241201_143022
NOTICE:  备份验证 - 表名: prompts_backup_20241201_143022, 总记录: 90, 有messages: 90, 无messages: 0
```

### 步骤3输出示例
```
processed_count | success_count | error_count | sample_results
90             | 90            | 0           | ID: xxx, Name: xxx, Content Length: 245
```

### 步骤4输出示例
```
check_type     | total_records | records_with_content | migration_completed
总体统计       | 90           | 90                   | 90
```

## ⚠️ 常见问题

### Q: 执行时提示权限错误
**A:** 确保使用的是 service_role 密钥，或者在 Supabase Dashboard 中执行

### Q: 迁移部分失败怎么办？
**A:** 查看错误信息，可以重新执行步骤3，或使用回滚脚本

### Q: 如何确认迁移成功？
**A:** 检查步骤4的输出，确保 `migration_completed` 等于总记录数

## 🔄 如果需要回滚

```sql
-- 执行回滚（紧急情况）
SELECT rollback_migration();
SELECT * FROM verify_rollback();
```

## 📞 需要帮助？

如果遇到问题，请提供：
1. 具体的错误信息
2. 执行到哪一步
3. 数据库环境信息

现在可以安全地开始迁移了！建议先在测试环境验证。
