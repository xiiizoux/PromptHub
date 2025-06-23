import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  HomeIcon,
  PlusCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  KeyIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

const navigation = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '浏览提示词', href: '/prompts', icon: RectangleStackIcon },
  { name: '创建提示词', href: '/create', icon: PlusCircleIcon },
  { name: 'AI优化器', href: '/optimizer', icon: SparklesIcon },
  { name: '性能分析', href: '/analytics', icon: ChartBarIcon },
  { name: '文档', href: '/docs', icon: DocumentTextIcon },
];

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 判断当前路径是否活跃
  const isActive = (path: string) => {
    if (!mounted || typeof window === 'undefined') {
      return false;
    }
    const currentPath = window.location.pathname;
    if (path === '/') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  // 创建Ref来跟踪菜单元素
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const userButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // 点击页面其他位置关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuOpen &&
        userMenuRef.current && 
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-2xl backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <nav className="container-custom mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <motion.div 
          className="flex lg:flex-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
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
              <span className="text-3xl font-bold gradient-text animate-text-shimmer bg-[length:200%_auto]">
                Prompt
              </span>
              <span className="text-3xl font-light text-neon-cyan ml-1 neon-glow">
                Hub
              </span>
            </div>
          </Link>
        </motion.div>
        
        {/* 移动端菜单按钮 */}
        <div className="flex lg:hidden">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            className="glass p-2 rounded-lg text-neon-cyan"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">打开主菜单</span>
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: 90 }}
                >
                  <XMarkIcon className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: -90 }}
                >
                  <Bars3Icon className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
        
        {/* 桌面端菜单 */}
        <div className="hidden lg:flex lg:gap-x-1">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={clsx(
                    'group relative px-4 py-2 flex items-center space-x-2 rounded-lg transition-all duration-300',
                    isActive(item.href)
                      ? 'text-neon-cyan'
                      : 'text-gray-400 hover:text-neon-cyan',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">{item.name}</span>
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/10 to-neon-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        {/* 用户菜单 */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center space-x-4">
          {user ? (
            <div className="relative">
              <motion.button
                ref={userButtonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg glass transition-all duration-300',
                  'text-gray-300 hover:text-neon-cyan hover:border-neon-cyan/30',
                )}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink p-0.5">
                  <div className="w-full h-full rounded-full bg-dark-bg-primary flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-neon-cyan" />
                  </div>
                </div>
                <span className="text-sm font-medium">{user.username || user.email?.split('@')[0] || 'User'}</span>
                <motion.svg
                  animate={{ rotate: userMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    ref={userMenuRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 glass rounded-xl border border-neon-cyan/20 overflow-hidden"
                  >
                    <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                      <UserIcon className="h-5 w-5" />
                      <span>个人资料</span>
                    </Link>
                    <div className="border-t border-neon-cyan/10 my-1" />
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                        if (typeof window !== 'undefined') {
                          window.location.href = '/';
                        }
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-neon-red hover:bg-neon-red/10 transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>退出登录</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  href="/auth/register" 
                  className="btn-secondary text-sm"
                >
                  注册
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link 
                  href="/auth/login" 
                  className="btn-primary text-sm"
                >
                  登录
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </nav>
      
      {/* 移动端菜单 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass border-t border-neon-cyan/10"
          >
            <div className="container-custom py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                        : 'text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/5',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="border-t border-neon-cyan/10 pt-4 mt-4">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>个人资料</span>
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                        if (typeof window !== 'undefined') {
                          window.location.href = '/';
                        }
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-neon-red hover:bg-neon-red/10 transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>退出登录</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/register"
                      className="block btn-secondary text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      注册
                    </Link>
                    <Link
                      href="/auth/login"
                      className="block btn-primary text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      登录
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
