/**
 * 统一分类服务 - 简化版
 * 直接使用数据库icon字段，不使用智能生成逻辑
 */

import { getCategories } from '@/lib/api';
import { logger } from '@/lib/error-handler';

// 分类类型
export type CategoryType = 'chat' | 'image' | 'video';

// 分类信息接口
export interface CategoryInfo {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  type: CategoryType;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  optimization_template?: string; // 提示词优化模板
}

// 分类显示信息接口
export interface CategoryDisplayInfo {
  name: string;
  color: string;
  gradient: string;
  iconName: string | null;
  iconComponent?: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
}

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * 统一分类服务类
 */
class CategoryService {
  private cache = new Map<string, CacheItem<CategoryInfo[]>>();
  private categoryMapCache = new Map<string, CacheItem<Map<string, CategoryInfo>>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取分类列表（带缓存）
   */
  async getCategories(type?: CategoryType): Promise<CategoryInfo[]> {
    const cacheKey = type || 'all';
    const cached = this.cache.get(cacheKey);

    // 检查缓存是否有效
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      // 调用API获取完整的分类信息
      const categoriesData = await getCategories(type);

      // 转换为CategoryInfo格式
      const categories: CategoryInfo[] = categoriesData.map((category) => ({
        id: category.id,
        name: category.name,
        name_en: category.name_en,
        icon: category.icon,
        description: category.description,
        type: category.type as CategoryType,
        sort_order: category.sort_order,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
        optimization_template: category.optimization_template,
      }));

      // 更新缓存
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_TTL,
      });

      logger.info('成功获取分类数据', { type, count: categories.length });
      return categories;

    } catch (error) {
      logger.error('获取分类数据失败', error instanceof Error ? error : new Error(String(error)));

      // 尝试使用过期缓存
      if (cached) {
        logger.warn('使用过期缓存数据', { type });
        return cached.data;
      }

      // 最后降级：返回空数组
      return [];
    }
  }

  /**
   * 获取分类映射（名称 -> CategoryInfo）
   */
  async getCategoryMap(type?: CategoryType): Promise<Map<string, CategoryInfo>> {
    const cacheKey = type || 'all';
    const cached = this.categoryMapCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const categories = await this.getCategories(type);
      const categoryMap = new Map<string, CategoryInfo>();
      
      categories.forEach(category => {
        categoryMap.set(category.name, category);
      });

      // 更新缓存
      this.categoryMapCache.set(cacheKey, {
        data: categoryMap,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_TTL,
      });

      return categoryMap;

    } catch (error) {
      logger.error('获取分类映射失败', error instanceof Error ? error : new Error(String(error)));
      return new Map();
    }
  }

  /**
   * 获取分类的显示信息 - 只使用数据库icon字段
   */
  getCategoryDisplayInfo(categoryName: string, categoryData?: CategoryInfo): CategoryDisplayInfo {
    // 只使用数据库中的icon字段，如果没有就返回null
    const iconName = categoryData?.icon || null;
    const categoryType = categoryData?.type || 'chat';

    return {
      name: categoryData?.name || categoryName,
      color: this.getColorByType(categoryType),
      gradient: this.getGradientByType(categoryType),
      iconName,
    };
  }

  /**
   * 根据分类类型获取颜色
   */
  private getColorByType(type: CategoryType): string {
    switch (type) {
      case 'chat':
        return 'from-neon-purple to-neon-blue';
      case 'image':
        return 'from-pink-500 to-purple-500';
      case 'video':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  }

  /**
   * 根据分类类型获取渐变
   */
  private getGradientByType(type: CategoryType): string {
    switch (type) {
      case 'chat':
        return 'from-neon-purple/20 to-neon-blue/20';
      case 'image':
        return 'from-pink-500/20 to-purple-500/20';
      case 'video':
        return 'from-red-500/20 to-orange-500/20';
      default:
        return 'from-gray-500/20 to-gray-600/20';
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.categoryMapCache.clear();
    logger.info('分类服务缓存已清除');
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      categoriesCache: this.cache.size,
      categoryMapCache: this.categoryMapCache.size,
      cacheTTL: this.CACHE_TTL,
    };
  }
}

// 导出单例
export const categoryService = new CategoryService();
export default categoryService;