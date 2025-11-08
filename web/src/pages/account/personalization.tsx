/**
 * 用户个性化中心页面
 * 
 * 让用户完全掌控自己的上下文工程体验
 * 提供透明的AI学习过程展示和精细化的偏好控制
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  SparklesIcon,
  CpuChipIcon,
  HeartIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// 用户偏好接口
interface UserPreferences {
  language: string;
  style: string;
  format: string;
  tone: string;
  complexity: string;
  domain_knowledge: string[];
  output_length: string;
  creative_freedom: number;
  factual_accuracy: number;
  personalization_level: number;
}

// 适应规则接口
interface AdaptationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  created_at: string;
}

// 学习模式接口
interface LearnedPattern {
  category: string;
  pattern: string;
  confidence: number;
  sample_count: number;
  last_updated: string;
}

const TABS = [
  { id: 'preferences', name: '个人偏好', icon: AdjustmentsHorizontalIcon },
  { id: 'rules', name: '适应规则', icon: CogIcon },
  { id: 'patterns', name: '学习模式', icon: CpuChipIcon },
  { id: 'privacy', name: '隐私控制', icon: ShieldCheckIcon },
];

// 预设偏好选项
const PREFERENCE_OPTIONS = {
  language: [
    { value: 'zh-CN', label: '中文（简体）' },
    { value: 'zh-TW', label: '中文（繁体）' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' },
  ],
  style: [
    { value: 'formal', label: '正式' },
    { value: 'casual', label: '轻松' },
    { value: 'professional', label: '专业' },
    { value: 'friendly', label: '友好' },
    { value: 'academic', label: '学术' },
  ],
  format: [
    { value: 'structured', label: '结构化' },
    { value: 'narrative', label: '叙述型' },
    { value: 'bullet_points', label: '要点列表' },
    { value: 'step_by_step', label: '步骤指导' },
  ],
  tone: [
    { value: 'neutral', label: '中性' },
    { value: 'encouraging', label: '鼓励性' },
    { value: 'analytical', label: '分析型' },
    { value: 'creative', label: '创意型' },
  ],
  complexity: [
    { value: 'beginner', label: '初学者' },
    { value: 'intermediate', label: '中级' },
    { value: 'advanced', label: '高级' },
    { value: 'expert', label: '专家' },
  ],
  output_length: [
    { value: 'concise', label: '简洁' },
    { value: 'moderate', label: '适中' },
    { value: 'detailed', label: '详细' },
    { value: 'comprehensive', label: '全面' },
  ],
};

export default function PersonalizationPage() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 数据状态
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'zh-CN',
    style: 'professional',
    format: 'structured',
    tone: 'neutral',
    complexity: 'intermediate',
    domain_knowledge: [],
    output_length: 'moderate',
    creative_freedom: 50,
    factual_accuracy: 80,
    personalization_level: 70,
  });
  
  const [adaptationRules, setAdaptationRules] = useState<AdaptationRule[]>([]);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    allowAnonymousAnalytics: true,
    dataRetentionDays: 365,
    shareInsights: false,
    allowModelTraining: false,
  });

  // 加载用户数据
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 并行加载所有数据
      const [preferencesRes, rulesRes, patternsRes, privacyRes] = await Promise.all([
        fetch('/api/user/preferences'),
        fetch('/api/user/adaptation-rules'),
        fetch('/api/user/learned-patterns'),
        fetch('/api/user/privacy-settings'),
      ]);

      if (preferencesRes.ok) {
        const data = await preferencesRes.json();
        if (data.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences }));
        }
      }

      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setAdaptationRules(data.rules || []);
      }

      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setLearnedPatterns(data.patterns || []);
      }

      if (privacyRes.ok) {
        const data = await privacyRes.json();
        setPrivacySettings(prev => ({ ...prev, ...data.settings }));
      }
      
    } catch (error) {
      console.error('加载用户数据失败:', error);
      toast.error('加载个性化设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存偏好设置
  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        toast.success('偏好设置已保存');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 添加适应规则
  const addAdaptationRule = () => {
    const newRule: AdaptationRule = {
      id: Date.now().toString(),
      name: '新规则',
      condition: '',
      action: '',
      priority: 1,
      enabled: true,
      created_at: new Date().toISOString(),
    };
    setAdaptationRules(prev => [...prev, newRule]);
  };

  // 删除适应规则
  const deleteAdaptationRule = (id: string) => {
    setAdaptationRules(prev => prev.filter(rule => rule.id !== id));
  };

  // 导出用户数据
  const exportUserData = async () => {
    try {
      const response = await fetch('/api/user/export-data');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts-hub-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('数据导出成功');
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  // 删除所有数据
  const deleteAllData = async () => {
    if (!confirm('确定要删除所有个性化数据吗？此操作不可恢复！')) {
      return;
    }
    
    try {
      const response = await fetch('/api/user/delete-all-data', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('所有数据已删除');
        // 重置状态
        setPreferences({
          language: 'zh-CN',
          style: 'professional',
          format: 'structured',
          tone: 'neutral',
          complexity: 'intermediate',
          domain_knowledge: [],
          output_length: 'moderate',
          creative_freedom: 50,
          factual_accuracy: 80,
          personalization_level: 70,
        });
        setAdaptationRules([]);
        setLearnedPatterns([]);
      }
    } catch (error) {
      console.error('删除数据失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">加载个性化设置中...</p>
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
            href="/context-engineering"
            className="inline-flex items-center text-gray-400 hover:text-neon-cyan transition-colors duration-200 group"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            返回上下文工程
          </Link>
        </motion.div>

        {/* 页面头部 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white gradient-text mb-2">
              个性化中心
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              掌控您的上下文工程体验，让AI更懂您的需求
            </p>
          </div>

          {/* 快速统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
              icon={AdjustmentsHorizontalIcon} 
              title="偏好设置" 
              value={Object.keys(preferences).filter(key => preferences[key as keyof UserPreferences]).length}
              subtitle="已配置项目"
              color="neon-blue"
            />
            <StatCard 
              icon={CogIcon} 
              title="适应规则" 
              value={adaptationRules.filter(rule => rule.enabled).length}
              subtitle="启用规则"
              color="neon-purple"
            />
            <StatCard 
              icon={CpuChipIcon} 
              title="学习模式" 
              value={learnedPatterns.length}
              subtitle="识别模式"
              color="neon-green"
            />
            <StatCard 
              icon={ShieldCheckIcon} 
              title="隐私级别" 
              value={privacySettings.allowAnonymousAnalytics ? '标准' : '严格'}
              subtitle="数据保护"
              color="neon-yellow"
            />
          </div>
        </motion.div>

        {/* 选项卡导航 */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-xl p-1 border border-neon-cyan/30">
            <nav className="flex space-x-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
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
      </div>
    </div>
  );

  // 渲染选项卡内容
  function renderTabContent() {
    switch (activeTab) {
      case 'preferences':
        return <PreferencesTab />;
      case 'rules':
        return <AdaptationRulesTab />;
      case 'patterns':
        return <LearnedPatternsTab />;
      case 'privacy':
        return <PrivacyControlsTab />;
      default:
        return null;
    }
  }

  // 个人偏好选项卡
  function PreferencesTab() {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">个人偏好设置</h2>
          <button
            onClick={savePreferences}
            disabled={saving}
            className={`px-6 py-2 rounded-lg transition-colors ${
              saving 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-neon-blue text-white hover:bg-blue-600'
            }`}
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 基础偏好 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">基础偏好</h3>
            
            {/* 语言偏好 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">首选语言</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.language.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 风格偏好 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">交流风格</label>
              <select
                value={preferences.style}
                onChange={(e) => setPreferences(prev => ({ ...prev, style: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.style.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 格式偏好 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">输出格式</label>
              <select
                value={preferences.format}
                onChange={(e) => setPreferences(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.format.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 语调偏好 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">语调偏好</label>
              <select
                value={preferences.tone}
                onChange={(e) => setPreferences(prev => ({ ...prev, tone: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.tone.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 高级偏好 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">高级偏好</h3>
            
            {/* 复杂度偏好 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">复杂度级别</label>
              <select
                value={preferences.complexity}
                onChange={(e) => setPreferences(prev => ({ ...prev, complexity: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.complexity.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 输出长度 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">输出长度</label>
              <select
                value={preferences.output_length}
                onChange={(e) => setPreferences(prev => ({ ...prev, output_length: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white"
              >
                {PREFERENCE_OPTIONS.output_length.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 滑块偏好 */}
            <div className="space-y-4">
              <SliderPreference
                label="创意自由度"
                value={preferences.creative_freedom}
                onChange={(value) => setPreferences(prev => ({ ...prev, creative_freedom: value }))}
                min={0}
                max={100}
                description="越高越有创意，越低越保守"
              />
              
              <SliderPreference
                label="事实准确性"
                value={preferences.factual_accuracy}
                onChange={(value) => setPreferences(prev => ({ ...prev, factual_accuracy: value }))}
                min={0}
                max={100}
                description="对准确性的要求程度"
              />
              
              <SliderPreference
                label="个性化程度"
                value={preferences.personalization_level}
                onChange={(value) => setPreferences(prev => ({ ...prev, personalization_level: value }))}
                min={0}
                max={100}
                description="AI适应您偏好的程度"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 适应规则选项卡
  function AdaptationRulesTab() {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">个人适应规则</h2>
          <button
            onClick={addAdaptationRule}
            className="flex items-center px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            添加规则
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">什么是适应规则？</p>
              <p>适应规则让您可以自定义AI如何根据特定条件调整回答。例如：&ldquo;如果我提到工作相关的问题，请使用专业语言&rdquo;。</p>
            </div>
          </div>
        </div>

        {adaptationRules.length > 0 ? (
          <div className="space-y-4">
            {adaptationRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                className="p-6 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => {
                      const newRules = [...adaptationRules];
                      newRules[index] = { ...newRules[index], name: e.target.value };
                      setAdaptationRules(newRules);
                    }}
                    className="text-lg font-semibold bg-transparent text-white border-none outline-none"
                    placeholder="规则名称"
                  />
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => {
                          const newRules = [...adaptationRules];
                          newRules[index] = { ...newRules[index], enabled: e.target.checked };
                          setAdaptationRules(newRules);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">启用</span>
                    </label>
                    <button
                      onClick={() => deleteAdaptationRule(rule.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">条件</label>
                    <textarea
                      value={rule.condition}
                      onChange={(e) => {
                        const newRules = [...adaptationRules];
                        newRules[index] = { ...newRules[index], condition: e.target.value };
                        setAdaptationRules(newRules);
                      }}
                      placeholder="例如：用户询问技术问题"
                      className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">动作</label>
                    <textarea
                      value={rule.action}
                      onChange={(e) => {
                        const newRules = [...adaptationRules];
                        newRules[index] = { ...newRules[index], action: e.target.value };
                        setAdaptationRules(newRules);
                      }}
                      placeholder="例如：使用技术术语，提供代码示例"
                      className="w-full px-3 py-2 bg-dark-bg-primary border border-gray-600 rounded text-white text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CogIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">暂无适应规则</h3>
            <p className="text-gray-500 mb-4">创建您的第一个规则，让AI更好地适应您的需求</p>
            <button
              onClick={addAdaptationRule}
              className="px-6 py-3 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              创建规则
            </button>
          </div>
        )}
      </div>
    );
  }

  // 学习模式选项卡
  function LearnedPatternsTab() {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-6">AI学习到的模式</h2>
        
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start">
            <LightBulbIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-green-300">
              <p className="font-medium mb-1">透明的AI学习</p>
              <p>我们展示AI从您的使用中学到的模式，让您了解个性化是如何发生的。这有助于建立信任并优化体验。</p>
            </div>
          </div>
        </div>

        {learnedPatterns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learnedPatterns.map((pattern, index) => (
              <motion.div
                key={index}
                className="p-6 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-white">{pattern.category}</h3>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      pattern.confidence > 0.8 ? 'bg-green-400' :
                      pattern.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className="text-sm text-gray-400">
                      {Math.round(pattern.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">{pattern.pattern}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>样本数: {pattern.sample_count}</span>
                  <span>更新: {new Date(pattern.last_updated).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CpuChipIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">暂无学习模式</h3>
            <p className="text-gray-500">继续使用提示词，AI将逐渐学习您的偏好模式</p>
          </div>
        )}
      </div>
    );
  }

  // 隐私控制选项卡
  function PrivacyControlsTab() {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-6">隐私与数据控制</h2>
        
        <div className="space-y-8">
          {/* 数据分析设置 */}
          <div className="p-6 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">数据分析设置</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">允许匿名分析</h4>
                  <p className="text-sm text-gray-400">帮助改进产品，数据完全匿名化</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowAnonymousAnalytics}
                    onChange={(e) => setPrivacySettings(prev => ({ 
                      ...prev, 
                      allowAnonymousAnalytics: e.target.checked, 
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    privacySettings.allowAnonymousAnalytics ? 'bg-neon-green' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      privacySettings.allowAnonymousAnalytics ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">分享使用洞察</h4>
                  <p className="text-sm text-gray-400">与其他用户分享匿名化的使用模式</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.shareInsights}
                    onChange={(e) => setPrivacySettings(prev => ({ 
                      ...prev, 
                      shareInsights: e.target.checked, 
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    privacySettings.shareInsights ? 'bg-neon-blue' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      privacySettings.shareInsights ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">参与模型训练</h4>
                  <p className="text-sm text-gray-400">使用您的数据改进AI模型（完全匿名）</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowModelTraining}
                    onChange={(e) => setPrivacySettings(prev => ({ 
                      ...prev, 
                      allowModelTraining: e.target.checked, 
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    privacySettings.allowModelTraining ? 'bg-neon-purple' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      privacySettings.allowModelTraining ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 数据保留设置 */}
          <div className="p-6 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">数据保留设置</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                数据保留天数: {privacySettings.dataRetentionDays} 天
              </label>
              <input
                type="range"
                min="30"
                max="730"
                step="30"
                value={privacySettings.dataRetentionDays}
                onChange={(e) => setPrivacySettings(prev => ({ 
                  ...prev, 
                  dataRetentionDays: parseInt(e.target.value), 
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>30天</span>
                <span>1年</span>
                <span>2年</span>
              </div>
            </div>
          </div>

          {/* 数据管理操作 */}
          <div className="p-6 bg-dark-bg-secondary/50 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">数据管理</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={exportUserData}
                className="flex items-center justify-center px-4 py-3 bg-neon-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                导出我的数据
              </button>
              <button
                onClick={deleteAllData}
                className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                删除所有数据
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              您的数据属于您。您可以随时导出或删除所有个性化数据。
            </p>
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

// 滑块偏好组件
function SliderPreference({ label, value, onChange, min, max, description }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  description: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-neon-cyan font-mono">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}