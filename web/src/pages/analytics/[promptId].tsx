import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  UserIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  CubeTransparentIcon,
  ChartPieIcon,
  BoltIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { getPromptDetails, getPromptPerformance, getPerformanceReport } from '@/lib/api';
import { PromptDetails, PromptPerformance } from '@/types';
import QualityAnalysisPanel from '@/components/QualityAnalysisPanel';
import { formatVersionDisplay } from '@/lib/version-utils';

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
    <div className="min-h-screen bg-dark-bg-primary relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-gradient-to-br from-neon-yellow/10 to-neon-green/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 py-8">
        <div className="container-custom">
          {/* 返回按钮 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link 
              href="/analytics" 
              className="inline-flex items-center glass rounded-lg px-4 py-2 border border-neon-cyan/30 text-neon-cyan hover:text-neon-purple hover:border-neon-purple/30 transition-all duration-300 group"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">返回性能分析</span>
            </Link>
          </motion.div>
          
          {/* 提示词基本信息 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-2xl border border-neon-cyan/20 overflow-hidden mb-8 shadow-2xl"
          >
            <div className="p-8 border-b border-neon-cyan/10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <motion.h1 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-4"
                  >
                    {prompt.name}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-lg text-gray-300 leading-relaxed"
                  >
                    {prompt.description}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <Link 
                    href={`/prompts/${prompt.id}`}
                    className="btn-primary flex items-center space-x-2 group"
                  >
                    <DocumentTextIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>查看提示词</span>
                  </Link>
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-6 flex flex-wrap items-center gap-6 text-sm"
              >
                <div className="flex items-center text-gray-400 group">
                  <ClockIcon className="h-4 w-4 mr-2 text-neon-cyan group-hover:text-neon-purple transition-colors duration-300" />
                  <span>创建于 {formatDate(prompt.created_at)}</span>
                </div>
                {prompt.updated_at && prompt.updated_at !== prompt.created_at && (
                  <div className="flex items-center text-gray-400 group">
                    <ClockIcon className="h-4 w-4 mr-2 text-neon-purple group-hover:text-neon-pink transition-colors duration-300" />
                    <span>更新于 {formatDate(prompt.updated_at)}</span>
                  </div>
                )}
                {prompt.author && (
                  <div className="flex items-center text-gray-400 group">
                    <UserIcon className="h-4 w-4 mr-2 text-neon-pink group-hover:text-neon-cyan transition-colors duration-300" />
                    <span>{prompt.author}</span>
                  </div>
                )}
                {prompt.version && (
                  <div className="flex items-center text-gray-400 group">
                    <SparklesIcon className="h-4 w-4 mr-2 text-neon-yellow group-hover:text-neon-green transition-colors duration-300" />
                    <span>v{formatVersionDisplay(prompt.version)}</span>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* 时间范围选择器 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="px-8 py-6 bg-dark-bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neon-cyan flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  选择时间范围：
                </div>
                <div className="flex space-x-2">
                  {[
                    { key: 'day', label: '今日', icon: '📅' },
                    { key: 'week', label: '本周', icon: '📊' },
                    { key: 'month', label: '本月', icon: '📈' },
                    { key: 'all', label: '全部', icon: '🌟' }
                  ].map((item, index) => (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.4 + index * 0.1 }}
                      type="button"
                      onClick={() => setTimeRange(item.key)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        timeRange === item.key
                          ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-neon-sm'
                          : 'glass border border-neon-cyan/20 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* 性能指标卡片 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
          >
            {/* 使用次数 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
              className="glass rounded-xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <FireIcon className="h-6 w-6 text-neon-cyan" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">使用次数</div>
                  <div className="mt-1 text-2xl font-bold text-neon-cyan">
                    {formatNumber(performance.total_usage)}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* 成功率 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 2 }}
              className="glass rounded-xl p-6 border border-neon-green/20 hover:border-neon-green/40 transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-neon-green to-neon-cyan p-0.5 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-neon-green" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">成功率</div>
                  <div className="mt-1 text-2xl font-bold text-neon-green">
                    {formatPercent(performance.success_rate)}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* 平均评分 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 2.2 }}
              className="glass rounded-xl p-6 border border-neon-yellow/20 hover:border-neon-yellow/40 transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-neon-yellow to-neon-orange p-0.5 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <StarIcon className="h-6 w-6 text-neon-yellow" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">平均评分</div>
                  <div className="mt-1 text-2xl font-bold text-neon-yellow">
                    {performance.average_rating ? performance.average_rating.toFixed(1) : '暂无'}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* 平均响应时间 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 2.4 }}
              className="glass rounded-xl p-6 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink p-0.5 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <BoltIcon className="h-6 w-6 text-neon-purple" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors duration-300">平均响应时间</div>
                  <div className="mt-1 text-2xl font-bold text-neon-purple">
                    {formatTime(performance.average_latency)}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Token统计 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.6 }}
            className="glass rounded-2xl border border-neon-cyan/20 overflow-hidden mb-8 shadow-2xl"
          >
            <div className="px-8 py-6 border-b border-neon-cyan/10">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple p-0.5 mr-4">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <CubeTransparentIcon className="h-5 w-5 text-neon-cyan" />
                  </div>
                </div>
                Token统计
              </h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 2.8 }}
                >
                  <h3 className="text-lg font-medium text-neon-cyan mb-4 flex items-center">
                    <ChartPieIcon className="h-5 w-5 mr-2" />
                    平均Token消耗
                  </h3>
                  <div className="glass rounded-xl p-6 border border-neon-cyan/20">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-300 flex items-center">
                            <span className="w-3 h-3 rounded-full bg-neon-blue mr-2"></span>
                            输入Token
                          </span>
                          <span className="text-sm font-medium text-neon-blue">{formatNumber(performance.token_stats.input_avg)}</span>
                        </div>
                        <div className="w-full bg-dark-bg-secondary rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (performance.token_stats.input_avg / (performance.token_stats.input_avg + performance.token_stats.output_avg)) * 100)}%` }}
                            transition={{ duration: 1, delay: 3 }}
                            className="bg-gradient-to-r from-neon-blue to-neon-cyan h-full rounded-full shadow-neon-sm"
                          ></motion.div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-300 flex items-center">
                            <span className="w-3 h-3 rounded-full bg-neon-green mr-2"></span>
                            输出Token
                          </span>
                          <span className="text-sm font-medium text-neon-green">{formatNumber(performance.token_stats.output_avg)}</span>
                        </div>
                        <div className="w-full bg-dark-bg-secondary rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (performance.token_stats.output_avg / (performance.token_stats.input_avg + performance.token_stats.output_avg)) * 100)}%` }}
                            transition={{ duration: 1, delay: 3.2 }}
                            className="bg-gradient-to-r from-neon-green to-neon-cyan h-full rounded-full shadow-neon-sm"
                          ></motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 3.4 }}
                >
                  <h3 className="text-lg font-medium text-neon-purple mb-4 flex items-center">
                    <PresentationChartLineIcon className="h-5 w-5 mr-2" />
                    总Token消耗
                  </h3>
                  <div className="glass rounded-xl p-6 border border-neon-purple/20">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-300 flex items-center">
                            <span className="w-3 h-3 rounded-full bg-neon-blue mr-2"></span>
                            输入Token
                          </span>
                          <span className="text-sm font-medium text-neon-blue">{formatNumber(performance.token_stats.total_input)}</span>
                        </div>
                        <div className="w-full bg-dark-bg-secondary rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (performance.token_stats.total_input / (performance.token_stats.total_input + performance.token_stats.total_output)) * 100)}%` }}
                            transition={{ duration: 1, delay: 3.6 }}
                            className="bg-gradient-to-r from-neon-blue to-neon-purple h-full rounded-full shadow-neon-sm"
                          ></motion.div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-300 flex items-center">
                            <span className="w-3 h-3 rounded-full bg-neon-green mr-2"></span>
                            输出Token
                          </span>
                          <span className="text-sm font-medium text-neon-green">{formatNumber(performance.token_stats.total_output)}</span>
                        </div>
                        <div className="w-full bg-dark-bg-secondary rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (performance.token_stats.total_output / (performance.token_stats.total_input + performance.token_stats.total_output)) * 100)}%` }}
                            transition={{ duration: 1, delay: 3.8 }}
                            className="bg-gradient-to-r from-neon-green to-neon-purple h-full rounded-full shadow-neon-sm"
                          ></motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* 版本分布 */}
          {performance.version_distribution && Object.keys(performance.version_distribution).length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 4 }}
              className="glass rounded-2xl border border-neon-purple/20 overflow-hidden mb-8 shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-neon-purple/10">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink p-0.5 mr-4">
                    <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                      <SparklesIcon className="h-5 w-5 text-neon-purple" />
                    </div>
                  </div>
                  版本分布
                </h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {Object.entries(performance.version_distribution).map(([version, count], index) => (
                    <motion.div 
                      key={version}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 4.2 + index * 0.2 }}
                    >
                      <div className="flex justify-between mb-3">
                        <span className="text-lg font-medium text-white flex items-center">
                          <span className={`w-4 h-4 rounded-full mr-3 ${
                            index % 4 === 0 ? 'bg-neon-cyan shadow-neon-cyan' : 
                            index % 4 === 1 ? 'bg-neon-purple shadow-neon-purple' : 
                            index % 4 === 2 ? 'bg-neon-pink shadow-neon-pink' : 'bg-neon-green shadow-neon-green'
                          } shadow-md`}></span>
                          v{formatVersionDisplay(version)}
                        </span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {formatNumber(count as number)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatPercent((count as number) / performance.total_usage)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-dark-bg-secondary rounded-full h-4 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((count as number) / performance.total_usage) * 100}%` }}
                          transition={{ duration: 1, delay: 4.4 + index * 0.2 }}
                          className={`h-full rounded-full shadow-md ${
                            index % 4 === 0 ? 'bg-gradient-to-r from-neon-cyan to-neon-blue' : 
                            index % 4 === 1 ? 'bg-gradient-to-r from-neon-purple to-neon-pink' : 
                            index % 4 === 2 ? 'bg-gradient-to-r from-neon-pink to-neon-red' : 'bg-gradient-to-r from-neon-green to-neon-cyan'
                          }`}
                        ></motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 反馈分析 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 5 }}
            className="glass rounded-2xl border border-neon-yellow/20 overflow-hidden mb-8 shadow-2xl"
          >
            <div className="px-8 py-6 border-b border-neon-yellow/10">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-yellow to-neon-orange p-0.5 mr-4">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <StarIcon className="h-5 w-5 text-neon-yellow" />
                  </div>
                </div>
                反馈分析
              </h2>
            </div>
            <div className="p-8">
              {performance.feedback_count > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 5.2 }}
                    className="lg:col-span-2"
                  >
                    <h3 className="text-lg font-medium text-neon-yellow mb-6 flex items-center">
                      <StarIcon className="h-5 w-5 mr-2" />
                      评分分布
                    </h3>
                    <div className="space-y-4">
                      {[5, 4, 3, 2, 1].map((rating, index) => {
                        // 这里使用模拟数据，实际应用中应该从API获取
                        const count = Math.floor(Math.random() * performance.feedback_count);
                        const percentage = (count / performance.feedback_count) * 100;
                        
                        return (
                          <motion.div 
                            key={rating} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 5.4 + index * 0.1 }}
                            className="flex items-center"
                          >
                            <div className="min-w-[60px] text-sm font-medium text-gray-300 flex items-center">
                              <StarIcon className={`h-4 w-4 mr-2 ${
                                rating >= 4 ? 'text-neon-yellow' : 
                                rating === 3 ? 'text-neon-orange' : 'text-neon-red'
                              }`} />
                              {rating}星
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="w-full bg-dark-bg-secondary rounded-full h-3 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 5.6 + index * 0.1 }}
                                  className={`h-full rounded-full shadow-md ${
                                    rating >= 4 ? 'bg-gradient-to-r from-neon-green to-neon-cyan' : 
                                    rating === 3 ? 'bg-gradient-to-r from-neon-yellow to-neon-orange' : 'bg-gradient-to-r from-neon-red to-neon-pink'
                                  }`}
                                ></motion.div>
                              </div>
                            </div>
                            <div className="min-w-[100px] text-right text-sm">
                              <div className="text-white font-medium">{count}</div>
                              <div className="text-gray-400">({percentage.toFixed(1)}%)</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 6 }}
                  >
                    <h3 className="text-lg font-medium text-neon-orange mb-6 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2" />
                      反馈统计
                    </h3>
                    <div className="glass rounded-xl p-6 border border-neon-orange/20 space-y-4">
                      <div className="flex justify-between items-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                        <span className="text-sm text-gray-300">总反馈数</span>
                        <span className="text-lg font-bold text-neon-orange">{formatNumber(performance.feedback_count)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                        <span className="text-sm text-gray-300">反馈率</span>
                        <span className="text-lg font-bold text-neon-cyan">
                          {formatPercent(performance.feedback_count / performance.total_usage)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-dark-bg-secondary/30 rounded-lg">
                        <span className="text-sm text-gray-300">平均评分</span>
                        <div className="flex items-center">
                          <StarIcon className="h-5 w-5 text-neon-yellow mr-1" />
                          <span className="text-lg font-bold text-neon-yellow">
                            {performance.average_rating ? performance.average_rating.toFixed(1) : '暂无'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 5.2 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-600/20 to-gray-400/20 flex items-center justify-center mx-auto mb-6">
                    <StarIcon className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">暂无反馈</h3>
                  <p className="text-gray-400">该提示词尚未收到用户反馈</p>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* 质量分析 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 6.0 }}
          >
            <QualityAnalysisPanel promptId={prompt.id} className="mb-8" />
          </motion.div>

          {/* 传统性能数据 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 6.5 }}
            className="glass rounded-2xl border border-neon-green/20 overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-6 border-b border-neon-green/10">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-green to-neon-cyan p-0.5 mr-4">
                  <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-neon-green" />
                  </div>
                </div>
                传统性能数据与建议
              </h2>
            </div>
            <div className="p-8">
              {report && report.suggestions ? (
                <div className="space-y-6">
                  {report.suggestions.map((suggestion: string, index: number) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 6.7 + index * 0.2 }}
                      className="flex items-start group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors duration-300">{suggestion}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { 
                      title: "性能优化", 
                      content: "监控响应时间，优化提示词长度和复杂度",
                      icon: BoltIcon,
                      color: "neon-yellow"
                    },
                    { 
                      title: "用户体验", 
                      content: "收集用户反馈，持续改进提示词质量",
                      icon: StarIcon,
                      color: "neon-pink"
                    },
                    { 
                      title: "成功率提升", 
                      content: "分析失败案例，调整指令结构和示例",
                      icon: CheckCircleIcon,
                      color: "neon-green"
                    },
                    { 
                      title: "版本管理", 
                      content: "定期发布新版本，A/B测试不同方案",
                      icon: SparklesIcon,
                      color: "neon-cyan"
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 6.7 + index * 0.2 }}
                      className="glass rounded-xl p-6 border border-gray-600/20 hover:border-gray-400/40 transition-all duration-300 group"
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-${item.color} to-neon-purple p-0.5 mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <div className="w-full h-full bg-dark-bg-primary rounded-lg flex items-center justify-center">
                            <item.icon className={`h-5 w-5 text-${item.color}`} />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-gray-200 transition-colors duration-300">{item.title}</h4>
                          <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{item.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
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
