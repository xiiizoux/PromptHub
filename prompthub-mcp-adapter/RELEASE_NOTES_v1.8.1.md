# PromptHub MCP Adapter v1.8.1 发布说明

## 🎯 重要修复版本 - 存储功能修复

### 问题背景
v1.8.0及之前版本存在数据库外键约束配置错误，导致存储功能失败：
- 错误信息：`insert or update on table "prompts" violates foreign key constraint "prompts_user_id_fkey"`
- 搜索功能正常，但无法创建新的提示词
- 用户验证通过但数据库插入失败

### 🛠️ 核心修复

#### 1. 数据库外键约束修复
- **问题**：prompts表的user_id外键约束错误指向不存在的auth.users表
- **解决**：提供数据库修复脚本修正外键约束指向正确的users表
- **影响**：彻底解决存储功能失败问题

#### 2. 用户验证逻辑增强
- **新增**：`validateUserExists()`方法进行插入前用户验证
- **优化**：详细的调试日志帮助快速定位问题
- **改进**：移除过时的系统用户回退逻辑

#### 3. 权限管理简化
- **清理**：移除对'system-user'的特殊处理
- **统一**：简化权限验证逻辑
- **稳定**：减少复杂度提高系统稳定性

### 🔧 技术改进

```javascript
// 新增用户验证方法
private async validateUserExists(userId: string): Promise<void> {
  const user = await this.getUser(userId);
  if (!user) {
    throw new Error(`用户验证失败: 用户ID ${userId} 在数据库中不存在`);
  }
}

// 在createPrompt中使用
await this.validateUserExists(finalUserId);
```

### 📦 部署步骤

#### 1. 更新MCP服务器代码
```bash
# 更新到最新代码
git pull origin main

# 重启MCP服务器
npm run build
npm start
```

#### 2. 执行数据库修复（重要）
```sql
-- 执行修复脚本
psql your_database < scripts/fix_foreign_key_constraints.sql
```

#### 3. 验证修复结果
- 搜索功能：应保持正常
- 存储功能：应立即恢复
- 无需重新配置API密钥

### 🎯 预期效果

#### 修复前
```json
{
  "error": {
    "message": "智能存储失败: insert or update on table \"prompts\" violates foreign key constraint \"prompts_user_id_fkey\""
  }
}
```

#### 修复后
```json
{
  "schema_version": "v1",
  "data": {
    "success": true,
    "prompt": {
      "id": "uuid-here",
      "name": "提示词标题",
      "user_id": "530d5152-bf3e-4bc4-9d78-106a065fa826"
    }
  }
}
```

### ⚠️ 注意事项

1. **必须执行数据库修复脚本**：仅更新代码不足以解决问题
2. **无破坏性更改**：现有数据和配置完全兼容
3. **向下兼容**：API接口保持不变
4. **生产环境**：建议在维护窗口期间部署

### 🧪 测试验证

部署后可通过以下方式验证：

```bash
# 测试存储功能
curl -X POST https://mcp.prompt-hub.cc/tools/unified_store/invoke \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "测试提示词", "title": "测试标题"}'

# 测试搜索功能  
curl -X POST https://mcp.prompt-hub.cc/tools/unified_search/invoke \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "测试"}'
```

### 📞 支持

如果在部署过程中遇到问题：
1. 检查数据库修复脚本是否成功执行
2. 确认MCP服务器已重启
3. 验证API密钥仍然有效
4. 查看服务器日志获取详细错误信息

---

**发布时间**: 2025-01-19  
**影响范围**: 存储功能修复，搜索功能不受影响  
**紧急程度**: 高（修复关键功能）  
**兼容性**: 完全向下兼容