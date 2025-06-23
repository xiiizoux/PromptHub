# 🚀 统一搜索工具使用指南

## 概述

统一搜索工具(`unified_search`)是PromptHub MCP的核心搜索入口，它将原有的5种不同搜索方式整合为一个智能工具，根据用户输入自动选择最适合的搜索策略。

## 🎯 设计目标

- **简化选择**：用户无需了解复杂的搜索类型，一个工具解决所有需求
- **智能路由**：根据查询内容和参数自动选择最佳搜索算法
- **向后兼容**：保留所有原有功能，无缝升级
- **渐进增强**：从简单到复杂的搜索策略

## 🔍 搜索模式

### 自动模式 (推荐)
系统根据输入自动选择最适合的搜索方式：

```javascript
unified_search({
  query: "写商务邮件"
})
```

**智能路由逻辑：**
- 检测到自然语言 → 语义搜索
- 检测到筛选条件 → 高级搜索  
- 检测到推荐需求 → 智能选择
- 简单关键词 → 基础搜索

### 手动指定模式
用户可以明确指定搜索模式：

```javascript
unified_search({
  query: "邮件模板",
  mode: "semantic"  // semantic | advanced | intelligent | basic
})
```

## 📋 使用场景

### 1. 简单自然语言搜索
```javascript
// 系统自动选择：语义搜索
unified_search({
  query: "帮我写个正式的商务邮件"
})
```

### 2. 高级条件筛选
```javascript
// 系统自动选择：高级搜索
unified_search({
  query: "邮件",
  category: "商务",
  tags: ["正式", "模板"],
  difficulty: "simple"
})
```

### 3. 智能推荐
```javascript
// 系统自动选择：智能推荐
unified_search({
  query: "商务沟通",
  context: "需要与客户进行项目洽谈",
  task_type: "business_communication"
})
```

### 4. 多字段搜索
```javascript
// 系统自动选择：多字段搜索
unified_search({
  query: "Python",
  name_query: "代码分析",
  content_query: "性能优化",
  tag_query: "编程"
})
```

## 🔧 完整参数说明

### 必需参数
- `query` (string): 搜索查询，支持自然语言

### 可选参数

#### 搜索控制
- `mode` (string): 手动指定搜索模式
- `max_results` (number): 最大结果数，默认5
- `sort_by` (string): 排序方式
- `include_public` (boolean): 是否包含公开提示词

#### 高级搜索
- `category` (string): 分类筛选
- `tags` (array): 标签筛选
- `difficulty` (string): 难度级别
- `date_from` (string): 开始日期
- `date_to` (string): 结束日期

#### 智能推荐
- `context` (string): 使用场景描述
- `task_type` (string): 任务类型
- `preferences` (object): 用户偏好

#### 多字段搜索
- `name_query` (string): 在名称中搜索
- `content_query` (string): 在内容中搜索
- `tag_query` (string): 在标签中搜索
- `description_query` (string): 在描述中搜索

## 📊 搜索策略详解

### 1. 语义搜索 (Semantic Search)
**触发条件：**
- 自然语言查询
- 无复杂筛选条件
- 查询复杂度 > 0.6

**优势：**
- 理解用户意图
- 多维度相关性评分
- 对话式结果展示

### 2. 高级搜索 (Advanced Search)
**触发条件：**
- 有分类、标签等筛选条件
- 有多字段搜索参数
- 需要精确条件匹配

**优势：**
- 精确条件筛选
- 多维度排序
- 专业用户友好

### 3. 智能推荐 (Intelligent Search)
**触发条件：**
- 提供了context或task_type
- 需要个性化推荐
- 有用户偏好设置

**优势：**
- 基于场景推荐
- 考虑用户偏好
- 任务导向优化

### 4. 基础搜索 (Basic Search)
**触发条件：**
- 简单关键词查询
- 查询长度 < 10
- 无空格和标点

**优势：**
- 快速响应
- 资源消耗低
- 简单直接

## 🚀 最佳实践

### 推荐使用方式

#### ✅ 简单查询 - 直接使用
```javascript
unified_search({ query: "写邮件" })
```

#### ✅ 复杂需求 - 添加参数
```javascript
unified_search({
  query: "项目管理",
  category: "商务",
  max_results: 3
})
```

#### ✅ 场景化搜索
```javascript
unified_search({
  query: "团队沟通",
  context: "远程团队协作中的问题解决",
  task_type: "communication"
})
```

### 避免的使用方式

#### ❌ 过度指定模式
```javascript
// 不推荐：让系统自动选择更好
unified_search({
  query: "写邮件",
  mode: "basic"  // 系统会自动选择更适合的语义搜索
})
```

#### ❌ 参数冲突
```javascript
// 不推荐：智能推荐和高级筛选混用
unified_search({
  query: "分析代码",
  context: "项目优化",     // 智能推荐参数
  category: "技术",        // 高级搜索参数
  tags: ["编程"]          // 可能产生冲突
})
```

## 📈 性能优化

### 响应时间
- **语义搜索**: < 100ms
- **高级搜索**: < 150ms  
- **智能推荐**: < 200ms
- **基础搜索**: < 50ms

### 缓存策略
- 常用查询自动缓存
- 用户偏好持久化
- 智能预加载

### 资源控制
- 候选集限制50个
- 自动超时保护
- 内存使用优化

## 🔄 升级指南

### 从原有搜索工具迁移

#### smart_semantic_search → unified_search
```javascript
// 旧方式
smart_semantic_search({ query: "写邮件", max_results: 5 })

// 新方式（完全兼容）
unified_search({ query: "写邮件", max_results: 5 })
```

#### enhanced_search_prompts → unified_search
```javascript
// 旧方式
enhanced_search_prompts({
  query: "邮件",
  category: "商务",
  tags: ["正式"]
})

// 新方式（功能增强）
unified_search({
  query: "邮件",
  category: "商务", 
  tags: ["正式"]
})
```

#### intelligent_prompt_selection → unified_search
```javascript
// 旧方式
intelligent_prompt_selection({
  context: "商务沟通",
  task_type: "email"
})

// 新方式（体验更好）
unified_search({
  query: "商务邮件",
  context: "商务沟通",
  task_type: "email"
})
```

## 🛠️ 故障排除

### 常见问题

#### Q: 搜索结果不够准确？
A: 尝试添加更多上下文或使用具体的筛选条件：
```javascript
unified_search({
  query: "写邮件",
  context: "正式商务场合的客户沟通",
  category: "商务"
})
```

#### Q: 搜索速度较慢？
A: 检查查询复杂度，简化不必要的参数：
```javascript
// 复杂查询
unified_search({
  query: "复杂的多维度分析...",
  // 移除不必要的参数
})

// 简化查询
unified_search({
  query: "数据分析",
  max_results: 3
})
```

#### Q: 模式选择不符合预期？
A: 手动指定模式或调整查询方式：
```javascript
unified_search({
  query: "邮件模板",
  mode: "semantic"  // 强制使用语义搜索
})
```

## 📞 技术支持

如果遇到问题或有建议，请：
1. 检查查询参数是否正确
2. 查看返回的search_metadata了解选择的模式
3. 尝试不同的查询方式
4. 联系技术支持团队

---

**总结：** 统一搜索工具将复杂的搜索选择简化为智能的自动路由，让用户专注于表达需求而不是选择工具。通过一个入口满足所有搜索场景，大大提升了用户体验！🎉