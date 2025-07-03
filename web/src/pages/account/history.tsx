/**
 * 会话历史查看器页面
 * 
 * 提供完整的用户交互历史展示，包括上下文应用情况、性能分析和趋势洞察
 * 让用户了解自己的使用模式，并从中获得改进建议
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  EyeIcon,
  DocumentTextIcon,
  TagIcon,
  UserIcon,
  BoltIcon,
  HeartIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  FaceSmileIcon,
  FaceFrownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 会话接口
interface ContextSession {
  id: string;
  started_at: string;
  last_activity_at: string;
  total_exchanges: number;
  session_metadata: {
    user_agent?: string;
    ip_address?: string;
    platform?: string;
  };
  status: 'active' | 'completed' | 'abandoned';
}

// 交互接口
interface UserInteraction {
  id: string;
  session_id: string;
  prompt_id: string;
  prompt_name: string;
  created_at: string;
  interaction_data: {
    input: string;
    output: string;
    context_applied?: Record<string, any>;
    processing_time?: number;
    model_used?: string;
  };
  feedback_score?: number;
  user_satisfaction?: number;
  context_effectiveness?: number;
}

// 统计数据接口
interface HistoryStats {
  totalSessions: number;
  totalInteractions: number;
  averageSessionLength: number;
  averageSatisfaction: number;
  mostUsedPrompts: Array<{
    prompt_id: string;
    prompt_name: string;
    usage_count: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    interactions: number;
    satisfaction: number;
  }>;
}

const TIME_FILTERS = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '今年' },
  { value: 'all', label: '全部' }
];

const SATISFACTION_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'high', label: '满意 (4-5分)' },
  { value: 'medium', label: '一般 (2-3分)' },
  { value: 'low', label: '不满意 (1分)' }
];

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ContextSession[]>([]);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  // 过滤器状态
  const [timeFilter, setTimeFilter] = useState('month');
  const [satisfactionFilter, setSatisfactionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI状态
  const [viewMode, setViewMode] = useState<'timeline' | 'sessions' | 'analytics'>('timeline');

  // 加载历史数据
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadHistoryData();
  }, [user, timeFilter, satisfactionFilter]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        timeFilter,
        satisfactionFilter,
        search: searchQuery
      });

      const [sessionsRes, interactionsRes, statsRes] = await Promise.all([
        fetch(`/api/user/sessions?${params}`),
        fetch(`/api/user/interactions?${params}`),
        fetch(`/api/user/history-stats?${params}`)
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }

      if (interactionsRes.ok) {
        const data = await interactionsRes.json();
        setInteractions(data.interactions || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      
    } catch (error) {
      console.error('加载历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 延迟搜索以避免频繁请求
    setTimeout(() => {
      if (query === searchQuery) {
        loadHistoryData();
      }
    }, 500);
  };

  // 获取满意度图标
  const getSatisfactionIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 4) return <FaceSmileIcon className="h-4 w-4 text-green-400" />;
    if (score >= 2) return <UserIcon className="h-4 w-4 text-yellow-400" />;
    return <FaceFrownIcon className="h-4 w-4 text-red-400" />;
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">加载历史记录中...</p>
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
              交互历史
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              回顾您的AI交互历程，发现使用模式和改进机会
            </p>
          </div>

          {/* 统计概览 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                icon={ChatBubbleLeftRightIcon} 
                title="总交互次数" 
                value={stats.totalInteractions}
                trend={stats.weeklyTrends.length > 1 ? 
                  stats.weeklyTrends[stats.weeklyTrends.length - 1].interactions - 
                  stats.weeklyTrends[stats.weeklyTrends.length - 2].interactions : 0
                }
                color="neon-blue"
              />
              <StatCard 
                icon={ClockIcon} 
                title="会话总数" 
                value={stats.totalSessions}
                subtitle={`平均时长 ${Math.round(stats.averageSessionLength)}分钟`}
                color="neon-purple"
              />
              <StatCard 
                icon={HeartIcon} 
                title="平均满意度" 
                value={`${(stats.averageSatisfaction * 20).toFixed(1)}%`}
                subtitle="基于您的反馈"
                color="neon-pink"
              />
              <StatCard 
                icon={StarIcon} 
                title="最常用提示词" 
                value={stats.mostUsedPrompts[0]?.prompt_name || '暂无'}
                subtitle={`使用 ${stats.mostUsedPrompts[0]?.usage_count || 0} 次`}
                color="neon-yellow"
              />
            </div>
          )}
        </motion.div>

        {/* 控制栏 */}
        <motion.div
          className="glass rounded-xl p-6 border border-neon-cyan/20 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 视图模式切换 */}
            <div className="flex bg-dark-bg-secondary rounded-lg p-1">
              {[
                { id: 'timeline', name: '时间线', icon: ClockIcon },
                { id: 'sessions', name: '会话视图', icon: ChatBubbleLeftRightIcon },
                { id: 'analytics', name: '分析报告', icon: ChartBarIcon }
              ].map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as any)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      viewMode === mode.id
                        ? 'bg-neon-cyan text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {mode.name}
                  </button>
                );
              })}
            </div>

            {/* 搜索和过滤器 */}
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索交互内容..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white text-sm w-64"
                />
              </div>

              {/* 时间过滤器 */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white text-sm"
              >
                {TIME_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>

              {/* 满意度过滤器 */}
              <select
                value={satisfactionFilter}
                onChange={(e) => setSatisfactionFilter(e.target.value)}
                className="px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white text-sm"
              >
                {SATISFACTION_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* 主要内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderViewContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // 渲染不同视图内容
  function renderViewContent() {
    switch (viewMode) {
      case 'timeline':
        return <TimelineView />;
      case 'sessions':
        return <SessionsView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <TimelineView />;
    }
  }

  // 时间线视图
  function TimelineView() {
    return (
      <div className="space-y-4">
        {interactions.length > 0 ? (
          interactions.map((interaction, index) => (
            <motion.div
              key={interaction.id}
              className="glass rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neon-cyan/20 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <div>
                    <Link 
                      href={`/prompts/${interaction.prompt_id}`}
                      className="font-semibold text-white hover:text-neon-cyan transition-colors"
                    >
                      {interaction.prompt_name}
                    </Link>
                    <p className="text-sm text-gray-400">{formatTime(interaction.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getSatisfactionIcon(interaction.feedback_score)}
                  {interaction.context_effectiveness && (
                    <div className="flex items-center">
                      <SparklesIcon className="h-4 w-4 text-neon-purple mr-1" />
                      <span className="text-xs text-neon-purple">
                        {Math.round(interaction.context_effectiveness * 100)}%
                      </span>
                    </div>
                  )}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 hover:text-white cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">输入</h4>
                  <div className="p-3 bg-dark-bg-secondary/50 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-200 line-clamp-3">
                      {interaction.interaction_data.input}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">输出</h4>
                  <div className="p-3 bg-dark-bg-secondary/50 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-200 line-clamp-3">
                      {interaction.interaction_data.output}
                    </p>
                  </div>
                </div>
              </div>

              {/* 上下文应用信息 */}
              {interaction.interaction_data.context_applied && (
                <div className="mt-4 p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                  <h4 className="text-sm font-medium text-neon-purple mb-2">应用的上下文</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(interaction.interaction_data.context_applied).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 技术信息 */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600 text-xs text-gray-500">
                <span>
                  处理时间: {interaction.interaction_data.processing_time || 0}ms
                </span>
                <span>
                  模型: {interaction.interaction_data.model_used || '未知'}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">暂无交互记录</h3>
            <p className="text-gray-500">开始使用提示词后，这里将显示您的交互历史</p>
          </div>
        )}
      </div>
    );
  }

  // 会话视图
  function SessionsView() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 会话列表 */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">会话列表</h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedSession === session.id
                    ? 'bg-neon-cyan/20 border-neon-cyan'
                    : 'bg-dark-bg-secondary/50 border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedSession(session.id)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-white">
                    会话 #{session.id.slice(-6)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    session.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    session.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {session.status === 'active' ? '进行中' :
                     session.status === 'completed' ? '已完成' : '已放弃'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{formatTime(session.started_at)}</p>
                <p className="text-xs text-gray-500">{session.total_exchanges} 次交互</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 会话详情 */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <SessionDetail sessionId={selectedSession} />
          ) : (
            <div className="glass rounded-xl p-8 border border-gray-600/30 text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">选择一个会话</h3>
              <p className="text-gray-500">点击左侧会话列表查看详细信息</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 分析视图
  function AnalyticsView() {
    if (!stats) return null;

    return (
      <div className="space-y-8">
        {/* 趋势图表 */}
        <div className="glass rounded-xl p-8 border border-neon-cyan/20">
          <h3 className="text-xl font-bold text-white mb-6">使用趋势</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats.weeklyTrends.map((week, index) => (
              <div key={week.week} className="flex flex-col items-center">
                <div 
                  className="bg-neon-cyan rounded-t w-8 transition-all duration-500 hover:bg-cyan-400"
                  style={{ height: `${(week.interactions / Math.max(...stats.weeklyTrends.map(w => w.interactions))) * 200}px` }}
                  title={`${week.interactions} 次交互`}
                />
                <span className="text-xs text-gray-400 mt-2">{week.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 详细分析 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 最常用提示词 */}
          <div className="glass rounded-xl p-6 border border-gray-600/30">
            <h3 className="text-lg font-bold text-white mb-4">最常用提示词</h3>
            <div className="space-y-3">
              {stats.mostUsedPrompts.slice(0, 5).map((prompt, index) => (
                <div key={prompt.prompt_id} className="flex justify-between items-center">
                  <Link 
                    href={`/prompts/${prompt.prompt_id}`}
                    className="text-sm text-white hover:text-neon-cyan transition-colors truncate"
                  >
                    {prompt.prompt_name}
                  </Link>
                  <span className="text-sm text-gray-400">{prompt.usage_count}次</span>
                </div>
              ))}
            </div>
          </div>

          {/* 改进建议 */}
          <div className="glass rounded-xl p-6 border border-gray-600/30">
            <h3 className="text-lg font-bold text-white mb-4">改进建议</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-300">您的使用频率在增加，继续保持！</p>
              </div>
              <div className="flex items-start">
                <SparklesIcon className="h-4 w-4 text-neon-purple mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-300">尝试使用更多种类的提示词以获得更丰富的体验</p>
              </div>
              <div className="flex items-start">
                <HeartIcon className="h-4 w-4 text-neon-pink mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-300">您的满意度很高，考虑分享您的使用心得</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// 会话详情组件
function SessionDetail({ sessionId }: { sessionId: string }) {
  const [sessionInteractions, setSessionInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionInteractions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/sessions/${sessionId}/interactions`);
        if (response.ok) {
          const data = await response.json();
          setSessionInteractions(data.interactions || []);
        }
      } catch (error) {
        console.error('加载会话详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionInteractions();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-gray-600/30 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
        <p className="text-gray-400">加载会话详情...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 border border-gray-600/30">
      <h3 className="text-lg font-semibold text-white mb-4">
        会话详情 #{sessionId.slice(-6)}
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sessionInteractions.map((interaction, index) => (
          <div key={interaction.id} className="p-4 bg-dark-bg-secondary/50 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">{interaction.prompt_name}</span>
              <span className="text-xs text-gray-400">{formatTime(interaction.created_at)}</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{interaction.interaction_data.input}</p>
            <p className="text-xs text-gray-500">
              {interaction.interaction_data.output.slice(0, 100)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({ icon: Icon, title, value, subtitle, trend, color }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color: string;
}) {
  return (
    <motion.div
      className="glass rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-${color}/20`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center mt-2">
          {trend > 0 ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
          ) : trend < 0 ? (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400 mr-1" />
          ) : null}
          <span className={`text-xs ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
        </div>
      )}
    </motion.div>
  );
}