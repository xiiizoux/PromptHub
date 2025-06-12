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

    // 获取用户收藏的提示词
    const { data: bookmarkedPrompts, error } = await supabase
      .from('social_interactions')
      .select(`
        created_at,
        prompts (
          id,
          name,
          description,
          category,
          tags,
          messages,
          is_public,
          created_at,
          updated_at,
          version,
          user_id,
          users (
            display_name,
            email
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('type', 'bookmark')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 格式化数据
    const formattedPrompts = bookmarkedPrompts?.map((item: any) => ({
      ...item.prompts,
      author: item.prompts?.users?.display_name || item.prompts?.users?.email || '匿名用户',
      bookmarked_at: item.created_at
    })) || [];

    res.status(200).json(formattedPrompts);
  } catch (error: any) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
} 