# PromptHub 文档中心

欢迎来到PromptHub文档中心！这里包含了部署、开发、使用和维护系统所需的所有文档。

## 📋 文档目录

### 🚀 安装配置
- **[NPM快速开始](setup/npm-quick-start.md)** - 通过NPM快速安装和使用MCP适配器
- **[NPM包说明](setup/npm-package.md)** - NPM包详细说明和配置选项
- **[MCP设置指南](setup/mcp-setup.md)** - MCP适配器详细配置指南

### 🏗️ 部署运维
- **[Docker部署指南](deployment/docker-deployment.md)** - 完整的Docker容器化部署方案

### 🛠️ 开发指南
- **[开发者指南](development/developer-guide.md)** - 完整的开发环境搭建和API说明
- **[数据库结构文档](development/database-structure.md)** - 数据库设计和表结构说明

### 🔐 安全文档
- **[安全配置指南](security/security-guide.md)** - 系统安全设置和最佳实践
- **[安全级别配置指南](security/security-levels-config-guide.md)** - 环境变量安全配置
- **[权限管理文档](security/permission-management.md)** - 用户权限体系和管理方案
- **[安全审计修复](security/security-audit-fixes.md)** - 安全审计和修复记录
- **[安全实现文档](security/security-implementation.md)** - 安全功能实现细节
- **[安全使用指南](security/security-usage-guide.md)** - 安全功能使用说明
- **[Supabase安全配置](security/supabase-security-config.md)** - Supabase数据库安全配置

### 🔌 MCP集成
- **[MCP零配置示例](mcp/mcp-zero-config-examples.md)** - 🏆 **一键复制**: 各种AI客户端的零配置示例
- **[MCP通用配置指南](mcp/mcp-universal-config.md)** - 🚀 完整指南: 自动下载和配置说明
- **[MCP简化配置指南](mcp/mcp-simple-config.md)** - 🔧 备选方案: HTTP API调用方式
- **[MCP使用指南](mcp/mcp-usage-guide.md)** - 📚 完整文档: Model Context Protocol详细说明
- **[搜索集成指南](mcp/SEARCH_INTEGRATION_GUIDE.md)** - 搜索功能集成说明
- **[统一搜索指南](mcp/UNIFIED_SEARCH_GUIDE.md)** - 统一搜索功能使用指南
- **[统一存储指南](mcp/UNIFIED_STORE_GUIDE.md)** - 统一存储功能使用指南
- **[MCP技术文档](mcp/)** - 🛠️ 技术实现: MCP服务技术文档

## 🎯 快速导航

### 新用户指南
1. **快速开始**: [NPM快速开始](setup/npm-quick-start.md) - 最快的安装和使用方式
2. **系统部署**: [Docker部署指南](deployment/docker-deployment.md) - 了解如何部署系统
3. **安全配置**: [安全配置指南](security/security-guide.md) - 确保系统安全
4. **开发环境**: [开发者指南](development/developer-guide.md) - 如需开发请参考

### MCP用户指南
如果您想使用MCP功能连接第三方AI客户端，推荐按以下顺序：
1. **🏆 一键配置**: [MCP零配置示例](mcp/mcp-zero-config-examples.md) - 复制粘贴即可使用
2. **🚀 详细指南**: [MCP通用配置指南](mcp/mcp-universal-config.md) - 完整的配置说明
3. **🔧 备选方案**: [MCP简化配置指南](mcp/mcp-simple-config.md) - HTTP API调用方式
4. **📚 完整文档**: [MCP使用指南](mcp/mcp-usage-guide.md) - 传统MCP协议配置

### 系统管理员
- [权限管理文档](security/permission-management.md) - 用户权限配置
- [数据库结构文档](development/database-structure.md) - 数据库维护
- [安全配置指南](security/security-guide.md) - 安全维护

## 📁 文档结构

```
docs/
├── README.md                           # 本文档
├── setup/                              # 安装配置
│   ├── npm-quick-start.md             # NPM快速开始
│   ├── npm-package.md                 # NPM包说明
│   └── mcp-setup.md                   # MCP设置指南
├── deployment/                         # 部署运维
│   └── docker-deployment.md           # Docker部署指南
├── development/                        # 开发指南
│   ├── developer-guide.md             # 开发者指南
│   └── database-structure.md          # 数据库结构
├── security/                           # 安全文档
│   ├── security-guide.md              # 安全配置指南
│   ├── security-levels-config-guide.md # 安全级别配置指南
│   ├── permission-management.md       # 权限管理
│   ├── security-audit-fixes.md        # 安全审计修复
│   ├── security-implementation.md     # 安全实现
│   ├── security-usage-guide.md        # 安全使用指南
│   └── supabase-security-config.md    # Supabase安全配置
└── mcp/                               # MCP集成
    ├── README.md                      # MCP文档导航
    ├── mcp-zero-config-examples.md    # MCP零配置示例
    ├── mcp-universal-config.md        # MCP通用配置指南
    ├── mcp-simple-config.md           # MCP简化配置指南
    ├── mcp-usage-guide.md             # MCP使用指南
    ├── SEARCH_INTEGRATION_GUIDE.md    # 搜索集成指南
    ├── UNIFIED_SEARCH_GUIDE.md        # 统一搜索指南
    └── UNIFIED_STORE_GUIDE.md         # 统一存储指南
```

## 📝 文档维护

本文档集合包含了系统的核心功能说明和技术实现文档。所有修复类和临时性文档已被清理，保留了有价值的技术文档供参考。

## 🔄 最后更新

- 文档版本: 1.0
- 最后更新: 2025年1月
- 维护状态: 活跃维护 