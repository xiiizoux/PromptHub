/**
 * 全局分类上下文 - 解决分类图标加载延迟和闪烁问题
 * 
 * 优化策略：
 * 1. 全局预加载分类数据，避免每个组件重复请求
 * 2. 智能缓存图标组件，避免重复创建
 * 3. 优雅的加载状态处理，减少闪烁
 * 4. 提供同步的分类信息获取接口
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CategoryInfo, CategoryType, CategoryDisplayInfo } from '@/types/category';
import { categoryService } from '@/services/categoryService';
import { getIconComponent } from '@/utils/categoryIcons';
import { logger } from '@/lib/error-handler';

// 预编译的图标组件缓存
const IconComponentCache = new Map<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>();

// 分类上下文接口
interface CategoryContextType {
  // 数据状态
  categories: Record<CategoryType, CategoryInfo[]>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // 快速访问方法
  getCategoryDisplayInfo: (categoryName: string, type?: CategoryType) => CategoryDisplayInfo;
  getCategoryIcon: (categoryName: string, type?: CategoryType) => React.ComponentType<React.SVGProps<SVGSVGElement>>;
  
  // 管理方法
  refreshCategories: () => Promise<void>;
  preloadCategories: (types: CategoryType[]) => Promise<void>;
}

// 默认的分类显示信息（避免闪烁）
const DEFAULT_CATEGORY_DISPLAY: CategoryDisplayInfo = {
  name: '默认分类',
  color: 'from-gray-500 to-gray-600',
  gradient: 'from-gray-500/20 to-gray-600/20',
  iconName: 'QuestionMarkCircleIcon',
  iconComponent: getIconComponent('QuestionMarkCircleIcon'),
};

// 创建上下文
const CategoryContext = createContext<CategoryContextType | null>(null);

// 分类提供者组件
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 状态管理
  const [categories, setCategories] = useState<Record<CategoryType, CategoryInfo[]>>({
    chat: [],
    image: [],
    video: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 缓存的分类显示信息映射
  const [categoryDisplayCache] = useState(new Map<string, CategoryDisplayInfo>());

  // 获取分类显示信息的优化方法
  const getCategoryDisplayInfo = useCallback((categoryName: string, type?: CategoryType): CategoryDisplayInfo => {
    const cacheKey = `${categoryName}_${type || 'default'}`;
    
    // 先检查缓存
    const cached = categoryDisplayCache.get(cacheKey);
    if (cached) {
      return cached;
    }

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

    // 获取显示信息
    const displayInfo = categoryService.getCategoryDisplayInfo(categoryName, categoryData);
    
    // 获取图标组件（使用缓存）
    let iconComponent = IconComponentCache.get(displayInfo.iconName);
    if (!iconComponent) {
      iconComponent = getIconComponent(displayInfo.iconName);
      IconComponentCache.set(displayInfo.iconName, iconComponent);
    }
    
    const result: CategoryDisplayInfo = {
      ...displayInfo,
      iconComponent,
    };

    // 缓存结果
    categoryDisplayCache.set(cacheKey, result);
    return result;
  }, [categories, categoryDisplayCache]);

  // 获取分类图标组件
  const getCategoryIcon = useCallback((categoryName: string, type?: CategoryType): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
    const displayInfo = getCategoryDisplayInfo(categoryName, type);
    return displayInfo.iconComponent || getIconComponent('QuestionMarkCircleIcon');
  }, [getCategoryDisplayInfo]);

  // 预加载分类数据
  const preloadCategories = useCallback(async (types: CategoryType[]) => {
    logger.info('开始预加载分类数据', { types });
    
    try {
      const results = await Promise.allSettled(
        types.map(async (type) => {
          const categoryData = await categoryService.getCategories(type);
          return { type, data: categoryData };
        })
      );

      const newCategories = { ...categories };
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          newCategories[type] = data;
          logger.info(`${type}类型分类数据加载成功`, { count: data.length });
        } else {
          logger.error(`${types[index]}类型分类数据加载失败`, result.reason);
        }
      });

      setCategories(newCategories);
      
      // 预编译常用图标
      const allCategories = Object.values(newCategories).flat();
      allCategories.forEach(category => {
        const displayInfo = categoryService.getCategoryDisplayInfo(category.name, category);
        if (!IconComponentCache.has(displayInfo.iconName)) {
          const iconComponent = getIconComponent(displayInfo.iconName);
          IconComponentCache.set(displayInfo.iconName, iconComponent);
        }
      });

      logger.info('分类数据预加载完成', { 
        totalCategories: allCategories.length,
        cachedIcons: IconComponentCache.size 
      });

    } catch (error) {
      logger.error('分类数据预加载失败', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [categories]);

  // 刷新分类数据
  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    categoryDisplayCache.clear();
    IconComponentCache.clear();

    try {
      await preloadCategories(['chat', 'image', 'video']);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新分类数据失败';
      setError(errorMessage);
      logger.error('刷新分类数据失败', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [preloadCategories, categoryDisplayCache]);

  // 初始化数据加载
  useEffect(() => {
    const initializeCategories = async () => {
      try {
        await preloadCategories(['chat', 'image', 'video']);
        setIsInitialized(true);
      } catch (err) {
        logger.error('初始化分类数据失败', err instanceof Error ? err : new Error(String(err)));
        setError(err instanceof Error ? err.message : '初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      initializeCategories();
    }
  }, [isInitialized, preloadCategories]);

  // 上下文值
  const contextValue = useMemo(() => ({
    categories,
    isLoading,
    error,
    isInitialized,
    getCategoryDisplayInfo,
    getCategoryIcon,
    refreshCategories,
    preloadCategories,
  }), [
    categories,
    isLoading,
    error,
    isInitialized,
    getCategoryDisplayInfo,
    getCategoryIcon,
    refreshCategories,
    preloadCategories,
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

// 优化的分类显示Hook - 无延迟获取分类信息
export const useOptimizedCategoryDisplay = (categoryName: string, type?: CategoryType) => {
  const { getCategoryDisplayInfo, isInitialized, isLoading } = useCategoryContext();
  
  return useMemo(() => {
    // 如果还没初始化完成，返回默认显示信息避免闪烁
    if (!isInitialized || isLoading) {
      return {
        ...DEFAULT_CATEGORY_DISPLAY,
        name: categoryName || DEFAULT_CATEGORY_DISPLAY.name,
      };
    }
    
    // 返回实际的显示信息
    return getCategoryDisplayInfo(categoryName, type);
  }, [getCategoryDisplayInfo, categoryName, type, isInitialized, isLoading]);
};

// 优化的分类图标Hook
export const useOptimizedCategoryIcon = (categoryName: string, type?: CategoryType) => {
  const { getCategoryIcon, isInitialized, isLoading } = useCategoryContext();
  
  return useMemo(() => {
    if (!isInitialized || isLoading) {
      return getIconComponent('QuestionMarkCircleIcon');
    }
    
    return getCategoryIcon(categoryName, type);
  }, [getCategoryIcon, categoryName, type, isInitialized, isLoading]);
};

export default CategoryContext;