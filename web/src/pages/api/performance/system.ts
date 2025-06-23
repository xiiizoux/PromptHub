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
        .select('latency_ms, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // 计算活跃用户数
    const activeUsers = recentUsers?.length || 0;

    // 从真实数据计算平均响应时间
    let avgResponseTime = 0;
    if (recentUsage && recentUsage.length > 0) {
      const validLatencies = recentUsage
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
    const usageCount = recentUsage?.length || 0;
    
    if (avgResponseTime < 500 && activeUsers > 10 && usageCount > 50) {
      systemHealth = 'excellent';
    } else if (avgResponseTime < 1000 && activeUsers > 5 && usageCount > 20) {
      systemHealth = 'good';
    } else if (avgResponseTime < 2000 && usageCount > 5) {
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
      usage_in_last_24h: usageCount, // 添加24小时使用量
      data_source: recentUsage && recentUsage.length > 0 ? 'real_data' : 'default_values',
    };

    console.log('系统性能数据:', {
      totalPrompts,
      activeUsers,
      avgResponseTime,
      systemHealth,
      usageCount,
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