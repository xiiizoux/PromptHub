import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const DebugPage = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 获取API密钥
      const keysResponse = await fetch(`/api/debug/api-keys?userId=${user.id}`);
      const keysData = await keysResponse.json();
      
      if (keysData.success) {
        setApiKeys(keysData.data || []);
        console.log('API密钥获取成功:', keysData.data?.length || 0);
      } else {
        console.error('获取API密钥失败:', keysData.message);
      }
      
      // 获取用户的提示词列表 - 直接使用管理员权限
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const promptsResponse = await fetch('/api/profile/prompts', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sb-' + supabaseUrl?.split('//')[1].split('.')[0] + '-auth-token')}`
        }
      });
      
      if (promptsResponse.ok) {
        const promptsData = await promptsResponse.json();
        setPrompts(promptsData.prompts || []);
        console.log('提示词获取成功:', promptsData.prompts?.length || 0);
      } else {
        const errorText = await promptsResponse.text();
        console.error('获取提示词失败:', errorText);
      }
    } catch (error) {
      console.error('调试页面获取数据失败:', error);
      setError('获取数据失败，请查看控制台了解详情');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromptDetails = async () => {
    if (!promptName) return;
    
    try {
      const response = await fetch(`/api/debug/prompt-details?name=${promptName}&userId=${user?.id || ''}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('提示词详情获取成功:', data.data);
        alert('提示词详情获取成功，请查看控制台了解详情');
      } else {
        console.error('获取提示词详情失败:', data.message);
        alert(`获取提示词详情失败: ${data.message}`);
      }
    } catch (error) {
      console.error('获取提示词详情时出错:', error);
      alert('获取提示词详情时出错，请查看控制台了解详情');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg-primary p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 border border-neon-red/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">未登录</h2>
            <p className="text-gray-300 mb-6">您需要登录才能访问调试页面</p>
            <Link href="/auth/login" className="btn-primary">
              前往登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-neon-cyan/20 mb-8">
          <h1 className="text-2xl font-bold text-white mb-6">调试页面</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">用户信息</h2>
            <div className="bg-dark-bg-secondary p-4 rounded-lg font-mono text-sm overflow-auto">
              <pre className="text-gray-300">{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">API密钥 ({apiKeys.length})</h2>
              <button 
                onClick={fetchData}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                {loading ? '加载中...' : '刷新数据'}
              </button>
            </div>
            
            {apiKeys.length > 0 ? (
              <div className="bg-dark-bg-secondary p-4 rounded-lg max-h-60 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-dark-bg-primary">
                    <tr>
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">名称</th>
                      <th className="px-4 py-2">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(key => (
                      <tr key={key.id} className="border-b border-gray-700">
                        <td className="px-4 py-2 font-mono">{key.id}</td>
                        <td className="px-4 py-2">{key.name}</td>
                        <td className="px-4 py-2">{new Date(key.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 bg-dark-bg-secondary rounded-lg">
                <p className="text-gray-400">没有找到API密钥</p>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">提示词 ({prompts.length})</h2>
            
            {prompts.length > 0 ? (
              <div className="bg-dark-bg-secondary p-4 rounded-lg max-h-60 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-dark-bg-primary">
                    <tr>
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">名称</th>
                      <th className="px-4 py-2">状态</th>
                      <th className="px-4 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map(prompt => (
                      <tr key={prompt.id} className="border-b border-gray-700">
                        <td className="px-4 py-2 font-mono">{prompt.id}</td>
                        <td className="px-4 py-2">{prompt.name}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            prompt.is_public 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-yellow-900/50 text-yellow-300'
                          }`}>
                            {prompt.is_public ? '公开' : '私有'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <a 
                              href={`/prompts/${prompt.id}`} 
                              target="_blank"
                              className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded hover:bg-blue-800/50"
                            >
                              公开页面
                            </a>
                            <a 
                              href={`/prompts/${prompt.id}/edit`} 
                              target="_blank"
                              className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800/50"
                            >
                              编辑页面
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 bg-dark-bg-secondary rounded-lg">
                <p className="text-gray-400">没有找到提示词</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">提示词详情测试</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="输入提示词名称"
                className="input flex-1"
              />
              <button
                onClick={fetchPromptDetails}
                className="btn-primary"
                disabled={!promptName}
              >
                获取详情
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Link href="/profile" className="btn-secondary">
            返回个人中心
          </Link>
          <Link href="/" className="btn-outline">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
