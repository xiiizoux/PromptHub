import { useEffect, useState, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number; // 每个项目的预估高度
  containerHeight: number; // 容器高度
  overscan?: number; // 额外渲染的项目数量，防止滚动时闪烁
  totalItems: number; // 总项目数
}

interface VirtualScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  visibleItems: Array<{
    index: number;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  overscan = 5,
  totalItems
}: UseVirtualScrollOptions): VirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 计算可见项目
  const visibleItems = (() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    // 添加overscan
    const startWithOverscan = Math.max(0, startIndex - overscan);
    const endWithOverscan = Math.min(totalItems - 1, endIndex + overscan);

    const items = [];
    for (let i = startWithOverscan; i <= endWithOverscan; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight
      });
    }

    return items;
  })();

  // 总高度
  const totalHeight = totalItems * itemHeight;

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const targetScrollTop = index * itemHeight;
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    scrollToIndex
  };
}