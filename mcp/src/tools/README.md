# MCP工具模块

## 文件结构重构说明

本目录已经按功能重新组织，提供更清晰的模块化结构：

```
mcp/src/tools/
├── search/           # 搜索相关工具
│   ├── unified-engine.ts     # 统一搜索引擎核心实现
│   ├── unified-search.ts     # 统一搜索MCP工具包装器
│   ├── semantic-search.ts    # 语义搜索工具
│   ├── semantic-simple.ts    # 简单语义搜索
│   ├── semantic-optimized.ts # 优化的语义搜索
│   ├── enhanced-search.ts    # 增强搜索功能
│   ├── cache.ts             # 搜索缓存管理
│   ├── performance-monitor.ts # 搜索性能监控
│   └── index.ts             # 搜索模块导出
├── storage/          # 存储相关工具
│   ├── unified-store.ts     # 统一存储工具
│   ├── auto-storage.ts      # 自动存储工具
│   └── index.ts             # 存储模块导出
├── recommendations/  # 推荐相关工具
│   ├── smart-recommendation.ts # 智能推荐系统
│   └── index.ts             # 推荐模块导出
├── optimization/     # 优化相关工具
│   ├── prompt-optimizer.ts  # 提示词优化器
│   ├── mcp-optimization.ts  # MCP优化工具
│   └── index.ts             # 优化模块导出
├── config/          # 配置相关工具
│   ├── config-assistant.ts  # 配置助手
│   └── index.ts             # 配置模块导出
├── ui/              # 用户界面工具
│   ├── conversational-ui.ts # 对话式界面
│   ├── quick-copy.ts        # 快速复制工具
│   ├── intelligent-ui.ts    # 智能交互界面
│   └── index.ts             # UI模块导出
├── index.ts         # 主导出文件
└── README.md        # 本文档
```

## 重构改进

### 1. 文件命名规范化
- 移除了所有 `-new-style` 后缀
- 使用更清晰、语义化的文件名
- 统一使用kebab-case命名风格

### 2. 功能分类优化
- **搜索工具**：所有搜索相关功能集中管理
- **存储工具**：统一和自动存储功能
- **推荐工具**：智能推荐系统
- **优化工具**：提示词和MCP优化功能
- **配置工具**：系统配置管理
- **UI工具**：用户交互界面工具

### 3. 重复代码清理
- 移除了重复的SmartRecommendationTool（从semantic-search.ts移除）
- 清理了功能重叠的工具定义
- 删除了损坏的文件（.broken文件）

### 4. 模块化导入
每个子目录都有独立的index.ts文件，支持：
```typescript
// 按类别导入
import { SearchTools, StorageTools } from './tools/index.js';

// 或直接导入具体工具
import { unifiedSearchTool } from './tools/search/index.js';
```

## 使用方式

### 导入整个工具类别
```typescript
import { SearchTools } from './tools/index.js';
// 使用：SearchTools.unifiedSearchTool
```

### 导入特定工具
```typescript
import { unifiedSearchTool, semanticSearchTool } from './tools/search/index.js';
```

### 导入所有工具
```typescript
import * as Tools from './tools/index.js';
```

## 注意事项

1. **向后兼容性**：所有现有的导入路径需要更新
2. **类型定义**：共享的类型定义位于 `src/types.ts`
3. **基础类**：所有工具继承自 `src/shared/base-tool.ts`
4. **错误处理**：使用 `src/shared/error-handler.ts` 进行统一错误处理

## 下一步计划

1. 更新所有导入引用
2. 添加工具单元测试
3. 完善工具文档
4. 实现工具性能监控