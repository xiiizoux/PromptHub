import React from 'react';
import Link from 'next/link';
import { LightBulbIcon, ShieldCheckIcon, RocketLaunchIcon, ChatBubbleLeftRightIcon, CogIcon, StarIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const BestPracticesPage: React.FC = () => {
  const goodPromptExample = `你是一位经验丰富的{{role}}，专门从事{{domain}}领域的工作。

任务目标：
为{{target_audience}}设计一个完整的{{deliverable}}，重点关注以下方面：

1. **核心要求**：
   - {{requirement_1}}
   - {{requirement_2}}
   - {{requirement_3}}

2. **质量标准**：
   - 专业性：符合行业标准和最佳实践
   - 可用性：易于理解和实施
   - 完整性：涵盖所有必要的要素

3. **输出格式**：
   请按照以下结构组织你的回答：
   - 概述（2-3句话）
   - 详细方案（分步骤说明）
   - 实施建议（具体操作步骤）
   - 潜在风险和解决方案

请确保你的回答基于实际经验，提供具体、可操作的建议。`;

  const badPromptExample = `帮我写个东西`;

  const principles = [
    {
      title: "明确具体",
      description: "提供清晰、具体的指令和上下文",
      icon: <LightBulbIcon className="h-6 w-6" />,
      color: "cyan" as const,
      tips: [
        { title: "明确角色", description: "定义 AI 应该扮演的具体角色" },
        { title: "详细需求", description: "提供具体的任务要求和期望" },
        { title: "上下文信息", description: "包含相关的背景信息和约束条件" }
      ]
    },
    {
      title: "结构化设计",
      description: "使用清晰的结构组织提示词内容",
      icon: <CogIcon className="h-6 w-6" />,
      color: "purple" as const,
      tips: [
        { title: "分层组织", description: "使用标题和列表组织内容" },
        { title: "步骤化", description: "将复杂任务分解为具体步骤" },
        { title: "格式要求", description: "明确指定输出格式和样式" }
      ]
    },
    {
      title: "迭代优化",
      description: "通过测试和反馈持续改进提示词",
      icon: <RocketLaunchIcon className="h-6 w-6" />,
      color: "pink" as const,
      tips: [
        { title: "A/B 测试", description: "比较不同版本的效果" },
        { title: "收集反馈", description: "记录使用效果和改进点" },
        { title: "版本管理", description: "跟踪变更历史和效果对比" }
      ]
    }
  ];

  const antiPatterns = [
    {
      title: "过于宽泛",
      description: "避免模糊不清的指令",
      example: "帮我写点什么",
      solution: "明确指定写作类型、目标受众和具体要求"
    },
    {
      title: "缺乏上下文",
      description: "没有提供足够的背景信息",
      example: "翻译这个",
      solution: "提供原文语言、目标语言、专业领域和语境"
    },
    {
      title: "指令冲突",
      description: "包含相互矛盾的要求",
      example: "要详细但要简洁",
      solution: "明确优先级或分别处理不同需求"
    },
    {
      title: "忽视约束",
      description: "没有考虑实际限制条件",
      example: "生成10000字的内容",
      solution: "考虑模型输出限制，合理设置长度要求"
    }
  ];

  const categories = [
    {
      title: "创意写作",
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: "cyan" as const,
      practices: [
        "提供清晰的写作风格指导",
        "定义目标受众和语调",
        "包含具体的内容要求",
        "设置合适的长度限制"
      ]
    },
    {
      title: "数据分析",
      icon: <CogIcon className="h-6 w-6" />,
      color: "purple" as const,
      practices: [
        "明确数据来源和格式",
        "指定分析方法和指标",
        "定义输出格式要求",
        "包含解释和建议"
      ]
    },
    {
      title: "代码生成",
      icon: <StarIcon className="h-6 w-6" />,
      color: "pink" as const,
      practices: [
        "指定编程语言和版本",
        "描述功能需求和约束",
        "要求代码注释和文档",
        "包含错误处理机制"
      ]
    },
    {
      title: "教育培训",
      icon: <LightBulbIcon className="h-6 w-6" />,
      color: "green" as const,
      practices: [
        "明确学习对象和水平",
        "设计渐进式学习路径",
        "包含实例和练习",
        "提供评估标准"
      ]
    }
  ];

  return (
    <DocLayout
      title="最佳实践指南"
      description="掌握高质量提示词设计的核心原则和实用技巧，提升 AI 交互效果和工作效率"
      breadcrumbs={[
        { name: "文档", href: "/docs" },
        { name: "最佳实践", href: "/docs/best-practices" }
      ]}
    >
      {/* 核心原则 */}
      <DocSection title="核心原则" delay={0.1}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            优秀的提示词遵循一些基本原则，这些原则能够显著提升 AI 的响应质量和准确性。
          </p>
          
          <DocGrid cols={3}>
            {principles.map((principle, index) => (
              <DocCard 
                key={index}
                title={principle.title}
                description={principle.description}
                icon={principle.icon}
                color={principle.color}
              >
                <div className="mt-4 space-y-3">
                  {principle.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="border-l-2 border-neon-cyan/30 pl-3">
                      <h5 className="text-sm font-medium text-white">{tip.title}</h5>
                      <p className="text-xs text-dark-text-tertiary">{tip.description}</p>
                    </div>
                  ))}
                </div>
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 对比示例 */}
      <DocSection title="对比示例" delay={0.2}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            通过对比优秀和糟糕的提示词示例，直观了解最佳实践的应用效果。
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                <span className="w-3 h-3 bg-red-400 rounded-full mr-3"></span>
                避免的做法
              </h4>
              <DocCodeBlock 
                code={badPromptExample}
                title="模糊不清的提示词"
                language="text"
              />
              <DocHighlight type="warning" className="mt-4">
                <h5 className="font-semibold mb-2">问题分析</h5>
                <ul className="text-sm space-y-1">
                  <li>• 没有明确的任务目标</li>
                  <li>• 缺乏必要的上下文信息</li>
                  <li>• 没有指定输出格式或要求</li>
                  <li>• AI 无法理解用户的真实需求</li>
                </ul>
              </DocHighlight>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                推荐的做法
              </h4>
              <DocCodeBlock 
                code={goodPromptExample}
                title="结构化的专业提示词"
                language="text"
              />
              <DocHighlight type="success" className="mt-4">
                <h5 className="font-semibold mb-2">优势分析</h5>
                <ul className="text-sm space-y-1">
                  <li>• 明确定义角色和专业领域</li>
                  <li>• 提供具体的任务要求</li>
                  <li>• 包含清晰的输出格式</li>
                  <li>• 设置质量标准和约束条件</li>
                </ul>
              </DocHighlight>
            </div>
          </div>
        </div>
      </DocSection>

      {/* 常见误区 */}
      <DocSection title="常见误区" delay={0.3}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            了解并避免这些常见的提示词设计误区，能够有效提升提示词的质量和效果。
          </p>
          
          <DocGrid cols={2}>
            {antiPatterns.map((pattern, index) => (
              <DocCard 
                key={index}
                title={pattern.title}
                description={pattern.description}
                color={index % 2 === 0 ? 'red' : 'orange'}
              >
                <div className="mt-4 space-y-3">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-red-400 mb-1">错误示例</h5>
                    <p className="text-xs text-red-300">"{pattern.example}"</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-green-400 mb-1">改进方案</h5>
                    <p className="text-xs text-green-300">{pattern.solution}</p>
                  </div>
                </div>
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 分类指南 */}
      <DocSection title="分类指南" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            不同类型的任务需要采用不同的提示词设计策略，以下是主要应用场景的最佳实践。
          </p>
          
          <DocGrid cols={4}>
            {categories.map((category, index) => (
              <DocCard 
                key={index}
                title={category.title}
                description=""
                icon={category.icon}
                color={category.color}
              >
                <DocList 
                  items={category.practices.map(practice => ({ 
                    title: practice, 
                    description: "" 
                  }))}
                  className="mt-4"
                />
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 测试与优化 */}
      <DocSection title="测试与优化" delay={0.5}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            持续测试和优化是提升提示词质量的关键环节，建立系统性的评估和改进流程。
          </p>
          
          <DocGrid cols={3}>
            <DocCard 
              title="效果评估"
              description="建立客观的评估标准"
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList 
                items={[
                  { title: "准确性评分", description: "回答的正确程度" },
                  { title: "相关性评分", description: "与需求的匹配度" },
                  { title: "完整性评分", description: "信息的全面性" },
                  { title: "可用性评分", description: "实际应用价值" }
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title: "数据收集"
              description="系统性收集使用数据"
              icon={<CogIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList 
                items={[
                  { title: "响应时间", description: "AI 处理速度" },
                  { title: "用户满意度", description: "使用体验评价" },
                  { title: "错误率统计", description: "失败案例分析" },
                  { title: "改进建议", description: "用户反馈收集" }
                ]}
                className="mt-4"
              />
            </DocCard>
            
            <DocCard 
              title="迭代改进"
              description="基于数据进行优化"
              icon={<RocketLaunchIcon className="h-6 w-6" />}
              color="pink"
            >
              <DocList 
                items={[
                  { title: "版本对比", description: "A/B 测试分析" },
                  { title: "增量改进", description: "小步快跑优化" },
                  { title: "回归测试", description: "确保改进有效" },
                  { title: "文档更新", description: "记录最佳配置" }
                ]}
                className="mt-4"
              />
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">优化建议</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">短期优化</h5>
                <ul className="space-y-1">
                  <li>• 调整措辞和表达方式</li>
                  <li>• 优化结构和组织方式</li>
                  <li>• 补充关键上下文信息</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">长期优化</h5>
                <ul className="space-y-1">
                  <li>• 建立标准化模板</li>
                  <li>• 开发评估工具</li>
                  <li>• 构建知识库</li>
                </ul>
              </div>
            </div>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 进阶学习 */}
      <DocSection title="进阶学习" delay={0.6}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            掌握基础后，继续探索更多高级技巧和专业资源，提升提示词设计技能。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/docs/templates" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              浏览模板库
            </Link>
            <Link 
              href="/docs/examples-library" 
              className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
            >
              查看示例库
            </Link>
            <Link 
              href="/community" 
              className="inline-flex items-center px-6 py-3 border border-neon-purple text-neon-purple rounded-xl font-medium hover:bg-neon-purple/10 transition-all duration-300"
            >
              加入社区讨论
            </Link>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default BestPracticesPage;
