import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  KeyIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  SparklesIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  expires_in_days: number;
  created_at: string;
  last_used_at?: string;
}

const ProfilePage = () => {
  const { user, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState(30);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', name: '个人资料', icon: UserIcon },
    { id: 'api-keys', name: 'API密钥', icon: KeyIcon },
  ];

  const expiryOptions = [
    { value: 7, label: '7天' },
    { value: 30, label: '30天' },
    { value: 90, label: '90天' },
    { value: 365, label: '1年' },
    { value: -1, label: '永不过期' },
  ];

  // 加载API密钥
  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/profile/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('获取API密钥失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('请输入密钥名称');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newKeyName,
          expires_in_days: newKeyExpiry
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys([...apiKeys, data.key]);
        setNewKeyName('');
        setNewKeyExpiry(30);
        setShowCreateForm(false);
      } else {
        alert('创建API密钥失败');
      }
    } catch (error) {
      console.error('创建API密钥失败:', error);
      alert('创建API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('确定要删除这个API密钥吗？')) return;

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/profile/api-keys?id=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
      } else {
        alert('删除API密钥失败');
      }
    } catch (error) {
      console.error('删除API密钥失败:', error);
      alert('删除API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary py-8">
      <div className="container-custom">
        {/* 头部 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">账户管理</h1>
          <p className="text-gray-400">管理您的个人信息和API密钥</p>
        </motion.div>

        {/* 标签页导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-neon-cyan/20">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center space-x-2 py-4 px-1 border-b-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-neon-cyan text-neon-cyan'
                        : 'border-transparent text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg bg-neon-cyan/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* 个人信息卡片 */}
                <div className="glass rounded-2xl p-8 border border-neon-cyan/20">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink p-1">
                        <div className="w-full h-full rounded-full bg-dark-bg-primary flex items-center justify-center">
                          <UserIcon className="h-12 w-12 text-neon-cyan" />
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-green rounded-full border-2 border-dark-bg-primary flex items-center justify-center">
                        <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 mt-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>加入于 {user?.created_at ? formatDate(user.created_at) : '未知'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 glass rounded-xl border border-neon-cyan/10">
                      <SparklesIcon className="h-8 w-8 text-neon-cyan mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">0</div>
                      <div className="text-sm text-gray-400">创建的提示词</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border border-neon-purple/10">
                      <KeyIcon className="h-8 w-8 text-neon-purple mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
                      <div className="text-sm text-gray-400">API密钥</div>
                    </div>
                    <div className="text-center p-4 glass rounded-xl border border-neon-pink/10">
                      <UserIcon className="h-8 w-8 text-neon-pink mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{user?.role || 'user'}</div>
                      <div className="text-sm text-gray-400">账户类型</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                {/* 创建API密钥按钮 */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">API密钥管理</h2>
                    <p className="text-gray-400 mt-1">创建和管理您的API密钥</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>创建密钥</span>
                  </motion.button>
                </div>

                {/* 创建密钥表单 */}
                <AnimatePresence>
                  {showCreateForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass rounded-2xl p-6 border border-neon-cyan/20"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">创建新的API密钥</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            密钥名称
                          </label>
                          <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="例如：开发环境"
                            className="input-primary w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            有效期
                          </label>
                          <select
                            value={newKeyExpiry}
                            onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                            className="input-primary w-full"
                          >
                            {expiryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={createApiKey}
                          disabled={loading || !newKeyName.trim()}
                          className="btn-primary disabled:opacity-50"
                        >
                          {loading ? '创建中...' : '创建密钥'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewKeyName('');
                            setNewKeyExpiry(30);
                          }}
                          className="btn-secondary"
                        >
                          取消
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* API密钥列表 */}
                {loading && !apiKeys.length ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="glass rounded-2xl p-8 border border-neon-cyan/20 text-center">
                    <KeyIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">您还没有创建任何API密钥</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey, index) => (
                      <motion.div
                        key={apiKey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass rounded-2xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                              <span className="px-2 py-1 text-xs rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">
                                活跃
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>创建于 {formatDate(apiKey.created_at)}</span>
                              {apiKey.last_used_at && (
                                <span>最后使用 {formatDate(apiKey.last_used_at)}</span>
                              )}
                              {apiKey.expires_in_days > 0 && (
                                <span>
                                  {apiKey.expires_in_days}天后过期
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <code className="flex-1 bg-dark-bg-secondary p-3 rounded-lg text-neon-cyan font-mono text-sm">
                                {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                              </code>
                              <button
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                                className="p-2 glass rounded-lg hover:bg-neon-cyan/10 transition-colors"
                                title={visibleKeys.has(apiKey.id) ? '隐藏密钥' : '显示密钥'}
                              >
                                {visibleKeys.has(apiKey.id) ? (
                                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                                className="p-2 glass rounded-lg hover:bg-neon-cyan/10 transition-colors"
                                title="复制密钥"
                              >
                                {copiedKey === apiKey.id ? (
                                  <CheckIcon className="h-5 w-5 text-neon-green" />
                                ) : (
                                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteApiKey(apiKey.id)}
                                className="p-2 glass rounded-lg hover:bg-neon-red/10 transition-colors"
                                title="删除密钥"
                              >
                                <TrashIcon className="h-5 w-5 text-neon-red" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default withAuth(ProfilePage);

