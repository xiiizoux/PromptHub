# PromptHub JSONB 迁移部署检查清单

## 📋 迁移概述
本次迁移将 PromptHub 数据库中的两个关键字段从 TEXT 格式转换为 JSONB 格式：
- `prompts.content` → JSONB 格式，支持 Context Engineering
- `categories.optimization_template` → JSONB 格式，支持动态优化模板

## ✅ 已完成的更新

### 1. 类型定义更新
- [x] `supabase/lib/types.ts` - 添加 JSONB 接口定义
- [x] `mcp/src/types.ts` - 同步 MCP 类型定义
- [x] 支持向后兼容的联合类型 (`PromptContentJsonb | string`)

### 2. 数据转换工具
- [x] `supabase/lib/jsonb-utils.ts` - 完整的 JSONB 转换工具集
- [x] `mcp/src/utils/jsonb-utils.ts` - MCP 专用 JSONB 工具
- [x] 安全转换函数和错误处理

### 3. 数据库适配层
- [x] `supabase/lib/supabase-adapter.ts` - 更新所有数据库操作
- [x] `web/src/lib/database-service.ts` - Web 服务数据库层
- [x] JSONB 内容处理和转换方法

### 4. API 接口更新
- [x] `web/src/pages/api/prompts/[id].ts` - 提示词 API
- [x] `web/src/pages/api/ai/optimize.ts` - AI 优化 API
- [x] `web/src/pages/api/ai/optimize-advanced.ts` - 高级优化 API
- [x] JSONB 验证和处理逻辑

### 5. 服务层更新
- [x] `web/src/services/promptCategoryMatcher.ts` - 分类匹配服务
- [x] `mcp/src/services/mcp-category-matcher.ts` - MCP 分类匹配
- [x] 优化模板 JSONB 处理

### 6. 前端组件更新
- [x] `web/src/components/prompts/PromptFormContainer.tsx` - 表单组件
- [x] 支持 `content_text` 和 `context_engineering_enabled` 字段
- [x] 向后兼容的内容处理

### 7. 测试验证
- [x] `test-jsonb-conversion.js` - JSONB 结构验证脚本
- [x] 所有数据结构验证通过
- [x] 边界情况处理测试

## 🚀 部署前检查清单

### 数据库检查
- [ ] 确认数据库迁移已正确应用
- [ ] 验证 `prompts.content` 字段为 JSONB 类型
- [ ] 验证 `categories.optimization_template` 字段为 JSONB 类型
- [ ] 检查现有数据是否正确迁移到 JSONB 格式

### API 端点测试
- [ ] 测试 `/api/prompts` 创建和更新操作
- [ ] 测试 `/api/categories` 获取分类和模板
- [ ] 测试 `/api/ai/optimize` 优化功能
- [ ] 验证 JSONB 数据的正确处理

### 前端功能测试
- [ ] 测试提示词创建表单
- [ ] 测试提示词编辑功能
- [ ] 验证内容显示正确
- [ ] 测试 Context Engineering 功能（如果启用）

### MCP 服务测试
- [ ] 测试 MCP 服务器启动
- [ ] 验证分类匹配功能
- [ ] 测试优化模板处理

## ⚠️ 注意事项

### 向后兼容性
- 所有更新都支持向后兼容
- 旧的字符串格式仍然被支持
- 新的 JSONB 格式会自动处理

### 数据完整性
- 迁移过程中保持数据完整性
- 错误处理确保系统稳定性
- 支持回滚到字符串格式

### 性能考虑
- JSONB 字段已添加 GIN 索引
- 查询性能应该保持或改善
- 监控数据库性能指标

## 🔧 故障排除

### 常见问题
1. **类型错误**: 检查 TypeScript 类型定义是否正确导入
2. **数据转换失败**: 使用 `jsonb-utils` 中的安全转换函数
3. **API 错误**: 验证请求数据格式是否符合新的 JSONB 结构

### 调试工具
- 运行 `node test-jsonb-conversion.js` 验证数据结构
- 检查浏览器控制台的错误信息
- 查看服务器日志中的 JSONB 处理错误

## 📊 监控指标

### 部署后监控
- [ ] API 响应时间
- [ ] 数据库查询性能
- [ ] 错误率和异常日志
- [ ] 用户体验指标

### 成功标准
- 所有现有功能正常工作
- 新的 JSONB 功能可用
- 性能指标在可接受范围内
- 无数据丢失或损坏

## 🎯 后续优化

### Context Engineering 功能
- 实现动态上下文适应
- 添加智能示例选择
- 集成工具绑定功能

### 性能优化
- 优化 JSONB 查询
- 实现缓存策略
- 监控和调优

---

**部署负责人**: 请在完成每项检查后打勾 ✅
**部署日期**: ___________
**回滚计划**: 如遇问题，可回滚到字符串格式处理
