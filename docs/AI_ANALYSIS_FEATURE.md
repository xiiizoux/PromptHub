# 🤖 AI智能分析功能

## 功能概述

PromptHub的AI智能分析功能通过ChatGPT API，为用户提供智能化的提示词分析和自动化处理能力，大大提升创作效率。

## ✨ 核心功能

### 1. **一键智能分析**
- 🤖 **完整AI分析**: 分类、标签、变量、版本建议、改进意见等全面分析
- 🏷️ **智能分类**: 快速准确地将提示词分类到合适的类别
- 🔖 **标签提取**: 自动提取相关标签，体现提示词核心特征
- 📝 **变量识别**: 自动识别`{{变量名}}`格式的模板变量

### 2. **智能建议系统**
- 📋 **版本号建议**: 基于复杂度智能建议版本号
- 💡 **改进建议**: 提供3-5个具体的优化建议
- 🎯 **使用场景**: 列出典型应用场景
- 🔧 **兼容模型**: 推荐适合的AI模型

### 3. **分析结果管理**
- ✅ **选择性应用**: 可以选择应用特定的分析结果
- 🔄 **一键应用**: 快速应用所有分析结果
- 📊 **置信度显示**: 显示AI分析的置信度评分
- 📈 **实时预览**: 实时查看分析结果

## 🚀 使用方法

### 编辑页面集成

1. **在提示词编辑页面**，在"提示词内容"区域可以看到四个按钮：
   - `🤖 智能分析`: 完整分析功能
   - `🏷️ 智能分类`: 快速分类
   - `📝 提取变量`: 提取模板变量
   - `⚙️ 配置`: 查看和管理AI服务配置

2. **输入提示词内容**后，点击对应的分析按钮

3. **查看分析结果**，系统会显示详细的分析报告

4. **应用结果**，可以选择性地应用分析结果到表单字段

5. **配置管理**，点击配置按钮可以：
   - 查看当前API端点和模型配置
   - 检查服务健康状态
   - 了解支持的配置选项

### API接口使用

```bash
# 完整分析
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你的提示词内容",
    "action": "full_analyze",
    "config": {
      "language": "zh",
      "includeImprovements": true,
      "includeSuggestions": true
    }
  }'

# 快速分类
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你的提示词内容",
    "action": "quick_classify"
  }'

# 提取标签
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你的提示词内容",
    "action": "extract_tags"
  }'

# 提取变量
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你的提示词内容",
    "action": "extract_variables"
  }'

# 健康检查
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "action": "health_check",
    "content": ""
  }'

# 获取配置
curl -X POST /api/ai-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_config", 
    "content": ""
  }'
```

## ⚙️ 配置说明

### 环境变量配置

```bash
# .env文件中添加
OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI兼容API配置 (支持自定义端点)
OPENAI_API_BASE_URL=https://api.openai.com/v1

# 模型配置
AI_MODEL_FULL_ANALYSIS=gpt-4
AI_MODEL_QUICK_TASKS=gpt-3.5-turbo
```

### 支持的API端点

#### OpenAI官方
```bash
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-api-key
```

#### 本地Ollama
```bash
OPENAI_API_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=your-local-key  # 可选，某些设置需要
AI_MODEL_FULL_ANALYSIS=llama3:8b
AI_MODEL_QUICK_TASKS=qwen2:7b
```

#### DeepSeek
```bash
OPENAI_API_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=your-deepseek-api-key
AI_MODEL_FULL_ANALYSIS=deepseek-chat
AI_MODEL_QUICK_TASKS=deepseek-chat
```

#### Moonshot
```bash
OPENAI_API_BASE_URL=https://api.moonshot.cn/v1
OPENAI_API_KEY=your-moonshot-api-key
AI_MODEL_FULL_ANALYSIS=moonshot-v1-8k
AI_MODEL_QUICK_TASKS=moonshot-v1-8k
```

#### GLM
```bash
OPENAI_API_BASE_URL=https://api.zhipuai.cn/api/paas/v4
OPENAI_API_KEY=your-glm-api-key
AI_MODEL_FULL_ANALYSIS=glm-4
AI_MODEL_QUICK_TASKS=glm-3-turbo
```

