import { useEffect } from 'react';

/**
 * 自定义Hook：监听浏览器关闭/刷新/离开页面事件，当有未保存更改时显示警告
 * @param hasUnsavedChanges 是否有未保存的更改
 * @param message 警告消息
 */
export function useBeforeUnload(hasUnsavedChanges: boolean, message?: string) {
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
}