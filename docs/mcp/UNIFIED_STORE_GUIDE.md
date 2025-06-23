# 🤖 统一存储工具使用指南

## 概述

统一存储工具(`unified_store`)是PromptHub MCP的智能存储入口，能够通过AI分析自动补全提示词的所有参数，并根据用户指定的参数进行优先处理。

## 🎯 设计理念

- **AI智能分析**：自动分析提示词内容，生成分类、标题、描述、标签等参数
- **用户优先**：用户明确指定的参数优先于AI分析结果
- **自然语言指令**：支持自然语言存储指令解析
- **零配置使用**：仅需提供内容即可完成智能存储

## 🔧 核心功能

### 1. AI智能分析
- **内容理解**：分析提示词的语义和用途
- **分类识别**：自动归类到商务、技术、创意、教育等分类
- **标签提取**：基于内容特征生成相关标签
- **元数据生成**：自动生成标题、描述、难度等级等

### 2. 自然语言指令解析
- **指定标题**：`"使用'xxx'标题"` 或 `"标题为'xxx'"`
- **指定分类**：`"存储到教育分类"` 或 `"分类为商务"`
- **指定标签**：`"标签为编程,技术"` 或 `"标记为创意"`
- **公开设置**：`"设为公开"` 或 `"保持私有"`

### 3. 智能参数合并
- **用户指定参数**：绝对优先使用
- **AI分析结果**：填补用户未指定的参数
- **参数优化**：验证和优化最终参数

## 📋 使用方式

### 基础用法
```javascript
unified_store({
  content: "请帮我写一封正式的商务邮件，内容关于项目进度汇报"
})
```

**AI自动分析结果：**
- 标题：自动生成的提示词
- 分类：商务
- 描述：用于商务场景的提示词，请帮我写一封正式的商务邮件...
- 标签：['商务', '专业', '邮件']

### 带自然语言指令
```javascript
unified_store({
  content: "分析这段代码的性能问题并给出优化建议",
  instruction: "保存此提示词，使用'代码性能分析助手'标题，存储到技术分类，标签为编程,优化"
})
```

**处理结果：**
- 标题：代码性能分析助手 (用户指定)
- 分类：技术 (用户指定)
- 标签：['编程', '优化'] (用户指定)
- 描述：AI分析生成

### 直接参数指定
```javascript
unified_store({
  content: "创作一个科幻小说的开头段落",
  title: "科幻小说创作助手",
  category: "创意",
  tags: ["写作", "科幻", "创意"],
  description: "帮助用户创作科幻小说开头的专用提示词",
  is_public: true
})
```

## 🤖 AI分析维度

### 分类识别算法
| 内容特征 | 自动分类 | 置信度 |
|---------|---------|--------|
| 商务/邮件/客户 | 商务 | 高 |
| 代码/编程/技术 | 技术 | 高 |
| 创意/故事/文案 | 创意 | 高 |
| 教学/教育/学习 | 教育 | 高 |
| 其他 | 通用 | 中 |

### 标签提取策略
- **基础标签**：根据分类自动添加
- **内容标签**：基于关键词提取
- **功能标签**：识别用途(分析、翻译、总结等)
- **风格标签**：识别语言风格(正式、创意等)

### 难度评估
- **简单(Simple)**：内容少于100字符
- **中等(Medium)**：100-500字符
- **复杂(Complex)**：超过500字符或包含复杂逻辑

### 兼容模型分析
```javascript
// 根据复杂度自动推荐
{
  "simple": ["GPT-4", "GPT-3.5", "Claude", "Gemini"],
  "medium": ["GPT-4", "GPT-3.5", "Claude", "Gemini"],
  "complex": ["GPT-4", "Claude", "Gemini"]  // 排除简单模型
}
```

## 📊 参数优先级

### 优先级排序
1. **用户直接参数** (最高优先级)
2. **自然语言指令解析**
3. **AI智能分析结果**
4. **系统默认值** (最低优先级)

### 参数来源标记
系统会在分析报告中标记每个参数的来源：
```javascript
{
  "parameter_sources": {
    "title": "user",        // 用户指定
    "category": "ai",       // AI分析
    "description": "ai",    // AI分析
    "tags": "user",         // 用户指定
    "difficulty": "ai"      // AI分析
  }
}
```

## 🔍 指令解析示例

### 标题指定
```javascript
// 支持的表达方式
"使用'商务邮件助手'标题"
"标题为'项目管理工具'"
"title为'代码分析器'"
```

### 分类指定
```javascript
// 支持的表达方式
"存储到教育分类"
"保存到商务类别"
"分类为技术"
"category为创意"
```

### 标签指定
```javascript
// 支持的表达方式
"标签为编程,优化,性能"
"标记为商务,正式"
"tags为创意,写作"
```

### 公开设置
```javascript
// 支持的表达方式
"设为公开" / "public" → is_public: true
"保持私有" / "private" → is_public: false
```

## 📈 性能特性

### 响应时间
- **仅AI分析**：< 200ms
- **含指令解析**：< 250ms
- **参数优化**：< 50ms
- **数据库存储**：< 100ms

