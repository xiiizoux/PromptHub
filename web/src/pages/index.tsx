import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, DocumentDuplicateIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { getPrompts } from '@/lib/api';
import { PromptInfo } from '@/types';
import PromptCard from '@/components/prompts/PromptCard';

interface HomeProps {
  featuredPrompts: PromptInfo[];
}

export default function Home({ featuredPrompts }: HomeProps) {
  return (
    <div className="bg-white">
      {/* 英雄区域 */}
      <div className="gradient-bg">
        <div className="container-tight pt-16 pb-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">提示词管理与分享平台</span>
            <span className="block mt-2">释放AI的全部潜力</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-lg text-purple-100">
            发现、创建和分享强大的AI提示词，提升您的人工智能体验，提高生产力。
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/prompts" className="btn-primary">
              浏览提示词
            </Link>
            <Link href="/create" className="btn-outline ml-3 bg-white">
              创建提示词
            </Link>
          </div>
        </div>
      </div>

      {/* 特色提示词 */}
      <div className="py-16 bg-white">
        <div className="container-tight">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">热门提示词</h2>
            <Link href="/prompts" className="text-primary-600 hover:text-primary-800 flex items-center text-sm font-medium">
              查看全部
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="card-grid">
            {featuredPrompts.map((prompt) => (
              <PromptCard key={prompt.name} prompt={prompt} />
            ))}
          </div>
        </div>
      </div>

      {/* 核心功能 */}
      <div className="py-16 bg-gray-50">
        <div className="container-tight">
          <div className="text-center mb-12">
            <h2 className="section-title">强大的功能，让提示词管理更简单</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Prompt Hub提供了完整的工具集，帮助您高效地管理、分享和优化AI提示词。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 功能1 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center mb-4">
                <SparklesIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">智能提示词管理</h3>
              <p className="mt-3 text-gray-600">
                轻松创建、组织和版本控制您的提示词，使它们始终保持最佳状态。
              </p>
            </div>

            {/* 功能2 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center mb-4">
                <DocumentDuplicateIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">模板与变量</h3>
              <p className="mt-3 text-gray-600">
                使用变量和模板创建灵活的提示词，轻松适应不同场景和需求。
              </p>
            </div>

            {/* 功能3 */}
            <div className="card p-6">
              <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">性能分析</h3>
              <p className="mt-3 text-gray-600">
                跟踪和分析提示词性能，获取数据驱动的优化建议，提高效果。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA区域 */}
      <div className="py-16 bg-white">
        <div className="container-tight text-center">
          <h2 className="section-title">准备好开始了吗？</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            加入Prompt Hub，探索无限可能的AI提示词世界，提升您的工作效率和创造力。
          </p>
          <div className="mt-8">
            <Link href="/prompts" className="btn-primary">
              立即开始
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// 获取服务端初始数据
export async function getStaticProps() {
  // 在构建时返回空数据，运行时通过客户端获取
    return {
      props: {
      featuredPrompts: [],
      },
      // 每10分钟重新生成页面
      revalidate: 600,
    };
}
