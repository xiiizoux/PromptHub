# 代码更新指导 - 第五步

## 1. 数据库适配器更新

### 更新 `supabase-adapter.ts` 中的搜索方法

```typescript
// 原来的搜索方法（需要替换）
.ilike('messages', `%${query}%`)

// 新的搜索方法
.ilike('content', `%${query}%`)
```

### 更新创建和更新方法

```typescript
// 创建提示词时
const promptToCreate = {
  name: promptData.name,
  description: promptData.description,
  content: promptData.content || this.convertMessagesToContent(promptData.messages),
  // ... 其他字段
};

// 辅助方法：将messages转换为content（兼容性）
private convertMessagesToContent(messages: any[]): string {
  if (!messages || !Array.isArray(messages)) return '';
  
  return messages
    .map(msg => typeof msg === 'string' ? msg : msg.content || '')
    .join('\n\n');
}
```

## 2. 前端组件更新

### 更新 `PromptEditForm.tsx`

```typescript
// 表单字段直接使用content
<textarea
  {...register('content', { required: '请输入提示词内容' })}
  rows={12}
  placeholder="在这里编写您的提示词内容..."
  className="input-primary w-full font-mono text-sm resize-none"
/>
```

### 更新显示组件

```typescript
// 简化的内容显示
const renderContent = (prompt: Prompt) => {
  return (
    <ReactMarkdown className="prose prose-invert max-w-none">
      {prompt.content || ''}
    </ReactMarkdown>
  );
};
```

## 3. API接口更新

### 更新 `prompts/[id].ts`

```typescript
// 获取提示词时直接返回content字段
const prompt = await databaseService.getPrompt(id, userId);
return successResponse(res, { 
  prompt: {
    ...prompt,
    content: prompt.content // 直接使用content字段
  }
});
```

## 4. 类型定义更新

### 更新 `types.ts`

```typescript
export interface Prompt {
  id?: string;
  name: string;
  description: string;
  content: string; // 主要内容字段
  category: string;
  tags: string[];
  // messages?: PromptMessage[]; // 可以保留用于兼容性
  // ... 其他字段
}
```

## 5. 搜索功能优化

### 利用新的全文搜索索引

```typescript
// 使用PostgreSQL全文搜索（自适应配置）
const searchWithFullText = async (query: string) => {
  try {
    // 尝试使用全文搜索
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'simple' // 使用simple配置确保兼容性
      });
    return data;
  } catch (error) {
    // 如果全文搜索失败，回退到ILIKE搜索
    console.warn('全文搜索失败，使用ILIKE搜索:', error);
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .ilike('content', `%${query}%`);
    return data;
  }
};

// 优化的搜索方法
const optimizedSearch = async (query: string) => {
  const searchPattern = `%${query}%`;

  const { data } = await supabase
    .from('prompts')
    .select('*')
    .or([
      `name.ilike.${searchPattern}`,
      `description.ilike.${searchPattern}`,
      `content.ilike.${searchPattern}` // 直接搜索content字段
    ].join(','));

  return data;
};
```

## 6. 性能监控

### 添加性能对比

```typescript
// 监控搜索性能
const startTime = performance.now();
const results = await searchPrompts(query);
const endTime = performance.now();
console.log(`搜索耗时: ${endTime - startTime}ms`);
```

## 7. 兼容性处理

### 临时兼容旧格式

```typescript
// 在迁移期间保持兼容性
const getPromptContent = (prompt: Prompt): string => {
  // 优先使用新的content字段
  if (prompt.content) {
    return prompt.content;
  }
  
  // 兼容旧的messages格式
  if (prompt.messages && Array.isArray(prompt.messages)) {
    return prompt.messages
      .map(msg => typeof msg === 'string' ? msg : msg.content || '')
      .join('\n\n');
  }
  
  return '';
};
```

## 8. 测试验证

### 功能测试清单

- [ ] 创建新提示词
- [ ] 编辑现有提示词  
- [ ] 搜索功能
- [ ] 内容显示
- [ ] 导入导出功能
- [ ] 性能对比测试

### 性能测试

```bash
# 搜索性能测试
time curl "http://localhost:3000/api/search?q=AI助手"

# 数据库查询性能
EXPLAIN ANALYZE SELECT * FROM prompts WHERE content ILIKE '%AI%';
```
