/**
 * 上下文工程文档主页
 * 
 * 全面介绍上下文工程的概念、价值和在PromptHub中的实现
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
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
  return (
    <DocLayout
      title="上下文工程"
      description="下一代AI交互范式 - 让人工智能真正理解并适应您的需求，从静态提示词进化为智能化的个性化AI助手"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '上下文工程', href: '/docs/context-engineering' },
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
            上下文工程
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            下一代AI交互范式 - 让人工智能真正理解并适应您的需求，<br />
            从静态提示词进化为智能化的个性化AI助手
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="#what-is-ce"
              className="px-6 py-3 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              深入了解
            </Link>
            <Link
              href="/docs/context-engineering/getting-started"
              className="px-6 py-3 border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple/10 transition-colors flex items-center"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              快速开始
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
              什么是上下文工程？
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">核心概念</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  上下文工程是一种革命性的AI交互方法论，它通过构建智能化的上下文适应系统，
                  让AI能够根据用户的个人偏好、使用习惯、历史交互和当前情境，动态调整其回应方式和内容。
                </p>
                <p className="text-gray-300 leading-relaxed">
                  与传统的静态提示词不同，上下文工程创建了一个<strong className="text-neon-purple">学习型、适应型</strong>的AI交互环境，
                  使每次对话都更加精准、个性化和高效。
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 rounded-xl border border-neon-purple/20">
                <h3 className="text-xl font-semibold text-white mb-4">关键特征</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <UserIcon className="h-5 w-5 text-neon-blue mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>个性化适应</strong> - AI学习您的偏好和风格</span>
                  </li>
                  <li className="flex items-start">
                    <CogIcon className="h-5 w-5 text-neon-green mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>动态调整</strong> - 根据情境实时优化回应</span>
                  </li>
                  <li className="flex items-start">
                    <ChartBarIcon className="h-5 w-5 text-neon-yellow mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>持续学习</strong> - 从每次交互中不断改进</span>
                  </li>
                  <li className="flex items-start">
                    <BoltIcon className="h-5 w-5 text-neon-pink mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>智能预测</strong> - 预测用户需求和意图</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl">
              <h3 className="text-lg font-semibold text-neon-purple mb-3 flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2" />
                一个简单的例子
              </h3>
              <p className="text-gray-300 leading-relaxed">
                想象您有一个"代码评审助手"。传统提示词每次都给出相同格式的建议。
                而通过上下文工程，它会记住您是Python开发者、偏好简洁注释、关注性能优化，
                并在后续评审中自动采用您喜欢的代码风格和关注点，就像一个真正了解您的同事。
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
              上下文工程 vs 传统Prompt
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">特性</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">传统Prompt</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">上下文工程</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">交互方式</td>
                    <td className="py-4 px-6 text-gray-400">静态、一次性指令</td>
                    <td className="py-4 px-6 text-neon-cyan">动态、自适应对话</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">个性化程度</td>
                    <td className="py-4 px-6 text-gray-400">无个性化，千篇一律</td>
                    <td className="py-4 px-6 text-neon-cyan">深度个性化，因人而异</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">学习能力</td>
                    <td className="py-4 px-6 text-gray-400">不具备学习能力</td>
                    <td className="py-4 px-6 text-neon-cyan">持续学习和改进</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">上下文感知</td>
                    <td className="py-4 px-6 text-gray-400">仅当前对话上下文</td>
                    <td className="py-4 px-6 text-neon-cyan">历史记忆 + 环境感知</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">效果优化</td>
                    <td className="py-4 px-6 text-gray-400">手动调试和修改</td>
                    <td className="py-4 px-6 text-neon-cyan">自动A/B测试和优化</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-4 px-6 font-medium text-white">复杂度管理</td>
                    <td className="py-4 px-6 text-gray-400">随需求增长而复杂化</td>
                    <td className="py-4 px-6 text-neon-cyan">智能简化，渐进披露</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-medium text-white">应用场景</td>
                    <td className="py-4 px-6 text-gray-400">简单、标准化任务</td>
                    <td className="py-4 px-6 text-neon-cyan">复杂、长期、个性化任务</td>
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
              PromptHub中的上下文工程实现
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={UserIcon}
                title="核心概念"
                description="深入了解上下文工程的理论基础和技术架构"
                color="neon-blue"
                href="/docs/context-engineering/concepts"
              />
              
              <FeatureCard
                icon={CogIcon}
                title="快速入门"
                description="5分钟快速上手上下文工程功能"
                color="neon-purple"
                href="/docs/context-engineering/getting-started"
              />
              
              <FeatureCard
                icon={ChartBarIcon}
                title="用户指南"
                description="详细的功能使用教程和操作指南"
                color="neon-yellow"
                href="/docs/context-engineering/user-guide"
              />
              
              <FeatureCard
                icon={BeakerIcon}
                title="最佳实践"
                description="专家经验分享和实战技巧"
                color="neon-green"
                href="/docs/context-engineering/best-practices"
              />
              
              <FeatureCard
                icon={BoltIcon}
                title="高级工具"
                description="访问高级上下文工程工具中心"
                color="neon-pink"
                href="/tools/advanced-ce"
              />
              
              <FeatureCard
                icon={AcademicCapIcon}
                title="提示词分析"
                description="个人提示词深度分析和优化建议"
                color="neon-cyan"
                href="/prompts/analytics"
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
              开始您的上下文工程之旅
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickLinkCard
                title="基础概念"
                description="了解核心概念和原理"
                href="/docs/context-engineering/concepts"
                icon="📚"
                color="blue"
              />
              
              <QuickLinkCard
                title="快速入门"
                description="5分钟上手指南"
                href="/docs/context-engineering/getting-started"
                icon="🚀"
                color="green"
              />
              
              <QuickLinkCard
                title="功能指南"
                description="详细功能使用教程"
                href="/docs/context-engineering/user-guide"
                icon="🛠️"
                color="purple"
              />
              
              <QuickLinkCard
                title="最佳实践"
                description="专家经验和技巧"
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
function FeatureCard({ icon: Icon, title, description, color, href }: {
  icon: any;
  title: string;
  description: string;
  color: string;
  href: string;
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
        <div className="flex items-center text-neon-cyan text-sm group-hover:translate-x-1 transition-transform">
          了解更多 <ArrowRightIcon className="h-4 w-4 ml-1" />
        </div>
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