/**
 * 上下文工程用户指南
 * 
 * 详细的功能使用教程，覆盖所有核心功能的使用方法和最佳实践
 */

import React, { useState, useMemo } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';

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

function useGuideSections(): GuideSection[] {
  const { t } = useLanguage();
  
  return useMemo(() => [
    {
      id: 'personal-context',
      title: t('docs.context_engineering.user_guide.sections.personal_context.title'),
      icon: UserIcon,
      description: t('docs.context_engineering.user_guide.sections.personal_context.description'),
      subsections: [
        {
          id: 'viewing-context',
          title: t('docs.context_engineering.user_guide.sections.personal_context.viewing.title'),
          content: t('docs.context_engineering.user_guide.sections.personal_context.viewing.content'),
          tips: t('docs.context_engineering.user_guide.sections.personal_context.viewing.tips', { returnObjects: true }) as string[],
          examples: t('docs.context_engineering.user_guide.sections.personal_context.viewing.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'interaction-history',
          title: t('docs.context_engineering.user_guide.sections.personal_context.history.title'),
          content: t('docs.context_engineering.user_guide.sections.personal_context.history.content'),
          tips: t('docs.context_engineering.user_guide.sections.personal_context.history.tips', { returnObjects: true }) as string[],
          warnings: t('docs.context_engineering.user_guide.sections.personal_context.history.warnings', { returnObjects: true }) as string[],
        },
        {
          id: 'learning-insights',
          title: t('docs.context_engineering.user_guide.sections.personal_context.insights.title'),
          content: t('docs.context_engineering.user_guide.sections.personal_context.insights.content'),
          examples: t('docs.context_engineering.user_guide.sections.personal_context.insights.examples', { returnObjects: true }) as string[],
        },
      ],
    },
    {
      id: 'adaptation-rules',
      title: t('docs.context_engineering.user_guide.sections.adaptation_rules.title'),
      icon: CogIcon,
      description: t('docs.context_engineering.user_guide.sections.adaptation_rules.description'),
      subsections: [
        {
          id: 'understanding-rules',
          title: t('docs.context_engineering.user_guide.sections.adaptation_rules.understanding.title'),
          content: t('docs.context_engineering.user_guide.sections.adaptation_rules.understanding.content'),
          tips: t('docs.context_engineering.user_guide.sections.adaptation_rules.understanding.tips', { returnObjects: true }) as string[],
          examples: t('docs.context_engineering.user_guide.sections.adaptation_rules.understanding.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'creating-rules',
          title: t('docs.context_engineering.user_guide.sections.adaptation_rules.creating.title'),
          content: t('docs.context_engineering.user_guide.sections.adaptation_rules.creating.content'),
          tips: t('docs.context_engineering.user_guide.sections.adaptation_rules.creating.tips', { returnObjects: true }) as string[],
          warnings: t('docs.context_engineering.user_guide.sections.adaptation_rules.creating.warnings', { returnObjects: true }) as string[],
        },
        {
          id: 'rule-management',
          title: t('docs.context_engineering.user_guide.sections.adaptation_rules.management.title'),
          content: t('docs.context_engineering.user_guide.sections.adaptation_rules.management.content'),
          examples: t('docs.context_engineering.user_guide.sections.adaptation_rules.management.examples', { returnObjects: true }) as string[],
        },
      ],
    },
    {
      id: 'analytics',
      title: t('docs.context_engineering.user_guide.sections.analytics.title'),
      icon: ChartBarIcon,
      description: t('docs.context_engineering.user_guide.sections.analytics.description'),
      subsections: [
        {
          id: 'personal-analytics',
          title: t('docs.context_engineering.user_guide.sections.analytics.personal.title'),
          content: t('docs.context_engineering.user_guide.sections.analytics.personal.content'),
          tips: t('docs.context_engineering.user_guide.sections.analytics.personal.tips', { returnObjects: true }) as string[],
          examples: t('docs.context_engineering.user_guide.sections.analytics.personal.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'prompt-specific',
          title: t('docs.context_engineering.user_guide.sections.analytics.prompt_specific.title'),
          content: t('docs.context_engineering.user_guide.sections.analytics.prompt_specific.content'),
          examples: t('docs.context_engineering.user_guide.sections.analytics.prompt_specific.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'comparative-analysis',
          title: t('docs.context_engineering.user_guide.sections.analytics.comparative.title'),
          content: t('docs.context_engineering.user_guide.sections.analytics.comparative.content'),
          warnings: t('docs.context_engineering.user_guide.sections.analytics.comparative.warnings', { returnObjects: true }) as string[],
        },
      ],
    },
    {
      id: 'experiments',
      title: t('docs.context_engineering.user_guide.sections.experiments.title'),
      icon: BeakerIcon,
      description: t('docs.context_engineering.user_guide.sections.experiments.description'),
      subsections: [
        {
          id: 'personal-experiments',
          title: t('docs.context_engineering.user_guide.sections.experiments.design.title'),
          content: t('docs.context_engineering.user_guide.sections.experiments.design.content'),
          tips: t('docs.context_engineering.user_guide.sections.experiments.design.tips', { returnObjects: true }) as string[],
          examples: t('docs.context_engineering.user_guide.sections.experiments.design.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'experiment-analysis',
          title: t('docs.context_engineering.user_guide.sections.experiments.analysis.title'),
          content: t('docs.context_engineering.user_guide.sections.experiments.analysis.content'),
          warnings: t('docs.context_engineering.user_guide.sections.experiments.analysis.warnings', { returnObjects: true }) as string[],
        },
        {
          id: 'optimization',
          title: t('docs.context_engineering.user_guide.sections.experiments.optimization.title'),
          content: t('docs.context_engineering.user_guide.sections.experiments.optimization.content'),
          tips: t('docs.context_engineering.user_guide.sections.experiments.optimization.tips', { returnObjects: true }) as string[],
        },
      ],
    },
    {
      id: 'advanced-features',
      title: t('docs.context_engineering.user_guide.sections.advanced.title'),
      icon: RocketLaunchIcon,
      description: t('docs.context_engineering.user_guide.sections.advanced.description'),
      subsections: [
        {
          id: 'advanced-tools',
          title: t('docs.context_engineering.user_guide.sections.advanced.tools.title'),
          content: t('docs.context_engineering.user_guide.sections.advanced.tools.content'),
          tips: t('docs.context_engineering.user_guide.sections.advanced.tools.tips', { returnObjects: true }) as string[],
        },
        {
          id: 'api-integration',
          title: t('docs.context_engineering.user_guide.sections.advanced.api.title'),
          content: t('docs.context_engineering.user_guide.sections.advanced.api.content'),
          examples: t('docs.context_engineering.user_guide.sections.advanced.api.examples', { returnObjects: true }) as string[],
        },
        {
          id: 'export-import',
          title: t('docs.context_engineering.user_guide.sections.advanced.export.title'),
          content: t('docs.context_engineering.user_guide.sections.advanced.export.content'),
          warnings: t('docs.context_engineering.user_guide.sections.advanced.export.warnings', { returnObjects: true }) as string[],
        },
      ],
    },
  ], [t]);
}

export default function ContextEngineeringUserGuide() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>('personal-context');
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);
  
  const guideSections = useGuideSections();
  const currentSection = guideSections.find(s => s.id === activeSection);

  return (
    <DocLayout
      title={t('docs.context_engineering.user_guide.title')}
      description={t('docs.context_engineering.user_guide.description')}
      backLink="/docs"
      backText={t('docs.context_engineering.user_guide.backText')}
      breadcrumbs={[
        { name: t('docs.context_engineering.user_guide.breadcrumbs.docs'), href: '/docs' },
        { name: t('docs.context_engineering.user_guide.breadcrumbs.context_engineering'), href: '/docs/context-engineering' },
        { name: t('docs.context_engineering.user_guide.breadcrumbs.user_guide'), href: '/docs/context-engineering/user-guide' },
      ]}
    >

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 侧边导航 */}
        <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 border border-neon-blue/30 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">{t('docs.context_engineering.user_guide.nav.title')}</h3>
              <nav className="space-y-2">
                {guideSections.map((section) => {
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
            {t('docs.context_engineering.user_guide.continue.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/docs/context-engineering/best-practices">
              <motion.div
                className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <LightBulbIcon className="h-8 w-8 text-neon-purple mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{t('docs.context_engineering.user_guide.labels.next.best_practices')}</h3>
                <p className="text-gray-400 text-sm">{t('docs.context_engineering.user_guide.labels.next.best_practices_desc')}</p>
              </motion.div>
            </Link>
            
            <Link href="/docs/context-engineering/advanced-tools">
              <motion.div
                className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:border-neon-green/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <RocketLaunchIcon className="h-8 w-8 text-neon-green mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{t('docs.context_engineering.user_guide.labels.next.advanced_tools')}</h3>
                <p className="text-gray-400 text-sm">{t('docs.context_engineering.user_guide.labels.next.advanced_tools_desc')}</p>
              </motion.div>
            </Link>
            
            <Link href="/docs/context-engineering/concepts">
              <motion.div
                className="p-6 bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl hover:border-neon-cyan/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <PuzzlePieceIcon className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{t('docs.context_engineering.user_guide.labels.next.concepts')}</h3>
                <p className="text-gray-400 text-sm">{t('docs.context_engineering.user_guide.labels.next.concepts_desc')}</p>
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
  const { t } = useLanguage();
  
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
                    {t('docs.context_engineering.user_guide.labels.tips')}
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
                    {t('docs.context_engineering.user_guide.labels.warnings')}
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
                    {t('docs.context_engineering.user_guide.labels.examples')}
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