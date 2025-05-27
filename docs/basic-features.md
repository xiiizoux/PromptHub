# MCP Prompt Server 基本功能

## 提示词管理

MCP Prompt Server提供全面的提示词管理功能，帮助您创建、更新、查询和删除提示词。

### 提示词创建与更新

您可以通过多种方式创建和更新提示词：

1. **通过API创建提示词**
   - 使用`POST /api/prompts`端点
   - 提供提示词名称、描述、分类、标签和消息内容

2. **通过API更新提示词**
   - 使用`PUT /api/prompts/:name`端点
   - 提供要更新的字段

3. **使用MCP工具创建提示词**
   - 使用`create_prompt`工具
   - 支持基于模板创建新的提示词

### 提示词查询与搜索

系统提供多种查询和搜索提示词的方法：

1. **获取所有提示词名称**
   - 使用`GET /api/prompts/names`端点
   - 或使用`get_prompt_names`工具

2. **获取特定提示词详情**
   - 使用`GET /api/prompts/:name`端点
   - 或使用`get_prompt_details`工具

3. **搜索提示词**
   - 使用`GET /api/prompts/search/:query`端点
   - 支持基于名称、描述、标签的搜索

### 提示词删除

1. **删除特定提示词**
   - 使用`DELETE /api/prompts/:name`端点

## AI辅助功能

MCP Prompt Server提供多种AI辅助功能，帮助您创建和优化提示词：

### 提示词提取

- 使用`POST /api/extract`端点或`extract_prompts`工具
- 从文本中自动提取提示词结构和内容
- 支持批量提取多个提示词

### 提示词优化

- 使用`POST /api/optimize/:name`端点或`optimize_prompt`工具
- 基于特定目标优化现有提示词
- 提供优化建议和改进版本

## 提示词版本控制

MCP Prompt Server支持提示词版本控制功能：

1. **创建新版本**
   - 当更新提示词时，系统自动创建新版本
   - 旧版本保存在数据库中供未来参考

2. **查看版本历史**
   - 可以查询特定提示词的所有历史版本
   - 包括每个版本的创建时间和内容变化

3. **回滚到旧版本**
   - 支持将提示词回滚到之前的特定版本
