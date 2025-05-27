import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const PerformanceTrackingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-tight">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/advanced" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回高级功能
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">性能追踪与分析</h1>
          <p className="mt-2 text-gray-600">
            全面了解如何监控、分析和优化提示词的性能表现
          </p>
        </div>

        {/* 性能监控概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能监控概述</h2>
            <p className="text-gray-600 mb-6">
              性能追踪是提示词优化的关键环节，通过收集和分析使用数据，帮助您了解提示词的实际表现，
              识别改进机会，并做出数据驱动的优化决策。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">📊 实时监控</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• 响应时间追踪</li>
                  <li>• 成功率监控</li>
                  <li>• 并发使用量</li>
                  <li>• 错误率统计</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">📈 趋势分析</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 使用量趋势</li>
                  <li>• 性能变化</li>
                  <li>• 用户行为模式</li>
                  <li>• 季节性分析</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-3">🎯 质量评估</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• 用户满意度</li>
                  <li>• 输出质量评分</li>
                  <li>• 任务完成率</li>
                  <li>• 重复使用率</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 核心性能指标 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">核心性能指标</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">响应性能指标</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">响应时间 (Response Time)</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>平均响应时间:</span>
                        <span className="font-medium text-blue-600">&lt; 2秒</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P95响应时间:</span>
                        <span className="font-medium text-green-600">&lt; 5秒</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P99响应时间:</span>
                        <span className="font-medium text-orange-600">&lt; 10秒</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">吞吐量 (Throughput)</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>每秒请求数:</span>
                        <span className="font-medium text-blue-600">100+ RPS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>每分钟提示词调用:</span>
                        <span className="font-medium text-green-600">500+ CPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>并发用户数:</span>
                        <span className="font-medium text-orange-600">50+ CCU</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">质量指标</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">95%+</div>
                    <div className="text-sm text-green-700">成功率</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">4.5+</div>
                    <div className="text-sm text-blue-700">用户评分</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">85%+</div>
                    <div className="text-sm text-purple-700">任务完成率</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">使用统计</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">日活跃用户</div>
                      <div className="text-sm text-gray-600">Daily Active Users</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-800">月活跃用户</div>
                      <div className="text-sm text-gray-600">Monthly Active Users</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-800">平均会话时长</div>
                      <div className="text-sm text-gray-600">Avg Session Duration</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-800">重复使用率</div>
                      <div className="text-sm text-gray-600">Retention Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据收集方法 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">数据收集方法</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">自动化数据收集</h3>
                <p className="text-gray-600 mb-4">
                  系统自动收集基础性能数据，无需额外配置。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
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
                <h3 className="text-lg font-medium text-gray-900 mb-3">用户反馈收集</h3>
                <p className="text-gray-600 mb-4">
                  通过多种方式收集用户对提示词质量的反馈。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">评分系统</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 1-5星评分</li>
                      <li>• 快速点赞/点踩</li>
                      <li>• 质量评估问卷</li>
                      <li>• 满意度调查</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">行为分析</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 使用频率统计</li>
                      <li>• 停留时间分析</li>
                      <li>• 重复使用模式</li>
                      <li>• 放弃率追踪</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">自定义事件追踪</h3>
                <p className="text-gray-600 mb-4">
                  为特定业务场景添加自定义追踪事件。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
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
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">分析工具和仪表板</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">实时监控仪表板</h3>
                <p className="text-gray-600 mb-4">
                  提供实时的系统状态和性能指标监控。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">系统健康状态</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>API响应时间</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">正常</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>数据库连接</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">健康</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>错误率</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">&lt; 1%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">当前活动</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>在线用户</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>活跃会话</span>
                        <span className="font-medium">28</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>每分钟请求</span>
                        <span className="font-medium">156</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">性能分析报告</h3>
                <p className="text-gray-600 mb-4">
                  定期生成详细的性能分析报告，帮助识别趋势和问题。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">报告类型</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-medium text-gray-800">日报</div>
                      <div className="text-sm text-gray-600 mt-1">每日性能概览</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-medium text-gray-800">周报</div>
                      <div className="text-sm text-gray-600 mt-1">趋势分析和对比</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="font-medium text-gray-800">月报</div>
                      <div className="text-sm text-gray-600 mt-1">深度分析和建议</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">自定义分析查询</h3>
                <p className="text-gray-600 mb-4">
                  支持灵活的数据查询和分析，满足特定的业务需求。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
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
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能优化建议</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">基于数据的优化策略</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-3">响应时间优化</h4>
                    <ul className="text-sm text-orange-700 space-y-2">
                      <li>• 识别慢查询并优化数据库索引</li>
                      <li>• 实施缓存策略减少重复计算</li>
                      <li>• 优化提示词内容长度</li>
                      <li>• 使用CDN加速静态资源</li>
                    </ul>
                  </div>
                  
                  <div className="border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">用户体验优化</h4>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li>• 根据使用模式调整界面布局</li>
                      <li>• 优化高频使用的提示词</li>
                      <li>• 改进搜索和发现机制</li>
                      <li>• 个性化推荐算法</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">预警和告警系统</h3>
                <p className="text-gray-600 mb-4">
                  设置智能告警，及时发现和处理性能问题。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">严重告警</h4>
                        <p className="text-sm text-gray-600">响应时间 &gt; 10秒，错误率 &gt; 5%，服务不可用</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">警告告警</h4>
                        <p className="text-sm text-gray-600">响应时间 &gt; 5秒，错误率 &gt; 2%，资源使用率 &gt; 80%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">信息告警</h4>
                        <p className="text-sm text-gray-600">使用量异常增长，新用户注册激增</p>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📊 性能追踪最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">监控策略</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 建立全面的指标体系</li>
                <li>• 设置合理的告警阈值</li>
                <li>• 定期审查和调整监控策略</li>
                <li>• 关注用户体验指标</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">数据分析</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 结合定量和定性分析</li>
                <li>• 注重长期趋势而非短期波动</li>
                <li>• 进行科学的A/B测试</li>
                <li>• 基于数据做出优化决策</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 工具推荐 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">推荐工具</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">监控工具</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>Grafana</strong> - 数据可视化和仪表板</li>
                  <li>• <strong>Prometheus</strong> - 指标收集和存储</li>
                  <li>• <strong>New Relic</strong> - 应用性能监控</li>
                  <li>• <strong>DataDog</strong> - 全栈监控平台</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">分析工具</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>Google Analytics</strong> - 用户行为分析</li>
                  <li>• <strong>Mixpanel</strong> - 事件追踪和分析</li>
                  <li>• <strong>Amplitude</strong> - 产品分析平台</li>
                  <li>• <strong>Jupyter Notebook</strong> - 数据科学分析</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经了解了性能追踪的重要性和方法，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/advanced/integration" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">系统集成</h3>
                <p className="text-sm text-gray-600">学习如何将PromptHub与其他系统集成</p>
              </Link>
              
              <Link href="/docs/best-practices/optimization" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">提示词优化</h3>
                <p className="text-sm text-gray-600">基于性能数据优化提示词质量</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrackingPage; 