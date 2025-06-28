# PromptHub MCP Adapter v2.5.0 发布说明

🚀 **重大功能升级：三大类别重构与智能文件检测**

## 📅 发布信息
- **版本**: 2.5.0
- **发布日期**: 2025-06-28
- **包大小**: 14.3 kB
- **解压大小**: 45.8 kB

## 🎯 核心亮点

### 1. 三大类别系统重构 🔄
- **完全重构**为对话(chat)、图片(image)、视频(video)三大类别
- **全面支持**图片和视频提示词的完整生命周期管理
- **新增媒体文件**上传和预览功能
- **智能分类**自动识别和处理不同类型的提示词

### 2. 智能文件类型检测 🧠
- **集成file-type库**：基于文件内容进行MIME类型检测
- **解决multer问题**：修复检测不准确导致的上传失败
- **安全性提升**：防止恶意文件上传和类型伪造
- **性能优化**：只检测前4KB，提高大文件处理速度

### 3. 增强的存储和搜索 🔍
- **unified_store工具**：支持图片和视频提示词存储
- **unified_search工具**：支持按类别筛选和媒体预览
- **完整的preview_asset_url**：支持媒体文件预览链接
- **智能分析**：AI自动分析和优化提示词内容

## 🛠️ 技术改进

### 文件上传优化
```javascript
// 新增智能MIME类型检测
const fileType = await fileTypeFromBuffer(sampleBuffer);
if (fileType) {
  detectedMimeType = fileType.mime;
}
```

### 性能提升
- **样本检测**：只检测前4KB进行类型识别
- **错误处理**：完善的降级机制和日志记录
- **代码质量**：常量化MIME类型列表，提高可维护性

### 安全增强
- **内容验证**：基于文件实际内容进行类型验证
- **严格过滤**：拒绝不支持的文件类型
- **防伪造**：无法通过修改文件扩展名绕过检测

## 📊 测试验证

### 完整测试覆盖
- ✅ **图片上传**：PNG、JPEG等格式正常上传
- ✅ **视频上传**：真实1.3MB MP4文件成功处理
- ✅ **类型检测**：准确识别`application/octet-stream` → `video/mp4`
- ✅ **存储功能**：三大类别提示词正常存储
- ✅ **搜索功能**：按类别筛选和媒体预览正常

### 性能表现
- **文件检测**：4KB样本检测，毫秒级响应
- **上传速度**：1.3MB视频文件快速上传
- **内存使用**：优化的buffer处理，降低内存占用

## 🔄 兼容性

### 向后兼容
- ✅ **现有工具**：所有现有工具调用方式不变
- ✅ **对话提示词**：完全兼容现有对话类型提示词
- ✅ **API接口**：保持API接口的一致性
- ✅ **配置方式**：MCP客户端配置方式不变

### 新功能
- 🆕 **图片提示词**：支持图片生成提示词管理
- 🆕 **视频提示词**：支持视频生成提示词管理
- 🆕 **媒体预览**：支持图片和视频预览链接
- 🆕 **智能检测**：自动识别和验证文件类型

## 📦 安装和升级

### NPX安装（推荐）
```bash
npx prompthub-mcp-adapter@2.5.0
```

### 手动升级
```bash
npm uninstall -g prompthub-mcp-adapter
npm install -g prompthub-mcp-adapter@2.5.0
```

### 验证安装
```bash
prompthub-mcp-adapter --version
# 应显示: 2.5.0
```

## 🎉 使用示例

### 存储图片提示词
```javascript
{
  "tool": "unified_store",
  "arguments": {
    "content": "创建一个美丽的日落风景图片...",
    "category_type": "image",
    "preview_asset_url": "https://example.com/image.jpg"
  }
}
```

### 存储视频提示词
```javascript
{
  "tool": "unified_store", 
  "arguments": {
    "content": "制作一个产品演示视频...",
    "category_type": "video",
    "preview_asset_url": "https://example.com/video.mp4"
  }
}
```

### 按类别搜索
```javascript
{
  "tool": "unified_search",
  "arguments": {
    "query": "产品演示",
    "category": "产品展示"
  }
}
```

## 🔮 下一步计划

- 🎯 **更多媒体格式**：支持更多图片和视频格式
- 🚀 **批量操作**：支持批量上传和管理
- 🔧 **高级搜索**：更强大的搜索和过滤功能
- 📊 **使用统计**：提示词使用情况分析

---

**感谢使用 PromptHub MCP Adapter！** 🙏

如有问题或建议，请访问：https://github.com/xiiizoux/PromptHub/issues
