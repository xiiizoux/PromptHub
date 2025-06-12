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
    
    let userId = null;
    
    // 如果有授权header，获取用户ID
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // 获取点赞和收藏统计
    const { data: interactions, error: statsError } = await supabase
      .from('social_interactions')
      .select('type, user_id')
      .eq('prompt_id', promptId);

    if (statsError) {
      throw statsError;
    }

    const likes = interactions?.filter(i => i.type === 'like').length || 0;
    const bookmarks = interactions?.filter(i => i.type === 'bookmark').length || 0;
    const userLiked = userId ? interactions?.some(i => i.type === 'like' && i.user_id === userId) : false;
    const userBookmarked = userId ? interactions?.some(i => i.type === 'bookmark' && i.user_id === userId) : false;

    res.status(200).json({
      likes,
      bookmarks,
      userLiked: !!userLiked,
      userBookmarked: !!userBookmarked
    });
  } catch (error: any) {
    console.error('获取互动信息失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
} 