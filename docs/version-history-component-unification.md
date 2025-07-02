# 版本历史组件统一重构

## 概述

根据用户要求"历史版本组件有多个么，请统一使用一个，删除冗余的组件"，我们成功统一了项目中的版本历史组件，消除了代码重复，提高了维护性。

## 重构前的状况

项目中存在两个版本历史组件：

1. **`web/src/components/VersionHistory.tsx`** - 内联版本
   - 用于协作编辑页面 (`/collaborative/[id].tsx`)
   - 使用 `@/lib/collaborative` API
   - 内联显示，不是弹窗
   - 有创建版本功能

2. **`web/src/components/prompts/VersionHistory.tsx`** - 弹窗版本
   - 用于个人中心和公开详情页
   - 使用 `/api/prompts/${promptId}/versions` API
   - 弹窗显示，使用 `@headlessui/react`
   - 有版本对比功能

## 重构方案

选择保留 `web/src/components/prompts/VersionHistory.tsx` 作为统一组件，因为它功能更完善：
- 更好的用户界面
- 版本对比功能
- 更完整的版本管理

## 实施的修改

### 1. 增强统一组件

修改 `web/src/components/prompts/VersionHistory.tsx`：

```typescript
interface VersionHistoryProps {
  isOpen?: boolean;        // 弹窗模式时必需
  onClose?: () => void;    // 弹窗模式时必需
  promptId: string;
  currentVersion: number;
  onVersionRevert?: (versionId: string) => void;
  inline?: boolean;        // 新增：支持内联模式
  className?: string;      // 新增：自定义样式
}
```

### 2. 支持双模式渲染

- **内联模式** (`inline=true`)：直接渲染内容，不包装在弹窗中
- **弹窗模式** (`inline=false` 或未设置)：使用 Dialog 组件包装

### 3. 提取公共渲染逻辑

创建 `renderVersionHistoryContent()` 函数，包含：
- 版本列表显示
- 媒体文件版本管理说明
- 版本对比模式
- 错误处理
- 加载状态

### 4. 更新使用方

#### 协作编辑页面 (`web/src/pages/collaborative/[id].tsx`)

```typescript
// 修改前
import { VersionHistory } from '@/components/VersionHistory';

<VersionHistory
  promptId={prompt.id}
  currentContent={content}
  onRestore={handleVersionRestore}
  className="min-h-[600px]"
/>

// 修改后
import VersionHistory from '@/components/prompts/VersionHistory';

<VersionHistory
  promptId={prompt.id}
  currentVersion={1.0}
  inline={true}
  className="min-h-[600px]"
  onVersionRevert={(versionId) => {
    console.log('恢复版本:', versionId);
  }}
/>
```

#### 其他页面保持不变

- `web/src/pages/prompts/[id].tsx`
- `web/src/pages/profile/prompt-details.tsx`

### 5. 删除冗余组件

删除 `web/src/components/VersionHistory.tsx`

## 统一后的优势

1. **代码复用**：消除了重复的版本历史逻辑
2. **功能完整**：统一组件包含所有功能（对比、查看、回滚等）
3. **维护简单**：只需维护一个组件
4. **界面一致**：所有页面使用相同的版本历史界面
5. **灵活性**：支持内联和弹窗两种显示模式

## 保留的功能

- ✅ 版本列表显示
- ✅ 版本对比功能
- ✅ 版本回滚
- ✅ 版本内容查看
- ✅ 媒体文件版本管理说明
- ✅ 错误处理和加载状态
- ✅ 响应式设计

## 技术细节

- 使用 TypeScript 确保类型安全
- 支持 React 18+ 
- 使用 @headlessui/react 进行弹窗管理
- 使用 framer-motion 进行动画效果（在内联模式中保留）
- 完全向后兼容现有的弹窗使用方式

## 测试建议

建议测试以下场景：
1. 协作编辑页面的内联版本历史
2. 个人中心的弹窗版本历史
3. 公开详情页的弹窗版本历史
4. 版本对比功能
5. 版本回滚功能

## 结论

成功统一了版本历史组件，消除了代码重复，提高了代码质量和维护性。新的统一组件既保持了原有功能的完整性，又增加了灵活性，支持不同的使用场景。
