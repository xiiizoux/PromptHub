import React, { ReactNode } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import Footer from './Footer';
import Navigation from '@/components/Navigation';
import { useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// 动态导入粒子背景组件，避免SSR问题
const ParticlesBackground = dynamic(
  () => import('@/components/ui/ParticlesBackground'),
  { ssr: false },
);

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Prompt Hub - AI提示词管理平台',
  description = '一个用于管理和分享AI提示词的现代化平台，帮助您充分发挥AI模型的潜力。',
}) => {
  // 启用全局键盘快捷键
  useGlobalKeyboardShortcuts();
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
        {/* 粒子背景 */}
        <ParticlesBackground />
        
        {/* 动态网格背景 */}
        <div className="fixed inset-0 grid-background opacity-20" />
        
        {/* 主内容区域 */}
        <div className="relative z-10">
          <Navbar />
          
          {/* 添加顶部内边距以避免被固定导航栏遮挡 */}
          <main className="pt-20 min-h-[calc(100vh-5rem)]">
            {children}
          </main>
          
          <Footer />
        </div>
        
        {/* 移动端底部导航 */}
        <Navigation />
      </div>
    </>
  );
};

export default Layout;
