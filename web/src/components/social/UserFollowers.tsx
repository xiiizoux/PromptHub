import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
}

interface UserFollowersProps {
  userId: string;
  initialData?: {
    data: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  type: 'followers' | 'following';
}

const UserFollowers: React.FC<UserFollowersProps> = ({ userId, initialData, type }) => {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [users, setUsers] = useState(initialData?.data || []);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [page, setPage] = useState(initialData?.page || 1);
  const [pageSize] = useState(initialData?.pageSize || 20);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  // 追踪关注状态
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

  // 加载用户列表
  useEffect(() => {
    if (!initialData) {
      fetchUsers(1);
    } else {
      // 如果有初始数据，初始化关注状态
      if (isAuthenticated && currentUser?.id) {
        checkFollowStatus(initialData.data);
      }
    }
  }, [userId, type, initialData, isAuthenticated, currentUser?.id]);

  // 获取用户列表
  const fetchUsers = async (pageNum: number) => {
    setLoading(true);
    try {
      const endpoint = type === 'followers' ? 
        `/api/social/followers/${userId}?page=${pageNum}&pageSize=${pageSize}` : 
        `/api/social/following/${userId}?page=${pageNum}&pageSize=${pageSize}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.data);
        setTotal(data.data.total);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
        
        // 检查关注状态
        if (isAuthenticated && currentUser?.id) {
          checkFollowStatus(data.data.data);
        }
      }
    } catch (error) {
      console.error(`获取${type === 'followers' ? '粉丝' : '关注'}列表失败:`, error);
    } finally {
      setLoading(false);
    }
  };

  // 检查关注状态
  const checkFollowStatus = async (userList: User[]) => {
    if (!currentUser?.id || userList.length === 0) return;
    
    try {
      const userIds = userList.map(u => u.id);
      const response = await fetch('/api/social/follow/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFollowStatus(data.data.followStatus);
      }
    } catch (error) {
      console.error('获取关注状态失败:', error);
    }
  };

  // 关注/取消关注用户
  const toggleFollow = async (targetUserId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    // 不能关注自己
    if (targetUserId === currentUser?.id) return;
    
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const isFollowing = followStatus[targetUserId];
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch('/api/social/follow', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: targetUserId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 更新关注状态
        setFollowStatus(prev => ({
          ...prev,
          [targetUserId]: !isFollowing
        }));
      }
    } catch (error) {
      console.error(`${followStatus[targetUserId] ? '取消关注' : '关注'}用户失败:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // 切换页面
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchUsers(pageNum);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {type === 'followers' ? '粉丝' : '关注'} ({total})
      </h2>
      
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {type === 'followers' ? '暂无粉丝' : '暂未关注任何人'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {(user.display_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <Link href={`/profile/${user.id}`} legacyBehavior>
                    <a className="font-medium hover:text-blue-600">
                      {user.display_name || user.email}
                    </a>
                  </Link>
                </div>
              </div>
              
              {currentUser?.id && currentUser.id !== user.id && (
                <button
                  onClick={() => toggleFollow(user.id)}
                  disabled={actionLoading[user.id]}
                  className={`px-3 py-1 rounded-md text-sm ${
                    followStatus[user.id]
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {actionLoading[user.id]
                    ? '...'
                    : followStatus[user.id]
                    ? '已关注'
                    : '关注'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              上一页
            </button>
            
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFollowers;