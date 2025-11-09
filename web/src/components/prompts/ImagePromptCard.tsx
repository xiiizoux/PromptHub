import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInfo } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useOptimizedCategoryDisplay } from '@/contexts/CategoryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface ImagePromptCardProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video';
    preview_asset_url?: string;
    thumbnail_url?: string; // 添加缩略图支持
    parameters?: Record<string, any>;
  };
}

// 使用统一的分类配置系统

const ImagePromptCard: React.FC<ImagePromptCardProps> = React.memo(({ prompt }) => {
  const { t, language } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // 使用优化的分类显示Hook，无延迟加载
  const categoryInfo = useOptimizedCategoryDisplay(prompt?.category || '真实摄影', 'image');

  // 格式化日期函数 - 根据语言选择 locale
  const formatDate = (dateString?: string) => {
    if (!dateString) {return t('common.unknown_date');}
    const date = new Date(dateString);
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
    });
  };

  // 懒加载：只有当卡片进入可视区域时才加载图像
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px', // 提前50px开始加载
    freezeOnceVisible: true, // 一旦可见就保持状态
  });

  const rating = useMemo(() => {
    if (!prompt) {return { value: 0, percentage: 0 };}
    const ratingValue = prompt.average_rating !== undefined ? prompt.average_rating : (prompt.rating || 0);
    const percentage = (ratingValue / 5) * 100;
    return { value: ratingValue, percentage };
  }, [prompt]);

  const tagsToShow = useMemo(() => {
    if (!prompt?.tags || prompt.tags.length === 0) {return null;}
    return {
      visible: prompt.tags.slice(0, 2), // 图像卡片显示较少标签，留更多空间给预览
      remaining: Math.max(0, prompt.tags.length - 2),
    };
  }, [prompt]);

  // 如果没有必要的数据，不渲染 - 移到hooks之后
  if (!prompt || !prompt.id) {
    return null;
  }

  // 获取缩略图URL（低质量快速加载版本）
  const getThumbnailUrl = () => {
    // 优先使用专门的缩略图
    if (prompt.thumbnail_url) {
      return prompt.thumbnail_url;
    }
    
    // 尝试从parameters中获取缩略图
    if (prompt.parameters?.thumbnail_url) {
      return prompt.parameters.thumbnail_url;
    }
    
    // 如果有原图，生成缩略图版本（较小尺寸）
    const originalUrl = getOriginalImageUrl();
    if (originalUrl && originalUrl.includes('unsplash.com')) {
      // 为unsplash图片添加缩略图参数
      return originalUrl.replace(/w=\d+&h=\d+/, 'w=200&h=150');
    }
    
    return null;
  };

  // 获取原始图片URL（高质量版本）
  const getOriginalImageUrl = () => {
    if (prompt.preview_asset_url) {
      return prompt.preview_asset_url;
    }

    // 备用方案：从parameters.media_files获取第一个文件
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
      return prompt.parameters.media_files[0].url;
    }

    // 使用适合AI图像生成的艺术感占位符图片 - 抽象艺术/创意设计
    return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&auto=format&q=80';
  };

  // 获取当前应该显示的图片URL
  const getCurrentImageUrl = () => {
    if (!isVisible) {
      return null; // 不可见时不加载任何图片
    }
    
    const thumbnailUrl = getThumbnailUrl();
    const originalUrl = getOriginalImageUrl();
    
    // 如果有缩略图且还没显示完整图片，显示缩略图
    if (thumbnailUrl && !showFullImage) {
      return thumbnailUrl;
    }
    
    // 否则显示原图
    return originalUrl;
  };

  return (
    <div ref={elementRef}>
      <Link href={`/prompts/${prompt.id}`}>
        <motion.div
          className="card glass border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => {
            setIsHovered(true);
            // 悬停时加载高质量图片
            if (isVisible && getThumbnailUrl() && !showFullImage) {
              setShowFullImage(true);
            }
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 背景渐变 */}
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            categoryInfo.gradient,
          )} />
          
          {/* 预览图像区域 - 画廊模式 */}
          <div className="relative h-56 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 flex-shrink-0 mb-4">
            {isVisible ? (
              <>
                {getCurrentImageUrl() ? (
                  <Image 
                    src={getCurrentImageUrl()!}
                    alt={prompt.name || t('prompts.image')}
                    fill
                    className={clsx(
                      'object-cover transition-all duration-500',
                      imageLoaded ? 'opacity-100' : 'opacity-0',
                      'group-hover:scale-110',
                    )}
                    onLoad={() => {
                      setImageLoaded(true);
                      // 如果是缩略图加载完成，延迟加载高质量图片
                      if (getThumbnailUrl() && !showFullImage) {
                        setTimeout(() => {
                          setShowFullImage(true);
                        }, 50); // 减少到50ms，更快加载高质量图片
                      }
                    }}
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                ) : null}
                
                {/* 加载状态 */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mb-2"></div>
                    <p className="text-xs text-gray-400">
                      {getThumbnailUrl() && !showFullImage ? t('prompts.loading_thumbnail') : t('prompts.loading_image')}
                    </p>
                  </div>
                )}
                
                {/* 错误状态 */}
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-500 mb-2" />
                    <p className="text-xs text-gray-500">{t('prompts.image_load_failed')}</p>
                  </div>
                )}
              </>
            ) : (
              /* 懒加载占位符 */
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-700/60">
                <div className="text-center">
                  <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('prompts.image_preview')}</p>
                </div>
              </div>
            )}
              
            {/* 顶部标签栏 */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* 图像类型标识 */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-pink-500/20 backdrop-blur-md border border-pink-500/30">
                <PhotoIcon className="h-3 w-3 text-pink-400" />
                <span className="text-xs text-pink-400 font-medium">{t('prompts.image')}</span>
              </div>
              
              {/* 热门标签 */}
              {(prompt.usageCount || 0) > 100 && (
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30">
                  <FireIcon className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400 font-medium">{t('prompts.trending')}</span>
                </div>
              )}
            </div>
            
            {/* 悬停时显示查看按钮 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-pink-500/30">
                    <EyeIcon className="h-4 w-4 text-white" />
                    <span className="text-sm text-white font-medium">{t('prompts.view_details')}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 底部渐变遮罩，用于更好的文字可读性 */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
          
          {/* 内容区域 - 紧凑但信息丰富 */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* 标题与分类图标 */}
            <div className="relative flex items-start mb-2">
              <div className="flex items-start space-x-2 flex-1">
                <div className={clsx(
                  'inline-flex p-2 rounded-lg bg-gradient-to-br flex-shrink-0',
                  categoryInfo.color,
                )}>
                  {categoryInfo.iconComponent && React.createElement(categoryInfo.iconComponent, {
                    className: 'h-4 w-4 text-dark-bg-primary',
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-pink-400 transition-colors">
                    {prompt.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">{categoryInfo.name}</div>
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div className="text-sm text-gray-400 mb-4 h-[4.5rem] flex items-start">
              <p className="line-clamp-3 leading-6">
                {prompt.description || t('prompts.no_description')}
              </p>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tagsToShow ? (
                <>
                  {tagsToShow.visible.map((tag, index) => (
                    <span
                      key={`${prompt.id}-tag-${tag}-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-pink-500/20 text-pink-400"
                    >
                      #{tag}
                    </span>
                  ))}
                  {tagsToShow.remaining > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-gray-600 text-gray-400">
                      +{tagsToShow.remaining}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500">{t('prompts.no_tags')}</span>
              )}
            </div>
            
            {/* 底部信息 */}
            <div className="mt-auto pt-4 border-t border-pink-500/10 space-y-3">
              {/* 第一行：评分与日期 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  {rating.value > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                          style={{ width: `${rating.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{rating.value.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">{t('rating.no_rating')}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatDate(prompt.updated_at || prompt.created_at)}</span>
                </div>
              </div>
              
              {/* 第二行：作者版本信息与互动按钮 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{prompt.author || t('prompts.anonymous')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-3 w-3" />
                    <span>v{formatVersionDisplay(prompt.version)}</span>
                  </div>
                </div>
                <div onClick={(e) => e.preventDefault()}>
                  <InteractionButtons promptId={prompt.id} size="sm" />
                </div>
              </div>
            </div>
          </div>
          
          {/* 悬停时的边框动画 */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 rounded-2xl animate-border-beam" 
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
});

ImagePromptCard.displayName = 'ImagePromptCard';

export default ImagePromptCard;