# PromptHub 文档中心

欢迎来到PromptHub文档中心！这里包含了部署、开发、使用和维护系统所需的所有文档。

## 📋 文档目录

### 🚀 部署与配置
- **[Docker部署指南](docker-deployment.md)** - 完整的Docker容器化部署方案
- **[安全配置指南](security-guide.md)** - 系统安全设置和最佳实践
- **[安全级别配置指南](security-levels-config-guide.md)** - 环境变量安全配置

### 🛠️ 开发指南
- **[开发者指南](developer-guide.md)** - 完整的开发环境搭建和API说明
- **[数据库结构文档](database-structure.md)** - 数据库设计和表结构说明

### 🔐 安全文档
- **[权限管理文档](permission-management.md)** - 用户权限体系和管理方案
- **[安全审计修复](security-audit-fixes.md)** - 安全审计和修复记录
- **[安全实现文档](security-implementation.md)** - 安全功能实现细节
- **[安全使用指南](security-usage-guide.md)** - 安全功能使用说明

### 🔌 MCP集成
- **[MCP使用指南](mcp-usage-guide.md)** - Model Context Protocol完整使用指南
- **[MCP技术文档](mcp/)** - MCP服务技术实现文档

## 🎯 快速导航

### 新用户指南
1. 首先阅读 [Docker部署指南](docker-deployment.md) 了解如何部署系统
2. 然后查看 [安全配置指南](security-guide.md) 确保系统安全
3. 如需开发，请参考 [开发者指南](developer-guide.md)

### MCP用户指南
如果您想使用MCP功能连接第三方AI客户端，请直接查看 [MCP使用指南](mcp-usage-guide.md)。

### 系统管理员
- [权限管理文档](permission-management.md) - 用户权限配置
- [数据库结构文档](database-structure.md) - 数据库维护
- [安全配置指南](security-guide.md) - 安全维护

## 📁 文档结构

```
docs/
├── README.md                           # 本文档
├── docker-deployment.md               # Docker部署指南
├── developer-guide.md                 # 开发者指南
├── database-structure.md              # 数据库结构
├── security-guide.md                  # 安全配置指南
├── security-levels-config-guide.md    # 安全级别配置指南
├── permission-management.md           # 权限管理
├── security-audit-fixes.md            # 安全审计修复
├── security-implementation.md         # 安全实现
├── security-usage-guide.md            # 安全使用指南
├── mcp-usage-guide.md                 # MCP使用指南
└── mcp/                               # MCP技术文档
    ├── README.md                      # MCP文档导航
    ├── API_MIGRATION_REPORT.md        # API迁移报告
    ├── IMPLEMENTATION_REPORT.md       # 实现报告
    ├── REFACTOR_SUMMARY.md            # 重构总结
    ├── SEARCH_ENGINE_DEPLOYMENT.md    # 搜索引擎部署
    ├── SEARCH_INTEGRATION_GUIDE.md    # 搜索集成指南
    ├── SEARCH_INTEGRATION_SUMMARY.md  # 搜索集成总结
    ├── TOOL_MIGRATION_PROGRESS.md     # 工具迁移进度
    └── UNIFIED_SEARCH_COMPLETED.md    # 统一搜索完成
```

## 📝 文档维护

本文档集合包含了系统的核心功能说明和技术实现文档。所有修复类和临时性文档已被清理，保留了有价值的技术文档供参考。

## 🔄 最后更新

- 文档版本: 1.0
- 最后更新: 2025年1月
- 维护状态: 活跃维护 