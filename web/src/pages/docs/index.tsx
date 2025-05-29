import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpenIcon, CodeBracketIcon, BeakerIcon, LightBulbIcon, DocumentTextIcon, CubeIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const DocsPage: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
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

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* 页面标题 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              开发文档
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              深入了解 Prompt Hub 的强大功能，掌握AI提示词创作的艺术
            </motion.p>
          </motion.div>

          {/* 文档卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
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
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">入门指南</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  了解 Prompt Hub 的基本概念和功能，快速开始使用平台创造AI魔法。
                </p>
                <div className="space-y-3">
                  {[
                    { href: "/docs/getting-started", text: "基础概念和术语" },
                    { href: "/docs/getting-started/first-prompt", text: "创建您的第一个提示词" },
                    { href: "/docs/getting-started/template-variables", text: "使用模板变量" }
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

            {/* API参考 */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-purple/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CodeBracketIcon className="h-6 w-6 text-neon-purple" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-purple transition-colors duration-300">API参考</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  完整的API文档，帮助您将提示词集成到自己的应用程序中。
                </p>
                <div className="space-y-3">
                  {[
                    { href: "/docs/api/authentication", text: "认证与授权" },
                    { href: "/docs/api/prompts", text: "提示词API" },
                    { href: "/docs/api/performance", text: "性能分析API" }
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
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
              transition={{ duration: 0.8, delay: 1.0 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-pink/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-pink to-neon-cyan p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <LightBulbIcon className="h-6 w-6 text-neon-pink" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-pink transition-colors duration-300">提示词最佳实践</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  学习如何设计高效、可靠的提示词，提高AI模型输出的质量和一致性。
                </p>
                <div className="space-y-3">
                  {[
                    { href: "/docs/best-practices/structure", text: "提示词结构指南" },
                    { href: "/docs/best-practices/examples", text: "添加有效示例" },
                    { href: "/docs/best-practices/optimization", text: "提示词优化技巧" },
                    { href: "/docs/templates", text: "提示词模板库" },
                    { href: "/docs/examples-library", text: "实际应用示例" }
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
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
              transition={{ duration: 0.8, delay: 1.2 }}
              className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <BeakerIcon className="h-6 w-6 text-neon-cyan" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">高级功能</h2>
                </div>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  深入了解 Prompt Hub 的高级功能，充分发挥平台的潜力。
                </p>
                <div className="space-y-3">
                  {[
                    { href: "/docs/advanced/versioning", text: "提示词版本控制" },
                    { href: "/docs/advanced/performance-tracking", text: "性能追踪与分析" },
                    { href: "/docs/advanced/integration", text: "与其他系统集成" }
                  ].map((link, index) => (
                    <motion.div
                      key={link.href}
                      variants={linkVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
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
            transition={{ duration: 0.8, delay: 1.6 }}
            className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden mb-12"
          >
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-cyan p-0.5">
                  <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-neon-purple" />
                  </div>
                </div>
                <h2 className="ml-4 text-2xl font-bold text-white">与 MCP Prompt Server 集成</h2>
              </div>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                Prompt Hub 前端与 MCP Prompt Server 后端无缝集成，提供完整的提示词管理解决方案。
                MCP Prompt Server 支持两种部署模式：本地部署（使用文件存储）和远程部署（使用 Supabase 存储）。
              </p>
              
              <div className="bg-dark-bg-secondary/50 rounded-xl p-6 mb-8 border border-dark-border/50">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                  <h3 className="text-lg font-medium text-white">配置说明</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">API端点：</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">http://localhost:9010</code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">API密钥：</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">API_KEY</code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-neon-cyan mr-3 min-w-24">配置文件：</span>
                    <code className="bg-dark-bg-primary px-3 py-1 rounded-lg text-neon-purple font-mono text-sm">.env.local</code>
                  </div>
                </div>
              </div>

              <Link 
                href="/docs/integration/setup" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300 group"
              >
                <RocketLaunchIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                查看详细集成指南
              </Link>
            </div>
          </motion.div>

          {/* 常见问题 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">常见问题</h2>
              
              <div className="space-y-8">
                {[
                  {
                    question: "Prompt Hub 与 MCP Prompt Server 是什么关系？",
                    answer: "Prompt Hub 是 MCP Prompt Server 的现代化前端界面，专为提高用户体验和提供更丰富的可视化功能而设计。MCP Prompt Server 负责提示词的存储、检索和性能追踪的核心功能，而 Prompt Hub 则提供了直观的用户界面来使用这些功能。"
                  },
                  {
                    question: "如何将 Prompt Hub 连接到远程 MCP Prompt Server？",
                    answer: "您可以通过修改 .env.local 文件中的 API_URL 变量来连接到远程服务器。确保同时设置正确的 API_KEY 以进行身份验证。"
                  },
                  {
                    question: "Prompt Hub 是否支持多用户协作？",
                    answer: "是的，Prompt Hub 支持用户注册和身份验证，允许多个用户协作管理提示词库。每个提示词都会记录创建者和编辑者信息，便于团队协作和版本管理。"
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2 + index * 0.2 }}
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
