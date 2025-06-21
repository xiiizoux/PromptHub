# Schema 整合总结

## 概述

已成功将 `supabase/migrations/schema-original.sql` 作为基准文件，整合了所有迁移文件的内容，生成了完整的 `schema.sql` 文件。

## 整合的迁移文件

### 1. 003_collaborative_editing.sql - 协作编辑功能
- **新增表**：
  - `collaborative_sessions` - 协作编辑会话
  - `collaborative_participants` - 协作参与者
  - `collaborative_operations` - 协作操作记录
  - `collaborative_locks` - 协作区域锁定
  - `collaborative_conflicts` - 协作冲突记录
  - `collaborative_versions` - 协作版本历史
- **新增字段**：
  - `prompts.current_version` - 当前版本号
- **新增函数**：
  - `update_collaborative_session_activity()` - 更新会话活动
  - `cleanup_inactive_sessions()` - 清理过期会话

### 2. 004_missing_tables.sql - 社交功能表
- **新增表**：
  - `prompt_likes` - 点赞表（后被 social_interactions 替代）
  - `prompt_bookmarks` - 收藏表（后被 social_interactions 替代）
  - `prompt_usage_history` - 使用历史表
  - `prompt_ratings` - 评分表
  - `prompt_comments` - 评论表（后被 comments 替代）
- **新增字段**：
  - `prompts.usage_count` - 使用次数
  - `prompts.view_count` - 查看次数
- **新增函数**：
  - `increment_usage_count()` - 递增使用次数

### 3. 005_add_missing_fields.sql - 提示词表额外字段
- **新增字段**：
  - `prompts.input_variables` - 输入变量数组
  - `prompts.compatible_models` - 兼容模型列表
  - `prompts.template_format` - 模板格式

### 4. 006_create_prompt_templates.sql - 模板系统
- **新增表**：
  - `prompt_templates` - 提示词模板
  - `template_categories` - 模板分类
  - `template_usage_stats` - 模板使用统计
  - `template_ratings` - 模板评分
- **新增函数**：
  - `update_template_updated_at()` - 更新模板时间

### 5. 006_social_interactions.sql - 统一社交互动
- **新增表**：
  - `social_interactions` - 统一社交互动表（替代分离的点赞/收藏表）
  - `comments` - 评论表（统一命名）
  - `user_follows` - 用户关注表
  - `topics` - 话题表
  - `topic_posts` - 话题帖子表
  - `notifications` - 通知表
- **数据迁移**：整合了原有的点赞、收藏、评论数据

### 6. 007_fix_version_field_type.sql - 版本字段类型修复
- **字段类型修改**：
  - 将所有版本相关字段从 `INT` 改为 `NUMERIC(3,1)`
  - 支持小数版本号（如 1.0, 1.1, 6.1）

### 7. 007_seed_prompt_templates.sql & 007_seed_prompt_templates_fixed.sql - 模板数据
- **预置数据**：
  - 8个模板分类
  - 8个官方模板示例
- **约束优化**：添加了唯一约束和冲突处理

### 8. 008_add_template_functions.sql - 模板相关函数
- **新增函数**：
  - `increment_template_usage()` - 递增模板使用次数
  - `update_template_rating()` - 更新模板评分

### 9. 009_fix_category_consistency.sql - 分类一致性
- **数据修复**：将所有"未分类"记录更新为"通用"

### 10. 009_security_fixes_complete.sql - 安全修复
- **RLS策略**：为所有表启用行级安全
- **函数安全**：设置 `search_path = public`
- **新增函数**：
  - `get_prompt_public_stats()` - 获取公共统计
  - `get_user_prompt_interactions()` - 获取用户互动状态

### 11. 010_add_username_field.sql - 用户名字段
- **新增字段**：
  - `users.username` - 用户名字段
- **函数更新**：更新 `handle_new_user()` 函数

### 12. 011_fix_prompts_rls.sql - prompts表RLS修复
- **RLS策略修复**：确保 prompts 表的访问策略正确

### 13. NotificationPreferences.sql - 通知偏好
- **新增表**：
  - `notification_preferences` - 通知偏好设置
- **新增函数**：
  - `create_default_notification_preferences()` - 创建默认通知偏好

### 14. UserRelationships.sql - 用户关系
- **重复表定义**：与 006_social_interactions.sql 重复，已合并

## 最终 schema.sql 结构

### 表结构（按功能分组）

#### 核心表
- `users` - 用户表
- `categories` - 类别表
- `prompts` - 提示词表
- `prompt_versions` - 提示词版本表

#### 社交功能表
- `social_interactions` - 社交互动表
- `comments` - 评论表
- `user_follows` - 用户关注表
- `topics` - 话题表
- `topic_posts` - 话题帖子表
- `notifications` - 通知表
- `notification_preferences` - 通知偏好表

#### 评分和使用历史表
- `prompt_ratings` - 评分表
- `prompt_usage_history` - 使用历史表

#### 协作编辑表
- `collaborative_sessions` - 协作会话表
- `collaborative_participants` - 协作参与者表
- `collaborative_operations` - 协作操作表
- `collaborative_locks` - 协作锁定表
- `collaborative_conflicts` - 协作冲突表
- `collaborative_versions` - 协作版本表

#### 模板系统表
- `template_categories` - 模板分类表
- `prompt_templates` - 提示词模板表
- `template_usage_stats` - 模板使用统计表
- `template_ratings` - 模板评分表

#### 性能分析表
- `prompt_usage` - 提示词使用记录表
- `prompt_feedback` - 性能反馈表
- `prompt_performance` - 提示词性能汇总表
- `prompt_ab_tests` - 提示词A/B测试表

#### 权限管理表
- `prompt_collaborators` - 协作者表
- `prompt_audit_logs` - 审计日志表
- `api_keys` - API密钥表

### 关键特性

1. **版本支持**：支持小数版本号（NUMERIC(3,1)）
2. **完整的RLS策略**：所有表都启用了行级安全
3. **社交功能**：统一的点赞、收藏、评论、关注系统
4. **协作编辑**：实时协作编辑功能
5. **模板系统**：完整的模板管理和使用统计
6. **性能分析**：使用统计、反馈收集、A/B测试
7. **安全审计**：操作日志和权限管理
8. **通知系统**：完整的通知和偏好管理

### 索引优化

- 为所有主要查询字段创建了索引
- 包括复合索引和GIN索引（用于数组和JSONB字段）
- 优化了查询性能

### 函数和触发器

- 用户数据同步
- 自动更新时间戳
- 性能统计自动计算
- 协作会话管理
- 审计日志记录

### 初始化数据

- 20个预置类别
- 8个模板分类
- 默认提示词示例
- 自动数据迁移和一致性修复

## 使用说明

1. 在 Supabase SQL 编辑器中执行 `schema.sql` 文件
2. 该文件包含了完整的数据库结构和初始化数据
3. 所有安全策略和权限已配置完成
4. 支持从零开始创建完整的数据库

## 注意事项

- 该文件适用于全新数据库创建
- 如果在现有数据库上执行，请注意可能的冲突
- 所有迁移文件的功能都已整合，无需单独执行
- 保持了与原有 schema-original.sql 的兼容性
