# PromptHub MCP Adapter v2.2.6 Release Notes

## 🗂️ 工具简化优化

### 🔧 主要变更

#### 1. **移除冗余工具**
- **删除 `optimize_and_save` 工具**：
  - 该工具功能与现有的 `prompt_optimizer` 和 `unified_store` 工具重复
  - 简化工具集，避免功能混淆
  - 提供更清晰的工作流程

#### 2. **优化工作流程**
- **推荐使用分离式工作流程**：
  1. 使用 `prompt_optimizer` 获取优化建议（不自动保存）
  2. 使用 `unified_store` 进行智能存储
- **职责分离**：
  - `prompt_optimizer`：专注于提供优化建议和分析
  - `unified_store`：专注于智能存储和AI分析

### 📋 当前可用工具

#### 🚀 核心搜索工具
- `unified_search` - **统一搜索引擎** - 语义理解，智能搜索，完美结果展示 ⭐⭐⭐⭐⭐

#### 🧠 智能功能
- `unified_store` - **统一存储** - AI智能分析并存储提示词 ⭐⭐⭐⭐⭐
- `prompt_optimizer` - **提示词优化器** - 为第三方AI客户端提供结构化优化指导（仅提供建议，不自动保存） ⭐⭐⭐⭐⭐

#### 📝 提示词管理
- `get_categories` - 获取所有提示词分类
- `get_tags` - 获取所有提示词标签
- `get_prompt_names` - 获取所有可用的提示词名称
- `get_prompt_details` - 获取特定提示词详情
- `create_prompt` - 创建新提示词
- `update_prompt` - 更新现有提示词

### 🔄 推荐工作流程

1. **优化提示词**：
   ```
   使用 prompt_optimizer 工具获取优化建议
   ```

2. **保存提示词**：
   ```
   使用 unified_store 工具智能存储优化后的提示词
   ```

### 🔧 兼容性

- ✅ **向后兼容**：现有工具调用方式不变
- ✅ **功能完整**：所有核心功能保持可用
- ✅ **性能优化**：减少工具数量，提升响应速度

### 📊 技术改进

- **代码简化**：移除冗余代码，提升维护性
- **文档更新**：更新README和CHANGELOG，反映最新工具集
- **工具集优化**：从23个工具减少到22个工具

---

## 🚀 升级指南

### 如果您正在使用 `optimize_and_save` 工具：

**替换方案**：
```javascript
// 旧方式（已移除）
optimize_and_save({
  content: "your prompt",
  auto_save: false
})

// 新方式（推荐）
// 1. 先优化
prompt_optimizer({
  content: "your prompt",
  optimization_type: "general"
})

// 2. 再保存
unified_store({
  content: "optimized prompt",
  auto_analyze: true
})
```

### 安装最新版本

```bash
npx prompthub-mcp-adapter@latest
```

---

## 📞 支持

如有问题或建议，请访问：
- 🌐 官网：https://prompt-hub.cc
- 📧 GitHub：https://github.com/xiiizoux/PromptHub

---

**发布日期**：2025-06-25  
**版本**：v2.2.6  
**兼容性**：向后兼容，建议升级
