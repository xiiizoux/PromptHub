import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// 注意：需要安装 react-icons 包: npm install react-icons
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShare } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

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
  const { user, isAuthenticated, getToken } = useAuth();
  
  const [interactions, setInteractions] = useState({
    likes: initialInteractions?.likes || 0,
    bookmarks: initialInteractions?.bookmarks || 0,
    shares: initialInteractions?.shares || 0,
    userInteraction: initialInteractions?.userInteraction || {
      liked: false,
      bookmarked: false,
      shared: false,
    },
  });
  
  const [loading, setLoading] = useState({
    like: false,
    bookmark: false,
    share: false,
  });

  // 加载互动数据
  useEffect(() => {
    if (!initialInteractions && promptId) {
      fetchInteractions();
    }
  }, [promptId, initialInteractions]);

  // 获取认证头
  const getAuthHeaders = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error('用户未登录或认证信息已过期');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // 获取互动数据
  const fetchInteractions = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // 如果用户已登录，添加认证头以获取用户状态
      if (isAuthenticated) {
        try {
          const token = await getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('获取认证令牌失败:', error);
        }
      }
      
      const response = await fetch(`/api/social/interactions?promptId=${promptId}`, {
        headers,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInteractions(data.data);
      } else {
        console.error('获取互动数据失败:', data.error);
      }
    } catch (error) {
      console.error('获取互动数据失败:', error);
    }
  };

  // 处理互动操作
  const handleInteraction = async (type: InteractionType) => {
    if (!isAuthenticated) {
      // 未登录用户跳转到登录页
      toast.error('请先登录后再进行操作');
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    if (loading[type]) {
      return; // 防止重复点击
    }
    
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      // 获取认证头
      const headers = await getAuthHeaders();
      
      // 映射类型到状态属性
      const interactionStateMap: Record<InteractionType, keyof typeof interactions.userInteraction> = {
        like: 'liked',
        bookmark: 'bookmarked',
        share: 'shared',
      };
      
      const interactionKey = interactionStateMap[type];
      const isActive = interactions.userInteraction?.[interactionKey];
      
      // 创建或删除互动
      const method = isActive ? 'DELETE' : 'POST';
      const response = await fetch('/api/social/interactions', {
        method,
        headers,
        body: JSON.stringify({ promptId, type }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.success) {
        // 更新本地状态
        setInteractions(prev => {
          const userInteraction = {
            ...prev.userInteraction,
            [interactionStateMap[type] as string]: !isActive,
          };
          
          // 使用类型安全的方式更新计数
          const updatedState = { ...prev, userInteraction };
          
          if (type === 'like') {
            updatedState.likes = isActive ? Math.max(0, prev.likes - 1) : prev.likes + 1;
          } else if (type === 'bookmark') {
            updatedState.bookmarks = isActive ? Math.max(0, prev.bookmarks - 1) : prev.bookmarks + 1;
          } else if (type === 'share') {
            updatedState.shares = isActive ? Math.max(0, prev.shares - 1) : prev.shares + 1;
          }
          
          return updatedState;
        });
        
        // 显示成功消息
        const actionText = type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享';
        const statusText = isActive ? '取消' : '';
        toast.success(`${statusText}${actionText}成功`);
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error: unknown) {
      console.error(`${type}操作失败:`, error);
      
      // 显示具体的错误信息
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('认证')) {
        toast.error('认证失败，请重新登录');
        router.push(`/auth/login?redirect=${router.asPath}`);
      } else if (errorMessage.includes('已过期')) {
        toast.error('登录已过期，请重新登录');
        router.push(`/auth/login?redirect=${router.asPath}`);
      } else {
        const actionText = type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享';
        const finalMessage = errorMessage || '操作失败';
        toast.error(`${actionText}失败: ${finalMessage}`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="flex items-center justify-end space-x-4 py-3 mt-4">
      {/* 点赞按钮 */}
      <button 
        onClick={() => handleInteraction('like')}
        disabled={loading.like}
        className={`flex items-center space-x-1 transition-colors ${
          loading.like 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 dark:text-gray-300 hover:text-red-500'
        }`}
        aria-label={interactions.userInteraction?.liked ? '取消点赞' : '点赞'}
      >
        {interactions.userInteraction?.liked ? (
          <FaHeart className="text-red-500" />
        ) : (
          <FaRegHeart />
        )}
        <span>{interactions.likes}</span>
        {loading.like && <span className="text-xs ml-1">...</span>}
      </button>
      
      {/* 收藏按钮 */}
      <button 
        onClick={() => handleInteraction('bookmark')}
        disabled={loading.bookmark}
        className={`flex items-center space-x-1 transition-colors ${
          loading.bookmark 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 dark:text-gray-300 hover:text-blue-500'
        }`}
        aria-label={interactions.userInteraction?.bookmarked ? '取消收藏' : '收藏'}
      >
        {interactions.userInteraction?.bookmarked ? (
          <FaBookmark className="text-blue-500" />
        ) : (
          <FaRegBookmark />
        )}
        <span>{interactions.bookmarks}</span>
        {loading.bookmark && <span className="text-xs ml-1">...</span>}
      </button>
      
      {/* 分享按钮 */}
      <button 
        onClick={() => handleInteraction('share')}
        disabled={loading.share}
        className={`flex items-center space-x-1 transition-colors ${
          loading.share 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-700 dark:text-gray-300 hover:text-green-500'
        }`}
        aria-label="分享"
      >
        <FaShare className={interactions.userInteraction?.shared ? 'text-green-500' : ''} />
        <span>{interactions.shares}</span>
        {loading.share && <span className="text-xs ml-1">...</span>}
      </button>
    </div>
  );
};

export default PromptInteractions;