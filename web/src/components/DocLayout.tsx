import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface DocLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  backLink?: string;
  backText?: string;
  breadcrumbs?: Array<{ name: string; href: string }>;
}

const DocLayout: React.FC<DocLayoutProps> = ({
  title,
  description,
  children,
  backLink = "/docs",
  backText = "返回文档首页",
  breadcrumbs
}) => {
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-5 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/10 to-neon-purple/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-neon-yellow/5 to-neon-green/5 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 py-12">
        <div className="container-custom">
          {/* 导航面包屑 */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* 返回按钮 */}
            <div className="mb-4">
              <Link 
                href={backLink} 
                className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-neon-purple transition-colors duration-300 group"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                {backText}
              </Link>
            </div>

            {/* 面包屑导航 */}
            {breadcrumbs && (
              <nav className="flex items-center space-x-2 text-sm text-dark-text-tertiary mb-4">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <Link 
                      href={crumb.href}
                      className="hover:text-neon-cyan transition-colors duration-300"
                    >
                      {crumb.name}
                    </Link>
                    {index < breadcrumbs.length - 1 && (
                      <span className="text-dark-border">/</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </motion.div>

          {/* 页面标题 */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-4">
              {title}
            </h1>
            <p className="text-xl text-dark-text-secondary max-w-4xl leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* 内容区域 */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DocLayout; 