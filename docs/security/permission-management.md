# PromptHub 权限管理设计文档

## 概述

本文档详细说明了PromptHub系统中提示词编辑权限的管理逻辑，包括用户角色、权限级别和安全策略。

## 用户角色定义

### 1. 普通用户 (user)
- 可以创建和编辑自己的提示词
- 可以查看公开的提示词
- 不能编辑他人的提示词

### 2. 贡献者 (contributor)
- 拥有普通用户的所有权限
- 可以编辑公开的提示词（需要启用协作功能）
- 不能修改提示词的可见性设置
- 不能修改作者信息

### 3. 管理员 (admin)
- 拥有系统的完全权限
- 可以编辑所有提示词
- 可以修改任何设置
- 可以管理用户权限

## 提示词权限属性

### 当前实现
```typescript
interface PromptDetails {
  name: string;
  description: string;
  content: string;
  author?: string;
  category?: string;
  // ... 其他字段
}
```

### 建议扩展
```typescript
interface PromptDetails {
  // ... 现有字段
  is_public: boolean;                    // 是否公开
  allow_collaboration?: boolean;         // 是否允许协作编辑
  collaborators?: string[];              // 指定的协作者列表
  edit_permission?: 'owner_only' | 'collaborators' | 'public'; // 编辑权限级别
  created_by: string;                    // 创建者ID
  last_modified_by?: string;             // 最后修改者ID
}
```

## 权限检查逻辑

### 1. 登录要求 ✅
```typescript
// 强制登录检查
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
  }
}, [authLoading, isAuthenticated, router]);
```

**结论：必要且正确**
- 编辑操作需要明确的用户身份
- 防止匿名用户进行修改操作
- 提供登录后重定向功能

### 2. 权限检查函数
```typescript
const checkEditPermission = (prompt: PromptDetails, user: User): PermissionCheck => {
  // 1. 创建者权限
  if (prompt.author === user.username || prompt.created_by === user.id) {
    return { canEdit: true, reason: 'owner' };
  }

  // 2. 管理员权限
  if (user.role === 'admin') {
    return { canEdit: true, reason: 'admin' };
  }

  // 3. 贡献者权限（仅限公开提示词）
  if (user.role === 'contributor' && prompt.is_public && prompt.allow_collaboration) {
    return { canEdit: true, reason: 'contributor' };
  }

  // 4. 协作者权限
  if (prompt.collaborators?.includes(user.username)) {
    return { canEdit: true, reason: 'collaborator' };
  }

  // 5. 默认：无权限
  return { canEdit: false, reason: 'no_permission' };
};
```

## 权限策略建议

### 方案一：严格权限控制（推荐）

**优点：**
- 安全性高，防止恶意修改
- 权限清晰，易于管理
- 符合大多数企业安全要求

**缺点：**
- 协作性较差
- 可能限制社区贡献

**适用场景：**
- 企业内部使用
- 对安全性要求较高的环境
- 提示词包含敏感信息

### 方案二：协作友好型

**优点：**
- 促进社区协作
- 提高提示词质量
- 增加用户参与度

**缺点：**
- 安全风险较高
- 需要更复杂的权限管理
- 可能出现编辑冲突

**适用场景：**
- 开源社区
- 教育环境
- 公共知识库

## 具体实现建议

### 1. 数据库表结构扩展

```sql
-- 扩展prompts表
ALTER TABLE prompts ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE prompts ADD COLUMN allow_collaboration BOOLEAN DEFAULT false;
ALTER TABLE prompts ADD COLUMN edit_permission VARCHAR(20) DEFAULT 'owner_only';
ALTER TABLE prompts ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE prompts ADD COLUMN last_modified_by UUID REFERENCES users(id);

-- 创建协作者表
CREATE TABLE prompt_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'edit', -- 'edit', 'review', 'admin'
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);
```

### 2. API端点权限检查

```typescript
// 更新提示词API
export async function PUT(request: Request, { params }: { params: { name: string } }) {
  const user = await getCurrentUser(request);
  const prompt = await getPromptByName(params.name);
  
  // 权限检查
  const permission = checkEditPermission(prompt, user);
  if (!permission.canEdit) {
    return NextResponse.json(
      { error: '没有编辑权限', reason: permission.reason },
      { status: 403 }
    );
  }
  
  // 执行更新操作
  // ...
}
```

### 3. 前端权限控制

```typescript
// 编辑按钮显示控制
const showEditButton = useMemo(() => {
  if (!user) return false;
  const permission = checkEditPermission(prompt, user);
  return permission.canEdit;
}, [prompt, user]);

// 表单字段权限控制
const canModifyAuthor = permissionCheck?.reason === 'owner' || permissionCheck?.reason === 'admin';
const canModifyVisibility = permissionCheck?.reason !== 'contributor';
```

## 安全考虑

### 1. 防止权限提升
- 前端权限检查仅用于UI控制
- 后端必须进行完整的权限验证
- 使用JWT或session进行身份验证

### 2. 审计日志
```typescript
// 记录编辑操作
await createAuditLog({
  action: 'prompt_updated',
  resource_type: 'prompt',
  resource_id: prompt.id,
  user_id: user.id,
  changes: diffChanges,
  ip_address: getClientIP(request),
  user_agent: request.headers.get('user-agent')
});
```

### 3. 版本控制
- 保存提示词的历史版本
- 支持回滚操作
- 显示修改历史和作者

## 用户体验优化

### 1. 权限提示
- 清晰的权限说明
- 友好的错误提示
- 申请权限的引导

### 2. 协作功能
- 实时编辑冲突检测
- 评论和建议功能
- 变更通知机制

### 3. 权限申请流程
```typescript
// 申请编辑权限
const requestEditPermission = async (promptId: string, reason: string) => {
  await api.post('/api/permissions/request', {
    resource_type: 'prompt',
    resource_id: promptId,
    permission_type: 'edit',
    reason: reason
  });
};
```

## 总结

### 必要的权限控制
1. ✅ **登录要求** - 必须实现
2. ✅ **创建者权限** - 用户可以编辑自己的提示词
3. ✅ **管理员权限** - 管理员可以编辑所有提示词
4. ⚠️ **贡献者权限** - 需要谨慎实现，建议添加额外的安全措施
5. 🔄 **协作者权限** - 可选功能，适合团队协作场景

### 实现优先级
1. **高优先级**：基础权限检查（登录、创建者、管理员）
2. **中优先级**：可见性控制、审计日志
3. **低优先级**：协作功能、权限申请流程

### 安全建议
- 始终在后端进行权限验证
- 实施最小权限原则
- 记录所有敏感操作
- 定期审查权限设置
- 提供权限管理界面

这个权限管理系统既保证了安全性，又提供了必要的灵活性，可以根据具体的使用场景进行调整和扩展。 