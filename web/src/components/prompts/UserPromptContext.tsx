/**
 * 用户提示词上下文组件 - Context Engineering核心展示
 * 这个组件是"为我而生"体验的核心，让用户直观看到个性化是如何发生的
 */

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  UserIcon,
  CogIcon,
  ClockIcon,
  LightBulbIcon,
  FireIcon,
  StarIcon,
  EyeIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  AcademicCapIcon,
  HeartIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { getContextAccessLevel, getPermissionDescription } from '@/lib/context-permissions';
import { useAuth } from '@/contexts/AuthContext';

interface UserPromptContextProps {
  promptId: string;
  isLoggedIn: boolean;
  promptOwnerId: string;
  promptIsPublic: boolean;
  isCollaborator?: boolean;
}

interface UserContextData {
  userPreferences: Record<string, any>;
  promptRules: Array<any>;
  recentInteractions: Array<{
    timestamp: string;
    input?: string;
    output?: string;
    feedback?: 'positive' | 'negative' | null;
    context_applied?: Record<string, any>;
  }>;
  learningInsights: {
    usagePatterns: Record<string, any>;
    preferredStyles: string[];
    improvementSuggestions: string[];
  };
  contextStats: {
    totalInteractions: number;
    successRate: number;
    avgSatisfaction: number;
    personalizedSince: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    if (res.status === 401) {return null;} // 用户未登录，正常处理
    throw new Error('Failed to fetch user context');
  }
  return res.json();
});

const TABS = [
  { id: 'overview', name: '个性化概览', icon: SparklesIcon },
  { id: 'interactions', name: '交互历史', icon: ClockIcon },
  { id: 'rules', name: '适用规则', icon: CogIcon },
  { id: 'insights', name: '学习洞察', icon: LightBulbIcon },
];

// 简化/专业模式
type ViewMode = 'simple' | 'professional';

