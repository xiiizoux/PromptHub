import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId } = req.body;
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

    // 检查是否已收藏
    const { data: existingBookmark, error: checkError } = await supabase
      .from('social_interactions')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', user.id)
      .eq('type', 'bookmark')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let bookmarked = false;

    if (existingBookmark) {
      // 如果已收藏，则取消收藏
      const { error: deleteError } = await supabase
        .from('social_interactions')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', user.id)
        .eq('type', 'bookmark');

      if (deleteError) throw deleteError;
      bookmarked = false;
    } else {
      // 如果未收藏，则添加收藏
      const { error: insertError } = await supabase
        .from('social_interactions')
        .insert({
          prompt_id: promptId,
          user_id: user.id,
          type: 'bookmark'
        });

      if (insertError) throw insertError;
      bookmarked = true;
    }

    res.status(200).json({ bookmarked });
  } catch (error: any) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
} 