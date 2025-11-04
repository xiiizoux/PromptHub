/**
 * Context Engineering 页面
 * 
 * 独立的Context Engineering功能页面，采用与账户管理相同的标签页形式
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  CogIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  CircleStackIcon,
  BookOpenIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 标签页定义
const TABS = [
  { id: 'personalization', name: '个性化设置', icon: AdjustmentsHorizontalIcon },
  { id: 'optimization', name: '提示词优化', icon: SparklesIcon },
  { id: 'context-analysis', name: '上下文分析', icon: CpuChipIcon },
  { id: 'state', name: '上下文状态', icon: CircleStackIcon },
  { id: 'config', name: '配置管理', icon: CogIcon },
  { id: 'memories', name: '上下文记忆', icon: BookOpenIcon },
  { id: 'executions', name: '执行历史', icon: ClockIcon },
  { id: 'conversation', name: '对话管理', icon: ChatBubbleLeftRightIcon },
  { id: 'templates', name: '模板库', icon: DocumentTextIcon },
];

export default function ContextEngineeringPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [loading, setLoading] = useState(false);

  // 检查用户认证状态
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="container-custom py-8">

        {/* 页面头部 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white gradient-text mb-2">
              上下文工程
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              智能上下文工程，让AI更好地理解您的需求和偏好
            </p>
          </div>

        </motion.div>

        {/* 选项卡导航 */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-xl p-1 border border-neon-cyan/30">
            <nav className="flex space-x-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-neon-cyan text-black'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 选项卡内容 */}
        <motion.div
          className="glass rounded-xl border border-neon-cyan/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 快速统计 */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              icon={UserIcon} 
              title="个性化配置" 
              value="活跃"
              subtitle="AI适应您的风格"
              color="neon-blue"
            />
            <StatCard 
              icon={SparklesIcon} 
              title="优化建议" 
              value="5"
              subtitle="本周推荐"
              color="neon-purple"
            />
            <StatCard 
              icon={CpuChipIcon} 
              title="上下文分析" 
              value="进行中"
              subtitle="智能分析"
              color="neon-green"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );

  // 渲染选项卡内容
  function renderTabContent() {
    switch (activeTab) {
      case 'personalization':
        return <PersonalizationTab />;
      case 'optimization':
        return <OptimizationTab />;
      case 'context-analysis':
        return <ContextAnalysisTab />;
      case 'state':
        return <ContextStateTab />;
      case 'config':
        return <ContextConfigTab />;
      case 'memories':
        return <ContextMemoriesTab />;
      case 'executions':
        return <ContextExecutionsTab />;
      case 'conversation':
        return <ConversationTab />;
      case 'templates':
        return <TemplatesTab />;
      default:
        return null;
    }
  }

  // 个性化设置选项卡
  function PersonalizationTab() {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">个性化设置</h2>
          <Link 
            href="/account/personalization"
            className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            详细设置
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 快速设置 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">快速设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">AI语言风格</span>
                <select className="px-3 py-1 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm">
                  <option>专业</option>
                  <option>友好</option>
                  <option>正式</option>
                  <option>轻松</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">回答详细度</span>
                <select className="px-3 py-1 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm">
                  <option>适中</option>
                  <option>简洁</option>
                  <option>详细</option>
                  <option>全面</option>
                </select>
              </div>
            </div>
          </div>

          {/* 个性化状态 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">个性化状态</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">学习进度</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div className="bg-neon-blue h-2 rounded-full w-3/4"></div>
                  </div>
                  <span className="text-sm text-neon-blue">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">偏好匹配</span>
                <span className="text-sm text-neon-green">高</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">数据样本</span>
                <span className="text-sm text-gray-400">156 次对话</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 提示词优化选项卡
  function OptimizationTab() {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">提示词优化</h2>
          <Link 
            href="/optimizer"
            className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            打开优化器
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 优化建议 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">智能优化建议</h3>
            <div className="space-y-4">
              <div className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">结构优化</h4>
                <p className="text-sm text-gray-300">建议在提示词中添加明确的角色定义和任务说明</p>
              </div>
              <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">语言优化</h4>
                <p className="text-sm text-gray-300">使用更具体的词汇可以提高回答质量</p>
              </div>
              <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">格式优化</h4>
                <p className="text-sm text-gray-300">添加输出格式说明将使结果更符合预期</p>
              </div>
            </div>
          </div>

          {/* 优化历史 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">优化历史</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-600/30">
                <span className="text-gray-300">代码生成提示词</span>
                <span className="text-sm text-neon-green">+25%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-600/30">
                <span className="text-gray-300">创意写作提示词</span>
                <span className="text-sm text-neon-blue">+18%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-600/30">
                <span className="text-gray-300">数据分析提示词</span>
                <span className="text-sm text-neon-purple">+32%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 上下文分析选项卡
  function ContextAnalysisTab() {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-6">上下文分析</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 分析结果 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">智能分析结果</h3>
            <div className="space-y-4">
              <div className="p-4 bg-dark-bg-secondary/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">上下文理解度</h4>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-neon-green h-2 rounded-full w-5/6"></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">AI对当前对话上下文的理解程度：83%</p>
              </div>
              <div className="p-4 bg-dark-bg-secondary/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">关键词提取</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-neon-blue/20 text-neon-blue rounded text-sm">技术</span>
                  <span className="px-2 py-1 bg-neon-green/20 text-neon-green rounded text-sm">开发</span>
                  <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded text-sm">优化</span>
                </div>
              </div>
            </div>
          </div>

          {/* 分析设置 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">分析设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">自动分析</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-11 h-6 bg-neon-green rounded-full">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5 mt-0.5"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">深度分析</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" />
                  <div className="w-11 h-6 bg-gray-600 rounded-full">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-0.5 mt-0.5"></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分析频率
                </label>
                <select className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white">
                  <option>每次对话</option>
                  <option>每5次对话</option>
                  <option>每10次对话</option>
                  <option>手动触发</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 对话管理选项卡
  function ConversationTab() {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-6">对话管理</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 对话历史 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">最近对话</h3>
            <div className="space-y-3">
              <div className="p-3 bg-dark-bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">代码优化讨论</span>
                  <span className="text-sm text-gray-400">2小时前</span>
                </div>
                <p className="text-sm text-gray-300">关于React组件性能优化的讨论...</p>
              </div>
              <div className="p-3 bg-dark-bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">提示词创建</span>
                  <span className="text-sm text-gray-400">5小时前</span>
                </div>
                <p className="text-sm text-gray-300">创建了一个新的技术文档写作提示词...</p>
              </div>
            </div>
          </div>

          {/* 对话设置 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">对话设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  上下文长度
                </label>
                <select className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white">
                  <option>短期 (最近5轮)</option>
                  <option>中期 (最近10轮)</option>
                  <option>长期 (最近20轮)</option>
                  <option>完整对话</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  记忆级别
                </label>
                <select className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white">
                  <option>基础</option>
                  <option>标准</option>
                  <option>增强</option>
                  <option>完全记忆</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">自动保存对话</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-11 h-6 bg-neon-green rounded-full">
                    <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5 mt-0.5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 上下文状态选项卡
  function ContextStateTab() {
    const [stateData, setStateData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');

    const loadState = useCallback(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/context/state?sessionId=${sessionId || ''}&includeHistory=true&historyLimit=10`);
        const result = await response.json();
        if (result.success) {
          setStateData(result.data);
          toast.success('上下文状态加载成功');
        } else {
          toast.error(result.error || '加载失败');
        }
      } catch (error: any) {
        toast.error(error.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }, [sessionId]);

    useEffect(() => {
      loadState();
    }, [loadState]);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">上下文状态</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="会话ID (可选)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
            />
            <button
              onClick={loadState}
              disabled={loading}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
          </div>
        ) : stateData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-lg p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4">当前状态</h3>
              <pre className="text-sm text-gray-300 overflow-auto max-h-96 bg-dark-bg-secondary p-4 rounded">
                {JSON.stringify(stateData, null, 2)}
              </pre>
            </div>
            <div className="glass rounded-lg p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-4">状态信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">会话ID</span>
                  <span className="text-white">{stateData.sessionId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">用户ID</span>
                  <span className="text-white">{stateData.userId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">状态级别</span>
                  <span className="text-white">{stateData.contextLevel || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            暂无上下文状态数据
          </div>
        )}
      </div>
    );
  }

  // 配置管理选项卡
  function ContextConfigTab() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [configType, setConfigType] = useState('preferences');

    const loadConfigs = useCallback(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/context/config?action=list&configType=${configType}`);
        const result = await response.json();
        if (result.success) {
          setConfigs(Array.isArray(result.data) ? result.data : [result.data]);
          toast.success('配置加载成功');
        } else {
          toast.error(result.error || '加载失败');
        }
      } catch (error: any) {
        toast.error(error.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }, [configType]);

    useEffect(() => {
      loadConfigs();
    }, [loadConfigs]);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">配置管理</h2>
          <div className="flex gap-2">
            <select
              value={configType}
              onChange={(e) => setConfigType(e.target.value)}
              className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
            >
              <option value="preferences">偏好设置</option>
              <option value="adaptation_rules">适应规则</option>
              <option value="experiment_config">实验配置</option>
            </select>
            <button
              onClick={loadConfigs}
              disabled={loading}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
          </div>
        ) : (
          <div className="glass rounded-lg p-6 border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">{configType === 'preferences' ? '偏好设置' : configType === 'adaptation_rules' ? '适应规则' : '实验配置'}</h3>
            {configs.length > 0 ? (
              <pre className="text-sm text-gray-300 overflow-auto max-h-96 bg-dark-bg-secondary p-4 rounded">
                {JSON.stringify(configs, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-8 text-gray-400">暂无配置数据</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 上下文记忆选项卡
  function ContextMemoriesTab() {
    const [memories, setMemories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [memoryType, setMemoryType] = useState('');

    const loadMemories = useCallback(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (memoryType) params.append('memoryType', memoryType);
        params.append('limit', '50');
        const response = await fetch(`/api/context/memories?${params.toString()}`);
        const result = await response.json();
        if (result.success) {
          setMemories(result.data || []);
          toast.success('记忆加载成功');
        } else {
          toast.error(result.error || '加载失败');
        }
      } catch (error: any) {
        toast.error(error.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }, [memoryType]);

    useEffect(() => {
      loadMemories();
    }, [loadMemories]);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">上下文记忆</h2>
          <div className="flex gap-2">
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
            >
              <option value="">全部类型</option>
              <option value="preference">偏好</option>
              <option value="pattern">模式</option>
              <option value="knowledge">知识</option>
              <option value="interaction">交互</option>
            </select>
            <button
              onClick={loadMemories}
              disabled={loading}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
          </div>
        ) : memories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((memory) => (
              <div key={memory.id} className="glass rounded-lg p-4 border border-gray-600/30 hover:border-neon-cyan/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{memory.title || memory.memory_type}</h3>
                  <span className="text-xs text-gray-500">{memory.memory_type}</span>
                </div>
                <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                  {typeof memory.content === 'object' ? JSON.stringify(memory.content) : memory.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>重要性: {memory.importance_score?.toFixed(2) || 'N/A'}</span>
                  <span>{memory.updated_at ? new Date(memory.updated_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">暂无记忆数据</div>
        )}
      </div>
    );
  }

  // 执行历史选项卡
  function ContextExecutionsTab() {
    const [executions, setExecutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toolName, setToolName] = useState('');

    const loadExecutions = useCallback(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (toolName) params.append('toolName', toolName);
        params.append('limit', '50');
        const response = await fetch(`/api/context/executions?${params.toString()}`);
        const result = await response.json();
        if (result.success) {
          setExecutions(result.data || []);
          toast.success('执行历史加载成功');
        } else {
          toast.error(result.error || '加载失败');
        }
      } catch (error: any) {
        toast.error(error.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }, [toolName]);

    useEffect(() => {
      loadExecutions();
    }, [loadExecutions]);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">执行历史</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="工具名称 (可选)"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white text-sm"
            />
            <button
              onClick={loadExecutions}
              disabled={loading}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto"></div>
          </div>
        ) : executions.length > 0 ? (
          <div className="space-y-4">
            {executions.map((execution) => (
              <div key={execution.id} className="glass rounded-lg p-4 border border-gray-600/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{execution.tool_name}</h3>
                    <p className="text-sm text-gray-400">{execution.session_id || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {execution.created_at ? new Date(execution.created_at).toLocaleString() : ''}
                    </span>
                    {execution.execution_time_ms && (
                      <div className="text-xs text-neon-green mt-1">{execution.execution_time_ms}ms</div>
                    )}
                  </div>
                </div>
                {execution.context_enhanced && (
                  <span className="inline-block px-2 py-1 bg-neon-purple/20 text-neon-purple rounded text-xs mb-2">
                    上下文增强
                  </span>
                )}
                {execution.input_params && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-300 cursor-pointer">查看详情</summary>
                    <pre className="text-xs text-gray-400 mt-2 bg-dark-bg-secondary p-2 rounded overflow-auto">
                      {JSON.stringify(execution.input_params, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">暂无执行历史</div>
        )}
      </div>
    );
  }

  // 模板库选项卡
  function TemplatesTab() {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">模板库</h2>
          <button className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors">
            创建模板
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 模板卡片 */}
          <div className="glass rounded-lg p-6 border border-gray-600/30 hover:border-neon-cyan/50 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-2">代码审查模板</h3>
            <p className="text-sm text-gray-300 mb-4">用于代码审查和优化建议的专业模板</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">使用次数：23</span>
              <button className="px-3 py-1 bg-neon-blue/20 text-neon-blue rounded text-sm hover:bg-neon-blue/30">
                使用
              </button>
            </div>
          </div>

          <div className="glass rounded-lg p-6 border border-gray-600/30 hover:border-neon-cyan/50 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-2">创意写作模板</h3>
            <p className="text-sm text-gray-300 mb-4">激发创意灵感的写作辅助模板</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">使用次数：15</span>
              <button className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded text-sm hover:bg-neon-purple/30">
                使用
              </button>
            </div>
          </div>

          <div className="glass rounded-lg p-6 border border-gray-600/30 hover:border-neon-cyan/50 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-2">数据分析模板</h3>
            <p className="text-sm text-gray-300 mb-4">结构化数据分析和报告生成模板</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">使用次数：31</span>
              <button className="px-3 py-1 bg-neon-green/20 text-neon-green rounded text-sm hover:bg-neon-green/30">
                使用
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// 统计卡片组件
function StatCard({ icon: Icon, title, value, subtitle, color }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  return (
    <motion.div
      className="glass rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl bg-${color}/20`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </motion.div>
  );
}