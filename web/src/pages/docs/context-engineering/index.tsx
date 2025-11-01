/**
 * 上下文工程文档主页
 * 
 * 全面介绍上下文工程的概念、价值和在PromptHub中的实现
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';
import {
  CpuChipIcon,
  SparklesIcon,
  AcademicCapIcon,
  LightBulbIcon,
  CogIcon,
  ChartBarIcon,
  UserIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

export default function ContextEngineeringIndex() {
  const { t } = useLanguage();
  
  return (
    <DocLayout
      title={t('docs.context_engineering.title') || "上下文工程"}
      description={t('docs.context_engineering.description') || "下一代AI交互范式 - 让人工智能真正理解并适应您的需求，从静态提示词进化为智能化的个性化AI助手"}
      breadcrumbs={[
        { name: t('docs.breadcrumbs.docs'), href: '/docs' },
        { name: t('docs.breadcrumbs.context_engineering'), href: '/docs/context-engineering' },
      ]}
    >
        {/* 页面头部 */}
        <DocSection title="" delay={0.1}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center p-4 bg-neon-purple/20 rounded-2xl mb-6">
            <CpuChipIcon className="h-12 w-12 text-neon-purple" />
          </div>
          <h1 className="text-5xl font-bold text-white gradient-text mb-4">
            {t('docs.context_engineering.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('docs.context_engineering.description')}
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="#what-is-ce"
              className="px-6 py-3 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              {t('docs.context_engineering.index.learnMore')}
            </Link>
            <Link
              href="/docs/context-engineering/getting-started"
              className="px-6 py-3 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple/10 transition-colors flex items-center"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              {t('docs.context_engineering.index.quickStart')}
            </Link>
          </div>
        </motion.div>

        {/* 什么是上下文工程 */}
        <motion.section
          id="what-is-ce"
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-purple/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3 text-neon-purple" />
              {t('docs.context_engineering.index.whatIsTitle')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">{t('docs.context_engineering.index.coreConcept')}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {t('docs.context_engineering.index.coreConceptDesc')}
                </p>
                <p className="text-gray-300 leading-relaxed">
                  与传统的静态提示词不同，上下文工程创建了一个<strong className="text-neon-purple">学习型、适应型</strong>的AI交互环境，
                  使每次对话都更加精准、个性化和高效。
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 rounded-xl border border-neon-purple/20">
                <h3 className="text-xl font-semibold text-white mb-4">{t('docs.context_engineering.index.keyFeatures')}</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <UserIcon className="h-5 w-5 text-neon-blue mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{t('docs.context_engineering.index.keyFeature1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CogIcon className="h-5 w-5 text-neon-green mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{t('docs.context_engineering.index.keyFeature2')}</span>
                  </li>
                  <li className="flex items-start">
                    <ChartBarIcon className="h-5 w-5 text-neon-yellow mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{t('docs.context_engineering.index.keyFeature3')}</span>
                  </li>
                  <li className="flex items-start">
                    <BoltIcon className="h-5 w-5 text-neon-pink mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{t('docs.context_engineering.index.keyFeature4')}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl">
              <h3 className="text-lg font-semibold text-neon-purple mb-3 flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2" />
                {t('docs.context_engineering.index.exampleTitle')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('docs.context_engineering.index.exampleDesc')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* 上下文工程 vs 传统Prompt */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-cyan/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <PuzzlePieceIcon className="h-8 w-8 mr-3 text-neon-cyan" />
              {t('docs.context_engineering.index.vsTraditionalTitle')}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">{t('docs.context_engineering.index.vsTraditional.feature')}</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">{t('docs.context_engineering.index.vsTraditional.traditional')}</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">{t('docs.context_engineering.index.vsTraditional.contextEngineering')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.interaction')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.interactionTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.interactionCE')}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.personalization')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.personalizationTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.personalizationCE')}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.learning')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.learningTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.learningCE')}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.contextAwareness')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.contextAwarenessTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.contextAwarenessCE')}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.optimization')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.optimizationTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.optimizationCE')}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.complexity')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.complexityTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.complexityCE')}</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">{t('docs.context_engineering.index.vsTraditional.application')}</td>
                    <td className="py-4 px-6 text-gray-400">{t('docs.context_engineering.index.vsTraditional.applicationTraditional')}</td>
                    <td className="py-4 px-6 text-neon-cyan">{t('docs.context_engineering.index.vsTraditional.applicationCE')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* PromptHub中的上下文工程 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-green/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <RocketLaunchIcon className="h-8 w-8 mr-3 text-neon-green" />
              {t('docs.context_engineering.index.implementationTitle')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={UserIcon}
                title={t('docs.context_engineering.index.implementation.concepts')}
                description={t('docs.context_engineering.index.implementation.conceptsDesc')}
                color="neon-blue"
                href="/docs/context-engineering/concepts"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
              
              <FeatureCard
                icon={CogIcon}
                title={t('docs.context_engineering.index.implementation.gettingStarted')}
                description={t('docs.context_engineering.index.implementation.gettingStartedDesc')}
                color="neon-purple"
                href="/docs/context-engineering/getting-started"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
              
              <FeatureCard
                icon={ChartBarIcon}
                title={t('docs.context_engineering.index.implementation.userGuide')}
                description={t('docs.context_engineering.index.implementation.userGuideDesc')}
                color="neon-yellow"
                href="/docs/context-engineering/user-guide"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
              
              <FeatureCard
                icon={BeakerIcon}
                title={t('docs.context_engineering.index.implementation.bestPractices')}
                description={t('docs.context_engineering.index.implementation.bestPracticesDesc')}
                color="neon-green"
                href="/docs/context-engineering/best-practices"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
              
              <FeatureCard
                icon={BoltIcon}
                title={t('docs.context_engineering.index.implementation.advancedTools')}
                description={t('docs.context_engineering.index.implementation.advancedToolsDesc')}
                color="neon-pink"
                href="/tools/advanced-ce"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
              
              <FeatureCard
                icon={AcademicCapIcon}
                title={t('docs.context_engineering.index.implementation.analytics')}
                description={t('docs.context_engineering.index.implementation.analyticsDesc')}
                color="neon-cyan"
                href="/prompts/analytics"
                learnMoreText={t('docs.context_engineering.index.implementation.learnMore')}
              />
            </div>
          </div>
        </motion.section>

        {/* 快速导航 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-yellow/30">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              {t('docs.context_engineering.index.journeyTitle')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickLinkCard
                title={t('docs.context_engineering.index.journey.concepts')}
                description={t('docs.context_engineering.index.journey.conceptsDesc')}
                href="/docs/context-engineering/concepts"
                icon="📚"
                color="blue"
              />
              
              <QuickLinkCard
                title={t('docs.context_engineering.index.journey.gettingStarted')}
                description={t('docs.context_engineering.index.journey.gettingStartedDesc')}
                href="/docs/context-engineering/getting-started"
                icon="🚀"
                color="green"
              />
              
              <QuickLinkCard
                title={t('docs.context_engineering.index.journey.features')}
                description={t('docs.context_engineering.index.journey.featuresDesc')}
                href="/docs/context-engineering/user-guide"
                icon="🛠️"
                color="purple"
              />
              
              <QuickLinkCard
                title={t('docs.context_engineering.index.journey.practices')}
                description={t('docs.context_engineering.index.journey.practicesDesc')}
                href="/docs/context-engineering/best-practices"
                icon="💡"
                color="yellow"
              />
            </div>
          </div>
        </motion.section>
        </DocSection>
    </DocLayout>
  );
}

// 功能特性卡片组件
function FeatureCard({ icon: Icon, title, description, color, href, learnMoreText }: {
  icon: any;
  title: string;
  description: string;
  color: string;
  href: string;
  learnMoreText?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        className="p-6 bg-dark-bg-secondary/50 rounded-xl border border-gray-600/50 hover:border-gray-500/70 transition-all duration-200 cursor-pointer group"
        whileHover={{ scale: 1.02, y: -2 }}
      >
        <div className={`inline-flex p-3 rounded-xl bg-${color}/20 mb-4 group-hover:bg-${color}/30 transition-colors`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          {description}
        </p>
        {learnMoreText && (
          <div className="flex items-center text-neon-cyan text-sm group-hover:translate-x-1 transition-transform">
            {learnMoreText} <ArrowRightIcon className="h-4 w-4 ml-1" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// 快速链接卡片组件
function QuickLinkCard({ title, description, href, icon, color }: {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        className={`p-6 bg-${color}-500/10 border border-${color}-500/30 rounded-xl hover:border-${color}-500/50 transition-all duration-200 cursor-pointer group`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-2xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm">
          {description}
        </p>
      </motion.div>
    </Link>
  );
}