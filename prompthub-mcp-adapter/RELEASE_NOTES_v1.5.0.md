# PromptHub MCP Adapter v1.5.0 发布说明

## 🎉 新版本发布 - v1.5.0

**发布日期**: 2024年12月23日  
**包文件**: `prompthub-mcp-adapter-1.5.0.tgz`  
**包大小**: 8.6 kB  

---

## 🚀 主要更新

### 性能跟踪系统完善
- ✅ **完全修复**了智能语义搜索的使用统计问题
- ✅ **解决**了UUID类型错误导致的数据库插入失败
- ✅ **修复**了Supabase RLS策略阻止数据记录的问题
- ✅ **实现**了完整的搜索操作性能监控

### 技术架构优化
- 🔧 使用服务密钥绕过认证限制，确保数据正常写入
- 🔧 为搜索操作创建专门的性能跟踪逻辑
- 🔧 优化错误处理和异常监控
- 🔧 完善日志记录和调试信息

### 数据分析能力
- 📊 实时监控搜索操作性能指标
- 📊 支持按工具类型、时间范围等维度分析
- 📊 完整的使用统计和趋势分析
- 📊 Token消耗和延迟监控

---

## 📦 安装使用

### NPM安装
```bash
npm install -g prompthub-mcp@1.5.0
```

### 或直接使用
```bash
npx prompthub-mcp@1.5.0
```

### Cursor/Claude Desktop配置
```json
{
  "prompthub": {
    "command": "npx",
    "args": ["-y", "prompthub-mcp@1.5.0"],
    "env": {
      "API_KEY": "your-api-key-here",
      "MCP_SERVER_URL": "https://mcp.prompt-hub.cc"
    }
  }
}
```

---

## 🔄 从旧版本升级

如果您已经在使用旧版本，请：

1. **更新配置**中的版本号到 `@1.5.0`
2. **重启**您的AI客户端(Cursor/Claude Desktop)
3. **验证**新功能是否正常工作

---

## 📈 性能改进对比

| 指标 | v1.4.0 | v1.5.0 | 改进 |
|------|--------|--------|------|
| 搜索统计记录 | ❌ 失败 | ✅ 正常 | 100%修复 |
| 数据库写入 | ⚠️ 部分失败 | ✅ 完全成功 | RLS绕过 |
| 错误处理 | 基础 | 完善 | 详细日志 |
| 性能监控 | 有限 | 完整 | 多维度分析 |

---

## 🔧 技术细节

### 修复的问题
1. **UUID类型错误**: 搜索操作现在使用NULL而非字符串ID
2. **RLS策略限制**: 使用服务密钥绕过行级安全策略
3. **性能跟踪缺失**: 完整的搜索操作使用记录

### 数据结构
搜索操作现在在`prompt_usage`表中正确记录：
```sql
{
  prompt_id: NULL,              -- 标识为搜索操作
  latency_ms: 2148,            -- 实际执行时间
  client_metadata: {
    "toolName": "smart_semantic_search",
    "search_operation": true,
    "source": "mcp_server"
  }
}
```

---

## 🎯 验证安装

运行以下命令验证安装：
```bash
# 检查版本
prompthub-mcp --version

# 测试连接
prompthub-mcp --test-connection
```

---

## 🆘 技术支持

如有问题，请联系：
- **GitHub Issues**: https://github.com/xiiizoux/PromptHub/issues
- **官方网站**: https://prompt-hub.cc
- **文档**: https://docs.prompt-hub.cc

---

**感谢您使用 PromptHub MCP Adapter!** 🚀