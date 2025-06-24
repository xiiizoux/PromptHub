import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { safeDocument, isBrowser } from '@/lib/dom-utils';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 确保在浏览器环境中运行
    if (!isBrowser()) return;
    
    // 忽略在输入框中的按键事件
    const activeElement = document?.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    if (isInputActive) return;

    // 构建快捷键字符串
    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    // 添加空值检查防止toLowerCase错误
    if (event.key) {
      keys.push(event.key.toLowerCase());
    }

    const shortcut = keys.join('+');
    
    if (shortcuts[shortcut]) {
      event.preventDefault();
      shortcuts[shortcut]();
    }
  }, [shortcuts]);

  useEffect(() => {
    if (!isBrowser()) return;
    
    const added = safeDocument.addEventListener('keydown', handleKeyDown);
    return () => {
      if (added) {
        safeDocument.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleKeyDown]);
};

// 预设的快捷键配置
export const useGlobalKeyboardShortcuts = () => {
  const router = useRouter();

  const shortcuts: KeyboardShortcuts = {
    // 导航快捷键
    'ctrl+h': () => {
      router.push('/');
      toast.success('跳转到首页');
    },
    'ctrl+p': () => {
      router.push('/prompts');
      toast.success('跳转到提示词列表');
    },
    'ctrl+b': () => {
      router.push('/bookmarks');
      toast.success('跳转到书签');
    },
    'ctrl+n': () => {
      router.push('/prompts/create');
      toast.success('跳转到创建提示词');
    },
    'ctrl+s': () => {
      // 阻止浏览器默认保存行为
      toast('使用 Ctrl+S 保存当前编辑内容');
    },
    // 搜索快捷键
    'ctrl+k': () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        toast.success('聚焦搜索框');
      } else {
        toast.error('未找到搜索框');
      }
    },
    // 复制快捷键
    'ctrl+shift+c': () => {
      // 复制当前页面的prompt内容
      const promptContent = document.querySelector('[data-prompt-content]') as HTMLElement;
      if (promptContent) {
        navigator.clipboard.writeText(promptContent.textContent || '');
        toast.success('已复制提示词内容');
      } else {
        toast.error('未找到可复制的内容');
      }
    },
    // 帮助快捷键
    'ctrl+?': () => {
      // 显示快捷键帮助
      showKeyboardHelp();
    },
    '?': () => {
      showKeyboardHelp();
    },
    // ESC键关闭弹窗
    'escape': () => {
      // 查找并关闭当前打开的模态框
      const modal = document.querySelector('[role="dialog"]');
      const closeButton = modal?.querySelector('[aria-label*="关闭"], [aria-label*="close"], .modal-close');
      if (closeButton) {
        (closeButton as HTMLElement).click();
        toast.success('已关闭弹窗');
      }
    },
  };

  useKeyboardShortcuts(shortcuts);
};

// 显示快捷键帮助
const showKeyboardHelp = () => {
  const helpModal = document.createElement('div');
  helpModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
  helpModal.innerHTML = `
    <div class="glass rounded-xl border border-neon-cyan/20 p-6 max-w-md mx-4 max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-white">键盘快捷键</h3>
        <button class="text-gray-400 hover:text-white keyboard-help-close" aria-label="关闭">
          ✕
        </button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-neon-cyan font-medium mb-2">导航</h4>
            <div class="space-y-1 text-gray-300">
              <div><kbd>Ctrl+H</kbd> 首页</div>
              <div><kbd>Ctrl+P</kbd> 提示词</div>
              <div><kbd>Ctrl+B</kbd> 书签</div>
              <div><kbd>Ctrl+U</kbd> 使用历史</div>
              <div><kbd>Ctrl+N</kbd> 新建提示词</div>
            </div>
          </div>
          <div>
            <h4 class="text-neon-purple font-medium mb-2">功能</h4>
            <div class="space-y-1 text-gray-300">
              <div><kbd>Ctrl+K</kbd> 搜索</div>
              <div><kbd>Ctrl+S</kbd> 保存</div>
              <div><kbd>Ctrl+Shift+C</kbd> 复制内容</div>
              <div><kbd>Esc</kbd> 关闭弹窗</div>
              <div><kbd>?</kbd> 显示帮助</div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-gray-700">
        <p class="text-xs text-gray-400">
          在输入框中时快捷键将被禁用
        </p>
      </div>
    </div>
  `;

  // 添加关闭事件
  const closeButton = helpModal.querySelector('.keyboard-help-close');
  const closeModal = () => {
    document.body.removeChild(helpModal);
    document.removeEventListener('keydown', escapeHandler);
  };

  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  closeButton?.addEventListener('click', closeModal);
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) closeModal();
  });
  document.addEventListener('keydown', escapeHandler);

  document.body.appendChild(helpModal);
  toast.success('显示快捷键帮助');
};

// 为特定组件提供的快捷键Hook
export const usePromptEditorShortcuts = (actions: {
  save?: () => void;
  preview?: () => void;
  format?: () => void;
  duplicate?: () => void;
}) => {
  const shortcuts: KeyboardShortcuts = {
    'ctrl+s': () => {
      actions.save?.();
    },
    'ctrl+shift+p': () => {
      actions.preview?.();
    },
    'ctrl+shift+f': () => {
      actions.format?.();
    },
    'ctrl+d': () => {
      actions.duplicate?.();
    },
  };

  useKeyboardShortcuts(shortcuts);
}; 