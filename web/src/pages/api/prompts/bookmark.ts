import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { promptId } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '需要登录才能收藏' 
      });
    }

    // 检查是否已经收藏
    const { data: existingBookmark, error: checkError } = await supabase
      .from('prompt_bookmarks')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let bookmarked = false;

    if (existingBookmark) {
      // 已收藏，取消收藏
      const { error: deleteError } = await supabase
        .from('prompt_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) throw deleteError;
      bookmarked = false;
    } else {
      // 未收藏，添加收藏
      const { error: insertError } = await supabase
        .from('prompt_bookmarks')
        .insert({
          prompt_id: promptId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      bookmarked = true;
    }

    res.status(200).json({
      success: true,
      bookmarked,
      message: bookmarked ? '收藏成功' : '取消收藏成功'
    });
  } catch (error: any) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '收藏操作失败' 
    });
  }
} 