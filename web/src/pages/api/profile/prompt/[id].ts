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
    
    return successResponse(res, prompt);
  } catch (error: any) {
    console.error(`获取提示词 ${id} 详情失败:`, error);
    return errorResponse(
      res,
      `获取提示词详情失败: ${error.message}`,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
});
