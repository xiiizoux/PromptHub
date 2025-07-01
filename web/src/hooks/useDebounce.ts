import { useState, useEffect } from 'react';

/**
 * 防抖Hook - 延迟更新值直到指定时间内没有新的更改
 * @param value 要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器延迟更新防抖值
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：如果value在delay时间内再次变化，则清除之前的定时器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖回调Hook - 防抖化一个回调函数
 * @param callback 要防抖的回调函数
 * @param delay 延迟时间（毫秒）
 * @param deps 依赖数组
 * @returns 防抖后的回调函数
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = [],
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const debouncedFn = ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;

    setDebouncedCallback(() => debouncedFn);

    return () => {
      clearTimeout(timeout);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback || callback;
} 