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
    const { promptId } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: '未授权访问' });
    }

    if (!promptId) {
      return res.status(400).json({ error: '缺少promptId参数' });
    }

    // 从Authorization header获取token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的授权token' });
    }

    // 获取用户评分
    const { data: rating, error } = await supabase
      .from('prompt_feedback')
      .select(`
        id,
        rating,
        feedback_text,
        created_at,
        updated_at
      `)
      .eq('prompt_id', promptId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!rating) {
      return res.status(200).json({
        success: true,
        rating: null
      });
    }

    // 格式化数据
    const formattedRating = {
      id: rating.id,
      prompt_id: promptId,
      user_id: user.id,
      rating: rating.rating,
      comment: rating.feedback_text,
      created_at: rating.created_at,
      updated_at: rating.updated_at || rating.created_at,
      user: {
        display_name: user.user_metadata?.display_name,
        email: user.email
      }
    };

    res.status(200).json({
      success: true,
      rating: formattedRating
    });
  } catch (error: any) {
    console.error('获取用户评分失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 