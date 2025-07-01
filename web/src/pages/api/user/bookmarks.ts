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

    // 先获取用户收藏的提示词ID
    const { data: bookmarkInteractions, error: bookmarkError } = await supabase
      .from('social_interactions')
      .select('prompt_id, created_at')
      .eq('user_id', user.id)
      .eq('type', 'bookmark')
      .order('created_at', { ascending: false });

    if (bookmarkError) {
      console.error('收藏夹API: 查询收藏关系错误:', bookmarkError);
      throw bookmarkError;
    }

    if (!bookmarkInteractions || bookmarkInteractions.length === 0) {
      console.log('收藏夹API: 用户没有收藏任何提示词');
      return res.status(200).json([]);
    }

    // 获取提示词详情
    const promptIds = bookmarkInteractions.map(item => item.prompt_id);
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        content,
        is_public,
        created_at,
        updated_at,
        version,
        user_id
      `)
      .in('id', promptIds);

    if (promptsError) {
      console.error('收藏夹API: 查询提示词详情错误:', promptsError);
      throw promptsError;
    }

    // 获取作者信息
    const authorIds = Array.from(new Set(prompts?.map(p => p.user_id).filter(Boolean) || []));
    let authorMap: Record<string, any> = {};
    
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', authorIds);
      
              if (authors) {
          authorMap = authors.reduce((acc: Record<string, any>, author: any) => {
            if (author.id) {
              acc[author.id] = author;
            }
            return acc;
          }, {});
        }
    }

    // 合并数据并格式化
    const formattedPrompts = bookmarkInteractions.map((bookmark) => {
      const prompt = prompts?.find(p => p.id === bookmark.prompt_id);
      if (!prompt) return null;
      
      const author = prompt.user_id ? authorMap[prompt.user_id] : null;
      return {
        ...prompt,
        author: author?.display_name || '匿名用户',
        bookmarked_at: bookmark.created_at,
      };
    }).filter(Boolean);

    console.log('收藏夹API: 成功获取收藏列表, 数量:', formattedPrompts.length);
    res.status(200).json(formattedPrompts);
  } catch (error: any) {
    console.error('收藏夹API: 服务器错误:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
} 