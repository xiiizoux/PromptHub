# 协作者权限修复文档

## 问题描述

在编辑提示词权限设计中，发现协作者权限功能存在问题：
- 权限检查代码中检查 `prompt.collaborators` 字段
- 但数据库服务层从未查询和填充该字段
- 导致"编辑别人请求协作的提示词"权限无法正常工作

## 权限设计要求

编辑提示词的权限应该包括：
1. ✅ **编辑自己创建的提示词** - 已正常工作
2. ❌ **编辑别人请求协作的提示词** - 修复前不工作
3. ✅ **编辑所有公开编辑的提示词** - 已正常工作（通过贡献者权限）

## 修复内容

### 1. 数据库服务层修复

**文件**: `web/src/lib/database-service.ts`

#### 添加协作者查询逻辑
```typescript
// 获取协作者信息
let collaborators: string[] = [];
try {
  console.log(`[DatabaseService] 开始获取协作者信息，提示词ID: ${prompt.id}`);
  const { data: collaboratorData, error: collaboratorError } = await this.adapter.supabase
    .from('prompt_collaborators')
    .select(`
      user_id,
      users (
        username,
        display_name,
        email
      )
    `)
    .eq('prompt_id', prompt.id);

  if (collaboratorError) {
    console.error(`[DatabaseService] 获取协作者信息失败:`, collaboratorError);
  } else if (collaboratorData && collaboratorData.length > 0) {
    collaborators = collaboratorData.map((collab: any) => {
      const user = collab.users;
      // 优先使用 username，然后是 display_name，最后是 email 的用户名部分
      return user?.username || user?.display_name || user?.email?.split('@')[0] || '未知用户';
    });
    console.log(`[DatabaseService] 找到 ${collaborators.length} 个协作者: ${collaborators.join(', ')}`);
  } else {
    console.log(`[DatabaseService] 该提示词没有协作者`);
  }
} catch (collaboratorError) {
  console.error(`[DatabaseService] 获取协作者信息失败:`, collaboratorError);
}
```

#### 更新接口定义
```typescript
// 扩展的提示词详情接口
export interface PromptDetails extends Prompt {
  content?: string;
  input_variables?: string[];
  compatible_models?: string[];
  allow_collaboration?: boolean;
  edit_permission?: 'owner_only' | 'collaborators' | 'public';
  author?: string;
  collaborators?: string[]; // 新增：协作者用户名列表
}
```

#### 填充协作者字段
```typescript
const promptDetails: PromptDetails = {
  // ... 其他字段
  collaborators: collaborators, // 添加协作者列表
};
```

#### 修复其他字段
```typescript
allow_collaboration: Boolean(prompt.allow_collaboration), // 使用数据库中的实际值
edit_permission: (prompt.edit_permission as 'owner_only' | 'collaborators' | 'public') || 'owner_only',
```

### 2. 权限检查逻辑优化

**文件**: `web/src/lib/permissions.ts`

#### 增强协作者匹配逻辑
```typescript
// 4. 协作者权限
if (prompt.collaborators && prompt.collaborators.length > 0) {
  // 检查用户的多种标识是否在协作者列表中
  const userIdentifiers = [
    user.username,
    user.display_name,
    user.email?.split('@')[0]
  ].filter(Boolean); // 过滤掉空值
  
  const isCollaborator = userIdentifiers.some(identifier => 
    prompt.collaborators!.includes(identifier)
  );
  
  if (isCollaborator) {
    return {
      canEdit: true,
      reason: 'collaborator',
      message: '您被授权为协作者',
    };
  }
}
```

## 数据库结构

协作者信息存储在 `prompt_collaborators` 表中：

```sql
CREATE TABLE IF NOT EXISTS prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit' CHECK (permission_level IN ('edit', 'review', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);
```

## 权限检查流程

修复后的完整权限检查流程：

1. **未登录用户** → 拒绝访问
2. **创建者权限** → 检查 `created_by`、`user_id`、`author` 字段
3. **管理员权限** → 检查 `user.role === 'admin'`
4. **贡献者权限** → 检查 `user.role === 'contributor'` 且提示词公开且允许协作
5. **协作者权限** → 检查用户标识是否在 `collaborators` 列表中
6. **默认** → 拒绝访问

## 测试验证

创建了完整的测试用例验证以下场景：
- ✅ 创建者可以编辑自己的提示词
- ✅ 协作者可以编辑被授权的提示词（username匹配）
- ✅ 协作者可以编辑被授权的提示词（display_name匹配）
- ✅ 管理员可以编辑所有提示词
- ✅ 贡献者可以编辑公开的协作提示词
- ✅ 贡献者不能编辑私有提示词
- ✅ 陌生人不能编辑他人的提示词
- ✅ 未登录用户不能编辑任何提示词

所有测试用例均通过验证。

## 影响范围

此修复影响以下功能：
- 编辑提示词页面的权限检查
- 提示词详情页面的编辑按钮显示
- API 端点的权限验证
- 协作编辑功能

## 注意事项

1. **用户标识匹配**：协作者匹配支持多种用户标识（username、display_name、email前缀）
2. **性能考虑**：每次获取提示词详情时都会查询协作者信息，对于大量协作者的提示词可能需要优化
3. **数据一致性**：确保 `prompt_collaborators` 表中的用户信息与 `users` 表保持同步
4. **错误处理**：协作者查询失败时不会影响提示词的基本功能

## 后续改进建议

1. **缓存优化**：考虑缓存协作者信息以提高性能
2. **批量查询**：在列表页面批量获取协作者信息
3. **权限级别**：利用 `permission_level` 字段实现更细粒度的权限控制
4. **审计日志**：记录协作者权限的使用情况
