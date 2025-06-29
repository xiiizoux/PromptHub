import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInfo } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import { 
  StarIcon, 
  DocumentTextIcon, 
  FilmIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
  EyeIcon,
  CogIcon,
  BookOpenIcon,
  CubeTransparentIcon,
  ShoppingBagIcon,
  MapIcon,
  UserCircleIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface VideoPromptCardProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video';
    preview_asset_url?: string;
    parameters?: Record<string, any>;
  };
}

// 视频生成分类映射
const VIDEO_CATEGORY_MAP: Record<string, { name: string; color: string; gradient: string; icon: any }> = {
  '故事叙述': { name: '故事叙述', color: 'from-orange-500 to-red-500', gradient: 'from-orange-500/20 to-red-500/20', icon: BookOpenIcon },
  '动画特效': { name: '动画特效', color: 'from-red-500 to-pink-500', gradient: 'from-red-500/20 to-pink-500/20', icon: CubeTransparentIcon },
  '产品展示': { name: '产品展示', color: 'from-yellow-500 to-green-500', gradient: 'from-yellow-500/20 to-green-500/20', icon: ShoppingBagIcon },
  '自然风景': { name: '自然风景', color: 'from-green-500 to-blue-500', gradient: 'from-green-500/20 to-blue-500/20', icon: MapIcon },
  '人物肖像': { name: '人物肖像', color: 'from-pink-500 to-purple-500', gradient: 'from-pink-500/20 to-purple-500/20', icon: UserCircleIcon },
  '广告营销': { name: '广告营销', color: 'from-red-500 to-orange-500', gradient: 'from-red-500/20 to-orange-500/20', icon: MegaphoneIcon },
  'default': { name: '视频生成', color: 'from-red-500 to-orange-500', gradient: 'from-red-500/20 to-orange-500/20', icon: FilmIcon },
};

