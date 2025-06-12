import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, DocumentTextIcon, ClockIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { getPromptDetails, getPromptPerformance, getPerformanceReport } from '@/lib/api';
import { PromptDetails, PromptPerformance } from '@/types';

interface PromptAnalyticsPageProps {
  prompt: PromptDetails;
  performance: PromptPerformance;
  report: any;
}

export default function PromptAnalyticsPage({ prompt, performance, report }: PromptAnalyticsPageProps) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week', 'day'

  // 格式化百分比
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // 格式化数字
  const formatNumber = (value: number) => {
    return value.toLocaleString('zh-CN');
  };

  // 格式化时间（毫秒转为秒）
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/analytics" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回性能分析
          </Link>
        </div>
        
        {/* 提示词基本信息 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{prompt.name} - 性能分析</h1>
                <p className="mt-2 text-gray-600">{prompt.description}</p>
              </div>
              <Link 
                href={`/prompts/${prompt.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                查看提示词
              </Link>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                创建于 {formatDate(prompt.created_at)}
              </div>
              {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  更新于 {formatDate(prompt.updated_at)}
                </div>
              )}
              {prompt.author && (
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {prompt.author}
                </div>
              )}
              {prompt.version && (
                <div className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  v{prompt.version}
                </div>
              )}
            </div>
          </div>
          
          {/* 时间范围选择器 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">选择时间范围：</div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTimeRange('day')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === 'day'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  今日
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('week')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === 'week'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  本周
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === 'month'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  本月
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('all')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === 'all'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  全部
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 性能指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 使用次数 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">使用次数</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatNumber(performance.total_usage)}
                </div>
              </div>
            </div>
          </div>
          
          {/* 成功率 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">成功率</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatPercent(performance.success_rate)}
                </div>
              </div>
            </div>
          </div>
          
          {/* 平均评分 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">平均评分</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {performance.average_rating ? performance.average_rating.toFixed(1) : '暂无'}
                </div>
              </div>
            </div>
          </div>
          
          {/* 平均响应时间 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500">平均响应时间</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatTime(performance.average_latency)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Token统计 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Token统计</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">平均Token消耗</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">输入Token</span>
                    <span className="text-sm font-medium text-gray-900">{formatNumber(performance.token_stats.input_avg)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (performance.token_stats.input_avg / (performance.token_stats.input_avg + performance.token_stats.output_avg)) * 100)}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-4 mb-2">
                    <span className="text-sm text-gray-600">输出Token</span>
                    <span className="text-sm font-medium text-gray-900">{formatNumber(performance.token_stats.output_avg)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (performance.token_stats.output_avg / (performance.token_stats.input_avg + performance.token_stats.output_avg)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">总Token消耗</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">输入Token</span>
                    <span className="text-sm font-medium text-gray-900">{formatNumber(performance.token_stats.total_input)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (performance.token_stats.total_input / (performance.token_stats.total_input + performance.token_stats.total_output)) * 100)}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-4 mb-2">
                    <span className="text-sm text-gray-600">输出Token</span>
                    <span className="text-sm font-medium text-gray-900">{formatNumber(performance.token_stats.total_output)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (performance.token_stats.total_output / (performance.token_stats.total_input + performance.token_stats.total_output)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 版本分布 */}
        {performance.version_distribution && Object.keys(performance.version_distribution).length > 0 && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">版本分布</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(performance.version_distribution).map(([version, count], index) => (
                  <div key={version}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">v{version}</span>
                      <span className="text-sm text-gray-600">
                        {formatNumber(count as number)} ({formatPercent((count as number) / performance.total_usage)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          index % 3 === 0 ? 'bg-primary-600' : 
                          index % 3 === 1 ? 'bg-secondary-600' : 'bg-green-600'
                        }`} 
                        style={{ width: `${((count as number) / performance.total_usage) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 反馈分析 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">反馈分析</h2>
          </div>
          <div className="p-6">
            {performance.feedback_count > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">评分分布</h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      // 这里使用模拟数据，实际应用中应该从API获取
                      const count = Math.floor(Math.random() * performance.feedback_count);
                      const percentage = (count / performance.feedback_count) * 100;
                      
                      return (
                        <div key={rating} className="flex items-center">
                          <div className="min-w-[30px] text-sm font-medium text-gray-700">{rating}星</div>
                          <div className="w-full mx-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  rating >= 4 ? 'bg-green-600' : 
                                  rating === 3 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="min-w-[80px] text-right text-sm text-gray-600">
                            {count} ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">反馈统计</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">总反馈数</span>
                      <span className="text-sm font-medium text-gray-900">{formatNumber(performance.feedback_count)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">反馈率</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercent(performance.feedback_count / performance.total_usage)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">平均评分</span>
                      <span className="text-sm font-medium text-gray-900">
                        {performance.average_rating ? performance.average_rating.toFixed(1) : '暂无'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M20 4v7a4 4 0 01-4 4H8a4 4 0 01-4-4V4m0 0h16M4 4l3.465 1.683M20 4l-3.465 1.683" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无反馈</h3>
                <p className="mt-1 text-sm text-gray-500">该提示词尚未收到用户反馈</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 优化建议 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">优化建议</h2>
          </div>
          <div className="p-6">
            {report && report.suggestions ? (
              <div className="space-y-4">
                {report.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-gray-700">
                      基于目前的使用数据，尚无针对性的优化建议。请继续收集更多的使用数据和用户反馈。
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                                  href={`/prompts/${prompt.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                编辑提示词
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { promptId } = context.params as { promptId: string };
  
  try {
    // 并行获取提示词详情、性能数据和性能报告
    const [promptDetails, performanceData, reportData] = await Promise.all([
      getPromptDetails(promptId),
      getPromptPerformance(promptId),
      getPerformanceReport(promptId)
    ]);
    
    return {
      props: {
        prompt: promptDetails,
        performance: performanceData,
        report: reportData
      },
    };
  } catch (error) {
    console.error(`获取提示词 ${promptId} 分析数据失败:`, error);
    
    return {
      notFound: true,
    };
  }
};
