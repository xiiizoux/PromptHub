import React from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon, ShareIcon, ChartBarIcon, SparklesIcon, CloudArrowDownIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const BasicFeaturesPage: React.FC = () => {
  const createFeatures = [
    { title: '直观的编辑界面', description: '所见即所得的提示词编辑器' },
    { title: '模板变量支持', description: '动态内容和可重用设计' },
    { title: '示例管理', description: '输入输出示例展示' },
    { title: '版本控制', description: '变更历史和回滚功能' },
  ];

  const searchFeatures = [
    { title: '全文搜索', description: '智能内容检索' },
    { title: '分类筛选', description: '按类别快速定位' },
    { title: '标签过滤', description: '多维度筛选条件' },
    { title: '高级筛选', description: '复合条件查询' },
  ];

  const analyzeFeatures = [
    { title: '自动分类和标签提取', description: 'AI智能识别' },
    { title: '模板变量识别', description: '动态内容检测' },
    { title: '版本号建议', description: '智能版本管理' },
    { title: '改进建议生成', description: '优化方案推荐' },
  ];

  const optimizeFeatures = [
    { title: '智能分类建议', description: '精准分类推荐' },
    { title: '标签自动提取', description: '关键词智能识别' },
    { title: '变量模式识别', description: '模板结构分析' },
    { title: '使用场景分析', description: '应用领域识别' },
  ];

  const exportFormats = [
    { title: 'JSON格式', description: '完整数据保留、程序化处理、API集成友好、版本信息完整' },
    { title: 'Markdown格式', description: '人类可读、文档生成、版本控制友好、跨平台兼容' },
    { title: 'CSV格式', description: '表格数据导出、批量处理、数据分析、Excel兼容' },
  ];

  return (
    <DocLayout
      title="基础功能"
      description="掌握 Prompt Hub 的核心功能，提升AI提示词管理效率"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '基础功能', href: '/docs/basic-features' },
      ]}
    >
      {/* 创建和编辑 */}
      <DocSection title="创建和编辑提示词" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed mb-8">
          Prompt Hub 提供强大的提示词创建和编辑功能，支持结构化内容管理、模板变量、示例展示等高级特性。
        </p>
        
        <DocGrid cols={2}>
          <DocCard 
            title="核心编辑功能"
            description="全面的提示词编辑工具"
            icon={<PencilIcon className="h-6 w-6" />}
            color="cyan"
          >
            <DocList items={createFeatures} />
          </DocCard>
          
          <div className="space-y-6">
            <DocHighlight type="info">
              <h4 className="font-semibold mb-3">创建流程</h4>
              <ol className="space-y-2 text-sm">
                <li>1. 点击「创建提示词」按钮</li>
                <li>2. 填写基本信息（名称、描述、分类）</li>
                <li>3. 编写提示词内容</li>
                <li>4. 添加模板变量和示例</li>
                <li>5. 设置权限和发布状态</li>
              </ol>
            </DocHighlight>
            
            <Link 
              href="/create" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              创建提示词
            </Link>
          </div>
        </DocGrid>
      </DocSection>

      {/* 搜索和浏览 */}
      <DocSection title="搜索和浏览" delay={0.2}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            强大的搜索引擎帮助您快速找到所需的提示词，支持多种搜索方式和筛选条件。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="搜索功能"
              description="智能搜索和筛选系统"
              icon={<MagnifyingGlassIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList items={searchFeatures} />
            </DocCard>
            
            <div className="space-y-6">
              <DocCodeBlock 
                code={`# 搜索示例
关键词：代码审查
分类：开发工具
标签：质量保证, 团队协作
作者：@username`}
                title="高级搜索语法"
                language="text"
              />
              
              <Link 
                href="/prompts" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                浏览提示词库
              </Link>
            </div>
          </DocGrid>
        </div>
      </DocSection>

      {/* 分享和协作 */}
      <DocSection title="分享和协作" delay={0.3}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            支持团队协作和知识分享，通过权限管理和版本控制实现安全高效的协作环境。
          </p>
          
          <DocGrid cols={3}>
            <DocCard 
              title="公开分享"
              description="向社区分享优质提示词"
              color="cyan"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 开放访问权限</li>
                <li>• 社区评价反馈</li>
                <li>• 使用统计展示</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="团队协作"
              description="企业内部知识共享"
              color="purple"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 团队成员权限</li>
                <li>• 协作编辑功能</li>
                <li>• 变更审核流程</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="链接分享"
              description="快速分享给特定用户"
              color="pink"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 直接链接访问</li>
                <li>• 临时访问权限</li>
                <li>• 访问记录追踪</li>
              </ul>
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      {/* 性能分析 */}
      <DocSection title="性能分析" delay={0.4}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            全面的性能监控和分析功能，帮助您了解提示词的使用效果，持续优化改进。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="使用统计"
              description="详细的使用数据分析"
              icon={<ChartBarIcon className="h-6 w-6" />}
              color="green"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 调用次数统计</li>
                <li>• 响应时间分析</li>
                <li>• 成功率监控</li>
                <li>• 用户满意度</li>
              </ul>
            </DocCard>
            
            <DocCard 
              title="优化建议"
              description="基于数据的改进方案"
              icon={<SparklesIcon className="h-6 w-6" />}
              color="yellow"
            >
              <ul className="text-sm space-y-1 text-dark-text-tertiary">
                <li>• 性能瓶颈识别</li>
                <li>• 内容优化建议</li>
                <li>• 参数调优方案</li>
                <li>• 最佳实践推荐</li>
              </ul>
            </DocCard>
          </DocGrid>
        </div>
      </DocSection>

      {/* AI智能辅助 */}
      <DocSection title="AI智能辅助" delay={0.5}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            利用AI技术提升提示词创作效率和质量，自动化常规任务，专注创意和策略。
          </p>
          
          <DocGrid cols={2}>
            <DocCard 
              title="智能分析功能"
              description="一键智能分析提示词"
              icon={<SparklesIcon className="h-6 w-6" />}
              color="cyan"
            >
              <DocList items={analyzeFeatures} />
            </DocCard>
            
            <DocCard 
              title="快速优化"
              description="自动化内容优化"
              icon={<SparklesIcon className="h-6 w-6" />}
              color="purple"
            >
              <DocList items={optimizeFeatures} />
            </DocCard>
          </DocGrid>
          
          <DocHighlight type="success" className="mt-8">
            <h4 className="font-semibold mb-3">AI辅助优势</h4>
            <p className="text-sm">
              AI智能辅助功能可以显著提升工作效率，自动识别和提取关键信息，
              提供专业的优化建议，让您专注于创意和策略制定。
            </p>
          </DocHighlight>
        </div>
      </DocSection>

      {/* 导入导出 */}
      <DocSection title="导入导出" delay={0.6}>
        <div className="space-y-8">
          <p className="text-dark-text-secondary leading-relaxed">
            灵活的数据迁移和备份功能，支持多种格式，满足不同场景的数据交换需求。
          </p>
          
          <DocGrid cols={3}>
            {exportFormats.map((format, index) => (
              <DocCard 
                key={index}
                title={format.title}
                description=""
                color={index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'purple' : 'pink'}
              >
                <ul className="text-sm space-y-1 text-dark-text-tertiary">
                  {format.description.split('、').map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </DocCard>
            ))}
          </DocGrid>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300">
              <CloudArrowDownIcon className="h-5 w-5 mr-2" />
              导入数据
            </button>
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300">
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              导出数据
            </button>
          </div>
        </div>
      </DocSection>
    </DocLayout>
  );
};

export default BasicFeaturesPage;