# 🔍 统一搜索引擎部署指南

## 🎯 部署概览

本指南说明如何部署和测试新的统一搜索引擎，确保MCP服务器与Web服务器完全解耦。

## 🏗️ 架构说明

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Web Server    │ ──────────────► │   MCP Server    │
│   (Port 9011)   │                │   (Port 9010)   │
│                 │                │                 │
│ - Next.js UI    │                │ - 统一搜索引擎   │
│ - 用户界面      │                │ - 搜索算法整合   │
│ - 前端逻辑      │                │ - 工具API端点    │
└─────────────────┘                └─────────────────┘
```

## ✅ 已完成的更新

### 1. MCP路由器更新 (`mcp/src/api/mcp-router.ts`)

#### 新增导入
```typescript
import {
  unifiedSearchEngineToolDef,
  quickSearchToolDef,
  handleUnifiedSearch,
  handleQuickSearch
} from '../tools/unified-search-engine.js';
```

#### 新增工具注册
```typescript
// 工具列表中添加
unifiedSearchEngineToolDef,  // 全功能统一搜索
quickSearchToolDef,          // 简化快速搜索
```

#### 新增路由处理
```typescript
// 路由处理器中添加
case 'unified_search':
  result = await handleUnifiedSearch(params, req?.user?.id);
  break;
case 'search':
  result = await handleQuickSearch(params, req?.user?.id);
  break;
```

#### 更新服务器能力
```typescript
capabilities: [
  'prompt_management',
  'version_control', 
  'performance_analysis',
  'intelligent_ai_tools',
  'enhanced_search',
  'unified_search_engine'  // 新增
]
```

### 2. 统一搜索引擎 (`mcp/src/tools/unified-search-engine.ts`)

#### 核心功能
- **UnifiedSearchEngine**: 全功能搜索引擎类
- **QuickSearchTool**: 简化搜索工具类
- **多算法支持**: semantic, keyword, hybrid, smart
- **智能缓存**: 5分钟热缓存，15分钟清理
- **性能监控**: 搜索质量和响应时间统计

#### 提供的API端点
- `POST /tools/unified_search/invoke` - 全功能搜索
- `POST /tools/search/invoke` - 快速搜索

## 🚀 部署步骤

### 1. 确认MCP服务器运行

```bash
# 在项目根目录
cd ~/PromptHub
npm run mcp:dev
```

预期输出：
```
info: MCP服务器启动成功，端口: 9010
info: 健康检查: http://localhost:9010/api/health
info: MCP工具端点: http://localhost:9010/tools
```

### 2. 验证工具注册

访问工具端点：
```bash
curl http://localhost:9010/tools | jq
```

应该看到包含新搜索工具的列表：
```json
[
  {
    "name": "unified_search",
    "description": "🔍 统一搜索引擎 - 智能整合多种搜索算法，提供最优搜索体验"
  },
  {
    "name": "search", 
    "description": "🔍 快速搜索 - 简洁的搜索入口，自动选择最佳搜索策略"
  }
]
```

### 3. 运行集成测试

使用提供的测试脚本：
```bash
cd mcp
node test-search-integration.js
```

预期输出：
```
🚀 开始MCP搜索功能整合测试

🔍 测试MCP服务器健康状态...
✅ MCP服务器健康检查通过: healthy

🔧 测试获取工具列表...
✅ 发现搜索相关工具:
  - search: 🔍 快速搜索 - 简洁的搜索入口
  - unified_search: 🔍 统一搜索引擎 - 智能整合多种搜索算法

⚡ 测试快速搜索功能...
✅ 快速搜索成功
  - 找到 3 个结果
  - 搜索响应格式正确

🔍 测试统一搜索引擎...
✅ 统一搜索成功
  - 找到 5 个结果
  - 搜索算法: smart
  - 平均置信度: 0.78

🧠 测试语义搜索算法...
✅ 语义搜索成功
  - 找到 3 个语义匹配结果
  - 第一个结果置信度: 85%
  - 匹配理由: 标题高度匹配, 描述内容相关

📊 测试结果汇总:
通过: 5/5
成功率: 100%

