import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInfo } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useOptimizedCategoryDisplay } from '@/contexts/CategoryContext';
import { 
  DocumentTextIcon, 
  PhotoIcon,
  FilmIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface UserMediaPromptCardProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video';
    preview_asset_url?: string;
    thumbnail_url?: string;
    parameters?: Record<string, any>;
    is_public?: boolean;
  };
  showPublicStatus?: boolean; // 控制是否显示公开/私有状态
}

// 使用动态分类配置系统

// 格式化日期函数
const formatDate = (dateString?: string) => {
  if (!dateString) {return '未知日期';}
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
  });
};

const UserMediaPromptCard: React.FC<UserMediaPromptCardProps> = React.memo(({ prompt, showPublicStatus = false }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullMedia, setShowFullMedia] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // 使用优化的分类显示Hook
  const categoryInfo = useOptimizedCategoryDisplay(
    prompt?.category || '',
    (prompt.category_type || 'chat') as 'chat' | 'image' | 'video',
  );

  // 懒加载：只有当卡片进入可视区域时才加载媒体
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true,
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
      visible: prompt.tags.slice(0, 2),
      remaining: Math.max(0, prompt.tags.length - 2),
    };
  }, [prompt]);

  // 初始化视频URL - 只有在组件可见时才初始化
  // Note: This must be before any early returns to follow React Hooks rules
  useEffect(() => {
    if (!isVisible || prompt?.category_type !== 'video') {
      return;
    }

    const getPrimaryMediaUrl = () => {
      if (prompt?.preview_asset_url) {
        return prompt.preview_asset_url;
      }

      if (prompt?.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
        return prompt.parameters.media_files[0].url;
      }

      return null;
    };

    const getFallbackMediaUrl = () => {
      if (prompt?.category_type === 'video') {
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }
      return null;
    };

    const primaryUrl = getPrimaryMediaUrl();
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      setCurrentVideoUrl(primaryUrl || getFallbackMediaUrl());
      setHasTriedFallback(!primaryUrl);
    });
  }, [isVisible, prompt?.category_type]);

  // 如果没有必要的数据，不渲染
  if (!prompt || !prompt.id) {
    return null;
  }

  // 获取缩略图URL
  const getThumbnailUrl = () => {
    if (prompt.thumbnail_url) {
      return prompt.thumbnail_url;
    }
    
    if (prompt.parameters?.thumbnail_url) {
      return prompt.parameters.thumbnail_url;
    }
    
    const originalUrl = getOriginalMediaUrl();
    if (originalUrl && originalUrl.includes('unsplash.com')) {
      return originalUrl.replace(/w=\d+&h=\d+/, 'w=200&h=150');
    }
    
    return null;
  };

  // 获取主要媒体URL（不包括占位符）
  const getPrimaryMediaUrl = () => {
    if (prompt.preview_asset_url) {
      return prompt.preview_asset_url;
    }

    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
      return prompt.parameters.media_files[0].url;
    }

    return null;
  };

  // 获取占位符媒体URL
  const getFallbackMediaUrl = () => {
    if (prompt.category_type === 'video') {
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    } else if (prompt.category_type === 'image') {
      return 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&auto=format&q=80';
    }

    return null;
  };

  // 获取原始媒体URL（包括占位符）
  const getOriginalMediaUrl = () => {
    const primaryUrl = getPrimaryMediaUrl();
    if (primaryUrl) {
      return primaryUrl;
    }

    return getFallbackMediaUrl();
  };

  // 获取当前应该显示的媒体URL
  const getCurrentMediaUrl = () => {
    if (!isVisible) {
      return null;
    }

    const thumbnailUrl = getThumbnailUrl();

    if (thumbnailUrl && !showFullMedia) {
      return thumbnailUrl;
    }

    // 对于视频，使用专门的视频URL逻辑
    if (prompt.category_type === 'video') {
      if (currentVideoUrl) {
        return currentVideoUrl;
      }

      const primaryUrl = getPrimaryMediaUrl();
      if (primaryUrl && !hasTriedFallback) {
        return primaryUrl;
      }

      return getFallbackMediaUrl();
    }

    // 对于图片，使用原始逻辑
    return getOriginalMediaUrl();
  };

  // 重置媒体状态
  const resetMediaState = () => {
    setMediaLoaded(false);
    setMediaError(false);
    setIsPlaying(false);
  };

  // 切换到占位符视频
  const switchToFallback = () => {
    if (!hasTriedFallback && prompt.category_type === 'video') {
      setHasTriedFallback(true);
      setCurrentVideoUrl(getFallbackMediaUrl());
      resetMediaState();

      // 触发视频重新加载
      if (videoRef.current) {
        videoRef.current.load();
      }
    } else {
      setMediaError(true);
    }
  };

  // 处理视频播放/暂停
  const handleVideoToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // 悬停处理
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVisible && getThumbnailUrl() && !showFullMedia) {
      setShowFullMedia(true);
    }
    
    // 对于视频，悬停时自动播放
    if (prompt.category_type === 'video' && videoRef.current && !isPlaying) {
      setTimeout(() => {
        if (videoRef.current && isHovered) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 800);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // 对于视频，离开时自动暂停
    if (prompt.category_type === 'video' && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 获取边框颜色
  const getBorderColor = () => {
    switch (prompt.category_type) {
      case 'image':
        return 'border-pink-500/20 hover:border-pink-500/40';
      case 'video':
        return 'border-red-500/20 hover:border-red-500/40';
      default:
        return 'border-neon-cyan/20 hover:border-neon-cyan/40';
    }
  };

  // 获取悬停文字颜色
  const getHoverTextColor = () => {
    switch (prompt.category_type) {
      case 'image':
        return 'group-hover:text-pink-400';
      case 'video':
        return 'group-hover:text-red-400';
      default:
        return 'group-hover:text-neon-cyan';
    }
  };

  const isMediaType = prompt.category_type === 'image' || prompt.category_type === 'video';

  return (
    <div ref={elementRef}>
      <Link href={`/prompts/${prompt.id}`}>
        <motion.div
          className={clsx(
            'card glass border transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col',
            getBorderColor(),
          )}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 背景渐变 */}
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            categoryInfo.gradient,
          )} />
          
          {/* 媒体预览区域 - 只有图片和视频类型才显示 */}
          {isMediaType && (
            <div className="relative h-56 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 flex-shrink-0 mb-4">
              {isVisible ? (
                <>
                  {getCurrentMediaUrl() ? (
                    prompt.category_type === 'video' ? (
                      <video
                        ref={videoRef}
                        src={getCurrentMediaUrl()!}
                        className={clsx(
                          'w-full h-full object-cover transition-all duration-500',
                          mediaLoaded ? 'opacity-100' : 'opacity-0',
                          'group-hover:scale-110',
                        )}
                        onLoadStart={() => setMediaLoaded(false)}
                        onCanPlay={() => setMediaLoaded(true)}
                        onError={() => {
                          console.log('视频加载失败，尝试切换到占位符视频');
                          switchToFallback();
                        }}
                        onEnded={() => setIsPlaying(false)}
                        muted
                        playsInline
                      />
                    ) : (
                      <Image 
                        src={getCurrentMediaUrl()!}
                        alt={prompt.name || '媒体预览'}
                        fill
                        className={clsx(
                          'object-cover transition-all duration-500',
                          mediaLoaded ? 'opacity-100' : 'opacity-0',
                          'group-hover:scale-110',
                        )}
                        onLoad={() => {
                          setMediaLoaded(true);
                          if (getThumbnailUrl() && !showFullMedia) {
                            setTimeout(() => setShowFullMedia(true), 200);
                          }
                        }}
                        onError={() => setMediaError(true)}
                        unoptimized
                      />
                    )
                  ) : null}
                  
                  {/* 加载状态 */}
                  {!mediaLoaded && !mediaError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={clsx(
                        'animate-spin rounded-full h-8 w-8 border-b-2 mb-2',
                        prompt.category_type === 'image' ? 'border-pink-400' : 'border-red-400',
                      )}></div>
                      <p className="text-xs text-gray-400">
                        {prompt.category_type === 'image' ? '加载图像...' : '加载视频...'}
                      </p>
                    </div>
                  )}
                  
                  {/* 错误状态 */}
                  {mediaError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                      <div className="text-center">
                        {prompt.category_type === 'image' ? (
                          <>
                            <PhotoIcon className="h-12 w-12 text-gray-500 mb-2 mx-auto" />
                            <p className="text-xs text-gray-500 mb-2">图像加载失败</p>
                          </>
                        ) : (
                          <>
                            <div className="text-red-400 text-2xl mb-2">🎬</div>
                            <p className="text-xs text-red-400 mb-2">视频加载失败</p>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (videoRef.current) {
                                  // 如果已经尝试过占位符还是失败，回到主视频重试
                                  if (hasTriedFallback) {
                                    const primaryUrl = getPrimaryMediaUrl();
                                    if (primaryUrl) {
                                      setHasTriedFallback(false);
                                      setCurrentVideoUrl(primaryUrl);
                                    }
                                  }
                                  resetMediaState();
                                  videoRef.current.load();
                                }
                              }}
                              className="text-xs text-gray-400 hover:text-red-400 underline"
                            >
                              重试
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* 懒加载占位符 */
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-700/60">
                  <div className="text-center">
                    {prompt.category_type === 'image' ? (
                      <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                    ) : (
                      <FilmIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-gray-500">
                      {prompt.category_type === 'image' ? '图像预览' : '视频预览'}
                    </p>
                  </div>
                </div>
              )}
                
              {/* 顶部标签栏 */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                {/* 类型标识 */}
                <div className={clsx(
                  'flex items-center space-x-1 px-3 py-1.5 rounded-full backdrop-blur-md border',
                  prompt.category_type === 'image' 
                    ? 'bg-pink-500/20 border-pink-500/30' 
                    : 'bg-sky-200/20 border-sky-200/30',
                )}>
                  {prompt.category_type === 'image' ? (
                    <>
                      <PhotoIcon className="h-3 w-3 text-pink-400" />
                      <span className="text-xs text-pink-400 font-medium">图像</span>
                    </>
                  ) : (
                    <>
                      <FilmIcon className="h-3 w-3 text-sky-200" />
                      <span className="text-xs text-sky-200 font-medium">视频</span>
                    </>
                  )}
                </div>
                
                {/* 热门标签 */}
                {(prompt.usageCount || 0) > 100 && (
                  <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30">
                    <FireIcon className="h-3 w-3 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">热门</span>
                  </div>
                )}
              </div>
              
              {/* 视频播放控制 */}
              {prompt.category_type === 'video' && (
                <AnimatePresence>
                  {isVisible && isHovered && mediaLoaded && !mediaError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleVideoToggle}
                        className="w-16 h-16 bg-sky-200/20 backdrop-blur-md border border-sky-200/30 rounded-full flex items-center justify-center hover:bg-sky-200/30 transition-colors"
                      >
                        {isPlaying ? (
                          <PauseIcon className="h-8 w-8 text-white" />
                        ) : (
                          <PlayIcon className="h-8 w-8 text-white ml-1" />
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              
              {/* 图像查看按钮 */}
              {prompt.category_type === 'image' && (
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
                        <span className="text-sm text-white font-medium">查看详情</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              
              {/* 底部渐变遮罩 */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
          )}
          
          {/* 内容区域 */}
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
                  <h3 className={clsx(
                    'text-lg font-semibold text-white line-clamp-1 transition-colors',
                    getHoverTextColor(),
                  )}>
                    {prompt.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">{categoryInfo.name}</div>
                </div>
              </div>
              
              {/* 公开/私有状态 */}
              {showPublicStatus && (
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    prompt.is_public 
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                      : 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
                  }`}>
                    {prompt.is_public ? '公开' : '私有'}
                  </span>
                </div>
              )}
            </div>
            
            {/* 描述 - 固定高度确保卡片一致性 */}
            <div className="text-sm text-gray-400 mb-4 h-[4.5rem] flex items-start">
              <p className="line-clamp-3 leading-6">
                {prompt.description || '暂无描述'}
              </p>
            </div>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tagsToShow ? (
                <>
                  {tagsToShow.visible.map((tag, index) => (
                    <span
                      key={`${prompt.id}-tag-${tag}-${index}`}
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border',
                        prompt.category_type === 'image'
                          ? 'border-pink-500/20 text-pink-400'
                          : prompt.category_type === 'video'
                          ? 'border-sky-200/20 text-sky-200'
                          : 'border-neon-cyan/20 text-neon-cyan',
                      )}
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
                <span className="text-xs text-gray-500">暂无标签</span>
              )}
            </div>
            
            {/* 底部信息 */}
            <div className={clsx(
              'mt-auto pt-4 border-t space-y-3',
              prompt.category_type === 'image' 
                ? 'border-pink-500/10' 
                : prompt.category_type === 'video'
                ? 'border-sky-200/10'
                : 'border-neon-cyan/10',
            )}>
              {/* 第一行：评分与日期 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  {rating.value > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            'absolute top-0 left-0 h-full rounded-full',
                            prompt.category_type === 'image' 
                              ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                              : prompt.category_type === 'video'
                              ? 'bg-gradient-to-r from-sky-200 to-blue-300'
                              : 'bg-gradient-to-r from-neon-cyan to-neon-blue',
                          )}
                          style={{ width: `${rating.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{rating.value.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">暂无评分</span>
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
                    <span>{prompt.author || '匿名'}</span>
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
            <div 
              className="absolute inset-0 rounded-2xl animate-border-beam" 
              style={{
                background: prompt.category_type === 'image' 
                  ? 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent)'
                  : prompt.category_type === 'video'
                  ? 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
});

UserMediaPromptCard.displayName = 'UserMediaPromptCard';

export default UserMediaPromptCard;