import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '24h' } = req.query;
    
    console.log(`[API] 获取搜索操作统计，时间范围: ${timeRange}`);

    const searchStats = await getSearchOperationStats(timeRange as string);
    
    if (searchStats) {
      res.status(200).json({
        success: true,
        data: searchStats,
      });
    } else {
      res.status(500).json({
        success: false,
        error: '获取搜索统计失败',
      });
    }
  } catch (error: any) {
    console.error('获取搜索统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取搜索统计失败',
    });
  }
}

async function getSearchOperationStats(timeRange: string = '24h') {
  const timeRangeMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
  };

  const days = timeRangeMap[timeRange as keyof typeof timeRangeMap] || 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 获取搜索操作数据 - prompt_id为null且model为mcp_tool的记录
    const { data: searchData, error } = await supabase
      .from('prompt_usage')
      .select('*')
      .is('prompt_id', null) // 搜索操作的prompt_id为null
      .eq('model', 'mcp_tool') // MCP工具调用
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取搜索操作数据失败:', error);
      return null;
    }

    console.log(`[搜索统计] 找到 ${searchData?.length || 0} 条搜索记录`);

    // 统计搜索操作
    const totalSearches = searchData?.length || 0;
    const avgResponseTime = searchData && searchData.length > 0 ? 
      Math.round(searchData.reduce((sum, s) => sum + (s.latency_ms || 0), 0) / searchData.length) : 0;

    // 按工具类型分组统计
    const toolStats = new Map<string, { count: number; avgTime: number; totalTime: number }>();
    
    searchData?.forEach(search => {
      const toolName = search.client_metadata?.toolName || 'unknown_tool';
      const stats = toolStats.get(toolName) || { count: 0, avgTime: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += search.latency_ms || 0;
      stats.avgTime = Math.round(stats.totalTime / stats.count);
      toolStats.set(toolName, stats);
    });

    // 转换为数组格式
    const toolStatsArray = Array.from(toolStats.entries()).map(([tool, stats]) => ({
      tool,
      count: stats.count,
      avgResponseTime: stats.avgTime,
      percentage: totalSearches > 0 ? Math.round((stats.count / totalSearches) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // 按时间分组统计（最近24小时按小时分组，更长时间按天分组）
    const timeSeriesData = generateSearchTimeSeries(searchData || [], days);

    // 响应时间分布
    const responseTimeDistribution = generateResponseTimeDistribution(searchData || []);

    return {
      summary: {
        totalSearches,
        avgResponseTime,
        timeRange,
        periodStart: startDate.toISOString(),
        periodEnd: new Date().toISOString()
      },
      toolStats: toolStatsArray,
      timeSeries: timeSeriesData,
      responseTimeDistribution,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('获取搜索操作统计失败:', error);
    return null;
  }
}

function generateSearchTimeSeries(searchData: any[], days: number) {
  const labels = [];
  const searchCounts = [];
  const avgResponseTimes = [];

  const now = new Date();
  const interval = days <= 1 ? 'hour' : 'day';
  const points = days <= 1 ? 24 : days;

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

    const periodData = searchData.filter(s => {
      const createdAt = new Date(s.created_at);
      return createdAt >= periodStart && createdAt < periodEnd;
    });

    const periodResponseTimes = periodData
      .map(s => s.latency_ms)
      .filter(t => t != null);

    const avgResponseTime = periodResponseTimes.length > 0
      ? Math.round(periodResponseTimes.reduce((a, b) => a + b, 0) / periodResponseTimes.length)
      : 0;

    searchCounts.push(periodData.length);
    avgResponseTimes.push(avgResponseTime);
  }

  return {
    labels,
    searchCounts,
    avgResponseTimes,
  };
}

function generateResponseTimeDistribution(searchData: any[]) {
  const ranges = [
    { label: '< 1s', min: 0, max: 1000 },
    { label: '1-2s', min: 1000, max: 2000 },
    { label: '2-3s', min: 2000, max: 3000 },
    { label: '3-5s', min: 3000, max: 5000 },
    { label: '> 5s', min: 5000, max: Infinity },
  ];

  const distribution = ranges.map(range => {
    const count = searchData.filter(s => 
      s.latency_ms >= range.min && s.latency_ms < range.max
    ).length;
    
    return {
      label: range.label,
      count,
      percentage: searchData.length > 0 ? Math.round((count / searchData.length) * 100) : 0
    };
  });

  return distribution;
}
