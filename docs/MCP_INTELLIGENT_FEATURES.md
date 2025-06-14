# 🤖 MCP智能功能 - 支持第三方客户端AI分析

## 📋 概述

MCP Prompt Server现在支持使用第三方AI客户端（如Claude Desktop、Cursor、Cline等）的AI模型进行智能提示词分析，而不需要在服务器端配置AI API密钥。这种设计让您可以：

- 🔑 **无需重复配置API密钥** - 使用您在第三方客户端中已配置的AI模型
- 🎯 **更灵活的模型选择** - 可以使用不同的AI模型进行分析
- 🚀 **更好的性能** - 利用第三方客户端的优化
- 🔄 **混合模式** - 支持外部AI和本地AI分析的组合使用

## 🛠️ 新增的MCP工具

### 1. `intelligent_prompt_selection` - 智能提示词选择

基于用户需求和上下文智能推荐最合适的提示词。

**参数：**
```json
{
  "user_query": "我需要写一封商务邮件",          // 必需：用户需求描述
  "context": "正式商务场合",                    // 可选：使用场景上下文
  "preferred_category": "商业",                 // 可选：偏好分类
  "preferred_models": ["llm-large"],            // 可选：偏好模型
  "difficulty_level": "intermediate",           // 可选：难度级别
  "max_results": 5,                            // 可选：最大结果数
  "include_reasoning": true                     // 可选：是否包含推荐理由
}
```

**响应示例：**
```json
{
  "success": true,
  "query": "我需要写一封商务邮件",
  "recommendations": [
    {
      "prompt": {
        "name": "商务邮件助手",
        "description": "专业的商务邮件写作助手",
        "category": "商业",
        "tags": ["邮件", "商务", "写作"],
        "difficulty": "intermediate",
        "estimatedTokens": 150
      },
      "matchScore": 0.95,
      "reasons": ["内容高度相关", "分类匹配: 商业", "使用场景匹配"]
    }
  ],
  "bestMatch": {...}
}
```

### 2. `intelligent_prompt_storage` - 智能提示词存储

智能分析并存储提示词到数据库，支持使用第三方客户端AI分析结果。

**参数：**
```json
{
  "content": "你是一个专业的邮件写作助手...",     // 必需：提示词内容
  "external_analysis": {                        // 可选：外部AI分析结果
    "category": "商业",
    "tags": ["邮件", "写作", "商务"],
    "difficulty": "intermediate",
    "suggestedTitle": "商务邮件写作助手",
    "description": "专业的商务邮件写作工具",
    "compatibleModels": ["llm-large", "llm-medium"],
    "confidence": 0.9
  },
  "user_provided_info": {                       // 可选：用户覆盖信息
    "name": "我的邮件助手"
  },
  "force_local_analysis": false,                // 可选：强制使用本地AI
  "auto_enhance": true,                         // 可选：自动增强
  "skip_duplicate_check": false                 // 可选：跳过重复检查
}
```

### 3. `analyze_prompt_with_external_ai` - 外部AI分析指导

获取分析指导，让您使用自己的AI客户端进行分析。

**参数：**
```json
{
  "content": "你是一个专业的编程助手...",         // 必需：要分析的内容
  "analysis_type": "full",                      // 可选：分析类型
  "existing_tags": ["编程", "JavaScript"]        // 可选：现有标签
}
```

**响应包含：**
- `analysisPrompt`: 用于您的AI客户端的分析提示词
- `expectedFormat`: 期望的分析结果格式
- `systemContext`: 系统上下文信息（分类、标签、模型等）
- `instructions`: 使用说明

## 🔄 使用工作流

### 方式1：使用外部AI分析（推荐）

1. **获取分析指导**
```bash
# 调用MCP工具获取分析指导
analyze_prompt_with_external_ai {
  "content": "你的提示词内容",
  "analysis_type": "full"
}
```

2. **使用您的AI客户端分析**
```bash
# 在您的AI客户端中运行返回的analysisPrompt
# 例如在Claude Desktop中：
"请分析以下提示词内容，并返回JSON格式的分析结果：

你的提示词内容

要求：
1. 分类（category）- 必须从以下选项中选择：编程、文案、翻译...
2. 标签（tags）- 提取3-8个相关标签
..."
```

