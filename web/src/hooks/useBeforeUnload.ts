import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * 自定义Hook：监听浏览器关闭/刷新/离开页面事件，当有未保存更改时显示警告
 * @param hasUnsavedChanges 是否有未保存的更改
 * @param message 警告消息
 * @param useCustomDialog 是否使用自定义对话框而非原生confirm
 */
export function useBeforeUnload(
  hasUnsavedChanges: boolean, 
  message?: string,
  useCustomDialog?: boolean
) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>('');

  // 处理浏览器beforeunload事件
  useEffect(() => {
    const defaultMessage = '您有未保存的更改，确定要离开此页面吗？';
    const warningMessage = message || defaultMessage;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // 现代浏览器会忽略自定义消息，但仍需要设置returnValue
        event.preventDefault();
        event.returnValue = warningMessage;
        return warningMessage;
      }
    };

    // 始终添加监听器，在处理函数中判断状态
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  // 处理确认离开
  const handleConfirmLeave = useCallback(() => {
    setShowConfirmDialog(false);
    if (pendingUrl) {
      // 临时移除路由监听器，避免再次触发确认
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.push(pendingUrl).finally(() => {
        // 导航完成后重新添加监听器
        router.events.on('routeChangeStart', handleRouteChangeStart);
        setPendingUrl('');
      });
    }
  }, [pendingUrl, router]);

  // 强制跳转方法（忽略未保存状态）
  const forceNavigate = useCallback((url: string) => {
    // 临时移除路由监听器
    router.events.off('routeChangeStart', handleRouteChangeStart);
    router.push(url).finally(() => {
      // 导航完成后重新添加监听器
      router.events.on('routeChangeStart', handleRouteChangeStart);
    });
  }, [router, handleRouteChangeStart]);

  // 处理取消离开
  const handleCancelLeave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingUrl('');
  }, []);

  // 处理Next.js路由变化
  const handleRouteChangeStart = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      if (useCustomDialog) {
        // 使用自定义对话框
        setPendingUrl(url);
        setShowConfirmDialog(true);
        // 抛出错误来阻止路由跳转
        router.events.emit('routeChangeError');
        throw 'Route change aborted by user - showing custom dialog';
      } else {
        // 使用默认的confirm对话框
        const shouldLeave = window.confirm(
          message || '您有未保存的更改，确定要离开此页面吗？'
        );
        if (!shouldLeave) {
          // 抛出错误来阻止路由跳转
          router.events.emit('routeChangeError');
          throw 'Route change aborted by user';
        }
      }
    }
  }, [hasUnsavedChanges, message, useCustomDialog, router]);

  useEffect(() => {
    // 监听路由变化开始事件
    router.events.on('routeChangeStart', handleRouteChangeStart);

    // 清理监听器
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router, handleRouteChangeStart]);

  return {
    showConfirmDialog,
    onConfirmLeave: handleConfirmLeave,
    onCancelLeave: handleCancelLeave,
    forceNavigate,
  };
}

/**
 * 增强版的路由保护Hook，提供更好的用户体验
 * @param hasUnsavedChanges 是否有未保存的更改
 * @param options 配置选项
 */
export function useRouteGuard(
  hasUnsavedChanges: boolean,
  options?: {
    message?: string;
    onLeaveConfirm?: () => Promise<boolean> | boolean;
    onSave?: () => Promise<void>;
  }
) {
  const router = useRouter();
  const { message, onLeaveConfirm, onSave } = options || {};

  const handleRouteChangeStart = useCallback(async () => {
    if (!hasUnsavedChanges) return false;

    // 如果提供了自定义确认函数
    if (onLeaveConfirm) {
      const result = await onLeaveConfirm();
      return !result; // 如果用户选择不离开，则阻止路由跳转
    }

    // 使用默认的确认对话框
    const shouldLeave = window.confirm(
      message || '您有未保存的更改，确定要离开此页面吗？'
    );
    
    return !shouldLeave; // 如果用户选择不离开，则阻止路由跳转
  }, [hasUnsavedChanges, message, onLeaveConfirm]);

  // 使用原有的useBeforeUnload处理浏览器事件和路由事件
  useBeforeUnload(hasUnsavedChanges, message, handleRouteChangeStart);

  // 返回一些有用的方法
  return {
    // 强制跳转（忽略未保存状态）
    forceNavigate: useCallback((url: string) => {
      // 临时移除路由监听器
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.push(url).finally(() => {
        // 跳转完成后重新添加监听器
        router.events.on('routeChangeStart', handleRouteChangeStart);
      });
    }, [router, handleRouteChangeStart]),

    // 安全跳转（先保存再跳转）
    safeNavigate: useCallback(async (url: string) => {
      if (hasUnsavedChanges && onSave) {
        try {
          await onSave();
          router.push(url);
        } catch (error) {
          console.error('保存失败:', error);
        }
      } else {
        router.push(url);
      }
    }, [hasUnsavedChanges, onSave, router])
  };
}