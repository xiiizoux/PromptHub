/**
 * 上下文工程最佳实践
 * 
 * 专家经验分享和高级使用技巧，帮助用户获得最佳的上下文工程体验
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LightBulbIcon,
  StarIcon,
  TrophyIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';

interface BestPractice {
  id: string;
  category: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  impact: 'low' | 'medium' | 'high';
  timeToImplement: string;
  steps: string[];
  benefits: string[];
  commonMistakes: string[];
  example?: string;
  relatedPractices?: string[];
}

const BEST_PRACTICES: BestPractice[] = [
  {
    id: 'gradual-personalization',
    category: '个性化策略',
    title: '渐进式个性化构建',
    description: '不要一次性设置过多复杂规则，而是从简单开始，逐步构建个性化体验',
    level: 'beginner',
    impact: 'high',
    timeToImplement: '1-2周',
    steps: [
      '第1周：只设置基本偏好（语言风格、回答长度）',
      '第2周：添加时间和场景相关规则',
      '第3周：根据使用数据优化现有规则',
      '持续：每月评估和调整一次',
    ],
    benefits: [
      '避免规则冲突和复杂性',
      '更好地理解每个规则的影响',
      '稳定的个性化体验',
    ],
    commonMistakes: [
      '一开始就设置过多复杂规则',
      '频繁修改规则导致体验不稳定',
      '忽视规则之间的相互影响',
    ],
    example: '先设置"工作时间正式语调"，稳定一周后再添加"移动设备简洁回答"',
  },
  {
    id: 'feedback-optimization',
    category: '反馈策略',
    title: '有效反馈机制',
    description: '通过高质量的反馈数据加速AI学习，提高个性化效果',
    level: 'beginner',
    impact: 'high',
    timeToImplement: '即时',
    steps: [
      '每次交互后提供明确的满意度反馈',
      '对特别好或特别差的回答详细说明原因',
      '定期在"学习洞察"中查看反馈统计',
      '针对反馈模式调整个人偏好设置',
    ],
    benefits: [
      '加速AI学习过程',
      '提高个性化准确度',
      '获得更贴合需求的回答',
    ],
    commonMistakes: [
      '只在不满意时才给反馈',
      '反馈过于模糊或主观',
      '忽视积极反馈的重要性',
    ],
    relatedPractices: ['data-driven-optimization', 'regular-review'],
  },
  {
    id: 'context-isolation',
    category: '数据管理',
    title: '上下文隔离管理',
    description: '为不同用途的提示词维护独立的个性化上下文，避免交叉污染',
    level: 'intermediate',
    impact: 'medium',
    timeToImplement: '1周',
    steps: [
      '识别您的主要使用场景（工作、学习、娱乐等）',
      '为每个场景选择专门的提示词',
      '避免在跨场景的提示词中混用',
      '定期清理不再使用的上下文数据',
    ],
    benefits: [
      '更精准的场景适应',
      '避免不相关数据的干扰',
      '提高专业领域的AI表现',
    ],
    commonMistakes: [
      '在同一个提示词中混合多种用途',
      '频繁切换使用场景',
      '忽视上下文数据的清理',
    ],
    example: '工作代码助手和娱乐写作助手分开使用，避免代码风格影响创意写作',
  },
  {
    id: 'ab-testing-strategy',
    category: '实验优化',
    title: '科学A/B测试',
    description: '通过系统性的A/B测试验证优化效果，做出数据驱动的决策',
    level: 'advanced',
    impact: 'high',
    timeToImplement: '2-4周',
    steps: [
      '确定明确的测试假设和成功指标',
      '设计对照组和实验组',
      '确保足够的样本量（建议20+交互）',
      '运行至少一周获得稳定数据',
      '基于统计显著性做出决策',
    ],
    benefits: [
      '科学验证优化效果',
      '避免主观偏见',
      '持续改进个性化体验',
    ],
    commonMistakes: [
      '样本量太小导致结果不可靠',
      '测试时间太短',
      '同时测试多个变量',
      '忽视外部因素的影响',
    ],
    relatedPractices: ['data-driven-optimization', 'regular-review'],
  },
  {
    id: 'privacy-security',
    category: '隐私安全',
    title: '隐私保护最佳实践',
    description: '在享受个性化服务的同时，确保个人数据的安全和隐私',
    level: 'beginner',
    impact: 'high',
    timeToImplement: '30分钟',
    steps: [
      '定期审查和清理敏感交互历史',
      '使用数据导出功能备份重要配置',
      '了解数据共享政策和权限设置',
      '避免在交互中包含个人敏感信息',
    ],
    benefits: [
      '保护个人隐私',
      '降低数据泄露风险',
      '安心使用个性化功能',
    ],
    commonMistakes: [
      '在提示中包含密码、API密钥等敏感信息',
      '忽视定期数据清理',
      '不了解数据使用政策',
    ],
  },
  {
    id: 'multi-persona',
    category: '高级策略',
    title: '多人格管理',
    description: '为不同的工作角色或使用场景创建不同的AI人格配置',
    level: 'advanced',
    impact: 'medium',
    timeToImplement: '2-3周',
    steps: [
      '分析您的不同使用角色（开发者、管理者、学习者等）',
      '为每个角色创建专门的规则集',
      '使用标签或命名系统区分不同配置',
      '定期评估各人格的表现和适用性',
    ],
    benefits: [
      '更精准的角色适应',
      '提高专业效率',
      '更丰富的AI交互体验',
    ],
    commonMistakes: [
      '人格设置过于复杂',
      '角色界限不清晰',
      '维护成本过高',
    ],
  },
  {
    id: 'data-driven-optimization',
    category: '数据分析',
    title: '数据驱动优化',
    description: '基于使用数据和分析洞察持续优化个性化配置',
    level: 'intermediate',
    impact: 'high',
    timeToImplement: '持续进行',
    steps: [
      '每周查看个人分析报告',
      '识别使用模式和趋势',
      '根据满意度数据调整规则',
      '监控个性化效果的长期变化',
    ],
    benefits: [
      '客观评估优化效果',
      '发现隐藏的使用模式',
      '持续改进用户体验',
    ],
    commonMistakes: [
      '忽视数据分析',
      '过度依赖主观感受',
      '不定期回顾和调整',
    ],
    relatedPractices: ['regular-review', 'ab-testing-strategy'],
  },
  {
    id: 'regular-review',
    category: '维护策略',
    title: '定期评估和维护',
    description: '建立定期审查机制，确保个性化系统持续有效运行',
    level: 'beginner',
    impact: 'medium',
    timeToImplement: '每月30分钟',
    steps: [
      '每月进行一次完整的配置审查',
      '清理过时或无效的规则',
      '评估新功能和最佳实践',
      '根据需求变化调整策略',
    ],
    benefits: [
      '保持系统健康运行',
      '及时发现和解决问题',
      '适应需求变化',
    ],
    commonMistakes: [
      '设置后就忘记维护',
      '积累过多冗余配置',
      '不关注新功能更新',
    ],
  },
];

const PRACTICE_CATEGORIES = [
  { id: 'all', name: '全部', icon: StarIcon },
  { id: '个性化策略', name: '个性化策略', icon: UserGroupIcon },
  { id: '反馈策略', name: '反馈策略', icon: ChartBarIcon },
  { id: '数据管理', name: '数据管理', icon: ShieldCheckIcon },
  { id: '实验优化', name: '实验优化', icon: TrophyIcon },
  { id: '隐私安全', name: '隐私安全', icon: ShieldCheckIcon },
  { id: '高级策略', name: '高级策略', icon: RocketLaunchIcon },
  { id: '数据分析', name: '数据分析', icon: ChartBarIcon },
  { id: '维护策略', name: '维护策略', icon: CogIcon },
];

export default function ContextEngineeringBestPractices() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [expandedPractice, setExpandedPractice] = useState<string | null>(null);

  const filteredPractices = BEST_PRACTICES.filter(practice => {
    const categoryMatch = selectedCategory === 'all' || practice.category === selectedCategory;
    const levelMatch = selectedLevel === 'all' || practice.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  return (
    <DocLayout
      title="上下文工程最佳实践"
      description="专家总结的实用经验和技巧，帮助您避免常见陷阱，最大化上下文工程的价值。"
      backLink="/docs"
      backText="返回文档首页"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '上下文工程', href: '/docs/context-engineering' },
        { name: '最佳实践', href: '/docs/context-engineering/best-practices' },
      ]}
    >

      {/* 关键原则概览 */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
          <div className="glass rounded-2xl p-8 border border-neon-yellow/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <AcademicCapIcon className="h-8 w-8 mr-3 text-neon-yellow" />
              核心原则
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PrincipleCard
                icon="🎯"
                title="渐进优化"
                description="从简单开始，逐步构建复杂的个性化体验"
              />
              <PrincipleCard
                icon="📊"
                title="数据驱动"
                description="基于真实使用数据做出优化决策"
              />
              <PrincipleCard
                icon="🔒"
                title="隐私第一"
                description="在个性化的同时保护用户隐私和数据安全"
              />
              <PrincipleCard
                icon="🔄"
                title="持续迭代"
                description="定期评估和改进个性化配置"
              />
            </div>
          </div>
      </motion.section>

      {/* 筛选和分类 */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
          <div className="glass rounded-2xl p-6 border border-neon-cyan/30">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* 分类筛选 */}
              <div>
                <h3 className="text-white font-semibold mb-3">按分类筛选</h3>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center ${
                          selectedCategory === category.id
                            ? 'bg-neon-cyan text-black'
                            : 'bg-gray-800/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 难度筛选 */}
              <div>
                <h3 className="text-white font-semibold mb-3">按难度筛选</h3>
                <div className="flex gap-2">
                  {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedLevel === level
                          ? 'bg-neon-purple text-black'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      {level === 'all' ? '全部' : 
                       level === 'beginner' ? '初级' :
                       level === 'intermediate' ? '中级' : '高级'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </motion.section>

      {/* 最佳实践列表 */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
          <div className="space-y-6">
            {filteredPractices.map((practice, index) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                index={index}
                isExpanded={expandedPractice === practice.id}
                onToggle={() => setExpandedPractice(
                  expandedPractice === practice.id ? null : practice.id,
                )}
              />
            ))}
          </div>
      </motion.section>

      {/* 实施路线图 */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
          <div className="glass rounded-2xl p-8 border border-neon-green/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <RocketLaunchIcon className="h-8 w-8 mr-3 text-neon-green" />
              30天实施路线图
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RoadmapPhase
                phase="第1周"
                title="基础建立"
                color="neon-blue"
                items={[
                  '设置基本个人偏好',
                  '开始使用反馈机制',
                  '选择主要使用场景',
                ]}
              />
              <RoadmapPhase
                phase="第2-3周"
                title="规则优化"
                color="neon-purple"
                items={[
                  '添加场景相关规则',
                  '进行首次A/B测试',
                  '分析使用数据',
                ]}
              />
              <RoadmapPhase
                phase="第4周及以后"
                title="高级功能"
                color="neon-green"
                items={[
                  '探索高级工具',
                  '建立定期维护流程',
                  '持续优化和迭代',
                ]}
              />
            </div>
          </div>
      </motion.section>

      {/* 常见陷阱警告 */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
          <div className="glass rounded-2xl p-8 border border-red-500/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 mr-3 text-red-500" />
              常见陷阱与避免方法
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PitfallCard
                title="过度复杂化"
                problem="一开始就设置大量复杂规则"
                solution="从简单规则开始，逐步增加复杂度"
                severity="high"
              />
              <PitfallCard
                title="缺乏数据意识"
                problem="忽视使用数据分析，凭感觉做决策"
                solution="定期查看分析报告，基于数据优化"
                severity="medium"
              />
              <PitfallCard
                title="隐私疏忽"
                problem="在交互中包含敏感个人信息"
                solution="建立数据清理习惯，了解隐私政策"
                severity="high"
              />
              <PitfallCard
                title="维护不当"
                problem="设置后就不再关注和维护"
                solution="建立定期审查和维护机制"
                severity="medium"
              />
            </div>
          </div>
      </motion.section>

      {/* 成功案例 */}
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
          <div className="glass rounded-2xl p-8 border border-neon-pink/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <StarIcon className="h-8 w-8 mr-3 text-neon-pink" />
              成功案例分享
            </h2>
            
            <div className="space-y-6">
              <SuccessStory
                title="软件开发团队：提升代码审查效率40%"
                description="通过设置专业术语偏好和代码风格规则，团队的AI代码助手能够提供更准确的建议"
                keyTechniques={['渐进式规则建立', '团队协作配置', '定期效果评估']}
              />
              <SuccessStory
                title="内容创作者：个性化写作助手"
                description="通过多人格管理，为不同类型的内容创作（技术文章、营销文案、社交媒体）建立专门的AI助手"
                keyTechniques={['多人格配置', 'A/B测试优化', '反馈驱动改进']}
              />
              <SuccessStory
                title="学习者：自适应学习伙伴"
                description="AI助手根据学习进度和理解程度自动调整解释深度和示例复杂度"
                keyTechniques={['学习进度跟踪', '动态难度调整', '个性化练习推荐']}
              />
            </div>
          </div>
      </motion.section>

      {/* 进一步学习 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="glass rounded-2xl p-8 border border-neon-cyan/30 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            准备成为上下文工程专家？
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/docs/context-engineering/advanced-tools">
              <motion.div
                className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:border-neon-green/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <BoltIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">高级工具</h3>
                <p className="text-gray-400 text-sm">探索专业级功能和API</p>
              </motion.div>
            </Link>
            
            <Link href="/docs/context-engineering/user-guide">
              <motion.div
                className="p-6 bg-neon-blue/10 border border-neon-blue/30 rounded-xl hover:border-neon-blue/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <BookOpenIcon className="h-8 w-8 text-neon-blue mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">用户指南</h3>
                <p className="text-gray-400 text-sm">详细的功能使用教程</p>
              </motion.div>
            </Link>
            
            <Link href="/prompts/analytics">
              <motion.div
                className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <ChartBarIcon className="h-8 w-8 text-neon-purple mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">分析中心</h3>
                <p className="text-gray-400 text-sm">查看您的使用分析</p>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.section>
    </DocLayout>
  );
}

// 原则卡片组件
function PrincipleCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-4">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// 最佳实践卡片组件
function PracticeCard({ practice, index, isExpanded, onToggle }: {
  practice: BestPractice;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'neon-green';
      case 'intermediate': return 'neon-yellow';
      case 'advanced': return 'red-500';
      default: return 'gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'red-500';
      case 'medium': return 'neon-yellow';
      case 'low': return 'neon-green';
      default: return 'gray-500';
    }
  };

  return (
    <motion.div
      className="glass rounded-xl border border-gray-600/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* 标题栏 */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded mr-3">
                {practice.category}
              </span>
              <span className={`px-2 py-1 bg-${getLevelColor(practice.level)}/20 text-${getLevelColor(practice.level)} text-xs rounded mr-3`}>
                {practice.level === 'beginner' ? '初级' : 
                 practice.level === 'intermediate' ? '中级' : '高级'}
              </span>
              <span className={`px-2 py-1 bg-${getImpactColor(practice.impact)}/20 text-${getImpactColor(practice.impact)} text-xs rounded`}>
                {practice.impact === 'high' ? '高影响' : 
                 practice.impact === 'medium' ? '中等影响' : '低影响'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{practice.title}</h3>
            <p className="text-gray-300 text-sm">{practice.description}</p>
          </div>
          <div className="ml-4 text-gray-400">
            {isExpanded ? '收起' : '展开'}
          </div>
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-600/30"
        >
          <div className="p-6 space-y-6">
            {/* 实施步骤 */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-neon-green" />
                实施步骤
              </h4>
              <ol className="space-y-2">
                {practice.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="text-gray-300 text-sm flex items-start">
                    <span className="text-neon-green mr-2 mt-1">{stepIndex + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* 预期收益 */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-neon-blue" />
                预期收益
              </h4>
              <ul className="space-y-2">
                {practice.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="text-gray-300 text-sm flex items-start">
                    <span className="text-neon-blue mr-2 mt-1">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* 常见错误 */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />
                常见错误
              </h4>
              <ul className="space-y-2">
                {practice.commonMistakes.map((mistake, mistakeIndex) => (
                  <li key={mistakeIndex} className="text-gray-300 text-sm flex items-start">
                    <span className="text-red-500 mr-2 mt-1">✗</span>
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>

            {/* 示例 */}
            {practice.example && (
              <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-neon-purple" />
                  实际示例
                </h4>
                <p className="text-gray-300 text-sm italic">
                  {practice.example}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// 路线图阶段组件
function RoadmapPhase({ phase, title, color, items }: {
  phase: string;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <div className={`p-6 bg-${color}/10 border border-${color}/30 rounded-xl`}>
      <div className={`text-${color} font-mono text-sm mb-2`}>{phase}</div>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-300 text-sm flex items-start">
            <span className={`text-${color} mr-2 mt-1`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 陷阱卡片组件
function PitfallCard({ title, problem, solution, severity }: {
  title: string;
  problem: string;
  solution: string;
  severity: 'high' | 'medium' | 'low';
}) {
  const severityColor = severity === 'high' ? 'red-500' : severity === 'medium' ? 'yellow-500' : 'blue-500';
  
  return (
    <div className="p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-600/30">
      <div className="flex items-center mb-3">
        <h4 className="text-white font-semibold flex-1">{title}</h4>
        <span className={`px-2 py-1 bg-${severityColor}/20 text-${severityColor} text-xs rounded`}>
          {severity === 'high' ? '高风险' : severity === 'medium' ? '中风险' : '低风险'}
        </span>
      </div>
      <p className="text-red-400 text-sm mb-2">❌ 问题: {problem}</p>
      <p className="text-green-400 text-sm">✅ 解决: {solution}</p>
    </div>
  );
}

// 成功案例组件
function SuccessStory({ title, description, keyTechniques }: {
  title: string;
  description: string;
  keyTechniques: string[];
}) {
  return (
    <div className="p-6 bg-dark-bg-secondary/30 rounded-lg border border-neon-pink/30">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-300 text-sm mb-4">{description}</p>
      <div>
        <span className="text-neon-pink text-sm font-medium">关键技术: </span>
        {keyTechniques.map((technique, index) => (
          <span key={index} className="text-gray-400 text-sm">
            {technique}{index < keyTechniques.length - 1 ? '、' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}