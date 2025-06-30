/**
 * 分类图标映射工具
 * 提供统一的图标组件映射和动态加载功能
 */

import React from 'react';
import {
  SparklesIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  PencilIcon,
  LanguageIcon,
  BriefcaseIcon,
  SwatchIcon,
  PaintBrushIcon,
  BookOpenIcon,
  HeartIcon,
  PuzzlePieceIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  CameraIcon,
  BuildingOfficeIcon,
  CubeTransparentIcon,
  ShoppingBagIcon,
  MapIcon,
  UserIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

// 图标组件映射表
export const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  SparklesIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  PencilIcon,
  LanguageIcon,
  BriefcaseIcon,
  SwatchIcon,
  PaintBrushIcon,
  BookOpenIcon,
  HeartIcon,
  PuzzlePieceIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  CameraIcon,
  BuildingOfficeIcon,
  CubeTransparentIcon,
  ShoppingBagIcon,
  MapIcon,
  UserIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  PhotoIcon,
};

// 默认图标
export const DEFAULT_ICON = QuestionMarkCircleIcon;

/**
 * 根据图标名称获取图标组件
 */
export function getIconComponent(iconName: string): React.ComponentType<any> {
  return ICON_COMPONENTS[iconName] || DEFAULT_ICON;
}

/**
 * 检查图标是否存在
 */
export function hasIcon(iconName: string): boolean {
  return iconName in ICON_COMPONENTS;
}

/**
 * 获取所有可用的图标名称
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(ICON_COMPONENTS);
}

/**
 * 根据分类名称智能推荐图标
 */
export function suggestIconForCategory(categoryName: string): string {
  const suggestions: Record<string, string> = {
    // 通用匹配
    '通用': 'SparklesIcon',
    '学术': 'AcademicCapIcon',
    '编程': 'CodeBracketIcon',
    '文案': 'PencilIcon',
    '翻译': 'LanguageIcon',
    '职业': 'BriefcaseIcon',
    '设计': 'SwatchIcon',
    '绘画': 'PaintBrushIcon',
    '教育': 'BookOpenIcon',
    '情感': 'HeartIcon',
    '游戏': 'PuzzlePieceIcon',
    '生活': 'HomeIcon',
    '商业': 'ChartBarIcon',
    '办公': 'FolderIcon',
    '视频': 'VideoCameraIcon',
    '播客': 'MicrophoneIcon',
    '音乐': 'MusicalNoteIcon',
    '科技': 'CpuChipIcon',
    '金融': 'CurrencyDollarIcon',
    '摄影': 'CameraIcon',
    '建筑': 'BuildingOfficeIcon',
    '动画': 'CubeTransparentIcon',
    '产品': 'ShoppingBagIcon',
    '地图': 'MapIcon',
    '用户': 'UserIcon',
    '营销': 'MegaphoneIcon',
    '图片': 'PhotoIcon',
    '标签': 'TagIcon',
  };

  // 精确匹配
  if (suggestions[categoryName]) {
    return suggestions[categoryName];
  }

  // 模糊匹配
  for (const [key, icon] of Object.entries(suggestions)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return icon;
    }
  }

  // 默认图标
  return 'QuestionMarkCircleIcon';
}

/**
 * 分类类型对应的默认图标
 */
export const TYPE_DEFAULT_ICONS: Record<string, string> = {
  chat: 'SparklesIcon',
  image: 'PhotoIcon',
  video: 'VideoCameraIcon',
};

/**
 * 获取分类类型的默认图标
 */
export function getTypeDefaultIcon(type: string): string {
  return TYPE_DEFAULT_ICONS[type] || 'QuestionMarkCircleIcon';
}

/**
 * 图标尺寸预设
 */
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * 获取图标尺寸类名
 */
export function getIconSizeClass(size: IconSize = 'md'): string {
  return ICON_SIZES[size];
}

/**
 * 图标颜色预设
 */
export const ICON_COLORS = {
  primary: 'text-neon-cyan',
  secondary: 'text-gray-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  white: 'text-white',
  muted: 'text-gray-500',
} as const;

export type IconColor = keyof typeof ICON_COLORS;

/**
 * 获取图标颜色类名
 */
export function getIconColorClass(color: IconColor = 'secondary'): string {
  return ICON_COLORS[color];
}

/**
 * 创建图标组件的工具函数
 */
export function createIconComponent(
  iconName: string,
  size: IconSize = 'md',
  color: IconColor = 'secondary',
  className?: string
): React.ComponentType<any> {
  const IconComponent = getIconComponent(iconName);
  const sizeClass = getIconSizeClass(size);
  const colorClass = getIconColorClass(color);
  
  return (props: any) => React.createElement(IconComponent, {
    ...props,
    className: `${sizeClass} ${colorClass} ${className || ''}`.trim(),
  });
}

/**
 * 批量创建图标组件
 */
export function createIconComponents(
  iconNames: string[],
  size: IconSize = 'md',
  color: IconColor = 'secondary'
): Record<string, React.ComponentType<any>> {
  const components: Record<string, React.ComponentType<any>> = {};
  
  iconNames.forEach(iconName => {
    components[iconName] = createIconComponent(iconName, size, color);
  });
  
  return components;
}

/**
 * 验证图标配置
 */
export function validateIconConfig(config: {
  iconName?: string;
  size?: IconSize;
  color?: IconColor;
}): {
  iconName: string;
  size: IconSize;
  color: IconColor;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  const iconName = config.iconName || 'QuestionMarkCircleIcon';
  if (config.iconName && !hasIcon(config.iconName)) {
    errors.push(`图标 "${config.iconName}" 不存在`);
  }
  
  const size = config.size || 'md';
  if (config.size && !(config.size in ICON_SIZES)) {
    errors.push(`图标尺寸 "${config.size}" 不支持`);
  }
  
  const color = config.color || 'secondary';
  if (config.color && !(config.color in ICON_COLORS)) {
    errors.push(`图标颜色 "${config.color}" 不支持`);
  }
  
  return {
    iconName,
    size,
    color,
    isValid: errors.length === 0,
    errors,
  };
}
