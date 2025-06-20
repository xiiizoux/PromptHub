import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const PerformanceApiPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/api" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回API参考
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">性能分析 API</h1>
          <p className="mt-2 text-gray-600">
            获取提示词使用统计、性能指标和分析数据的完整API文档
          </p>
        </div>

        {/* API概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">性能分析概述</h2>
            <p className="text-gray-600 mb-4">
              性能分析API提供了详细的提示词使用统计、响应时间分析、成功率监控和用户行为分析功能。
              这些数据有助于优化提示词设计和提升用户体验。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">核心指标</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 使用次数和频率</li>
                  <li>• 平均响应时间</li>
                  <li>• 成功率和错误率</li>
                  <li>• 用户满意度评分</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">分析维度</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 时间趋势分析</li>
                  <li>• 用户群体分析</li>
                  <li>• 地理位置分布</li>
                  <li>• 设备和平台统计</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 获取提示词统计 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">获取提示词统计</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">基础统计</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /api/performance/metrics

# 查询参数
?promptId=prompt-123  # 提示词ID（必需）
&timeRange=7d         # 时间范围：1d, 7d, 30d, 90d, 1y
&granularity=day      # 数据粒度：hour, day, week, month
&metrics=all          # 指标类型：usage,performance,satisfaction,all`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应示例</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "prompt_id": "prompt-123",
    "period": "7d",
    "summary": {
      "total_usage": 1250,
      "unique_users": 89,
      "avg_response_time": 1.2,
      "success_rate": 0.95,
      "avg_rating": 4.6,
      "total_tokens": 125000
    },
    "trends": [
      {
        "date": "2024-01-01",
        "usage_count": 180,
        "unique_users": 15,
        "avg_response_time": 1.1,
        "success_rate": 0.97,
        "avg_rating": 4.7
      },
      {
        "date": "2024-01-02",
        "usage_count": 165,
        "unique_users": 12,
        "avg_response_time": 1.3,
        "success_rate": 0.94,
        "avg_rating": 4.5
      }
    ],
    "performance_breakdown": {
      "response_time_distribution": {
        "0-1s": 0.45,
        "1-2s": 0.35,
        "2-5s": 0.15,
        "5s+": 0.05
      },
      "error_types": {
        "timeout": 0.02,
        "rate_limit": 0.01,
        "validation": 0.02
      }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 批量统计分析 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">批量统计分析</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">多提示词对比</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /api/performance/{promptId}
Content-Type: application/json

# 查询参数
?version=1.0         # 可选：指定版本号
&includeHistory=true # 可选：包含历史数据`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应示例</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "comparison": [
      {
        "prompt_id": "prompt-123",
        "name": "code-reviewer",
        "metrics": {
          "total_usage": 1250,
          "avg_response_time": 1.2,
          "success_rate": 0.95,
          "avg_rating": 4.6
        },
        "rank": {
          "usage": 1,
          "performance": 2,
          "satisfaction": 1
        }
      },
      {
        "prompt_id": "prompt-456",
        "name": "email-writer",
        "metrics": {
          "total_usage": 890,
          "avg_response_time": 0.8,
          "success_rate": 0.98,
          "avg_rating": 4.4
        },
        "rank": {
          "usage": 2,
          "performance": 1,
          "satisfaction": 2
        }
      }
    ],
    "insights": [
      "code-reviewer 使用量最高但响应时间较长",
      "email-writer 性能最佳，建议优化其他提示词"
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 用户行为分析 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">用户行为分析</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">用户使用模式</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /analytics/users/behavior

# 查询参数
?prompt_id=prompt-123  # 特定提示词分析
&period=30d            # 分析时间范围
&segment=all           # 用户群体：new,returning,power,all`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应示例</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "user_segments": {
      "new_users": {
        "count": 45,
        "avg_sessions": 2.1,
        "avg_prompts_per_session": 3.2,
        "retention_rate": 0.67
      },
      "returning_users": {
        "count": 123,
        "avg_sessions": 8.5,
        "avg_prompts_per_session": 5.8,
        "retention_rate": 0.89
      },
      "power_users": {
        "count": 12,
        "avg_sessions": 25.3,
        "avg_prompts_per_session": 12.1,
        "retention_rate": 0.95
      }
    },
    "usage_patterns": {
      "peak_hours": [9, 10, 14, 15, 20],
      "peak_days": ["Monday", "Tuesday", "Wednesday"],
      "session_duration": {
        "avg": 12.5,
        "median": 8.2,
        "p95": 35.7
      }
    },
    "geographic_distribution": {
      "China": 0.45,
      "United States": 0.25,
      "Europe": 0.20,
      "Others": 0.10
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 性能监控 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实时性能监控</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">系统健康状态</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /analytics/system/health

# 查询参数
?include_details=true  # 包含详细信息
&timeframe=1h         # 监控时间窗口`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">响应示例</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "metrics": {
      "api_response_time": {
        "avg": 0.85,
        "p50": 0.72,
        "p95": 1.45,
        "p99": 2.1
      },
      "throughput": {
        "requests_per_second": 125.3,
        "prompts_per_minute": 450
      },
      "error_rates": {
        "4xx_errors": 0.02,
        "5xx_errors": 0.001,
        "timeout_rate": 0.005
      },
      "resource_usage": {
        "cpu_usage": 0.45,
        "memory_usage": 0.67,
        "disk_usage": 0.23
      }
    },
    "alerts": [
      {
        "level": "warning",
        "message": "响应时间P95超过阈值",
        "threshold": 1.2,
        "current": 1.45,
        "timestamp": "2024-01-01T11:55:00Z"
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 自定义报告 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">自定义分析报告</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">创建自定义报告</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /analytics/reports/custom
Content-Type: application/json

{
  "name": "月度性能报告",
  "description": "每月提示词性能分析报告",
  "filters": {
    "prompt_ids": ["prompt-123", "prompt-456"],
    "categories": ["编程", "文案"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "metrics": [
    "usage_trends",
    "performance_analysis",
    "user_satisfaction",
    "error_analysis"
  ],
  "format": "json",
  "schedule": {
    "frequency": "monthly",
    "day_of_month": 1,
    "time": "09:00"
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">获取报告结果</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /analytics/reports/{report_id}

# 响应
{
  "success": true,
  "data": {
    "report_id": "report-789",
    "name": "月度性能报告",
    "generated_at": "2024-02-01T09:00:00Z",
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "summary": {
      "total_prompts_analyzed": 2,
      "total_usage": 3450,
      "avg_performance_score": 8.7,
      "key_insights": [
        "编程类提示词使用量增长25%",
        "平均响应时间改善15%",
        "用户满意度保持在4.5+水平"
      ]
    },
    "detailed_analysis": {
      "usage_trends": { /* 详细使用趋势数据 */ },
      "performance_analysis": { /* 性能分析数据 */ },
      "user_satisfaction": { /* 用户满意度数据 */ },
      "recommendations": [
        "优化高频使用提示词的响应时间",
        "增加编程类提示词的多样性",
        "改进错误处理机制"
      ]
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 实时事件追踪 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">实时事件追踪</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">记录使用事件</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /analytics/events
Content-Type: application/json

