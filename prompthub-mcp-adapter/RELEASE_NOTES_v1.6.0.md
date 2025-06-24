# PromptHub MCP Adapter v1.6.0 发布说明

> 发布日期：2024-12-19  
> 包文件：`prompthub-mcp-adapter-1.6.0.tgz`

## 🎯 新功能亮点

### ✨ 提示词优化工具 (`prompt_optimizer`)

新增专业的提示词优化功能，为第三方AI客户端提供结构化的优化指导：

#### 🔧 支持的优化类型

1. **通用优化 (general)** - 全面提升提示词质量
2. **创意优化 (creative)** - 激发AI创意潜能
3. **技术优化 (technical)** - 提升技术任务准确性
4. **商务优化 (business)** - 商业导向的专业优化
5. **教育优化 (educational)** - 教学场景的结构化优化
6. **绘图优化 (drawing)** - 专门针对AI绘图的提示词优化
7. **分析优化 (analysis)** - 提升分析任务的深度
8. **迭代优化 (iteration)** - 基于现有提示词的进一步优化

#### 🎨 核心特性

- **智能分析**：自动识别提示词问题和改进点
- **质量评分**：提供多维度质量评估
- **使用建议**：给出最佳实践指导
- **多语言支持**：支持中文和英文输出
- **复杂度控制**：适配不同难度需求
- **迭代优化**：支持基于反馈的持续改进

#### 📋 使用示例

```json
{
  "tool": "prompt_optimizer",
  "parameters": {
    "content": "写一个营销邮件",
    "optimization_type": "business",
    "requirements": "针对B2B客户，专业且有说服力",
    "complexity": "medium",
    "language": "zh",
    "include_analysis": true
  }
}
```

#### 🎯 绘图提示词专项优化

针对AI绘图模型（Midjourney、Stable Diffusion、DALL-E等）的特殊优化：

- **主体描述优化**：生动具体的主体细节
- **风格技法指导**：艺术风格和技法建议
- **环境背景增强**：场景和氛围描述
- **质量关键词**：专业的质量增强术语

## 📦 技术改进

- 🔧 更新版本标识到1.6.0
- 📈 工具总数达到30+个
- 🛡️ 优化错误处理和用户体验
- 📝 完善文档和使用说明

## 🚀 安装和使用

### 方式一：NPM安装
```bash
npm install -g prompthub-mcp-adapter@1.6.0
```

### 方式二：直接使用（推荐）
在AI客户端（Cursor、Claude Desktop等）配置中添加：

```json
{
  "prompthub": {
    "command": "npx",
    "args": ["-y", "prompthub-mcp@1.6.0"],
    "env": {
      "API_KEY": "your-api-key-here",
      "MCP_SERVER_URL": "https://mcp.prompt-hub.cc"
    }
  }
}
```

## 🔄 升级指南

### 从v1.5.0升级
1. 无需额外配置，新功能自动可用
2. 现有功能保持完全兼容
3. 新增的`prompt_optimizer`工具可立即使用

### 兼容性
- ✅ Cursor IDE
- ✅ Claude Desktop
- ✅ 其他支持MCP协议的AI客户端
- ✅ Node.js 16.0.0+

## 🎯 完整工具列表

v1.6.0版本提供的30+个工具包括：

### 🚀 核心推荐工具
- `unified_search` - 统一智能搜索
- `unified_store` - AI智能存储
- **`prompt_optimizer` - 提示词优化器 (新增)**

### 🔍 搜索工具
- `smart_semantic_search` - 智能语义搜索
- `enhanced_search_prompts` - 高级搜索
- `search_prompts` - 基础搜索

### 📝 管理工具
- `get_categories` / `get_tags` - 分类标签管理
- `create_prompt` / `update_prompt` - 提示词创建更新
- `get_prompt_details` - 详细信息获取

### 📊 分析工具
- `analyze_prompt_with_external_ai` - AI质量分析
- `track_prompt_usage` - 使用数据跟踪
- `get_prompt_performance` - 性能分析

### 🔄 版本控制
- `get_prompt_versions` - 版本历史
- `restore_prompt_version` - 版本恢复

### 📦 导入导出
- `export_prompts` / `import_prompts` - 批量操作

## 🐛 问题反馈

如遇到问题，请通过以下方式反馈：
- GitHub Issues: https://github.com/xiiizoux/PromptHub/issues
- 邮箱：support@prompt-hub.cc

## 🙏 致谢

感谢所有用户的反馈和建议，让PromptHub MCP适配器持续改进！

---

**PromptHub Team**  
2024年12月19日 