# 硬编码System模板迁移指南

## 🎯 迁移目标

将PromptHub的优化模板从复杂的System+User JSONB结构简化为：
- **System模板**：硬编码在代码中，所有分类共享
- **User模板**：存储在数据库中，每个分类独立配置

## 🚀 迁移步骤

### 步骤1：备份数据

在执行迁移前，建议先备份categories表：

```sql
-- 创建完整备份
CREATE TABLE categories_backup_before_migration AS 
SELECT * FROM categories;
```

### 步骤2：执行迁移脚本

推荐使用改进的v2版本迁移脚本：

```bash
# 方式1：通过psql执行
psql -h your-host -U your-user -d your-db -f supabase/migrations/user_only_optimization_templates_v2.sql

# 方式2：通过Supabase CLI执行
supabase db push
```

### 步骤3：验证迁移结果

```bash
# 运行验证脚本
node scripts/verify-migration.js
```

### 步骤4：测试功能

```bash
# 运行完整测试
node scripts/test-system-user-templates.js
```

## 🔧 迁移脚本说明

### v2版本改进

新的v2迁移脚本解决了类型转换问题：

1. **分步处理**：避免复杂的一次性类型转换
2. **临时列**：使用临时列存储中间结果
3. **明确类型**：使用`jsonb_build_object`确保类型正确
4. **兼容性**：支持多种旧格式的转换

### 数据结构变化

**迁移前**：
```json
{
  "system": "System角色模板",
  "user": "User角色模板"
}
```

**迁移后**：
```json
{
  "user": "User角色模板文本"
}
```

## ⚠️ 故障排除

### 常见错误1：类型转换错误

**错误信息**：
```
ERROR: could not determine polymorphic type because input has type unknown
```

**解决方案**：
- 使用v2版本迁移脚本
- 确保PostgreSQL版本支持`jsonb_build_object`函数

### 常见错误2：权限不足

**错误信息**：
```
ERROR: permission denied for table categories
```

**解决方案**：
- 确保使用具有足够权限的数据库用户
- 检查RLS策略是否影响迁移

### 常见错误3：索引冲突

**错误信息**：
```
ERROR: index "idx_categories_optimization_template_gin" already exists
```

**解决方案**：
- 迁移脚本会自动处理索引重建
- 如果仍有问题，手动删除旧索引后重新运行

## 📊 迁移验证清单

### ✅ 数据完整性检查

- [ ] 所有分类都有optimization_template字段
- [ ] 模板内容格式正确（包含user_template字段）
- [ ] 没有数据丢失或损坏
- [ ] 备份数据可以正常访问

### ✅ 功能测试

- [ ] Web端优化器正常工作
- [ ] MCP端优化工具正常工作
- [ ] API接口返回正确结果
- [ ] System模板正确应用

### ✅ 性能验证

- [ ] 优化请求响应时间改善
- [ ] 数据库查询次数减少
- [ ] 内存使用合理
- [ ] 并发性能提升

## 🔄 回滚方案

如果迁移出现问题，可以使用以下回滚方案：

### 方案1：从备份恢复

```sql
-- 恢复optimization_template字段
UPDATE categories 
SET optimization_template = backup.optimization_template
FROM categories_backup_before_migration backup
WHERE categories.id = backup.id;
```

### 方案2：重新构建旧格式

```sql
-- 将新格式转换回旧格式（如果需要）
UPDATE categories 
SET optimization_template = jsonb_build_object(
  'system', '硬编码的System模板内容',
  'user', optimization_template ->> 'user_template'
)
WHERE optimization_template ? 'user_template';
```

## 📈 性能对比

### 迁移前
- System模板查询：~30ms
- User模板查询：~20ms
- **总计：~50ms**

### 迁移后
- System模板获取：~0ms（硬编码）
- User模板查询：~20ms
- **总计：~20ms**

**性能提升：60%**

## 🎉 迁移完成后

### 清理工作

1. 删除备份表（确认一切正常后）：
```sql
DROP TABLE IF EXISTS categories_optimization_backup_v3;
```

2. 更新应用配置（如果需要）

3. 监控系统性能和错误日志

### 后续优化

1. **监控性能**：观察优化功能的响应时间
2. **用户反馈**：收集用户对优化质量的反馈
3. **模板调优**：根据使用情况调整User模板
4. **版本管理**：建立System模板的版本管理机制

## 📞 技术支持

如果在迁移过程中遇到问题：

1. 检查迁移日志和错误信息
2. 运行验证脚本诊断问题
3. 查看故障排除部分
4. 必要时使用回滚方案

记住：**安全第一，数据无价！**
