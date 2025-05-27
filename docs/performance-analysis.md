# MCP Prompt Server 性能分析功能

MCP Prompt Server 提供全面的性能分析功能，帮助您跟踪、分析和优化提示词的使用效果。

## 性能跟踪

### 跟踪提示词使用

系统自动记录提示词的每次使用，收集关键性能指标：

- 使用的提示词ID和版本
- 使用的模型（如"gpt-4"）
- 输入和输出的token数量
- 响应延迟（毫秒）
- 会话ID和客户端元数据

**API端点**：`POST /tools/track_prompt_usage/invoke`

**示例请求**：
```json
{
  "params": {
    "prompt_id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd",
    "prompt_version": 1,
    "model": "gpt-4",
    "input_tokens": 50,
    "output_tokens": 150,
    "latency_ms": 550,
    "session_id": "test-session",
    "client_metadata": {"app": "test-app", "user_type": "developer"}
  }
}
```

### 提交用户反馈

允许用户对提示词生成的内容提交反馈：

- 评分（1-5星）
- 文本反馈
- 反馈分类标签

**API端点**：`POST /tools/submit_prompt_feedback/invoke`

**示例请求**：
```json
{
  "params": {
    "usage_id": "735ea220-f4e2-4fad-bee0-654fa3e7bc89",
    "rating": 5,
    "feedback_text": "这个提示词非常有用，回答很全面",
    "categories": ["清晰", "有帮助"]
  }
}
```

## 性能分析

### 获取性能数据

查询提示词的聚合性能数据：

- 总使用次数
- 平均评分
- 平均响应延迟
- 平均输入/输出token数
- 反馈数量

**API端点**：`POST /tools/get_prompt_performance/invoke`

**示例请求**：
```json
{
  "params": {
    "prompt_id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd",
    "version": 1  // 可选，如果不提供则返回所有版本
  }
}
```

### 生成性能报告

生成详细的提示词性能报告，包括：

- 提示词基本信息
- 性能统计数据
- 版本比较
- 最近使用记录
- 反馈主题分析
- 优化建议

**API端点**：`POST /tools/generate_performance_report/invoke`

**示例请求**：
```json
{
  "params": {
    "prompt_id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd"
  }
}
```

## A/B测试

### 创建A/B测试

创建提示词版本的A/B测试：

- 比较两个不同版本的性能
- 指定主要比较指标（评分、延迟、token数）
- 设置测试结束时间

**API端点**：`POST /tools/create_ab_test/invoke`

**示例请求**：
```json
{
  "params": {
    "name": "通用助手提示词优化测试",
    "prompt_id": "ae86eaeb-8119-48e9-b9be-bcf6f1daf7dd",
    "version_a": 1,
    "version_b": 2,
    "metric": "rating",
    "description": "测试增强版提示词是否能获得更高的用户评分"
  }
}
```

### 获取A/B测试结果

查询A/B测试的结果：

- 各版本的性能对比
- 统计显著性分析
- 胜出版本建议

**API端点**：`POST /tools/get_ab_test_results/invoke`

**示例请求**：
```json
{
  "params": {
    "test_id": "a0117b9f-a50f-441c-a38a-30bd5355981b"
  }
}
```

## 数据库结构

性能分析功能使用以下数据库表：

1. **prompt_usage** - 记录每次提示词使用的基本信息
2. **prompt_feedback** - 存储用户对提示词生成结果的评价
3. **prompt_performance** - 存储聚合的性能数据，便于快速查询
4. **prompt_ab_tests** - 用于比较不同提示词版本的性能

完整的数据库结构请参考 `/supabase/schema.sql` 文件。

## 最佳实践

1. **设置自动跟踪**：在每次提示词使用后自动调用`track_prompt_usage`
2. **收集用户反馈**：在适当的时机提示用户提交反馈
3. **定期分析**：定期生成性能报告，识别改进机会
4. **A/B测试**：在进行重大修改前，使用A/B测试验证效果
5. **版本管理**：保持清晰的版本演进记录，便于追踪性能变化
