# 🛡️ PromptHub 安全级别配置指南

本文件提供三种安全级别的完整配置选项，您可以根据需要选择合适的安全级别，或自定义配置。

## 📋 安全级别对比

| 功能 | 宽松模式 | 平衡模式 | 严格模式 |
|------|----------|----------|----------|
| 速率限制 | 禁用 | 合理限制 | 严格限制 |
| CORS策略 | 允许所有 | 智能检测 | 白名单制 |
| 文件上传 | 100MB | 50MB | 10MB |
| 内网IP豁免 | ✅ | ✅ | ❌ |
| 密钥轮换提醒 | 365天 | 180天 | 90天 |
| 用户体验 | 最佳 | 良好 | 可接受 |
| 安全性 | 基础 | 推荐 | 最高 |

## 🎯 核心安全级别设置

### 安全级别选择 (必选其一)
- `loose` - 宽松模式：最大兼容性，基础安全保护
- `balanced` - 平衡模式：推荐设置，安全与易用性平衡 ⭐
- `strict` - 严格模式：最高安全性，适合敏感环境

```env
SECURITY_LEVEL=balanced
```

## 🚦 速率限制配置

### 是否启用速率限制
- 宽松模式: `false` | 平衡模式: `true` | 严格模式: `true`

```env
RATE_LIMIT_ENABLED=true
```

### 认证相关接口速率限制 (每15分钟最大尝试次数)
- 宽松模式: `20` | 平衡模式: `10` | 严格模式: `5`

```env
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW=900000  # 15分钟 (毫秒)
```

### API接口速率限制 (每分钟最大请求次数)
- 宽松模式: `500` | 平衡模式: `200` | 严格模式: `100`

```env
API_RATE_LIMIT_MAX=200
API_RATE_LIMIT_WINDOW=60000    # 1分钟 (毫秒)
```

### 文件上传速率限制 (每分钟最大上传次数)
- 宽松模式: `50` | 平衡模式: `20` | 严格模式: `10`

```env
UPLOAD_RATE_LIMIT_MAX=20
UPLOAD_RATE_LIMIT_WINDOW=60000 # 1分钟 (毫秒)
```

### 是否跳过内网IP的速率限制 (127.0.0.1, 192.168.x.x, 10.x.x.x)
- 宽松模式: `true` | 平衡模式: `true` | 严格模式: `false`

```env
RATE_LIMIT_SKIP_INTERNAL_IPS=true
```

## 🌐 CORS (跨域资源共享) 配置

### CORS严格模式
- `false` - 宽松模式：记录但不阻止未注册域名
- `true` - 严格模式：只允许白名单域名
- 宽松模式: `false` | 平衡模式: `false` | 严格模式: `true`

```env
CORS_STRICT_MODE=false
```

