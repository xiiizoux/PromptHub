import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface TopicUser {
  id: string;
  email: string;
  display_name?: string;
}

interface TopicData {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  post_count?: number;
  creator?: TopicUser;
}

interface TopicListProps {
  initialTopics?: {
    data: TopicData[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const TopicList: React.FC<TopicListProps> = ({ initialTopics }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [topics, setTopics] = useState(initialTopics?.data || []);
  const [total, setTotal] = useState(initialTopics?.total || 0);
  const [page, setPage] = useState(initialTopics?.page || 1);
  const [pageSize] = useState(initialTopics?.pageSize || 10);
  const [totalPages, setTotalPages] = useState(initialTopics?.totalPages || 1);
  
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);

  // 加载话题
  useEffect(() => {
    if (!initialTopics) {
      fetchTopics(1);
    }
  }, [initialTopics]);

  // 获取话题
  const fetchTopics = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/topics?page=${pageNum}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (data.success) {
        setTopics(data.data.data);
        setTotal(data.data.total);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取话题失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建话题
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTopic.title.trim()) return;
    
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    setCreating(true);
    
    try {
      const response = await fetch('/api/social/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTopic.title,
          description: newTopic.description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 清空表单
        setNewTopic({ title: '', description: '' });
        setShowCreateForm(false);
        
        // 重新加载话题
        await fetchTopics(1);
      }
    } catch (error) {
      console.error('创建话题失败:', error);
    } finally {
      setCreating(false);
    }
  };

  // 切换页面
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchTopics(pageNum);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部和创建按钮 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">社区讨论</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {showCreateForm ? '取消' : '创建新话题'}
          </button>
        )}
      </div>
      
      {/* 创建话题表单 */}
      {showCreateForm && (
        <form onSubmit={handleCreateTopic} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                话题标题 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="输入话题标题"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                话题描述
              </label>
              <textarea
                id="description"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                placeholder="描述你的话题（可选）"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || !newTopic.title.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating ? '创建中...' : '创建话题'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* 话题列表 */}
      {loading ? (
        <div className="text-center py-8">加载话题中...</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无话题，{isAuthenticated ? '点击创建按钮创建第一个话题吧' : '登录后可以创建话题'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  话题
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建者
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  帖子数
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建日期
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topics.map((topic) => (
                <tr key={topic.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/social/topics/${topic.id}`} legacyBehavior>
                      <a className="text-blue-600 hover:text-blue-800 font-medium">
                        {topic.title}
                      </a>
                    </Link>
                    {topic.description && (
                      <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                        {topic.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {topic.creator?.display_name || topic.creator?.email || '未知用户'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {topic.post_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(topic.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default TopicList;