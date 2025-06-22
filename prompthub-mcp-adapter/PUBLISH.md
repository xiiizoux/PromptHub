# 📦 NPM 发布指南

## 🚀 发布到 npmjs.com

### 1. 准备工作

确保你有npm账号：
```bash
# 注册npm账号（如果没有）
npm adduser

# 或者登录已有账号
npm login
```

### 2. 验证包

```bash
# 运行测试
npm test

# 检查包内容
npm pack --dry-run

# 验证包信息
npm info prompthub-mcp-adapter
```

### 3. 发布包

```bash
# 发布到npm
npm publish

# 如果是第一次发布，可能需要添加--access public
npm publish --access public
```

### 4. 验证发布

```bash
# 检查是否发布成功
npm info prompthub-mcp-adapter

# 测试安装
npx prompthub-mcp-adapter@latest
```

## 🔄 版本管理

### 更新版本

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 小版本 (1.0.0 -> 1.1.0)
npm version minor

# 大版本 (1.0.0 -> 2.0.0)
npm version major

# 发布新版本
npm publish
```

### 版本策略

- **补丁版本**: 错误修复、小改进
- **小版本**: 新功能、向后兼容
- **大版本**: 破坏性更改

## 📋 发布前检查清单

- [ ] 代码测试通过 (`npm test`)
- [ ] README.md 文档完整
- [ ] package.json 信息正确
- [ ] LICENSE 文件存在
- [ ] 版本号符合语义化版本规范
- [ ] 所有文件在 `files` 字段中列出

## 🔧 CI/CD 自动发布

### GitHub Actions 配置

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./prompthub-mcp-adapter
      
      - name: Run tests
        run: npm test
        working-directory: ./prompthub-mcp-adapter
      
      - name: Publish to NPM
        run: npm publish
        working-directory: ./prompthub-mcp-adapter
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 设置 NPM Token

1. 在 npmjs.com 生成 Access Token
2. 在 GitHub 仓库设置中添加 `NPM_TOKEN` secret

## 🌟 发布后推广

### 1. 更新文档

- 在主项目 README 中添加 npx 使用说明
- 更新 PromptHub 官网文档
- 创建使用教程和视频

### 2. 社区推广

- 在 GitHub 创建 Release
- 发布到相关社区（Reddit、Discord等）
- 写博客文章介绍使用方法

### 3. 监控使用情况

- 查看 npm 下载统计
- 收集用户反馈
- 监控 GitHub Issues

## 🐛 问题排查

### 发布失败

```bash
# 检查登录状态
npm whoami

# 检查包名是否被占用
npm info prompthub-mcp-adapter

# 检查网络连接
npm ping
```

### 权限问题

```bash
# 重新登录
npm logout
npm login

# 检查组织权限（如果适用）
npm org ls your-org
```

## 📊 使用统计

发布后可以通过以下方式查看使用情况：

```bash
# 查看下载统计
npm info prompthub-mcp-adapter

# 查看详细统计
curl https://api.npmjs.org/downloads/range/last-month/prompthub-mcp-adapter
```

---

**准备发布时，请确保所有测试通过并遵循上述步骤！** 🚀 