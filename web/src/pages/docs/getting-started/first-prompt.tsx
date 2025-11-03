import React from 'react';
import Link from 'next/link';
import { ProtectedLink } from '@/components/ProtectedLink';
import { SparklesIcon, CodeBracketIcon, TagIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DocLayout from '@/components/DocLayout';
import { useLanguage } from '@/contexts/LanguageContext';

const FirstPromptPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <DocLayout
      title={t('docs.getting_started.first_prompt.title', { fallback: '创建您的第一个提示词' })}
      description={t('docs.getting_started.first_prompt.description', { fallback: '通过这个详细的教程，学习如何在 Prompt Hub 中创建您的第一个提示词' })}
      backLink="/docs/getting-started"
      backText={t('docs.getting_started.first_prompt.backText', { fallback: '返回入门指南' })}
      breadcrumbs={[
        { name: t('docs.breadcrumbs.docs', { fallback: '文档' }), href: '/docs' },
        { name: t('docs.getting_started.title', { fallback: '入门指南' }), href: '/docs/getting-started' },
        { name: t('docs.getting_started.first_prompt.title', { fallback: '创建第一个提示词' }), href: '/docs/getting-started/first-prompt' },
      ]}
    >
      {/* Preparation */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6 flex items-center">
          <SparklesIcon className="h-8 w-8 text-neon-cyan mr-3" />
          {t('docs.getting_started.first_prompt.preparation.title', { fallback: '准备工作' })}
        </h2>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {t('docs.getting_started.first_prompt.preparation.description', { fallback: '在开始创建提示词之前，请确保您已经：' })}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            className="cyber-card p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="h-5 w-5 text-neon-green" />
              </div>
              <span className="text-neon-green font-semibold">{t('docs.getting_started.first_prompt.preparation.account.title', { fallback: '账户注册' })}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('docs.getting_started.first_prompt.preparation.account.description', { fallback: '注册并登录了 Prompt Hub 账户' })}</p>
          </motion.div>
          
          <motion.div 
            className="cyber-card p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="h-5 w-5 text-neon-blue" />
              </div>
              <span className="text-neon-blue font-semibold">{t('docs.getting_started.first_prompt.preparation.concepts.title', { fallback: '基础概念' })}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('docs.getting_started.first_prompt.preparation.concepts.description', { fallback: '了解了基本的AI提示词概念' })}</p>
          </motion.div>
          
          <motion.div 
            className="cyber-card p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-neon-purple/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="h-5 w-5 text-neon-purple" />
              </div>
              <span className="text-neon-purple font-semibold">{t('docs.getting_started.first_prompt.preparation.content.title', { fallback: '内容准备' })}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('docs.getting_started.first_prompt.preparation.content.description', { fallback: '准备好要创建的提示词内容' })}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Creation Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <motion.div 
          className="glass rounded-2xl p-8 border border-neon-purple/30 mb-8 hover:border-neon-purple/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center text-xl font-bold mr-4">
              1
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
              {t('docs.getting_started.first_prompt.step1.title', { fallback: '访问创建页面' })}
            </h2>
          </div>
          <p className="text-gray-300 mb-6 leading-relaxed">
            {t('docs.getting_started.first_prompt.step1.description', { fallback: '登录后，点击导航栏中的"创建提示词"按钮，或者访问创建页面：' })}
          </p>
          <div className="bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-xl p-6">
            <ProtectedLink href="/create" className="btn-primary">
              <SparklesIcon className="h-5 w-5 mr-2" />
              {t('docs.getting_started.first_prompt.step1.button', { fallback: '前往创建页面' })}
            </ProtectedLink>
          </div>
        </motion.div>

        {/* Step 2 */}
        <motion.div 
          className="glass rounded-2xl p-8 border border-neon-pink/30 mb-8 hover:border-neon-pink/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full flex items-center justify-center text-xl font-bold mr-4">
              2
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">
              {t('docs.getting_started.first_prompt.step2.title', { fallback: '填写基本信息' })}
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CodeBracketIcon className="h-6 w-6 text-neon-cyan mr-2" />
                {t('docs.getting_started.first_prompt.step2.name.title', { fallback: '提示词名称' })}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step2.name.description', { fallback: '为您的提示词选择一个简短、描述性的名称。名称应该能够清楚地表达提示词的用途。' })}
              </p>
              <div className="bg-dark-bg-secondary rounded-xl border border-neon-cyan/20 p-6">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-neon-cyan font-semibold">{t('docs.getting_started.first_prompt.step2.example', { fallback: '示例：' })}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-neon-cyan/20 border border-neon-cyan/30 rounded-full text-sm text-neon-cyan">creative-story-generator</span>
                  <span className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/30 rounded-full text-sm text-neon-purple">code-reviewer</span>
                  <span className="px-3 py-1 bg-neon-pink/20 border border-neon-pink/30 rounded-full text-sm text-neon-pink">email-writer</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('docs.getting_started.first_prompt.step2.description.title', { fallback: '描述' })}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step2.description.content', { fallback: '提供详细的描述，说明这个提示词的功能、适用场景和预期效果。' })}
              </p>
              <div className="bg-dark-bg-secondary rounded-xl border border-neon-green/20 p-6">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-neon-green font-semibold">{t('docs.getting_started.first_prompt.step2.example', { fallback: '示例：' })}</span>
                </p>
                <p className="text-gray-400 text-sm italic">
                  {t('docs.getting_started.first_prompt.step2.description.example', { fallback: '"这个提示词帮助生成富有创意的短篇故事，适用于创意写作、内容创作等场景。"' })}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TagIcon className="h-6 w-6 text-neon-purple mr-2" />
                {t('docs.getting_started.first_prompt.step2.category.title', { fallback: '选择类别' })}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step2.category.description', { fallback: '从预设的类别中选择最适合的分类，这有助于其他用户发现您的提示词。' })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {t('docs.getting_started.first_prompt.step2.category.list', { returnObjects: true, fallback: ['编程', '文案', '教育', '娱乐', '商务', '创作', '分析', '翻译'] }).map((category: string, index: number) => (
                  <motion.div
                    key={category}
                    className="cyber-card p-3 text-center cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-gray-300 text-sm">{category}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 3 */}
        <motion.div 
          className="glass rounded-2xl p-8 border border-neon-green/30 mb-8 hover:border-neon-green/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-pink to-neon-green rounded-full flex items-center justify-center text-xl font-bold mr-4">
              3
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
              {t('docs.getting_started.first_prompt.step3.title', { fallback: '编写提示词内容' })}
            </h2>
          </div>
          <p className="text-gray-300 mb-8 leading-relaxed">
            {t('docs.getting_started.first_prompt.step3.description', { fallback: '这是最重要的部分。编写清晰、具体的提示词内容：' })}
          </p>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('docs.getting_started.first_prompt.step3.structure.title', { fallback: '基本结构' })}</h3>
              <div className="bg-dark-bg-secondary rounded-xl border border-neon-blue/20 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-neon-blue/10 to-transparent border-b border-neon-blue/20">
                  <span className="text-neon-blue text-sm font-mono">PROMPT TEMPLATE</span>
                </div>
                <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{t('docs.getting_started.first_prompt.step3.structure.template', { fallback: `你是一个专业的[角色定义]。

你的任务是[具体任务描述]。

请遵循以下原则：
1. [原则1]
2. [原则2]
3. [原则3]

输出格式：[期望的输出格式]` })}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('docs.getting_started.first_prompt.step3.example.title', { fallback: '实际示例' })}</h3>
              <div className="bg-dark-bg-secondary rounded-xl border border-neon-purple/20 overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-transparent border-b border-neon-purple/20">
                  <span className="text-neon-purple text-sm font-mono">{t('docs.getting_started.first_prompt.step3.example.header', { fallback: 'CODE REVIEWER PROMPT' })}</span>
                </div>
                <pre className="p-6 text-green-400 font-mono text-sm overflow-auto">
{t('docs.getting_started.first_prompt.step3.example.content', { fallback: `你是一个专业的代码审查员，具有多年的软件开发经验。

你的任务是审查用户提供的代码，并提供建设性的反馈和改进建议。

请遵循以下原则：
1. 关注代码质量、可读性和性能
2. 提供具体的改进建议
3. 指出潜在的bug或安全问题
4. 保持友好和建设性的语调

输出格式：
- 总体评价
- 具体问题列表
- 改进建议
- 修改后的代码示例（如需要）` })}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 4 */}
        <motion.div 
          className="glass rounded-2xl p-8 border border-neon-yellow/30 mb-8 hover:border-neon-yellow/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-neon-yellow rounded-full flex items-center justify-center text-xl font-bold mr-4">
              4
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-yellow to-neon-cyan bg-clip-text text-transparent">
              {t('docs.getting_started.first_prompt.step4.title', { fallback: '添加标签和设置' })}
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TagIcon className="h-6 w-6 text-neon-yellow mr-2" />
                {t('docs.getting_started.first_prompt.step4.tags.title', { fallback: '添加标签' })}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step4.tags.description', { fallback: '添加相关标签，帮助用户更容易找到您的提示词。' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {t('docs.getting_started.first_prompt.step4.tags.list', { returnObjects: true, fallback: ['代码', '审查', '编程', '质量', '优化', '安全'] }).map((tag: string, index: number) => (
                  <span key={tag} className="px-3 py-1 bg-neon-yellow/20 border border-neon-yellow/30 rounded-full text-sm text-neon-yellow">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <EyeIcon className="h-6 w-6 text-neon-cyan mr-2" />
                {t('docs.getting_started.first_prompt.step4.visibility.title', { fallback: '可见性设置' })}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step4.visibility.description', { fallback: '选择提示词的可见性：' })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cyber-card p-6">
                  <h4 className="text-lg font-semibold text-neon-purple mb-3">{t('docs.getting_started.first_prompt.step4.visibility.private.title', { fallback: '🔒 私有' })}</h4>
                  <p className="text-gray-400 text-sm">{t('docs.getting_started.first_prompt.step4.visibility.private.description', { fallback: '只有您可以查看和使用' })}</p>
                </div>
                <div className="cyber-card p-6">
                  <h4 className="text-lg font-semibold text-neon-green mb-3">{t('docs.getting_started.first_prompt.step4.visibility.public.title', { fallback: '🌍 公开' })}</h4>
                  <p className="text-gray-400 text-sm">{t('docs.getting_started.first_prompt.step4.visibility.public.description', { fallback: '所有用户都可以查看和使用' })}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 5 */}
        <motion.div 
          className="glass rounded-2xl p-8 border border-neon-cyan/30 mb-8 hover:border-neon-cyan/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-yellow to-neon-cyan rounded-full flex items-center justify-center text-xl font-bold mr-4">
              5
            </div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              {t('docs.getting_started.first_prompt.step5.title', { fallback: '保存和测试' })}
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('docs.getting_started.first_prompt.step5.save.title', { fallback: '保存提示词' })}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step5.save.description', { fallback: '检查所有信息无误后，点击"创建提示词"按钮保存。' })}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('docs.getting_started.first_prompt.step5.test.title', { fallback: '测试提示词' })}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('docs.getting_started.first_prompt.step5.test.description', { fallback: '创建成功后，建议您：' })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="cyber-card p-4">
                  <CheckCircleIcon className="h-6 w-6 text-neon-green mb-2" />
                  <p className="text-gray-300 text-sm">{t('docs.getting_started.first_prompt.step5.test.item1', { fallback: '在实际AI模型中测试提示词效果' })}</p>
                </div>
                <div className="cyber-card p-4">
                  <CheckCircleIcon className="h-6 w-6 text-neon-blue mb-2" />
                  <p className="text-gray-300 text-sm">{t('docs.getting_started.first_prompt.step5.test.item2', { fallback: '根据测试结果调整和优化内容' })}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Completion Message */}
      <motion.div 
        className="glass rounded-2xl p-8 border border-neon-green/30 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <div className="w-16 h-16 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full flex items-center justify-center mx-auto mb-6">
          <SparklesIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-4">
          {t('docs.getting_started.first_prompt.completion.title', { fallback: '恭喜！您已经学会了创建提示词' })}
        </h2>
        <p className="text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
          {t('docs.getting_started.first_prompt.completion.description', { fallback: '现在您可以开始创建自己的提示词了。记住，好的提示词需要不断的测试和优化。' })}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ProtectedLink href="/create" className="btn-primary">
            <SparklesIcon className="h-5 w-5 mr-2" />
            {t('docs.getting_started.first_prompt.completion.createButton', { fallback: '开始创建提示词' })}
          </ProtectedLink>
          <Link href="/docs/best-practices" className="btn-secondary">
            {t('docs.getting_started.first_prompt.completion.learnButton', { fallback: '学习最佳实践' })}
          </Link>
        </div>
      </motion.div>
    </DocLayout>
  );
};

export default FirstPromptPage;