# ESLint配置指南

## 🎯 配置概述

我们的项目使用ESLint来确保代码质量和一致性。配置包括：

- **基础配置**: Next.js核心Web Vitals规则
- **TypeScript支持**: 类型安全检查
- **代码风格规则**: 保持代码一致性
- **React最佳实践**: React特定规则

## 📋 当前配置

### 扩展的规则集
- `next/core-web-vitals`: Next.js推荐的核心规则

### 主要规则分类

#### TypeScript规则
- `@typescript-eslint/no-unused-vars`: 警告未使用的变量（支持_前缀忽略）
- `@typescript-eslint/no-explicit-any`: 警告使用any类型

#### React规则  
- `react/no-unescaped-entities`: 警告未转义的HTML实体
- `react/jsx-key`: 确保列表项有key属性
- `react/prop-types`: 关闭（使用TypeScript）
- `react/react-in-jsx-scope`: 关闭（新JSX转换）

#### JavaScript基础规则
- `no-console`: 允许console.warn和console.error
- `no-debugger`: 禁止debugger语句
- `no-duplicate-imports`: 禁止重复导入
- `prefer-const`: 要求使用const
- `no-var`: 禁止使用var

#### Next.js规则
- `@next/next/no-img-element`: 警告使用img标签（推荐Image组件）

#### 代码风格（宽松警告）
- `quotes`: 建议使用单引号
- `semi`: 建议使用分号
- `comma-dangle`: 建议使用尾随逗号

## 🚀 使用方法

### 基本命令
```bash
# 运行ESLint检查
npm run lint

# 运行ESLint并允许最多50个警告
npm run lint -- --max-warnings 50

# 自动修复可修复的问题
npm run lint -- --fix

# 检查特定文件
npx eslint src/components/MyComponent.tsx

# 检查特定目录
npx eslint src/pages/
```

### VSCode集成

安装ESLint扩展后，在VSCode设置中添加：

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact"
  ]
}
```

## 🔧 常见问题和解决方案

### 1. 未使用的变量警告
```typescript
// ❌ 警告
const [data, setData] = useState();

// ✅ 解决方案：使用_前缀
const [_data, setData] = useState();
// 或者
const [, setData] = useState();
```

### 2. console语句警告
```typescript
// ❌ 警告
console.log('debug info');

// ✅ 允许
console.warn('warning message');
console.error('error message');
```

### 3. 图片标签警告
```tsx
// ❌ 警告
<img src="/image.jpg" alt="description" />

// ✅ 推荐
import Image from 'next/image';
<Image src="/image.jpg" alt="description" width={100} height={100} />
```

### 4. React Hook规则错误
```tsx
// ❌ 错误
if (condition) {
  const [state, setState] = useState();
}

// ✅ 正确
const [state, setState] = useState();
if (condition) {
  // 使用state
}
```

## 📈 代码质量指标

### 警告级别说明
- **Error**: 必须修复，否则无法构建
- **Warning**: 建议修复，不影响构建

### 常见警告类型统计
1. **Missing trailing comma** - 代码风格
2. **Unexpected any** - 类型安全
3. **Unused variables** - 代码清理
4. **Missing dependencies** - React Hooks
5. **Console statements** - 调试清理

## 🛠️ 自定义配置

如需修改规则，编辑`.eslintrc.json`:

```json
{
  "rules": {
    "rule-name": "off",        // 关闭规则
    "rule-name": "warn",       // 警告级别
    "rule-name": "error"       // 错误级别
  }
}
```

## 📚 最佳实践

1. **定期运行ESLint**: 在提交前检查代码
2. **修复错误优先**: 先解决errors，再处理warnings
3. **团队一致性**: 遵循项目ESLint配置
4. **渐进式改进**: 逐步清理现有警告
5. **使用IDE集成**: 实时获得反馈

## 🔄 CI/CD集成

在GitHub Actions或其他CI中：

```yaml
- name: Run ESLint
  run: |
    cd web
    npm ci
    npm run lint -- --max-warnings 100
```

## 📝 忽略文件

项目已配置`.eslintignore`来忽略：
- `node_modules/`
- `.next/`
- `build/`
- `dist/`
- 环境变量文件
- 其他构建产物

## 🎯 目标

通过ESLint配置，我们希望实现：
- ✅ 代码质量一致性
- ✅ 减少潜在bug
- ✅ 提升开发体验
- ✅ 团队协作效率
- ✅ 可维护的代码库