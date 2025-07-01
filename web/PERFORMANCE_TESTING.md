# PromptHub 性能优化测试指南

本文档介绍如何使用 Playwright 测试 PromptHub 项目中的懒加载、渐进式图像加载等网页加载优化措施。

## 🎯 测试目标

检测以下优化措施是否生效：

### 1. 懒加载 (Lazy Loading)
- ✅ 图像懒加载：只有进入可视区域的图片才开始加载
- ✅ 视频懒加载：视频元素的延迟加载
- ✅ Intersection Observer API 的使用
- ✅ 预加载边距设置（rootMargin）

### 2. 渐进式图像加载 (Progressive Image Loading)
- ✅ 缩略图优先加载
- ✅ 悬停时加载高质量图片
- ✅ 图片尺寸优化（URL参数）
- ✅ 加载状态指示器

### 3. 视频优化
- ✅ 视频预加载策略
- ✅ 悬停播放功能
- ✅ 缩略图占位符
- ✅ 视频懒加载

### 4. 响应式优化
- ✅ 移动端适配
- ✅ 响应式图片
- ✅ 网格布局优化

## 🚀 快速开始

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 运行快速检测
```bash
./quick-test.sh
```

### 3. 运行完整测试
```bash
./run-performance-tests.sh
```

## 📋 测试文件说明

### `tests/quick-optimization-check.spec.ts`
- **用途**: 快速检测关键优化措施
- **时间**: ~2-3分钟
- **覆盖**: 基本的懒加载、图片优化、加载状态检测

### `tests/lazy-loading-test.spec.ts`
- **用途**: 专门测试懒加载功能
- **时间**: ~5-8分钟
- **覆盖**: 详细的懒加载行为分析

### `tests/performance-optimization-test.spec.ts`
- **用途**: 全面的性能优化检测
- **时间**: ~10-15分钟
- **覆盖**: 深入的性能指标分析

## 🔧 测试页面

### 1. 图像提示词页面 (`/image`)
检测项目：
- 图片懒加载实现
- 缩略图 → 高质量图片的渐进式加载
- 悬停触发高质量图片加载
- 加载状态指示器
- Intersection Observer 使用

### 2. 视频提示词页面 (`/video`)
检测项目：
- 视频懒加载
- 视频缩略图优化
- 悬停播放功能
- 视频预加载策略
- 错误处理和重试机制

### 3. 账户管理页面 (`/profile`)
检测项目：
- 我的图像提示词懒加载
- 我的视频提示词懒加载
- 分页加载优化
- 标签切换时的加载策略

## 📊 测试结果解读

### 优化得分标准
- **90-100%**: 🎉 优秀 - 所有关键优化措施都已实现
- **70-89%**: 👍 良好 - 大部分优化措施已实现
- **50-69%**: ⚠️ 一般 - 基本优化措施已实现，还有改进空间
- **<50%**: ❌ 需要改进 - 缺少重要的优化措施

### 关键指标
1. **Intersection Observer**: 现代懒加载的基础
2. **图片优化**: URL参数优化、缩略图使用
3. **加载状态**: 用户体验的重要组成部分
4. **渐进式加载**: 提升感知性能
5. **响应式设计**: 移动端优化

## 🛠️ 手动运行命令

### 运行特定测试
```bash
# 只测试图像页面
npx playwright test tests/quick-optimization-check.spec.ts -g "图像提示词页面"

# 只测试视频页面
npx playwright test tests/quick-optimization-check.spec.ts -g "视频提示词页面"

# 只测试账户管理页面
npx playwright test tests/quick-optimization-check.spec.ts -g "账户管理页面"
```

### 指定浏览器
```bash
# Chrome 浏览器
npx playwright test --project=chromium

# Firefox 浏览器
npx playwright test --project=firefox

# Safari 浏览器
npx playwright test --project=webkit

# 移动端测试
npx playwright test --project="Mobile Chrome"
```

### 调试模式
```bash
# 可视化调试
npx playwright test --debug

# 慢速执行
npx playwright test --slow-mo=1000

# 保留浏览器窗口
npx playwright test --headed
```

## 📈 查看测试报告

### HTML 报告
```bash
npx playwright show-report
```

### 控制台输出
测试运行时会在控制台显示详细的检测结果：
```
🔍 图像提示词页面 快速优化检测
==================================================
✓ Intersection Observer: ✅ 支持
✓ 懒加载: ✅ 生效 (3 → 12)
✓ 加载状态: ✅ 有指示器 (5个)
✓ 图片优化: ✅ 有优化 (8/15)
✓ 渐进式加载: ✅ 生效 (悬停触发)
✓ 响应式图片: ✅ 已实现

📊 图像提示词页面 优化得分: 100% (6/6)
🎉 优化程度: 优秀
```

## 🐛 故障排除

### 常见问题

1. **开发服务器未运行**
   ```bash
   npm run dev
   ```

2. **Playwright 未安装**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

3. **测试超时**
   - 检查网络连接
   - 确保页面能正常加载
   - 增加超时时间

4. **页面内容未找到**
   - 检查页面路由是否正确
   - 确认页面结构是否发生变化
   - 查看控制台错误信息

### 调试技巧

1. **查看网络请求**
   ```javascript
   // 在测试中添加网络监控
   page.on('request', request => console.log(request.url()));
   ```

2. **截图调试**
   ```bash
   npx playwright test --screenshot=on
   ```

3. **录制视频**
   ```bash
   npx playwright test --video=on
   ```

## 📝 自定义测试

如需添加自定义检测项目，可以修改测试文件：

```typescript
// 添加新的检测项目
const customCheck = await page.evaluate(() => {
  // 自定义检测逻辑
  return document.querySelector('.my-optimization') !== null;
});

console.log(`✓ 自定义优化: ${customCheck ? '✅ 生效' : '❌ 未生效'}`);
```

## 🔄 持续集成

可以将这些测试集成到 CI/CD 流程中：

```yaml
# .github/workflows/performance-test.yml
name: Performance Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run dev &
      - run: npx playwright test tests/quick-optimization-check.spec.ts
```

---

## 📞 支持

如有问题或建议，请：
1. 查看测试输出的详细日志
2. 检查浏览器开发者工具
3. 参考 Playwright 官方文档
4. 提交 Issue 或 PR
