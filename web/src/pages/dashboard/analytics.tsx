import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NextPage } from 'next';
import { 
  ChartBarIcon, 
  SparklesIcon,
  CpuChipIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';
import { RecommendationEngine } from '@/components/RecommendationEngine';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { SystemDashboard } from '@/components/SystemDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const AnalyticsPage: NextPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'performance' | 'system'>('recommendations');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  // 模拟提示词列表（实际应该从API获取）
  const [userPrompts, setUserPrompts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('请先登录');
      router.push('/auth/login');
      return;
    }

    // 获取用户的提示词列表
    fetchUserPrompts();
  }, [user, isLoading, router]);

  const fetchUserPrompts = async () => {
    // 这里应该调用API获取用户的提示词列表
    // 暂时使用模拟数据
    setUserPrompts([
      { id: '1', name: '代码助手' },
      { id: '2', name: '文案创作' },
      { id: '3', name: '数据分析' },
      { id: '4', name: '教学辅导' }
    ]);
  };

  const tabs = [
    {
      id: 'recommendations',
      name: '智能推荐',
      icon: SparklesIcon,
      description: '发现相关内容和个性化推荐',
      color: 'text-neon-cyan'
    },
    {
      id: 'performance',
      name: '性能监控',
      icon: ChartBarIcon,
      description: '提示词性能分析和优化建议',
      color: 'text-neon-purple'
    },
    {
      id: 'system',
      name: '系统概览',
      icon: CpuChipIcon,
      description: '平台整体运行状态',
      color: 'text-neon-pink'
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-neon-cyan mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <ChartBarIcon className="h-8 w-8 md:h-12 md:w-12 text-neon-cyan mr-4 inline" />
              数据分析中心
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              深入了解您的提示词性能和发现新的内容
            </motion.p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-400">
              实时更新 • 智能分析
            </span>
          </div>
        </div>

        {/* 功能标签页 */}
        <div className="flex space-x-1 bg-dark-bg-secondary/50 p-1 rounded-xl border border-gray-700/50">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all duration-200 flex-1 ${
                  isActive
                    ? 'bg-dark-bg-primary border border-neon-cyan/30 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-bg-secondary/30'
                }`}
              >
                <IconComponent className={`h-5 w-5 ${isActive ? tab.color : ''}`} />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 内容区域 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[600px]"
        >
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* 推荐控制面板 */}
              <div className="glass rounded-xl border border-neon-cyan/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="h-6 w-6 text-neon-cyan" />
                    <h3 className="text-lg font-semibold text-white">推荐设置</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 选择提示词用于相似推荐 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      选择提示词 (用于相似推荐)
                    </label>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="input-primary w-full"
                    >
                      <option value="">选择一个提示词...</option>
                      {userPrompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-3 p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                    <UserGroupIcon className="h-8 w-8 text-neon-purple" />
                    <div>
                      <div className="text-2xl font-bold text-white">1,234</div>
                      <div className="text-sm text-gray-400">推荐精度</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-neon-pink/10 rounded-lg border border-neon-pink/20">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-neon-pink" />
                    <div>
                      <div className="text-2xl font-bold text-white">89%</div>
                      <div className="text-sm text-gray-400">匹配成功率</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 推荐引擎 */}
              <RecommendationEngine 
                currentPromptId={selectedPromptId || undefined}
                userId={user.id}
                maxRecommendations={12}
              />
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* 性能监控控制面板 */}
              <div className="glass rounded-xl border border-neon-purple/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="h-6 w-6 text-neon-purple" />
                    <h3 className="text-lg font-semibold text-white">性能分析</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 选择提示词用于性能分析 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      选择要分析的提示词
                    </label>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="input-primary w-full"
                    >
                      <option value="">选择一个提示词...</option>
                      {userPrompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-3 p-4 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20">
                    <DocumentTextIcon className="h-8 w-8 text-neon-cyan" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {selectedPromptId ? '--' : '4.8'}
                      </div>
                      <div className="text-sm text-gray-400">平均评分</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-neon-yellow/10 rounded-lg border border-neon-yellow/20">
                    <CpuChipIcon className="h-8 w-8 text-neon-yellow" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {selectedPromptId ? '--' : '456ms'}
                      </div>
                      <div className="text-sm text-gray-400">平均响应时间</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 性能监控组件 */}
              {selectedPromptId ? (
                <PerformanceMonitor promptId={selectedPromptId} />
              ) : (
                <div className="glass rounded-xl border border-gray-700/50 p-12 text-center">
                  <ChartBarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">选择提示词</h3>
                  <p className="text-gray-500">
                    请选择一个提示词来查看详细的性能分析
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* 系统概览统计 */}
              <div className="glass rounded-xl border border-neon-pink/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CpuChipIcon className="h-6 w-6 text-neon-pink" />
                    <h3 className="text-lg font-semibold text-white">系统概览</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm text-gray-400">系统运行正常</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-dark-bg-secondary/30 rounded-lg">
                    <div className="text-2xl font-bold text-neon-cyan">99.9%</div>
                    <div className="text-sm text-gray-400">系统可用性</div>
                  </div>
                  
                  <div className="text-center p-4 bg-dark-bg-secondary/30 rounded-lg">
                    <div className="text-2xl font-bold text-neon-purple">1,247</div>
                    <div className="text-sm text-gray-400">在线用户</div>
                  </div>
                  
                  <div className="text-center p-4 bg-dark-bg-secondary/30 rounded-lg">
                    <div className="text-2xl font-bold text-neon-pink">8,456</div>
                    <div className="text-sm text-gray-400">今日请求</div>
                  </div>
                  
                  <div className="text-center p-4 bg-dark-bg-secondary/30 rounded-lg">
                    <div className="text-2xl font-bold text-neon-yellow">385ms</div>
                    <div className="text-sm text-gray-400">平均延迟</div>
                  </div>
                </div>
              </div>

              {/* 系统仪表板 */}
              <SystemDashboard />
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage; 