export default function UserPromptContext({ 
  promptId, 
  isLoggedIn, 
  promptOwnerId, 
  promptIsPublic, 
  isCollaborator = false, 
}: UserPromptContextProps) {
  const { user } = useAuth();
  
  // 计算权限级别
  const accessLevel = user ? getContextAccessLevel(
    user.id,
    promptId,
    promptOwnerId,
    promptIsPublic,
    isCollaborator,
  ) : null;
  
  const permissionDesc = accessLevel ? getPermissionDescription(accessLevel) : null;
  
  const { data, error, isLoading } = useSWR(
    isLoggedIn && accessLevel?.permissions.canViewMyContext ? `/api/prompts/${promptId}/my-context` : null, 
    fetcher,
    {
      refreshInterval: 30000, // 30秒刷新一次
      revalidateOnFocus: false,
      errorRetryCount: 3,
    },
  );

  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // 如果用户未登录，显示引导注册/登录的卡片
  if (!isLoggedIn) {
    return (
      <motion.div 
        className="my-6 p-6 glass rounded-xl border border-neon-blue/30 bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-neon-blue mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">解锁个性化体验</h3>
          <p className="text-gray-300 mb-4">
            登录后即可查看此提示词如何为您量身定制，包括个人偏好、使用历史和智能优化建议。
          </p>
          <div className="flex gap-3 justify-center">
            <button className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/80 transition-colors">
              立即登录
            </button>
            <button className="px-4 py-2 border border-neon-blue/50 text-neon-blue rounded-lg hover:bg-neon-blue/10 transition-colors">
              注册账号
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 如果无权限查看个人上下文
  if (!accessLevel?.permissions.canViewMyContext) {
    return null;
  }

  // 加载状态
  if (isLoading) {
    return (
      <motion.div 
        className="my-6 p-6 glass rounded-xl border border-neon-cyan/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="h-6 w-6 bg-neon-cyan/30 rounded mr-3"></div>
            <div className="h-6 w-40 bg-neon-cyan/30 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600/30 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600/30 rounded w-1/2"></div>
            <div className="h-4 bg-gray-600/30 rounded w-2/3"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <motion.div 
        className="my-6 p-6 glass rounded-xl border border-red-300/30 bg-red-500/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center text-red-400">
          <XCircleIcon className="h-5 w-5 mr-2" />
          <span>加载个性化信息时出错，请稍后重试</span>
        </div>
      </motion.div>
    );
  }

  // 无数据状态（新用户）
  if (!data) {
    return (
      <motion.div 
        className="my-6 p-6 glass rounded-xl border border-neon-purple/30 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <RocketLaunchIcon className="h-12 w-12 text-neon-purple mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">开始您的个性化之旅</h3>
          <p className="text-gray-300 mb-4">
            这是您第一次使用此提示词。开始使用后，我们将为您建立专属的个性化档案。
          </p>
          <button className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-neon-purple/80 transition-colors">
            立即体验
          </button>
        </div>
      </motion.div>
    );
  }

  const contextData = data as UserContextData;

  return (
    <motion.div 
      className="my-6 glass rounded-xl border border-neon-cyan/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 头部 */}
      <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 p-6 border-b border-neon-cyan/20">
        {/* 权限说明 */}
        {permissionDesc && accessLevel?.ownership !== 'owned' && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-5 w-5 text-neon-blue mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-neon-blue">{permissionDesc.title}</div>
                <div className="text-xs text-gray-400 mt-1">{permissionDesc.description}</div>
                {permissionDesc.limitations.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    💡 {permissionDesc.limitations.join('、')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-3 bg-neon-cyan/20 rounded-xl mr-4">
              <SparklesIcon className="h-6 w-6 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white gradient-text flex items-center">
                🚀 我的上下文
                {accessLevel?.ownership === 'owned' ? 
                  <span className="ml-3 px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded">拥有者</span> :
                  <span className="ml-3 px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded">个人数据</span>
                }
              </h3>
              <p className="text-gray-300 text-sm">此提示词如何为您量身定制</p>
            </div>
          </div>
          
          {/* 视图模式切换 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">视图模式:</span>
            <div className="flex bg-dark-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'simple' 
                    ? 'bg-neon-cyan text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                简洁
              </button>
              <button
                onClick={() => setViewMode('professional')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'professional' 
                    ? 'bg-neon-cyan text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                专业
              </button>
            </div>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            icon={EyeIcon}
            label="总使用次数"
            value={contextData.contextStats.totalInteractions}
            color="neon-blue"
          />
          <StatCard
            icon={ArrowTrendingUpIcon}
            label="成功率"
            value={`${contextData.contextStats.successRate}%`}
            color="neon-green"
          />
          <StatCard
            icon={StarIcon}
            label="满意度"
            value={`${contextData.contextStats.avgSatisfaction}/5`}
            color="neon-yellow"
          />
          <StatCard
            icon={HeartIcon}
            label="个性化天数"
            value={calculateDaysPersonalized(contextData.contextStats.personalizedSince)}
            color="neon-pink"
          />
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="border-b border-neon-cyan/20 bg-dark-bg-secondary/30">
        <nav className="flex space-x-1 p-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-neon-cyan text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                } group relative min-w-0 flex-1 py-3 px-4 text-sm font-medium text-center rounded-lg transition-all duration-200`}
              >
                <Icon className="h-5 w-5 mx-auto mb-1" />
                <span className="block truncate">{tab.name}</span>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-neon-cyan/20 rounded-lg"
                    layoutId="activeTab"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent(activeTab, contextData, viewMode)}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 统计卡片组件
function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`inline-flex p-3 rounded-xl bg-${color}/20 mb-2`}>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// 渲染选项卡内容
function renderTabContent(activeTab: string, data: UserContextData, viewMode: ViewMode) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab data={data} viewMode={viewMode} />;
    case 'interactions':
      return <InteractionsTab data={data} viewMode={viewMode} />;
    case 'rules':
      return <RulesTab data={data} viewMode={viewMode} />;
    case 'insights':
      return <InsightsTab data={data} viewMode={viewMode} />;
    default:
      return null;
  }
}

// 概览选项卡
function OverviewTab({ data, viewMode }: { data: UserContextData; viewMode: ViewMode }) {
  return (
    <div className="space-y-6">
      {/* 个人偏好预览 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-neon-blue" />
          您的个人偏好
        </h4>
        {Object.keys(data.userPreferences).length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.userPreferences).map(([key, value]) => (
              <div key={key} className="p-3 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50">
                <div className="text-sm font-medium text-neon-blue capitalize">{key}</div>
                <div className="text-sm text-gray-300">{String(value)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-800/30 rounded-lg border border-dashed border-gray-600">
            <p className="text-gray-400 text-center">
              🎯 尚未设置个人偏好。前往"账户设置"进行配置，获得更精准的个性化体验。
            </p>
          </div>
        )}
      </div>

      {/* 个性化效果展示 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-neon-purple" />
          个性化效果
        </h4>
        <div className="bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 p-4 rounded-lg border border-neon-purple/30">
          <p className="text-sm text-gray-300 mb-2">
            基于您的{data.contextStats.totalInteractions}次使用记录，此提示词已为您优化：
          </p>
          <div className="flex flex-wrap gap-2">
            {data.learningInsights.preferredStyles.map((style, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full"
              >
                {style}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 交互历史选项卡
function InteractionsTab({ data, viewMode }: { data: UserContextData; viewMode: ViewMode }) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
        <ClockIcon className="h-5 w-5 mr-2 text-neon-green" />
        最近交互记录
      </h4>
      {data.recentInteractions.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.recentInteractions.map((interaction, index) => (
            <motion.div
              key={index}
              className="p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-600/30 hover:border-neon-green/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">
                  {new Date(interaction.timestamp).toLocaleString('zh-CN')}
                </span>
                {interaction.feedback && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    interaction.feedback === 'positive' 
                      ? 'bg-neon-green/20 text-neon-green' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {interaction.feedback === 'positive' ? (
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircleIcon className="h-3 w-3 mr-1" />
                    )}
                    {interaction.feedback === 'positive' ? '满意' : '不满意'}
                  </span>
                )}
              </div>
              
              {viewMode === 'professional' && interaction.input && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-neon-blue mb-1">输入:</div>
                  <div className="text-sm text-gray-300 font-mono bg-black/20 p-2 rounded">
                    {interaction.input.length > 100 && viewMode === 'simple'
                      ? `${interaction.input.slice(0, 100)}...`
                      : interaction.input
                    }
                  </div>
                </div>
              )}
              
              {viewMode === 'professional' && Object.keys(interaction.context_applied || {}).length > 0 && (
                <div className="text-xs text-gray-500">
                  应用了个性化上下文: {Object.keys(interaction.context_applied!).join(', ')}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">您还没有使用过这个提示词</p>
          <p className="text-sm text-gray-500 mt-2">开始使用后，这里将显示您的交互历史</p>
        </div>
      )}
    </div>
  );
}

// 规则选项卡
function RulesTab({ data, viewMode }: { data: UserContextData; viewMode: ViewMode }) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
        <CogIcon className="h-5 w-5 mr-2 text-neon-yellow" />
        适应规则
      </h4>
      {data.promptRules.length > 0 ? (
        <div className="space-y-4">
          {data.promptRules.map((rule, index) => (
            <div
              key={index}
              className="p-4 bg-dark-bg-secondary/30 rounded-lg border border-neon-yellow/30"
            >
              {viewMode === 'simple' ? (
                <div className="text-sm text-gray-300">
                  规则 {index + 1}: {typeof rule === 'string' ? rule : JSON.stringify(rule)}
                </div>
              ) : (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {typeof rule === 'object' ? JSON.stringify(rule, null, 2) : rule}
                </pre>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BeakerIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">此提示词没有设置适应规则</p>
          <p className="text-sm text-gray-500 mt-2">规则可以让提示词根据您的偏好自动调整</p>
        </div>
      )}
    </div>
  );
}

// 学习洞察选项卡
function InsightsTab({ data, viewMode }: { data: UserContextData; viewMode: ViewMode }) {
  return (
    <div className="space-y-6">
      {/* 使用模式分析 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-neon-cyan" />
          使用模式分析
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.learningInsights.usagePatterns).map(([key, value]) => (
            <div key={key} className="p-3 bg-dark-bg-secondary/30 rounded-lg border border-neon-cyan/30">
              <div className="text-sm font-medium text-neon-cyan capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
              <div className="text-sm text-gray-300">{String(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 改进建议 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-neon-orange" />
          智能建议
        </h4>
        <div className="space-y-3">
          {data.learningInsights.improvementSuggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              className="flex items-start p-3 bg-gradient-to-r from-neon-orange/10 to-neon-yellow/10 rounded-lg border border-neon-orange/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <LightBulbIcon className="h-4 w-4 text-neon-orange mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-300">{suggestion}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 计算个性化天数
function calculateDaysPersonalized(since: string): string {
  const now = new Date();
  const start = new Date(since);
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {return '今天';}
  if (diffDays === 1) {return '1天';}
  if (diffDays < 30) {return `${diffDays}天`;}
  if (diffDays < 365) {return `${Math.floor(diffDays / 30)}个月`;}
  return `${Math.floor(diffDays / 365)}年`;
}