import React from 'react';
import Link from 'next/link';
import { ProtectedLink } from '@/components/ProtectedLink';
import { BookOpenIcon, SparklesIcon, RocketLaunchIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const GettingStartedPage: React.FC = () => {
  const quickStartItems = [
    {
      title: "点击「创建提示词」按钮",
      description: "开始创建您的第一个提示词"
    },
    {
      title: "填写基本信息",
      description: "名称、描述、类别和标签"
    },
    {
      title: "编写提示词内容",
      description: "根据需要使用模板变量"
    },
    {
      title: "添加使用示例",
      description: "包括输入和预期输出"
    },
    {
      title: "设置兼容的模型",
      description: "选择适合的AI模型"
    },
    {
      title: "点击「保存」完成创建",
      description: "提示词即可使用"
    }
  ];

  const coreFeatures = [
    { title: "提示词创建和管理", description: "直观的编辑界面" },
    { title: "模板变量和动态内容", description: "提高复用性" },
    { title: "版本控制与协作", description: "团队协作功能" },
    { title: "性能分析和优化", description: "数据驱动改进" },
    { title: "API集成", description: "无缝系统对接" }
  ];

  const useCases = [
    { title: "内容创作和营销", description: "智能文案生成" },
    { title: "客户服务自动化", description: "提升服务效率" },
    { title: "知识管理和检索", description: "智能知识库" },
    { title: "代码开发辅助", description: "提升开发效率" },
    { title: "教育和培训", description: "个性化学习" }
  ];

  const variableTypes = [
    { title: "字符串类型", description: "基础文本内容", href: "/docs/getting-started/template-variables#string" },
    { title: "数组类型", description: "列表和多选项", href: "/docs/getting-started/template-variables#array" },
    { title: "对象类型", description: "复杂结构数据", href: "/docs/getting-started/template-variables#object" },
    { title: "布尔类型", description: "条件判断", href: "/docs/getting-started/template-variables#boolean" }
  ];

  return (
    <DocLayout
      title="入门指南"
      description="快速了解 Prompt Hub 的基本概念和功能，开始创建和管理你的AI提示词"
      breadcrumbs={[
        { name: "文档", href: "/docs" },
        { name: "入门指南", href: "/docs/getting-started" }
      ]}
    >
      {/* 什么是Prompt Hub */}
      <DocSection title="什么是Prompt Hub？" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed">
          Prompt Hub 是一个全面的提示词管理平台，为AI开发者、内容创作者和企业用户提供创建、管理、分享和分析AI提示词的工具。
          作为MCP Prompt Server的现代化前端界面，Prompt Hub提供了直观的用户体验和强大的功能，帮助用户充分发挥大型语言模型(LLM)的潜力。
        </p>
        
        <DocGrid cols={2}>
          <DocCard 
            title="核心功能"
            description="提供完整的提示词生命周期管理"
            icon={<Cog6ToothIcon className="h-6 w-6" />}
            color="cyan"
          >
            <DocList items={coreFeatures} />
          </DocCard>
          
          <DocCard 
            title="适用场景"
            description="覆盖多个行业和应用领域"
            icon={<RocketLaunchIcon className="h-6 w-6" />}
            color="purple"
          >
            <DocList items={useCases} />
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 基础概念 */}
      <DocSection title="基础概念和术语" delay={0.2}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 text-neon-cyan mr-3" />
              提示词（Prompt）
            </h3>
            <p className="text-dark-text-secondary leading-relaxed">
              提示词是发送给AI模型的指令或问题，用于引导模型生成特定类型的回答。一个好的提示词应该清晰、具体，并包含足够的上下文和约束条件。
              在Prompt Hub中，提示词不仅包括文本内容，还可以包含元数据（如类别、标签）和版本信息。
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 text-neon-purple mr-3" />
              模板变量（Template Variables）
            </h3>
            <p className="text-dark-text-secondary leading-relaxed mb-4">
              模板变量是提示词中的动态部分，可以在使用时被替换为具体的值。使用模板变量可以使提示词更加灵活和可重用。
              在Prompt Hub中，模板变量使用双大括号表示。
            </p>
            <DocCodeBlock 
              code="{{variable_name}}"
              title="变量语法示例"
              language="text"
            />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 text-neon-pink mr-3" />
              示例（Examples）
            </h3>
            <p className="text-dark-text-secondary leading-relaxed">
              示例是提示词的输入和预期输出的配对，用于展示提示词如何使用以及预期结果。添加高质量的示例可以帮助其他用户更好地理解提示词的功能和用法。
              示例也是少样本学习（few-shot learning）的基础，可以显著提高模型输出的质量和一致性。
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center">
              <SparklesIcon className="h-6 w-6 text-neon-green mr-3" />
              性能分析（Performance Analytics）
            </h3>
            <p className="text-dark-text-secondary leading-relaxed">
              性能分析是对提示词使用情况和效果的量化评估。Prompt Hub提供全面的性能指标，包括使用频率、成功率、响应时间、token消耗和用户满意度等。
              通过分析这些指标，用户可以发现提示词的优势和不足，从而进行有针对性的优化。
            </p>
          </div>
        </div>
      </DocSection>

      {/* 快速开始 */}
      <DocSection title="快速开始" delay={0.3}>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">1. 注册和登录</h3>
            <p className="text-dark-text-secondary leading-relaxed mb-6">
              访问Prompt Hub首页，点击右上角的"注册"按钮创建新账户，或使用"登录"按钮访问已有账户。
              注册只需提供基本信息，包括用户名、电子邮件和密码。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
              >
                注册账户
              </Link>
              <Link 
                href="/auth/login" 
                className="inline-flex items-center px-6 py-3 border border-neon-cyan text-neon-cyan rounded-xl font-medium hover:bg-neon-cyan/10 transition-all duration-300"
              >
                登录账户
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">2. 浏览提示词库</h3>
            <p className="text-dark-text-secondary leading-relaxed mb-6">
              登录后，您可以访问提示词库，浏览现有的提示词集合。使用搜索框和筛选器可以快速找到特定类别、标签或关键词的提示词。
              点击任何提示词卡片可以查看详细信息，包括完整内容、示例和性能数据。
            </p>
            <Link 
              href="/prompts" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              浏览提示词
            </Link>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">3. 创建您的第一个提示词</h3>
            <p className="text-dark-text-secondary leading-relaxed mb-6">
              点击"创建提示词"按钮开始创建您自己的提示词。填写基本信息（名称、描述、类别等），然后编写提示词内容。
              您可以使用模板变量使提示词更灵活，添加示例展示提示词的用法，并设置兼容的模型。
            </p>
            
            <DocHighlight type="info" className="mb-6">
              <h4 className="font-semibold mb-3">提示词创建流程：</h4>
              <DocList items={quickStartItems} />
            </DocHighlight>
            
            <ProtectedLink 
              href="/create" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-cyan text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              创建提示词
            </ProtectedLink>
          </div>
        </div>
      </DocSection>

      {/* 使用模板变量 */}
      <DocSection title="使用模板变量" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            模板变量是提示词的强大功能，允许您创建动态、可重用的提示词模板。通过使用变量，同一个提示词可以适应不同的输入场景，大大提高了提示词的灵活性和通用性。
          </p>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">变量语法</h3>
            <p className="text-dark-text-secondary leading-relaxed mb-4">
              在Prompt Hub中，变量使用双大括号表示：
            </p>
            <DocCodeBlock 
              code={`你是一位专业的{{role}}。请根据以下信息提供{{output_type}}：

主题：{{topic}}
要点：{{points}}

请确保你的回答是专业、准确的，并适合{{audience}}阅读。`}
              title="模板变量示例"
              language="text"
            />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">变量类型</h3>
            <DocGrid cols={2}>
              {variableTypes.map((type, index) => (
                <DocCard 
                  key={index}
                  title={type.title}
                  description={type.description}
                  color={index % 2 === 0 ? 'cyan' : 'purple'}
                >
                  {type.href && (
                    <Link 
                      href={type.href}
                      className="text-sm text-neon-cyan hover:text-neon-purple transition-colors duration-300"
                    >
                      了解更多 →
                    </Link>
                  )}
                </DocCard>
              ))}
            </DocGrid>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default GettingStartedPage;
