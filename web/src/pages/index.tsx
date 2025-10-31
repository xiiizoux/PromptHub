import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedLink } from '@/components/ProtectedLink';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import {
  SparklesIcon,
  CodeBracketIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  CubeTransparentIcon,
  ArrowRightIcon,
  CommandLineIcon,
  CircleStackIcon,
  BoltIcon,
  CogIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';
import { PromptInfo } from '@/types';
import PromptCard from '@/components/prompts/PromptCard';

// 动态导入3D组件，避免SSR问题
const ThreeScene = dynamic(() => import('@/components/ui/ThreeScene'), { ssr: false });

interface HomeProps {
  featuredPrompts: PromptInfo[];
}

export default function Home({ featuredPrompts: initialPrompts }: HomeProps) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const [typedText, setTypedText] = useState('');
  const [featuredPrompts, setFeaturedPrompts] = useState<PromptInfo[]>(initialPrompts);
  const [loading, setLoading] = useState(initialPrompts.length === 0);
  const fullText = '释放AI的无限潜力';

  // 打字机效果
  useEffect(() => {
    if (inView) {
      let i = 0;
      const timer = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [inView]);

  // 客户端获取精选提示词（如果服务端没有获取到）
  useEffect(() => {
    if (featuredPrompts.length === 0) {
      const fetchPrompts = async () => {
        try {
          const { getPrompts } = await import('@/lib/api');
          const response = await getPrompts({ pageSize: 6, sortBy: 'popular' });
          if (response && response.data && Array.isArray(response.data)) {
            setFeaturedPrompts(response.data.slice(0, 6));
          }
        } catch (error) {
          console.error('Failed to fetch featured prompts:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPrompts();
    }
  }, [featuredPrompts.length]);

  const features = [
    {
      icon: CodeBracketIcon,
      title: '智能提示词管理',
      description: '使用版本控制和智能分类，让您的提示词保持最佳状态',
      color: 'from-neon-cyan to-neon-cyan-dark',
      glowColor: 'neon-cyan',
    },
    {
      icon: LightBulbIcon,
      title: '创新模板系统',
      description: '动态变量和模板让您的提示词适应各种场景',
      color: 'from-neon-pink to-neon-yellow',
      glowColor: 'neon-pink',
    },
    {
      icon: SparklesIcon,
      title: '智能分析优化',
      description: 'AI驱动的提示词分析与优化，自动提升您的提示词效果和质量',
      color: 'from-neon-purple to-neon-pink',
      glowColor: 'neon-purple',
    },
    {
      icon: CogIcon,
      title: '上下文工程',
      description: '深度上下文工程技术，构建智能化的多轮对话体验和复杂任务执行链',
      color: 'from-neon-green to-neon-cyan',
      glowColor: 'neon-green',
    },
    {
      icon: PuzzlePieceIcon,
      title: 'MCP协议集成',
      description: '基于Model Context Protocol，实现AI工具的无缝连接和智能协作',
      color: 'from-neon-yellow to-neon-orange',
      glowColor: 'neon-yellow',
    },
  ];

  const stats = [
    { label: '活跃用户', value: '10K+', icon: RocketLaunchIcon },
    { label: '提示词数量', value: '50K+', icon: CircleStackIcon },
    { label: '平均提升效率', value: '85%', icon: BoltIcon },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D背景 */}
        <div className="absolute inset-0 z-0">
          <ThreeScene />
        </div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg-primary/50 to-dark-bg-primary z-1" />
        
        {/* 内容 */}
        <motion.div 
          ref={ref}
          className="container-custom relative z-10 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full glass border border-neon-cyan/30 mb-6"
          >
            <SparklesIcon className="h-4 w-4 text-neon-cyan mr-2" />
            <span className="text-sm text-neon-cyan">AI提示词管理的未来已到来</span>
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="block gradient-text animate-text-shimmer bg-[length:200%_auto]">
              Prompt Hub
            </span>
            <span className="block text-lg md:text-2xl mt-2 text-gray-300 font-light">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>
          
          <motion.p
            className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            探索下一代AI提示词管理平台。创建、优化、分享您的提示词，
            让AI创作变得前所未有的简单和高效。
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/prompts" className="btn-primary group">
              <span>开始探索</span>
              <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <ProtectedLink href="/create" className="btn-secondary">
              <CommandLineIcon className="h-5 w-5 mr-2" />
              <span>创建提示词</span>
            </ProtectedLink>
          </motion.div>
          
          {/* 统计数据 */}
          <motion.div 
            className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="glass rounded-xl p-6 border border-neon-cyan/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Icon className="h-8 w-8 text-neon-cyan mx-auto mb-2" />
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
        
        {/* 滚动提示 */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="text-gray-500 text-sm">向下滚动</div>
          <svg className="w-6 h-6 mx-auto mt-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* 功能展示 */}
      <section className="py-20 relative">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-4">
              <span className="gradient-text">强大功能</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              我们为您提供最先进的工具集，让AI提示词管理变得简单而强大
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 3).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="card glass border border-neon-cyan/20 p-8 h-full hover:border-neon-cyan/40 transition-all duration-300 relative overflow-hidden">
                    {/* 背景渐变 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-2xl`} />
                    
                    {/* 动态光晕效果 */}
                    <div className={`absolute -top-10 -left-10 w-20 h-20 bg-${feature.glowColor} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-500`} />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6 relative`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className="h-8 w-8 text-dark-bg-primary relative z-10" />
                        {/* 图标光环 */}
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.color} opacity-50 blur-sm group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
                      </motion.div>
                      
                      <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-neon-cyan transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed mb-6">
                        {feature.description}
                      </p>
                      
                      <motion.div 
                        className="flex items-center text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        whileHover={{ x: 5 }}
                      >
                        <span className="text-sm font-medium">了解更多</span>
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* 第二行 - 新增功能 */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {features.slice(3).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="card glass border border-neon-cyan/20 p-8 h-full hover:border-neon-cyan/40 transition-all duration-300 relative overflow-hidden">
                    {/* 背景渐变 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-2xl`} />
                    
                    {/* 动态粒子效果 */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className={`absolute top-1/4 left-1/4 w-2 h-2 bg-${feature.glowColor} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-bounce`} />
                      <div className={`absolute bottom-1/4 right-1/4 w-1 h-1 bg-${feature.glowColor} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200`} />
                      <div className={`absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-${feature.glowColor} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-600 delay-100`} />
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div 
                        className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 relative`}
                        whileHover={{ scale: 1.05, rotate: -3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className="h-10 w-10 text-dark-bg-primary relative z-10" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-neon-cyan transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed mb-6">
                        {feature.description}
                      </p>
                      
                      <motion.div 
                        className="flex items-center text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        whileHover={{ x: 5 }}
                      >
                        <span className="text-sm font-medium">了解更多</span>
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 热门提示词 */}
      <section className="py-20 relative">
        <div className="container-custom">
          <motion.div 
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-5xl font-bold gradient-text">热门提示词</h2>
              <p className="text-gray-400 mt-2">发现社区最受欢迎的AI提示词</p>
            </div>
            <Link 
              href="/prompts" 
              className="group flex items-center text-neon-cyan hover:text-neon-cyan-dark transition-colors"
            >
              <span className="mr-2">查看全部</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
            </div>
          ) : featuredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPrompts.slice(0, 6).map((prompt, index) => (
                <motion.div
                  key={prompt.id || prompt.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PromptCard prompt={prompt} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-gray-400 text-lg mb-4">暂无提示词数据</div>
              <Link 
                href="/prompts" 
                className="text-neon-cyan hover:text-neon-cyan-dark transition-colors"
              >
                前往提示词广场
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full filter blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-pink/20 rounded-full filter blur-3xl animate-pulse-slow" />
        </div>
        
        <motion.div 
          className="container-custom relative z-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-neon-cyan/30 max-w-4xl mx-auto"
          >
            <CubeTransparentIcon className="h-16 w-16 text-neon-cyan mx-auto mb-6" />
            <h2 className="text-5xl font-bold mb-6">
              <span className="gradient-text">准备好革新您的AI工作流了吗？</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              加入数千名创作者的行列，使用Prompt Hub提升您的AI创作效率
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
                <RocketLaunchIcon className="h-6 w-6 mr-2" />
                立即开始免费使用
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}

// 获取服务端初始数据
export async function getStaticProps() {
  // 构建时如果没有后端服务，直接返回空数组，避免构建失败
  // 客户端会在运行时尝试获取数据
  try {
    // 检查是否在构建环境中
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return {
        props: {
          featuredPrompts: [],
        },
        revalidate: 600,
      };
    }

    // 使用 fetch API 从后端获取提示词数据
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9011';
    
    // 添加超时和错误处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    try {
      const response = await fetch(`${baseUrl}/api/prompts?pageSize=6&sortBy=popular`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Failed to fetch featured prompts:', response.statusText);
        return {
          props: {
            featuredPrompts: [],
          },
          revalidate: 600,
        };
      }

      const data = await response.json();
      const featuredPrompts = data?.data?.data || [];

      return {
        props: {
          featuredPrompts: Array.isArray(featuredPrompts) ? featuredPrompts.slice(0, 6) : [],
        },
        revalidate: 600, // 10分钟重新生成
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // 忽略网络错误，构建时可能没有后端服务
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNREFUSED') {
        console.warn('Backend not available during build, using empty array');
      } else {
        console.error('Error fetching featured prompts:', fetchError);
      }
      return {
        props: {
          featuredPrompts: [],
        },
        revalidate: 600,
      };
    }
  } catch (error) {
    // 确保任何错误都不会导致构建失败
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        featuredPrompts: [],
      },
      revalidate: 600,
    };
  }
}