3. **存储分析结果**
```bash
# 将AI分析结果传递给存储工具
intelligent_prompt_storage {
  "content": "你的提示词内容",
  "external_analysis": {
    "category": "编程",
    "tags": ["JavaScript", "代码生成"],
    "difficulty": "intermediate",
    "suggestedTitle": "JavaScript代码生成器",
    "description": "智能的JavaScript代码生成助手"
  }
}
```

### 方式2：使用本地AI分析（后备）

```bash
# 直接使用本地AI分析和存储
intelligent_prompt_storage {
  "content": "你的提示词内容",
  "force_local_analysis": true
}
```

### 方式3：智能选择现有提示词

```bash
# 基于需求智能推荐
intelligent_prompt_selection {
  "user_query": "我需要一个帮助我debug代码的助手",
  "preferred_category": "编程",
  "difficulty_level": "intermediate"
}
```

## 🎯 分析类型说明

### `full` - 完整分析
返回所有字段：分类、标签、难度、变量、兼容模型、改进建议、使用场景、建议标题、描述、置信度

### `quick` - 快速分析
只返回：分类、标签、难度

### `classify` - 仅分类
只返回：分类

### `tags` - 仅标签
只返回：标签列表

## 📊 预设选项

### 21个预设分类
- 基础：全部、通用
- 专业：学术、职业、商业、办公
- 创作：文案、设计、绘画
- 技术：编程、翻译、科技
- 媒体：视频、播客、音乐
- 其他：教育、情感、娱乐、游戏、生活、健康

### 13个预设模型
- **文本模型**: llm-large, llm-medium, llm-small
- **专用模型**: code-specialized, translation-specialized, reasoning-specialized
- **多模态**: multimodal-vision, image-generation, image-analysis
- **音视频**: audio-generation, audio-tts, video-generation
- **其他**: embedding-model

## 🔧 第三方客户端配置

### Claude Desktop 配置示例

```json
{
  "mcpServers": {
    "prompt-hub": {
      "command": "node",
      "args": ["path/to/mcp/dist/src/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-key"
      }
    }
  }
}
```

### Cursor 配置示例

在Cursor设置中添加MCP服务器配置，然后在对话中使用：

```
使用intelligent_prompt_selection工具帮我找到适合写技术文档的提示词
```

## 🚨 重要特性

### 🔒 安全性
- 外部AI分析结果会被验证和清理
- 支持重复内容检测
- 用户权限验证

### 🎯 智能匹配
- 语义相似度计算（40%权重）
- 分类匹配度（20%权重）
- 模型兼容性（20%权重）
- 难度匹配度（10%权重）
- 上下文匹配度（10%权重）

### 🔄 容错机制
- 外部AI分析失败时自动使用本地AI
- 无效模型自动使用智能推荐
- 分析结果验证和格式化

## 📝 使用示例

### 示例1：创建编程助手

```bash
# 1. 获取分析指导
analyze_prompt_with_external_ai {
  "content": "你是一个专业的Python编程助手，可以帮助用户解决编程问题和生成代码。",
  "analysis_type": "full"
}

# 2. 在您的AI客户端中运行分析提示词

# 3. 存储结果
intelligent_prompt_storage {
  "content": "你是一个专业的Python编程助手，可以帮助用户解决编程问题和生成代码。",
  "external_analysis": {
    "category": "编程",
    "tags": ["Python", "编程助手", "代码生成"],
    "difficulty": "intermediate",
    "suggestedTitle": "Python编程助手",
    "description": "专业的Python编程问题解决工具",
    "compatibleModels": ["code-specialized", "llm-large"],
    "confidence": 0.95
  }
}
```

### 示例2：智能选择商务助手

```bash
intelligent_prompt_selection {
  "user_query": "我需要写一份项目提案",
  "context": "向上级汇报的正式提案",
  "preferred_category": "商业",
  "difficulty_level": "advanced",
  "max_results": 3
}
```

## 🎉 优势总结

1. **🔑 无需API密钥配置** - 使用您现有的AI客户端
2. **🎯 更准确的分析** - 利用不同AI模型的优势
3. **🚀 更好的性能** - 第三方客户端优化
4. **🔄 灵活的工作流** - 支持多种使用方式
5. **🛡️ 稳定的后备** - 本地AI分析作为后备
6. **📊 智能推荐** - 多维度匹配算法
7. **🔒 安全可靠** - 完整的验证和权限机制

这个设计让MCP Prompt Server成为一个真正智能和灵活的提示词管理系统！ 