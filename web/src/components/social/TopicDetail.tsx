import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface User {
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
  creator?: User;
}

interface Post {
  id: string;
  topic_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

interface TopicDetailProps {
  topicId: string;
  initialTopic?: TopicData;
  initialPosts?: {
    data: Post[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const TopicDetail: React.FC<TopicDetailProps> = ({ topicId, initialTopic, initialPosts }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [topic, setTopic] = useState<TopicData | null>(initialTopic || null);
  const [posts, setPosts] = useState(initialPosts?.data || []);
  const [total, setTotal] = useState(initialPosts?.total || 0);
  const [page, setPage] = useState(initialPosts?.page || 1);
  const [pageSize] = useState(initialPosts?.pageSize || 10);
  const [totalPages, setTotalPages] = useState(initialPosts?.totalPages || 1);
  
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);

  // 加载话题详情和帖子
  useEffect(() => {
    if (!initialTopic) {
      fetchTopic();
    }
    if (!initialPosts) {
      fetchPosts(1);
    }
  }, [topicId, initialTopic, initialPosts]);

  // 获取话题详情
  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/social/topics/${topicId}`);
      const data = await response.json();
      
      if (data.success) {
        setTopic(data.data);
      }
    } catch (error) {
      console.error('获取话题详情失败:', error);
    }
  };

  // 获取话题帖子
  const fetchPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/topics/${topicId}/posts?page=${pageNum}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data.data);
        setTotal(data.data.total);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新帖子
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    setCreating(true);
    
    try {
      const response = await fetch(`/api/social/topics/${topicId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 清空表单
        setNewPost({ title: '', content: '' });
        setShowCreateForm(false);
        
        // 重新加载帖子
        await fetchPosts(1);
      }
    } catch (error) {
      console.error('创建帖子失败:', error);
    } finally {
      setCreating(false);
    }
  };

  // 切换页面
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchPosts(pageNum);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  if (!topic && !loading) {
    return <div className="text-center py-8">话题不存在或已被删除</div>;
  }

  return (
    <div className="space-y-6">
      {/* 话题标题和描述 */}
      {topic && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{topic.title}</h1>
              {topic.description && (
                <p className="mt-2 text-gray-600">{topic.description}</p>
              )}
              <div className="mt-2 text-sm text-gray-500">
                由 {topic.creator?.display_name || topic.creator?.email || '未知用户'} 创建于 {formatDate(topic.created_at)}
              </div>
            </div>
            <Link href="/social/topics" legacyBehavior>
              <a className="text-blue-600 hover:underline">返回话题列表</a>
            </Link>
          </div>
        </div>
      )}
      
      {/* 创建帖子按钮 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">帖子 ({total})</h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {showCreateForm ? '取消' : '发表新帖子'}
          </button>
        )}
      </div>
      
      {/* 创建帖子表单 */}
      {showCreateForm && (
        <form onSubmit={handleCreatePost} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="帖子标题"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="帖子内容"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creating ? '发表中...' : '发表帖子'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* 帖子列表 */}
      {loading ? (
        <div className="text-center py-8">加载帖子中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无帖子，{isAuthenticated ? '点击上方按钮发表第一个帖子吧' : '登录后可以发表帖子'}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <div className="text-sm text-gray-500">
                  {formatDate(post.created_at)}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                由 {post.user?.display_name || post.user?.email || '未知用户'} 发表
              </div>
              <div className="mt-3 prose">{post.content}</div>
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

export default TopicDetail;