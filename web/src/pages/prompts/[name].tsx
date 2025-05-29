import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ClockIcon, 
  UserIcon, 
  TagIcon, 
  DocumentTextIcon, 
  PencilSquareIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getPromptDetails, trackPromptUsage } from '@/lib/api';
import { PromptDetails, PromptExample, PromptVersion } from '@/types';

interface PromptDetailsPageProps {
  prompt: PromptDetails;
}

export default function PromptDetailsPage({ prompt }: PromptDetailsPageProps) {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState<string>(prompt.version || '1.0');
  const [copied, setCopied] = useState(false);
  const [usageTracked, setUsageTracked] = useState(false);

  // 获取当前选中版本的内容
  const getVersionContent = () => {
    if (!prompt.versions || prompt.versions.length === 0) {
      return prompt.content;
    }

    const version = prompt.versions.find(v => v.version === selectedVersion);
    return version ? version.content : prompt.content;
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // 复制提示词内容到剪贴板
  const copyToClipboard = async () => {
    const content = getVersionContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // 追踪使用情况
      if (!usageTracked) {
        try {
          await trackPromptUsage({
            prompt_id: prompt.name,
            version: selectedVersion,
            input_tokens: 0, // 前端无法准确计算token数量
            output_tokens: 0,
            latency: 0,
            success: true
          });
          setUsageTracked(true);
        } catch (error) {
          console.error('追踪使用情况失败:', error);
        }
      }
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 渲染评分星星
  const renderStars = (rating?: number) => {
    const stars = [];
    const ratingValue = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon 
          key={i} 
          className={`h-5 w-5 ${i <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  // 渲染标签
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map(tag => (
          <span 
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // 渲染版本选择器
  const renderVersionSelector = () => {
    if (!prompt.versions || prompt.versions.length <= 1) return null;
    
    return (
      <div className="mb-4">
        <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
          选择版本
        </label>
        <select
          id="version"
          name="version"
          className="input"
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
        >
          {prompt.versions.map((version) => (
            <option key={version.version} value={version.version}>
              v{version.version} {version.notes ? `- ${version.notes}` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // 渲染当前版本信息
  const renderVersionInfo = () => {
    if (!prompt.versions || prompt.versions.length === 0) return null;
    
    const currentVersion = prompt.versions.find(v => v.version === selectedVersion);
    if (!currentVersion) return null;
    
    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-900">版本信息</h4>
        <div className="mt-2 text-sm text-gray-600">
          <p>版本: v{currentVersion.version}</p>
          {currentVersion.created_at && (
            <p>发布时间: {formatDate(currentVersion.created_at)}</p>
          )}
          {currentVersion.author && (
            <p>作者: {currentVersion.author}</p>
          )}
          {currentVersion.notes && (
            <p>版本说明: {currentVersion.notes}</p>
          )}
        </div>
      </div>
    );
  };

  // 渲染示例
  const renderExamples = (examples?: PromptExample[]) => {
    if (!examples || examples.length === 0) return null;
    
    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">使用示例</h3>
        <div className="mt-4 space-y-4">
          {examples.map((example, index) => (
            <div key={index} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">
                  {example.description || `示例 ${index + 1}`}
                </h4>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">输入</h5>
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono overflow-auto max-h-40">
                    <pre>{JSON.stringify(example.input, null, 2)}</pre>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">输出</h5>
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono overflow-auto max-h-60">
                    <pre>{example.output}</pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/prompts" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回提示词列表
          </Link>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* 提示词头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">{prompt.name}</h1>
                  {prompt.category && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                      {prompt.category}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-600">{prompt.description}</p>
                {renderTags(prompt.tags)}
              </div>
              
              <div className="flex items-center space-x-3">
                <Link 
                  href={`/prompts/${prompt.name}/edit`}
                  className="inline-flex items-center p-2 text-gray-500 bg-white rounded-md hover:bg-gray-50"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  <span className="sr-only">编辑</span>
                </Link>
                <button 
                  type="button"
                  className="inline-flex items-center p-2 text-gray-500 bg-white rounded-md hover:bg-gray-50 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span className="sr-only">删除</span>
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                创建于 {formatDate(prompt.created_at)}
              </div>
              {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                <div className="flex items-center">
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  更新于 {formatDate(prompt.updated_at)}
                </div>
              )}
              {prompt.author && (
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {prompt.author}
                </div>
              )}
              {prompt.rating !== undefined && (
                <div className="flex items-center">
                  {renderStars(prompt.rating)}
                </div>
              )}
            </div>
          </div>
          
          {/* 提示词内容 */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">提示词内容</h2>
              <button
                type="button"
                onClick={copyToClipboard}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md ${
                  copied
                    ? 'bg-green-100 text-green-800'
                    : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                }`}
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                {copied ? '已复制！' : '复制提示词'}
              </button>
            </div>
            
            {renderVersionSelector()}
            
            <div className="prompt-content">
              {getVersionContent()}
            </div>
            
            {renderVersionInfo()}
            
            {/* 兼容模型列表 */}
            {prompt.compatible_models && prompt.compatible_models.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">兼容模型</h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.compatible_models.map(model => (
                    <span 
                      key={model}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 变量说明 */}
            {prompt.input_variables && prompt.input_variables.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">输入变量</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {prompt.input_variables.map(variable => (
                    <li key={variable}>{variable}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* 示例部分 */}
        {renderExamples(prompt.examples)}
        
        {/* 性能分析链接 */}
        <div className="mt-8 text-center">
          <Link 
            href={`/analytics/${prompt.name}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            查看性能分析
          </Link>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { name } = context.params as { name: string };
  
  try {
    const promptDetails = await getPromptDetails(name);
    
    return {
      props: {
        prompt: promptDetails,
      },
    };
  } catch (error) {
    console.error(`获取提示词 ${name} 详情失败:`, error);
    
    return {
      notFound: true,
    };
  }
};
