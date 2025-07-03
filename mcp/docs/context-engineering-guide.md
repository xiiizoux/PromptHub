# Context Engineering 使用指南

## 🌟 概述

Context Engineering是PromptHub MCP服务的核心功能，它实现了Andrej Karpathy提出的"上下文工程"概念，为AI Agent时代提供智能的动态上下文管理和个性化适应能力。

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Engineering                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Context       │  │   Context       │  │    State        │ │
│  │   Manager       │  │  Orchestrator   │  │   Manager       │ │
│  │                 │  │                 │  │                 │ │
│  │ • 动态上下文编排 │  │ • 流水线管理    │  │ • 状态持久化    │ │
│  │ • 个性化适应    │  │ • 阶段协调      │  │ • 历史追踪      │ │
│  │ • 实验管理      │  │ • 错误处理      │  │ • 缓存管理      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                        MCP Tools                            │
│  • context_engineering  • context_state                     │
│  • context_config       • context_pipeline                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 核心特性

### 1. 动态上下文编排
- **智能上下文组装**: 根据用户状态、历史记录和当前输入动态组装最优上下文
- **多维度适应**: 支持任务类型、用户偏好、使用模式等多维度适应
- **实时优化**: 基于效果反馈实时调整上下文策略

### 2. 个性化适应引擎
- **用户档案学习**: 自动学习用户的使用模式和偏好
- **适应规则引擎**: 支持自定义适应规则，灵活配置个性化逻辑
- **效果追踪**: 跟踪个性化效果，持续优化适应策略

### 3. 多层级状态管理
- **会话状态**: 维护连续对话的上下文状态
- **用户档案**: 长期用户偏好和学习数据
- **交互历史**: 完整的交互轨迹和效果评估

### 4. 实验框架
- **A/B测试**: 内置A/B测试框架，支持策略对比
- **渐进式优化**: 基于数据驱动的持续优化
- **效果分析**: 详细的实验效果分析和报告

## 🛠️ MCP工具说明

### `context_engineering` - 核心处理工具

这是Context Engineering的主入口，提供完整的智能上下文处理功能。

**参数:**
- `promptId` (必需): 提示词ID
- `input` (必需): 用户输入内容
- `sessionId` (可选): 会话ID，用于维持上下文状态
- `pipeline` (可选): 处理流水线类型
  - `fast`: 快速处理，适合高频请求
  - `default`: 标准处理，平衡性能和效果
  - `deep`: 深度处理，追求最佳效果
- `requiredContext` (可选): 需要的上下文类型列表
- `preferences` (可选): 用户偏好设置

**示例请求:**
```json
{
  "name": "context_engineering",
  "arguments": {
    "promptId": "writing-assistant-001",
    "input": "请帮我写一篇关于AI发展的文章",
    "sessionId": "session_123",
    "pipeline": "default",
    "preferences": {
      "style": "professional",
      "length": "medium",
      "language": "zh-CN"
    }
  }
}
```

**响应结果:**
```json
{
  "success": true,
  "data": {
    "adaptedContent": "根据您的偏好和历史记录优化后的提示词内容...",
    "contextUsed": {
      "userPreferences": {...},
      "relevantHistory": [...],
      "taskContext": {...}
    },
    "adaptationApplied": ["style_adaptation", "complexity_adjustment"],
    "personalizations": ["user_expertise_level", "writing_style"],
    "experimentVariant": "control",
    "metadata": {
      "processingTime": 1200,
      "contextSources": ["preferences", "history", "patterns"],
      "adaptationCount": 3
    },
    "sessionId": "session_123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### `context_state` - 状态查询工具

查询用户的上下文状态和会话信息。

**参数:**
- `sessionId` (可选): 特定会话ID
- `includeHistory` (可选): 是否包含历史记录
- `historyLimit` (可选): 历史记录数量限制

**示例:**
```json
{
  "name": "context_state",
  "arguments": {
    "sessionId": "session_123",
    "includeHistory": true,
    "historyLimit": 10
  }
}
```

### `context_config` - 配置管理工具

管理用户偏好、适应规则和实验设置。

**参数:**
- `action` (必需): 操作类型 (`get`/`set`/`update`/`delete`)
- `configType` (必需): 配置类型 (`preferences`/`adaptationRules`/`experiments`)
- `configData` (可选): 配置数据
- `configId` (可选): 配置ID

**示例 - 设置用户偏好:**
```json
{
  "name": "context_config",
  "arguments": {
    "action": "set",
    "configType": "preferences",
    "configData": {
      "responseStyle": "detailed",
      "complexity": "advanced",
      "language": "zh-CN",
      "domains": ["technology", "business"]
    }
  }
}
```

**示例 - 添加适应规则:**
```json
{
  "name": "context_config",
  "arguments": {
    "action": "set",
    "configType": "adaptationRules",
    "configData": {
      "id": "tech_simplification",
      "name": "技术内容简化",
      "condition": "contains(input, '技术') && user.level == 'beginner'",
      "action": {
        "type": "modify",
        "target": "complexity",
        "value": "simplified"
      },
      "priority": 10,
      "isActive": true
    }
  }
}
```

### `context_pipeline` - 流水线管理工具

配置和管理Context Engineering处理流水线。

**参数:**
- `action` (必需): 操作类型 (`list`/`get`/`register`/`update`/`delete`)
- `pipelineName` (可选): 流水线名称
- `pipelineConfig` (可选): 流水线配置

**示例 - 获取流水线列表:**
```json
{
  "name": "context_pipeline",
  "arguments": {
    "action": "list"
  }
}
```

## 📊 处理流水线

### Fast Pipeline (快速流水线)
- **用途**: 高频请求，追求响应速度
- **阶段**: 基础上下文处理
- **超时**: 3秒
- **适用场景**: 简单查询、实时交互

### Default Pipeline (默认流水线)
- **用途**: 标准处理，平衡性能和效果
- **阶段**: 输入分析 → 上下文丰富 → 个性化检查 → 实验分配
- **超时**: 15秒
- **适用场景**: 大部分常规请求

### Deep Pipeline (深度流水线)
- **用途**: 重要请求，追求最佳效果
- **阶段**: 深度分析 → 高级上下文 → 机器学习个性化 → 自适应优化
- **超时**: 30秒
- **适用场景**: 复杂任务、重要决策

## 🎯 最佳实践

### 1. 会话管理
```javascript
// 维持会话状态，实现连续对话
const sessionId = "user_123_session_" + Date.now();

