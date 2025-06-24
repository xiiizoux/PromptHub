# 友好安全增强使用指南 🛡️

> 本指南将帮助您在保持现有密钥和用户体验的前提下，逐步增强项目的安全性。

## 🎯 设计理念

**安全性与友好性并重**
- ✅ 保留您的现有生产密钥
- ✅ 不强制立即更改任何配置
- ✅ 提供友好的提醒和建议
- ✅ 确保向后兼容性
- ✅ 支持渐进式安全增强

## 🚀 快速开始

### 1. 配置安全级别

在 `.env` 文件中设置安全级别：

```bash
# 宽松模式 - 最大兼容性，基础安全
SECURITY_LEVEL=loose

# 平衡模式 - 推荐设置，安全与易用性的平衡
SECURITY_LEVEL=balanced

# 严格模式 - 最高安全性
SECURITY_LEVEL=strict
```

### 2. 应用安全配置

参考 [安全实施方案](security-implementation.md) 中的配置代码，将安全中间件集成到您的应用中。

## 📋 安全级别对比

| 功能 | 宽松模式 | 平衡模式 | 严格模式 |
|------|----------|----------|----------|
| 速率限制 | 禁用 | 启用(宽松) | 启用(严格) |
| CORS策略 | 宽松 | 智能 | 严格 |
| 文件上传 | 100MB | 50MB | 10MB |
| 密钥轮换提醒 | 365天 | 180天 | 90天 |
| 日志级别 | 警告 | 信息 | 调试 |
| 兼容性 | 最高 | 高 | 中等 |

## 🔧 功能详解

### 密钥管理（不强制更改）

```typescript
// 密钥强度检查和提醒
export const validateKeyStrength = (key: string): boolean => {
  return key.length >= 32 && /^[a-f0-9]+$/i.test(key);
};

export const scheduleKeyRotation = (keyName: string, interval: number) => {
  // 定期提醒密钥轮换
  setInterval(() => {
    console.warn(`⚠️  建议轮换密钥: ${keyName}`);
  }, interval);
};
```

**特点：**
- 🔐 不会修改您的现有密钥
- 📊 提供密钥强度评估
- ⏰ 基于时间的轮换建议
- 🎯 生成新密钥的建议（可选使用）

### 速率限制（可配置）

```typescript
// 自动根据安全级别调整限制
const rateLimits = {
  loose: { auth: 20, api: 500 },
  balanced: { auth: 10, api: 200 },
  strict: { auth: 5, api: 100 }
};
```

**内网IP自动豁免：**
- 127.0.0.1 (localhost)
- 192.168.x.x (局域网)
- 10.x.x.x (内网)

### CORS配置（智能适应）

```typescript
// 开发环境：允许所有来源
// 生产环境：智能CORS策略
const corsConfig = {
  // 宽松模式：记录但不阻止未注册域名
  // 严格模式：只允许白名单域名
  strictMode: process.env.CORS_STRICT_MODE === 'true'
};
```

### 文件上传（灵活限制）

```typescript
// 支持常见文件类型
const allowedTypes = [
  'image/*',     // 图片文件
  'application/pdf',  // PDF文档
  'text/plain',  // 文本文件
  'application/json', // JSON文件
  'video/*',     // 视频文件
  'audio/*'      // 音频文件
];
```

## 🔨 集成方式

### 在Express应用中使用

```typescript
import express from 'express';
import { securityMiddleware } from './middleware/security';

const app = express();

// 应用安全中间件
app.use(securityMiddleware);

// 启动应用
app.listen(3000, () => {
  console.log('应用已启动，安全功能已激活 🛡️');
});
```

### 在Next.js中使用

```typescript
// pages/api/config.ts
export default function handler(req, res) {
  const securityLevel = process.env.SECURITY_LEVEL || 'balanced';
  res.json({ securityLevel });
}
```

## 📊 监控和提醒

### 密钥状态检查

```bash
# 检查密钥状态的示例脚本
#!/bin/bash

check_key_strength() {
    local key_name=$1
    local key_value=$2
    
    if [ ${#key_value} -lt 32 ]; then
        echo "⚠️  $key_name: 密钥强度较弱（长度 < 32）"
    else
        echo "✅ $key_name: 密钥强度良好"
    fi
}

# 检查 .env 文件中的密钥
if [ -f ".env" ]; then
    source .env
    check_key_strength "JWT_SECRET" "$JWT_SECRET"
    check_key_strength "API_KEY" "$API_KEY"
fi
```

### 启动时的友好提醒

```
=== 密钥安全提醒 ===
⚠️ 密钥安全提醒
   检测到一些密钥强度较弱，建议增强以提高安全性
   建议行动：可在系统空闲时更新这些密钥，不会影响当前服务

ℹ️ 密钥轮换建议
   以下密钥建议定期轮换：JWT_SECRET
   建议行动：建议在维护窗口期间更新这些密钥
===================
```

## 🔄 渐进式升级路径

### 第一阶段：基础安全（即时生效）
- ✅ 启用基础安全头
- ✅ 添加输入验证
- ✅ 配置友好的错误处理

### 第二阶段：中级安全（1-2周内）
- ✅ 配置速率限制
- ✅ 增强CORS策略
- ✅ 实施文件上传限制

### 第三阶段：高级安全（按需实施）
- ✅ 密钥轮换策略
- ✅ 高级监控和日志
- ✅ 安全审计集成

## 🛠️ 故障排除

### 常见问题

**Q: 速率限制太严格，影响正常使用怎么办？**
A: 在 `.env` 文件中设置：
```bash
SECURITY_LEVEL=loose
# 或者
RATE_LIMIT_ENABLED=false
```

**Q: CORS阻止了合法的请求？**
A: 设置允许的源域名：
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

**Q: 如何完全禁用某个安全功能？**
A: 每个功能都可以通过环境变量单独控制：
```bash
RATE_LIMIT_ENABLED=false
CORS_STRICT_MODE=false
KEY_CHECK_ON_STARTUP=false
```

### 恢复默认设置

如果需要恢复到默认配置：

```bash
# 删除或重命名当前配置
mv .env .env.backup

# 复制示例配置
cp .env.example .env

# 重启应用
npm restart
```

## 🎯 最佳实践建议

1. **从平衡模式开始**：推荐使用 `SECURITY_LEVEL=balanced`
2. **监控应用行为**：观察安全功能对应用的影响
3. **渐进式调整**：根据需要逐步增强或放宽安全策略
4. **定期检查**：建立定期的安全检查流程
5. **文档更新**：保持安全配置文档的更新

## 🔗 相关文档

- [安全配置指南](security-guide.md)
- [安全实施方案](security-implementation.md)
- [安全审计报告](security-audit-fixes.md)

---

**提醒**：安全配置应该根据您的具体使用场景和风险评估来调整。如有疑问，建议咨询安全专家。 