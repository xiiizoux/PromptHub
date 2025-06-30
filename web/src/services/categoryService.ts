/**
 * 统一分类服务 - 解决硬编码分类问题
 * 
 * 这个服务类提供：
 * 1. 统一的分类数据获取接口
 * 2. 智能缓存机制
 * 3. 错误处理和降级机制
 * 4. 分类显示信息映射
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
}

// 分类显示信息接口
export interface CategoryDisplayInfo {
  name: string;
  color: string;
  gradient: string;
  iconName: string;
  iconComponent?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * 动态分类显示信息生成器
 * 不再使用硬编码映射，而是基于分类名称智能生成显示信息
 */
class CategoryDisplayGenerator {
  /**
   * 基于分类名称生成显示信息
   */
  generateDisplayInfo(categoryName: string): CategoryDisplayInfo {
    // 基于分类名称的关键词匹配生成颜色和图标
    const colorAndIcon = this.getColorAndIconByKeywords(categoryName);

    return {
      name: categoryName,
      color: colorAndIcon.color,
      gradient: colorAndIcon.gradient,
      iconName: colorAndIcon.iconName,
    };
  }

  /**
   * 基于关键词匹配生成颜色和图标
   */
  private getColorAndIconByKeywords(categoryName: string): {
    color: string;
    gradient: string;
    iconName: string;
  } {
    // 关键词匹配规则
    const keywordRules = [
      // 对话交流类
      { keywords: ['对话', '交流', '聊天', '沟通'], color: 'from-neon-purple to-neon-blue', gradient: 'from-neon-purple/20 to-neon-blue/20', iconName: 'SparklesIcon' },

      // 学术研究类
      { keywords: ['学术', '研究', '论文', '科研'], color: 'from-neon-blue to-neon-cyan', gradient: 'from-neon-blue/20 to-neon-cyan/20', iconName: 'AcademicCapIcon' },

      // 编程开发类
      { keywords: ['编程', '开发', '代码', '程序'], color: 'from-neon-cyan to-neon-cyan-dark', gradient: 'from-neon-cyan/20 to-neon-cyan-dark/20', iconName: 'CodeBracketIcon' },

      // 文案写作类
      { keywords: ['文案', '写作', '创作', '文字'], color: 'from-neon-pink to-neon-yellow', gradient: 'from-neon-pink/20 to-neon-yellow/20', iconName: 'PencilIcon' },

      // 翻译语言类
      { keywords: ['翻译', '语言', '多语言'], color: 'from-neon-blue to-neon-cyan', gradient: 'from-neon-blue/20 to-neon-cyan/20', iconName: 'LanguageIcon' },

      // 摄影图像类
      { keywords: ['摄影', '拍摄', '照片'], color: 'from-pink-500 to-red-500', gradient: 'from-pink-500/20 to-red-500/20', iconName: 'CameraIcon' },

      // 艺术绘画类
      { keywords: ['艺术', '绘画', '美术', '画作'], color: 'from-purple-500 to-pink-500', gradient: 'from-purple-500/20 to-pink-500/20', iconName: 'PaintBrushIcon' },

      // 动漫插画类
      { keywords: ['动漫', '插画', '卡通', '漫画'], color: 'from-pink-500 to-yellow-500', gradient: 'from-pink-500/20 to-yellow-500/20', iconName: 'PencilIcon' },

      // 设计类
      { keywords: ['设计', 'Logo', '标志'], color: 'from-orange-500 to-red-500', gradient: 'from-orange-500/20 to-red-500/20', iconName: 'SwatchIcon' },

      // 建筑空间类
      { keywords: ['建筑', '空间', '室内'], color: 'from-red-500 to-pink-500', gradient: 'from-red-500/20 to-pink-500/20', iconName: 'BuildingOfficeIcon' },

      // 故事叙述类
      { keywords: ['故事', '叙述', '剧本'], color: 'from-orange-500 to-red-500', gradient: 'from-orange-500/20 to-red-500/20', iconName: 'BookOpenIcon' },

      // 动画特效类
      { keywords: ['动画', '特效', '效果'], color: 'from-red-500 to-pink-500', gradient: 'from-red-500/20 to-pink-500/20', iconName: 'CubeTransparentIcon' },

      // 产品展示类
      { keywords: ['产品', '展示', '商品'], color: 'from-yellow-500 to-green-500', gradient: 'from-yellow-500/20 to-green-500/20', iconName: 'ShoppingBagIcon' },

      // 自然风景类
      { keywords: ['自然', '风景', '景观'], color: 'from-green-500 to-blue-500', gradient: 'from-green-500/20 to-blue-500/20', iconName: 'MapIcon' },

      // 人物肖像类
      { keywords: ['人物', '肖像', '头像'], color: 'from-blue-500 to-purple-500', gradient: 'from-blue-500/20 to-purple-500/20', iconName: 'UserIcon' },

      // 广告营销类
      { keywords: ['广告', '营销', '推广'], color: 'from-purple-500 to-pink-500', gradient: 'from-purple-500/20 to-pink-500/20', iconName: 'MegaphoneIcon' },
    ];

    // 查找匹配的规则
    for (const rule of keywordRules) {
      if (rule.keywords.some(keyword => categoryName.includes(keyword))) {
        return {
          color: rule.color,
          gradient: rule.gradient,
          iconName: rule.iconName,
        };
      }
    }

    // 默认样式
    return {
      color: 'from-gray-500 to-gray-600',
      gradient: 'from-gray-500/20 to-gray-600/20',
      iconName: 'QuestionMarkCircleIcon',
    };
  }
}

// 创建显示信息生成器实例
const displayGenerator = new CategoryDisplayGenerator();

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
      // 调用API获取分类
      const categoryNames = await getCategories(type);
      
      // 转换为CategoryInfo格式
      const categories: CategoryInfo[] = categoryNames.map((name, index) => ({
        id: `category-${name}`,
        name,
        type: type || 'chat',
        sort_order: index,
        is_active: true,
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

      // 最后降级：返回默认分类
      return this.getDefaultCategories(type);
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

      // 降级：返回空映射
      return new Map();
    }
  }

  /**
   * 获取分类的显示信息 - 动态生成
   */
  getCategoryDisplayInfo(categoryName: string): CategoryDisplayInfo {
    // 使用动态生成器生成显示信息
    return displayGenerator.generateDisplayInfo(categoryName);
  }

  /**
   * 获取默认分类（降级机制） - 不再使用硬编码
   * 当API完全失败时，返回空数组，让UI显示适当的错误信息
   */
  private getDefaultCategories(type?: CategoryType): CategoryInfo[] {
    // 不再提供硬编码的默认分类
    // 如果API失败，应该显示错误信息而不是使用过时的硬编码数据
    logger.warn('API获取分类失败，无法提供默认分类', { type });
    return [];
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
