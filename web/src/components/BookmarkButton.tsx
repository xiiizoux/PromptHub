import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toggleBookmark, toggleLike, getPromptInteractions } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BookmarkButtonProps {
  promptId: string;
  variant?: 'bookmark' | 'like';
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  promptId,
  variant = 'bookmark',
  showCount = true,
  size = 'md',
  className = ''
}) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防止水合错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取初始状态
  useEffect(() => {
    if (!promptId || !mounted) return;
    
    const fetchInteractions = async () => {
      try {
        const data = await getPromptInteractions(promptId);
        if (variant === 'bookmark') {
          setIsActive(data.userBookmarked);
          setCount(data.bookmarks);
        } else {
          setIsActive(data.userLiked);
          setCount(data.likes);
        }
      } catch (error) {
        console.error('获取互动状态失败:', error);
      }
    };

    fetchInteractions();
  }, [promptId, variant, mounted]);

  const handleToggle = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      if (variant === 'bookmark') {
        const result = await toggleBookmark(promptId);
        setIsActive(result.bookmarked);
        setCount(prev => result.bookmarked ? prev + 1 : Math.max(0, prev - 1));
        toast.success(result.bookmarked ? '已添加到收藏' : '已取消收藏');
      } else {
        const result = await toggleLike(promptId);
        setIsActive(result.liked);
        setCount(prev => result.liked ? prev + 1 : Math.max(0, prev - 1));
        toast.success(result.liked ? '已点赞' : '已取消点赞');
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      toast.error(error.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null; // 避免水合错误
  }

  const IconComponent = variant === 'bookmark' 
    ? (isActive ? BookmarkSolidIcon : BookmarkIcon)
    : (isActive ? HeartSolidIcon : HeartIcon);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
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
          rotate: variant === 'like' && isActive ? [0, 10, -10, 0] : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <IconComponent className={sizeClasses[size]} />
      </motion.div>
      
      {showCount && (
        <span className="font-medium">
          {count > 0 ? count : ''}
        </span>
      )}
      
      {isLoading && (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
    </motion.button>
  );
};

// 组合组件：同时显示点赞和收藏
export const InteractionButtons: React.FC<{
  promptId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ promptId, size = 'md', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BookmarkButton promptId={promptId} variant="like" size={size} />
      <BookmarkButton promptId={promptId} variant="bookmark" size={size} />
    </div>
  );
}; 