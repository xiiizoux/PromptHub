import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const PerformanceTrackingPage: React.FC = () => {
  return (
    <div className="bg-dark-bg-primary min-h-screen py-8 relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5"></div>
      
      <div className="container-custom relative z-10">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/advanced" className="inline-flex items-center text-sm font-medium text-neon-cyan hover:text-neon-cyan-dark transition-colors duration-300">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回高级功能
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-text-shimmer">
            性能追踪与分析
          </h1>
          <p className="mt-4 text-lg text-dark-text-secondary max-w-3xl mx-auto">
            全面了解如何监控、分析和优化提示词的性能表现，使用最先进的赛博空间技术
          </p>
        </div>

        {/* 性能监控概述 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-cyan/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-cyan mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-cyan rounded-full mr-3 animate-pulse"></span>
              性能监控概述
            </h2>
            <p className="text-dark-text-secondary mb-8 leading-relaxed">
              性能追踪是提示词优化的关键环节，通过收集和分析使用数据，帮助您了解提示词的实际表现，
              识别改进机会，并做出数据驱动的优化决策。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-neon-cyan/10 to-neon-blue/10 border border-neon-cyan/30 rounded-xl p-6 hover:shadow-neon-cyan/40 hover:shadow-lg transition-all duration-300 group">
                <h3 className="text-lg font-medium text-neon-cyan mb-4 flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  实时监控
                </h3>
                <ul className="space-y-3 text-dark-text-secondary text-sm">
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>响应时间追踪</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>成功率监控</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>并发使用量</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>错误率统计</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-neon-green/10 to-neon-yellow/10 border border-neon-green/30 rounded-xl p-6 hover:shadow-neon-green/40 hover:shadow-lg transition-all duration-300 group">
                <h3 className="text-lg font-medium text-neon-green mb-4 flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  趋势分析
                </h3>
                <ul className="space-y-3 text-dark-text-secondary text-sm">
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-green rounded-full mr-3"></span>使用量趋势</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-green rounded-full mr-3"></span>性能变化</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-green rounded-full mr-3"></span>用户行为模式</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-green rounded-full mr-3"></span>季节性分析</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-xl p-6 hover:shadow-neon-purple/40 hover:shadow-lg transition-all duration-300 group">
                <h3 className="text-lg font-medium text-neon-purple mb-4 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  质量评估
                </h3>
                <ul className="space-y-3 text-dark-text-secondary text-sm">
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>用户满意度</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>输出质量评分</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>任务完成率</li>
                  <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>重复使用率</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 核心性能指标 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-purple/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-purple mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-purple rounded-full mr-3 animate-pulse"></span>
              核心性能指标
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-neon-cyan mb-6">响应性能指标</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-dark-bg-secondary to-dark-bg-tertiary border border-neon-cyan/20 p-6 rounded-xl hover:border-neon-cyan/40 transition-all duration-300">
                    <h4 className="font-medium text-neon-cyan mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-cyan rounded-full mr-3"></span>
                      响应时间 (Response Time)
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">平均响应时间:</span>
                        <span className="font-medium text-neon-blue">&lt; 2秒</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">P95响应时间:</span>
                        <span className="font-medium text-neon-green">&lt; 5秒</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">P99响应时间:</span>
                        <span className="font-medium text-neon-orange">&lt; 10秒</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-dark-bg-secondary to-dark-bg-tertiary border border-neon-green/20 p-6 rounded-xl hover:border-neon-green/40 transition-all duration-300">
                    <h4 className="font-medium text-neon-green mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-green rounded-full mr-3"></span>
                      吞吐量 (Throughput)
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">每秒请求数:</span>
                        <span className="font-medium text-neon-blue">100+ RPS</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">每分钟提示词调用:</span>
                        <span className="font-medium text-neon-green">500+ CPM</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">并发用户数:</span>
                        <span className="font-medium text-neon-orange">50+ CCU</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-pink mb-6">质量指标</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 border border-neon-green/30 rounded-xl hover:shadow-neon-green/40 hover:shadow-lg transition-all duration-300">
                    <div className="text-4xl font-bold text-neon-green mb-2 animate-pulse">95%+</div>
                    <div className="text-sm text-dark-text-secondary">成功率</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/30 rounded-xl hover:shadow-neon-blue/40 hover:shadow-lg transition-all duration-300">
                    <div className="text-4xl font-bold text-neon-blue mb-2 animate-pulse">4.5+</div>
                    <div className="text-sm text-dark-text-secondary">用户评分</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-xl hover:shadow-neon-purple/40 hover:shadow-lg transition-all duration-300">
                    <div className="text-4xl font-bold text-neon-purple mb-2 animate-pulse">85%+</div>
                    <div className="text-sm text-dark-text-secondary">任务完成率</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-yellow mb-6">使用统计</h3>
                <div className="bg-gradient-to-r from-dark-bg-secondary to-dark-bg-tertiary border border-neon-yellow/20 p-6 rounded-xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="group hover:scale-105 transition-transform duration-300">
                      <div className="text-lg font-semibold text-neon-cyan">日活跃用户</div>
                      <div className="text-sm text-dark-text-tertiary">Daily Active Users</div>
                    </div>
                    <div className="group hover:scale-105 transition-transform duration-300">
                      <div className="text-lg font-semibold text-neon-green">月活跃用户</div>
                      <div className="text-sm text-dark-text-tertiary">Monthly Active Users</div>
                    </div>
                    <div className="group hover:scale-105 transition-transform duration-300">
                      <div className="text-lg font-semibold text-neon-purple">平均会话时长</div>
                      <div className="text-sm text-dark-text-tertiary">Avg Session Duration</div>
                    </div>
                    <div className="group hover:scale-105 transition-transform duration-300">
                      <div className="text-lg font-semibold text-neon-pink">重复使用率</div>
                      <div className="text-sm text-dark-text-tertiary">Retention Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据收集方法 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-green/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-green mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-green rounded-full mr-3 animate-pulse"></span>
              数据收集方法
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-neon-cyan mb-4">自动化数据收集</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  系统自动收集基础性能数据，无需额外配置。智能监控系统实时捕获所有关键指标。
                </p>
                
                <div className="bg-dark-bg-secondary border border-neon-cyan/20 p-6 rounded-xl hover:border-neon-cyan/40 transition-all duration-300">
                  <pre className="text-sm text-neon-cyan whitespace-pre-wrap font-mono">
{`// 自动收集的数据示例
{
  "timestamp": "2024-01-01T12:00:00Z",
  "prompt_id": "prompt-123",
  "user_id": "user-456",
  "session_id": "session-789",
  "request_data": {
    "method": "POST",
    "endpoint": "/api/prompts/invoke",
    "response_time": 1.2,
    "status_code": 200,
    "token_count": 150,
    "model_used": "gpt-4"
  },
  "performance_metrics": {
    "processing_time": 0.8,
    "queue_time": 0.2,
    "network_time": 0.2
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-purple mb-4">用户反馈收集</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  通过多种智能化方式收集用户对提示词质量的反馈，构建完整的用户体验画像。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-xl p-6 hover:shadow-neon-purple/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-purple mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-purple rounded-full mr-3"></span>
                      评分系统
                    </h4>
                    <ul className="text-sm text-dark-text-secondary space-y-3">
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>1-5星评分</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>快速点赞/点踩</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>质量评估问卷</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>满意度调查</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-neon-pink/10 to-neon-red/10 border border-neon-pink/30 rounded-xl p-6 hover:shadow-neon-pink/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-pink mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-pink rounded-full mr-3"></span>
                      行为分析
                    </h4>
                    <ul className="text-sm text-dark-text-secondary space-y-3">
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-pink rounded-full mr-3"></span>使用频率统计</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-pink rounded-full mr-3"></span>停留时间分析</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-pink rounded-full mr-3"></span>重复使用模式</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-pink rounded-full mr-3"></span>放弃率追踪</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-yellow mb-4">自定义事件追踪</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  为特定业务场景添加自定义追踪事件，实现精确的数据采集和分析。
                </p>
                
                <div className="bg-dark-bg-secondary border border-neon-yellow/20 p-6 rounded-xl hover:border-neon-yellow/40 transition-all duration-300">
                  <pre className="text-sm text-neon-yellow whitespace-pre-wrap font-mono">
{`// 自定义事件追踪示例
import { trackEvent } from './analytics';

// 追踪提示词编辑事件
trackEvent('prompt_edited', {
  prompt_id: 'prompt-123',
  edit_type: 'content_update',
  changes: {
    content_length_before: 500,
    content_length_after: 650,
    sections_modified: ['introduction', 'examples']
  }
});

// 追踪A/B测试结果
trackEvent('ab_test_result', {
  test_id: 'test-456',
  variant: 'B',
  outcome: 'success',
  metrics: {
    completion_rate: 0.85,
    user_satisfaction: 4.2
  }
});`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分析工具和仪表板 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-blue/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-blue mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-blue rounded-full mr-3 animate-pulse"></span>
              分析工具和仪表板
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-neon-cyan mb-4">实时监控仪表板</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  提供实时的系统状态和性能指标监控，让您掌握每一个数据脉动。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-neon-cyan/10 to-neon-blue/10 border border-neon-cyan/30 rounded-xl p-6 hover:shadow-neon-cyan/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-cyan mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-cyan rounded-full mr-3"></span>
                      系统健康状态
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">API响应时间</span>
                        <span className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full border border-neon-green/30">正常</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">数据库连接</span>
                        <span className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full border border-neon-green/30">健康</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">错误率</span>
                        <span className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full border border-neon-green/30">&lt; 1%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-neon-green/10 to-neon-yellow/10 border border-neon-green/30 rounded-xl p-6 hover:shadow-neon-green/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-green mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-green rounded-full mr-3"></span>
                      当前活动
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">在线用户</span>
                        <span className="font-medium text-neon-cyan">42</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">活跃会话</span>
                        <span className="font-medium text-neon-purple">28</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-dark-bg-primary/50">
                        <span className="text-dark-text-secondary">每分钟请求</span>
                        <span className="font-medium text-neon-pink">156</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-purple mb-4">性能分析报告</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  定期生成详细的性能分析报告，帮助识别趋势和问题，洞察数据背后的秘密。
                </p>
                
                <div className="bg-gradient-to-r from-dark-bg-secondary to-dark-bg-tertiary border border-neon-purple/20 p-6 rounded-xl">
                  <h4 className="font-medium text-neon-purple mb-4 flex items-center">
                    <span className="w-3 h-3 bg-neon-purple rounded-full mr-3"></span>
                    报告类型
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-neon-cyan/10 to-neon-blue/10 border border-neon-cyan/30 rounded-lg hover:shadow-neon-cyan/40 hover:shadow-lg transition-all duration-300">
                      <div className="font-medium text-neon-cyan">日报</div>
                      <div className="text-sm text-dark-text-tertiary mt-1">每日性能概览</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/30 rounded-lg hover:shadow-neon-purple/40 hover:shadow-lg transition-all duration-300">
                      <div className="font-medium text-neon-purple">周报</div>
                      <div className="text-sm text-dark-text-tertiary mt-1">趋势分析和对比</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-neon-pink/10 to-neon-red/10 border border-neon-pink/30 rounded-lg hover:shadow-neon-pink/40 hover:shadow-lg transition-all duration-300">
                      <div className="font-medium text-neon-pink">月报</div>
                      <div className="text-sm text-dark-text-tertiary mt-1">深度分析和建议</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-orange mb-4">自定义分析查询</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  支持灵活的数据查询和分析，满足特定的业务需求，释放数据的无限潜能。
                </p>
                
                <div className="bg-dark-bg-secondary border border-neon-orange/20 p-6 rounded-xl hover:border-neon-orange/40 transition-all duration-300">
                  <pre className="text-sm text-neon-orange whitespace-pre-wrap font-mono">
{`// 查询示例：获取最受欢迎的提示词
SELECT 
  p.name,
  p.category,
  COUNT(u.id) as usage_count,
  AVG(f.rating) as avg_rating,
  AVG(u.response_time) as avg_response_time
FROM prompts p
LEFT JOIN usage_logs u ON p.id = u.prompt_id
LEFT JOIN feedback f ON p.id = f.prompt_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.category
ORDER BY usage_count DESC, avg_rating DESC
LIMIT 10;

// 查询示例：分析用户行为模式
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as request_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(response_time) as avg_response_time
FROM usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 性能优化建议 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-red/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-red mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-red rounded-full mr-3 animate-pulse"></span>
              性能优化建议
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-neon-orange mb-4">基于数据的优化策略</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-neon-orange/10 to-neon-red/10 border border-neon-orange/30 rounded-xl p-6 hover:shadow-neon-orange/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-orange mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-orange rounded-full mr-3"></span>
                      响应时间优化
                    </h4>
                    <ul className="text-sm text-dark-text-secondary space-y-3">
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-orange rounded-full mr-3"></span>识别慢查询并优化数据库索引</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-orange rounded-full mr-3"></span>实施缓存策略减少重复计算</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-orange rounded-full mr-3"></span>优化提示词内容长度</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-orange rounded-full mr-3"></span>使用CDN加速静态资源</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/30 rounded-xl p-6 hover:shadow-neon-blue/40 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-medium text-neon-blue mb-4 flex items-center">
                      <span className="w-3 h-3 bg-neon-blue rounded-full mr-3"></span>
                      用户体验优化
                    </h4>
                    <ul className="text-sm text-dark-text-secondary space-y-3">
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-blue rounded-full mr-3"></span>根据使用模式调整界面布局</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-blue rounded-full mr-3"></span>优化高频使用的提示词</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-blue rounded-full mr-3"></span>改进搜索和发现机制</li>
                      <li className="flex items-center"><span className="w-1 h-1 bg-neon-blue rounded-full mr-3"></span>个性化推荐算法</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-neon-yellow mb-4">预警和告警系统</h3>
                <p className="text-dark-text-secondary mb-6 leading-relaxed">
                  设置智能告警，及时发现和处理性能问题，守护系统稳定运行。
                </p>
                
                <div className="bg-gradient-to-r from-dark-bg-secondary to-dark-bg-tertiary border border-neon-yellow/20 p-6 rounded-xl">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-neon-red/10 to-neon-orange/10 border border-neon-red/30 rounded-xl hover:shadow-neon-red/40 hover:shadow-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-neon-red rounded-full mt-1 animate-pulse"></div>
                      <div>
                        <h4 className="font-medium text-neon-red mb-2">严重告警</h4>
                        <p className="text-sm text-dark-text-secondary">响应时间 &gt; 10秒，错误率 &gt; 5%，服务不可用</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-neon-orange/10 to-neon-yellow/10 border border-neon-orange/30 rounded-xl hover:shadow-neon-orange/40 hover:shadow-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-neon-orange rounded-full mt-1 animate-pulse"></div>
                      <div>
                        <h4 className="font-medium text-neon-orange mb-2">警告告警</h4>
                        <p className="text-sm text-dark-text-secondary">响应时间 &gt; 5秒，错误率 &gt; 2%，资源使用率 &gt; 80%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-neon-yellow/10 to-neon-green/10 border border-neon-yellow/30 rounded-xl hover:shadow-neon-yellow/40 hover:shadow-lg transition-all duration-300">
                      <div className="w-4 h-4 bg-neon-yellow rounded-full mt-1 animate-pulse"></div>
                      <div>
                        <h4 className="font-medium text-neon-yellow mb-2">信息告警</h4>
                        <p className="text-sm text-dark-text-secondary">使用量异常增长，新用户注册激增</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* A/B测试和实验 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">A/B测试和实验</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">实验设计原则</h3>
                <p className="text-gray-600 mb-4">
                  科学的A/B测试帮助验证优化效果，确保改进的有效性。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">测试设计</h4>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li>• 明确假设和目标指标</li>
                      <li>• 确定样本大小和测试时长</li>
                      <li>• 随机分配用户群体</li>
                      <li>• 控制变量确保结果可靠</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">结果分析</h4>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li>• 统计显著性检验</li>
                      <li>• 置信区间计算</li>
                      <li>• 业务影响评估</li>
                      <li>• 长期效果追踪</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">常见测试场景</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">提示词内容优化</h4>
                    <p className="text-sm text-gray-600 mb-3">测试不同版本的提示词内容对输出质量的影响</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>假设：</strong> 添加更多示例会提高输出质量<br/>
                      <strong>指标：</strong> 用户满意度、任务完成率、重复使用率
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">界面布局优化</h4>
                    <p className="text-sm text-gray-600 mb-3">测试不同的界面设计对用户体验的影响</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>假设：</strong> 简化界面会提高使用效率<br/>
                      <strong>指标：</strong> 任务完成时间、错误率、用户留存率
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">推荐算法优化</h4>
                    <p className="text-sm text-gray-600 mb-3">测试不同推荐策略对用户发现和使用的影响</p>
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <strong>假设：</strong> 个性化推荐会增加使用量<br/>
                      <strong>指标：</strong> 点击率、转化率、用户活跃度
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10 border border-neon-cyan/30 rounded-xl p-8 mb-8 shadow-2xl hover:shadow-neon-cyan/40 transition-all duration-500">
          <h2 className="text-2xl font-semibold text-neon-cyan mb-6 flex items-center">
            <span className="text-3xl mr-4">📊</span>
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              性能追踪最佳实践
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-bg-glass backdrop-blur-sm border border-neon-cyan/20 rounded-xl p-6 hover:border-neon-cyan/40 transition-all duration-300">
              <h3 className="text-xl font-medium text-neon-cyan mb-4 flex items-center">
                <span className="w-3 h-3 bg-neon-cyan rounded-full mr-3"></span>
                监控策略
              </h3>
              <ul className="space-y-3 text-dark-text-secondary">
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>建立全面的指标体系</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>设置合理的告警阈值</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>定期审查和调整监控策略</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-cyan rounded-full mr-3"></span>关注用户体验指标</li>
              </ul>
            </div>
            <div className="bg-dark-bg-glass backdrop-blur-sm border border-neon-purple/20 rounded-xl p-6 hover:border-neon-purple/40 transition-all duration-300">
              <h3 className="text-xl font-medium text-neon-purple mb-4 flex items-center">
                <span className="w-3 h-3 bg-neon-purple rounded-full mr-3"></span>
                数据分析
              </h3>
              <ul className="space-y-3 text-dark-text-secondary">
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>结合定量和定性分析</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>注重长期趋势而非短期波动</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>进行科学的A/B测试</li>
                <li className="flex items-center"><span className="w-1 h-1 bg-neon-purple rounded-full mr-3"></span>基于数据做出优化决策</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 工具推荐 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden mb-8 shadow-2xl hover:shadow-neon-orange/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-orange mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-orange rounded-full mr-3 animate-pulse"></span>
              推荐工具
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-neon-orange/10 to-neon-yellow/10 border border-neon-orange/30 rounded-xl p-6 hover:shadow-neon-orange/40 hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl font-medium text-neon-orange mb-4 flex items-center">
                  <span className="w-3 h-3 bg-neon-orange rounded-full mr-3"></span>
                  监控工具
                </h3>
                <ul className="space-y-3 text-dark-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-orange rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-orange">Grafana</strong> - 数据可视化和仪表板
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-orange rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-orange">Prometheus</strong> - 指标收集和存储
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-orange rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-orange">New Relic</strong> - 应用性能监控
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-orange rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-orange">DataDog</strong> - 全栈监控平台
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-neon-yellow/10 to-neon-green/10 border border-neon-yellow/30 rounded-xl p-6 hover:shadow-neon-yellow/40 hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl font-medium text-neon-yellow mb-4 flex items-center">
                  <span className="w-3 h-3 bg-neon-yellow rounded-full mr-3"></span>
                  分析工具
                </h3>
                <ul className="space-y-3 text-dark-text-secondary text-sm">
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-yellow rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-yellow">Google Analytics</strong> - 用户行为分析
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-yellow rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-yellow">Mixpanel</strong> - 事件追踪和分析
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-yellow rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-yellow">Amplitude</strong> - 产品分析平台
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1 h-1 bg-neon-yellow rounded-full mr-3 mt-2"></span>
                    <div>
                      <strong className="text-neon-yellow">Jupyter Notebook</strong> - 数据科学分析
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-dark-bg-glass backdrop-blur-lg border border-dark-border rounded-xl overflow-hidden shadow-2xl hover:shadow-neon-pink/20 transition-all duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-neon-pink mb-6 flex items-center">
              <span className="w-2 h-2 bg-neon-pink rounded-full mr-3 animate-pulse"></span>
              下一步学习
            </h2>
            <p className="text-dark-text-secondary mb-6 leading-relaxed">
              现在您已经掌握了性能追踪的精髓，可以深入探索更多高级功能：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/docs/advanced/integration" className="group block p-6 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 border border-neon-pink/30 rounded-xl hover:border-neon-pink/50 hover:shadow-neon-pink/40 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-medium text-neon-pink mb-2 group-hover:text-neon-pink-dark transition-colors">系统集成</h3>
                <p className="text-sm text-dark-text-secondary">学习如何将PromptHub与其他系统无缝集成</p>
              </Link>
              
              <Link href="/docs/best-practices/optimization" className="group block p-6 bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/30 rounded-xl hover:border-neon-purple/50 hover:shadow-neon-purple/40 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-medium text-neon-purple mb-2 group-hover:text-neon-purple-dark transition-colors">提示词优化</h3>
                <p className="text-sm text-dark-text-secondary">基于性能数据科学优化提示词质量</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrackingPage; 