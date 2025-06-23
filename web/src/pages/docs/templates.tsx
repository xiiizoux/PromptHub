import React from 'react';
import Link from 'next/link';
import { DocumentTextIcon, CodeBracketIcon, BriefcaseIcon, AcademicCapIcon, BeakerIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocHighlight } from '@/components/DocContent';

const TemplatesPage: React.FC = () => {
  const templateCategories = [
    {
      title: '通用模板',
      description: '适用于各种场景的基础模板',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: 'cyan' as const,
      count: 15,
    },
    {
      title: '商务模板', 
      description: '商务沟通和办公场景专用',
      icon: <BriefcaseIcon className="h-6 w-6" />,
      color: 'purple' as const,
      count: 12,
    },
    {
      title: '教育模板',
      description: '教学和学习场景的专业模板', 
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: 'pink' as const,
      count: 18,
    },
    {
      title: '技术模板',
      description: '编程和技术开发相关模板',
      icon: <CodeBracketIcon className="h-6 w-6" />,
      color: 'green' as const,
      count: 25,
    },
  ];

  const featuredTemplates = [
    {
      title: '通用助手',
      description: '多功能AI助手的基础模板',
      category: '通用',
      tags: ['对话', '助手', '通用'],
    },
    {
      title: '代码审查',
      description: '代码质量检查和改进建议',
      category: '技术',
      tags: ['代码', '审查', '质量'],
    },
    {
      title: '邮件撰写',
      description: '专业商务邮件模板',
      category: '商务',
      tags: ['邮件', '商务', '沟通'],
    },
    {
      title: '课程设计',
      description: '教学课程规划和设计',
      category: '教育',
      tags: ['课程', '教学', '设计'],
    },
  ];

  const exampleTemplate = `你是一位专业的{{role}}，具有丰富的{{domain}}经验。

任务：请根据以下要求提供{{output_type}}

输入信息：
- 主题：{{topic}}
- 目标受众：{{audience}}
- 重点内容：{{key_points}}
- 特殊要求：{{requirements}}

输出要求：
1. 内容要专业、准确、有条理
2. 语言风格要适合{{audience}}
3. 重点突出{{key_points}}
4. 确保满足{{requirements}}

请开始提供您的{{output_type}}：`;

  return (
    <DocLayout
      title="提示词模板库"
      description="精选的提示词模板，涵盖各种应用场景和行业需求，帮助您快速开始创建高质量的提示词"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '模板库', href: '/docs/templates' },
      ]}
    >
      {/* 模板分类导航 */}
      <DocSection title="模板分类" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed mb-8">
          根据不同的应用场景和行业需求，我们精心整理了以下几个主要分类的提示词模板。
        </p>
        
        <DocGrid cols={4}>
          {templateCategories.map((category, index) => (
            <DocCard 
              key={index}
              title={category.title}
              description={category.description}
              icon={category.icon}
              color={category.color}
            >
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-dark-text-tertiary">
                  {category.count} 个模板
                </span>
                <div className={`w-2 h-2 rounded-full bg-neon-${category.color}`}></div>
              </div>
            </DocCard>
          ))}
        </DocGrid>
      </DocSection>

      {/* 精选模板 */}
      <DocSection title="精选模板" delay={0.2}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          社区最受欢迎和实用的模板精选，覆盖主要应用场景。
        </p>
        
        <DocGrid cols={2}>
          {featuredTemplates.map((template, index) => (
            <DocCard 
              key={index}
              title={template.title}
              description={template.description}
              color={index % 2 === 0 ? 'cyan' : 'purple'}
            >
              <div className="space-y-3 mt-4">
                <div className="text-xs text-dark-text-tertiary">
                  分类：{template.category}
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className={`text-xs px-2 py-1 rounded-full border ${
                        index % 2 === 0 
                          ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                          : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </DocCard>
          ))}
        </DocGrid>
      </DocSection>

      {/* 模板结构示例 */}
      <DocSection title="模板结构示例" delay={0.3}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            以下是一个标准的提示词模板结构，展示了如何使用变量和结构化内容创建灵活的模板。
          </p>
          
          <DocCodeBlock 
            code={exampleTemplate}
            title="通用模板示例"
            language="text"
          />
          
          <DocHighlight type="info">
            <h4 className="font-semibold mb-3">模板使用技巧</h4>
            <ul className="space-y-2 text-sm">
              <li>• 使用描述性的变量名，让模板更易理解</li>
              <li>• 提供清晰的输入要求和输出格式</li>
              <li>• 包含适当的上下文和约束条件</li>
              <li>• 保持模板结构清晰和逻辑性</li>
            </ul>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 创建自定义模板 */}
      <DocSection title="创建自定义模板" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            除了使用现有模板，您也可以创建自己的模板，与团队分享或公开到社区。
          </p>
          
          <DocGrid cols={3}>
            <DocCard 
              title="模板设计"
              description="规划模板结构和变量"
              icon={<BeakerIcon className="h-6 w-6" />}
              color="cyan"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary mt-4">
                <li>• 确定应用场景</li>
                <li>• 设计变量结构</li>
                <li>• 编写模板内容</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="模板测试"
              description="验证模板效果和可用性"
              icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
              color="purple"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary mt-4">
                <li>• 多场景测试</li>
                <li>• 效果评估</li>
                <li>• 迭代优化</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="模板分享"
              description="将优质模板分享给社区"
              icon={<DocumentTextIcon className="h-6 w-6" />}
              color="pink"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary mt-4">
                <li>• 完善文档</li>
                <li>• 添加示例</li>
                <li>• 发布分享</li>
              </ul>
            </DocCard>
          </DocGrid>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/create" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              开始创建模板
            </Link>
            <Link 
              href="/prompts?category=template" 
              className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
            >
              浏览更多模板
            </Link>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default TemplatesPage;
 