{
  "event_type": "prompt_usage",
  "prompt_id": "prompt-123",
  "user_id": "user-456",
  "session_id": "session-789",
  "timestamp": "2024-01-01T12:00:00Z",
  "metadata": {
    "response_time": 1.2,
    "token_count": 150,
    "success": true,
    "user_rating": 5,
    "device_type": "desktop",
    "location": "Beijing, China"
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">获取实时事件流</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /analytics/events/stream

# WebSocket连接
ws://api.prompthub.com/v1/analytics/events/stream?token=your-token

# 事件消息格式
{
  "event_id": "event-123",
  "event_type": "prompt_usage",
  "prompt_id": "prompt-123",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user_count": 1,
    "response_time": 1.2,
    "success": true
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 数据导出 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">数据导出</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">导出分析数据</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`POST /analytics/export
Content-Type: application/json

{
  "export_type": "usage_data",
  "format": "csv",
  "filters": {
    "prompt_ids": ["prompt-123"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "fields": [
    "timestamp",
    "prompt_id",
    "user_id",
    "response_time",
    "success",
    "rating"
  ]
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">下载导出文件</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`GET /analytics/export/{export_id}/download

# 响应头
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="usage_data_2024-01.csv"

# 文件内容（CSV格式）
timestamp,prompt_id,user_id,response_time,success,rating
2024-01-01T12:00:00Z,prompt-123,user-456,1.2,true,5
2024-01-01T12:05:00Z,prompt-123,user-789,0.9,true,4
...`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📊 性能分析最佳实践</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• 定期监控关键性能指标，及时发现问题</li>
            <li>• 使用合适的时间粒度避免数据过载</li>
            <li>• 结合多个指标进行综合分析</li>
            <li>• 设置性能阈值和告警机制</li>
            <li>• 定期导出数据进行深度分析</li>
            <li>• 关注用户行为模式优化产品体验</li>
          </ul>
        </div>

        {/* 代码示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">代码示例</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">JavaScript 性能监控</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`class PerformanceAnalytics {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.prompthub.com/v1/analytics';
  }

  async getPromptStats(promptId, options = {}) {
    const params = new URLSearchParams({
      period: options.period || '7d',
      granularity: options.granularity || 'day',
      metrics: options.metrics || 'all'
    });

    const response = await fetch(
      \`\${this.baseUrl}/prompts/\${promptId}/stats?\${params}\`,
      {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      }
    );

    return await response.json();
  }

  async comparePrompts(promptIds, period = '30d') {
    const response = await fetch(\`\${this.baseUrl}/prompts/compare\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt_ids: promptIds,
        period,
        metrics: ['usage', 'performance', 'satisfaction']
      })
    });

    return await response.json();
  }

  async trackEvent(eventData) {
    const response = await fetch(\`\${this.baseUrl}/events\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    return await response.json();
  }
}

// 使用示例
const analytics = new PerformanceAnalytics('your-api-key');

// 获取提示词统计
const stats = await analytics.getPromptStats('prompt-123', {
  period: '30d',
  granularity: 'day'
});

console.log(\`平均响应时间: \${stats.data.summary.avg_response_time}s\`);
console.log(\`成功率: \${(stats.data.summary.success_rate * 100).toFixed(1)}%\`);

// 记录使用事件
await analytics.trackEvent({
  event_type: 'prompt_usage',
  prompt_id: 'prompt-123',
  user_id: 'user-456',
  metadata: {
    response_time: 1.2,
    success: true,
    user_rating: 5
  }
});`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Python 数据分析</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto text-sm">
{`import requests
import pandas as pd
from datetime import datetime, timedelta

class PromptAnalytics:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://prompt-hub.cc/api/performance'  # 生产环境
        # self.base_url = 'http://localhost:9011/api/performance'  # 本地开发
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_performance_data(self, prompt_id, days=30):
        """获取性能数据并转换为DataFrame"""
        params = {
            'period': f'{days}d',
            'granularity': 'day',
            'metrics': 'all'
        }
        
        response = requests.get(
            f'{self.base_url}/prompts/{prompt_id}/stats',
            headers=self.headers,
            params=params
        )
        
        data = response.json()
        trends = data['data']['trends']
        
        # 转换为DataFrame便于分析
        df = pd.DataFrame(trends)
        df['date'] = pd.to_datetime(df['date'])
        return df
    
    def analyze_trends(self, df):
        """分析性能趋势"""
        analysis = {
            'usage_trend': df['usage_count'].pct_change().mean(),
            'performance_trend': df['avg_response_time'].pct_change().mean(),
            'satisfaction_trend': df['avg_rating'].pct_change().mean(),
            'peak_usage_day': df.loc[df['usage_count'].idxmax(), 'date'],
            'best_performance_day': df.loc[df['avg_response_time'].idxmin(), 'date']
        }
        return analysis
    
    def export_data(self, prompt_ids, start_date, end_date):
        """导出分析数据"""
        export_request = {
            'export_type': 'usage_data',
            'format': 'csv',
            'filters': {
                'prompt_ids': prompt_ids,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }
        }
        
        response = requests.post(
            f'{self.base_url}/export',
            headers=self.headers,
            json=export_request
        )
        
        return response.json()

# 使用示例
analytics = PromptAnalytics('your-api-key')

# 获取30天性能数据
df = analytics.get_performance_data('prompt-123', days=30)

# 分析趋势
trends = analytics.analyze_trends(df)
print(f"使用量趋势: {trends['usage_trend']:.2%}")
print(f"性能趋势: {trends['performance_trend']:.2%}")

# 导出数据进行进一步分析
start_date = datetime.now() - timedelta(days=30)
end_date = datetime.now()
export_result = analytics.export_data(['prompt-123'], start_date, end_date)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceApiPage; 