# 修复提示词详情页用户显示问题

## 问题描述
提示词详情页显示"未知用户"，而浏览提示词页面的提示词卡片可以正确显示用户名。

## 问题分析
通过代码分析发现，问题的根本原因是在多个地方使用了 `.single()` 方法查询 `users` 表，当用户记录不存在时会抛出错误，导致用户信息获取失败。

### 对比分析
1. **浏览提示词页面（工作正常）**：
   - 使用 `/api/public-prompts` API
   - 批量查询用户信息：`supabase.from('users').select('id, display_name').in('id', userIds)`
   - 即使某些用户不存在也不会抛出错误

2. **提示词详情页面（显示未知用户）**：
   - 使用 `databaseService.getPromptByName()` 方法
   - 单个查询用户信息：`supabase.from('users').select('display_name').eq('id', userId).single()`
   - 当用户不存在时 `.single()` 会抛出错误

## 修复方案
将所有使用 `.single()` 方法查询 `users` 表的代码改为使用 `.maybeSingle()` 方法，并添加详细的错误处理和日志记录。

## 修复的文件

### 1. `web/src/lib/database-service.ts`
- **修复位置**：第196-218行，`getPromptByName` 方法中的用户信息查询
- **修复位置**：第692-720行，`getUsernameById` 私有方法
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 添加详细的日志记录
  - 改进错误处理逻辑

### 2. `web/src/pages/api/profile/prompt/[id].ts`
- **修复位置**：第40-62行，获取作者信息的逻辑
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 添加详细的日志记录

### 3. `mcp/src/storage/supabase-adapter.ts`
- **修复位置**：第521行，`getPrompt` 方法
- **修复位置**：第1284-1315行，`getUser` 方法
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 添加详细的日志记录

### 4. `supabase/lib/supabase-adapter.ts`
- **修复位置**：第416-425行，`signIn` 方法中的用户信息查询
- **修复位置**：第462-471行，`getCurrentUser` 方法中的用户信息查询
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 添加错误处理

### 5. `supabase/lib/auth-extensions.ts`
- **修复位置**：第32-47行，`verifyToken` 方法中的用户信息查询
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 改进错误处理逻辑

### 6. `web/src/lib/supabase-adapter.ts`
- **修复位置**：第640-648行，`getCurrentUser` 方法
- **修复内容**：
  - 将 `.single()` 改为 `.maybeSingle()`
  - 添加错误处理

## 技术细节

### `.single()` vs `.maybeSingle()` 的区别
- **`.single()`**：期望返回恰好一条记录，如果没有记录或有多条记录会抛出错误
- **`.maybeSingle()`**：期望返回最多一条记录，如果没有记录返回 `null`，不会抛出错误

### 错误处理改进
1. **添加详细日志**：记录用户ID、查询状态、成功/失败信息
2. **优雅降级**：当用户信息不存在时，显示"未知用户"而不是抛出错误
3. **错误分类**：区分查询错误和数据不存在的情况

## 预期效果
修复后，提示词详情页应该能够：
1. 正确显示存在用户的 `display_name`
2. 对于不存在的用户，优雅地显示"未知用户"
3. 不再因为用户查询错误而导致页面功能异常
4. 提供详细的日志信息便于调试

## 测试建议
1. 访问有有效用户ID的提示词详情页，确认显示正确的用户名
2. 访问有无效用户ID的提示词详情页，确认显示"未知用户"
3. 检查控制台日志，确认错误处理正常工作
4. 对比浏览页面和详情页面的用户显示，确认一致性

## 相关数据库迁移
问题可能与以下迁移文件相关：
- `010_add_username_field.sql`：添加了 username 字段并更新了用户数据处理逻辑
- `009_security_fixes_complete.sql`：修改了用户数据同步函数

建议检查数据库中是否存在：
1. `prompts` 表中有 `user_id` 但 `users` 表中没有对应记录的情况
2. `users` 表中存在记录但 `display_name` 为空的情况
