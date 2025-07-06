import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  ArchiveBoxArrowDownIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';

interface ArchivedPrompt {
  id: string;
  name: string;
  description?: string;
  content: any;
  tags?: string[];
  category?: string;
  category_type: 'chat' | 'image' | 'video';
  is_public: boolean;
  original_author_id: string;
  orphaned_at: string;
  deletion_protection_reason?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  preview_asset_url?: string;
  parameters?: any;
  archiveInfo: {
    affectedUsers: number;
    archiveReason: string;
    archivedAt: string;
  };
}

interface ArchivedPromptsData {
  archivedPrompts: ArchivedPrompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalArchived: number;
    canRestoreAll: boolean;
  };
}

export default function ArchivedPromptsPage() {
  const router = useRouter();
  const { user, getToken } = useAuth();
  const [data, setData] = useState<ArchivedPromptsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [restoringPrompts, setRestoringPrompts] = useState<Set<string>>(new Set());

  const fetchArchivedPrompts = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      
      const token = await getToken();
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await fetch(`/api/prompts/archived?page=${page}&limit=12`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('获取归档列表失败');
      }

      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error('获取归档提示词失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchArchivedPrompts();
    }
  }, [user]);

  const handleRestorePrompt = async (promptId: string, promptName: string) => {
    if (restoringPrompts.has(promptId)) return;

    const confirmed = confirm(`确定要恢复提示词"${promptName}"吗？\n\n恢复后，此提示词将重新出现在您的活跃列表中。`);
    if (!confirmed) return;

    setRestoringPrompts(prev => new Set(prev).add(promptId));

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await fetch('/api/prompts/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          <div className="space-y-1">
            <div className="font-semibold">🎉 恢复成功！</div>
            <div className="text-sm">提示词已重新加入您的活跃列表</div>
          </div>,
          { duration: 4000 }
        );
        
        // 刷新列表
        fetchArchivedPrompts(currentPage);
      } else {
        const error = await response.json();
        throw new Error(error.message || '恢复失败');
      }
    } catch (error: any) {
      toast.error('恢复提示词失败: ' + error.message);
    } finally {
      setRestoringPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category_type: string) => {
    switch (category_type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'chat':
      default:
        return '💬';
    }
  };

  const getContentPreview = (content: any) => {
    if (!content) return '无内容';
    
    if (typeof content === 'string') {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    
    if (typeof content === 'object' && content.text) {
      const text = content.text;
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }
    
    return '结构化内容';
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">需要登录</h3>
            <p className="mt-1 text-sm text-gray-500">请先登录以查看您的归档提示词</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ArchiveBoxIcon className="h-8 w-8 mr-3 text-blue-600" />
                我的归档
              </h1>
              <p className="mt-2 text-gray-600">
                查看和恢复您的归档提示词
              </p>
            </div>
            <button
              onClick={() => fetchArchivedPrompts(currentPage)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              刷新列表
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {data && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
              <div className="text-blue-800">
                <span className="font-semibold">总计 {data.summary.totalArchived} 个归档提示词</span>
                {data.summary.totalArchived > 0 && (
                  <span className="text-sm ml-2">
                    • 所有归档都可以随时恢复 • 数据完整保留
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 归档提示词列表 */}
        {data?.archivedPrompts && data.archivedPrompts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.archivedPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* 卡片头部 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCategoryIcon(prompt.category_type)}</span>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {prompt.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <EyeIcon className="h-3 w-3" />
                      <span>{prompt.view_count}</span>
                    </div>
                  </div>

                  {/* 描述和内容预览 */}
                  {prompt.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {prompt.description}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-500 mb-4 line-clamp-3 bg-gray-50 p-2 rounded">
                    {getContentPreview(prompt.content)}
                  </div>

                  {/* 标签 */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex items-center mb-4">
                      <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                        {prompt.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{prompt.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 归档信息 */}
                  <div className="space-y-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center text-sm text-amber-700">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      归档时间: {formatDate(prompt.archiveInfo.archivedAt)}
                    </div>
                    {prompt.archiveInfo.affectedUsers > 0 && (
                      <div className="flex items-center text-sm text-green-700">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        保护了 {prompt.archiveInfo.affectedUsers} 个用户的数据
                      </div>
                    )}
                    <div className="text-xs text-amber-600">
                      {prompt.archiveInfo.archiveReason}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/prompts/${prompt.id}`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      查看
                    </button>
                    <button
                      onClick={() => handleRestorePrompt(prompt.id, prompt.name)}
                      disabled={restoringPrompts.has(prompt.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {restoringPrompts.has(prompt.id) ? (
                        <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {restoringPrompts.has(prompt.id) ? '恢复中...' : '恢复'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              暂无归档提示词
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              您还没有归档任何提示词
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/prompts')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                浏览所有提示词
              </button>
            </div>
          </div>
        )}

        {/* 分页控件 */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchArchivedPrompts(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => fetchArchivedPrompts(Math.min(data.pagination.totalPages, currentPage + 1))}
                disabled={currentPage === data.pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * data.pagination.limit + 1}
                  </span>{' '}
                  到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * data.pagination.limit, data.pagination.total)}
                  </span>{' '}
                  条，共{' '}
                  <span className="font-medium">{data.pagination.total}</span>{' '}
                  条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchArchivedPrompts(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchArchivedPrompts(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchArchivedPrompts(Math.min(data.pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === data.pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}