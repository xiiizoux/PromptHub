import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toggleBookmark, toggleLike } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useInteractions } from '@/contexts/InteractionsContext';
import toast from 'react-hot-toast';

interface BookmarkButtonProps {
  promptId: string;
  variant?: 'bookmark' | 'like';
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = React.memo(({
  promptId,
  variant = 'bookmark',
  showCount = true,
  size = 'md',
  className = '',
}) => {
  const { user } = useAuth();
  const { interactions, loadInteractions, updateInteraction } = useInteractions();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防止水合错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 从context获取互动数据
  const interaction = interactions[promptId];
  const isActive = mounted ? (variant === 'bookmark' ? interaction?.userBookmarked : interaction?.userLiked) || false : false;
  const count = mounted ? (variant === 'bookmark' ? interaction?.bookmarks : interaction?.likes) || 0 : 0;

  // 在组件挂载时请求加载此提示词的互动数据
  useEffect(() => {
    if (mounted && promptId && typeof promptId === 'string' && promptId.trim() !== '' && !interaction) {
      loadInteractions([promptId]);
    }
  }, [mounted, promptId, interaction, loadInteractions]);

  const handleToggle = useCallback(async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (isLoading) {return;}

    setIsLoading(true);
    
    try {
      if (variant === 'bookmark') {
        const result = await toggleBookmark(promptId);
        // 更新context中的数据
        updateInteraction(promptId, {
          userBookmarked: result.bookmarked,
          bookmarks: result.bookmarked ? count + 1 : Math.max(0, count - 1),
        });
        toast.success(result.bookmarked ? '已添加到收藏' : '已取消收藏');
      } else {
        const result = await toggleLike(promptId);
        // 更新context中的数据
        updateInteraction(promptId, {
          userLiked: result.liked,
          likes: result.liked ? count + 1 : Math.max(0, count - 1),
        });
        toast.success(result.liked ? '已点赞' : '已取消点赞');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      console.error('操作失败:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, variant, promptId, updateInteraction, count]);

  if (!mounted) {
    return null; // 避免水合错误
  }

  const IconComponent = variant === 'bookmark' 
    ? (isActive ? BookmarkSolidIcon : BookmarkIcon)
    : (isActive ? HeartSolidIcon : HeartIcon);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isLoading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center gap-2 rounded-lg transition-all duration-200
        ${isActive 
          ? (variant === 'bookmark' 
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30')
          : 'bg-gray-800/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700/50 hover:text-gray-300'
        }
        ${buttonSizeClasses[size]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <motion.div
        animate={{ 
          scale: isActive ? [1, 1.2, 1] : 1,
          rotate: variant === 'like' && isActive ? [0, 10, -10, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <IconComponent className={sizeClasses[size]} />
      </motion.div>
      
      {showCount && count > 0 && (
        <span className="font-medium">
          {count}
        </span>
      )}
      
      {isLoading && (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
    </motion.button>
  );
});

BookmarkButton.displayName = 'BookmarkButton';

// 组合组件：同时显示点赞和收藏
export const InteractionButtons: React.FC<{
  promptId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = React.memo(({ promptId, size = 'md', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BookmarkButton promptId={promptId} variant="like" size={size} />
      <BookmarkButton promptId={promptId} variant="bookmark" size={size} />
    </div>
  );
});

InteractionButtons.displayName = 'InteractionButtons'; 