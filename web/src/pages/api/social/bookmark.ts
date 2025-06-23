import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return errorResponse(res, `不支持的方法: ${req.method}`, 405);
  }

  try {
    const { promptId } = req.body;
    
    if (!promptId) {
      return errorResponse(res, '缺少必要参数: promptId', 400);
    }

    // 用户信息在中间件中已设置
    const user = (req as any).user;
    if (!user?.id) {
      return errorResponse(res, '需要登录才能进行此操作', 401);
    }

    const supabase = getSupabaseServerClient();
    const userId = user.id;

    // 检查是否已收藏
    const { data: existingBookmark } = await supabase
      .from('social_interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .eq('type', 'bookmark')
      .single();

    if (existingBookmark) {
      // 已收藏，则取消收藏
      const { error } = await supabase
        .from('social_interactions')
        .delete()
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .eq('type', 'bookmark');

      if (error) {
        throw new Error(`取消收藏失败: ${error.message}`);
      }

      return successResponse(res, { bookmarked: false }, '已取消收藏');
    } else {
      // 未收藏，则添加收藏
      const { error } = await supabase
        .from('social_interactions')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          type: 'bookmark',
        });

      if (error) {
        throw new Error(`添加收藏失败: ${error.message}`);
      }

      return successResponse(res, { bookmarked: true }, '已添加到收藏');
    }
  } catch (error: any) {
    console.error('收藏操作失败:', error);
    return errorResponse(res, error.message || '收藏操作失败');
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
}); 