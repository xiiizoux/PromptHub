import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// API密钥接口
interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

// 新API密钥响应
interface NewApiKeyResponse {
  apiKey: string;
  name: string;
  expiresInDays: number;
}

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent('/profile/api-keys'));
      return;
    }

    loadApiKeys();
  }, [user, router]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await getToken();
      const response = await axios.get('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setApiKeys(response.data.data || []);
      } else {
        setError(response.data.error || '获取API密钥失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '获取API密钥时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('密钥名称不能为空');
      return;
    }
    
    try {
      setError(null);
      setIsGenerating(true);
      
      const token = await getToken();
      const response = await axios.post('/api/api-keys', {
        name: newKeyName.trim(),
        expiresInDays
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNewApiKey(response.data.data.apiKey);
        setNewKeyName('');
        loadApiKeys();
      } else {
        setError(response.data.error || '创建API密钥失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '创建API密钥时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteApiKey = async (id: string, name: string) => {
    if (!confirm(`确定要删除密钥 "${name}" 吗？此操作无法撤销。`)) {
      return;
    }
    
    try {
      setError(null);
      
      const token = await getToken();
      const response = await axios.delete(`/api/api-keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        loadApiKeys();
      } else {
        setError(response.data.error || '删除API密钥失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '删除API密钥时发生错误');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '无';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">API密钥管理</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {newApiKey && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">新API密钥已生成</h3>
          <p className="text-yellow-700 mb-2">
            请立即复制并安全保存此密钥。出于安全原因，它不会再次显示。
          </p>
          <div className="flex">
            <code className="flex-1 bg-white p-2 border border-yellow-300 rounded text-sm overflow-x-auto">
              {newApiKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newApiKey);
                alert('API密钥已复制到剪贴板');
              }}
              className="ml-2 px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              复制
            </button>
          </div>
          <button
            onClick={() => setNewApiKey(null)}
            className="mt-2 text-sm text-yellow-700 hover:underline"
          >
            我已保存密钥，关闭此消息
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">创建新API密钥</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密钥名称
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="例如：开发环境"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              有效期（天）
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={7}>7天</option>
              <option value={30}>30天</option>
              <option value={90}>90天</option>
              <option value={365}>365天</option>
              <option value={0}>永不过期</option>
            </select>
          </div>
        </div>
        <button
          onClick={generateApiKey}
          disabled={!newKeyName.trim() || isGenerating}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '生成API密钥'}
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">我的API密钥</h2>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">加载中...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">您还没有创建任何API密钥</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后使用
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    过期日期
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{key.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(key.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at ? formatDate(key.last_used_at) : '从未使用'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.expires_at ? formatDate(key.expires_at) : '永不过期'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteApiKey(key.id, key.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// 使用身份验证高阶组件包装组件
export default withAuth(ApiKeysPage);
