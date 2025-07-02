# MCP提示词优化器升级说明

## 🎯 升级概述

MCP提示词优化器已升级为智能版本，支持类型选择和智能分类匹配，与web服务器功能保持一致。

## ✨ 新增功能

### 1. 类型选择
- **chat**: 对话类型提示词
- **image**: 图像生成提示词  
- **video**: 视频生成提示词

### 2. 智能分类匹配
- **自动模式**: 不指定分类时，AI自动智能匹配最适合的分类
- **手动模式**: 通过`category`参数手动指定分类名称

### 3. 动态优化模板
- 从数据库动态获取分类和优化模板
- 支持最新的分类配置和模板更新
- 保持与web服务器的一致性

## 🔧 使用方法

### 基础用法（智能匹配）
```json
{
  "content": "画一个美丽的风景画"
}
```
系统将自动匹配最适合的分类和优化模板。

### 指定类型（筛选分类范围）
```json
{
  "content": "画一个美丽的风景画",
  "type": "image"
}
```
只在图像类型的分类中进行匹配。

### 手动指定分类
```json
{
  "content": "画一个美丽的风景画",
  "type": "image",
  "category": "艺术绘画"
}
```
直接使用指定分类的优化模板，置信度100%。

### 完整参数示例
```json
{
  "content": "写一个关于AI的技术文章",
  "type": "chat",
  "category": "学术研究",
  "requirements": "需要包含最新的技术趋势",
  "context": "面向技术专业人员",
  "complexity": "complex",
  "include_analysis": true,
  "language": "zh"
}
```

## 📊 返回结果

### 新增字段
- `matched_category`: 匹配到的分类信息
- `confidence`: 匹配置信度（0-1）
- `matching_reason`: 匹配原因说明
- `is_manual_selection`: 是否为手动选择

### 示例返回
```json
{
  "success": true,
  "data": {
    "optimization_type": "艺术绘画",
    "original_prompt": "画一个美丽的风景画",
    "matched_category": {
      "id": 15,
      "name": "艺术绘画",
      "name_en": "Art Painting",
      "type": "image",
      "description": "专业艺术绘画创作指导"
    },
    "confidence": 0.85,
    "is_manual_selection": false,
    "optimization_template": {
      "system": "",
      "user": "专业的艺术绘画优化模板内容..."
    },
    "improvement_points": [...],
    "usage_suggestions": [...]
  }
}
```

## 🔄 向后兼容

原有的`optimization_type`参数仍然支持，但建议使用新的`type`和`category`参数：

```json
{
  "content": "优化这个提示词",
  "optimization_type": "general"  // 仍然支持
}
```

## 🚀 最佳实践

1. **类型明确**: 对于图像和视频提示词，建议指定`type`参数
2. **智能优先**: 优先使用智能匹配，只在需要精确控制时手动指定分类
3. **置信度参考**: 关注返回的置信度，低置信度时可考虑手动指定分类
4. **模板更新**: 定期清除缓存以获取最新的分类和模板配置

## 🔧 环境配置

确保MCP服务器能够访问web服务器的API：

```bash
# 环境变量
WEB_SERVER_URL=http://localhost:9011
```

## 📝 注意事项

1. 需要web服务器运行以获取分类数据
2. 首次使用时会有网络请求延迟
3. 分类数据会缓存5分钟以提高性能
4. 网络异常时会回退到传统的硬编码模板

## 🎉 升级优势

- **智能化**: AI自动匹配最适合的优化策略
- **灵活性**: 支持手动和自动两种模式
- **一致性**: 与web服务器保持功能一致
- **可扩展**: 支持数据库动态配置新分类
- **专业性**: 基于专业分类的优化模板
