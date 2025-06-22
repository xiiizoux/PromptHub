# API密钥复制功能实现总结

## 功能需求
用户创建API密钥后，提供一个复制按钮以便用户复制密钥，复制按钮只出现一次，之后密钥不再显示也不能复制。

## 实现方案

### 1. 状态管理
在 `web/src/pages/profile/index.tsx` 中添加了新的状态：

```typescript
const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<Set<string>>(new Set()); // 跟踪新创建的密钥
```

### 2. 创建密钥逻辑修改
修改了 `createApiKey` 函数：

- 创建成功后，将新密钥ID添加到 `newlyCreatedKeys` 状态中
- 自动复制密钥到剪贴板
- 显示提示信息，告知用户这是唯一一次显示机会

```typescript
// 标记为新创建的密钥，这样它会显示密钥值
setNewlyCreatedKeys(prev => new Set([...Array.from(prev), newKey.id]));

// 自动复制到剪贴板
if (newKey.key && newKey.key.length > 32) {
  try {
    await navigator.clipboard.writeText(newKey.key);
    alert(`API密钥创建成功并已复制到剪贴板！\n\n注意：这是唯一一次显示完整密钥的机会，请立即保存！`);
  } catch (e) {
    alert(`API密钥创建成功。请手动复制密钥：\n${newKey.key}\n\n注意：这是唯一一次显示完整密钥的机会，请立即保存！`);
  }
}
```

### 3. 密钥显示逻辑
修改了API密钥列表的显示部分：

- 只有新创建的密钥（在 `newlyCreatedKeys` 中的）才显示密钥值
- 提供复制按钮，点击后显示复制成功状态
- 提供"隐藏密钥"按钮，用户可以手动隐藏密钥
- 显示警告信息，提醒用户立即保存

```typescript
{/* API密钥值显示区域 - 只有新创建的密钥才显示 */}
{apiKey.key && newlyCreatedKeys.has(apiKey.id) && (
  <div className="mt-4 p-3 glass rounded-lg border border-neon-cyan/20 bg-dark-bg-secondary/30">
    <div className="flex items-center justify-between">
      <div className="flex-1 mr-3">
        <p className="text-xs text-gray-400 mb-1">API密钥（仅显示一次）</p>
        <div className="font-mono text-sm text-neon-cyan break-all">
          {apiKey.key}
        </div>
      </div>
      <button
        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
        className="p-2 glass rounded-lg hover:bg-neon-green/10 transition-colors flex-shrink-0"
        title="复制密钥"
      >
        {copiedKey === apiKey.id ? (
          <CheckIcon className="h-5 w-5 text-neon-green" />
        ) : (
          <ClipboardIcon className="h-5 w-5 text-neon-green" />
        )}
      </button>
    </div>
    <div className="flex items-center justify-between mt-2">
      <p className="text-xs text-neon-orange">
        ⚠️ 请立即复制并保存此密钥，关闭页面后将无法再次查看
      </p>
      <button
        onClick={() => {
          setNewlyCreatedKeys(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(apiKey.id);
            return newSet;
          });
        }}
        className="text-xs text-gray-400 hover:text-neon-red transition-colors"
        title="隐藏密钥"
      >
        隐藏密钥
      </button>
    </div>
  </div>
)}
```

### 4. 页面卸载清理
添加了页面卸载时的清理逻辑：

```typescript
// 页面卸载时清除新创建密钥的状态
useEffect(() => {
  const handleBeforeUnload = () => {
    setNewlyCreatedKeys(new Set());
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);
```

## 功能特点

1. **安全性**：密钥只在创建时显示一次，之后不再显示
2. **用户友好**：自动复制到剪贴板，减少用户操作
3. **明确提示**：清楚告知用户这是唯一的显示机会
4. **手动控制**：用户可以主动隐藏密钥
5. **状态管理**：页面刷新或关闭后自动清除显示状态

## 测试建议

1. 创建新的API密钥，验证密钥是否正确显示
2. 点击复制按钮，验证是否成功复制到剪贴板
3. 点击"隐藏密钥"按钮，验证密钥是否被隐藏
4. 刷新页面，验证之前创建的密钥是否不再显示密钥值
5. 创建多个密钥，验证只有新创建的密钥显示密钥值

## 文件修改

- `web/src/pages/profile/index.tsx`：主要修改文件，包含所有功能实现

这个实现完全满足了用户的需求：创建成功后提供复制按钮，复制按钮只出现一次，之后密钥不再显示也不能复制。