// 格式化日期函数
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知日期';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // 使用useMemo缓存计算结果 - 移到早期返回之前
  const categoryInfo = useMemo(() => {
    if (!prompt?.category) return VIDEO_CATEGORY_MAP.default;
    return VIDEO_CATEGORY_MAP[prompt.category] || VIDEO_CATEGORY_MAP.default;
  }, [prompt?.category]);

  const CategoryIcon = categoryInfo.icon;

  const rating = useMemo(() => {
    if (!prompt) return { value: 0, percentage: 0 };
    const ratingValue = prompt.average_rating !== undefined ? prompt.average_rating : (prompt.rating || 0);
    const percentage = (ratingValue / 5) * 100;
    return { value: ratingValue, percentage };
  }, [prompt?.average_rating, prompt?.rating]);

  const tagsToShow = useMemo(() => {
    if (!prompt?.tags || prompt.tags.length === 0) return null;
    return {
      visible: prompt.tags.slice(0, 2), // 视频卡片显示较少标签，留更多空间给预览
      remaining: Math.max(0, prompt.tags.length - 2),
    };
  }, [prompt?.tags]);

  // 获取主要参数用于显示
  const keyParameters = useMemo(() => {
    if (!prompt?.parameters) return null;
    const params: Array<{key: string; value: string}> = [];
    
    // 优先显示重要参数
    if (prompt.parameters.duration) {
      params.push({ key: 'Duration', value: `${prompt.parameters.duration}s` });
    }
    if (prompt.parameters.fps) {
      params.push({ key: 'FPS', value: String(prompt.parameters.fps) });
    }
    if (prompt.parameters.camera_movement) {
      params.push({ key: 'Camera', value: String(prompt.parameters.camera_movement) });
    }
    
    return params.slice(0, 2); // 最多显示2个参数
  }, [prompt?.parameters]);

  // 如果没有必要的数据，不渲染 - 移到hooks之后
  if (!prompt || !prompt.id) {
    return null;
  }

  // 获取主要视频URL（不包括占位符）
  const getPrimaryVideoUrl = () => {
    if (prompt.preview_asset_url) {
      return prompt.preview_asset_url;
    }

    // 备用方案：从parameters.media_files获取第一个文件
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
      return prompt.parameters.media_files[0].url;
    }

    return null;
  };

  // 获取占位符视频URL
  const getFallbackVideoUrl = () => {
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
  };

  // 获取当前应该使用的视频URL
  const getCurrentVideoUrl = () => {
    if (currentVideoUrl) {
      return currentVideoUrl;
    }
    
    const primaryUrl = getPrimaryVideoUrl();
    if (primaryUrl && !hasTriedFallback) {
      return primaryUrl;
    }
    
    return getFallbackVideoUrl();
  };

  // 初始化视频URL
  useEffect(() => {
    const primaryUrl = getPrimaryVideoUrl();
    setCurrentVideoUrl(primaryUrl || getFallbackVideoUrl());
    setHasTriedFallback(!primaryUrl);
  }, [prompt.preview_asset_url, prompt.parameters?.media_files]);

  // 处理视频加载超时
  const handleLoadingTimeout = () => {
    setLoadingTimeout(true);
    setVideoError(true);
    console.warn('视频加载超时，可能是网络问题或视频源不可用');
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
      console.log('主视频加载失败，切换到占位符视频');
      setHasTriedFallback(true);
      setCurrentVideoUrl(getFallbackVideoUrl());
      resetVideoState();
      
      // 触发视频重新加载
      if (videoRef.current) {
        videoRef.current.load();
      }
    } else {
      console.error('占位符视频也加载失败');
      setVideoError(true);
    }
  };

  // 开始加载超时计时器
  const startLoadingTimer = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(handleLoadingTimeout, 10000); // 10秒超时
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
    
    // 只有在非用户控制状态下才自动播放
    if (videoRef.current && !isPlaying && !isUserControlled) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && isHovered && !isUserControlled) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 500); // 500ms延迟避免意外触发
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
  };

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

  return (
    <div>
      <Link href={`/prompts/${prompt.id}`}>
        <motion.div
          className="card glass border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden h-[30rem] flex flex-col"
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
          <div className="relative h-56 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 flex-shrink-0 mb-4 mx-5">
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
                console.error('视频加载失败:', getCurrentVideoUrl());
                switchToFallback();
              }}
              onEnded={() => {
                setIsPlaying(false);
                setIsUserControlled(false); // 播放结束后重置用户控制状态
              }}
              muted
              playsInline
            />
            {/* 加载状态显示 */}
            {!videoLoaded && !videoError && (
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
            
            {/* 错误状态显示 */}
            {videoError && (
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
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30">
                <FilmIcon className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400 font-medium">视频</span>
              </div>
              
              {/* 热门标签 */}
              {(prompt.usageCount || 0) > 100 && (
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30">
                  <FireIcon className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400 font-medium">热门</span>
                </div>
              )}
            </div>
            
            {/* 中央播放控制 */}
            <AnimatePresence>
              {isHovered && videoLoaded && !videoError && (
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
                    className="w-16 h-16 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors"
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
          <div className="flex-1 px-5 pb-6 flex flex-col min-h-0">
            {/* 标题与分类图标 */}
            <div className="relative flex items-start mb-2">
              <div className="flex items-start space-x-2 flex-1">
                <div className={clsx(
                  'inline-flex p-2 rounded-lg bg-gradient-to-br flex-shrink-0',
                  categoryInfo.color,
                )}>
                  <CategoryIcon className="h-4 w-4 text-dark-bg-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {prompt.name}
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">{categoryInfo.name}</div>
                </div>
              </div>
            </div>
            
            {/* 参数显示 */}
            {keyParameters && keyParameters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {keyParameters.map((param, index) => (
                  <div 
                    key={`${prompt.id}-param-${index}`}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-gray-800/50 border border-gray-600/30"
                  >
                    <span className="text-gray-300">{param.key}:</span>
                    <span className="text-gray-400">{param.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* 标签 */}
            {tagsToShow && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tagsToShow.visible.map((tag, index) => (
                  <span 
                    key={`${prompt.id}-tag-${tag}-${index}`}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-red-500/20 text-red-400"
                  >
                    #{tag}
                  </span>
                ))}
                {tagsToShow.remaining > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass border border-gray-600 text-gray-400">
                    +{tagsToShow.remaining}
                  </span>
                )}
              </div>
            )}
            
            {/* 底部信息 */}
            <div className="mt-auto pt-4 border-t border-red-500/10 space-y-3">
              {/* 第一行：评分与日期 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  {rating.value > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-20 h-2 bg-dark-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
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