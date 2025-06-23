import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  PencilSquareIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { CollaborativeEditor } from '@/components/CollaborativeEditor';
import { VersionHistory } from '@/components/VersionHistory';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string;
  category: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export default function CollaborativePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (id && user) {
      fetchPrompt();
      generateShareLink();
    }
  }, [id, user]);

  const fetchPrompt = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/prompts/${id}`);
      if (response.data.success) {
        const promptData = response.data.prompt;
        setPrompt(promptData);
        setContent(promptData.content);
      } else {
        throw new Error('获取提示词失败');
      }
    } catch (error: any) {
      console.error('获取提示词失败:', error);
      toast.error('获取提示词失败: ' + error.message);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const collaborativeUrl = `${baseUrl}/collaborative/${id}`;
    setShareLink(collaborativeUrl);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(newContent !== prompt?.content);
  };

  const handleSaveChanges = async () => {
    if (!prompt || !hasUnsavedChanges) return;

    try {
      const response = await api.put(`/prompts/${prompt.id}`, {
        content,
      });

      if (response.data.success) {
        setPrompt(prev => prev ? { ...prev, content } : null);
        setHasUnsavedChanges(false);
        toast.success('更改已保存');
      } else {
        throw new Error('保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error('保存失败: ' + error.message);
    }
  };

  const handleVersionRestore = (restoredContent: string) => {
    setContent(restoredContent);
    setHasUnsavedChanges(restoredContent !== prompt?.content);
    toast.success('版本已恢复，请保存更改');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('分享链接已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动复制链接');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载协作编辑器...</p>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <DocumentDuplicateIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">提示词不存在</h2>
          <p className="text-gray-400 mb-4">请检查链接是否正确</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            返回仪表板
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">需要登录</h2>
          <p className="text-gray-400 mb-4">请登录后使用协作编辑功能</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="btn-primary"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      {/* 导航栏 */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← 返回
              </button>
              <div className="flex items-center gap-3">
                <BoltIcon className="h-6 w-6 text-neon-cyan" />
                <h1 className="text-xl font-semibold text-white truncate max-w-md">
                  {prompt.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveChanges}
                  className="btn-primary flex items-center gap-2"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  保存更改
                </button>
              )}
              
              <button
                onClick={copyShareLink}
                className="btn-secondary flex items-center gap-2"
              >
                <ShareIcon className="h-4 w-4" />
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 提示词信息 */}
        <div className="glass rounded-lg border border-gray-700/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">描述</h3>
              <p className="text-white">{prompt.description || '无描述'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">类别</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-cyan/20 text-neon-cyan">
                {prompt.category}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">创建者</h3>
              <p className="text-white">{prompt.author}</p>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PencilSquareIcon className="h-5 w-5 inline mr-2" />
            协作编辑
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClockIcon className="h-5 w-5 inline mr-2" />
            版本历史
          </button>
        </div>

        {/* 标签页内容 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'editor' && (
            <CollaborativeEditor
              promptId={prompt.id}
              initialContent={content}
              onContentChange={handleContentChange}
              className="min-h-[600px]"
            />
          )}

          {activeTab === 'history' && (
            <VersionHistory
              promptId={prompt.id}
              currentContent={content}
              onRestore={handleVersionRestore}
              className="min-h-[600px]"
            />
          )}
        </motion.div>
      </div>

      {/* 分享链接显示 */}
      {shareLink && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <div className="glass rounded-lg border border-gray-700/50 p-4">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <ShareIcon className="h-4 w-4 text-neon-cyan" />
              协作链接
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="input-primary text-xs flex-1"
              />
              <button
                onClick={copyShareLink}
                className="btn-secondary text-xs"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 