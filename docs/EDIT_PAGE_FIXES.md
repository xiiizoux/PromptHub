# 编辑提示词页面数据加载修复

## 问题描述

编辑提示词页面中的作者、分类、标签信息未能正确加载和显示原始数据：

1. **作者信息丢失** - 编辑页面显示"未知用户"或空白
2. **分类数据不完整** - 预设分类未正确加载
3. **标签信息缺失** - 现有标签未正确显示

## 修复内容

### 1. 改进数据库服务层的提示词获取逻辑

**文件**: `web/src/lib/database-service.ts`

#### 修复作者信息获取
```typescript
// 旧方式 - 存在性能和准确性问题
const prompt = await this.adapter.getPrompt(name, userId);
const author = await this.getUsernameById(prompt.user_id); // 异步调用，可能失败

// 新方式 - 使用联合查询一次性获取
const { data, error } = await this.adapter.supabase
  .from('prompts')
  .select(`
    *,
    user:users!prompts_user_id_fkey(username, display_name)
  `)
  .eq('name', name)
  .single();

// 直接从查询结果获取作者信息
author: data.user?.display_name || data.user?.username || '未知用户'
```

#### 优化分类数据获取
```typescript
async getCategories(): Promise<string[]> {
  try {
    // 1. 先从专用的categories表获取
    const { data: categoriesData } = await this.adapter.supabase
      .from('categories')
      .select('name, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesData && categoriesData.length > 0) {
      return categoriesData.map(item => item.name);
    }

    // 2. 如果categories表为空，初始化预设分类
    const defaultCategories = [
      { name: '通用', sort_order: 1 },
      { name: '创意写作', sort_order: 2 },
      { name: '代码辅助', sort_order: 3 },
      // ... 更多预设分类
    ];

    // 3. 尝试写入默认分类到数据库
    const { data: insertData } = await this.adapter.supabase
      .from('categories')
      .insert(defaultCategories.map(cat => ({
        name: cat.name,
        sort_order: cat.sort_order,
        is_active: true,
        created_at: new Date().toISOString()
      })))
      .select('name');

    // 4. 兜底方案 - 返回默认分类名称
    return defaultCategories.map(cat => cat.name);
  } catch (error) {
    // 错误时返回硬编码的默认分类
    return ['通用', '创意写作', '代码辅助', /* ... */];
  }
}
```

### 2. 修复编辑页面的表单初始化

**文件**: `web/src/pages/prompts/[name]/edit.tsx`

#### 改进默认值设置
```typescript
const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<PromptFormData>({
  defaultValues: {
    name: prompt.name || '',
    description: prompt.description || '',
    content: prompt.content || '',
    category: prompt.category || '通用',  // 确保有默认分类
    author: prompt.author || user?.display_name || user?.username || '未知用户',
    // 使用 !== undefined 确保布尔值正确处理
    is_public: prompt.is_public !== undefined ? prompt.is_public : false,
    allow_collaboration: prompt.allow_collaboration !== undefined ? prompt.allow_collaboration : false,
    // ... 其他字段
  }
});
```

#### 添加用户登录后的作者信息更新
```typescript
// 权限检查和作者信息更新
useEffect(() => {
  if (user) {
    const permission = checkEditPermission(prompt, user);
    setPermissionCheck(permission);
    
    // 更新作者信息如果当前没有作者或作者为未知用户
    if (!prompt.author || prompt.author === '未知用户') {
      const authorName = user.display_name || user.username || user.email.split('@')[0];
      setValue('author', authorName);
    }
    
    // 权限检查逻辑...
  }
}, [user, prompt, router, setValue]);
```

### 3. 完善数据类型转换

#### 确保PromptDetails类型完整性
```typescript
const promptDetails: PromptDetails = {
  // 基础字段
  id: data.id,
  name: data.name,
  description: data.description || '',
  category: data.category || '通用',
  tags: Array.isArray(data.tags) ? data.tags : [],
  messages: data.messages || [],
  is_public: Boolean(data.is_public),
  user_id: data.user_id,
  version: data.version || 1,
  created_at: data.created_at,
  updated_at: data.updated_at,
  
  // 扩展字段
  content: data.messages?.[0]?.content || '',
  input_variables: this.extractInputVariables(data.messages?.[0]?.content || ''),
  compatible_models: data.compatible_models || ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
  allow_collaboration: Boolean(data.allow_collaboration || data.is_public),
  edit_permission: data.edit_permission || 'owner',
  author: data.user?.display_name || data.user?.username || '未知用户'
};
```

## 修复效果

### ✅ 作者信息正确显示
- 通过联合查询一次性获取用户信息
- 支持`display_name`和`username`的回退机制
- 用户登录后自动更新作者信息

### ✅ 分类数据完整加载
- 优先从`categories`表获取预设分类
- 自动初始化默认分类数据
- 多层级兜底机制确保分类可用

### ✅ 标签信息准确获取
- 从现有提示词中提取唯一标签
- 排序和去重处理
- 加载失败时提供默认标签

### ✅ 性能优化
- 减少数据库查询次数
- 使用联合查询替代多次异步调用
- 优化数据转换和类型安全

## 技术细节

### 数据库查询优化
```sql
-- 新的联合查询方式
SELECT 
  prompts.*,
  users.username,
  users.display_name
FROM prompts
LEFT JOIN users ON prompts.user_id = users.id
WHERE prompts.name = $1;
```

### 分类表结构
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 错误处理机制
- 数据库查询失败时的兜底数据
- 类型转换错误的默认值处理
- 用户认证状态变化的响应

## 测试验证

1. **数据完整性**: 所有字段正确加载和显示
2. **用户体验**: 加载状态和错误提示优化
3. **性能**: 减少不必要的API调用
4. **兼容性**: 向后兼容现有数据格式

## 相关文件

- `web/src/lib/database-service.ts` - 数据库服务层优化
- `web/src/pages/prompts/[name]/edit.tsx` - 编辑页面修复
- `web/src/lib/supabase-adapter.ts` - 数据库适配器
- `web/src/types/index.ts` - 类型定义

通过这些修复，编辑提示词页面现在能够正确加载和显示所有原始数据，提供更好的用户体验。 