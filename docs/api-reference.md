# MCP Prompt Server API参考

MCP Prompt Server提供全面的API和MCP工具，用于管理提示词、分析性能和优化提示词。本文档详细介绍所有可用的API端点和MCP工具。

## API端点

### 健康检查

**GET /api/health**

检查服务器是否正常运行。

**响应示例**：
```json
{
  "success": true,
  "message": "MCP Prompt Server is running"
}
```

### 提示词管理

#### 获取提示词名称列表

**GET /api/prompts/names**

获取所有可用提示词的名称列表。

**响应示例**：
```json
{
  "success": true,
  "data": {
    "names": ["general_assistant", "code_assistant", "test_version_control"]
  }
}
```

#### 获取提示词详情

**GET /api/prompts/:name**

获取特定提示词的详细信息。

**参数**：
- `name`：提示词名称

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd",
    "name": "general_assistant",
    "description": "通用助手提示词，用于日常对话和问答",
    "category": "通用",
    "tags": ["对话", "助手", "基础"],
    "messages": [...],
    "created_at": "2025-05-26T02:10:00.519047+00:00",
    "updated_at": "2025-05-26T02:10:00.519047+00:00",
    "version": 1,
    "is_public": false
  }
}
```

#### 创建提示词

**POST /api/prompts**

创建新的提示词。

**请求体**：
```json
{
  "name": "writing_assistant",
  "description": "写作助手提示词，帮助改进文章质量",
  "category": "写作",
  "tags": ["写作", "编辑", "风格"],
  "messages": [
    {
      "role": "system",
      "content": {
        "type": "text",
        "text": "你是一个专业的写作助手，能够帮助用户改进他们的文章质量。"
      }
    }
  ]
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Prompt \"writing_assistant\" created successfully"
}
```

#### 更新提示词

**PUT /api/prompts/:name**

更新现有提示词，自动创建新版本。

**参数**：
- `name`：提示词名称

**请求体**：
```json
{
  "description": "更新的描述",
  "category": "新分类",
  "tags": ["新标签1", "新标签2"],
  "messages": [...]
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Prompt \"general_assistant\" updated successfully"
}
```

#### 删除提示词

**DELETE /api/prompts/:name**

删除特定提示词。

**参数**：
- `name`：提示词名称

**响应示例**：
```json
{
  "success": true,
  "message": "Prompt \"test_prompt\" deleted successfully"
}
```

#### 搜索提示词

**GET /api/prompts/search/:query**

基于关键词搜索提示词。

**参数**：
- `query`：搜索关键词

**响应示例**：
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd",
        "name": "general_assistant",
        "description": "通用助手提示词，用于日常对话和问答",
        "category": "通用",
        "tags": ["对话", "助手", "基础"]
      }
    ]
  }
}
```

### AI功能

#### 提取提示词

**POST /api/extract**

使用AI从文本中提取提示词结构。

**请求体**：
```json
{
  "text": "我需要一个能够解释复杂概念的AI助手...",
  "model": "gpt-4"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "extracted_prompts": [
      {
        "name": "concept_explainer",
        "description": "解释复杂概念的助手",
        "messages": [...]
      }
    ]
  }
}
```

#### 优化提示词

**POST /api/optimize/:name**

使用AI优化现有提示词。

**参数**：
- `name`：提示词名称

**请求体**：
```json
{
  "goal": "提高清晰度和简洁性",
  "model": "gpt-4"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "original": {...},
    "optimized": {...},
    "explanation": "优化过程的解释..."
  }
}
```

### 用户认证

#### 用户注册

**POST /api/auth/register**

注册新用户。

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "display_name": "Example User"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Example User"
    },
    "token": "jwt-token"
  }
}
```

#### 用户登录

**POST /api/auth/login**

用户登录。

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Example User"
    },
    "token": "jwt-token"
  }
}
```

#### 用户登出

**POST /api/auth/logout**

用户登出。

**响应示例**：
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## MCP工具

### 提示词管理工具

#### get_prompt_names

获取所有提示词名称。

