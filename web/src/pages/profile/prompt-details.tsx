import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeftIcon, PencilIcon, TrashIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const PromptDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      try {
        // 获取认证令牌
        const token = localStorage.getItem('supabase.auth.token');
        let parsedToken = null;
        
        if (token) {
          try {
            const parsed = JSON.parse(token);
            parsedToken = parsed?.currentSession?.access_token;
          } catch (e) {
            console.error('解析令牌失败:', e);
          }
        }
        
        if (!parsedToken) {
          throw new Error('未找到有效的认证令牌');
        }
        
        // 从私有API获取提示词详情
        const response = await fetch(`/api/profile/prompt/${id}`, {
          headers: {
            'Authorization': `Bearer ${parsedToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '获取提示词详情失败');
        }
        
        const data = await response.json();
        setPrompt(data.data);
      } catch (err: any) {
        console.error('获取提示词失败:', err);
        setError(err.message || '获取提示词详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrompt();
  }, [id, user]);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-6 bg-dark-bg-secondary rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-dark-bg-secondary rounded"></div>
                <div className="h-4 bg-dark-bg-secondary rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-dark-bg-primary p-8">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-xl p-8 border border-neon-red/30 text-center">
            <h2 className="text-xl font-semibold text-neon-red mb-4">出错了</h2>
            <p className="text-gray-300 mb-6">{error || '找不到提示词'}</p>
            <Link href="/profile" className="btn-primary">
              返回个人中心
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-bg-primary p-8">
      <div className="max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link 
            href="/profile"
            className="inline-flex items-center text-sm text-gray-400 hover:text-neon-cyan transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回个人中心
          </Link>
        </div>
        
        {/* 提示词标题与操作 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">{prompt.name}</h1>
          <div className="flex items-center space-x-3">
            <Link
              href={`/prompts/${prompt.id}/edit`}
              className="btn-secondary flex items-center space-x-2"
            >
              <PencilIcon className="h-5 w-5" />
              <span>编辑</span>
            </Link>
            <button
              onClick={() => copyToClipboard(prompt.content)}
              className="btn-outline flex items-center space-x-2"
              title="复制提示词内容"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-neon-green" />
                  <span className="text-neon-green">已复制</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-5 w-5" />
                  <span>复制</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* 提示词信息 */}
        <div className="glass rounded-xl p-8 border border-neon-cyan/20 mb-8">
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              prompt.is_public 
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
            }`}>
              {prompt.is_public ? '公开' : '私有'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
              {prompt.category}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
              v{prompt.version || '1.0'}
            </span>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">描述</h2>
            <p className="text-gray-300">{prompt.description}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">提示词内容</h2>
            <div className="bg-dark-bg-secondary rounded-lg p-4 border border-neon-cyan/10">
              <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
                {prompt.content}
              </pre>
            </div>
          </div>
          
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">标签</h2>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">其他信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">创建时间</p>
                <p className="text-gray-200">{formatDate(prompt.created_at)}</p>
              </div>
              {prompt.updated_at && (
                <div>
                  <p className="text-gray-400">最后更新</p>
                  <p className="text-gray-200">{formatDate(prompt.updated_at)}</p>
                </div>
              )}
              {prompt.author && (
                <div>
                  <p className="text-gray-400">作者</p>
                  <p className="text-gray-200">{prompt.author}</p>
                </div>
              )}
              {prompt.compatible_models && prompt.compatible_models.length > 0 && (
                <div>
                  <p className="text-gray-400">兼容模型</p>
                  <p className="text-gray-200">{prompt.compatible_models.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetails;