### 分析准确率
- **分类识别**：85%+ 准确率
- **标签提取**：80%+ 相关性
- **标题生成**：90%+ 可用性
- **描述质量**：85%+ 信息完整性

## 🛠️ 高级用法

### 跳过AI分析
```javascript
unified_store({
  content: "你的提示词内容",
  title: "指定标题",
  category: "指定分类",
  skip_ai_analysis: true  // 跳过AI分析，仅使用用户参数
})
```

### 强制覆盖
```javascript
unified_store({
  content: "提示词内容",
  instruction: "强制覆盖同名提示词",
  force_overwrite: true
})
```

### 批量存储场景
```javascript
// 适合批量导入时禁用AI分析提高速度
unified_store({
  content: "批量导入的提示词",
  title: "预定义标题",
  category: "预定义分类",
  auto_analyze: false  // 禁用自动分析
})
```

## 🎯 使用场景

### 1. 第三方客户端集成
```javascript
// 用户在Claude/ChatGPT中说："保存这个提示词"
unified_store({
  content: userProvidedPrompt,
  instruction: "保存此提示词"  // 完全依赖AI分析
})
```

### 2. 智能导入工具
```javascript
// 导入时提供部分信息，AI补全其余
unified_store({
  content: importedContent,
  category: knownCategory,  // 已知分类
  // 其他参数让AI分析
})
```

### 3. 用户自定义存储
```javascript
// 用户明确指定所有参数
unified_store({
  content: "用户创建的提示词",
  instruction: "使用'我的助手'标题，存储到个人分类，设为私有",
  tags: ["个人", "自用"]
})
```

## 📊 分析报告解读

### 完整报告示例
```javascript
{
  "execution_summary": {
    "execution_time_ms": 156,
    "used_ai_analysis": true,
    "ai_confidence": 0.87,
    "user_overrides": 2
  },
  "parameter_sources": {
    "title": "user",      // 用户指定
    "category": "ai",     // AI分析
    "description": "ai",  // AI分析
    "tags": "user",       // 用户指定
    "difficulty": "ai"    // AI分析
  },
  "ai_analysis": {
    "suggested_title": "AI建议的标题",
    "suggested_category": "技术",
    "suggested_tags": ["编程", "分析"],
    "confidence": 0.87,
    "compatible_models": ["GPT-4", "Claude"],
    "domain": "technology",
    "use_cases": ["代码分析", "性能优化"]
  },
  "final_parameters": {
    "title": "用户指定的标题",  // 实际使用的参数
    "category": "技术",
    "description": "AI生成的描述...",
    "tags": ["用户", "标签"],
    "difficulty": "medium",
    "is_public": false
  }
}
```

## 🚀 最佳实践

### ✅ 推荐做法

#### 1. 信任AI分析
```javascript
// 简单使用，让AI处理大部分工作
unified_store({
  content: "你的提示词内容"
})
```

#### 2. 关键参数用户指定
```javascript
// 仅指定关键参数，其余交给AI
unified_store({
  content: "内容",
  category: "重要的分类",  // 确保分类正确
  is_public: false        // 确保隐私设置
})
```

#### 3. 自然语言指令
```javascript
// 使用自然语言，更符合用户习惯
unified_store({
  content: "内容",
  instruction: "保存到我的工作分类，标题用'日常助手'"
})
```

### ❌ 避免的做法

#### 1. 过度指定参数
```javascript
// 不推荐：指定了所有参数，失去AI分析价值
unified_store({
  content: "内容",
  title: "标题",
  category: "分类", 
  description: "描述",
  tags: ["标签"],
  difficulty: "难度"  // AI能更准确判断
})
```

#### 2. 忽略分析报告
```javascript
// 不推荐：不查看AI分析结果，错失优化机会
// 应该查看返回的analysis_report了解AI的建议
```

## 🔧 故障排除

### 常见问题

#### Q: AI分析的分类不准确？
A: 可通过instruction或直接参数指定正确分类：
```javascript
unified_store({
  content: "你的内容",
  category: "正确的分类"  // 直接指定
})
```

#### Q: 自然语言指令不被识别？
A: 尝试更明确的表达：
```javascript
// 更明确的指令
"使用'具体标题'标题"  // 而不是 "标题叫xxx"
"存储到教育分类"      // 而不是 "放到教育里"
```

#### Q: AI分析速度较慢？
A: 可跳过AI分析：
```javascript
unified_store({
  content: "内容",
  title: "标题",
  category: "分类",
  skip_ai_analysis: true  // 跳过AI分析
})
```

## 📞 技术支持

如果遇到问题：
1. 检查content参数是否提供
2. 查看返回的analysis_report了解处理过程
3. 尝试简化instruction或使用直接参数
4. 查看parameter_sources了解参数来源

---

**总结：** 统一存储工具通过AI智能分析和自然语言指令解析，实现了提示词存储的智能化和自动化，让用户可以专注于内容创作而不是繁琐的参数设置！🎉