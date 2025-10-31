import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpenIcon, CodeBracketIcon, BeakerIcon, LightBulbIcon, DocumentTextIcon, CubeIcon, RocketLaunchIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

const DocsPage: React.FC = () => {
  const { t } = useLanguage();
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 unified-page-spacing">
        <div className="container-custom">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="unified-page-title-container"
          >
            <motion.div
              className="flex items-center justify-center mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="inline-flex p-2 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue mr-2">
                <DocumentTextIcon className="unified-page-title-icon" />
              </div>
              <h1 className="unified-page-title">
                {t('docs.title')}
              </h1>
            </motion.div>
            <motion.p
              className="unified-page-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('docs.subtitle')}
            </motion.p>
          </motion.div>

          {/* 文档卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {/* 入门指南 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <BookOpenIcon className="h-6 w-6 text-neon-cyan" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">{t('docs.getting_started.title')}</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('docs.getting_started.description')}
                </p>
                <div className="space-y-3">
                  {[
                    { href: '/docs/getting-started', text: t('docs.getting_started.links.concepts') },
                    { href: '/docs/getting-started/first-prompt', text: t('docs.getting_started.links.first_prompt') },
                    { href: '/docs/getting-started/template-variables', text: t('docs.getting_started.links.template_variables') },
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    >
                      <Link href={link.href} className="flex items-center text-gray-300 hover:text-neon-cyan transition-colors duration-300 group/link">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3 group-hover/link:shadow-neon-sm"></div>
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.text}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 上下文工程 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.7 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CpuChipIcon className="h-6 w-6 text-neon-cyan" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">{t('docs.context_engineering.title')}</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('docs.context_engineering.description')}
                </p>
                <div className="space-y-3">
                  {[
                    { href: '/docs/context-engineering/concepts', text: t('docs.context_engineering.links.concepts') },
                    { href: '/docs/context-engineering/getting-started', text: t('docs.context_engineering.links.getting_started') },
                    { href: '/docs/context-engineering/user-guide', text: t('docs.context_engineering.links.user_guide') },
                    { href: '/docs/context-engineering/best-practices', text: t('docs.context_engineering.links.best_practices') },
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                    >
                      <Link href={link.href} className="flex items-center text-gray-300 hover:text-neon-cyan transition-colors duration-300 group/link">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3 group-hover/link:shadow-neon-sm"></div>
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.text}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* API参考 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.9 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-purple/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CodeBracketIcon className="h-6 w-6 text-neon-purple" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-purple transition-colors duration-300">{t('docs.api.title')}</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('docs.api.description')}
                </p>
                <div className="space-y-3">
                  {[
                    { href: '/docs/api-integration', text: t('docs.api.links.integration') },
                    { href: '/docs/api/authentication', text: t('docs.api.links.authentication') },
                    { href: '/docs/api/prompts', text: t('docs.api.links.prompts') },
                    { href: '/docs/api/performance', text: t('docs.api.links.performance') },
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                    >
                      <Link href={link.href} className="flex items-center text-gray-300 hover:text-neon-purple transition-colors duration-300 group/link">
                        <div className="w-2 h-2 bg-neon-purple rounded-full mr-3 group-hover/link:shadow-neon-sm"></div>
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.text}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 最佳实践 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 1.1 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-pink/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-pink to-neon-cyan p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <LightBulbIcon className="h-6 w-6 text-neon-pink" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-pink transition-colors duration-300">{t('docs.best_practices.title')}</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('docs.best_practices.description')}
                </p>
                <div className="space-y-3">
                  {[
                    { href: '/docs/best-practices/structure', text: t('docs.best_practices.links.structure') },
                    { href: '/docs/best-practices/examples', text: t('docs.best_practices.links.examples') },
                    { href: '/docs/best-practices/optimization', text: t('docs.best_practices.links.optimization') },
                    { href: '/docs/templates', text: t('docs.best_practices.links.templates') },
                    { href: '/docs/examples-library', text: t('docs.best_practices.links.examples_library') },
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.3 + index * 0.1 }}
                    >
                      <Link href={link.href} className="flex items-center text-gray-300 hover:text-neon-pink transition-colors duration-300 group/link">
                        <div className="w-2 h-2 bg-neon-pink rounded-full mr-3 group-hover/link:shadow-neon-sm"></div>
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.text}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 高级功能 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 1.3 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <BeakerIcon className="h-6 w-6 text-neon-cyan" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">{t('docs.advanced.title')}</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('docs.advanced.description')}
                </p>
                <div className="space-y-3">
                  {[
                    { href: '/docs/basic-features', text: t('docs.advanced.links.basic_features') },
                    { href: '/docs/mcp-integration', text: t('docs.advanced.links.mcp_integration') },
                    { href: '/docs/advanced/versioning', text: t('docs.advanced.links.versioning') },
                    { href: '/docs/advanced/performance-tracking', text: t('docs.advanced.links.performance_tracking') },
                    { href: '/docs/advanced/integration', text: t('docs.advanced.links.integration') },
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.5 + index * 0.1 }}
                    >
                      <Link href={link.href} className="flex items-center text-gray-300 hover:text-neon-cyan transition-colors duration-300 group/link">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-3 group-hover/link:shadow-neon-sm"></div>
                        <span className="group-hover/link:translate-x-1 transition-transform duration-300">{link.text}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* MCP Prompt Server 集成 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden mb-12"
          >
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan p-0.5">
                  <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-neon-purple" />
                  </div>
                </div>
                <h2 className="ml-4 text-2xl font-bold text-white">{t('docs.mcp_integration.title')}</h2>
              </div>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                {t('docs.mcp_integration.description')}
              </p>
              
              <div className="bg-dark-bg-secondary/50 rounded-xl p-6 mb-8 border border-dark-border/50">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  <h3 className="text-lg font-medium text-white">{t('docs.mcp_integration.config_title')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">{t('docs.mcp_integration.api_endpoint')}:</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">http://localhost:9010</code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">{t('docs.mcp_integration.api_key')}:</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">API_KEY</code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">{t('docs.mcp_integration.config_file')}:</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">.env.local</code>
                  </div>
                </div>
              </div>

              <Link 
                href="/docs/mcp-integration" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300 group"
              >
                <RocketLaunchIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                {t('docs.mcp_integration.view_guide')}
              </Link>
            </div>
          </motion.div>

          {/* 常见问题 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0 }}
            className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">{t('docs.faq.title')}</h2>
              
              <div className="space-y-8">
                {[
                  {
                    question: t('docs.faq.items.q1'),
                    answer: t('docs.faq.items.a1'),
                  },
                  {
                    question: t('docs.faq.items.q2'),
                    answer: t('docs.faq.items.a2'),
                  },
                  {
                    question: t('docs.faq.items.q3'),
                    answer: t('docs.faq.items.a3'),
                  },
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.2 + index * 0.2 }}
                    className="border-l-4 border-neon-cyan pl-6"
                  >
                    <h3 className="text-lg font-medium text-white mb-3">{faq.question}</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
