import { useEffect, useCallback, useState, useRef } from 'react';
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
  useCustomDialog?: boolean,
) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>('');
  
  // 使用 ref 来避免依赖问题
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const messageRef = useRef(message);
  const useCustomDialogRef = useRef(useCustomDialog);
  
  // 更新 refs
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
    messageRef.current = message;
    useCustomDialogRef.current = useCustomDialog;
  }, [hasUnsavedChanges, message, useCustomDialog]);

  // 处理浏览器beforeunload事件
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        const warningMessage = messageRef.current || '您有未保存的更改，确定要离开此页面吗？';
        event.preventDefault();
        event.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // 空依赖数组，使用 ref 来访问最新值

  // 处理Next.js路由变化
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      if (hasUnsavedChangesRef.current) {
        if (useCustomDialogRef.current) {
          // 使用自定义对话框
          setPendingUrl(url);
          setShowConfirmDialog(true);
          router.events.emit('routeChangeError');
          throw 'Route change aborted by user - showing custom dialog';
        } else {
          // 使用默认的confirm对话框
          const shouldLeave = window.confirm(
            messageRef.current || '您有未保存的更改，确定要离开此页面吗？',
          );
          if (!shouldLeave) {
            router.events.emit('routeChangeError');
            throw 'Route change aborted by user';
          }
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router]); // 只依赖 router

  // 处理确认离开
  const handleConfirmLeave = useCallback(() => {
    setShowConfirmDialog(false);
    if (pendingUrl) {
      // 临时设置状态为已保存，避免再次触发确认
      hasUnsavedChangesRef.current = false;
      router.push(pendingUrl).finally(() => {
        setPendingUrl('');
      });
    }
  }, [pendingUrl, router]);

  // 处理取消离开
  const handleCancelLeave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingUrl('');
  }, []);

  // 强制跳转方法（忽略未保存状态）
  const forceNavigate = useCallback((url: string) => {
    // 临时设置状态为已保存
    hasUnsavedChangesRef.current = false;
    router.push(url);
  }, [router]);

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
  },
) {
  const router = useRouter();
  const { message, onLeaveConfirm, onSave } = options || {};
  
  // 使用 ref 来避免依赖问题
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const optionsRef = useRef(options);
  
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
    optionsRef.current = options;
  }, [hasUnsavedChanges, options]);

  // 监听路由变化
  useEffect(() => {
    const handleRouteChangeStart = async (url: string) => {
      if (!hasUnsavedChangesRef.current) {return;}

      const currentOptions = optionsRef.current;
      
      // 如果提供了自定义确认函数
      if (currentOptions?.onLeaveConfirm) {
        const result = await currentOptions.onLeaveConfirm();
        if (!result) {
          router.events.emit('routeChangeError');
          throw 'Route change aborted by user confirmation';
        }
        return;
      }

      // 使用默认的确认对话框
      const shouldLeave = window.confirm(
        currentOptions?.message || '您有未保存的更改，确定要离开此页面吗？',
      );
      
      if (!shouldLeave) {
        router.events.emit('routeChangeError');
        throw 'Route change aborted by user';
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router]); // 只依赖 router

  // 使用原有的useBeforeUnload处理浏览器事件
  useBeforeUnload(hasUnsavedChanges, message);

  // 强制跳转（忽略未保存状态）
  const forceNavigate = useCallback((url: string) => {
    hasUnsavedChangesRef.current = false;
    router.push(url);
  }, [router]);

  // 安全跳转（先保存再跳转）
  const safeNavigate = useCallback(async (url: string) => {
    const currentOptions = optionsRef.current;
    if (hasUnsavedChangesRef.current && currentOptions?.onSave) {
      try {
        await currentOptions.onSave();
        router.push(url);
      } catch (error) {
        console.error('保存失败:', error);
      }
    } else {
      router.push(url);
    }
  }, [router]);

  return {
    forceNavigate,
    safeNavigate,
  };
}