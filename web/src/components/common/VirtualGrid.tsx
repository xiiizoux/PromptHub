import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columnCount: number; // 列数
  itemHeight: number; // 每个项目的高度
  gap?: number; // 项目间距
  className?: string;
  containerHeight?: number; // 容器高度，不设置则自动计算
  overscan?: number; // 额外渲染的行数
  onLoadMore?: () => void; // 加载更多回调
  hasMore?: boolean; // 是否还有更多数据
  loading?: boolean;
}

function VirtualGrid<T>({
  items,
  renderItem,
  columnCount,
  itemHeight,
  gap = 32,
  className = '',
  containerHeight,
  overscan = 2,
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(containerHeight || 800);

  // 监听滚动事件
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 设置容器高度
  useEffect(() => {
    if (!containerHeight && containerRef.current) {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setViewportHeight(window.innerHeight - rect.top - 100); // 减去一些边距
        }
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [containerHeight]);

  // 监听滚动
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 计算行数和总高度
  const rowCount = Math.ceil(items.length / columnCount);
  const rowHeight = itemHeight + gap;
  const totalHeight = rowCount * rowHeight - gap; // 最后一行不需要gap

  // 计算可见行
  const visibleRows = useMemo(() => {
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(viewportHeight / rowHeight),
      rowCount - 1,
    );

    // 添加overscan
    const startWithOverscan = Math.max(0, startRow - overscan);
    const endWithOverscan = Math.min(rowCount - 1, endRow + overscan);

    const rows = [];
    for (let i = startWithOverscan; i <= endWithOverscan; i++) {
      rows.push({
        index: i,
        offsetTop: i * rowHeight,
      });
    }

    return rows;
  }, [scrollTop, viewportHeight, rowHeight, rowCount, overscan]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (const row of visibleRows) {
      const startIndex = row.index * columnCount;
      const endIndex = Math.min(startIndex + columnCount, items.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const columnIndex = i % columnCount;
        items_to_render.push({
          item: items[i],
          index: i,
          row: row.index,
          column: columnIndex,
          offsetTop: row.offsetTop,
          offsetLeft: columnIndex * (100 / columnCount), // 百分比定位
        });
      }
    }
    
    return items_to_render;
  }, [visibleRows, items, columnCount]);

  // 无限滚动检测
  const { elementRef: loadMoreRef, isVisible: shouldLoadMore } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
  });

  // 触发加载更多
  useEffect(() => {
    if (shouldLoadMore && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [shouldLoadMore, hasMore, loading, onLoadMore]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight || viewportHeight }}
    >
      {/* 虚拟滚动容器 */}
      <div
        className="relative"
        style={{ height: totalHeight }}
      >
        {/* 渲染可见项目 */}
        {visibleItems.map(({ item, index, offsetTop, offsetLeft }) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: offsetTop,
              left: `${offsetLeft}%`,
              width: `calc(${100 / columnCount}% - ${gap * (columnCount - 1) / columnCount}px)`,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* 加载更多触发器 */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ top: totalHeight - 400 }} // 提前400px触发
          />
        )}
      </div>
      
      {/* 加载更多指示器 */}
      {loading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-900/80 backdrop-blur-sm rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
            <span className="text-sm text-gray-400">加载更多...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualGrid;