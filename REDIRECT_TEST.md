# 重定向功能测试文档

## 功能概述

实现了完整的用户登录/注册重定向功能，确保用户在登录或注册完成后能够自动返回到他们原本想要访问的页面。

## 实现的功能

### 1. 统一的重定向参数支持
- 支持 `redirect` 和 `returnUrl` 两种参数名称
- 自动处理URL编码和解码

### 2. 重定向工具函数 (`web/src/lib/redirect.ts`)
- `getRedirectUrl(router)`: 获取重定向URL
- `buildUrlWithRedirect(baseUrl, redirectUrl)`: 构建带重定向参数的URL
- `redirectToLogin(router, currentPath)`: 重定向到登录页面
- `redirectToRegister(router, currentPath)`: 重定向到注册页面
- `handlePostLoginRedirect(router, defaultPath)`: 处理登录后重定向
- `isSafeRedirectUrl(url)`: 检查重定向URL安全性
- `safeRedirect(router, url, fallback)`: 安全重定向

### 3. 页面更新
- **登录页面** (`web/src/pages/auth/login.tsx`): 支持重定向参数，登录成功后自动跳转
- **注册页面** (`web/src/pages/auth/register.tsx`): 注册成功后保持重定向参数跳转到登录页
- **编辑页面** (`web/src/pages/prompts/[name]/edit.tsx`): 未登录时重定向到登录页
- **创建页面** (`web/src/pages/create/index.tsx`): 未登录时重定向到登录页

## 用户流程测试

### 测试场景1: 未登录用户访问编辑页面
1. 用户访问: `http://localhost:9011/prompts/code_assistant/edit`
2. 系统检测到未登录，重定向到: `http://localhost:9011/auth/login?redirect=%2Fprompts%2Fcode_assistant%2Fedit`
3. 用户在登录页面输入凭据并登录
4. 登录成功后自动跳转到: `http://localhost:9011/prompts/code_assistant/edit`

### 测试场景2: 未登录用户访问创建页面
1. 用户访问: `http://localhost:9011/create`
2. 系统检测到未登录，重定向到: `http://localhost:9011/auth/login?redirect=%2Fcreate`
3. 用户点击"创建新账户"链接
4. 跳转到: `http://localhost:9011/auth/register?redirect=%2Fcreate`
5. 用户完成注册
6. 3秒后自动跳转到: `http://localhost:9011/auth/login?registered=true&redirect=%2Fcreate`
7. 用户登录成功后跳转到: `http://localhost:9011/create`

### 测试场景3: 已登录用户访问登录页面
1. 已登录用户访问: `http://localhost:9011/auth/login?redirect=%2Fcreate`
2. 系统检测到已登录，自动跳转到: `http://localhost:9011/create`

## 测试页面

创建了测试页面 `http://localhost:9011/test-redirect` 用于验证重定向功能：
- 显示当前路径和重定向参数
- 提供各种测试链接
- 展示工具函数的输出结果

## 安全考虑

1. **开放重定向防护**: `isSafeRedirectUrl()` 函数确保只能重定向到同域URL
2. **URL编码**: 所有重定向URL都经过适当的编码处理
3. **参数验证**: 检查重定向参数的有效性

## 使用方法

### 在组件中使用
```typescript
import { redirectToLogin, getRedirectUrl, buildUrlWithRedirect } from '@/lib/redirect';

// 重定向到登录页面
const handleLoginRequired = () => {
  redirectToLogin(router);
};

// 构建带重定向的链接
const loginUrl = buildUrlWithRedirect('/auth/login', '/create');
```

### 在页面中检查登录状态
```typescript
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    redirectToLogin(router);
  }
}, [authLoading, isAuthenticated, router]);
```

## 测试步骤

1. 启动开发服务器: `npm run dev --prefix web`
2. 访问测试页面: `http://localhost:9011/test-redirect`
3. 测试各种重定向场景
4. 验证登录/注册流程的完整性

## 注意事项

- 重定向功能依赖于 `useAuth` 上下文提供的认证状态
- 确保所有需要登录的页面都使用了重定向逻辑
- 测试时注意清除浏览器缓存和登录状态 