# PromptHub MCP Adapter v2.3.1 发布说明

📅 **发布日期**: 2024-01-30  
🎯 **版本类型**: Bug修复版本  
⚡ **重点**: MCP优化功能问题修复

## 🔧 修复问题

### 1. 优化器保存提示优化
- **问题**: `prompt_optimizer`工具的保存引导不够明确
- **修复**: 改进保存引导文案，提供更清晰的操作指引
- **改进内容**:
  - 从简单提示变为明确的"是否需要保存优化后的提示词？"问答式交互
  - 提供完整的`unified_store`调用示例
  - 在工具描述中添加明确的警告："需明确的保存指令才能调用unified_store保存"

### 2. 兼容模型缺失问题修复
- **问题**: `unified_store`工具在某些情况下保存空的`compatible_models`数组
- **修复**: 完善兼容模型的处理逻辑
- **改进内容**:
  - 修复默认值逻辑：当`compatible_models`为空时，自动使用`getDefaultModelTags()`
  - 修复自然语言指令解析中错误匹配兼容模型的bug
  - 添加详细的兼容模型调试日志
  - 确保存储报告正确显示兼容模型信息

## 📋 技术改进

### 用户体验优化
- 优化提示词优化器的用户引导文案
- 提供更清晰的操作步骤指导
- 改进错误处理和降级机制

### 日志增强
- 增强存储过程的日志输出
- 添加兼容模型的详细信息
- 便于问题排查和调试

### 解析逻辑优化
- 改进自然语言指令解析的准确性
- 增加模型名称验证和过滤
- 避免误匹配测试性文本

## 🎯 使用建议

### 新的优化工作流程
```bash
# 第一步：获取优化建议
prompt_optimizer({
  content: "你的提示词内容",
  optimization_type: "general"
})

# 第二步：明确保存指令
unified_store({
  content: "优化后的提示词内容",
  title: "自定义标题",
  category: "合适的分类"
})
```

### 兼容模型自动推荐
系统现在会根据提示词内容智能推荐兼容模型：
- **编程类**: `code-specialized` + `llm-large`
- **商务类**: `llm-large` + `llm-medium`
- **创意类**: `llm-large` + `llm-medium`
- **绘画类**: `image-generation` + `multimodal-vision`

## 🔄 兼容性

- ✅ **向后兼容**: 现有工具调用方式不变
- ✅ **功能增强**: 新的优化提示和兼容模型修复
- ✅ **数据一致**: 存储报告格式保持一致

## 📦 安装更新

### npm 安装
```bash
npm install prompthub-mcp-adapter@2.3.1
```

### 下载tar包
```bash
# 从GitHub Releases下载
wget https://github.com/xiiizoux/PromptHub/releases/download/v2.3.1/prompthub-mcp-adapter-2.3.1.tgz
```

## 🐛 已知问题

- 无

## 🔜 下个版本计划

- 性能优化
- 更多智能分析功能
- 增强的错误处理

---

**完整变更日志**: 请查看 [CHANGELOG.md](./CHANGELOG.md)  
**问题反馈**: [GitHub Issues](https://github.com/xiiizoux/PromptHub/issues)  
**项目主页**: [PromptHub](https://prompt-hub.cc) 