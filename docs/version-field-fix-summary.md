# PromptHub 版本字段修复总结

## 🔍 问题发现

### 1. prompts表缺少version字段
- **问题**：实际数据库中prompts表没有version字段，但API代码中仍在使用
- **影响**：导致版本相关的API功能无法正常工作
- **原因**：在之前的重构中，version字段被移除但API代码未同步更新

### 2. API代码与数据库不一致
- 多个API文件中仍在验证和使用version字段
- 版本回滚功能依赖version字段
- Schema定义与实际数据库结构不匹配

## ✅ 修复方案

### 已执行的修复
1. **恢复prompts表的version字段**
   ```sql
   ALTER TABLE prompts ADD COLUMN version NUMERIC(3,1) DEFAULT 1.0;
   ```

2. **为现有数据设置默认版本号**
   - 所有现有提示词的版本号设置为1.0
   - 字段设置为非空约束

3. **验证修复结果**
   - ✅ version字段已成功添加
   - ✅ 数据类型：NUMERIC(3,1)，支持如1.0, 1.1, 6.1等格式
   - ✅ 默认值：1.0
   - ✅ 非空约束：是

## 📊 两个版本表的区别和作用

### prompt_versions表（基础版本管理）
**用途**：存储提示词的历史版本，用于简单的版本回滚

**主要字段**：
- `version`: 版本号（NUMERIC类型）
- `content`: 版本内容（TEXT类型）
- `description`: 版本描述
- `tags`: 标签数组
- `category`: 分类信息
- `created_at`: 创建时间

**使用场景**：
- 基本的版本历史记录
- 简单的版本回滚功能
- 版本对比和查看

### prompt_version_history表（Context Engineering版本管理）
**用途**：高级版本管理系统，支持Context Engineering功能

**主要字段**：
- `version_config`: 版本配置（JSONB）
- `content_snapshot`: 内容快照（JSONB）
- `context_config_snapshot`: 上下文配置快照（JSONB）
- `dependencies_snapshot`: 依赖关系快照（JSONB）
- `performance_baseline`: 性能基线（JSONB）
- `experiment_results`: 实验结果（JSONB）
- `rollback_info`: 回滚信息（JSONB）

**使用场景**：
- Context Engineering的复杂版本管理
- A/B测试和实验管理
- 性能监控和基线对比
- 高级回滚和恢复功能

## 🎯 建议的使用策略

### 基础用户
- 使用`prompt_versions`表进行简单的版本管理
- 适合基本的版本回滚需求

### 高级用户/Context Engineering
- 使用`prompt_version_history`表进行复杂的版本管理
- 支持性能监控、实验管理等高级功能

### API层面
- 基础版本API继续使用`prompt_versions`表
- Context Engineering相关API使用`prompt_version_history`表
- 两套系统可以并存，满足不同用户需求

## 📝 后续建议

1. **测试API功能**：验证版本相关的API是否正常工作
2. **更新文档**：确保API文档与实际实现一致
3. **代码审查**：检查是否还有其他类似的不一致问题
4. **监控使用情况**：观察两个版本表的使用情况，优化性能

## 🔧 相关文件
- 修复脚本：`fix-prompts-version-field.sql`
- API文件：`web/src/pages/api/prompts/[id].ts`
- 版本API：`web/src/pages/api/prompts/[id]/versions.ts`
- 回滚API：`web/src/pages/api/prompts/[id]/revert.ts`
