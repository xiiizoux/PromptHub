import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const StructurePage: React.FC = () => {
  const goodFeatures = [
    { title: '明确的角色定义', description: '清晰指定AI扮演的角色和职责' },
    { title: '具体的任务描述', description: '详细说明要完成的任务' },
    { title: '清晰的输出格式', description: '明确指定期望的输出结构' },
    { title: '必要的约束条件', description: '设定适当的限制和边界' },
    { title: '逻辑层次分明', description: '结构化组织信息和指令' },
  ];

  const badFeatures = [
    { title: '模糊的指令', description: '缺乏明确性的描述' },
    { title: '过于复杂的要求', description: '单次请求包含太多任务' },
    { title: '缺乏上下文', description: '没有提供足够的背景信息' },
    { title: '矛盾的指示', description: '指令之间存在冲突' },
    { title: '过长的单段描述', description: '缺乏分段和结构化' },
  ];

  const optimizationTips = [
    { title: '使用分层结构', description: '将复杂指令分解为多个层次' },
    { title: '使用编号和列表', description: '对步骤性指令使用编号列表' },
    { title: '添加示例和模板', description: '提供具体的示例帮助理解' },
    { title: '使用分隔符', description: '清晰区分不同的部分和内容' },
  ];

  const bestPractices = [
    { title: '保持结构清晰和逻辑性', description: '确保指令层次分明' },
    { title: '使用具体而非抽象的描述', description: '避免模糊的表达' },
    { title: '提供充分的上下文信息', description: '给AI足够的背景' },
    { title: '明确指定输出格式和要求', description: '设定明确的期望' },
  ];

  const nextSteps = [
    {
      title: '添加有效示例',
      description: '学习如何在提示词中添加有效的示例',
      href: '/docs/best-practices/examples',
    },
    {
      title: '提示词优化技巧',
      description: '掌握高级的提示词优化方法',
      href: '/docs/best-practices/optimization',
    },
  ];

  return (
    <DocLayout
      title="提示词结构指南"
      description="学习如何设计清晰、有效的提示词结构，提高AI模型的理解和执行能力"
      backLink="/docs/best-practices"
      backText="返回最佳实践"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '最佳实践', href: '/docs/best-practices' },
        { name: '结构指南', href: '/docs/best-practices/structure' },
      ]}
    >
      {/* 基础结构原则 */}
      <DocSection title="基础结构原则" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed mb-8">
          一个良好的提示词结构应该遵循清晰、具体、逻辑性强的原则。以下是构建高效提示词的核心要素：
        </p>
        
        <DocGrid cols={2}>
          <DocCard 
            title="✅ 好的结构特征"
            description="构建高效提示词的最佳实践"
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
          >
            <DocList items={goodFeatures} />
          </DocCard>
          
          <DocCard 
            title="❌ 避免的问题"
            description="常见的结构设计错误"
            icon={<XCircleIcon className="h-6 w-6" />}
            color="red"
          >
            <DocList items={badFeatures} />
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 标准结构模板 */}
      <DocSection title="标准结构模板" delay={0.2}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          以下是一个经过验证的提示词结构模板，适用于大多数场景：
        </p>
        
        <DocCodeBlock 
          language="markdown"
          title="提示词结构模板"
          code={`# 提示词结构模板

## 1. 角色定义
你是一个[具体角色]，具有[相关专业背景/经验]。

## 2. 任务描述
你的任务是[具体任务]。

## 3. 输入信息
用户将提供：
- [输入项1]：[描述]
- [输入项2]：[描述]

## 4. 处理要求
请遵循以下原则：
1. [要求1]
2. [要求2]
3. [要求3]

## 5. 输出格式
请按照以下格式输出：
[具体格式说明]

## 6. 约束条件
- [约束1]
- [约束2]
- [约束3]`}
        />
        
        <DocHighlight variant="info">
          <strong>提示：</strong> 这个模板可以根据具体需求进行调整，不是所有部分都必须包含，但建议保持逻辑清晰。
        </DocHighlight>
      </DocSection>

      {/* 各部分详细说明 */}
      <DocSection title="各部分详细说明" delay={0.3}>
        <div className="space-y-8">
          {/* 角色定义 */}
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">1. 角色定义</h3>
            <p className="text-dark-text-secondary mb-6">
              明确定义AI的角色和专业背景，这有助于模型采用合适的语调和专业水平。
            </p>
            
            <DocGrid cols={2}>
              <div>
                <h4 className="text-lg font-medium text-green-400 mb-3">✅ 好的角色定义</h4>
                <DocCodeBlock
                  language="text"
                  code="你是一个有10年经验的高级软件工程师，专精于JavaScript和React开发，熟悉现代前端开发最佳实践。"
                />
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-red-400 mb-3">❌ 模糊的角色定义</h4>
                <DocCodeBlock
                  language="text"
                  code="你是一个助手，帮助用户解决问题。"
                />
              </div>
            </DocGrid>
          </div>

          {/* 任务描述 */}
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">2. 任务描述</h3>
            <p className="text-dark-text-secondary mb-6">
              清晰描述AI需要完成的具体任务，避免歧义和模糊表达。
            </p>
            
            <DocGrid cols={2}>
              <div>
                <h4 className="text-lg font-medium text-green-400 mb-3">✅ 具体的任务描述</h4>
                <DocCodeBlock
                  language="text"
                  code="你的任务是审查用户提供的JavaScript代码，识别潜在的性能问题、安全漏洞和代码质量问题，并提供具体的改进建议。"
                />
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-red-400 mb-3">❌ 模糊的任务描述</h4>
                <DocCodeBlock
                  language="text"
                  code="帮助用户改进代码。"
                />
              </div>
            </DocGrid>
          </div>

          {/* 输出格式 */}
          <div>
            <h3 className="text-xl font-semibold text-dark-text-primary mb-4">3. 输出格式</h3>
            <p className="text-dark-text-secondary mb-6">
              明确指定期望的输出格式，包括结构、样式和内容组织方式。
            </p>
            
            <DocCodeBlock
              language="markdown"
              title="格式示例"
              code={`请按照以下格式输出：

## 代码审查报告

### 总体评价
[整体代码质量评估]

### 发现的问题
1. **性能问题**
   - [具体问题描述]
   - 影响：[影响说明]
   - 建议：[改进建议]

2. **安全问题**
   - [具体问题描述]
   - 风险级别：[高/中/低]
   - 解决方案：[具体方案]

### 改进建议
[按优先级排序的改进建议]

### 优化后的代码
\`\`\`javascript
[改进后的代码示例]
\`\`\``}
            />
          </div>
        </div>
      </DocSection>

      {/* 结构优化技巧 */}
      <DocSection title="结构优化技巧" delay={0.4}>
        <DocGrid cols={2}>
          {optimizationTips.map((tip, index) => (
            <DocCard
              key={index}
              title={tip.title}
              description={tip.description}
              icon={<LightBulbIcon className="h-6 w-6" />}
              color="cyan"
            />
          ))}
        </DocGrid>
      </DocSection>

      {/* 常见问题和解决方案 */}
      <DocSection title="常见结构问题及解决方案" delay={0.5}>
        <div className="space-y-6">
          <DocCard
            title="问题1：指令过于复杂"
            description="在一个段落中包含多个不同的要求和指令"
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="red"
          >
            <div className="mt-4">
              <DocHighlight variant="error">
                <strong>错误示例：</strong><br />
                请分析这段代码并找出所有问题同时提供改进建议还要重写代码并解释每个改动的原因以及评估性能影响。
              </DocHighlight>
              
              <DocHighlight variant="success">
                <strong>正确示例：</strong><br />
                请按以下步骤分析代码：<br />
                1. 识别代码问题<br />
                2. 提供改进建议<br />
                3. 重写优化代码<br />
                4. 解释改动原因<br />
                5. 评估性能影响
              </DocHighlight>
            </div>
          </DocCard>

          <DocCard
            title="问题2：缺乏明确的输出格式"
            description="AI输出的格式不一致或不符合预期"
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="red"
          >
            <div className="mt-4">
              <DocHighlight variant="error">
                <strong>错误示例：</strong><br />
                请总结这篇文章。
              </DocHighlight>
              
              <DocHighlight variant="success">
                <strong>正确示例：</strong><br />
                请按以下格式总结：<br />
                **标题：** [文章标题]<br />
                **主要观点：** [3-5个要点]<br />
                **结论：** [一句话总结]<br />
                **字数：** [控制在200字以内]
              </DocHighlight>
            </div>
          </DocCard>
        </div>
      </DocSection>

      {/* 最佳实践总结 */}
      <DocSection title="结构设计最佳实践" delay={0.6}>
        <DocHighlight variant="info" className="mb-6">
          掌握这些原则，让您的提示词更加高效和可靠。
        </DocHighlight>
        
        <DocGrid cols={2}>
          <DocCard
            title="设计原则"
            description="核心设计理念"
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="blue"
          >
            <DocList items={bestPractices} />
          </DocCard>
          
          <DocCard
            title="优化技巧"
            description="实用优化方法"
            icon={<LightBulbIcon className="h-6 w-6" />}
            color="purple"
          >
            <DocList items={optimizationTips} />
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 下一步学习 */}
      <DocSection title="下一步学习" delay={0.7}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          现在您已经掌握了提示词结构设计的基础知识，可以继续学习：
        </p>
        
        <DocGrid cols={2}>
          {nextSteps.map((step, index) => (
            <Link key={index} href={step.href}>
              <DocCard
                title={step.title}
                description={step.description}
                icon={<DocumentTextIcon className="h-6 w-6" />}
                color="cyan"
                className="hover:border-neon-cyan/50 transition-colors cursor-pointer"
              />
            </Link>
          ))}
        </DocGrid>
      </DocSection>
    </DocLayout>
  );
};

export default StructurePage;