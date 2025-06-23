import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed', 
    });
  }

  try {
    const { promptId } = req.query;
    const userId = req.headers['user-id'] as string;

    if (!promptId || typeof promptId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空', 
      });
    }

    // 获取点赞数
    const { data: likes, error: likesError } = await supabase
      .from('prompt_likes')
      .select('*')
      .eq('prompt_id', promptId);

    if (likesError) throw likesError;

    // 获取收藏数
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('prompt_bookmarks')
      .select('*')
      .eq('prompt_id', promptId);

    if (bookmarksError) throw bookmarksError;

    // 检查用户是否已点赞和收藏
    let userLiked = false;
    let userBookmarked = false;

    if (userId) {
      const { data: userLike } = await supabase
        .from('prompt_likes')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .single();

      const { data: userBookmark } = await supabase
        .from('prompt_bookmarks')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .single();

      userLiked = !!userLike;
      userBookmarked = !!userBookmark;
    }

    res.status(200).json({
      success: true,
      likes: likes?.length || 0,
      bookmarks: bookmarks?.length || 0,
      userLiked,
      userBookmarked,
    });
  } catch (error: any) {
    console.error('获取互动信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取互动信息失败', 
    });
  }
} 