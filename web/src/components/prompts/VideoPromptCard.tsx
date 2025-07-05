import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInfo } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useOptimizedCategoryDisplay } from '@/contexts/CategoryContext';
import {
  DocumentTextIcon,
  FilmIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface VideoPromptCardProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video';
    preview_asset_url?: string;
    thumbnail_url?: string; // 添加缩略图URL支持
    parameters?: Record<string, unknown>;
  };
}

// 使用统一的分类配置系统

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

const VideoPromptCard: React.FC<VideoPromptCardProps> = React.memo(({ prompt }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserControlled, setIsUserControlled] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [showVideo, setShowVideo] = useState(false); // 控制是否显示视频（vs缩略图）
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // 使用优化的分类显示Hook，无延迟加载
  const categoryInfo = useOptimizedCategoryDisplay(prompt?.category || '故事叙述', 'video');

  // 懒加载：只有当卡片进入可视区域时才加载视频
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // 提前100px开始加载
    freezeOnceVisible: true, // 一旦可见就保持状态，不再反复切换
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
      visible: prompt.tags.slice(0, 2), // 视频卡片显示较少标签，留更多空间给预览
      remaining: Math.max(0, prompt.tags.length - 2),
    };
  }, [prompt?.tags]);

  // 获取主要视频URL（不包括占位符）
  const getPrimaryVideoUrl = useCallback(() => {
    if (prompt.preview_asset_url) {
      return prompt.preview_asset_url;
    }

    // 备用方案：从parameters.media_files获取第一个文件
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
      return prompt.parameters.media_files[0].url;
    }

    return null;
  }, [prompt.preview_asset_url, prompt.parameters?.media_files]);

  // 获取缩略图URL
  const getThumbnailUrl = useCallback(() => {
    // 优先使用专门的缩略图
    if (prompt.thumbnail_url) {
      return prompt.thumbnail_url;
    }
    
    // 尝试从parameters中获取缩略图
    if (prompt.parameters?.thumbnail_url) {
      return prompt.parameters.thumbnail_url;
    }
    
    // 如果没有专门的缩略图，可以使用默认缩略图
    return null;
  }, [prompt.thumbnail_url, prompt.parameters?.thumbnail_url]);

  // 获取占位符视频URL
  const getFallbackVideoUrl = useCallback(() => {
    // 使用多个备选的占位符视频，优先使用更稳定的源
    const fallbackVideos = [
      // 使用Commondatastorage（更稳定）
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      // 备用地址
      'https://www.w3schools.com/html/movie.mp4',
      // HTML5测试视频
      'https://html5demos.com/assets/dizzy.mp4',
    ];
    return fallbackVideos[0]; // 先尝试第一个
  }, []);

  // 获取当前应该使用的视频URL
  const getCurrentVideoUrl = useCallback(() => {
    if (currentVideoUrl) {
      return currentVideoUrl;
    }
    
    const primaryUrl = getPrimaryVideoUrl();
    if (primaryUrl && !hasTriedFallback) {
      return primaryUrl;
    }

    return getFallbackVideoUrl();
  }, [currentVideoUrl, hasTriedFallback, getPrimaryVideoUrl, getFallbackVideoUrl]);

  // 初始化视频URL - 只有在组件可见时才初始化
  useEffect(() => {
    if (!isVisible) {return;}

    const primaryUrl = getPrimaryVideoUrl();
    setCurrentVideoUrl(primaryUrl || getFallbackVideoUrl());
    setHasTriedFallback(!primaryUrl);

    // 判断是否优先显示缩略图
    const shouldShowThumbnail = getThumbnailUrl() !== null;

    // 如果有缩略图，默认不显示视频
    if (shouldShowThumbnail) {
      setShowVideo(false);
    } else {
      setShowVideo(true);
    }
  }, [isVisible, getPrimaryVideoUrl, getFallbackVideoUrl, getThumbnailUrl]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // 如果没有必要的数据，不渲染
  if (!prompt || !prompt.id) {
    return null;
  }

  // 判断是否优先显示缩略图
  const shouldShowThumbnail = getThumbnailUrl() !== null;

  // 处理视频加载超时
  const handleLoadingTimeout = () => {
    setLoadingTimeout(true);
    setVideoError(true);
  };

  // 重置视频状态
  const resetVideoState = () => {
    setVideoLoaded(false);
    setVideoError(false);
    setLoadingTimeout(false);
    setIsPlaying(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  // 切换到占位符视频
  const switchToFallback = () => {
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      setCurrentVideoUrl(getFallbackVideoUrl());
      resetVideoState();

      // 触发视频重新加载
      if (videoRef.current) {
        videoRef.current.load();
      }
    } else {
      setVideoError(true);
    }
  };

  // 开始加载超时计时器
  const startLoadingTimer = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, 5000); // 减少到5秒超时
  };

  // 清除加载超时计时器
  const clearLoadingTimer = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
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
        setIsUserControlled(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setIsUserControlled(true); // 标记为用户手动控制
      }
    }
  };

  // 悬停处理 - 自动播放
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    // 如果当前显示缩略图，先切换到视频
    if (shouldShowThumbnail && !showVideo) {
      setShowVideo(true);
    }
    
    // 只有在非用户控制状态下才自动播放
    if (videoRef.current && !isPlaying && !isUserControlled) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && isHovered && !isUserControlled) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 300); // 减少到300ms，提升响应速度
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // 清除延迟播放
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // 只有在非用户控制状态下才自动暂停
    if (videoRef.current && isPlaying && !isUserControlled) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // 如果有缩略图且非用户控制，回到缩略图显示
    if (shouldShowThumbnail && !isUserControlled) {
      setTimeout(() => {
        if (!isHovered) {
          setShowVideo(false);
        }
      }, 100); // 减少到100ms，更快响应
    }
  };

  return (
    <div ref={elementRef}>
      <Link href={`/prompts/${prompt.id}`}>
        <motion.div
          className="card glass border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col"
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
          
          {/* 预览视频区域 - 画廊模式 */}
          <div className="relative h-56 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 flex-shrink-0 mb-4">
            {isVisible ? (
              <>
                {/* 缩略图显示 */}
                {shouldShowThumbnail && !showVideo && (
                  <>
                    <Image
                      src={getThumbnailUrl()!}
                      alt="视频缩略图"
                      fill
                      className={clsx(
                        'object-cover transition-all duration-500',
                        thumbnailLoaded ? 'opacity-100' : 'opacity-0',
                        'group-hover:scale-110',
                      )}
                      onLoad={() => setThumbnailLoaded(true)}
                      onError={() => {
                        setThumbnailError(true);
                        setShowVideo(true); // 缩略图加载失败时回退到视频
                      }}
                    />
                    {/* 缩略图上的播放按钮指示器 */}
                    {thumbnailLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center">
                          <PlayIcon className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* 视频显示 */}
                {(!shouldShowThumbnail || showVideo) && (
                  <video 
                    ref={videoRef}
                    src={getCurrentVideoUrl()}
                    className={clsx(
                      'w-full h-full object-cover transition-all duration-500',
                      videoLoaded ? 'opacity-100' : 'opacity-0',
                      'group-hover:scale-110',
                    )}
                    onLoadStart={() => {
                      resetVideoState();
                      startLoadingTimer();
                    }}
                    onCanPlay={() => {
                      setVideoLoaded(true);
                      clearLoadingTimer();
                    }}
                    onError={() => {
                      clearLoadingTimer();
                      switchToFallback();
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      setIsUserControlled(false); // 播放结束后重置用户控制状态
                    }}
                    muted
                    playsInline
                  />
                )}
              </>
            ) : (
              /* 懒加载占位符 */
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/60 to-gray-700/60">
                <div className="text-center">
                  <FilmIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">视频预览</p>
                </div>
              </div>
            )}
            {/* 缩略图加载状态 */}
            {isVisible && shouldShowThumbnail && !showVideo && !thumbnailLoaded && !thumbnailError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mb-2"></div>
                  <p className="text-xs text-gray-400">加载缩略图...</p>
                </div>
              </div>
            )}
            
            {/* 视频加载状态显示 - 只有在显示视频且视频可见时才显示 */}
            {isVisible && (!shouldShowThumbnail || showVideo) && !videoLoaded && !videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                {loadingTimeout ? (
                  <div className="text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-xs text-red-400">加载超时</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mb-2"></div>
                    <p className="text-xs text-gray-400">加载中...</p>
                  </div>
                )}
              </div>
            )}
            
            {/* 错误状态显示 - 只有在显示视频且视频可见时才显示 */}
            {isVisible && (!shouldShowThumbnail || showVideo) && videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-red-400 text-2xl mb-2">🎬</div>
                  <p className="text-xs text-red-400 mb-2">视频加载失败</p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (videoRef.current) {
                        // 如果已经尝试过占位符还是失败，回到主视频重试
                        if (hasTriedFallback) {
                          const primaryUrl = getPrimaryVideoUrl();
                          if (primaryUrl) {
                            setHasTriedFallback(false);
                            setCurrentVideoUrl(primaryUrl);
                          }
                        }
                        resetVideoState();
                        videoRef.current.load();
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 underline"
                  >
                    重试
                  </button>
                </div>
              </div>
            )}
              
            {/* 顶部标签栏 */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* 视频类型标识 */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-sky-200/20 backdrop-blur-md border border-sky-200/30">
                <FilmIcon className="h-3 w-3 text-sky-200" />
                <span className="text-xs text-sky-200 font-medium">视频</span>
              </div>
              
              {/* 热门标签 */}
              {(prompt.usageCount || 0) > 100 && (
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30">
                  <FireIcon className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400 font-medium">热门</span>
                </div>
              )}
            </div>
            
            {/* 中央播放控制 - 只有在显示视频且加载完成时才显示 */}
            <AnimatePresence>
              {isVisible && isHovered && (!shouldShowThumbnail || (showVideo && videoLoaded)) && !videoError && (
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
                  <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {prompt.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">{categoryInfo.name}</div>
                </div>
              </div>
            </div>

            {/* 描述 */}
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
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-sky-200/20 text-sky-200"
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
            <div className="mt-auto pt-4 border-t border-sky-200/10 space-y-3">
              {/* 第一行：评分与日期 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  {rating.value > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-200 to-blue-300 rounded-full"
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
            <div className="absolute inset-0 rounded-2xl animate-border-beam" 
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
});

VideoPromptCard.displayName = 'VideoPromptCard';

export default VideoPromptCard;