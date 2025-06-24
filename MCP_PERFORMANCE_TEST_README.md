# MCP服务器性能追踪测试

## 概述

这些测试脚本用于验证MCP服务器的性能追踪功能是否正常工作，确保每次搜索操作都能正确记录到数据库中。

## 问题背景

之前发现的问题：
- `prompt_usage`表有大量数据，但`prompt_id`全部为空
- `prompt_performance`表也有大量数据，但`prompt_id`全部为空
- Web服务性能分析页面统计字数显示为1

## 修复内容

1. **修复了MCP路由器中缺失的函数**：
   - `smart_semantic_search`现在使用`handleUnifiedSearch`
   - `enhanced_search_prompts`现在使用`handleUnifiedSearch`

2. **改进了性能追踪逻辑**：
   - 搜索操作正确设置`prompt_id`为`null`
   - 添加了`client_metadata.search_operation = true`标记
   - 修复了数据库触发器，不为搜索操作创建无效的性能记录

3. **增强了统一搜索工具**：
   - 添加了`SearchPerformanceMonitor`
   - 每次搜索都会记录性能数据

## 测试文件

### 1. `test_mcp_performance.sh` (推荐)
Bash脚本，使用curl命令测试MCP服务器。

**依赖**：
- `curl`
- `jq`

**使用方法**：
```bash
# 给脚本添加执行权限
chmod +x test_mcp_performance.sh

# 运行测试
./test_mcp_performance.sh
```

### 2. `test_mcp_performance.js`
Node.js脚本，提供更详细的测试功能。

**依赖**：
- Node.js
- `node-fetch` (需要安装: `npm install node-fetch`)

**使用方法**：
```bash
# 安装依赖
npm install node-fetch

# 运行测试
node test_mcp_performance.js
```

## 测试内容

测试脚本会执行以下操作：

1. **测试三个搜索工具**：
   - `unified_search`: 统一搜索
   - `smart_semantic_search`: 智能语义搜索
   - `enhanced_search_prompts`: 增强搜索

2. **验证性能记录**：
   - 检查数据库中是否正确记录了搜索操作
   - 验证搜索统计API是否正常工作

3. **生成测试报告**：
   - 显示成功率和响应时间
   - 对比实际调用次数和数据库记录数

## 预期结果

如果性能追踪正常工作，应该看到：

```
✅ 工具调用成功
   响应时间: 150ms
   HTTP状态: 200
   内容预览: 📧 找到5个邮件相关的提示词...

📊 检查数据库中的性能记录...
✅ 搜索统计获取成功
   总搜索次数: 3
   平均响应时间: 145ms
   工具统计:
     - unified_search: 1次, 平均150ms
     - smart_semantic_search: 1次, 平均140ms
     - enhanced_search_prompts: 1次, 平均145ms

📋 测试报告:
总测试数: 3
成功数: 3
失败数: 0
成功率: 100%
✅ 数据库性能统计获取成功
✅ 性能追踪系统正常工作
```

## 故障排除

### 1. 连接失败
```
❌ 工具调用失败
   HTTP状态: 000
```
**解决方案**：检查MCP服务器是否在运行，端口是否正确。

### 2. 认证失败
```
❌ 工具调用失败
   HTTP状态: 401
```
**解决方案**：检查API密钥是否正确。

### 3. 数据库记录缺失
```
⚠️ 性能追踪可能有问题 - 数据库记录数少于成功的搜索数
```
**解决方案**：
1. 检查数据库连接
2. 确认触发器是否正确更新
3. 查看MCP服务器日志

## 数据库修复

如果发现性能数据有问题，可以执行以下SQL脚本：

```sql
-- 应用性能数据修复
\i apply_performance_fix.sql
```

这个脚本会：
1. 删除无效的性能记录
2. 更新触发器函数
3. 重新计算现有的性能统计

## 配置

测试脚本中的配置可以根据需要修改：

```bash
# MCP服务器地址
MCP_SERVER_URL="http://localhost:9010"

# API密钥
API_KEY="your_api_key_here"
```

## 监控建议

建议定期运行这些测试来确保性能追踪系统持续正常工作：

1. **开发环境**：每次代码更改后运行
2. **测试环境**：每日自动运行
3. **生产环境**：每周运行一次

## 相关文件

- `apply_performance_fix.sql`: 数据库修复脚本
- `web/src/pages/api/performance/search-stats.ts`: 搜索统计API
- `web/src/components/SearchOperationStats.tsx`: 搜索统计前端组件
- `mcp/src/tools/search/unified-search.ts`: 统一搜索工具（已添加性能监控）
