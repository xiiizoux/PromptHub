/**
 * 高级Context Engineering工具集
 * 
 * 为用户提供可视化的规则构建器、智能优化工具和效果预测功能
 * 让复杂的Context Engineering变得直观易用
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WrenchScrewdriverIcon,
  SparklesIcon,
  BeakerIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CpuChipIcon,
  ClipboardDocumentIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  MinusIcon,
  EyeIcon,
  CogIcon,
  BoltIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 规则类型定义
interface ContextRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  createdAt: string;
  lastModified: string;
  performance?: RulePerformance;
}

interface RuleCondition {
  id: string;
  type: 'user_preference' | 'time_based' | 'usage_pattern' | 'content_type' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: string | number | boolean | string[] | number[];
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: 'append' | 'prepend' | 'replace' | 'modify_tone' | 'add_examples' | 'adjust_complexity';
  content: string;
  parameters?: Record<string, any>;
}

interface RulePerformance {
  successRate: number;
  avgSatisfaction: number;
  usageCount: number;
  lastUsed: string;
  trend: 'improving' | 'declining' | 'stable';
}

interface OptimizationSuggestion {
  id: string;
  type: 'rule_improvement' | 'new_rule' | 'rule_combination' | 'performance_boost';
  title: string;
  description: string;
  expectedImpact: string;
  confidence: number;
  autoApplicable: boolean;
  rules?: ContextRule[];
}

interface PredictionResult {
  scenario: string;
  expectedSatisfaction: number;
  expectedSuccessRate: number;
  potentialIssues: string[];
  recommendations: string[];
}

const TOOL_TABS = [
  { id: 'builder', name: '规则构建器', icon: WrenchScrewdriverIcon, description: '可视化创建适应规则' },
  { id: 'optimizer', name: '智能优化', icon: SparklesIcon, description: 'AI驱动的规则建议' },
  { id: 'predictor', name: '效果预测', icon: BeakerIcon, description: '预测规则实施效果' },
  { id: 'library', name: '规则库', icon: AcademicCapIcon, description: '管理所有规则' },
];

const CONDITION_TYPES = [
  { value: 'user_preference', label: '用户偏好', description: '基于用户设置的偏好' },
  { value: 'time_based', label: '时间条件', description: '基于时间或日期的条件' },
  { value: 'usage_pattern', label: '使用模式', description: '基于历史使用模式' },
  { value: 'content_type', label: '内容类型', description: '基于内容类别或主题' },
  { value: 'custom', label: '自定义', description: '自定义逻辑条件' },
];

const ACTION_TYPES = [
  { value: 'append', label: '追加内容', description: '在提示词末尾添加内容' },
  { value: 'prepend', label: '前置内容', description: '在提示词开头添加内容' },
  { value: 'replace', label: '替换内容', description: '替换特定部分' },
  { value: 'modify_tone', label: '调整语调', description: '改变回答的语调风格' },
  { value: 'add_examples', label: '添加示例', description: '插入相关示例' },
  { value: 'adjust_complexity', label: '调整复杂度', description: '简化或详化内容' },
];

export default function AdvancedCEToolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [loading, setLoading] = useState(false);
  
  // 规则相关状态
  const [contextRules, setContextRules] = useState<ContextRule[]>([]);
  const [currentRule, setCurrentRule] = useState<ContextRule | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  
  // UI状态
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ContextRule | RuleCondition | RuleAction | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadToolsData();
  }, [user]);

  const loadToolsData = async () => {
    try {
      setLoading(true);
      
      // 模拟加载数据
      const mockRules = generateMockRules();
      const mockSuggestions = generateMockOptimizationSuggestions();
      const mockPredictions = generateMockPredictions();
      
      setContextRules(mockRules);
      setOptimizationSuggestions(mockSuggestions);
      setPredictionResults(mockPredictions);
      
    } catch (error) {
      console.error('加载工具数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟数据
  const generateMockRules = (): ContextRule[] => [
    {
      id: '1',
      name: '编程语言偏好适应',
      description: '根据用户偏好的编程语言调整代码示例和说明',
      enabled: true,
      conditions: [
        {
          id: 'c1',
          type: 'user_preference',
          field: 'programming_language',
          operator: 'equals',
          value: 'Python',
        },
      ],
      actions: [
        {
          id: 'a1',
          type: 'append',
          content: '请用Python语言提供示例代码。',
        },
      ],
      priority: 1,
      createdAt: '2023-12-01',
      lastModified: '2023-12-15',
      performance: {
        successRate: 94,
        avgSatisfaction: 4.6,
        usageCount: 156,
        lastUsed: '2小时前',
        trend: 'improving',
      },
    },
    {
      id: '2',
      name: '工作时间简化模式',
      description: '在工作时间提供更简洁直接的回答',
      enabled: true,
      conditions: [
        {
          id: 'c2',
          type: 'time_based',
          field: 'hour',
          operator: 'in_range',
          value: [9, 17],
        },
      ],
      actions: [
        {
          id: 'a2',
          type: 'modify_tone',
          content: '简洁专业',
          parameters: { brevity: 'high', formality: 'medium' },
        },
      ],
      priority: 2,
      createdAt: '2023-12-02',
      lastModified: '2023-12-10',
      performance: {
        successRate: 87,
        avgSatisfaction: 4.2,
        usageCount: 89,
        lastUsed: '1天前',
        trend: 'stable',
      },
    },
  ];

  const generateMockOptimizationSuggestions = (): OptimizationSuggestion[] => [
    {
      id: '1',
      type: 'rule_improvement',
      title: '优化编程语言适应规则',
      description: '建议添加对JavaScript和TypeScript的支持，您在这些语言上的使用频率很高',
      expectedImpact: '+23% 相关性, +15% 满意度',
      confidence: 92,
      autoApplicable: true,
    },
    {
      id: '2',
      type: 'new_rule',
      title: '创建周末放松模式',
      description: '基于您的使用模式，建议在周末使用更友好轻松的语调',
      expectedImpact: '+18% 满意度',
      confidence: 78,
      autoApplicable: false,
    },
    {
      id: '3',
      type: 'performance_boost',
      title: '提升响应效率',
      description: '通过规则优先级调整，可以减少20%的处理时间',
      expectedImpact: '-20% 响应时间',
      confidence: 85,
      autoApplicable: true,
    },
  ];

  const generateMockPredictions = (): PredictionResult[] => [
    {
      scenario: '启用所有推荐规则',
      expectedSatisfaction: 4.7,
      expectedSuccessRate: 96,
      potentialIssues: ['可能增加轻微的处理延迟', '需要适应期约1-2周'],
      recommendations: ['分阶段启用规则', '密切监控第一周的效果', '准备回滚机制'],
    },
  ];

  // 创建新规则
  const createNewRule = useCallback(() => {
    const newRule: ContextRule = {
      id: Date.now().toString(),
      name: '新建规则',
      description: '',
      enabled: false,
      conditions: [],
      actions: [],
      priority: contextRules.length + 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    setCurrentRule(newRule);
    setShowRuleEditor(true);
  }, [contextRules.length]);

  // 保存规则
  const saveRule = useCallback((rule: ContextRule) => {
    if (contextRules.find(r => r.id === rule.id)) {
      setContextRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setContextRules(prev => [...prev, rule]);
    }
    setShowRuleEditor(false);
    setCurrentRule(null);
  }, [contextRules]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-purple mx-auto mb-4"></div>
          <p className="text-gray-400">加载Context Engineering工具中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="container-custom py-8">
        {/* 返回按钮 */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link 
            href="/profile#context-engineering"
            className="inline-flex items-center text-gray-400 hover:text-neon-cyan transition-colors duration-200 group"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            返回 Context Engineering
          </Link>
        </motion.div>

        {/* 页面头部 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white gradient-text mb-2 flex items-center">
                <CpuChipIcon className="h-10 w-10 mr-3 text-neon-purple" />
                Context Engineering工具集
              </h1>
              <p className="text-gray-400 max-w-2xl">
                可视化构建智能适应规则，让AI真正理解并适应您的需求
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/prompts/analytics"
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                返回分析
              </Link>
              
              <button
                onClick={createNewRule}
                className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                创建规则
              </button>
            </div>
          </div>

          {/* 快速状态概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={WrenchScrewdriverIcon}
              title="活跃规则"
              value={contextRules.filter(r => r.enabled).length}
              subtitle={`共${contextRules.length}个规则`}
              color="neon-purple"
            />
            <StatCard
              icon={SparklesIcon}
              title="优化建议"
              value={optimizationSuggestions.length}
              subtitle="待处理建议"
              color="neon-blue"
            />
            <StatCard
              icon={CheckCircleIcon}
              title="平均成功率"
              value={`${Math.round(contextRules.reduce((acc, r) => acc + (r.performance?.successRate || 0), 0) / contextRules.length || 0)}%`}
              color="neon-green"
            />
            <StatCard
              icon={BoltIcon}
              title="总使用次数"
              value={contextRules.reduce((acc, r) => acc + (r.performance?.usageCount || 0), 0)}
              color="neon-yellow"
            />
          </div>
        </motion.div>

        {/* 工具选项卡 */}
        <motion.div
          className="glass rounded-xl border border-neon-purple/20 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6">
            <nav className="flex space-x-1">
              {TOOL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-neon-purple text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className={`text-xs ${
                        activeTab === tab.id ? 'text-white/70' : 'text-gray-500'
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

        {/* 规则编辑器模态框 */}
        {showRuleEditor && currentRule && (
          <RuleEditorModal
            rule={currentRule}
            onSave={saveRule}
            onCancel={() => {
              setShowRuleEditor(false);
              setCurrentRule(null);
            }}
          />
        )}
      </div>
    </div>
  );

  // 渲染选项卡内容
  function renderTabContent() {
    switch (activeTab) {
      case 'builder':
        return <RuleBuilderTab />;
      case 'optimizer':
        return <OptimizerTab />;
      case 'predictor':
        return <PredictorTab />;
      case 'library':
        return <RuleLibraryTab />;
      default:
        return null;
    }
  }

  // 规则构建器选项卡
  function RuleBuilderTab() {
    return (
      <div className="glass rounded-xl p-8 border border-neon-purple/20">
        <div className="text-center py-12">
          <WrenchScrewdriverIcon className="h-20 w-20 text-neon-purple mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">可视化规则构建器</h3>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            使用直观的拖拽界面创建复杂的Context Engineering规则。
            定义条件、设置动作，让AI智能适应您的需求。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <CogIcon className="h-5 w-5 mr-2 text-neon-blue" />
                条件设置
              </h4>
              <p className="text-sm text-gray-400 mb-4">设置触发规则的条件</p>
              <div className="space-y-2">
                {CONDITION_TYPES.slice(0, 3).map(type => (
                  <div key={type.value} className="p-3 bg-dark-bg-primary/50 rounded border border-gray-700">
                    <div className="font-medium text-white text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <BoltIcon className="h-5 w-5 mr-2 text-neon-yellow" />
                动作配置
              </h4>
              <p className="text-sm text-gray-400 mb-4">定义执行的操作</p>
              <div className="space-y-2">
                {ACTION_TYPES.slice(0, 3).map(type => (
                  <div key={type.value} className="p-3 bg-dark-bg-primary/50 rounded border border-gray-700">
                    <div className="font-medium text-white text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={createNewRule}
            className="mt-8 px-8 py-4 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center mx-auto text-lg font-medium"
          >
            <PlusIcon className="h-6 w-6 mr-3" />
            开始构建第一个规则
          </button>
        </div>
      </div>
    );
  }

  // 智能优化选项卡
  function OptimizerTab() {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 border border-neon-blue/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-neon-blue" />
            AI驱动的优化建议
          </h3>
          <p className="text-gray-400 mb-6">
            基于您的使用模式和性能数据，AI为您推荐最佳的优化方案
          </p>

          <div className="space-y-4">
            {optimizationSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50 hover:border-gray-500/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-4 ${
                      suggestion.type === 'rule_improvement' ? 'bg-neon-green/20' :
                      suggestion.type === 'new_rule' ? 'bg-neon-blue/20' :
                      suggestion.type === 'rule_combination' ? 'bg-neon-purple/20' :
                      'bg-neon-yellow/20'
                    }`}>
                      {suggestion.type === 'rule_improvement' ? (
                        <WrenchScrewdriverIcon className="h-5 w-5 text-neon-green" />
                      ) : suggestion.type === 'new_rule' ? (
                        <PlusIcon className="h-5 w-5 text-neon-blue" />
                      ) : suggestion.type === 'rule_combination' ? (
                        <CpuChipIcon className="h-5 w-5 text-neon-purple" />
                      ) : (
                        <BoltIcon className="h-5 w-5 text-neon-yellow" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{suggestion.title}</h4>
                      <p className="text-gray-300 mb-2">{suggestion.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-neon-cyan">{suggestion.expectedImpact}</span>
                        <span className="text-gray-400">置信度: {suggestion.confidence}%</span>
                        {suggestion.autoApplicable && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            可自动应用
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-neon-blue text-white rounded text-sm hover:bg-blue-600 transition-colors">
                      查看详情
                    </button>
                    {suggestion.autoApplicable ? (
                      <button className="px-4 py-2 bg-neon-green text-black rounded text-sm hover:bg-green-400 transition-colors">
                        自动应用
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-neon-purple text-white rounded text-sm hover:bg-purple-600 transition-colors">
                        手动配置
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-neon-blue h-2 rounded-full transition-all duration-500"
                    style={{ width: `${suggestion.confidence}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 效果预测选项卡
  function PredictorTab() {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 border border-neon-green/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <BeakerIcon className="h-6 w-6 mr-2 text-neon-green" />
            智能效果预测
          </h3>
          <p className="text-gray-400 mb-6">
            基于机器学习模型预测规则变更对性能的影响
          </p>

          {predictionResults.map((prediction, index) => (
            <motion.div
              key={index}
              className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">{prediction.scenario}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                    <div className="text-sm text-neon-green mb-1">预期满意度</div>
                    <div className="text-2xl font-bold text-white">{prediction.expectedSatisfaction}/5</div>
                  </div>
                  <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                    <div className="text-sm text-neon-blue mb-1">预期成功率</div>
                    <div className="text-2xl font-bold text-white">{prediction.expectedSuccessRate}%</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-white mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-yellow-400" />
                    潜在问题
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {prediction.potentialIssues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <h5 className="font-medium text-neon-purple mb-3 flex items-center">
                  <LightBulbIcon className="h-4 w-4 mr-2" />
                  实施建议
                </h5>
                <ul className="space-y-2 text-sm text-gray-300">
                  {prediction.recommendations.map((rec, recIndex) => (
                    <li key={recIndex} className="flex items-start">
                      <span className="text-neon-purple mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 规则库选项卡
  function RuleLibraryTab() {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 border border-neon-cyan/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-2 text-neon-cyan" />
              我的规则库
            </h3>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm">
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                导出规则
              </button>
              <button
                onClick={createNewRule}
                className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                新建规则
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contextRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                className="p-6 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50 hover:border-gray-500/70 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-white mb-1">{rule.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>优先级: {rule.priority}</span>
                      <span>条件: {rule.conditions.length}</span>
                      <span>动作: {rule.actions.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => {
                          const updatedRules = contextRules.map(r =>
                            r.id === rule.id ? { ...r, enabled: e.target.checked } : r,
                          );
                          setContextRules(updatedRules);
                        }}
                        className="sr-only"
                      />
                      <div className={`w-6 h-3 rounded-full transition-colors ${
                        rule.enabled ? 'bg-neon-green' : 'bg-gray-600'
                      }`}>
                        <div className={`w-2 h-2 bg-white rounded-full shadow-md transform transition-transform ${
                          rule.enabled ? 'translate-x-3' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                    
                    <button
                      onClick={() => {
                        setCurrentRule(rule);
                        setShowRuleEditor(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {rule.performance && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-dark-bg-primary/50 rounded border border-gray-700">
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{rule.performance.successRate}%</div>
                      <div className="text-xs text-gray-400">成功率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{rule.performance.avgSatisfaction}/5</div>
                      <div className="text-xs text-gray-400">满意度</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{rule.performance.usageCount}</div>
                      <div className="text-xs text-gray-400">使用次数</div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

// 规则编辑器模态框组件
function RuleEditorModal({ rule, onSave, onCancel }: {
  rule: ContextRule;
  onSave: (rule: ContextRule) => void;
  onCancel: () => void;
}) {
  const [editingRule, setEditingRule] = useState<ContextRule>({ ...rule });

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      type: 'user_preference',
      field: '',
      operator: 'equals',
      value: '',
    };
    setEditingRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: Date.now().toString(),
      type: 'append',
      content: '',
    };
    setEditingRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-dark-bg-primary rounded-xl border border-neon-purple/30 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6 border-b border-gray-600">
          <h3 className="text-xl font-bold text-white flex items-center">
            <WrenchScrewdriverIcon className="h-6 w-6 mr-2 text-neon-purple" />
            {rule.id ? '编辑规则' : '创建新规则'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">规则名称</label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">优先级</label>
              <input
                type="number"
                value={editingRule.priority}
                onChange={(e) => setEditingRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">描述</label>
            <textarea
              value={editingRule.description}
              onChange={(e) => setEditingRule(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded text-white h-20"
            />
          </div>

          {/* 条件设置 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-white">触发条件</h4>
              <button
                onClick={addCondition}
                className="px-3 py-1 bg-neon-blue/20 text-neon-blue rounded text-sm hover:bg-neon-blue/30"
              >
                添加条件
              </button>
            </div>
            
            <div className="space-y-3">
              {editingRule.conditions.map((condition, index) => (
                <div key={condition.id} className="p-4 bg-dark-bg-secondary/50 rounded border border-gray-600 grid grid-cols-4 gap-3">
                  <select
                    value={condition.type}
                    onChange={(e) => {
                      const newConditions = [...editingRule.conditions];
                      newConditions[index] = { 
                        ...condition, 
                        type: e.target.value as 'user_preference' | 'time_based' | 'usage_pattern' | 'content_type' | 'custom',
                      };
                      setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                    }}
                    className="px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                  >
                    {CONDITION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="字段名"
                    value={condition.field}
                    onChange={(e) => {
                      const newConditions = [...editingRule.conditions];
                      newConditions[index] = { ...condition, field: e.target.value };
                      setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                    }}
                    className="px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                  />
                  
                  <select
                    value={condition.operator}
                    onChange={(e) => {
                      const newConditions = [...editingRule.conditions];
                      newConditions[index] = { 
                        ...condition, 
                        operator: e.target.value as 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range',
                      };
                      setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                    }}
                    className="px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="equals">等于</option>
                    <option value="not_equals">不等于</option>
                    <option value="contains">包含</option>
                    <option value="greater_than">大于</option>
                    <option value="less_than">小于</option>
                  </select>
                  
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="值"
                      value={condition.value}
                      onChange={(e) => {
                        const newConditions = [...editingRule.conditions];
                        newConditions[index] = { ...condition, value: e.target.value };
                        setEditingRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                      className="flex-1 px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded-l text-white text-sm"
                    />
                    <button
                      onClick={() => {
                        setEditingRule(prev => ({
                          ...prev,
                          conditions: prev.conditions.filter(c => c.id !== condition.id),
                        }));
                      }}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-r border border-red-500/30 hover:bg-red-500/30"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 动作设置 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-white">执行动作</h4>
              <button
                onClick={addAction}
                className="px-3 py-1 bg-neon-yellow/20 text-neon-yellow rounded text-sm hover:bg-neon-yellow/30"
              >
                添加动作
              </button>
            </div>
            
            <div className="space-y-3">
              {editingRule.actions.map((action, index) => (
                <div key={action.id} className="p-4 bg-dark-bg-secondary/50 rounded border border-gray-600">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <select
                      value={action.type}
                      onChange={(e) => {
                        const newActions = [...editingRule.actions];
                        newActions[index] = { 
                          ...action, 
                          type: e.target.value as 'append' | 'prepend' | 'replace' | 'modify_tone' | 'add_examples' | 'adjust_complexity',
                        };
                        setEditingRule(prev => ({ ...prev, actions: newActions }));
                      }}
                      className="px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                    >
                      {ACTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    
                    <div className="col-span-2 flex">
                      <input
                        type="text"
                        placeholder="动作内容"
                        value={action.content}
                        onChange={(e) => {
                          const newActions = [...editingRule.actions];
                          newActions[index] = { ...action, content: e.target.value };
                          setEditingRule(prev => ({ ...prev, actions: newActions }));
                        }}
                        className="flex-1 px-2 py-1 bg-dark-bg-primary border border-gray-600 rounded-l text-white text-sm"
                      />
                      <button
                        onClick={() => {
                          setEditingRule(prev => ({
                            ...prev,
                            actions: prev.actions.filter(a => a.id !== action.id),
                          }));
                        }}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded-r border border-red-500/30 hover:bg-red-500/30"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-600 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave({ ...editingRule, lastModified: new Date().toISOString() })}
            className="px-6 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            保存规则
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// 统计卡片组件
function StatCard({ icon: Icon, title, value, subtitle, color }: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: string | number;
  subtitle?: string;
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
    </motion.div>
  );
}