**参数**：无

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "names": ["general_assistant", "code_assistant"]
  }
}
```

#### get_prompt_details

获取特定提示词的详细信息。

**参数**：
```json
{
  "params": {
    "name": "general_assistant"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "prompt": {
      "id": "uuid",
      "name": "general_assistant",
      "description": "通用助手提示词",
      "messages": [...]
    }
  }
}
```

#### create_prompt

创建新的提示词。

**参数**：
```json
{
  "params": {
    "name": "new_prompt",
    "description": "新提示词描述",
    "category": "分类",
    "tags": ["标签1", "标签2"],
    "messages": [...]
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "message": "Prompt created successfully"
}
```

### 性能分析工具

#### track_prompt_usage

记录提示词使用数据。

**参数**：
```json
{
  "params": {
    "prompt_id": "uuid",
    "prompt_version": 1,
    "model": "gpt-4",
    "input_tokens": 50,
    "output_tokens": 150,
    "latency_ms": 550,
    "session_id": "session-id",
    "client_metadata": {...}
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "usageId": "uuid"
  }
}
```

#### submit_prompt_feedback

提交提示词使用的反馈。

**参数**：
```json
{
  "params": {
    "usage_id": "uuid",
    "rating": 5,
    "feedback_text": "反馈内容",
    "categories": ["清晰", "有帮助"]
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "message": "反馈已成功提交"
}
```

#### get_prompt_performance

获取提示词的性能数据。

**参数**：
```json
{
  "params": {
    "prompt_id": "uuid",
    "version": 1  // 可选
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "performance": [
      {
        "promptId": "uuid",
        "promptVersion": 1,
        "usageCount": 10,
        "avgRating": 4.5,
        "avgLatencyMs": 520,
        "avgInputTokens": 45,
        "avgOutputTokens": 120,
        "feedbackCount": 5,
        "lastUsedAt": "2025-05-26T02:12:25.475Z"
      }
    ]
  }
}
```

#### generate_performance_report

生成提示词的详细性能报告。

**参数**：
```json
{
  "params": {
    "prompt_id": "uuid"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "report": {
      "prompt": {...},
      "performance": {...},
      "versionComparison": [...],
      "recentUsage": [...],
      "feedbackThemes": {...},
      "optimizationSuggestions": [...]
    }
  }
}
```

#### create_ab_test

创建提示词版本的A/B测试。

**参数**：
```json
{
  "params": {
    "name": "测试名称",
    "prompt_id": "uuid",
    "version_a": 1,
    "version_b": 2,
    "metric": "rating",
    "description": "测试描述"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "testId": "uuid"
  }
}
```

#### get_ab_test_results

获取A/B测试结果。

**参数**：
```json
{
  "params": {
    "test_id": "uuid"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "results": {
      "testInfo": {...},
      "versionA": {...},
      "versionB": {...},
      "comparison": {...},
      "winner": "A",
      "recommendation": "建议使用版本A..."
    }
  }
}
```

### AI辅助工具

#### extract_prompts

从文本中提取提示词。

**参数**：
```json
{
  "params": {
    "text": "我需要一个能够解释复杂概念的AI助手...",
    "model": "gpt-4"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "extracted_prompts": [...]
  }
}
```

#### optimize_prompt

优化现有提示词。

**参数**：
```json
{
  "params": {
    "name": "prompt_name",
    "goal": "提高清晰度和简洁性",
    "model": "gpt-4"
  }
}
```

**响应示例**：
```json
{
  "schema_version": "v1",
  "success": true,
  "data": {
    "original": {...},
    "optimized": {...},
    "explanation": "优化过程的解释..."
  }
}
```

## 错误处理

所有API和MCP工具端点都使用一致的错误格式：

```json
{
  "success": false,
  "error": "错误消息",
  "code": 123  // 可选的错误代码
}
```

常见错误代码：
- `400` - 请求参数错误
- `401` - 未经授权/认证失败
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器内部错误

## 身份验证

API请求需要在请求头中包含认证信息：

```
Authorization: Bearer your-api-key
```

或者在查询参数中添加：

```
?api_key=your-api-key
```
