import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, timeRange = '7d' } = req.query;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空' 
      });
    }

    const metrics = await getPerformanceMetrics(promptId as string, timeRange as string);

    res.status(200).json({
      success: true,
      metrics,
      generated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('获取性能指标失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取性能指标失败' 
    });
  }
}

async function getPerformanceMetrics(promptId: string, timeRange: string) {
  const timeRangeMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90
  };

  const days = timeRangeMap[timeRange as keyof typeof timeRangeMap] || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 获取使用数据
    const { data: usageData, error: usageError } = await supabase
      .from('prompt_usage')
      .select('*')
      .eq('prompt_id', promptId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (usageError) throw usageError;

    // 获取评分数据
    const { data: ratingData, error: ratingError } = await supabase
      .from('ratings')
      .select('rating, created_at')
      .eq('prompt_id', promptId)
      .gte('created_at', startDate.toISOString());

    if (ratingError) throw ratingError;

    // 计算性能指标
    const metrics = calculateMetrics(usageData || [], ratingData || [], days);
    
    return metrics;
  } catch (error) {
    console.error('查询性能数据失败:', error);
    throw error;
  }
}

function calculateMetrics(usageData: any[], ratingData: any[], days: number) {
  // 响应时间分析
  const responseTimes = usageData.map(u => u.latency_ms).filter(t => t != null);
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // 成功率计算（假设latency_ms存在表示成功）
  const successfulRequests = usageData.filter(u => u.latency_ms != null).length;
  const totalRequests = usageData.length;
  const successRate = totalRequests > 0 
    ? Math.round((successfulRequests / totalRequests) * 100)
    : 100;

  // Token使用分析
  const tokenUsages = usageData
    .map(u => (u.input_tokens || 0) + (u.output_tokens || 0))
    .filter(t => t > 0);
  const avgTokens = tokenUsages.length > 0
    ? Math.round(tokenUsages.reduce((a, b) => a + b, 0) / tokenUsages.length)
    : 0;

  // 用户满意度
  const ratings = ratingData.map(r => r.rating);
  const userSatisfaction = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;

  // 时间序列数据
  const timeSeriesData = generateTimeSeries(usageData, days);

  // 使用量分布
  const usageDistribution = generateUsageDistribution(usageData);

  // 趋势分析（简化版）
  const responseTimeTrend = calculateTrend(timeSeriesData.response_times);
  const successRateTrend = 'stable'; // 简化处理
  const tokenUsageTrend = 'stable'; // 简化处理
  const satisfactionTrend = 'stable'; // 简化处理

  // 综合评分算法
  const overallScore = calculateOverallScore({
    avgResponseTime,
    successRate,
    userSatisfaction,
    usageCount: usageData.length
  });

  return {
    overall_score: overallScore,
    avg_response_time: avgResponseTime,
    response_time_trend: responseTimeTrend,
    response_time_change: calculateChange(timeSeriesData.response_times),
    success_rate: successRate,
    success_rate_trend: successRateTrend,
    success_rate_change: 0,
    avg_tokens: avgTokens,
    token_usage_trend: tokenUsageTrend,
    user_satisfaction: userSatisfaction,
    satisfaction_trend: satisfactionTrend,
    satisfaction_count: ratings.length,
    time_series: timeSeriesData,
    usage_distribution: usageDistribution
  };
}

function generateTimeSeries(usageData: any[], days: number) {
  const labels = [];
  const response_times = [];
  const usage_counts = [];

  const now = new Date();
  const interval = days <= 7 ? 'hour' : 'day';
  const points = days <= 7 ? 24 : days;

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    if (interval === 'hour') {
      date.setHours(date.getHours() - i);
      labels.push(date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    } else {
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }

    // 计算该时间段的数据
    const periodStart = new Date(date);
    const periodEnd = new Date(date);
    if (interval === 'hour') {
      periodEnd.setHours(periodEnd.getHours() + 1);
    } else {
      periodEnd.setDate(periodEnd.getDate() + 1);
    }

    const periodData = usageData.filter(u => {
      const createdAt = new Date(u.created_at);
      return createdAt >= periodStart && createdAt < periodEnd;
    });

    const periodResponseTimes = periodData
      .map(u => u.latency_ms)
      .filter(t => t != null);
    
    const avgResponseTime = periodResponseTimes.length > 0
      ? periodResponseTimes.reduce((a, b) => a + b, 0) / periodResponseTimes.length
      : null;

    response_times.push(avgResponseTime);
    usage_counts.push(periodData.length);
  }

  return {
    labels,
    response_times: response_times.map(t => t || 0),
    usage_counts
  };
}

function generateUsageDistribution(usageData: any[]) {
  // 按小时分布
  const hours = Array(24).fill(0);
  
  usageData.forEach(usage => {
    const hour = new Date(usage.created_at).getHours();
    hours[hour]++;
  });

  const labels = [];
  const values = [];
  
  // 按6小时分组
  for (let i = 0; i < 24; i += 6) {
    const periodSum = hours.slice(i, i + 6).reduce((a, b) => a + b, 0);
    labels.push(`${i}:00-${i + 6}:00`);
    values.push(periodSum);
  }

  return { labels, values };
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const validValues = values.filter(v => v > 0);
  if (validValues.length < 2) return 'stable';
  
  const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
  const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
}

function calculateChange(values: number[]): number {
  if (values.length < 2) return 0;
  
  const validValues = values.filter(v => v > 0);
  if (validValues.length < 2) return 0;
  
  const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
  const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

function calculateOverallScore(metrics: {
  avgResponseTime: number;
  successRate: number;
  userSatisfaction: number;
  usageCount: number;
}): number {
  let score = 0;

  // 响应时间评分 (30%)
  if (metrics.avgResponseTime === 0) {
    score += 30;
  } else if (metrics.avgResponseTime < 500) {
    score += 30;
  } else if (metrics.avgResponseTime < 1000) {
    score += 25;
  } else if (metrics.avgResponseTime < 2000) {
    score += 20;
  } else {
    score += 10;
  }

  // 成功率评分 (25%)
  score += (metrics.successRate / 100) * 25;

  // 用户满意度评分 (25%)
  score += (metrics.userSatisfaction / 5) * 25;

  // 使用量评分 (20%)
  if (metrics.usageCount > 100) {
    score += 20;
  } else if (metrics.usageCount > 50) {
    score += 15;
  } else if (metrics.usageCount > 10) {
    score += 10;
  } else {
    score += 5;
  }

  return Math.round(Math.min(score, 100));
} 