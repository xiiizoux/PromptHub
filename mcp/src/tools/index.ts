/**
 * MCP工具模块总索引
 * 导出所有工具分类模块
 */

// 搜索工具
export * as SearchTools from './search/index.js';

// 存储工具
export * as StorageTools from './storage/index.js';

// 推荐工具
export * as RecommendationTools from './recommendations/index.js';

// 优化工具
export * as OptimizationTools from './optimization/index.js';

// 配置工具
export * as ConfigTools from './config/index.js';

// 用户界面工具
export * as UITools from './ui/index.js';

// 便捷的单独导入
export * from './search/index.js';
export * from './storage/index.js';
export * from './recommendations/index.js';
export * from './optimization/index.js';
export * from './config/index.js';
export * from './ui/index.js';