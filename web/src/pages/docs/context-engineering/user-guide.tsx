/**
 * Context Engineering 用户指南
 * 
 * 详细的功能使用教程，覆盖所有核心功能的使用方法和最佳实践
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  BeakerIcon,
  SparklesIcon,
  RocketLaunchIcon,
  EyeIcon,
  ClockIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  PuzzlePieceIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  subsections: {
    id: string;
    title: string;
    content: string;
    tips?: string[];
    warnings?: string[];
    examples?: string[];
  }[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'personal-context',
    title: '个人上下文管理',
    icon: UserIcon,
    description: '了解如何查看和管理您的个性化AI数据',
    subsections: [
      {
        id: 'viewing-context',
        title: '查看我的上下文',
        content: '在任何提示词详情页的下方，您都可以找到"我的上下文"模块。这里展示了AI对您的了解程度和个性化程度。',
        tips: [
          '首次使用时会显示"开始个性化之旅"的引导',
          '每个提示词都有独立的上下文数据',
          '上下文数据完全归您个人所有',
        ],
        examples: [
          '总使用次数：显示您使用这个提示词的频率',
          '成功率：基于您的反馈计算的满意度',
          '个性化天数：从首次使用到现在的时间',
        ],
      },
      {
        id: 'interaction-history',
        title: '交互历史追踪',
        content: '系统会记录您与AI的每次交互，包括输入、输出、反馈和应用的个性化规则。这些数据帮助AI更好地理解您的需求。',
        tips: [
          '可以切换简洁/专业视图模式',
          '专业模式显示更多技术细节',
          '历史记录支持搜索和筛选',
        ],
        warnings: [
          '历史记录仅保存最近100条交互',
          '删除历史记录会影响个性化效果',
        ],
      },
      {
        id: 'learning-insights',
        title: '学习洞察分析',
        content: 'AI会分析您的使用模式，提供个性化的改进建议和使用技巧。这些洞察帮助您更好地利用AI助手。',
        examples: [
          '使用模式：您偏好的交互时间和频率',
          '偏好风格：AI总结出的您喜欢的回答风格',
          '改进建议：基于使用数据的个性化建议',
        ],
      },
    ],
  },
  {
    id: 'adaptation-rules',
    title: '智能适应规则',
    icon: CogIcon,
    description: '学习如何创建和管理让AI自动适应您需求的规则',
    subsections: [
      {
        id: 'understanding-rules',
        title: '理解适应规则',
        content: '适应规则是让AI根据不同情境自动调整行为的智能系统。规则可以基于时间、设备、使用场景等条件触发。',
        tips: [
          '从简单规则开始，逐步增加复杂度',
          '规则有优先级，避免冲突',
          '定期检查规则效果并调整',
        ],
        examples: [
          '时间规则：工作时间回答更正式，休闲时间更轻松',
          '设备规则：手机上回答更简洁，电脑上更详细',
          '场景规则：编程问题更技术化，写作问题更创意化',
        ],
      },
      {
        id: 'creating-rules',
        title: '创建个人规则',
        content: '您可以为自己使用的任何提示词创建个人适应规则。这些规则只影响您的使用体验，不会影响其他用户。',
        tips: [
          '使用可视化规则构建器，无需编程知识',
          '规则可以随时启用/禁用',
          '支持A/B测试验证规则效果',
        ],
        warnings: [
          '过多复杂规则可能导致行为不一致',
          '规则冲突时系统会选择优先级最高的',
        ],
      },
      {
        id: 'rule-management',
        title: '规则管理与优化',
        content: '通过规则管理界面，您可以查看所有规则的表现，启用或禁用特定规则，并根据效果数据进行优化。',
        examples: [
          '规则列表：查看所有激活和禁用的规则',
          '效果统计：每个规则的触发次数和满意度',
          '规则冲突检测：自动识别可能的规则冲突',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: '使用分析洞察',
    icon: ChartBarIcon,
    description: '深入了解您的AI使用模式和优化机会',
    subsections: [
      {
        id: 'personal-analytics',
        title: '个人使用分析',
        content: '个人分析页面提供您在PromptHub上的完整使用画像，包括偏好分析、使用趋势、效果评估等多个维度。',
        tips: [
          '定期查看分析报告，了解使用习惯',
          '关注满意度趋势，发现问题及时调整',
          '利用使用模式优化工作流程',
        ],
        examples: [
          '使用频率：每日、每周、每月的使用统计',
          '提示词偏好：最常用的提示词类型和领域',
          '效果趋势：个性化效果随时间的改善',
        ],
      },
      {
        id: 'prompt-specific',
        title: '提示词专项分析',
        content: '针对特定提示词的深度使用分析，帮助您了解在不同场景下的AI使用效果。',
        examples: [
          '交互模式：在该提示词上的典型使用模式',
          '效果评分：基于反馈的客观效果评估',
          '改进空间：个性化还可以优化的方向',
        ],
      },
      {
        id: 'comparative-analysis',
        title: '对比分析',
        content: '通过对比不同时期、不同提示词、不同规则的效果，发现最适合您的AI使用方式。',
        warnings: [
          '对比分析需要足够的使用数据支撑',
          '短期波动不代表长期趋势',
        ],
      },
    ],
  },
  {
    id: 'experiments',
    title: 'A/B测试与实验',
    icon: BeakerIcon,
    description: '科学地测试和优化您的AI交互策略',
    subsections: [
      {
        id: 'personal-experiments',
        title: '个人实验设计',
        content: '您可以为自己的AI使用创建A/B测试，比较不同规则、不同偏好设置的效果，找到最优配置。',
        tips: [
          '每次只测试一个变量，确保结果可靠',
          '设置合理的测试周期，通常1-2周',
          '收集足够的样本量再做决策',
        ],
        examples: [
          '规则测试：比较有无特定规则的效果',
          '风格测试：比较不同回答风格的满意度',
          '长度测试：比较简洁vs详细回答的偏好',
        ],
      },
      {
        id: 'experiment-analysis',
        title: '实验结果分析',
        content: '系统提供详细的实验结果分析，包括统计显著性检验、置信区间、效果大小等专业指标。',
        warnings: [
          '避免过度解读小样本结果',
          '考虑外部因素对实验的影响',
        ],
      },
      {
        id: 'optimization',
        title: '基于实验的优化',
        content: '根据实验结果，系统会提供个性化的优化建议，帮助您调整规则和偏好设置。',
        tips: [
          '渐进式优化，避免大幅度改变',
          '定期重新评估，适应需求变化',
          '记录优化历程，便于回溯',
        ],
      },
    ],
  },
  {
    id: 'advanced-features',
    title: '高级功能',
    icon: RocketLaunchIcon,
    description: '探索Context Engineering的专业级功能',
    subsections: [
      {
        id: 'advanced-tools',
        title: '高级工具集',
        content: '专业用户可以使用高级Context Engineering工具，包括复杂规则构建、批量优化、API集成等功能。',
        tips: [
          '建议有一定使用经验后再尝试高级功能',
          '高级工具需要更多的配置和维护',
          '充分利用预设模板快速开始',
        ],
      },
      {
        id: 'api-integration',
        title: 'API集成',
        content: '通过API将Context Engineering功能集成到您的工作流程或应用中，实现自动化的个性化AI体验。',
        examples: [
          'Webhook：当个性化效果达到阈值时自动通知',
          'REST API：程序化访问个人上下文数据',
          'GraphQL：灵活查询个性化分析数据',
        ],
      },
      {
        id: 'export-import',
        title: '数据导出导入',
        content: '您可以导出个人的Context Engineering数据用于备份或迁移，也可以导入预配置的规则集。',
        warnings: [
          '导入规则时注意与现有规则的兼容性',
          '个人数据导出包含敏感信息，请妥善保管',
        ],
      },
    ],
  },
];

export default function ContextEngineeringUserGuide() {
  const [activeSection, setActiveSection] = useState<string>('personal-context');
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);
  
  const currentSection = GUIDE_SECTIONS.find(s => s.id === activeSection);

  return (
    <DocLayout
      title="Context Engineering 用户指南"
      description="详细的功能使用教程，帮助您充分利用Context Engineering的所有功能，成为AI个性化的专家。"
      backLink="/docs"
      backText="返回文档首页"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: 'Context Engineering', href: '/docs/context-engineering' },
        { name: '用户指南', href: '/docs/context-engineering/user-guide' },
      ]}
    >

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 侧边导航 */}
        <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 border border-neon-blue/30 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">功能指南</h3>
              <nav className="space-y-2">
                {GUIDE_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-neon-blue/20 border border-neon-blue/30 text-neon-blue'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
        </div>

        {/* 主要内容 */}
        <div className="lg:col-span-3">
            {currentSection && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* 章节头部 */}
                <div className="glass rounded-2xl p-8 border border-neon-blue/30 mb-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-neon-blue/20 rounded-xl mr-4">
                      <currentSection.icon className="h-8 w-8 text-neon-blue" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{currentSection.title}</h2>
                      <p className="text-gray-300 mt-2">{currentSection.description}</p>
                    </div>
                  </div>
                </div>

                {/* 子章节内容 */}
                <div className="space-y-6">
                  {currentSection.subsections.map((subsection, index) => (
                    <SubsectionCard
                      key={subsection.id}
                      subsection={subsection}
                      index={index}
                      isExpanded={expandedSubsection === subsection.id}
                      onToggle={() => setExpandedSubsection(
                        expandedSubsection === subsection.id ? null : subsection.id,
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}
        </div>
      </div>

      {/* 底部导航 */}
      <motion.section
        className="mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass rounded-2xl p-8 border border-neon-purple/30 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">
            继续深入学习
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/docs/context-engineering/best-practices">
              <motion.div
                className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <LightBulbIcon className="h-8 w-8 text-neon-purple mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">最佳实践</h3>
                <p className="text-gray-400 text-sm">专家经验和使用技巧</p>
              </motion.div>
            </Link>
            
            <Link href="/docs/context-engineering/advanced-tools">
              <motion.div
                className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:border-neon-green/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <RocketLaunchIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">高级工具</h3>
                <p className="text-gray-400 text-sm">专业级功能和API</p>
              </motion.div>
            </Link>
            
            <Link href="/docs/context-engineering/concepts">
              <motion.div
                className="p-6 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl hover:border-neon-cyan/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <PuzzlePieceIcon className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">核心概念</h3>
                <p className="text-gray-400 text-sm">理论基础和设计原理</p>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.section>
    </DocLayout>
  );
}

// 子章节卡片组件
function SubsectionCard({ subsection, index, isExpanded, onToggle }: {
  subsection: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
          <div className="flex items-center">
            <div className="w-8 h-8 bg-neon-cyan/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-neon-cyan font-bold text-sm">{index + 1}</span>
            </div>
            <h3 className="text-xl font-semibold text-white">{subsection.title}</h3>
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-600/30"
          >
            <div className="p-6 space-y-6">
              {/* 主要内容 */}
              <p className="text-gray-300 leading-relaxed">
                {subsection.content}
              </p>

              {/* 技巧 */}
              {subsection.tips && subsection.tips.length > 0 && (
                <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <LightBulbIcon className="h-5 w-5 mr-2 text-neon-blue" />
                    实用技巧
                  </h4>
                  <ul className="space-y-2">
                    {subsection.tips.map((tip: string, tipIndex: number) => (
                      <li key={tipIndex} className="text-gray-300 text-sm flex items-start">
                        <span className="text-neon-blue mr-2 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 警告 */}
              {subsection.warnings && subsection.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    注意事项
                  </h4>
                  <ul className="space-y-2">
                    {subsection.warnings.map((warning: string, warningIndex: number) => (
                      <li key={warningIndex} className="text-gray-300 text-sm flex items-start">
                        <span className="text-yellow-500 mr-2 mt-1">⚠</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 示例 */}
              {subsection.examples && subsection.examples.length > 0 && (
                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-neon-green" />
                    实际示例
                  </h4>
                  <ul className="space-y-2">
                    {subsection.examples.map((example: string, exampleIndex: number) => (
                      <li key={exampleIndex} className="text-gray-300 text-sm flex items-start">
                        <span className="text-neon-green mr-2 mt-1">→</span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}