// 第一次请求
await mcpClient.callTool("context_engineering", {
  promptId: "chat-assistant",
  input: "你好，我想了解AI发展历史",
  sessionId: sessionId
});

// 后续请求使用相同sessionId
await mcpClient.callTool("context_engineering", {
  promptId: "chat-assistant", 
  input: "那么深度学习是什么时候开始的？",
  sessionId: sessionId  // 相同的会话ID
});
```

### 2. 个性化配置
```javascript
// 首先配置用户偏好
await mcpClient.callTool("context_config", {
  action: "set",
  configType: "preferences",
  configData: {
    expertise: "intermediate",
    style: "conversational",
    domains: ["AI", "machine-learning"],
    language: "zh-CN"
  }
});

// 然后使用Context Engineering
await mcpClient.callTool("context_engineering", {
  promptId: "tech-explainer",
  input: "解释一下Transformer架构",
  pipeline: "default"
});
```

### 3. 效果监控
```javascript
// 查询用户状态和效果
const state = await mcpClient.callTool("context_state", {
  includeHistory: true,
  historyLimit: 20
});

console.log("用户满意度:", state.data.statistics.satisfactionScore);
console.log("平均响应时间:", state.data.statistics.averageResponseTime);
```

## 🔧 高级配置

### 自定义适应规则

适应规则使用JSON Logic格式定义条件：

```json
{
  "id": "evening_casual_style",
  "name": "晚间休闲风格",
  "condition": {
    "and": [
      {">=": [{"var": "hour"}, 18]},
      {"<=": [{"var": "hour"}, 23]},
      {"==": [{"var": "user.context"}, "casual"]}
    ]
  },
  "action": {
    "type": "modify",
    "target": "style",
    "value": "relaxed"
  },
  "priority": 15,
  "isActive": true
}
```

### 自定义流水线

```json
{
  "name": "creative_pipeline",
  "description": "创意写作专用流水线",
  "stages": [
    {
      "name": "creativity_boost",
      "priority": 1,
      "processor": "enhance_creativity",
      "timeout": 5000
    },
    {
      "name": "style_adaptation", 
      "priority": 2,
      "processor": "adapt_writing_style",
      "timeout": 3000
    }
  ],
  "totalTimeout": 20000,
  "fallbackStrategy": "graceful"
}
```

## 🐛 故障排除

### 常见问题

1. **响应时间过长**
   - 检查流水线配置
   - 使用`fast`流水线
   - 优化适应规则

2. **个性化效果不明显**
   - 确保用户偏好已正确设置
   - 检查适应规则是否激活
   - 增加交互历史数据

3. **会话状态丢失**
   - 确保使用相同的sessionId
   - 检查会话超时设置
   - 验证用户身份认证

### 调试工具

```javascript
// 获取详细的处理元数据
const result = await mcpClient.callTool("context_engineering", {
  promptId: "debug-test",
  input: "测试输入",
  pipeline: "default"
});

console.log("处理时间:", result.data.metadata.processingTime);
console.log("上下文来源:", result.data.metadata.contextSources);
console.log("应用的适应:", result.data.adaptationApplied);
```

## 📈 性能优化

### 缓存策略
- 用户档案缓存5分钟
- 适应规则缓存10分钟
- 会话状态实时更新

### 并发处理
- 最大并发连接: 100
- 流水线并发度: 可配置
- 超时策略: 优雅降级

### 监控指标
- 处理时间: 目标 < 2秒 (default pipeline)
- 缓存命中率: 目标 > 80%
- 用户满意度: 目标 > 4.0/5.0

## 🔮 未来计划

- **多模态上下文**: 支持图像、音频上下文
- **联邦学习**: 隐私保护的模型训练
- **实时适应**: 毫秒级的上下文调整
- **语义理解**: 更深度的意图理解

---

通过Context Engineering，PromptHub不再是简单的提示词管理工具，而是成为真正智能的AI Agent上下文编排平台，为用户提供个性化、智能化的AI交互体验。