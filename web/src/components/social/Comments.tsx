import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface CommentUser {
  id: string;
  email: string;
  display_name?: string;
}

interface CommentData {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: CommentUser;
  replies?: CommentData[];
}

interface CommentsProps {
  promptId: string;
  initialComments?: {
    data: CommentData[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const Comments: React.FC<CommentsProps> = ({ promptId, initialComments }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [comments, setComments] = useState(initialComments?.data || []);
  const [total, setTotal] = useState(initialComments?.total || 0);
  const [page, setPage] = useState(initialComments?.page || 1);
  const [pageSize] = useState(initialComments?.pageSize || 10);
  const [totalPages, setTotalPages] = useState(initialComments?.totalPages || 1);
  
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; user: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // 加载评论
  useEffect(() => {
    if (!initialComments) {
      fetchComments(1);
    }
  }, [promptId, initialComments]);

  // 获取评论
  const fetchComments = async (pageNum: number) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/social/comments?promptId=${promptId}&page=${pageNum}&pageSize=${pageSize}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data.data);
        setTotal(data.data.total);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${router.asPath}`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/social/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptId,
          content,
          parentId: replyTo?.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 清空输入
        setContent('');
        setReplyTo(null);
        
        // 重新加载评论
        await fetchComments(1);
      }
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换页面
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchComments(pageNum);
  };

  // 显示回复框
  const handleReply = (comment: CommentData) => {
    setReplyTo({
      id: comment.id,
      user: comment.user?.display_name || comment.user?.email || '用户'
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">评论 ({total})</h3>
      
      {/* 评论输入框 */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex flex-col space-y-2">
          {replyTo && (
            <div className="flex items-center text-sm text-gray-500">
              <span>回复 {replyTo.user}:</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-blue-500 hover:underline"
              >
                取消
              </button>
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isAuthenticated ? "发表你的评论..." : "请先登录后评论"}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            disabled={!isAuthenticated || loading}
          />
          
          <div className="self-end">
            <button
              type="submit"
              disabled={!isAuthenticated || loading || !content.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '发送中...' : '发表评论'}
            </button>
          </div>
        </div>
      </form>
      
      {/* 评论列表 */}
      {loadingComments ? (
        <div className="text-center py-4">加载评论中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">暂无评论，快来发表第一条评论吧</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold">
                      {comment.user?.display_name || comment.user?.email || '用户'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="mt-1">{comment.content}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => handleReply(comment)}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      回复
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 回复列表 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-3 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="flex items-center">
                        <span className="font-semibold">
                          {reply.user?.display_name || reply.user?.email || '用户'}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      <p className="mt-1">{reply.content}</p>
                      <div className="mt-1">
                        <button
                          onClick={() => handleReply(reply)}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          回复
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
              disabled={page === 1 || loadingComments}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              上一页
            </button>
            
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loadingComments}
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

export default Comments;