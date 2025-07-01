/**
 * 分类服务React Hook
 * 提供便于组件使用的分类数据获取和管理功能
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { categoryService } from '@/services/categoryService';
import { 
  CategoryInfo, 
  CategoryType, 
  CategoryDisplayInfo, 
  CategoryMap,
  UseCategoryServiceReturn 
} from '@/types/category';
import { getIconComponent } from '@/utils/categoryIcons';
import { logger } from '@/lib/error-handler';

/**
 * 分类服务Hook配置
 */
interface UseCategoryServiceOptions {
  type?: CategoryType;
  autoLoad?: boolean;
  enableCache?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (categories: CategoryInfo[]) => void;
}

/**
 * 主要的分类服务Hook
 */
export function useCategoryService(options: UseCategoryServiceOptions = {}): UseCategoryServiceReturn {
  const {
    type,
    autoLoad = true,
    enableCache = true,
    onError,
    onSuccess,
  } = options;

  // 状态管理
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分类映射（缓存计算结果）
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryInfo>();
    categories.forEach(category => {
      map.set(category.name, category);
    });
    return map;
  }, [categories]);

  // 获取分类数据
  const fetchCategories = useCallback(async () => {
    if (loading) return; // 防止重复请求

    setLoading(true);
    setError(null);

    try {
      const result = await categoryService.getCategories(type);
      setCategories(result);
      onSuccess?.(result);
      logger.info('Hook成功获取分类数据', { type, count: result.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取分类数据失败';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      logger.error('Hook获取分类数据失败', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [type, loading, onError, onSuccess]);

  // 获取分类显示信息
  const getCategoryDisplayInfo = useCallback((name: string): CategoryDisplayInfo => {
    // 查找对应的分类数据
    const categoryData = categories.find(cat => cat.name === name);
    const displayInfo = categoryService.getCategoryDisplayInfo(name, categoryData);

    // 添加图标组件
    return {
      ...displayInfo,
      iconComponent: getIconComponent(displayInfo.iconName),
    };
  }, [categories]);

  // 刷新分类数据
  const refreshCategories = useCallback(async () => {
    if (!enableCache) {
      categoryService.clearCache();
    }
    await fetchCategories();
  }, [fetchCategories, enableCache]);

  // 清除缓存
  const clearCache = useCallback(() => {
    categoryService.clearCache();
  }, []);

  // 自动加载数据
  useEffect(() => {
    if (autoLoad) {
      fetchCategories();
    }
  }, [autoLoad, fetchCategories]);

  return {
    categories,
    categoryMap,
    loading,
    error,
    getCategoryDisplayInfo,
    refreshCategories,
    clearCache,
  };
}

/**
 * 简化版Hook - 只获取分类名称列表
 */
export function useCategoryNames(type?: CategoryType): {
  categoryNames: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { categories, loading, error, refreshCategories } = useCategoryService({ type });
  
  const categoryNames = useMemo(() => {
    return categories.map(category => category.name);
  }, [categories]);

  return {
    categoryNames,
    loading,
    error,
    refresh: refreshCategories,
  };
}

/**
 * 分类映射Hook - 获取名称到显示信息的映射
 */
export function useCategoryDisplayMap(type?: CategoryType): {
  displayMap: Record<string, CategoryDisplayInfo>;
  loading: boolean;
  error: string | null;
  getDisplayInfo: (name: string) => CategoryDisplayInfo;
} {
  const { categories, loading, error, getCategoryDisplayInfo } = useCategoryService({ type });
  
  const displayMap = useMemo(() => {
    const map: Record<string, CategoryDisplayInfo> = {};
    categories.forEach(category => {
      map[category.name] = getCategoryDisplayInfo(category.name);
    });
    return map;
  }, [categories, getCategoryDisplayInfo]);

  return {
    displayMap,
    loading,
    error,
    getDisplayInfo: getCategoryDisplayInfo,
  };
}

/**
 * 分类统计Hook
 */
export function useCategoryStats(type?: CategoryType): {
  stats: Array<{ name: string; count: number }>;
  total: number;
  loading: boolean;
  error: string | null;
} {
  const { categories, loading, error } = useCategoryService({ type });
  
  // 这里可以扩展为实际的统计逻辑
  const stats = useMemo(() => {
    return categories.map(category => ({
      name: category.name,
      count: 0, // 实际应该从API获取
    }));
  }, [categories]);

  const total = useMemo(() => {
    return stats.reduce((sum, stat) => sum + stat.count, 0);
  }, [stats]);

  return {
    stats,
    total,
    loading,
    error,
  };
}

/**
 * 分类验证Hook
 */
export function useCategoryValidator(type?: CategoryType): {
  isValidCategory: (name: string) => boolean;
  getValidCategories: () => string[];
  loading: boolean;
} {
  const { categoryMap, loading } = useCategoryService({ type });
  
  const isValidCategory = useCallback((name: string): boolean => {
    return categoryMap.has(name);
  }, [categoryMap]);

  const getValidCategories = useCallback((): string[] => {
    return Array.from(categoryMap.keys());
  }, [categoryMap]);

  return {
    isValidCategory,
    getValidCategories,
    loading,
  };
}

/**
 * 分类搜索Hook
 */
export function useCategorySearch(type?: CategoryType): {
  categories: CategoryInfo[];
  searchCategories: (query: string) => CategoryInfo[];
  loading: boolean;
  error: string | null;
} {
  const { categories, loading, error } = useCategoryService({ type });
  
  const searchCategories = useCallback((query: string): CategoryInfo[] => {
    if (!query.trim()) {
      return categories;
    }

    const lowerQuery = query.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(lowerQuery) ||
      category.name_en?.toLowerCase().includes(lowerQuery) ||
      category.description?.toLowerCase().includes(lowerQuery)
    );
  }, [categories]);

  return {
    categories,
    searchCategories,
    loading,
    error,
  };
}

/**
 * 多类型分类Hook - 同时获取多种类型的分类
 */
export function useMultiTypeCategoryService(types: CategoryType[]): {
  categoriesByType: Record<CategoryType, CategoryInfo[]>;
  allCategories: CategoryInfo[];
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
} {
  const [categoriesByType, setCategoriesByType] = useState<Record<CategoryType, CategoryInfo[]>>({} as any);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        types.map(async (type) => {
          const categories = await categoryService.getCategories(type);
          return { type, categories };
        })
      );

      const newCategoriesByType = {} as Record<CategoryType, CategoryInfo[]>;
      results.forEach(({ type, categories }) => {
        newCategoriesByType[type] = categories;
      });

      setCategoriesByType(newCategoriesByType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取分类数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [types]);

  const allCategories = useMemo(() => {
    return Object.values(categoriesByType).flat();
  }, [categoriesByType]);

  useEffect(() => {
    if (types.length > 0) {
      fetchAllCategories();
    }
  }, [fetchAllCategories, types]);

  return {
    categoriesByType,
    allCategories,
    loading,
    error,
    refreshAll: fetchAllCategories,
  };
}