### 分析配置选项

```typescript
interface AnalysisConfig {
  includeImprovements: boolean;  // 是否包含改进建议
  includeSuggestions: boolean;   // 是否包含使用建议
  language: 'zh' | 'en';        // 分析语言
  strictMode: boolean;          // 严格模式
}
```

## 📋 分析结果结构

### 完整分析结果

```typescript
interface AIAnalysisResult {
  category: string;              // 智能分类
  tags: string[];               // 相关标签
  suggestedTitle?: string;      // 建议标题
  description?: string;         // 建议描述
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTokens: number;      // 预估Token数
  variables: string[];          // 提取的变量
  improvements: string[];       // 改进建议
  useCases: string[];          // 使用场景
  compatibleModels: string[];   // 兼容模型
  version: string;             // 建议版本号
  confidence: number;          // 置信度 (0-1)
}
```

### 支持的分类

- 编程
- 创意写作
- 数据分析
- 营销推广
- 学术研究
- 教育培训
- 商务办公
- 内容翻译
- 通用
- 娱乐

## 🛡️ 容错机制

### 后备分析策略

当OpenAI API不可用时，系统会自动启用本地后备分析：

1. **关键词匹配分类**: 基于内容关键词进行分类
2. **正则表达式变量提取**: 使用正则匹配提取变量
3. **复杂度评估**: 基于长度和结构评估复杂度
4. **基础标签生成**: 生成通用标签

### 错误处理

- API调用失败时显示友好错误信息
- 提供离线模式的基础功能
- 自动重试机制
- 详细的错误日志记录

## 🎯 使用场景

### 创作者工作流

1. **快速起步**: 输入初始想法，让AI帮助分类和标记
2. **质量提升**: 获取专业的改进建议
3. **标准化**: 自动生成版本号和变量
4. **优化迭代**: 基于AI建议持续改进

### 团队协作

1. **统一标准**: AI确保标签和分类的一致性
2. **知识共享**: 自动生成使用场景说明
3. **质量控制**: 系统性的改进建议
4. **效率提升**: 减少手动分类和标记工作

## 🔧 技术架构

### 前端组件

- `AIAnalyzeButton`: 分析按钮组件
- `AIAnalysisResultDisplay`: 结果显示组件

### 后端服务

- `ai-analyzer.ts`: 核心分析服务
- `/api/ai-analyze`: API接口端点

### 安全性

- API密钥安全存储
- 请求速率限制
- 错误信息脱敏
- 用户权限验证

## 📊 性能优化

### 缓存策略

- 相同内容分析结果缓存
- 分类和标签本地缓存
- 批量请求优化

### 请求优化

- 针对不同功能使用不同模型
- 请求参数优化
- 并发请求控制

## 🚧 开发计划

### 近期功能

- [ ] 批量分析功能
- [ ] 分析历史记录
- [ ] 自定义分析规则
- [ ] 分析结果评分

### 长期规划

- [ ] 多语言支持
- [ ] 自定义AI模型
- [ ] 行业特定分析
- [ ] 协作分析功能

## 💡 最佳实践

### 提示词编写建议

1. **清晰表达**: 确保提示词意图明确
2. **结构完整**: 包含必要的上下文信息
3. **变量规范**: 使用`{{变量名}}`格式
4. **测试验证**: 应用AI建议后进行测试

### AI分析使用建议

1. **内容完善后分析**: 在提示词基本完成后进行分析
2. **选择性应用**: 不需要应用所有AI建议
3. **人工验证**: 对AI结果进行人工检查
4. **迭代优化**: 基于反馈持续改进

## 🆘 常见问题

### Q: AI分析准确度如何？
A: 分析准确度通常在80%以上，并提供置信度评分供参考。

### Q: 如果OpenAI API不可用怎么办？
A: 系统提供完整的后备分析功能，确保基本功能可用。

### Q: 分析结果可以修改吗？
A: 可以，AI分析仅提供建议，用户可以选择性应用或手动修改。

### Q: 支持批量分析吗？
A: 目前支持单个提示词分析，批量分析功能正在开发中。

### Q: 如何提高分析质量？
A: 提供完整、清晰的提示词内容可以显著提高分析质量。 