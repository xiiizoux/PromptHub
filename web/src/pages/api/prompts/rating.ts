import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { promptId } = req.body || req.query;
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

    if (req.method === 'POST') {
      // 提交评分
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: '评分必须在1-5之间' });
      }

      // 检查是否已经评分过
      const { data: existingRating, error: checkError } = await supabase
        .from('prompt_ratings')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRating) {
        // 更新现有评分
        const { error: updateError } = await supabase
          .from('prompt_ratings')
          .update({
            rating,
            comment: comment || null,
            updated_at: new Date().toISOString()
          })
          .eq('prompt_id', promptId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // 创建新评分
        const { error: insertError } = await supabase
          .from('prompt_ratings')
          .insert({
            prompt_id: promptId,
            user_id: user.id,
            rating,
            comment: comment || null
          });

        if (insertError) throw insertError;
      }

      res.status(200).json({ success: true });
    } else if (req.method === 'PUT') {
      // 更新评分
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: '评分必须在1-5之间' });
      }

      const { error: updateError } = await supabase
        .from('prompt_ratings')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('prompt_id', promptId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      res.status(200).json({ success: true });
    } else if (req.method === 'DELETE') {
      // 删除评分
      const { error: deleteError } = await supabase
        .from('prompt_ratings')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('评分操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 