import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  BugAntIcon,
  LightBulbIcon,
  HeartIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  CommandLineIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  if (submitted) {
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div 
                className="flex justify-center mb-8"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple p-1">
                    <div className="h-full w-full rounded-full bg-dark-bg-primary flex items-center justify-center">
                      <CheckCircleIcon className="h-10 w-10 text-neon-green" />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple animate-pulse blur-md opacity-50"></div>
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                感谢您的反馈！
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-300 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                我们已经收到您的消息，会尽快回复您。通常我们会在24小时内回复。
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link href="/" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300 group">
                  <HeartIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  返回首页
                </Link>
                <button 
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      subject: '',
                      message: '',
                      type: 'general'
                    });
                  }}
                  className="inline-flex items-center px-6 py-3 bg-dark-bg-secondary border border-neon-purple text-neon-purple rounded-xl font-medium hover:bg-neon-purple/10 transition-all duration-300 group"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  发送另一条消息
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-neon-cyan/10 to-neon-pink/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16">
        <div className="container-custom">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              联系我们
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              有任何问题、建议或反馈？我们很乐意听到您的声音。
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Options */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-8">联系方式</h2>
                
                <div className="space-y-8">
                  {[
                    {
                      icon: EnvelopeIcon,
                      title: "邮箱",
                      description: "我们通常在24小时内回复",
                      link: "contact@prompthub.dev",
                      href: "mailto:contact@prompthub.dev",
                      gradient: "from-neon-cyan to-neon-purple"
                    },
                    {
                      icon: ChatBubbleLeftRightIcon,
                      title: "GitHub讨论",
                      description: "社区讨论和问答",
                      link: "GitHub Discussions",
                      href: "https://github.com/xiiizoux/PromptHub/discussions",
                      gradient: "from-neon-purple to-neon-pink"
                    },
                    {
                      icon: BugAntIcon,
                      title: "Bug报告",
                      description: "报告Bug或请求新功能",
                      link: "GitHub Issues",
                      href: "https://github.com/xiiizoux/PromptHub/issues",
                      gradient: "from-neon-pink to-neon-cyan"
                    }
                  ].map((contact, index) => (
                    <motion.div
                      key={contact.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
                      className="flex items-start group"
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r ${contact.gradient} p-0.5`}>
                        <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                          <contact.icon className="h-6 w-6 text-neon-cyan group-hover:text-neon-purple transition-colors duration-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors duration-300">
                          {contact.title}
                        </h3>
                        <p className="text-gray-400 mb-2">
                          <a 
                            href={contact.href}
                            target={contact.href.startsWith('http') ? '_blank' : undefined}
                            rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="text-neon-purple hover:text-neon-cyan transition-colors duration-300"
                          >
                            {contact.link}
                          </a>
                        </p>
                        <p className="text-sm text-gray-500">
                          {contact.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Links */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="mt-8 p-6 bg-dark-bg-secondary/50 rounded-xl border border-dark-border/50"
                >
                  <div className="flex items-center mb-4">
                    <DocumentTextIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    <h3 className="text-lg font-semibold text-white">常见问题</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { href: "/docs", text: "查看文档" },
                      { href: "/docs/api-integration", text: "API参考" },
                      { href: "/docs/getting-started", text: "快速开始" }
                    ].map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 1.6 + index * 0.1 }}
                      >
                        <Link href={link.href} className="flex items-center text-neon-purple hover:text-neon-cyan transition-colors duration-300 group">
                          <QuestionMarkCircleIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                          <span className="group-hover:translate-x-1 transition-transform duration-300">{link.text}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl p-8">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CommandLineIcon className="h-6 w-6 text-neon-purple" />
                    </div>
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-white">发送消息</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                    >
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        姓名 *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
                        placeholder="您的姓名"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                    >
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        邮箱 *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
                        placeholder="your@email.com"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  >
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                      消息类型
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-xl text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
                    >
                      <option value="general">一般咨询</option>
                      <option value="support">技术支持</option>
                      <option value="feedback">功能反馈</option>
                      <option value="bug">Bug报告</option>
                      <option value="partnership">合作伙伴</option>
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                  >
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                      主题 *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300"
                      placeholder="简要描述您的问题或建议"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      详细信息 *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-bg-secondary border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all duration-300 resize-none"
                      placeholder="请详细描述您的问题、建议或反馈..."
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                  >
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          发送中...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                          发送消息
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                  className="mt-6 p-4 bg-dark-bg-secondary/30 rounded-xl border border-dark-border/30"
                >
                  <div className="flex items-center">
                    <LightBulbIcon className="h-5 w-5 text-neon-cyan mr-2" />
                    <p className="text-sm text-gray-400">
                      提示：为了更快获得回复，请在消息中提供尽可能详细的信息。
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
