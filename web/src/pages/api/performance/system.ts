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

  // 检查是否请求搜索统计
  if (req.query.type === 'search') {
    try {
      const timeRange = (req.query.timeRange as string) || '24h';
      const searchStats = await getSearchOperationStats(timeRange);

      if (searchStats) {
        return res.status(200).json({
          success: true,
          data: searchStats,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: '获取搜索统计失败',
        });
      }
    } catch (error: any) {
      console.error('获取搜索统计失败:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '获取搜索统计失败',
      });
    }
  }

  try {
    // 获取基础统计数据
    const [
      { count: totalPrompts },
      { data: recentUsers },
      { data: recentActivity },
      { data: recentUsage },
    ] = await Promise.all([
      supabase.from('prompts').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('id, last_sign_in_at')
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('prompts')
        .select(`
          id,
          name,
          user_id,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('prompt_usage')
        .select('latency_ms, created_at, prompt_id, client_metadata')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // 计算活跃用户数
    const activeUsers = recentUsers?.length || 0;

    // 分离搜索操作和提示词使用数据
    const searchUsage = recentUsage?.filter(u =>
      u.prompt_id === null && (u.client_metadata?.search_operation === true || u.model === 'mcp_tool')
    ) || [];

    const promptUsage = recentUsage?.filter(u =>
      u.prompt_id !== null
    ) || [];

    // 从真实数据计算平均响应时间（包括搜索和提示词使用）
    let avgResponseTime = 0;
    const allUsage = recentUsage || [];

    if (allUsage.length > 0) {
      const validLatencies = allUsage
        .map(u => u.latency_ms)
        .filter(l => l !== null && l !== undefined);

      if (validLatencies.length > 0) {
        avgResponseTime = Math.round(
          validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length,
        );
      } else {
        // 如果没有实际延迟数据，使用合理的默认值
        avgResponseTime = 800; // 800ms作为默认响应时间
      }
    } else {
      // 如果完全没有使用数据，使用默认值
      avgResponseTime = 600; // 600ms作为初始默认值
    }
    
    // 计算系统健康度（基于真实指标）
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    const totalUsageCount = allUsage.length;
    const searchCount = searchUsage.length;
    const promptUsageCount = promptUsage.length;

    if (avgResponseTime < 500 && activeUsers > 10 && totalUsageCount > 50) {
      systemHealth = 'excellent';
    } else if (avgResponseTime < 1000 && activeUsers > 5 && totalUsageCount > 20) {
      systemHealth = 'good';
    } else if (avgResponseTime < 2000 && totalUsageCount > 5) {
      systemHealth = 'fair';
    } else {
      systemHealth = 'poor';
    }

    // 生成最近活动数据（基于真实提示词数据）
    const recentActivityFormatted = recentActivity?.map((activity, index) => ({
      timestamp: activity.updated_at || activity.created_at,
      prompt_name: activity.name,
      user_id: activity.user_id,
      performance_score: Math.min(100, Math.max(60, 100 - Math.floor(avgResponseTime / 20))), // 基于响应时间计算性能分数
    })) || [];

    const systemData = {
      total_prompts: totalPrompts || 0,
      active_users: activeUsers,
      avg_response_time: avgResponseTime,
      system_health: systemHealth,
      recent_activity: recentActivityFormatted,
      usage_in_last_24h: totalUsageCount, // 总使用量（包括搜索和提示词使用）
      search_operations_24h: searchCount, // 搜索操作数量
      prompt_usage_24h: promptUsageCount, // 提示词使用数量
      search_avg_response_time: searchUsage.length > 0 ?
        Math.round(searchUsage.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / searchUsage.length) : 0,
      prompt_avg_response_time: promptUsage.length > 0 ?
        Math.round(promptUsage.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / promptUsage.length) : 0,
      data_source: allUsage.length > 0 ? 'real_data' : 'default_values',
    };

    console.log('系统性能数据:', {
      totalPrompts,
      activeUsers,
      avgResponseTime,
      systemHealth,
      totalUsageCount,
      searchCount,
      promptUsageCount,
      dataSource: systemData.data_source,
    });

    res.status(200).json({
      success: true,
      data: systemData,
    });
  } catch (error: any) {
    console.error('获取系统性能数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取系统性能数据失败',
    });
  }
}

/**
 * 获取搜索操作统计的辅助函数
 */
export async function getSearchOperationStats(timeRange: string = '24h') {
  const timeRangeMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
  };

  const days = timeRangeMap[timeRange as keyof typeof timeRangeMap] || 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // 获取搜索操作数据
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

    // 统计搜索操作
    const totalSearches = searchData?.length || 0;
    const avgResponseTime = searchData && searchData.length > 0 ?
      Math.round(searchData.reduce((sum, s) => sum + (s.latency_ms || 0), 0) / searchData.length) : 0;

    // 按工具类型分组统计
    const toolStats = new Map<string, { count: number; avgTime: number; totalTime: number }>();

    searchData?.forEach(search => {
      const toolName = search.client_metadata?.toolName || 'unknown';
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
      percentage: Math.round((stats.count / totalSearches) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      totalSearches,
      avgResponseTime,
      toolStats: toolStatsArray,
      timeRange,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('获取搜索操作统计失败:', error);
    return null;
  }
}