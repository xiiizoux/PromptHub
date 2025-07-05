/**
 * 分类图标映射工具 - 简化版
 * 直接映射数据库icon字段到图标组件
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
  TagIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  UserGroupIcon,
  ScaleIcon,
  PencilSquareIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ClockIcon,
  FilmIcon,
  CalendarIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

// 简单的图标组件映射表
export const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  // 支持数据库中常用的图标名称格式
  'sparkles': SparklesIcon,
  'academic-cap': AcademicCapIcon,
  'code-bracket': CodeBracketIcon,
  'pencil': PencilIcon,
  'language': LanguageIcon,
  'briefcase': BriefcaseIcon,
  'swatch': SwatchIcon,
  'paint-brush': PaintBrushIcon,
  'book-open': BookOpenIcon,
  'heart': HeartIcon,
  'puzzle-piece': PuzzlePieceIcon,
  'home': HomeIcon,
  'chart-bar': ChartBarIcon,
  'folder': FolderIcon,
  'video-camera': VideoCameraIcon,
  'microphone': MicrophoneIcon,
  'musical-note': MusicalNoteIcon,
  'cpu-chip': CpuChipIcon,
  'currency-dollar': CurrencyDollarIcon,
  'camera': CameraIcon,
  'building-office': BuildingOfficeIcon,
  'cube-transparent': CubeTransparentIcon,
  'shopping-bag': ShoppingBagIcon,
  'map': MapIcon,
  'user': UserIcon,
  'megaphone': MegaphoneIcon,
  'tag': TagIcon,
  'photo': PhotoIcon,
  'chat-bubble-left-right': ChatBubbleLeftRightIcon,
  'phone': PhoneIcon,
  'user-group': UserGroupIcon,
  'scale': ScaleIcon,
  'pencil-square': PencilSquareIcon,
  'identification': IdentificationIcon,
  'document-text': DocumentTextIcon,
  'computer-desktop': ComputerDesktopIcon,
  'light-bulb': LightBulbIcon,
  'rocket-launch': RocketLaunchIcon,
  'clock': ClockIcon,
  'film': FilmIcon,
  'calendar': CalendarIcon,
  'cube': CubeIcon,
};

/**
 * 根据图标名称获取图标组件
 * 如果不存在则返回null（不使用回退机制）
 */
export function getIconComponent(iconName: string | null | undefined): React.ComponentType<{ className?: string }> | null {
  if (!iconName) {return null;}
  return ICON_COMPONENTS[iconName] || null;
}

/**
 * 检查图标是否存在
 */
export function hasIcon(iconName: string | null | undefined): boolean {
  return iconName ? iconName in ICON_COMPONENTS : false;
}