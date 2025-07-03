/**
 * Context Engineering 核心概念详解
 * 
 * 深入解释Context Engineering的理论基础、技术原理和设计哲学
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import {
  AcademicCapIcon,
  CpuChipIcon,
  LightBulbIcon,
  CogIcon,
  UserIcon,
  ChartBarIcon,
  BoltIcon,
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BeakerIcon,
  PuzzlePieceIcon,
  ClockIcon,
  CpuChipIcon as BrainIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function ContextEngineeringConcepts() {
  return (
    <DocLayout
      title="Context Engineering 核心概念"
      description="深入理解Context Engineering的理论基础、技术架构和设计原理，掌握下一代AI交互范式的核心要素。"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: 'Context Engineering', href: '/docs/context-engineering' },
        { name: '核心概念', href: '/docs/context-engineering/concepts' },
      ]}
    >

        {/* 理论基础 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-blue/30">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <BookOpenIcon className="h-8 w-8 mr-3 text-neon-blue" />
              理论基础与起源
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">认知科学基础</h3>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    Context Engineering的理论基础源于<strong className="text-neon-blue">认知科学</strong>和<strong className="text-neon-blue">人机交互</strong>研究。
                    人类的交流天然依赖于上下文，我们会根据对话者的背景、当前情境、历史交互来调整表达方式。
                  </p>
                  <p>
                    传统的AI系统缺乏这种上下文感知能力，每次交互都是孤立的。Context Engineering试图让AI获得类似人类的上下文感知和适应能力。
                  </p>
                  <p>
                    关键洞察：<em className="text-neon-cyan">"最好的AI助手不是最聪明的，而是最了解用户的"</em>
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-neon-blue/10 to-neon-cyan/10 rounded-xl border border-neon-blue/20">
                <h3 className="text-xl font-semibold text-white mb-4">发展历程</h3>
                <div className="space-y-3">
                  <TimelineItem
                    year="2020-2021"
                    title="Prompt Engineering 兴起"
                    description="静态提示词优化成为AI应用的核心技术"
                  />
                  <TimelineItem
                    year="2022-2023"
                    title="个性化需求爆发"
                    description="用户开始要求更个性化的AI交互体验"
                  />
                  <TimelineItem
                    year="2024"
                    title="Context Engineering 诞生"
                    description="动态、自适应的AI交互范式正式确立"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 核心组件 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-purple/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <PuzzlePieceIcon className="h-8 w-8 mr-3 text-neon-purple" />
              Context Engineering 架构组件
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <ComponentCard
                icon={UserIcon}
                title="用户画像引擎"
                description="构建多维度的用户模型，包含偏好、技能、习惯等特征"
                features={["偏好学习", "行为分析", "技能评估", "情境感知"]}
                color="neon-blue"
              />
              
              <ComponentCard
                icon={CogIcon}
                title="适应规则系统"
                description="智能规则引擎，根据用户特征和情境动态调整AI行为"
                features={["条件规则", "优先级管理", "冲突解决", "效果评估"]}
                color="neon-green"
              />
              
              <ComponentCard
                icon={BrainIcon}
                title="学习反馈机制"
                description="从每次交互中学习，持续优化个性化效果"
                features={["满意度跟踪", "效果分析", "策略调整", "模式识别"]}
                color="neon-yellow"
              />
              
              <ComponentCard
                icon={ChartBarIcon}
                title="上下文记忆库"
                description="存储和管理历史交互、偏好设置和学习成果"
                features={["历史存储", "模式识别", "快速检索", "隐私保护"]}
                color="neon-pink"
              />
              
              <ComponentCard
                icon={BeakerIcon}
                title="实验优化框架"
                description="支持A/B测试和多变量实验，科学优化AI效果"
                features={["实验设计", "效果测量", "统计分析", "自动优化"]}
                color="neon-cyan"
              />
              
              <ComponentCard
                icon={EyeIcon}
                title="透明化界面"
                description="让用户理解AI的决策过程，建立信任和控制感"
                features={["决策解释", "规则展示", "数据透明", "用户控制"]}
                color="neon-purple"
              />
            </div>

            <div className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl">
              <h3 className="text-lg font-semibold text-neon-purple mb-3 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                组件协作原理
              </h3>
              <p className="text-gray-300 leading-relaxed">
                这些组件形成一个闭环系统：用户画像引擎识别用户特征 → 适应规则系统制定策略 → 
                AI执行个性化交互 → 学习反馈机制评估效果 → 上下文记忆库存储经验 → 
                实验优化框架持续改进 → 透明化界面展示过程，整个循环不断优化。
              </p>
            </div>
          </div>
        </motion.section>

        {/* 工作流程 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-green/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <ClockIcon className="h-8 w-8 mr-3 text-neon-green" />
              Context Engineering 工作流程
            </h2>
            
            <div className="space-y-6">
              <WorkflowStep
                step={1}
                title="初始化阶段"
                description="用户首次使用时，系统建立基础画像"
                details={[
                  "收集基本偏好设置（语言、风格、领域等）",
                  "分析用户的初次交互模式",
                  "建立默认的适应规则集合",
                  "设置学习目标和衡量指标"
                ]}
                color="neon-blue"
                icon={UserIcon}
              />
              
              <WorkflowStep
                step={2}
                title="交互执行阶段"
                description="每次AI交互时的动态处理过程"
                details={[
                  "解析用户输入和当前情境",
                  "查询用户画像和历史上下文",
                  "应用适配规则调整AI行为",
                  "生成个性化的回应内容"
                ]}
                color="neon-green"
                icon={CogIcon}
              />
              
              <WorkflowStep
                step={3}
                title="反馈学习阶段"
                description="从交互结果中学习和优化"
                details={[
                  "收集用户反馈（显式和隐式）",
                  "分析交互效果和满意度",
                  "更新用户画像和偏好模型",
                  "调整和优化适应规则"
                ]}
                color="neon-yellow"
                icon={ChartBarIcon}
              />
              
              <WorkflowStep
                step={4}
                title="持续优化阶段"
                description="长期的系统改进和实验"
                details={[
                  "运行A/B测试验证新策略",
                  "分析长期使用模式和趋势",
                  "预测用户需求变化",
                  "实施系统级别的优化"
                ]}
                color="neon-pink"
                icon={BeakerIcon}
              />
            </div>
          </div>
        </motion.section>

        {/* 技术原理 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-cyan/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <CpuChipIcon className="h-8 w-8 mr-3 text-neon-cyan" />
              核心技术原理
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">动态提示词合成</h3>
                <div className="p-4 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50 mb-4">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`// 静态提示词
"请帮我写一段Python代码"

// Context Engineering 动态合成
basePrompt + 
userContext.language + 
userContext.style + 
situationalContext + 
adaptationRules
↓
"请帮我写一段Python代码。
 考虑到您偏好简洁的代码风格，
 并且关注性能优化，
 我将提供高效且易读的实现。"`}
                  </pre>
                </div>
                <p className="text-gray-300 text-sm">
                  通过实时合成技术，每次交互都生成针对当前用户和情境的最优提示词。
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">多维度用户建模</h3>
                <div className="space-y-3">
                  <ModelDimension
                    name="偏好维度"
                    description="语言风格、回答长度、专业程度等"
                    example="正式语调、简洁回答、高技术深度"
                  />
                  <ModelDimension
                    name="能力维度"
                    description="专业技能、经验水平、学习能力等"
                    example="高级Python开发、机器学习初学者"
                  />
                  <ModelDimension
                    name="情境维度"
                    description="使用场景、时间模式、设备环境等"
                    example="工作时间、移动设备、紧急任务"
                  />
                  <ModelDimension
                    name="行为维度"
                    description="交互频率、反馈模式、使用习惯等"
                    example="高频用户、倾向正面反馈、深度使用"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 设计哲学 */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-yellow/30">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <LightBulbIcon className="h-8 w-8 mr-3 text-neon-yellow" />
              设计哲学与原则
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">核心原则</h3>
                <div className="space-y-4">
                  <PrincipleCard
                    title="用户主权"
                    description="用户对自己的数据和AI行为拥有完全控制权"
                    icon="👑"
                  />
                  <PrincipleCard
                    title="透明化"
                    description="AI的决策过程对用户完全透明和可解释"
                    icon="🔍"
                  />
                  <PrincipleCard
                    title="渐进性"
                    description="从简单开始，随着使用深入逐步展现高级功能"
                    icon="📈"
                  />
                  <PrincipleCard
                    title="适应性"
                    description="持续学习用户需求变化，动态调整服务策略"
                    icon="🔄"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">价值主张</h3>
                <div className="p-6 bg-gradient-to-br from-neon-yellow/10 to-neon-green/10 rounded-xl border border-neon-yellow/20">
                  <blockquote className="text-lg text-gray-300 italic leading-relaxed mb-4">
                    "Context Engineering不是为了让AI更聪明，
                    <br />
                    而是为了让AI更懂你。"
                  </blockquote>
                  <div className="space-y-3 text-sm text-gray-400">
                    <p>• <strong>效率提升</strong>：减少重复解释，直达核心需求</p>
                    <p>• <strong>质量提升</strong>：个性化的回答质量显著优于通用回答</p>
                    <p>• <strong>体验提升</strong>：从工具使用者变成AI合作伙伴</p>
                    <p>• <strong>信任提升</strong>：透明的过程建立长期信任关系</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 下一步 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="glass rounded-2xl p-8 border border-neon-pink/30 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              准备好体验Context Engineering了吗？
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Link href="/docs/context-engineering/getting-started">
                <motion.div
                  className="p-6 bg-neon-green/10 border border-neon-green/30 rounded-xl hover:border-neon-green/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="text-lg font-semibold text-white mb-2">快速开始</h3>
                  <p className="text-gray-400 text-sm">5分钟上手指南</p>
                </motion.div>
              </Link>
              
              <Link href="/docs/context-engineering/user-guide">
                <motion.div
                  className="p-6 bg-neon-blue/10 border border-neon-blue/30 rounded-xl hover:border-neon-blue/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-3xl mb-3">📚</div>
                  <h3 className="text-lg font-semibold text-white mb-2">用户指南</h3>
                  <p className="text-gray-400 text-sm">详细使用教程</p>
                </motion.div>
              </Link>
              
              <Link href="/docs/context-engineering/best-practices">
                <motion.div
                  className="p-6 bg-neon-purple/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-3xl mb-3">💡</div>
                  <h3 className="text-lg font-semibold text-white mb-2">最佳实践</h3>
                  <p className="text-gray-400 text-sm">专家经验分享</p>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.section>
    </DocLayout>
  );
}

