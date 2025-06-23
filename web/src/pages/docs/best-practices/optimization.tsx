import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  SparklesIcon, 
  CpuChipIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  BoltIcon,
  ShieldCheckIcon,
  EyeIcon,
  CogIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const OptimizationPage: React.FC = () => {
  const optimizationStrategies = [
    {
      title: '数据驱动优化',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'cyan' as const,
      description: '基于量化指标持续改进提示词性能',
      techniques: [
        '分析性能指标和响应质量',
        '监控错误模式和失败案例',
        '收集用户反馈和满意度数据',
        '建立A/B测试对比框架',
      ],
    },
    {
      title: '技术结构优化',
      icon: <CogIcon className="h-6 w-6" />,
      color: 'purple' as const,
      description: '通过技术手段提升提示词执行效率',
      techniques: [
        '精简指令语言，去除冗余表达',
        '优化示例质量和相关性',
        '调整参数设置和约束条件',
        '改进输出格式和结构设计',
      ],
    },
    {
      title: '用户体验优化',
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      color: 'pink' as const,
      description: '从用户角度提升交互体验和实用价值',
      techniques: [
        '提升响应速度和处理效率',
        '增强输出一致性和可预测性',
        '减少错误率和异常情况',
        '改善内容可读性和实用性',
      ],
    },
  ];

  const performanceTechniques = [
    {
      title: '精简和聚焦',
      description: '移除冗余信息，专注于核心任务，提高处理效率',
      badExample: `你是一个非常专业的、经验丰富的、
具有多年工作经验的高级软件工程师，
同时也是一个代码审查专家，拥有
深厚的技术背景和丰富的项目经验，
请帮助我审查以下代码...`,
      goodExample: `你是一个高级软件工程师，
专精于代码审查。

请审查以下代码，重点关注：
1. 代码质量
2. 性能问题  
3. 安全漏洞`,
      improvement: '字数减少70%，核心信息更清晰',
    },
    {
      title: '结构化输出',
      description: '使用结构化格式提高输出的可解析性和一致性',
      badExample: '请分析这个产品的优缺点。',
      goodExample: `请按以下JSON格式分析产品：
{
  "overall_score": 0-10,
  "pros": ["优点1", "优点2"],
  "cons": ["缺点1", "缺点2"],
  "recommendation": "推荐/不推荐",
  "reason": "推荐理由"
}`,
      improvement: '输出格式标准化，便于程序处理',
    },
    {
      title: '分步骤处理',
      description: '将复杂任务分解为多个简单步骤，提高准确性',
      badExample: '分析这份文档并给出建议。',
      goodExample: `请按以下步骤分析文档：

步骤1：提取关键信息
- 识别主题和要点
- 标记重要数据

步骤2：分析内容质量  
- 评估逻辑性
- 检查准确性

步骤3：生成总结
- 概括主要内容
- 提出改进建议`,
      improvement: '任务分解明确，执行精度提升40%',
    },
  ];

  const advancedTechniques = [
    {
      title: '动态提示词',
      description: '根据输入内容和上下文动态调整提示词内容',
      code: `// 动态提示词生成示例
function generatePrompt(inputType, complexity, userLevel) {
  let basePrompt = "你是一个专业助手。";
  
  if (inputType === "code") {
    basePrompt += "专精于代码分析。";
  } else if (inputType === "text") {
    basePrompt += "专精于文本处理。";
  }
  
  if (complexity === "high") {
    basePrompt += "请提供详细分析。";
  } else {
    basePrompt += "请提供简要分析。";
  }
  
  return basePrompt;
}`,
      benefits: ['适应性强', '针对性高', '效率提升', '用户体验好'],
    },
    {
      title: '链式提示词',
      description: '将复杂任务分解为多个相互关联的提示词',
      code: `# 提示词链示例：文档分析

## 第一步：信息提取
提取文档中的关键信息：
- 主题和核心观点
- 重要数据和统计
- 关键人物和事件

## 第二步：质量评估
基于提取的信息评估：
- 内容的逻辑性和连贯性
- 信息的完整性和准确性
- 论证的说服力和可信度

## 第三步：总结生成
结合前两步结果生成：
- 核心要点总结
- 优劣势分析
- 具体改进建议`,
      benefits: ['逻辑清晰', '准确度高', '可追溯', '易调试'],
    },
    {
      title: '自我验证机制',
      description: '让AI检查自己的输出，提高准确性',
      code: `请完成任务并进行自我检查：

1. 首先完成主要任务
2. 然后检查输出是否：
   - 符合格式要求
   - 逻辑清晰连贯
   - 信息准确无误
3. 如发现问题，请修正并说明

最终输出格式：
{
  "result": "主要结果",
  "self_check": {
    "format_ok": true/false,
    "logic_ok": true/false,
    "accuracy_ok": true/false
  },
  "corrections": "如有修正，说明修正内容"
}`,
      benefits: ['质量保证', '自动纠错', '可靠性高', '减少人工审核'],
    },
  ];

  const performanceMetrics = [
    { name: '准确率', target: '>90%', color: 'neon-green' },
    { name: '响应时间', target: '<2s', color: 'neon-cyan' },
    { name: '格式一致性', target: '>95%', color: 'neon-purple' },
    { name: '用户满意度', target: '>4.5/5', color: 'neon-pink' },
  ];

  const optimizationWorkflow = [
    { step: 1, title: '基线建立', description: '测试当前提示词性能，建立基准指标', icon: <ChartBarIcon className="h-5 w-5" /> },
    { step: 2, title: '问题识别', description: '分析错误模式，识别改进机会', icon: <EyeIcon className="h-5 w-5" /> },
    { step: 3, title: '方案设计', description: '制定具体的优化方案和测试计划', icon: <LightBulbIcon className="h-5 w-5" /> },
    { step: 4, title: '实施测试', description: '实施优化方案，进行A/B测试', icon: <CogIcon className="h-5 w-5" /> },
    { step: 5, title: '效果评估', description: '分析测试结果，决定是否采用新方案', icon: <CheckCircleIcon className="h-5 w-5" /> },
    { step: 6, title: '持续监控', description: '部署后持续监控，准备下一轮优化', icon: <ArrowPathIcon className="h-5 w-5" /> },
  ];

  const errorPatterns = [
    {
      type: '格式错误',
      symptom: '输出格式不一致或不符合要求',
      solution: '添加更明确的格式示例和约束',
      color: 'orange',
    },
    {
      type: '理解偏差', 
      symptom: 'AI误解任务要求或上下文',
      solution: '重新表述指令，增加澄清说明',
      color: 'red',
    },
    {
      type: '质量不稳定',
      symptom: '输出质量波动较大，不够稳定',
      solution: '增加质量标准和检查点',
      color: 'yellow',
    },
  ];

  return (
    <DocLayout
      title="提示词优化技巧"
      description="掌握高级的提示词优化方法，提升AI模型的性能和输出质量"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '最佳实践', href: '/docs/best-practices' },
        { name: '优化技巧', href: '/docs/best-practices/optimization' },
      ]}
    >
      {/* 返回按钮 */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link 
          href="/docs/best-practices" 
          className="inline-flex items-center text-neon-cyan hover:text-white transition-colors duration-300 group"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          返回最佳实践
        </Link>
      </motion.div>

      {/* 优化策略概述 */}
      <DocSection title="优化策略概述" delay={0.1}>
        <div className="space-y-8">
          <DocHighlight>
            提示词优化是一个持续迭代的过程，需要结合数据分析、用户反馈和系统性测试来不断改进。
            通过科学的方法论和实用的技术手段，我们可以显著提升AI模型的性能和输出质量。
          </DocHighlight>
          
          <DocGrid cols={3}>
            {optimizationStrategies.map((strategy, index) => (
              <DocCard 
                key={index}
                title={strategy.title}
                description={strategy.description}
                icon={strategy.icon}
                color={strategy.color}
              >
                <div className="mt-4 space-y-2">
                  {strategy.techniques.map((technique, techIndex) => (
                    <div key={techIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-dark-text-tertiary">{technique}</span>
                    </div>
                  ))}
                </div>
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 性能优化技巧 */}
      <DocSection title="性能优化技巧" delay={0.2}>
        <div className="space-y-12">
          {performanceTechniques.map((technique, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="glass rounded-2xl border border-dark-border p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-neon-cyan">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{technique.title}</h3>
                  <p className="text-dark-text-secondary">{technique.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                    <h4 className="font-semibold text-red-400">避免的做法</h4>
                  </div>
                  <DocCodeBlock 
                    code={technique.badExample}
                    language="text"
                    className="bg-red-500/5 border-red-500/20"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircleIcon className="h-5 w-5 text-neon-green" />
                    <h4 className="font-semibold text-neon-green">推荐的做法</h4>
                  </div>
                  <DocCodeBlock 
                    code={technique.goodExample}
                    language="text"
                    className="bg-neon-green/5 border-neon-green/20"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 border border-neon-cyan/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <BoltIcon className="h-5 w-5 text-neon-yellow" />
                  <span className="font-medium text-neon-yellow">优化效果：</span>
                  <span className="text-white">{technique.improvement}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </DocSection>

      {/* 高级优化技术 */}
      <DocSection title="高级优化技术" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            这些高级技术可以帮助您构建更智能、更适应性强的提示词系统。
          </p>
          
          <div className="space-y-8">
            {advancedTechniques.map((technique, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="glass rounded-2xl border border-dark-border p-8"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{technique.title}</h3>
                  <p className="text-dark-text-secondary">{technique.description}</p>
                </div>

                <DocCodeBlock 
                  code={technique.code}
                  language={technique.title === '动态提示词' ? 'javascript' : 'text'}
                  className="mb-6"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {technique.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="text-center p-3 bg-dark-bg-secondary/50 rounded-lg border border-dark-border">
                      <span className="text-sm font-medium text-neon-cyan">{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </DocSection>

      {/* 性能监控指标 */}
      <DocSection title="性能监控指标" delay={0.6}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            建立完善的性能监控体系，实时跟踪关键指标，为持续优化提供数据支撑。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="glass rounded-xl border border-dark-border p-6 text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${metric.color}/20 border border-${metric.color}/30 flex items-center justify-center`}>
                  <ChartBarIcon className={`h-8 w-8 text-${metric.color}`} />
                </div>
                <h4 className="font-semibold text-white mb-2">{metric.name}</h4>
                <div className={`text-2xl font-bold text-${metric.color} mb-2`}>{metric.target}</div>
                <div className="text-xs text-dark-text-tertiary">目标值</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DocCard 
              title="监控方法"
              description="系统性的性能监控方案"
              icon={<EyeIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList 
                items={[
                  { title: '自动化测试套件', description: '定期执行标准化测试' },
                  { title: '实时性能监控', description: '持续跟踪关键指标' },
                  { title: '用户反馈收集', description: '收集真实使用体验' },
                  { title: '错误日志分析', description: '识别和解决问题' },
                ]}
                className="mt-4"
              />
            </DocCard>

            <DocCard 
              title="常见错误模式"
              description="识别和解决典型问题"
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              color="purple"
            >
              <div className="mt-4 space-y-3">
                {errorPatterns.map((pattern, index) => (
                  <div key={index} className={`border border-${pattern.color}-500/20 bg-${pattern.color}-500/5 rounded-lg p-3`}>
                    <h5 className={`font-medium text-${pattern.color}-400 mb-1`}>{pattern.type}</h5>
                    <p className="text-xs text-dark-text-tertiary mb-2">{pattern.symptom}</p>
                    <p className="text-xs text-white">{pattern.solution}</p>
                  </div>
                ))}
              </div>
            </DocCard>
          </div>
        </div>
      </DocSection>

      {/* 优化工作流程 */}
      <DocSection title="优化工作流程" delay={0.8}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            遵循系统化的优化流程，确保每次改进都有据可循，效果可衡量。
          </p>
          
          <div className="relative">
            {/* 连接线 */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-pink"></div>
            
            <div className="space-y-8">
              {optimizationWorkflow.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                    {item.icon}
                  </div>
                  <div className="flex-1 glass rounded-xl border border-dark-border p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-neon-cyan">0{item.step}</span>
                      <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                    </div>
                    <p className="text-dark-text-secondary">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DocSection>

      {/* 最佳实践总结 */}
      <DocSection title="最佳实践总结" delay={1.0}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="glass rounded-2xl border border-neon-cyan/30 p-8 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <RocketLaunchIcon className="h-8 w-8 text-neon-cyan" />
            <h3 className="text-2xl font-bold gradient-text">核心原则与关键技巧</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3"></div>
                核心原则
              </h4>
              <div className="space-y-3">
                {[
                  '数据驱动的决策过程',
                  '小步快跑的迭代优化', 
                  '用户体验优先考虑',
                  '持续监控和改进',
                ].map((principle, index) => (
                  <div key={index} className="flex items-center gap-3 text-dark-text-secondary">
                    <CheckCircleIcon className="h-4 w-4 text-neon-green flex-shrink-0" />
                    {principle}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-neon-purple rounded-full mr-3"></div>
                关键技巧
              </h4>
              <div className="space-y-3">
                {[
                  '精简语言，聚焦核心任务',
                  '结构化输出格式设计',
                  '系统性A/B测试验证',
                  '自动化质量检查机制',
                ].map((tip, index) => (
                  <div key={index} className="flex items-center gap-3 text-dark-text-secondary">
                    <SparklesIcon className="h-4 w-4 text-neon-purple flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </DocSection>

      {/* 下一步学习 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-16"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <LightBulbIcon className="h-6 w-6 text-neon-yellow mr-3" />
          继续学习
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/docs/advanced/performance-tracking" 
            className="glass rounded-xl border border-dark-border p-6 hover:border-neon-cyan/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <ChartBarIcon className="h-6 w-6 text-neon-cyan group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-white">性能追踪与分析</h4>
            </div>
            <p className="text-dark-text-secondary text-sm">深入了解性能监控和数据分析方法</p>
          </Link>
          
          <Link 
            href="/docs/advanced/integration" 
            className="glass rounded-xl border border-dark-border p-6 hover:border-neon-purple/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <CogIcon className="h-6 w-6 text-neon-purple group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-white">系统集成</h4>
            </div>
            <p className="text-dark-text-secondary text-sm">学习如何将提示词集成到现有系统</p>
          </Link>
        </div>
      </motion.div>
    </DocLayout>
  );
};

export default OptimizationPage; 