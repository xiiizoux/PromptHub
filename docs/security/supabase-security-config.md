# Supabase 安全配置指南

## 概述

本文档说明如何修复 Supabase 安全警告，确保数据库达到企业级安全标准。

## 安全警告修复

### 1. Function Search Path Mutable (已自动修复)

**问题**: 数据库函数缺少安全的 search_path 设置，可能导致 SQL 注入攻击。

**修复状态**: ✅ 已通过 Migration 013 自动修复

**修复内容**:
- `increment_usage_count` 函数
- `increment_template_usage` 函数  
- `update_template_rating` 函数
- `handle_new_user` 函数
- `update_updated_at_column` 函数

所有函数现在都包含：
```sql
SECURITY DEFINER
SET search_path = public
```

### 2. Auth OTP Long Expiry (需手动配置)

**问题**: OTP (一次性密码) 过期时间过长，存在安全风险。

**修复步骤**:
1. 登录 Supabase 控制台
2. 进入项目设置
3. 导航到 `Authentication` > `Settings`
4. 找到 `OTP expiry` 设置
5. 将值设置为 `300` (5分钟)
6. 点击保存

**推荐设置**: 300 秒 (5分钟)

### 3. Leaked Password Protection Disabled (需手动配置)

**问题**: 密码泄露保护功能未启用，无法检测已泄露的密码。

**修复步骤**:
1. 登录 Supabase 控制台
2. 进入项目设置
3. 导航到 `Authentication` > `Settings`
4. 找到 `Enable password leak protection` 选项
5. 启用该选项
6. 点击保存

**功能说明**: 启用后，系统会检查用户密码是否在已知的数据泄露事件中出现过。

## 验证修复结果

### 数据库函数验证

运行以下 SQL 查询验证函数安全设置：

```sql
SELECT 
    p.proname as function_name,
    CASE WHEN 'public' = ANY(p.proconfig) THEN '✅ 安全' ELSE '❌ 不安全' END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'increment_usage_count', 
    'increment_template_usage', 
    'update_template_rating',
    'handle_new_user',
    'update_updated_at_column'
);
```

### 控制台验证

1. 在 Supabase 控制台查看 Security Advisor
2. 确认警告数量减少：
   - 错误数量：应为 0
   - 警告数量：应减少 3 个
   - 信息数量：保持不变

## 安全最佳实践

### 函数安全

1. **始终使用 SECURITY DEFINER**: 确保函数以定义者权限运行
2. **设置 search_path**: 防止 SQL 注入攻击
3. **最小权限原则**: 只授予必要的权限

### 认证安全

1. **短 OTP 过期时间**: 减少令牌被滥用的风险
2. **密码泄露保护**: 防止使用已泄露的密码
3. **强密码策略**: 要求复杂密码

### 数据库安全

1. **行级安全 (RLS)**: 已启用，确保数据隔离
2. **API 密钥管理**: 定期轮换密钥
3. **审计日志**: 监控数据库操作

## 监控和维护

### 定期检查

1. **每月检查**: 查看 Security Advisor 报告
2. **季度审计**: 审查用户权限和访问模式
3. **年度评估**: 全面安全评估

### 警报设置

建议设置以下监控警报：
- 异常登录活动
- 大量数据访问
- 权限变更
- 函数执行异常

## 故障排除

### 常见问题

**Q: 函数修复后仍显示警告**
A: 等待几分钟让 Supabase 刷新安全检查，或手动刷新 Security Advisor 页面。

**Q: Auth 设置找不到**
A: 确保您有项目管理员权限，某些设置只对管理员可见。

**Q: 修复后功能异常**
A: 检查应用程序日志，确认函数调用方式没有变化。

### 联系支持

如果遇到问题：
1. 检查 Supabase 文档
2. 查看社区论坛
3. 联系 Supabase 支持团队

## 总结

通过执行 Migration 013 和手动配置 Auth 设置，您的 Supabase 项目将达到企业级安全标准：

- ✅ 函数安全加固
- ⚠️ OTP 过期时间配置 (需手动)
- ⚠️ 密码泄露保护 (需手动)

完成所有配置后，Security Advisor 应显示 0 个错误和显著减少的警告数量。