### 允许的源域名 (逗号分隔，严格模式下必须配置)

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:9011,https://yourdomain.com
```

### 是否允许携带凭证 (cookies, authorization headers)

```env
CORS_ALLOW_CREDENTIALS=true
```

### CORS预检请求缓存时间 (秒)
- 宽松模式: `86400` | 平衡模式: `86400` | 严格模式: `3600`

```env
CORS_MAX_AGE=86400
```

## 📁 文件上传安全配置

### 文件上传最大大小 (字节)
- 宽松模式: `104857600` (100MB) | 平衡模式: `52428800` (50MB) | 严格模式: `10485760` (10MB)

```env
FILE_UPLOAD_MAX_SIZE=52428800
```

### 允许的文件类型 (逗号分隔，* 表示允许所有类型但会记录警告)
- 宽松模式: `*` | 平衡模式: 常见类型 | 严格模式: 限制类型

```env
FILE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,text/plain,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed,video/mp4,video/webm,audio/mpeg,audio/wav
```

### 是否启用严格的文件名检查
- 宽松模式: `false` | 平衡模式: `false` | 严格模式: `true`

```env
FILE_UPLOAD_STRICT_NAMING=false
```

## 🔑 密钥管理配置

### 是否在应用启动时检查密钥状态
- 宽松模式: `false` | 平衡模式: `true` | 严格模式: `true`

```env
KEY_CHECK_ON_STARTUP=true
```

### 密钥轮换警告天数 (超过此天数会显示轮换建议)
- 宽松模式: `180` | 平衡模式: `90` | 严格模式: `30`

```env
KEY_ROTATION_WARNING_DAYS=90
```

### 密钥轮换要求天数 (超过此天数会显示强烈建议)
- 宽松模式: `365` | 平衡模式: `180` | 严格模式: `90`

```env
KEY_ROTATION_REQUIRED_DAYS=180
```

### 是否强制密钥轮换 (建议设为false，通过提醒方式处理)

```env
KEY_FORCE_ROTATION=false
```

## 📊 安全日志配置

### 安全日志级别
- `error` - 仅记录错误 | `warn` - 记录警告和错误 | `info` - 记录信息、警告和错误 | `debug` - 记录所有
- 宽松模式: `warn` | 平衡模式: `info` | 严格模式: `debug`

```env
SECURITY_LOG_LEVEL=info
```

### 是否记录安全事件
- 宽松模式: `false` | 平衡模式: `true` | 严格模式: `true`

```env
SECURITY_EVENTS_LOGGING=true
```

### 是否在错误响应中包含详细信息 (生产环境建议false)
- 宽松模式: `true` | 平衡模式: `false` | 严格模式: `false`

```env
SECURITY_DETAILED_ERRORS=false
```

### 日志文件最大大小 (字节)

```env
SECURITY_LOG_MAX_SIZE=10485760  # 10MB
```

### 保留的日志文件数量

```env
SECURITY_LOG_MAX_FILES=5
```

## 🔒 输入验证配置

### 是否启用严格的输入验证模式
- 宽松模式: `false` | 平衡模式: `false` | 严格模式: `true`

```env
INPUT_VALIDATION_STRICT_MODE=false
```

### 是否自动清理输入数据

```env
INPUT_VALIDATION_SANITIZE=true
```

### 是否允许HTML内容
- 宽松模式: `true` | 平衡模式: `false` | 严格模式: `false`

```env
INPUT_VALIDATION_ALLOW_HTML=false
```

## 🛡️ 安全头配置

### 是否启用严格的安全头
- 宽松模式: `false` | 平衡模式: `false` | 严格模式: `true`

```env
SECURITY_HEADERS_STRICT_MODE=false
```

### 内容安全策略 (CSP) 模式
- `disabled` - 禁用CSP | `basic` - 基础CSP | `strict` - 严格CSP
- 宽松模式: `disabled` | 平衡模式: `basic` | 严格模式: `strict`

```env
CONTENT_SECURITY_POLICY_MODE=basic
```

### HSTS (HTTP严格传输安全) 最大年龄 (秒，0表示禁用)
- 宽松模式: `0` | 平衡模式: `31536000` | 严格模式: `31536000`

```env
HSTS_MAX_AGE=31536000
```

## 🔍 异常检测配置

### 是否启用异常检测
- 宽松模式: `false` | 平衡模式: `true` | 严格模式: `true`

```env
ANOMALY_DETECTION_ENABLED=true
```

### 异常检测敏感度 (low|medium|high)
- 宽松模式: `low` | 平衡模式: `medium` | 严格模式: `high`

```env
ANOMALY_DETECTION_SENSITIVITY=medium
```

### 可疑活动阈值 (每小时)
- 宽松模式: `1000` | 平衡模式: `500` | 严格模式: `100`

```env
SUSPICIOUS_ACTIVITY_THRESHOLD=500
```

## 📧 安全通知配置

### 是否启用安全事件邮件通知

```env
SECURITY_EMAIL_NOTIFICATIONS=false
```

### 安全事件通知邮箱

```env
SECURITY_NOTIFICATION_EMAIL=admin@yourdomain.com
```

### 通知级别 (error|warning|info)

```env
SECURITY_NOTIFICATION_LEVEL=warning
```

## 🎛️ 快速配置模板

如果您想快速应用某个安全级别，可以使用以下配置模板：

### 🟢 宽松模式 - 最大兼容性

```env
SECURITY_LEVEL=loose
RATE_LIMIT_ENABLED=false
CORS_STRICT_MODE=false
FILE_UPLOAD_MAX_SIZE=104857600
KEY_CHECK_ON_STARTUP=false
SECURITY_LOG_LEVEL=warn
INPUT_VALIDATION_STRICT_MODE=false
SECURITY_HEADERS_STRICT_MODE=false
```

### 🟡 平衡模式 - 推荐设置 ⭐

```env
SECURITY_LEVEL=balanced
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_MAX=10
API_RATE_LIMIT_MAX=200
CORS_STRICT_MODE=false
FILE_UPLOAD_MAX_SIZE=52428800
KEY_CHECK_ON_STARTUP=true
SECURITY_LOG_LEVEL=info
INPUT_VALIDATION_STRICT_MODE=false
```

### 🔴 严格模式 - 最高安全性

```env
SECURITY_LEVEL=strict
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_MAX=5
API_RATE_LIMIT_MAX=100
RATE_LIMIT_SKIP_INTERNAL_IPS=false
CORS_STRICT_MODE=true
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_STRICT_NAMING=true
KEY_CHECK_ON_STARTUP=true
SECURITY_LOG_LEVEL=debug
INPUT_VALIDATION_STRICT_MODE=true
SECURITY_HEADERS_STRICT_MODE=true
```

## 💡 使用建议

### 1. 🚀 快速开始
- **新项目或开发环境**：选择"宽松模式"
- **生产环境**：选择"平衡模式"
- **高安全要求**：选择"严格模式"

### 2. 🔧 自定义配置
- 可以基于某个模式进行微调
- 所有配置都支持热更新（重启应用生效）
- 建议逐步提升安全级别

### 3. 🚨 故障排除
- 如果遇到兼容性问题，可临时降低安全级别
- 查看日志文件了解具体的安全事件
- 使用备份快速恢复原始配置

### 4. 📊 监控建议
- 定期查看安全日志
- 关注密钥轮换提醒
- 监控异常检测报告

## 🔗 相关文档

- 📖 [详细使用指南](security-usage-guide.md)
- 🛠️ [实施总结](security-implementation.md)
- 🔧 [安全审计报告](security-audit-fixes.md)
- 📋 [项目文档](../README.md)