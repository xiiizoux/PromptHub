import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../../lib/api-handler';
import supabaseAdapter from '../../../../lib/supabase-adapter';

/**
 * 获取用户的私有提示词详情，无论公开或私有
 * 这个API用于用户在个人管理页面查看自己的提示词详情
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 确保用户已认证
  if (!userId) {
    return errorResponse(res, '未授权访问', ErrorCode.UNAUTHORIZED);
  }

  // 获取提示词ID
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return errorResponse(res, '必须提供有效的提示词ID', ErrorCode.BAD_REQUEST);
  }

  if (req.method !== 'GET') {
    return errorResponse(res, `不支持的方法: ${req.method}`, ErrorCode.BAD_REQUEST);
  }

  try {
    console.log(`用户 ${userId} 正在请求私有提示词详情:`, id);

    // 使用适配器获取提示词详情（仅限用户自己的提示词）
    const prompt = await supabaseAdapter.getPrompt(id, userId);

    if (!prompt) {
      return errorResponse(res, '提示词不存在或您无权访问', ErrorCode.NOT_FOUND);
    }

    // 验证这是否是用户自己的提示词
    if (prompt.user_id !== userId) {
      return errorResponse(res, '您无权访问此提示词', ErrorCode.FORBIDDEN);
    }

    // 获取作者信息
    let authorName = '未知用户';
    if (prompt.user_id) {
      try {
        console.log(`[Profile API] 开始获取用户信息，用户ID: ${prompt.user_id}`);
        const { data: userData, error: userError } = await supabaseAdapter.supabase
          .from('users')
          .select('display_name')
          .eq('id', prompt.user_id)
          .maybeSingle(); // 使用 maybeSingle() 而不是 single()

        if (userError) {
          console.warn('获取用户信息时发生错误:', userError);
        } else if (userData && userData.display_name) {
          authorName = userData.display_name;
          console.log(`[Profile API] 成功获取用户信息: ${authorName}`);
        } else {
          console.warn(`[Profile API] 用户 ${prompt.user_id} 不存在或没有 display_name`);
        }
      } catch (userErr) {
        console.warn('获取用户信息失败，使用默认作者名:', userErr);
      }
    }

    // 返回包含作者信息的提示词数据
    const promptWithAuthor = {
      ...prompt,
      author: authorName,
    };

    return successResponse(res, promptWithAuthor);
  } catch (error: any) {
    console.error(`获取提示词 ${id} 详情失败:`, error);
    return errorResponse(
      res,
      `获取提示词详情失败: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR,
    );
  }
});
