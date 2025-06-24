# Changelog

## [1.6.0] - 2024-12-19

### 新增功能 (Added)
- ✨ **提示词优化工具** (`prompt_optimizer`) - 为第三方AI客户端提供结构化的提示词优化指导
  - 支持8种优化类型：通用、创意、技术、商务、教育、绘图、分析、迭代
  - 提供详细的优化分析和改进建议
  - 支持复杂度控制和多语言输出
  - 特别优化了绘图提示词的处理能力
  - 支持迭代优化模式，可以基于现有提示词进行进一步优化

### 技术改进 (Changed)
- 🔧 更新User-Agent版本标识到1.6.0
- 📦 工具总数增加到30+个，提供更全面的提示词管理功能

### 使用说明
新的提示词优化工具可以通过以下方式调用：
```json
{
  "tool": "prompt_optimizer",
  "parameters": {
    "content": "要优化的提示词内容",
    "optimization_type": "general|creative|technical|business|educational|drawing|analysis|iteration",
    "requirements": "特殊要求或限制条件",
    "complexity": "simple|medium|complex",
    "language": "zh|en"
  }
}
```

# 版本更新日志

## v1.5.0 (2024-12-23)

### 🎉 新功能
- 完善了性能跟踪系统，现在所有搜索操作都能正确记录到数据库
- 修复了智能语义搜索(smart_semantic_search)的使用统计问题
- 优化了搜索操作的性能监控和分析功能

### 🔧 技术改进
- 解决了UUID类型错误导致的数据库插入失败问题
- 修复了Supabase行级安全策略(RLS)阻止性能数据记录的问题
- 使用服务密钥绕过认证限制，确保数据正常写入
- 为搜索操作创建专门的性能跟踪逻辑

### 📊 性能统计
- 现在可以实时监控搜索操作性能指标
- 支持按工具类型、时间范围等维度分析使用情况
- 完整的错误日志和异常处理

### 🏷️ 数据结构
搜索操作现在会在`prompt_usage`表中记录：
- 执行时间(latency_ms)
- Token消耗(input_tokens, output_tokens) 
- 搜索查询内容
- 工具类型标识
- 会话跟踪信息

## v1.4.0 (之前版本)
- 智能语义搜索功能优化
- 统一搜索接口改进
- 多维度搜索算法增强