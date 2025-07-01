/**
 * 全局分类上下文 - 简化版
 * 直接使用数据库icon字段，不使用智能生成逻辑
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CategoryInfo, CategoryType, CategoryDisplayInfo } from '@/types/category';
import { categoryService } from '@/services/categoryService';
import { getIconComponent } from '@/utils/categoryIcons';
import { logger } from '@/lib/error-handler';

// 分类上下文接口
interface CategoryContextType {
  // 数据状态
  categories: Record<CategoryType, CategoryInfo[]>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // 快速访问方法
  getCategoryDisplayInfo: (categoryName: string, type?: CategoryType) => CategoryDisplayInfo;
  getCategoryIcon: (categoryName: string, type?: CategoryType) => React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  
  // 管理方法
  refreshCategories: () => Promise<void>;
}

// 创建上下文
const CategoryContext = createContext<CategoryContextType | null>(null);

// 本地存储键名
const CACHE_KEY = 'prompthub_categories_cache';
const CACHE_TIMESTAMP_KEY = 'prompthub_categories_timestamp';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

// 从localStorage获取缓存数据
const getCachedCategories = (): Record<CategoryType, CategoryInfo[]> | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const now = Date.now();
      const cacheTime = parseInt(timestamp);
      
      // 检查缓存是否过期
      if (now - cacheTime < CACHE_EXPIRY) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    logger.warn('读取分类缓存失败', error);
  }
  return null;
};

// 保存数据到localStorage
const setCachedCategories = (categories: Record<CategoryType, CategoryInfo[]>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(categories));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    logger.warn('保存分类缓存失败', error);
  }
};

// 分类提供者组件
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从缓存初始化状态
  const cachedData = getCachedCategories();
  
  // 状态管理
  const [categories, setCategories] = useState<Record<CategoryType, CategoryInfo[]>>(cachedData || {
    chat: [],
    image: [],
    video: [],
  });
  
  const [isLoading, setIsLoading] = useState(!cachedData); // 有缓存时不显示加载状态
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(!!cachedData); // 有缓存时直接初始化

  // 获取分类显示信息的简化方法
  const getCategoryDisplayInfo = useCallback((categoryName: string, type?: CategoryType): CategoryDisplayInfo => {
    // 查找对应的分类数据
    let categoryData: CategoryInfo | undefined;
    
    if (type) {
      categoryData = categories[type]?.find(cat => cat.name === categoryName);
    } else {
      // 在所有类型中查找
      for (const categoryType of Object.keys(categories) as CategoryType[]) {
        categoryData = categories[categoryType]?.find(cat => cat.name === categoryName);
        if (categoryData) break;
      }
    }

    // 获取显示信息（只使用数据库icon字段）
    const displayInfo = categoryService.getCategoryDisplayInfo(categoryName, categoryData as Record<string, any> | undefined);
    
    // 获取图标组件（如果没有图标就返回null）
    const iconComponent = displayInfo.iconName ? getIconComponent(displayInfo.iconName) : null;
    
    return {
      ...displayInfo,
      iconComponent: iconComponent || undefined,
    };
  }, [categories]);

  // 获取分类图标组件
  const getCategoryIcon = useCallback((categoryName: string, type?: CategoryType): React.ComponentType<React.SVGProps<SVGSVGElement>> | null => {
    const displayInfo = getCategoryDisplayInfo(categoryName, type);
    return displayInfo.iconComponent || null;
  }, [getCategoryDisplayInfo]);

  // 加载分类数据
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [chatCategories, imageCategories, videoCategories] = await Promise.all([
        categoryService.getCategories('chat'),
        categoryService.getCategories('image'),
        categoryService.getCategories('video'),
      ]);

      const newCategories = {
        chat: chatCategories,
        image: imageCategories,
        video: videoCategories,
      };
      
      setCategories(newCategories);
      setCachedCategories(newCategories); // 保存到缓存

      logger.info('分类数据加载完成', {
        chat: chatCategories.length,
        image: imageCategories.length,
        video: videoCategories.length,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载分类数据失败';
      setError(errorMessage);
      logger.error('加载分类数据失败', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新分类数据
  const refreshCategories = useCallback(async () => {
    categoryService.clearCache();
    await loadCategories();
  }, [loadCategories]);

  // 初始化数据加载
  useEffect(() => {
    if (!isInitialized) {
      loadCategories().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized, loadCategories]);

  // 上下文值
  const contextValue = useMemo(() => ({
    categories,
    isLoading,
    error,
    isInitialized,
    getCategoryDisplayInfo,
    getCategoryIcon,
    refreshCategories,
  }), [
    categories,
    isLoading,
    error,
    isInitialized,
    getCategoryDisplayInfo,
    getCategoryIcon,
    refreshCategories,
  ]);

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Hook 用于使用分类上下文
export const useCategoryContext = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext 必须在 CategoryProvider 内部使用');
  }
  return context;
};

// 简化的分类显示Hook
export const useOptimizedCategoryDisplay = (categoryName: string, type?: CategoryType) => {
  const { getCategoryDisplayInfo, isInitialized, isLoading } = useCategoryContext();
  
  return useMemo(() => {
    // 如果还没初始化完成，返回基本显示信息
    if (!isInitialized || isLoading) {
      return {
        name: categoryName,
        color: 'from-gray-500 to-gray-600',
        gradient: 'from-gray-500/20 to-gray-600/20',
        iconName: null,
        iconComponent: null,
      };
    }
    
    // 返回实际的显示信息
    return getCategoryDisplayInfo(categoryName, type);
  }, [getCategoryDisplayInfo, categoryName, type, isInitialized, isLoading]);
};

// 简化的分类图标Hook
export const useOptimizedCategoryIcon = (categoryName: string, type?: CategoryType) => {
  const { getCategoryIcon, isInitialized, isLoading } = useCategoryContext();
  
  return useMemo(() => {
    if (!isInitialized || isLoading) {
      return null;
    }
    
    return getCategoryIcon(categoryName, type);
  }, [getCategoryIcon, categoryName, type, isInitialized, isLoading]);
};

export default CategoryContext;