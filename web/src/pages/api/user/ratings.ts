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

    // 获取用户的所有评分
    const { data: ratingsData, error } = await supabase
      .from('prompt_feedback')
      .select(`
        id,
        rating,
        feedback_text,
        created_at,
        updated_at,
        prompt_id,
        prompts (
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedRatings = (ratingsData || []).map((item: any) => ({
      id: item.id,
      prompt_id: item.prompt_id,
      prompt_name: item.prompts?.name || '未知提示词',
      rating: item.rating,
      comment: item.feedback_text,
      feedback_text: item.feedback_text, // 保持向后兼容
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at
    }));

    res.status(200).json({
      success: true,
      ratings: formattedRatings,
      total: formattedRatings.length
    });
  } catch (error: any) {
    console.error('获取用户评分失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 