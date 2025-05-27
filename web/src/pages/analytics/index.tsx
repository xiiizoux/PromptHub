import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPrompts, getPromptPerformance } from '@/lib/api';
import { PromptInfo, PromptPerformance } from '@/types';
import { ChartBarIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, PromptPerformance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取提示词和性能数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取提示词列表
        const response = await getPrompts({ sortBy: 'popular', pageSize: 20 });
        const promptList = response.data || [];
        setPrompts(promptList);
        
        // 获取每个提示词的性能数据
        const performancePromises = promptList.map(prompt => 
          getPromptPerformance(prompt.name)
            .then(data => ({ id: prompt.name, data }))
            .catch(() => ({ id: prompt.name, data: null }))
        );
        
        const performanceResults = await Promise.all(performancePromises);
        const performanceMap = performanceResults.reduce((acc, { id, data }) => {
          if (data) {
            acc[id] = data;
          }
          return acc;
        }, {} as Record<string, PromptPerformance>);
        
        setPerformanceData(performanceMap);
        setError(null);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('无法加载分析数据，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 计算百分比
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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提示词性能分析</h1>
          <p className="mt-2 text-gray-600">
            查看和分析提示词的使用情况和效果，获取数据驱动的优化建议
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">发生错误</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">正在加载分析数据...</p>
          </div>
        ) : (
          <>
            {/* 总体统计 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">总体统计</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="text-primary-600 text-lg font-semibold">
                    {Object.values(performanceData).reduce((sum, data) => sum + (data.total_usage || 0), 0).toLocaleString('zh-CN')}
                  </div>
                  <div className="text-sm text-gray-600">总使用次数</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 text-lg font-semibold">
                    {formatPercent(Object.values(performanceData).reduce((sum, data) => sum + (data.success_rate || 0), 0) / (Object.keys(performanceData).length || 1))}
                  </div>
                  <div className="text-sm text-gray-600">平均成功率</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 text-lg font-semibold">
                    {formatTime(Object.values(performanceData).reduce((sum, data) => sum + (data.average_latency || 0), 0) / (Object.keys(performanceData).length || 1))}
                  </div>
                  <div className="text-sm text-gray-600">平均响应时间</div>
                </div>
              </div>
            </div>

            {/* 提示词性能表格 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">提示词性能排名</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        提示词
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        使用次数
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        成功率
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均评分
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        响应时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        查看详情
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prompts.map((prompt) => {
                      const performance = performanceData[prompt.name];
                      return (
                        <tr key={prompt.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {prompt.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {performance ? formatNumber(performance.total_usage) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {performance ? (
                              <div className="flex items-center">
                                <div className={`mr-2 flex-shrink-0 h-2.5 w-2.5 rounded-full ${
                                  performance.success_rate > 0.9 ? 'bg-green-400' : 
                                  performance.success_rate > 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}></div>
                                <div className="text-sm text-gray-900">{formatPercent(performance.success_rate)}</div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {performance && performance.average_rating ? performance.average_rating.toFixed(1) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {performance ? formatTime(performance.average_latency) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Link href={`/analytics/${prompt.name}`} className="text-primary-600 hover:text-primary-900">
                              详情
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {prompts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 优化建议 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">优化建议</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-700">定期分析性能数据，关注成功率低于80%的提示词，考虑优化其指令或增加示例</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-700">检查平均响应时间较长的提示词，尝试简化其复杂度或分解为多个步骤</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-700">收集并分析用户反馈，了解评分低的原因，有针对性地改进提示词</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-700">对于常用提示词，考虑创建多个版本针对不同的使用场景</span>
                </li>
              </ul>
              
              <div className="mt-6">
                <Link href="/docs/optimization" className="inline-flex items-center text-primary-600 hover:text-primary-800">
                  查看更多优化指南
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