🎉 所有测试通过！MCP搜索功能整合成功
```

## 🔌 API使用方式

### 快速搜索API

```bash
curl -X POST http://localhost:9010/tools/search/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "q": "写邮件",
      "limit": 5
    }
  }'
```

### 统一搜索API

```bash
curl -X POST http://localhost:9010/tools/unified_search/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "query": "我需要写一份商务邮件",
      "algorithm": "smart",
      "context": "正式商务环境",
      "filters": {"category": "business"},
      "max_results": 8,
      "min_confidence": 0.6,
      "sort_by": "relevance"
    }
  }'
```

### 算法选择

- **smart** (推荐): 智能自适应，根据查询类型自动选择最佳算法
- **semantic**: 语义搜索，适合自然语言查询
- **keyword**: 关键词搜索，适合精确匹配
- **hybrid**: 混合搜索，结合多种算法

## 🌐 Web服务器集成

### Next.js API Routes集成

在Web服务器中通过HTTP调用MCP搜索API：

```typescript
// web/pages/api/search.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, algorithm = 'smart', limit = 5 } = req.body;
    
    // 调用MCP服务器搜索API
    const mcpResponse = await fetch('http://localhost:9010/tools/search/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: { q: query, limit }
      })
    });
    
    const result = await mcpResponse.json();
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
}
```

### 前端组件调用

```typescript
// web/components/SearchComponent.tsx
const searchPrompts = async (query: string) => {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  return response.json();
};
```

## 🔧 故障排除

### 1. MCP服务器未启动

**症状**: 测试脚本报错 "ECONNREFUSED"
**解决**: 
```bash
cd ~/PromptHub
npm run mcp:dev
```

### 2. 工具未注册

**症状**: 返回 "未知工具: search"
**解决**: 检查路由器文件更新是否正确应用

### 3. 搜索结果为空

**症状**: 搜索返回成功但结果为空
**解决**: 
- 检查数据库中是否有提示词数据
- 降低 `min_confidence` 阈值
- 使用更通用的搜索关键词

### 4. 性能问题

**症状**: 搜索响应缓慢
**解决**:
- 启用缓存: `enable_cache: true`
- 减少 `max_results` 数量
- 使用 `algorithm: 'keyword'` 提高速度

## 📊 监控和调优

### 性能指标

搜索API返回的性能报告：
```json
{
  "performance": {
    "total_results": 8,
    "source_distribution": {
      "semantic": 4,
      "keyword": 2,
      "expanded": 2
    },
    "average_confidence": 0.78,
    "top_confidence": 0.92
  }
}
```

### 建议阈值

- **响应时间**: < 100ms (优秀), < 300ms (良好)
- **置信度**: > 0.7 (高质量), > 0.5 (可接受)
- **缓存命中率**: > 20% (有效)

## 🔄 版本兼容性

### 向后兼容

原有搜索工具继续可用：
- `enhanced_search_prompts`
- `semantic_search`
- `conversational_search`
- `one_click_search`

### 推荐迁移路径

1. **立即可用**: 新项目直接使用 `unified_search` 或 `search`
2. **渐进迁移**: 现有项目逐步替换旧搜索API
3. **完全迁移**: 6个月后考虑弃用旧API

## 🎯 最佳实践

### 1. 搜索查询优化

- **短查询**: 使用关键词算法
- **长查询**: 使用语义算法  
- **混合需求**: 使用智能自适应

### 2. 缓存策略

- **频繁查询**: 启用缓存
- **实时数据**: 禁用缓存
- **批量处理**: 预热缓存

### 3. 错误处理

```typescript
try {
  const result = await searchAPI(query);
  if (!result.success) {
    // 降级到简单搜索
    return await fallbackSearch(query);
  }
  return result;
} catch (error) {
  // 记录错误并返回默认结果
  console.error('搜索失败:', error);
  return { results: [], error: '搜索暂时不可用' };
}
```

---

🎉 **部署完成！** 

统一搜索引擎现已成功集成到MCP服务器，提供独立的搜索API服务，与Web服务器完全解耦。Web端可通过HTTP API调用搜索功能，无需直接集成搜索代码。 