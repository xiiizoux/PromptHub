/**
 * 分类相关类型定义
 * 统一管理所有分类相关的TypeScript类型
 */

import React from 'react';

// 分类类型枚举
export type CategoryType = 'chat' | 'image' | 'video';

// 基础分类信息接口（与数据库结构对应）
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

// 分类显示信息接口（前端显示用）
export interface CategoryDisplayInfo {
  name: string;
  color: string;
  gradient: string;
  iconName: string | null;
  iconComponent?: React.ComponentType<{ className?: string }>;
}

// 分类统计信息接口
export interface CategoryStats {
  name: string;
  count: number;
  percentage: number;
  type: CategoryType;
}

// 分类过滤器接口
export interface CategoryFilter {
  type?: CategoryType;
  isActive?: boolean;
  search?: string;
}

// 分类服务配置接口
export interface CategoryServiceConfig {
  cacheTTL?: number;
  enableCache?: boolean;
  fallbackToDefault?: boolean;
}

// 分类API响应接口
export interface CategoryApiResponse {
  categories: string[];
  total: number;
  type?: CategoryType;
}

// 分类映射类型
export type CategoryMap = Map<string, CategoryInfo>;
export type CategoryDisplayMap = Record<string, CategoryDisplayInfo>;

// 分类相关的Hook返回类型
export interface UseCategoryServiceReturn {
  categories: CategoryInfo[];
  categoryMap: CategoryMap;
  loading: boolean;
  error: string | null;
  getCategoryDisplayInfo: (name: string) => CategoryDisplayInfo;
  refreshCategories: () => Promise<void>;
  clearCache: () => void;
}

// 分类选择器组件Props
export interface CategorySelectorProps {
  value?: string;
  onChange: (category: string) => void;
  type?: CategoryType;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

// 分类标签组件Props
export interface CategoryTagProps {
  category: string;
  type?: CategoryType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  clickable?: boolean;
  onClick?: (category: string) => void;
  className?: string;
}

// 分类过滤组件Props
export interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  type?: CategoryType;
  maxSelection?: number;
  showSearch?: boolean;
  className?: string;
}

// 分类统计组件Props
export interface CategoryStatsProps {
  stats: CategoryStats[];
  type?: CategoryType;
  showPercentage?: boolean;
  className?: string;
}

// 分类相关的常量
export const CATEGORY_TYPES: CategoryType[] = ['chat', 'image', 'video'];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  chat: '对话',
  image: '图片',
  video: '视频',
};

// 默认分类名称已废弃 - 所有分类数据应从数据库动态获取
// export const DEFAULT_CATEGORY_NAMES = { ... } // 已删除

// 分类验证函数类型
export type CategoryValidator = (category: string, type?: CategoryType) => boolean;

// 分类转换函数类型
export type CategoryTransformer = (category: string) => string;

// 分类排序函数类型
export type CategorySorter = (a: CategoryInfo, b: CategoryInfo) => number;

// 导出所有类型的联合类型，便于类型检查
export type CategoryRelatedTypes = 
  | CategoryInfo
  | CategoryDisplayInfo
  | CategoryStats
  | CategoryFilter
  | CategoryServiceConfig
  | CategoryApiResponse
  | UseCategoryServiceReturn
  | CategorySelectorProps
  | CategoryTagProps
  | CategoryFilterProps
  | CategoryStatsProps;
