import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// 内联社交扩展功能，避免跨目录导入问题
const createSocialExtensions = (supabase: any) => ({
  async createSocialInteraction(userId: string, promptId: string, type: string) {
    if (!['like', 'bookmark', 'share'].includes(type)) {
      throw new Error(`无效的互动类型: ${type}`);
    }

    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id')
      .eq('id', promptId)
      .single();

    if (promptError || !prompt) {
      throw new Error(`提示词不存在: ${promptId}`);
    }

    const { data: existingInteraction } = await supabase
      .from('social_interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .eq('type', type)
      .single();

    if (existingInteraction) {
      return existingInteraction;
    }

    const { data, error } = await supabase
      .from('social_interactions')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        type,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建社交互动失败: ${error.message}`);
    }

    return data;
  },

  async removeSocialInteraction(userId: string, promptId: string, type: string) {
    const { error } = await supabase
      .from('social_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .eq('type', type);

    if (error) {
      throw new Error(`删除社交互动失败: ${error.message}`);
    }

    return true;
  },

  async getPromptInteractions(promptId: string, type?: string, userId?: string) {
    let query = supabase
      .from('social_interactions')
      .select('type')
      .eq('prompt_id', promptId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取互动数据失败: ${error.message}`);
    }

    const counts = {
      likes: data.filter((i: any) => i.type === 'like').length,
      bookmarks: data.filter((i: any) => i.type === 'bookmark').length,
      shares: data.filter((i: any) => i.type === 'share').length,
    };

    let userInteraction;
    if (userId) {
      const { data: userInteractions, error: userError } = await supabase
        .from('social_interactions')
        .select('type')
        .eq('prompt_id', promptId)
        .eq('user_id', userId);

      if (!userError) {
        userInteraction = {
          liked: userInteractions.some((i: any) => i.type === 'like'),
          bookmarked: userInteractions.some((i: any) => i.type === 'bookmark'),
          shared: userInteractions.some((i: any) => i.type === 'share'),
        };
      }
    }

    return {
      likes: counts.likes,
      bookmarks: counts.bookmarks,
      shares: counts.shares,
      userLiked: userInteraction?.liked || false,
      userBookmarked: userInteraction?.bookmarked || false,
      userShared: userInteraction?.shared || false,
    };
  },
});

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  // 手动处理认证逻辑，因为不同方法需要不同的认证要求
  let user = null;
  const supabase = getSupabaseServerClient();
  const socialExt = createSocialExtensions(supabase);
  
  // 尝试从请求中获取用户信息
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (!error && authUser) {
        user = authUser;
        (req as any).user = { id: authUser.id, email: authUser.email };
      }
    } catch (error) {
      console.warn('认证失败:', error);
    }
  }

  // 创建互动（点赞、收藏、分享）
  if (req.method === 'POST') {
    try {
      const { promptId, type } = req.body;
      
      if (!promptId || !type) {
        return errorResponse(res, '缺少必要参数: promptId, type');
      }
      
      if (!['like', 'bookmark', 'share'].includes(type)) {
        return errorResponse(res, '无效的互动类型，允许的值: like, bookmark, share');
      }
      
      // POST请求必须认证
      if (!user?.id) {
        return errorResponse(res, '需要登录才能进行此操作', 401);
      }
      
      const userId = user.id;
      
      // 使用socialExtensions创建互动
      const interaction = await socialExt.createSocialInteraction(userId, promptId, type);
      
      return successResponse(res, { interaction }, `${type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享'}成功`);
    } catch (error: any) {
      console.error('创建互动失败:', error);
      return errorResponse(res, `创建互动失败: ${error.message}`);
    }
  }
  
  // 删除互动
  else if (req.method === 'DELETE') {
    try {
      const { promptId, type } = req.body;
      
      if (!promptId || !type) {
        return errorResponse(res, '缺少必要参数: promptId, type');
      }
      
      // DELETE请求必须认证
      if (!user?.id) {
        return errorResponse(res, '需要登录才能进行此操作', 401);
      }
      
      const userId = user.id;
      
      // 使用socialExtensions删除互动
      const result = await socialExt.removeSocialInteraction(userId, promptId, type);
      
      return successResponse(res, { removed: result }, `取消${type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享'}成功`);
    } catch (error: any) {
      console.error('删除互动失败:', error);
      return errorResponse(res, `删除互动失败: ${error.message}`);
    }
  } 
  
  // 获取互动数据
  else if (req.method === 'GET') {
    try {
      const { promptId, type } = req.query;
      
      if (!promptId) {
        return errorResponse(res, '缺少必要参数: promptId');
      }
      
      // GET请求可以不认证，但如果有用户信息则传递给socialExtensions
      const userId = user?.id;
      
      // 使用socialExtensions获取互动数据
      const interactions = await socialExt.getPromptInteractions(
        promptId as string, 
        type as string | undefined, 
        userId,
      );
      
      return successResponse(res, interactions);
    } catch (error: any) {
      console.error('获取互动数据失败:', error);
      return errorResponse(res, `获取互动数据失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST', 'DELETE'],
  requireAuth: false, // 在处理函数中手动处理认证逻辑
});