// 时间线项目组件
function TimelineItem({ year, title, description }: {
  year: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 w-16 text-xs text-neon-cyan font-mono">{year}</div>
      <div className="ml-4">
        <div className="font-medium text-white text-sm">{title}</div>
        <div className="text-gray-400 text-xs">{description}</div>
      </div>
    </div>
  );
}

// 组件卡片
function ComponentCard({ icon: Icon, title, description, features, color }: {
  icon: any;
  title: string;
  description: string;
  features: string[];
  color: string;
}) {
  return (
    <div className="p-6 bg-dark-bg-secondary/50 rounded-xl border border-gray-600/50">
      <div className={`inline-flex p-3 rounded-xl bg-${color}/20 mb-4`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="text-xs text-gray-500 flex items-center">
            <span className={`text-${color} mr-2`}>•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 工作流程步骤
function WorkflowStep({ step, title, description, details, color, icon: Icon }: {
  step: number;
  title: string;
  description: string;
  details: string[];
  color: string;
  icon: any;
}) {
  return (
    <div className="flex items-start">
      <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-${color}/20 border border-${color}/30 mr-6`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <span className={`text-${color} font-mono text-sm mr-3`}>步骤 {step}</span>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 mb-3">{description}</p>
        <ul className="space-y-1">
          {details.map((detail, index) => (
            <li key={index} className="text-sm text-gray-500 flex items-start">
              <span className={`text-${color} mr-2 mt-1`}>•</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 模型维度
function ModelDimension({ name, description, example }: {
  name: string;
  description: string;
  example: string;
}) {
  return (
    <div className="p-3 bg-dark-bg-secondary/50 rounded-lg border border-gray-600/50">
      <div className="font-medium text-white text-sm mb-1">{name}</div>
      <div className="text-gray-400 text-xs mb-2">{description}</div>
      <div className="text-neon-cyan text-xs italic">示例: {example}</div>
    </div>
  );
}

// 原则卡片
function PrincipleCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start">
      <div className="text-2xl mr-3">{icon}</div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}