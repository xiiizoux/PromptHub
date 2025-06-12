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
    // 获取基础统计数据
    const [
      { count: totalPrompts },
      { data: recentUsers },
      { data: recentActivity }
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
        .limit(10)
    ]);

    // 计算活跃用户数
    const activeUsers = recentUsers?.length || 0;

    // 模拟性能数据（在实际应用中应该从监控系统获取）
    const avgResponseTime = Math.floor(Math.random() * 500) + 200; // 200-700ms
    
    // 计算系统健康度
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgResponseTime < 300 && activeUsers > 10) {
      systemHealth = 'excellent';
    } else if (avgResponseTime < 500 && activeUsers > 5) {
      systemHealth = 'good';
    } else if (avgResponseTime < 800) {
      systemHealth = 'fair';
    } else {
      systemHealth = 'poor';
    }

    // 生成最近活动数据
    const recentActivityFormatted = recentActivity?.map((activity, index) => ({
      timestamp: activity.updated_at || activity.created_at,
      prompt_name: activity.name,
      user_id: activity.user_id,
      performance_score: Math.floor(Math.random() * 40) + 60 // 60-100
    })) || [];

    const systemData = {
      total_prompts: totalPrompts || 0,
      active_users: activeUsers,
      avg_response_time: avgResponseTime,
      system_health: systemHealth,
      recent_activity: recentActivityFormatted
    };

    res.status(200).json({
      success: true,
      data: systemData
    });
  } catch (error: any) {
    console.error('获取系统性能数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取系统性能数据失败' 
    });
  }
} 