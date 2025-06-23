import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed', 
    });
  }

  try {
    const { promptId } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空', 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '需要登录才能点赞', 
      });
    }

    // 检查是否已经点赞
    const { data: existingLike, error: checkError } = await supabase
      .from('prompt_likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let liked = false;

    if (existingLike) {
      // 已点赞，取消点赞
      const { error: deleteError } = await supabase
        .from('prompt_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;
      liked = false;
    } else {
      // 未点赞，添加点赞
      const { error: insertError } = await supabase
        .from('prompt_likes')
        .insert({
          prompt_id: promptId,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
      liked = true;
    }

    res.status(200).json({
      success: true,
      liked,
      message: liked ? '点赞成功' : '取消点赞成功',
    });
  } catch (error: any) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '点赞操作失败', 
    });
  }
} 