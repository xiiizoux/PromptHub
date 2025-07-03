/**
 * Context Engineering 快速入门指南
 * 
 * 为新用户提供5分钟快速上手体验，让用户迅速理解并开始使用Context Engineering功能
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RocketLaunchIcon,
  PlayIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  LightBulbIcon,
  SparklesIcon,
  ClockIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  action: string;
  tips?: string[];
  nextStep?: string;
}

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    id: 'step1',
    title: '创建或选择一个提示词',
    description: '从浏览PromptHub的公开提示词开始，或创建您的第一个提示词',
    timeEstimate: '1分钟',
    action: '前往提示词库，选择一个感兴趣的提示词',
    tips: [
      '建议先从热门的"代码助手"或"写作助手"提示词开始',
      '选择与您工作相关的领域提示词，体验更佳',
      '新用户建议从简单的通用提示词开始练习'
    ],
    nextStep: 'step2'
  },
  {
    id: 'step2',
    title: '查看"我的上下文"',
    description: '在提示词详情页中，找到"我的上下文"模块，了解个性化功能',
    timeEstimate: '2分钟',
    action: '滚动到提示词详情页下方，查看个性化信息面板',
    tips: [
      '第一次使用会看到"开始个性化之旅"的提示',
      '登录后才能看到完整的个性化功能',
      '每个提示词都有独立的个性化上下文'
    ],
    nextStep: 'step3'
  },
  {
    id: 'step3',
    title: '进行首次交互',
    description: '使用提示词进行第一次AI对话，体验Context Engineering的学习过程',
    timeEstimate: '1分钟',
    action: '点击"立即体验"按钮，与AI进行第一次对话',
    tips: [
      '可以询问任何与提示词相关的问题',
      '系统会记录您的偏好和反馈',
      '不必担心说错，每次交互都是学习机会'
    ],
    nextStep: 'step4'
  },
  {
    id: 'step4',
    title: '设置个人偏好',
    description: '访问账户设置，配置您的基本偏好，让AI更好地了解您',
    timeEstimate: '1分钟',
    action: '进入账户设置 → 个性化偏好，设置基本信息',
    tips: [
      '语言风格、专业程度、回答长度等都很重要',
      '偏好设置会影响所有提示词的表现',
      '可以随时修改，不用一次性设置完美'
    ],
    nextStep: 'step5'
  },
  {
    id: 'step5',
    title: '查看学习效果',
    description: '回到提示词页面，查看AI如何根据您的使用调整回应方式',
    timeEstimate: '无限制',
    action: '继续使用提示词，观察AI回应的变化',
    tips: [
      '多次使用后，回应会越来越符合您的偏好',
      '在"我的上下文"中可以看到学习进度',
      '给予反馈能加速个性化效果'
    ]
  }
];

export default function ContextEngineeringGettingStarted() {
  const [currentStep, setCurrentStep] = useState<string>('step1');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    const step = QUICK_START_STEPS.find(s => s.id === stepId);
    if (step?.nextStep) {
      setCurrentStep(step.nextStep);
    }
  };

  const currentStepData = QUICK_START_STEPS.find(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="container-custom py-12">
        {/* 页面头部 */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <nav className="text-sm breadcrumbs mb-6">
            <Link href="/docs" className="text-neon-cyan hover:text-cyan-400">文档</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/docs/context-engineering" className="text-neon-cyan hover:text-cyan-400">Context Engineering</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-400">快速入门</span>
          </nav>
          
          <h1 className="text-4xl font-bold text-white gradient-text mb-4 flex items-center">
            <RocketLaunchIcon className="h-10 w-10 mr-3 text-neon-green" />
            Context Engineering 快速入门
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
            5分钟快速体验Context Engineering的强大功能，从零开始构建您的个性化AI助手。
          </p>
        </motion.div>

        {/* 快速概览 */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-green/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3 text-neon-green" />
              您将在5分钟内学会
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <OverviewCard
                icon={UserIcon}
                title="建立个人档案"
                description="让AI了解您的偏好和工作方式"
                color="neon-blue"
              />
              <OverviewCard
                icon={CogIcon}
                title="体验智能适应"
                description="看AI如何根据您的使用自动调整"
                color="neon-purple"
              />
              <OverviewCard
                icon={ChartBarIcon}
                title="监控学习进度"
                description="实时查看个性化效果和使用统计"
                color="neon-yellow"
              />
              <OverviewCard
                icon={LightBulbIcon}
                title="获得智能建议"
                description="收到个性化的改进建议和技巧"
                color="neon-pink"
              />
            </div>
          </div>
        </motion.section>

        {/* 步骤式指南 */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 步骤列表 */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 border border-neon-cyan/30 sticky top-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-neon-cyan" />
                  进度跟踪
                </h3>
                <div className="space-y-3">
                  {QUICK_START_STEPS.map((step, index) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      index={index + 1}
                      isActive={currentStep === step.id}
                      isCompleted={completedSteps.has(step.id)}
                      onClick={() => setCurrentStep(step.id)}
                    />
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-600/50">
                  <div className="text-sm text-gray-400">
                    进度: {completedSteps.size} / {QUICK_START_STEPS.length}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-neon-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedSteps.size / QUICK_START_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 当前步骤详情 */}
            <div className="lg:col-span-2">
              {currentStepData && (
                <StepDetail
                  step={currentStepData}
                  stepNumber={QUICK_START_STEPS.findIndex(s => s.id === currentStep) + 1}
                  isCompleted={completedSteps.has(currentStep)}
                  onMarkComplete={() => markStepComplete(currentStep)}
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* 常见问题 */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-yellow/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <InformationCircleIcon className="h-8 w-8 mr-3 text-neon-yellow" />
              快速入门FAQ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FAQItem
                question="需要技术背景才能使用吗？"
                answer="完全不需要！Context Engineering设计为对所有用户友好，界面直观，无需任何编程知识。"
              />
              <FAQItem
                question="个性化需要多长时间生效？"
                answer="基础个性化立即生效，深度学习通常需要3-5次交互。系统会持续优化，使用越多效果越好。"
              />
              <FAQItem
                question="我的数据安全吗？"
                answer="绝对安全。您的个人数据完全归您所有，可随时查看、修改或删除。我们采用严格的隐私保护措施。"
              />
              <FAQItem
                question="可以同时使用多个提示词吗？"
                answer="当然可以！每个提示词都有独立的个性化上下文，您可以在不同场景中使用不同的提示词。"
              />
            </div>
          </div>
        </motion.section>

        {/* 下一步建议 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-purple/30 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              🎉 恭喜！您已掌握基础操作
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              现在您已经了解了Context Engineering的基本使用方法。继续探索高级功能，发现更多可能性。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Link href="/docs/context-engineering/user-guide">
                <motion.div
                  className="p-6 bg-neon-blue/10 border border-neon-blue/30 rounded-xl hover:border-neon-blue/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <BookOpenIcon className="h-8 w-8 text-neon-blue mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">详细用户指南</h3>
                  <p className="text-gray-400 text-sm">深入了解所有功能和使用技巧</p>
                </motion.div>
              </Link>
              
              <Link href="/docs/context-engineering/best-practices">
                <motion.div
                  className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <LightBulbIcon className="h-8 w-8 text-neon-purple mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">最佳实践</h3>
                  <p className="text-gray-400 text-sm">专家经验和高级使用技巧</p>
                </motion.div>
              </Link>
              
              <Link href="/docs/context-engineering/advanced-tools">
                <motion.div
                  className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:border-neon-green/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <AcademicCapIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">高级工具</h3>
                  <p className="text-gray-400 text-sm">探索专业级Context Engineering功能</p>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// 概览卡片组件
function OverviewCard({ icon: Icon, title, description, color }: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`inline-flex p-4 rounded-xl bg-${color}/20 mb-4`}>
        <Icon className={`h-8 w-8 text-${color}`} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// 步骤项目组件
function StepItem({ step, index, isActive, isCompleted, onClick }: {
  step: QuickStartStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-neon-cyan/20 border border-neon-cyan/30' : 
        isCompleted ? 'bg-neon-green/10 border border-neon-green/30' :
        'bg-dark-bg-secondary/30 border border-gray-600/30 hover:border-gray-500/50'
      }`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
        isCompleted ? 'bg-neon-green text-black' :
        isActive ? 'bg-neon-cyan text-black' :
        'bg-gray-600 text-gray-300'
      }`}>
        {isCompleted ? <CheckCircleIcon className="h-4 w-4" /> : index}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${
          isActive ? 'text-neon-cyan' :
          isCompleted ? 'text-neon-green' :
          'text-gray-300'
        }`}>
          {step.title}
        </div>
        <div className="text-xs text-gray-500">{step.timeEstimate}</div>
      </div>
    </div>
  );
}

// 步骤详情组件
function StepDetail({ step, stepNumber, isCompleted, onMarkComplete }: {
  step: QuickStartStep;
  stepNumber: number;
  isCompleted: boolean;
  onMarkComplete: () => void;
}) {
  return (
    <motion.div
      className="glass rounded-2xl p-8 border border-neon-cyan/30"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      key={step.id}
    >
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center mr-4">
          <span className="text-neon-cyan font-bold text-lg">{stepNumber}</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{step.title}</h3>
          <div className="text-sm text-neon-cyan">预计用时: {step.timeEstimate}</div>
        </div>
      </div>
      
      <p className="text-gray-300 text-lg leading-relaxed mb-6">
        {step.description}
      </p>
      
      <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl p-4 mb-6">
        <h4 className="text-white font-semibold mb-2 flex items-center">
          <PlayIcon className="h-5 w-5 mr-2 text-neon-cyan" />
          操作步骤
        </h4>
        <p className="text-gray-300">{step.action}</p>
      </div>
      
      {step.tips && step.tips.length > 0 && (
        <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-4 mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-neon-yellow" />
            实用技巧
          </h4>
          <ul className="space-y-2">
            {step.tips.map((tip, index) => (
              <li key={index} className="text-gray-300 text-sm flex items-start">
                <span className="text-neon-yellow mr-2 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {isCompleted ? '✅ 已完成' : '进行中...'}
        </div>
        {!isCompleted && (
          <button
            onClick={onMarkComplete}
            className="px-6 py-3 bg-neon-cyan text-black rounded-lg hover:bg-cyan-400 transition-colors font-medium flex items-center"
          >
            标记为完成
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// FAQ项目组件
function FAQItem({ question, answer }: {
  question: string;
  answer: string;
}) {
  return (
    <div className="p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-600/30">
      <h4 className="text-white font-semibold mb-2">{question}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
    </div>
  );
}