import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  UserGroupIcon, 
  CodeBracketIcon,
  LightBulbIcon,
  HeartIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CubeIcon,
  BeakerIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

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
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-20 text-center"
          >
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-1">
                  <div className="h-full w-full rounded-full bg-dark-bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-4xl bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">P</span>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink animate-spin-slow blur-md opacity-50"></div>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              关于 Prompt Hub
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              一个现代化的AI提示词管理平台，致力于帮助开发者和AI爱好者更好地管理、分享和优化AI提示词。
            </motion.p>
          </motion.div>

          {/* Mission Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-6">我们的使命</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                让AI提示词的创建、管理和分享变得简单高效，推动AI技术的普及和应用。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: SparklesIcon,
                  title: '创新驱动',
                  description: '持续探索AI提示词的最佳实践，为用户提供最前沿的工具和功能。',
                  gradient: 'from-neon-cyan to-neon-purple',
                },
                {
                  icon: UserGroupIcon,
                  title: '社区协作',
                  description: '构建开放的社区环境，让用户能够分享经验、互相学习、共同成长。',
                  gradient: 'from-neon-purple to-neon-pink',
                },
                {
                  icon: RocketLaunchIcon,
                  title: '效率提升',
                  description: '通过智能化的管理工具和优化建议，帮助用户提高AI应用的效率和质量。',
                  gradient: 'from-neon-pink to-neon-cyan',
                },
              ].map((mission, index) => (
                <motion.div
                  key={mission.title}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8, delay: 1.0 + index * 0.2 }}
                  className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl p-8 text-center hover:border-neon-cyan/50 transition-all duration-300 group"
                >
                  <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${mission.gradient} p-0.5`}>
                      <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                        <mission.icon className="h-8 w-8 text-neon-cyan group-hover:text-neon-purple transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-neon-cyan transition-colors duration-300">
                    {mission.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {mission.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-6">核心功能</h2>
              <p className="text-xl text-gray-300">
                Prompt Hub 提供全面的AI提示词管理解决方案
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: CodeBracketIcon,
                  title: '提示词管理',
                  description: '创建、编辑、版本控制和组织您的AI提示词库',
                },
                {
                  icon: LightBulbIcon,
                  title: '智能优化',
                  description: '基于使用数据和反馈的智能提示词优化建议',
                },
                {
                  icon: GlobeAltIcon,
                  title: 'MCP集成',
                  description: '支持Model Context Protocol，与各种AI工具无缝集成',
                },
                {
                  icon: ShieldCheckIcon,
                  title: '安全可靠',
                  description: '企业级安全保障，支持权限管理和数据保护',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={featureVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  className="bg-dark-card/50 backdrop-blur-md rounded-xl border border-dark-border p-6 text-center hover:border-neon-purple/50 transition-all duration-300 group"
                >
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-12 w-12 text-neon-purple group-hover:text-neon-cyan transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-neon-purple transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent mb-6">技术架构</h2>
              <p className="text-xl text-gray-300">
                基于现代化技术栈构建的高性能平台
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 2.2 }}
                className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border p-8 hover:border-neon-cyan/50 transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CubeIcon className="h-6 w-6 text-neon-cyan" />
                    </div>
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-white">前端技术</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Next.js - React框架', color: 'bg-blue-500' },
                    { name: 'TypeScript - 类型安全', color: 'bg-blue-400' },
                    { name: 'Tailwind CSS - 样式框架', color: 'bg-cyan-500' },
                    { name: 'React Hook Form - 表单管理', color: 'bg-purple-500' },
                  ].map((tech, index) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 2.4 + index * 0.1 }}
                      className="flex items-center"
                    >
                      <div className={`h-3 w-3 rounded-full ${tech.color} mr-3 shadow-neon-sm`}></div>
                      <span className="text-gray-300">{tech.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 2.4 }}
                className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border p-8 hover:border-neon-purple/50 transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink p-0.5">
                    <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                      <CommandLineIcon className="h-6 w-6 text-neon-purple" />
                    </div>
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-white">后端技术</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Node.js - 运行环境', color: 'bg-green-500' },
                    { name: 'Express.js - Web框架', color: 'bg-red-500' },
                    { name: 'Supabase - 数据库和认证', color: 'bg-green-600' },
                    { name: 'MCP Protocol - AI工具集成', color: 'bg-orange-500' },
                  ].map((tech, index) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 2.6 + index * 0.1 }}
                      className="flex items-center"
                    >
                      <div className={`h-3 w-3 rounded-full ${tech.color} mr-3 shadow-neon-sm`}></div>
                      <span className="text-gray-300">{tech.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Open Source */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.8 }}
            className="bg-dark-card/50 backdrop-blur-md rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-neon-pink to-neon-cyan p-0.5">
                  <div className="w-full h-full bg-dark-bg-primary rounded-xl flex items-center justify-center">
                    <HeartIcon className="h-8 w-8 text-neon-pink" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent mb-6">
                开源项目
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Prompt Hub 是一个开源项目，我们相信开放和协作的力量。
                加入我们的社区，一起构建更好的AI提示词管理平台。
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://github.com/xiiizoux/PromptHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white rounded-xl font-medium shadow-neon hover:shadow-neon-lg transition-all duration-300 group"
                >
                  <BeakerIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  查看源代码
                </a>
                
                <Link
                  href="/prompts"
                  className="inline-flex items-center px-6 py-3 bg-dark-bg-secondary border border-neon-purple text-neon-purple rounded-xl font-medium hover:bg-neon-purple/10 transition-all duration-300 group"
                >
                  <CodeBracketIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  开始使用
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 