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
      console.error('收藏夹API: 缺少Authorization头');
      return res.status(401).json({ error: '未授权访问' });
    }

    // 从Authorization header获取token
    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token === 'undefined' || token === 'null') {
      console.error('收藏夹API: 无效的token格式:', token);
      return res.status(401).json({ error: '无效的授权token' });
    }

    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('收藏夹API: Supabase认证错误:', authError);
      return res.status(401).json({ error: '认证失败: ' + authError.message });
    }
    
    if (!user) {
      console.error('收藏夹API: 用户不存在');
      return res.status(401).json({ error: '用户不存在' });
    }

    console.log('收藏夹API: 用户认证成功, user_id:', user.id);

    // 获取用户收藏的提示词，包含提示词详情和作者信息
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('social_interactions')
      .select(`
        id,
        prompt_id,
        type,
        created_at,
        prompts (
          id,
          name,
          description,
          category,
          tags,
          content,
          is_public,
          created_at,
          updated_at,
          user_id,
          users!prompts_user_id_fkey (
            username,
            display_name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('type', 'bookmark')
      .order('created_at', { ascending: false });

    if (bookmarkError) {
      console.error('收藏夹API: 查询收藏关系错误:', bookmarkError);
      throw bookmarkError;
    }

    if (!bookmarks || bookmarks.length === 0) {
      console.log('收藏夹API: 用户没有收藏任何提示词');
      return res.status(200).json([]);
    }

    // 格式化收藏夹数据
    const formattedBookmarks = bookmarks.map((bookmark) => {
      const prompt = bookmark.prompts;
      if (!prompt) return null;

      const author = prompt.users?.display_name || prompt.users?.username || '匿名用户';
      return {
        ...prompt,
        author,
        bookmarked_at: bookmark.created_at,
      };
    }).filter(Boolean);

    console.log('收藏夹API: 成功获取收藏列表, 数量:', formattedBookmarks.length);
    res.status(200).json(formattedBookmarks);
  } catch (error: any) {
    console.error('收藏夹API: 服务器错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
} 