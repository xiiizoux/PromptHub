import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, DocumentTextIcon, ArrowPathIcon, TagIcon, ClockIcon, CheckCircleIcon, ShieldCheckIcon, RocketLaunchIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import DocLayout from '@/components/DocLayout';
import { DocSection, DocGrid, DocCard, DocCodeBlock, DocList, DocHighlight } from '@/components/DocContent';

const VersioningPage: React.FC = () => {
  const versioningBenefits = [
    { title: '变更追踪', description: '记录每次修改和标识修改原因' },
    { title: '性能监控', description: '追踪性能影响和维护变更日志' },
    { title: '团队协作', description: '多人并行开发和冲突解决机制' },
    { title: '代码审查', description: '实施代码审查流程和权限管理' },
    { title: '发布管理', description: '分阶段发布和快速回滚能力' },
    { title: 'A/B测试', description: 'A/B测试支持和环境隔离' },
  ];

  const versionTypes = [
    { title: 'MAJOR', description: '重大变更，不兼容的API修改', color: 'red' },
    { title: 'MINOR', description: '功能更新，向后兼容的新功能', color: 'orange' },
    { title: 'PATCH', description: '问题修复，错误修正和小幅改进', color: 'green' },
  ];

  const workflowSteps = [
    { title: '创建特性分支', description: '为新功能或修复创建独立分支' },
    { title: '开发和测试', description: '在特性分支上进行开发和单元测试' },
    { title: '代码审查', description: '提交Pull Request进行代码审查' },
    { title: '合并到主分支', description: '审查通过后合并到主分支' },
    { title: '创建版本标签', description: '为发布版本创建Git标签' },
    { title: '部署到生产', description: '将标签版本部署到生产环境' },
  ];

  const bestPractices = [
    { title: '清晰的提交信息', description: '使用标准化的提交信息格式' },
    { title: '频繁的小提交', description: '避免大型单体提交' },
    { title: '完整的测试覆盖', description: '确保每个版本都经过充分测试' },
    { title: '文档同步更新', description: '版本更新时同步更新文档' },
  ];

  const nextSteps = [
    {
      title: '系统集成',
      description: '学习如何将提示词集成到现有系统',
      href: '/docs/advanced/integration',
    },
    {
      title: 'API参考',
      description: '查看完整的API文档和使用示例',
      href: '/docs/api',
    },
  ];

  return (
    <DocLayout
      title="版本控制"
      description="学习如何有效管理提示词的版本、变更历史和发布流程"
      backLink="/docs/advanced"
      backText="返回高级功能"
      breadcrumbs={[
        { name: '文档', href: '/docs' },
        { name: '高级功能', href: '/docs/advanced' },
        { name: '版本控制', href: '/docs/advanced/versioning' },
      ]}
    >
      {/* 版本控制概述 */}
      <DocSection title="为什么需要版本控制？" delay={0.1}>
        <p className="text-dark-text-secondary leading-relaxed mb-8">
          提示词版本控制帮助团队跟踪变更、回滚问题版本、协作开发，并确保生产环境的稳定性。
        </p>
        
        <DocGrid cols={3}>
          <DocCard
            title="🔄 变更追踪"
            description="完整记录提示词的演进历史"
            icon={<ArrowPathIcon className="h-6 w-6" />}
            color="blue"
          >
            <DocList items={versioningBenefits.slice(0, 2)} />
          </DocCard>
          
          <DocCard
            title="👥 团队协作"
            description="支持多人协作和冲突管理"
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
          >
            <DocList items={versioningBenefits.slice(2, 4)} />
          </DocCard>
          
          <DocCard
            title="🚀 发布管理"
            description="安全可靠的发布和回滚机制"
            icon={<RocketLaunchIcon className="h-6 w-6" />}
            color="purple"
          >
            <DocList items={versioningBenefits.slice(4, 6)} />
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 版本命名规范 */}
      <DocSection title="版本命名规范" delay={0.2}>
        <h3 className="text-xl font-semibold text-dark-text-primary mb-4">语义化版本控制 (SemVer)</h3>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          采用 MAJOR.MINOR.PATCH 格式，清晰表达变更的影响范围。
        </p>
        
        <DocGrid cols={3}>
          {versionTypes.map((type, index) => (
            <DocCard
              key={index}
              title={type.title}
              description={type.description}
              icon={<TagIcon className="h-6 w-6" />}
              color={type.color as any}
            />
          ))}
        </DocGrid>

        <div className="mt-8">
          <DocCodeBlock
            language="text"
            title="版本号示例"
            code={`v1.0.0 - 初始稳定版本
v1.1.0 - 添加新的上下文处理功能
v1.1.1 - 修复输出格式问题
v1.2.0 - 增加多语言支持
v2.0.0 - 重构提示词结构（破坏性变更）`}
          />
        </div>
        
        <DocHighlight variant="info">
          <strong>建议：</strong> 在开发阶段使用 0.x.x 版本号，首个稳定版本从 1.0.0 开始。
        </DocHighlight>
      </DocSection>

      {/* Git工作流程 */}
      <DocSection title="Git工作流程" delay={0.3}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          推荐使用Git Flow工作流程来管理提示词的开发和发布：
        </p>
        
        <DocGrid cols={2}>
          {workflowSteps.map((step, index) => (
            <DocCard
              key={index}
              title={`${index + 1}. ${step.title}`}
              description={step.description}
              icon={<ClockIcon className="h-6 w-6" />}
              color="cyan"
            />
          ))}
        </DocGrid>

        <div className="mt-8">
          <DocCodeBlock
            language="bash"
            title="Git工作流示例"
            code={`# 1. 创建特性分支
git checkout -b feature/improve-context-handling

# 2. 进行开发工作
git add .
git commit -m "feat: 改进上下文处理逻辑"

# 3. 推送分支并创建PR
git push origin feature/improve-context-handling

# 4. 代码审查通过后，合并到主分支
git checkout main
git merge feature/improve-context-handling

# 5. 创建版本标签
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 6. 删除特性分支
git branch -d feature/improve-context-handling`}
          />
        </div>
      </DocSection>

      {/* 分支策略 */}
      <DocSection title="分支策略" delay={0.4}>
        <DocGrid cols={2}>
          <DocCard
            title="主要分支"
            description="长期存在的核心分支"
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            color="blue"
          >
            <div className="space-y-3 mt-4">
              <div>
                <strong className="text-neon-cyan">main/master:</strong>
                <p className="text-sm text-dark-text-secondary">生产就绪的稳定代码</p>
              </div>
              <div>
                <strong className="text-neon-cyan">develop:</strong>
                <p className="text-sm text-dark-text-secondary">开发集成分支</p>
              </div>
            </div>
          </DocCard>
          
          <DocCard
            title="支持分支"
            description="临时性的功能分支"
            icon={<CodeBracketIcon className="h-6 w-6" />}
            color="purple"
          >
            <div className="space-y-3 mt-4">
              <div>
                <strong className="text-neon-purple">feature/*:</strong>
                <p className="text-sm text-dark-text-secondary">新功能开发</p>
              </div>
              <div>
                <strong className="text-neon-purple">hotfix/*:</strong>
                <p className="text-sm text-dark-text-secondary">紧急修复</p>
              </div>
              <div>
                <strong className="text-neon-purple">release/*:</strong>
                <p className="text-sm text-dark-text-secondary">发布准备</p>
              </div>
            </div>
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 版本发布流程 */}
      <DocSection title="版本发布流程" delay={0.5}>
        <DocCodeBlock
          language="yaml"
          title="自动化发布配置 (.github/workflows/release.yml)"
          code={`name: Release Prompt Version

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Prompt
        run: |
          npm install
          npm run validate-prompts
          
      - name: Run Tests
        run: npm test
        
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          release_name: Release \${{ github.ref }}
          draft: false
          prerelease: false
          
      - name: Deploy to Production
        run: |
          npm run deploy:prod`}
        />

        <DocHighlight variant="warning">
          <strong>注意：</strong> 确保在发布前进行充分的测试，包括单元测试、集成测试和用户验收测试。
        </DocHighlight>
      </DocSection>

      {/* 版本回滚策略 */}
      <DocSection title="版本回滚策略" delay={0.6}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          当新版本出现问题时，快速回滚到稳定版本是关键的运维能力：
        </p>
        
        <DocCodeBlock
          language="bash"
          title="快速回滚示例"
          code={`# 查看版本历史
git tag -l

# 回滚到指定版本
git checkout v1.1.1

# 创建回滚分支
git checkout -b hotfix/rollback-to-v1.1.1

# 如果需要，创建新的补丁版本
git tag -a v1.1.2 -m "Rollback to stable version"

# 部署回滚版本
npm run deploy:prod`}
        />

        <DocGrid cols={2}>
          <DocCard
            title="自动回滚触发条件"
            description="预设的自动回滚机制"
            icon={<ArrowPathIcon className="h-6 w-6" />}
            color="red"
          >
            <ul className="space-y-2 text-sm text-dark-text-secondary mt-4">
              <li>• 错误率超过预设阈值</li>
              <li>• 响应时间显著增加</li>
              <li>• 用户满意度急剧下降</li>
              <li>• 系统稳定性监控告警</li>
            </ul>
          </DocCard>
          
          <DocCard
            title="手动回滚流程"
            description="人工干预的回滚步骤"
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
          >
            <ul className="space-y-2 text-sm text-dark-text-secondary mt-4">
              <li>• 评估问题影响范围</li>
              <li>• 确定目标回滚版本</li>
              <li>• 执行回滚操作</li>
              <li>• 验证系统恢复正常</li>
            </ul>
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 最佳实践 */}
      <DocSection title="版本控制最佳实践" delay={0.7}>
        <DocHighlight variant="info" className="mb-6">
          遵循这些最佳实践，确保版本控制流程的高效和可靠。
        </DocHighlight>
        
        <DocGrid cols={2}>
          <DocCard
            title="开发实践"
            description="日常开发中的规范"
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="blue"
          >
            <DocList items={bestPractices} />
          </DocCard>
          
          <DocCard
            title="提交信息规范"
            description="标准化的提交信息格式"
            icon={<TagIcon className="h-6 w-6" />}
            color="purple"
          >
            <div className="space-y-3 mt-4">
              <DocCodeBlock
                language="text"
                code={`feat: 添加新功能
fix: 修复错误
docs: 文档更新
style: 格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动`}
              />
            </div>
          </DocCard>
        </DocGrid>
      </DocSection>

      {/* 下一步学习 */}
      <DocSection title="下一步学习" delay={0.8}>
        <p className="text-dark-text-secondary leading-relaxed mb-6">
          现在您已经掌握了版本控制的基础知识，可以继续学习：
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

export default VersioningPage;