import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CodeBracketIcon,
  BeakerIcon,
  CubeIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // GitHub图标组件
  const GitHubIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );

  const footerLinks = {
    产品: [
      { name: '浏览提示词', href: '/prompts', icon: SparklesIcon },
      { name: '创建提示词', href: '/prompts/create', icon: CodeBracketIcon },
      { name: '性能分析', href: '/analytics', icon: ChartBarIcon },
    ],
    资源: [
      { name: '文档', href: '/docs', icon: DocumentTextIcon },
      { name: 'API参考', href: '/docs/api', icon: CubeIcon },
      { name: '提示词模板', href: '/docs/templates', icon: BeakerIcon },
      { name: '应用示例', href: '/docs/examples-library', icon: AcademicCapIcon },
    ],
    关于: [
      { name: '关于我们', href: '/about', icon: InformationCircleIcon },
      { name: 'GitHub', href: 'https://github.com/xiiizoux/PromptHub', icon: GitHubIcon },
      { name: '联系我们', href: '/contact', icon: EnvelopeIcon },
    ],
  };

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/xiiizoux/PromptHub' },
    { name: 'Twitter', href: '#' },
    { name: 'Discord', href: '#' },
  ];

  return (
    <footer className="relative mt-20 border-t border-neon-cyan/10">
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
      
      <div className="container-custom mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo和描述 */}
          <motion.div 
            className="col-span-1 md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center space-x-3 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan to-neon-pink rounded-full blur-md animate-pulse-slow"></div>
                <div className="relative rounded-full overflow-hidden w-full h-full glass border border-neon-cyan/30">
                  <img 
                    src="/images/logo.png" 
                    alt="PromptHub Logo" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold gradient-text">Prompt</span>
                <span className="text-2xl font-light text-neon-cyan ml-1">Hub</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              探索AI的无限可能。我们为您提供最先进的提示词管理平台，
              让AI创作变得更加简单、高效和有趣。
            </p>
            
            {/* 社交链接 */}
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {link.name === 'GitHub' && (
                    <GitHubIcon className="w-5 h-5" />
                  )}
                  {link.name === 'Twitter' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  )}
                  {link.name === 'Discord' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* 链接分组 */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h3 className="text-sm font-semibold text-neon-cyan uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <motion.li 
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link 
                        href={link.href} 
                        className="group flex items-center space-x-2 text-gray-400 hover:text-neon-cyan transition-colors"
                      >
                        <Icon className="h-4 w-4 group-hover:animate-pulse" />
                        <span className="text-sm">{link.name}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>
        
        {/* 底部信息 */}
        <motion.div 
          className="mt-12 pt-8 border-t border-neon-cyan/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-sm text-gray-500">
                © {currentYear} Prompt Hub. 保留所有权利。
              </p>
              <div className="flex space-x-6">
                <Link href="/terms" className="text-sm text-gray-500 hover:text-neon-cyan transition-colors">
                  服务条款
                </Link>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-neon-cyan transition-colors">
                  隐私政策
                </Link>
              </div>
            </div>
            
            {/* 主题切换提示 */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-gray-500">系统在线</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* 底部装饰效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent opacity-50" />
    </footer>
  );
};

export default Footer;
