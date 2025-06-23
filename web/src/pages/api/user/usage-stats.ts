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
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '未授权访问' });
    }

    // 从Authorization header获取token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的授权token' });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取总使用次数
    const { count: totalUsage } = await supabase
      .from('prompt_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 获取本周使用次数
    const { count: thisWeekUsage } = await supabase
      .from('prompt_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    // 获取本月使用次数
    const { count: thisMonthUsage } = await supabase
      .from('prompt_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthAgo.toISOString());

    // 获取最常用的提示词
    const { data: favoritePromptsData } = await supabase
      .from('prompt_usage')
      .select(`
        prompt_id,
        prompts (
          name
        )
      `)
      .eq('user_id', user.id);

    // 统计最常用的提示词
    const promptUsageMap = new Map<string, { name: string; count: number }>();
    favoritePromptsData?.forEach((item: any) => {
      const promptId = item.prompt_id;
      const promptName = item.prompts?.name || '未知提示词';
      
      if (promptUsageMap.has(promptId)) {
        promptUsageMap.get(promptId)!.count++;
      } else {
        promptUsageMap.set(promptId, { name: promptName, count: 1 });
      }
    });

    const favoritePrompts = Array.from(promptUsageMap.entries())
      .map(([promptId, data]) => ({
        prompt_id: promptId,
        prompt_name: data.name,
        usage_count: data.count,
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5);

    // 获取模型使用统计
    const { data: modelUsageData } = await supabase
      .from('prompt_usage')
      .select('model')
      .eq('user_id', user.id);

    const modelUsageMap = new Map<string, number>();
    modelUsageData?.forEach((item: any) => {
      const model = item.model || 'unknown';
      modelUsageMap.set(model, (modelUsageMap.get(model) || 0) + 1);
    });

    const modelStats = Array.from(modelUsageMap.entries())
      .map(([model, count]) => ({
        model,
        usage_count: count,
      }))
      .sort((a, b) => b.usage_count - a.usage_count);

    res.status(200).json({
      success: true,
      totalUsage: totalUsage || 0,
      thisWeekUsage: thisWeekUsage || 0,
      thisMonthUsage: thisMonthUsage || 0,
      favoritePrompts,
      modelStats,
    });
  } catch (error: any) {
    console.error('获取使用统计失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误', 
    });
  }
} 