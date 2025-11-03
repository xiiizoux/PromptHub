/**
 * 分类本地化工具函数
 * 根据当前语言返回对应的分类名称
 */

import { Language } from '@/contexts/LanguageContext';
import { CategoryInfo } from '@/types/category';

/**
 * 根据语言获取分类的本地化名称
 * @param category 分类信息对象（包含 name 和 name_en）
 * @param language 当前语言
 * @param fallback 如果找不到对应的本地化名称，返回的默认值
 * @returns 本地化的分类名称
 */
export function getLocalizedCategoryName(
  category: CategoryInfo | { name: string; name_en?: string } | string,
  language: Language,
  fallback?: string,
): string {
  // 如果传入的是字符串，直接返回（向后兼容）
  if (typeof category === 'string') {
    return fallback || category;
  }

  // 根据语言选择对应的名称
  if (language === 'en') {
    // 英文优先使用 name_en，如果没有则使用 name
    return category.name_en || category.name || fallback || '';
  } else {
    // 中文使用 name
    return category.name || fallback || '';
  }
}

/**
 * 获取分类显示名称（带语言支持）
 * @param categoryName 分类名称（可能是中文或英文）
 * @param categoryData 完整的分类数据对象
 * @param language 当前语言
 * @returns 本地化的分类名称
 */
export function getCategoryDisplayName(
  categoryName: string,
  categoryData: CategoryInfo | undefined,
  language: Language,
): string {
  if (categoryData) {
    return getLocalizedCategoryName(categoryData, language, categoryName);
  }
  
  // 如果没有完整的分类数据，返回原始名称
  return categoryName;
}

