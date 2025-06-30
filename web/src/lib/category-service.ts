import { TagIcon } from '@heroicons/react/24/outline';

export interface CategoryInfo {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  type: 'chat' | 'image' | 'video';
  sort_order?: number;
  color?: string;
  gradient?: string;
}

export interface CategoryDisplayConfig {
  name: string;
  color: string;
  gradient: string;
  icon: any;
}

// 默认显示配置 - 基于分类类型
const DEFAULT_DISPLAY_CONFIG = {
  chat: {
    color: 'from-neon-purple to-neon-blue',
    gradient: 'from-neon-purple/20 to-neon-blue/20',
    icon: TagIcon
  },
  image: {
    color: 'from-neon-pink to-neon-purple',
    gradient: 'from-neon-pink/20 to-neon-purple/20',
    icon: TagIcon
  },
  video: {
    color: 'from-neon-cyan to-neon-blue',
    gradient: 'from-neon-cyan/20 to-neon-blue/20',
    icon: TagIcon
  }
};

// 通过emoji转换为图标类型
function getIconFromEmoji(emoji?: string): any {
  // 在实际应用中，这里可以实现emoji到HeroIcon的映射
  // 暂时返回默认图标
  return TagIcon;
}

// 生成动态颜色配置
function generateDynamicColor(categoryName: string, type: 'chat' | 'image' | 'video'): string {
  // 基于分类名称生成一致的颜色
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorSets = {
    chat: [
      'from-neon-purple to-neon-blue',
      'from-neon-blue to-neon-cyan',
      'from-neon-green to-neon-yellow',
      'from-neon-pink to-neon-yellow',
      'from-neon-cyan to-neon-blue'
    ],
    image: [
      'from-neon-pink to-neon-red',
      'from-neon-purple to-neon-pink',
      'from-neon-yellow to-neon-orange',
      'from-neon-cyan to-neon-purple',
      'from-neon-blue to-neon-green'
    ],
    video: [
      'from-neon-orange to-neon-red',
      'from-neon-red to-neon-pink',
      'from-neon-yellow to-neon-green',
      'from-neon-green to-neon-blue',
      'from-neon-pink to-neon-purple'
    ]
  };
  
  const colors = colorSets[type];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * 将数据库分类转换为显示配置
 */
export function convertCategoryToDisplayConfig(category: CategoryInfo): CategoryDisplayConfig {
  const baseConfig = DEFAULT_DISPLAY_CONFIG[category.type];
  const color = generateDynamicColor(category.name, category.type);
  
  return {
    name: category.name,
    color: color,
    gradient: color.replace(/from-(\w+-\w+)/g, 'from-$1/20').replace(/to-(\w+-\w+)/g, 'to-$1/20'),
    icon: getIconFromEmoji(category.icon) || baseConfig.icon
  };
}

/**
 * 获取分类的显示配置
 * @param categoryName 分类名称
 * @param categories 所有分类数据
 * @param type 分类类型
 */
export function getCategoryDisplayConfig(
  categoryName: string | undefined, 
  categories: CategoryInfo[], 
  type: 'chat' | 'image' | 'video' = 'chat'
): CategoryDisplayConfig {
  if (!categoryName) {
    const baseConfig = DEFAULT_DISPLAY_CONFIG[type];
    return {
      name: type === 'chat' ? '通用对话' : type === 'image' ? '图像生成' : '视频生成',
      ...baseConfig
    };
  }

  const category = categories.find(c => c.name === categoryName && c.type === type);
  
  if (category) {
    return convertCategoryToDisplayConfig(category);
  }

  // 如果找不到分类，返回基于名称的动态配置
  const baseConfig = DEFAULT_DISPLAY_CONFIG[type];
  return {
    name: categoryName,
    color: generateDynamicColor(categoryName, type),
    gradient: generateDynamicColor(categoryName, type).replace(/from-(\w+-\w+)/g, 'from-$1/20').replace(/to-(\w+-\w+)/g, 'to-$1/20'),
    icon: baseConfig.icon
  };
}

// 分类数据缓存
let categoriesCache: { [key: string]: CategoryInfo[] } = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取指定类型的分类列表（带缓存）
 */
export async function getCategoriesByType(type: 'chat' | 'image' | 'video'): Promise<CategoryInfo[]> {
  const now = Date.now();
  const cacheKey = type;
  
  // 检查缓存
  if (categoriesCache[cacheKey] && (now - lastCacheUpdate) < CACHE_DURATION) {
    return categoriesCache[cacheKey];
  }

  try {
    const response = await fetch(`/api/categories?type=${type}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    const categories: CategoryInfo[] = await response.json();
    
    // 更新缓存
    categoriesCache[cacheKey] = categories;
    lastCacheUpdate = now;
    
    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    
    // 返回缓存的数据（如果有的话）
    if (categoriesCache[cacheKey]) {
      return categoriesCache[cacheKey];
    }
    
    // 返回空数组作为降级方案
    return [];
  }
}

/**
 * 清除分类缓存
 */
export function clearCategoriesCache(): void {
  categoriesCache = {};
  lastCacheUpdate = 0;
}

/**
 * 预加载所有类型的分类数据
 */
export async function preloadAllCategories(): Promise<void> {
  const types: ('chat' | 'image' | 'video')[] = ['chat', 'image', 'video'];
  await Promise.all(types.map(type => getCategoriesByType(type)));
}