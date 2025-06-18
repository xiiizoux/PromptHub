# 性能分析页面数据问题修复总结

## 问题概述

性能分析页面显示的数值都是错误的模拟数据，而不是来自数据库的真实数据。

## 发现的问题

### 1. 前端API使用模拟数据
**位置**: `web/src/lib/api.ts` 第529-586行的 `getPromptPerformance` 函数

**问题**: 代码中明确写着：
```typescript
// 使用模拟数据而不是调用可能失败的API
// 在生产环境中，这里应该调用真实的API
console.log(`提示词 ${promptId} 返回模拟性能数据`);

// 生成一些随机的模拟数据
const usageCount = Math.floor(Math.random() * 1000) + 10;
const successRate = 0.85 + Math.random() * 0.1; // 85%-95%
// ...更多模拟数据
```

### 2. 数据库架构完整但未被使用
**数据库表**:
- `prompt_usage` - 存储提示词使用记录
- `prompt_performance` - 存储性能汇总数据  
- `prompt_feedback` - 存储用户反馈
- 相关触发器和函数已正确配置

**问题**: 前端代码没有正确调用这些真实数据

### 3. 系统性能数据也是模拟的
**位置**: `web/src/pages/api/performance/system.ts`

**问题**: 使用随机数生成响应时间等关键指标

## 修复方案

### ✅ 已修复的问题

1. **修复 `getPromptPerformance` 函数**
   - 改为调用真实的 `/performance/${promptId}` API
   - 添加备用的 metrics API 调用
   - 保留合理的默认值处理

2. **修复 `getPerformanceReport` 函数**
   - 改为获取真实的性能报告数据
   - 添加多层数据获取逻辑
   - 改进错误提示信息

3. **修复 MCP 服务器性能数据返回格式**
   - 更新 `get_prompt_performance` 处理函数
   - 正确聚合多版本性能数据
   - 返回符合前端期望的数据结构

4. **修复系统性能数据**
   - 改为从数据库查询真实的使用数据
   - 基于真实响应时间计算系统健康度
   - 添加数据来源标识

### 🛠️ 新增的工具

1. **测试数据生成API**
   - 路径: `/api/debug/create-test-performance-data`
   - 功能: 为指定提示词生成测试使用记录和反馈数据
   - 用途: 验证修复效果

## 测试步骤

### 1. 生成测试数据
```bash
curl -X POST http://localhost:9011/api/debug/create-test-performance-data \
  -H "Content-Type: application/json" \
  -d '{"promptId": "your-prompt-id", "count": 50}'
```

### 2. 验证性能数据
访问性能分析页面，检查是否显示真实数据：
- `/analytics` - 总体性能分析
- `/analytics/[promptId]` - 单个提示词分析
- `/dashboard/analytics` - 仪表板分析

### 3. 检查系统性能
访问系统性能API：
```bash
curl http://localhost:9011/api/performance/system
```

## 数据流向图

```
前端请求 → Next.js API Routes → MCP 服务器 → Supabase 数据库
    ↓              ↓                ↓              ↓
性能分析页面  → /api/performance/ → MCP Tools → prompt_usage
    ↓              ↓                ↓              ↓
显示真实数据  → 聚合处理         → 数据查询     → prompt_performance
```

## 验证清单

- [ ] 性能分析页面不再显示随机数据
- [ ] 使用量、评分、响应时间等指标来自真实数据库
- [ ] 没有数据时显示0而不是随机值
- [ ] 系统性能基于真实使用统计
- [ ] 测试数据生成功能正常工作
- [ ] 控制台日志显示数据来源（real_data 或 default_values）

## 注意事项

1. **环境变量**: 确保 Supabase 连接配置正确
2. **权限**: 确保 API 有足够权限访问数据库
3. **性能**: 大量数据时考虑分页和缓存
4. **监控**: 生产环境建议添加性能监控

## 后续优化建议

1. 添加数据缓存机制
2. 实现实时性能监控
3. 添加更多性能指标
4. 优化数据聚合算法
5. 添加性能告警功能 