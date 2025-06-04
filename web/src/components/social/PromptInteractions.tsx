import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// 注意：需要安装 react-icons 包: npm install react-icons
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShare } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface PromptInteractionsProps {
  promptId: string;
  initialInteractions?: {
    likes: number;
    bookmarks: number;
    shares: number;
    userInteraction?: {
      liked: boolean;
      bookmarked: boolean;
      shared: boolean;
    }
  };
}

type InteractionType = 'like' | 'bookmark' | 'share';

interface InteractionsState {
  likes: number;
  bookmarks: number;
  shares: number;
  userInteraction?: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  }
}

const PromptInteractions: React.FC<PromptInteractionsProps> = ({ promptId, initialInteractions }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [interactions, setInteractions] = useState({
    likes: initialInteractions?.likes || 0,
    bookmarks: initialInteractions?.bookmarks || 0,
    shares: initialInteractions?.shares || 0,
    userInteraction: initialInteractions?.userInteraction || {
      liked: false,
      bookmarked: false,
      shared: false
    }
  });
  
  const [loading, setLoading] = useState({
    like: false,
    bookmark: false,
    share: false
  });

  // 加载互动数据
  useEffect(() => {
    if (!initialInteractions) {
      fetchInteractions();
    }
  }, [promptId, initialInteractions]);

  // 获取互动数据
  const fetchInteractions = async () => {
    try {
      const response = await fetch(`/api/social/interactions?promptId=${promptId}`);
      const data = await response.json();
      
      if (data.success) {
        setInteractions(data.data);
      }
    } catch (error) {
      console.error('获取互动数据失败:', error);
    }
  };

  // 处理互动操作
  const handleInteraction = async (type: InteractionType) => {
    if (!isAuthenticated) {
      // 未登录用户跳转到登录页
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      // 映射类型到状态属性
      const interactionStateMap: Record<InteractionType, keyof typeof interactions.userInteraction> = {
        like: 'liked',
        bookmark: 'bookmarked',
        share: 'shared'
      };
      
      const interactionKey = interactionStateMap[type];
      const isActive = interactions.userInteraction?.[interactionKey];
      
      // 创建或删除互动
      const method = isActive ? 'DELETE' : 'POST';
      const response = await fetch('/api/social/interactions', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptId, type })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 更新本地状态
        setInteractions(prev => {
          const userInteraction = {
            ...prev.userInteraction,
            [interactionStateMap[type] as string]: !isActive
          };
          
          // 使用类型安全的方式更新计数
          const updatedState = { ...prev, userInteraction };
          
          if (type === 'like') {
            updatedState.likes = isActive ? prev.likes - 1 : prev.likes + 1;
          } else if (type === 'bookmark') {
            updatedState.bookmarks = isActive ? prev.bookmarks - 1 : prev.bookmarks + 1;
          } else if (type === 'share') {
            updatedState.shares = isActive ? prev.shares - 1 : prev.shares + 1;
          }
          
          return updatedState;
        });
      }
    } catch (error) {
      console.error(`${type}操作失败:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="flex items-center space-x-4 py-3 border-t border-b border-gray-200 mt-4">
      {/* 点赞按钮 */}
      <button 
        onClick={() => handleInteraction('like')}
        disabled={loading.like}
        className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition"
        aria-label={interactions.userInteraction?.liked ? "取消点赞" : "点赞"}
      >
        {interactions.userInteraction?.liked ? (
          <FaHeart className="text-red-500" />
        ) : (
          <FaRegHeart />
        )}
        <span>{interactions.likes}</span>
      </button>
      
      {/* 收藏按钮 */}
      <button 
        onClick={() => handleInteraction('bookmark')}
        disabled={loading.bookmark}
        className="flex items-center space-x-1 text-gray-700 hover:text-blue-500 transition"
        aria-label={interactions.userInteraction?.bookmarked ? "取消收藏" : "收藏"}
      >
        {interactions.userInteraction?.bookmarked ? (
          <FaBookmark className="text-blue-500" />
        ) : (
          <FaRegBookmark />
        )}
        <span>{interactions.bookmarks}</span>
      </button>
      
      {/* 分享按钮 */}
      <button 
        onClick={() => handleInteraction('share')}
        disabled={loading.share}
        className="flex items-center space-x-1 text-gray-700 hover:text-green-500 transition"
        aria-label="分享"
      >
        <FaShare className={interactions.userInteraction?.shared ? "text-green-500" : ""} />
        <span>{interactions.shares}</span>
      </button>
    </div>
  );
};

export default PromptInteractions;