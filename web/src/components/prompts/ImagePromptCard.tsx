import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptInfo } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';
import { 
  StarIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  SparklesIcon,
  TagIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
  EyeIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { InteractionButtons } from '@/components/BookmarkButton';
import clsx from 'clsx';

interface ImagePromptCardProps {
  prompt: PromptInfo & {
    category_type?: 'chat' | 'image' | 'video' | 'multimodal';
    preview_asset_url?: string;
    parameters?: Record<string, any>;
  };
}

// 图像生成分类映射
const IMAGE_CATEGORY_MAP: Record<string, { name: string; color: string; gradient: string }> = {
  '真实摄影': { name: '真实摄影', color: 'text-pink-400', gradient: 'from-pink-500/20 to-red-500/20' },
  '艺术绘画': { name: '艺术绘画', color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20' },
  '动漫插画': { name: '动漫插画', color: 'text-yellow-400', gradient: 'from-pink-500/20 to-yellow-500/20' },
  '抽象艺术': { name: '抽象艺术', color: 'text-orange-400', gradient: 'from-yellow-500/20 to-orange-500/20' },
  'Logo设计': { name: 'Logo设计', color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-purple-500/20' },
  '建筑空间': { name: '建筑空间', color: 'text-blue-400', gradient: 'from-blue-500/20 to-green-500/20' },
  '时尚设计': { name: '时尚设计', color: 'text-pink-400', gradient: 'from-pink-500/20 to-purple-500/20' },
  'default': { name: '图像生成', color: 'text-pink-400', gradient: 'from-pink-500/20 to-purple-500/20' },
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

const ImagePromptCard: React.FC<ImagePromptCardProps> = React.memo(({ prompt }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 使用useMemo缓存计算结果 - 移到早期返回之前
  const categoryInfo = useMemo(() => {
    if (!prompt?.category) return IMAGE_CATEGORY_MAP.default;
    return IMAGE_CATEGORY_MAP[prompt.category] || IMAGE_CATEGORY_MAP.default;
  }, [prompt?.category]);

  const rating = useMemo(() => {
    if (!prompt) return { value: 0, percentage: 0 };
    const ratingValue = prompt.average_rating !== undefined ? prompt.average_rating : (prompt.rating || 0);
    const percentage = (ratingValue / 5) * 100;
    return { value: ratingValue, percentage };
  }, [prompt?.average_rating, prompt?.rating]);

  const tagsToShow = useMemo(() => {
    if (!prompt?.tags || prompt.tags.length === 0) return null;
    return {
      visible: prompt.tags.slice(0, 2), // 图像卡片显示较少标签，留更多空间给预览
      remaining: Math.max(0, prompt.tags.length - 2),
    };
  }, [prompt?.tags]);

  // 获取主要参数用于显示
  const keyParameters = useMemo(() => {
    if (!prompt?.parameters) return null;
    const params: Array<{key: string; value: string}> = [];
    
    // 优先显示重要参数
    if (prompt.parameters.style) {
      params.push({ key: 'Style', value: String(prompt.parameters.style) });
    }
    if (prompt.parameters.aspect_ratio) {
      params.push({ key: 'Ratio', value: String(prompt.parameters.aspect_ratio) });
    }
    if (prompt.parameters.resolution) {
      params.push({ key: 'Resolution', value: String(prompt.parameters.resolution) });
    }
    
    return params.slice(0, 2); // 最多显示2个参数
  }, [prompt?.parameters]);

  // 如果没有必要的数据，不渲染 - 移到hooks之后
  if (!prompt || !prompt.id) {
    return null;
  }

  // 获取图片URL，优先使用preview_asset_url，如果没有则从media_files获取第一个，最后使用占位符
  const getImageUrl = () => {
    if (prompt.preview_asset_url) {
      return prompt.preview_asset_url;
    }

    // 备用方案：从parameters.media_files获取第一个文件
    if (prompt.parameters?.media_files && Array.isArray(prompt.parameters.media_files) && prompt.parameters.media_files.length > 0) {
      return prompt.parameters.media_files[0].url;
    }

    // 使用适合AI图像生成的艺术感占位符图片 - 抽象艺术/创意设计
    return `https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&auto=format&q=80`;
  };

  return (
    <div>
      <Link href={`/prompts/${prompt.id}`}>
        <motion.div
          className="card glass border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden h-96 flex flex-col"
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 背景渐变 */}
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            categoryInfo.gradient,
          )} />
          
          {/* 预览图像区域 - 画廊模式 */}
          <div className="relative w-full h-56 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 flex-shrink-0 mb-4">
            <img 
              src={getImageUrl()}
              alt={prompt.name || '图像提示词'}
              className={clsx(
                'w-full h-full object-cover transition-all duration-500',
                imageLoaded ? 'opacity-100' : 'opacity-0',
                'group-hover:scale-110'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                    </div>
            )}
              
            {/* 顶部标签栏 */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* 图像类型标识 */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-pink-500/20 backdrop-blur-md border border-pink-500/30">
                <PhotoIcon className="h-3 w-3 text-pink-400" />
                <span className="text-xs text-pink-400 font-medium">图像</span>
              </div>
              
              {/* 热门标签 */}
              {(prompt.usageCount || 0) > 100 && (
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30">
                  <FireIcon className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400 font-medium">热门</span>
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
                    <span className="text-sm text-white font-medium">查看详情</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 底部渐变遮罩，用于更好的文字可读性 */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
          
          {/* 内容区域 - 紧凑但信息丰富 */}
          <div className="flex-1 p-5 flex flex-col min-h-0">
            {/* 标题与分类 */}
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-pink-400 transition-colors mb-1">
                {prompt.name}
              </h3>
              <div className={clsx('text-xs font-medium', categoryInfo.color)}>
                {categoryInfo.name}
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
              </div>
            )}
            
            {/* 底部信息 */}
            <div className="mt-auto pt-4 border-t border-pink-500/10 space-y-3">
              {/* 评分与互动 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {rating.value > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                          style={{ width: `${rating.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{rating.value.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">暂无评分</span>
                  )}
                </div>
                
                <div onClick={(e) => e.preventDefault()}>
                  <InteractionButtons promptId={prompt.id} size="sm" />
                </div>
              </div>
              
              {/* 作者与日期 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{prompt.author || '匿名'}</span>
                  </div>
                  <span>•</span>
                  <span>v{formatVersionDisplay(prompt.version)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatDate(prompt.updated_at || prompt.created_at)}</span>
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