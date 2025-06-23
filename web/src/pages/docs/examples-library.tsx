import React from 'react';
import Link from 'next/link';
import { CodeBracketIcon, DocumentTextIcon, BeakerIcon, AcademicCapIcon, BriefcaseIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocHighlight } from '@/components/DocContent';

const ExamplesLibraryPage: React.FC = () => {
  const codeReviewExample = `你是一位资深的软件工程师和代码审查专家，拥有10年以上的开发经验。

请对以下代码进行全面的审查，重点关注：

**审查维度：**
1. **代码质量**：可读性、可维护性、代码规范
2. **性能优化**：算法效率、资源使用、潜在瓶颈
3. **安全性**：潜在安全漏洞和风险
4. **最佳实践**：设计模式、架构原则的应用

**代码内容：**
\`\`\`{{language}}
{{code_content}}
\`\`\`

**输出格式：**
## 📊 总体评价
- 代码质量：★★★★☆
- 性能表现：★★★☆☆  
- 安全性：★★★★★

## 🔍 详细分析
### 🟢 优点
[列出代码的优秀之处]

### 🟡 改进建议
[提供具体的改进建议]

### 🔴 问题和风险
[指出存在的问题和潜在风险]

## 💡 优化方案
[提供具体的代码优化建议和示例]

请确保你的建议具体、可操作，并提供相关的代码示例。`;

  const emailWriterExample = `你是一位专业的商务沟通专家，擅长撰写各类商务邮件。

任务：根据以下信息撰写一封专业的商务邮件。

**邮件信息：**
- 邮件类型：{{email_type}} (如：询价、合作提案、会议邀请等)
- 收件人：{{recipient}} (姓名和职位)
- 发件人：{{sender}} (您的姓名和职位)
- 主要目的：{{purpose}}
- 关键信息：{{key_points}}
- 语调要求：{{tone}} (正式/友好/紧急等)

**邮件结构要求：**
1. **主题行**：简洁明了，突出重点
2. **开头问候**：适当的称呼和问候语
3. **正文内容**：
   - 简要自我介绍（如需要）
   - 清晰说明目的和背景
   - 详细阐述关键信息
   - 明确的行动呼吁或下一步
4. **结尾**：礼貌的结尾和署名

**注意事项：**
- 保持专业和礼貌的语调
- 确保信息准确、完整
- 使用适当的商务用语
- 考虑文化背景和商务礼仪

请生成完整的邮件内容，包括主题行。`;

  const tutorExample = `你是一位经验丰富的{{subject}}老师，擅长根据学生的水平和需求提供个性化的教学指导。

**学生信息：**
- 学习水平：{{level}} (初学者/中级/高级)
- 学习目标：{{goal}}
- 重点难点：{{difficulties}}
- 学习时间：{{available_time}}

**教学任务：**
请为这位学生制定一个关于"{{topic}}"的学习计划和教学内容。

**教学要求：**
1. **知识点分解**：将复杂概念分解为易懂的小块
2. **循序渐进**：按照学习认知规律安排内容
3. **实践结合**：提供练习题和实际应用场景
4. **及时反馈**：设计检验学习效果的方法

**输出格式：**
## 📚 学习计划概览
- 总学习时间：X小时
- 学习阶段：X个阶段
- 主要目标：[列出核心学习目标]

## 📖 详细教学内容
### 第一阶段：基础概念
- 学习内容：[具体知识点]
- 学习方法：[建议的学习方式]
- 练习题：[相关练习]
- 预计时间：X小时

[继续其他阶段...]

## 🎯 学习建议
[提供个性化的学习建议和注意事项]

## 📝 评估方式
[设计检验学习效果的方法]

请确保内容适合学生的水平，语言通俗易懂。`;

  const examples = [
    {
      category: '技术开发',
      title: '代码审查助手',
      description: '专业的代码质量分析和改进建议',
      tags: ['代码', '审查', '质量'],
      difficulty: '中级',
      useCase: '代码质量检查、团队协作、技术培训',
      prompt: codeReviewExample,
    },
    {
      category: '商务办公', 
      title: '商务邮件撰写',
      description: '根据场景和需求生成专业邮件',
      tags: ['邮件', '商务', '沟通'],
      difficulty: '初级',
      useCase: '商务沟通、客户服务、团队协作',
      prompt: emailWriterExample,
    },
    {
      category: '教育培训',
      title: '个性化教学助手', 
      description: '根据学生水平定制教学内容',
      tags: ['教学', '个性化', '教育'],
      difficulty: '高级',
      useCase: '在线教育、培训课程、知识传授',
      prompt: tutorExample,
    },
  ];

  const categories = [
    {
      title: '创意写作',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'cyan' as const,
      count: 25,
      description: '文案创作、故事写作、内容生成',
    },
    {
      title: '技术开发',
      icon: <CodeBracketIcon className="h-6 w-6" />,
      color: 'purple' as const,
      count: 32,
      description: '代码生成、架构设计、技术分析',
    },
    {
      title: '商务办公',
      icon: <BriefcaseIcon className="h-6 w-6" />,
      color: 'pink' as const,
      count: 18,
      description: '邮件撰写、报告生成、会议管理',
    },
    {
      title: '教育培训',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: 'green' as const,
      count: 21,
      description: '课程设计、知识问答、学习指导',
    },
    {
      title: '数据分析',
      icon: <BeakerIcon className="h-6 w-6" />,
      color: 'yellow' as const,
      count: 15,
      description: '数据处理、图表生成、趋势分析',
    },
    {
      title: '客户服务',
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: 'purple' as const,
      count: 12,
      description: '客户支持、问题解答、服务咨询',
    },
  ];

  return (
    <DocLayout
      title="示例库"
      description="精选的提示词示例集合，涵盖各种应用场景和行业需求，为您的项目提供灵感和参考"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '示例库', href: '/docs/examples-library' },
      ]}
    >
      {/* 分类概览 */}
      <DocSection title="分类概览" delay={0.1}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            我们的示例库包含了 130+ 个精心设计的提示词示例，覆盖 6 个主要应用领域。
          </p>
          
          <DocGrid cols={3}>
            {categories.map((category, index) => (
              <DocCard 
                key={index}
                title={category.title}
                description={category.description}
                icon={category.icon}
                color={category.color}
              >
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-dark-text-tertiary">
                    {category.count} 个示例
                  </span>
                  <div className={`w-2 h-2 rounded-full bg-neon-${category.color}`}></div>
                </div>
              </DocCard>
            ))}
          </DocGrid>
        </div>
      </DocSection>

      {/* 精选示例 */}
      <DocSection title="精选示例" delay={0.2}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            以下是一些最受欢迎和实用的提示词示例，展示了不同场景下的最佳实践。
          </p>
          
          {examples.map((example, index) => (
            <div key={index} className="cyber-card group">
              <div className="p-8 space-y-6">
                {/* 示例头部信息 */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-neon-${
                        index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                      }/20 text-neon-${
                        index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                      } border border-neon-${
                        index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                      }/30`}>
                        {example.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        example.difficulty === '初级' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : example.difficulty === '中级'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {example.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {example.title}
                    </h3>
                    <p className="text-dark-text-secondary">
                      {example.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {example.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-1 text-xs rounded border bg-dark-bg-secondary/50 text-dark-text-tertiary border-dark-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 使用场景 */}
                <div className="bg-dark-bg-secondary/30 border border-dark-border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-dark-text-secondary mb-2">适用场景</h4>
                  <p className="text-sm text-dark-text-tertiary">{example.useCase}</p>
                </div>

                {/* 提示词内容 */}
                <DocCodeBlock 
                  code={example.prompt}
                  title={`${example.title} - 完整提示词`}
                  language="text"
                />

                {/* 操作按钮 */}
                <div className="flex items-center gap-4 pt-4 border-t border-dark-border">
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-neon-${
                    index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                  }/20 text-neon-${
                    index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                  } border border-neon-${
                    index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                  }/30 hover:bg-neon-${
                    index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'
                  }/30`}>
                    复制提示词
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-dark-bg-secondary text-dark-text-secondary border border-dark-border hover:bg-dark-bg-tertiary">
                    在线试用
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-dark-text-tertiary hover:text-white">
                    添加收藏
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      {/* 使用指南 */}
      <DocSection title="使用指南" delay={0.3}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            为了帮助您更好地使用示例库中的提示词，我们提供了详细的使用指南和最佳实践。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="快速入门"
              description="学习如何有效使用示例库"
              color="cyan"
            >
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <h5 className="font-medium text-white mb-1">选择合适的示例</h5>
                    <p className="text-dark-text-tertiary">根据您的需求和使用场景选择最合适的提示词示例</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <h5 className="font-medium text-white mb-1">自定义变量</h5>
                    <p className="text-dark-text-tertiary">替换示例中的变量占位符为您的具体需求</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <h5 className="font-medium text-white mb-1">测试和优化</h5>
                    <p className="text-dark-text-tertiary">根据实际效果调整和优化提示词内容</p>
                  </div>
                </div>
              </div>
            </DocCard>
            
            <DocCard 
              title="进阶技巧"
              description="掌握高级使用技巧"
              color="purple"
            >
              <div className="mt-4 space-y-3 text-sm">
                <div className="border-l-2 border-neon-purple/30 pl-3">
                  <h5 className="font-medium text-white mb-1">组合使用</h5>
                  <p className="text-dark-text-tertiary">将多个示例组合使用，创建复合功能的提示词</p>
                </div>
                <div className="border-l-2 border-neon-purple/30 pl-3">
                  <h5 className="font-medium text-white mb-1">场景适配</h5>
                  <p className="text-dark-text-tertiary">根据特定行业或场景调整示例的语言风格</p>
                </div>
                <div className="border-l-2 border-neon-purple/30 pl-3">
                  <h5 className="font-medium text-white mb-1">版本管理</h5>
                  <p className="text-dark-text-tertiary">建立自己的提示词版本库，持续迭代优化</p>
                </div>
              </div>
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">贡献示例</h4>
            <p className="text-sm mb-3">
              我们欢迎社区贡献高质量的提示词示例。如果您有优秀的提示词想要分享，可以通过以下方式参与：
            </p>
            <ul className="text-sm space-y-1">
              <li>• 在社区论坛分享您的提示词设计</li>
              <li>• 提交 GitHub Pull Request</li>
              <li>• 参与每月的示例征集活动</li>
              <li>• 加入我们的贡献者计划</li>
            </ul>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 下一步 */}
      <DocSection title="探索更多" delay={0.4}>
        <div className="space-y-6">
          <p className="text-dark-text-secondary leading-relaxed">
            浏览完示例库后，您可以继续探索其他相关资源，深入学习提示词设计。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/prompts" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              浏览全部提示词
            </Link>
            <Link 
              href="/docs/templates" 
              className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
            >
              查看模板库
            </Link>
            <Link 
              href="/docs/best-practices" 
              className="inline-flex items-center px-6 py-3 border border-neon-purple text-neon-purple rounded-xl font-medium hover:bg-neon-purple/10 transition-all duration-300"
            >
              学习最佳实践
            </Link>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default ExamplesLibraryPage; 