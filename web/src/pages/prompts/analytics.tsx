/**
 * 个人提示词深度分析中心
 * 
 * 让每个用户成为自己提示词生态的"专家管理员"
 * 提供数据驱动的洞察，帮助用户优化AI使用效率
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  LightBulbIcon,
  BeakerIcon,
  SparklesIcon,
  TrendingUpIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 数据接口定义
interface PromptAnalytics {
  id: string;
  name: string;
  totalUsage: number;
  successRate: number;
  avgSatisfaction: number;
  avgResponseTime: number;
  lastUsed: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  categories: string[];
  contextEngineering: boolean;
}

interface UsagePattern {
  timeOfDay: { hour: number; usage: number }[];
  weeklyPattern: { day: string; usage: number }[];
  topPrompts: PromptAnalytics[];
  performanceMetrics: {
    totalInteractions: number;
    avgSatisfaction: number;
    mostProductiveHour: number;
    favoriteCategories: string[];
  };
}

interface PersonalExperiment {
  id: string;
  name: string;
  promptId: string;
  promptName: string;
  status: 'running' | 'completed' | 'paused';
  variants: {
    name: string;
    traffic: number;
    successRate: number;
    avgSatisfaction: number;
  }[];
  startDate: string;
  endDate?: string;
  insights?: string[];
}

interface OptimizationSuggestion {
  type: 'performance' | 'engagement' | 'satisfaction' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
  promptId?: string;
}

const TABS = [
  { id: 'overview', name: '总览', icon: ChartBarIcon, description: '个人AI使用全景' },
  { id: 'prompts', name: '提示词分析', icon: DocumentTextIcon, description: '深度性能洞察' },
  { id: 'experiments', name: 'A/B测试', icon: BeakerIcon, description: '个人优化实验' },
  { id: 'optimization', name: '优化建议', icon: LightBulbIcon, description: 'AI驱动改进方案' }
];

export default function PromptAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  
  // 数据状态
  const [usagePattern, setUsagePattern] = useState<UsagePattern | null>(null);
  const [promptAnalytics, setPromptAnalytics] = useState<PromptAnalytics[]>([]);
  const [personalExperiments, setPersonalExperiments] = useState<PersonalExperiment[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadAnalyticsData();
  }, [user, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 模拟API调用 - 在实际环境中这些将调用真实的API端点
      const [usageRes, promptsRes, experimentsRes, suggestionsRes] = await Promise.all([
        // fetch(`/api/analytics/usage-patterns?range=${dateRange}`),
        // fetch(`/api/analytics/prompts?range=${dateRange}`),
        // fetch(`/api/analytics/experiments`),
        // fetch(`/api/analytics/optimization-suggestions`)
        
        // 模拟数据
        Promise.resolve(generateMockUsagePattern()),
        Promise.resolve(generateMockPromptAnalytics()),
        Promise.resolve(generateMockExperiments()),
        Promise.resolve(generateMockOptimizationSuggestions())
      ]);

      setUsagePattern(usageRes);
      setPromptAnalytics(promptsRes);
      setPersonalExperiments(experimentsRes);
      setOptimizationSuggestions(suggestionsRes);
      
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据生成函数
  const generateMockUsagePattern = (): UsagePattern => ({
    timeOfDay: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      usage: Math.floor(Math.random() * 50) + (i >= 9 && i <= 17 ? 20 : 5)
    })),
    weeklyPattern: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
      day,
      usage: Math.floor(Math.random() * 100) + 20
    })),
    topPrompts: [],
    performanceMetrics: {
      totalInteractions: 1247,
      avgSatisfaction: 4.3,
      mostProductiveHour: 14,
      favoriteCategories: ['编程助手', '写作优化', '数据分析']
    }
  });

  const generateMockPromptAnalytics = (): PromptAnalytics[] => [
    {
      id: '1',
      name: 'Python代码优化助手',
      totalUsage: 156,
      successRate: 92,
      avgSatisfaction: 4.5,
      avgResponseTime: 2.3,
      lastUsed: '2小时前',
      trend: 'up',
      trendValue: 12,
      categories: ['编程', '优化'],
      contextEngineering: true
    },
    {
      id: '2', 
      name: '技术文档写作',
      totalUsage: 89,
      successRate: 87,
      avgSatisfaction: 4.2,
      avgResponseTime: 3.1,
      lastUsed: '1天前',
      trend: 'stable',
      trendValue: 0,
      categories: ['写作', '技术'],
      contextEngineering: false
    },
    {
      id: '3',
      name: '数据分析脚本生成',
      totalUsage: 67,
      successRate: 94,
      avgSatisfaction: 4.7,
      avgResponseTime: 1.8,
      lastUsed: '3小时前',
      trend: 'up',
      trendValue: 8,
      categories: ['数据', '分析'],
      contextEngineering: true
    }
  ];

  const generateMockExperiments = (): PersonalExperiment[] => [
    {
      id: '1',
      name: '编程助手风格测试',
      promptId: '1',
      promptName: 'Python代码优化助手',
      status: 'running',
      variants: [
        { name: '正式风格', traffic: 50, successRate: 92, avgSatisfaction: 4.5 },
        { name: '友好风格', traffic: 50, successRate: 89, avgSatisfaction: 4.3 }
      ],
      startDate: '2023-12-01',
      insights: ['正式风格在复杂任务中表现更好', '友好风格提升了用户参与度']
    }
  ];

  const generateMockOptimizationSuggestions = (): OptimizationSuggestion[] => [
    {
      type: 'performance',
      priority: 'high',
      title: '启用Context Engineering',
      description: '为您最常用的3个提示词启用Context Engineering，预计可提升15%的满意度',
      expectedImpact: '+15% 满意度, -20% 响应时间',
      actionItems: [
        '为"Python代码优化助手"添加用户偏好适应',
        '配置基于历史交互的动态示例选择',
        '设置智能上下文记忆机制'
      ],
      promptId: '1'
    },
    {
      type: 'efficiency',
      priority: 'medium', 
      title: '优化使用时间',
      description: '分析显示您在下午2-4点使用AI效率最高，建议调整重要任务时间',
      expectedImpact: '+25% 生产力',
      actionItems: [
        '将复杂编程任务安排在14:00-16:00',
        '利用午后高效时段处理创作任务',
        '设置智能提醒优化工作节奏'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">分析您的AI使用数据中...</p>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white gradient-text mb-2">
                🧠 AI使用分析中心
              </h1>
              <p className="text-gray-400 max-w-2xl">
                深度分析您的AI交互数据，发现使用模式，优化工作效率
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="7d">近7天</option>
                <option value="30d">近30天</option>
                <option value="90d">近90天</option>
                <option value="1y">近1年</option>
              </select>
              
              <Link
                href="/tools/advanced-ce"
                className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center text-sm"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                高级工具
              </Link>
            </div>
          </div>

          {/* 快速统计 */}
          {usagePattern && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={BoltIcon}
                title="总交互次数"
                value={usagePattern.performanceMetrics.totalInteractions}
                trend={12}
                color="neon-blue"
              />
              <StatCard
                icon={StarIcon}
                title="平均满意度"
                value={`${usagePattern.performanceMetrics.avgSatisfaction}/5`}
                trend={0.2}
                color="neon-yellow"
              />
              <StatCard
                icon={ClockIcon}
                title="高效时段"
                value={`${usagePattern.performanceMetrics.mostProductiveHour}:00`}
                subtitle="最佳工作时间"
                color="neon-green"
              />
              <StatCard
                icon={FireIcon}
                title="活跃提示词"
                value={promptAnalytics.length}
                subtitle="个人AI助手"
                color="neon-pink"
              />
            </div>
          )}
        </motion.div>

        {/* 选项卡导航 */}
        <motion.div
          className="glass rounded-xl border border-neon-cyan/20 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6">
            <nav className="flex space-x-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-neon-cyan text-black'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className={`text-xs ${
                        activeTab === tab.id ? 'text-black/70' : 'text-gray-500'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* 主要内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // 渲染选项卡内容
  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'prompts':
        return <PromptsAnalysisTab />;
      case 'experiments':
        return <ExperimentsTab />;
      case 'optimization':
        return <OptimizationTab />;
      default:
        return null;
    }
  }

  // 总览选项卡
  function OverviewTab() {
    if (!usagePattern) return null;

    return (
      <div className="space-y-8">
        {/* 使用模式图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 每日使用分布 */}
          <div className="glass rounded-xl p-6 border border-neon-cyan/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-neon-blue" />
              每日使用分布
            </h3>
            <div className="h-48 flex items-end justify-between space-x-1">
              {usagePattern.timeOfDay.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-neon-blue rounded-t w-3 transition-all duration-500 hover:bg-blue-400"
                    style={{ height: `${(item.usage / Math.max(...usagePattern.timeOfDay.map(h => h.usage))) * 160}px` }}
                    title={`${item.hour}:00 - ${item.usage}次`}
                  />
                  {index % 4 === 0 && (
                    <span className="text-xs text-gray-400 mt-1">{item.hour}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-3">
              📊 您在 {usagePattern.performanceMetrics.mostProductiveHour}:00 时段最活跃
            </p>
          </div>

          {/* 周使用模式 */}
          <div className="glass rounded-xl p-6 border border-neon-cyan/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-neon-green" />
              周使用模式
            </h3>
            <div className="space-y-3">
              {usagePattern.weeklyPattern.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-gray-300 w-12">{item.day}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-4 bg-dark-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-green to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${(item.usage / Math.max(...usagePattern.weeklyPattern.map(d => d.usage))) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 w-8">{item.usage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 最常用提示词快速预览 */}
        <div className="glass rounded-xl p-6 border border-neon-cyan/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <FireIcon className="h-5 w-5 mr-2 text-neon-pink" />
            热门提示词
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promptAnalytics.slice(0, 3).map((prompt, index) => (
              <div key={prompt.id} className="p-4 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white text-sm">{prompt.name}</h4>
                  {prompt.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  ) : prompt.trend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
                  ) : null}
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>使用次数: {prompt.totalUsage}</div>
                  <div>成功率: {prompt.successRate}%</div>
                  <div>满意度: {prompt.avgSatisfaction}/5</div>
                </div>
                {prompt.contextEngineering && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded">
                      Context Engineering
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 提示词分析选项卡
  function PromptsAnalysisTab() {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 border border-neon-cyan/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-neon-cyan" />
              提示词性能分析
            </h3>
            <Link
              href="/create"
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors flex items-center text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              创建新提示词
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">提示词</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">使用次数</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">成功率</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">满意度</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">响应时间</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">趋势</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {promptAnalytics.map((prompt, index) => (
                  <motion.tr
                    key={prompt.id}
                    className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-white">{prompt.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prompt.categories.map(cat => (
                            <span key={cat} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                              {cat}
                            </span>
                          ))}
                          {prompt.contextEngineering && (
                            <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded">
                              CE
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">{prompt.totalUsage}</td>
                    <td className="py-4 px-4">
                      <span className={`${
                        prompt.successRate >= 90 ? 'text-green-400' :
                        prompt.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {prompt.successRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-white">{prompt.avgSatisfaction}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{prompt.avgResponseTime}s</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {prompt.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                        ) : prompt.trend === 'down' ? (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-400 mr-1" />
                        ) : (
                          <div className="h-4 w-4 mr-1" />
                        )}
                        <span className={`text-sm ${
                          prompt.trend === 'up' ? 'text-green-400' :
                          prompt.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {prompt.trend === 'stable' ? '稳定' : `${prompt.trendValue > 0 ? '+' : ''}${prompt.trendValue}%`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/prompts/${prompt.id}`}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="查看详情"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/prompts/${prompt.id}/edit`}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="编辑"
                        >
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // A/B测试选项卡
  function ExperimentsTab() {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 border border-neon-cyan/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2 text-neon-green" />
              个人A/B测试
            </h3>
            <button className="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-green-400 transition-colors flex items-center text-sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              创建实验
            </button>
          </div>

          {personalExperiments.length > 0 ? (
            <div className="space-y-4">
              {personalExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.id}
                  className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{experiment.name}</h4>
                      <p className="text-sm text-gray-400">
                        测试提示词: <Link href={`/prompts/${experiment.promptId}`} className="text-neon-cyan hover:underline">
                          {experiment.promptName}
                        </Link>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        experiment.status === 'running' ? 'bg-green-500/20 text-green-400' :
                        experiment.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {experiment.status === 'running' ? '进行中' :
                         experiment.status === 'completed' ? '已完成' : '已暂停'}
                      </span>
                      {experiment.status === 'running' && (
                        <button className="p-1 text-gray-400 hover:text-white">
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {experiment.variants.map((variant, vIndex) => (
                      <div key={vIndex} className="p-4 bg-dark-bg-primary/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-white">{variant.name}</h5>
                          <span className="text-sm text-gray-400">{variant.traffic}% 流量</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">成功率:</span>
                            <span className="text-white">{variant.successRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">满意度:</span>
                            <span className="text-white">{variant.avgSatisfaction}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {experiment.insights && experiment.insights.length > 0 && (
                    <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                      <h6 className="font-medium text-neon-blue mb-2 flex items-center">
                        <LightBulbIcon className="h-4 w-4 mr-2" />
                        实验洞察
                      </h6>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {experiment.insights.map((insight, iIndex) => (
                          <li key={iIndex} className="flex items-start">
                            <span className="text-neon-blue mr-2">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BeakerIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-400 mb-2">暂无进行中的实验</h4>
              <p className="text-gray-500 mb-4">通过A/B测试优化您的提示词效果</p>
              <button className="px-6 py-3 bg-neon-green text-black rounded-lg hover:bg-green-400 transition-colors">
                创建您的第一个实验
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 优化建议选项卡
  function OptimizationTab() {
    return (
      <div className="space-y-6">
        {optimizationSuggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            className="glass rounded-xl p-6 border border-neon-cyan/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-4 ${
                  suggestion.type === 'performance' ? 'bg-neon-green/20' :
                  suggestion.type === 'engagement' ? 'bg-neon-blue/20' :
                  suggestion.type === 'satisfaction' ? 'bg-neon-yellow/20' :
                  'bg-neon-purple/20'
                }`}>
                  {suggestion.type === 'performance' ? (
                    <ArrowTrendingUpIcon className="h-5 w-5 text-neon-green" />
                  ) : suggestion.type === 'engagement' ? (
                    <UserIcon className="h-5 w-5 text-neon-blue" />
                  ) : suggestion.type === 'satisfaction' ? (
                    <StarIcon className="h-5 w-5 text-neon-yellow" />
                  ) : (
                    <SparklesIcon className="h-5 w-5 text-neon-purple" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{suggestion.title}</h3>
                  <p className="text-gray-300 mb-2">{suggestion.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {suggestion.priority === 'high' ? '高优先级' :
                       suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                    <span className="text-neon-cyan">{suggestion.expectedImpact}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {suggestion.promptId && (
                  <Link
                    href={`/prompts/${suggestion.promptId}/edit`}
                    className="px-3 py-1 bg-neon-cyan text-black rounded text-sm hover:bg-cyan-400 transition-colors"
                  >
                    立即优化
                  </Link>
                )}
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-dark-bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-neon-green" />
                具体行动步骤
              </h4>
              <ul className="space-y-2">
                {suggestion.actionItems.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start text-sm text-gray-300">
                    <span className="text-neon-cyan mr-2">{itemIndex + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
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
            {trend > 0 ? '+' : ''}{trend}{typeof trend === 'number' && trend !== Math.floor(trend) ? '' : trend === 0 ? '稳定' : '%'}
          </span>
        </div>
      )}
    </motion.div>
  );
}