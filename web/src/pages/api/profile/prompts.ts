import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import supabaseAdapter from '../../../lib/supabase-adapter';

/**
 * 获取当前用户的提示词列表
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 确保用户已认证
  if (!userId) {
    return errorResponse(res, '未授权访问', ErrorCode.UNAUTHORIZED);
  }

  if (req.method !== 'GET') {
    return errorResponse(res, `不支持的方法: ${req.method}`, ErrorCode.BAD_REQUEST);
  }

  try {
    // 获取查询参数
    const { 
      page = '1', 
      pageSize = '10',
      search = '',
      category = '',
      isPublic = 'false' // 默认获取用户所有提示词（包括私有）
    } = req.query;

    // 构建过滤器
    const filters = {
      userId: userId,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      search: search as string || undefined,
      category: category as string || undefined,
      isPublic: false, // false表示获取该用户的所有提示词（包括私有）
      sortBy: 'latest' as const
    };

    // 获取用户的提示词
    const result = await supabaseAdapter.getPrompts(filters);

    return successResponse(res, {
      prompts: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    });

  } catch (error: any) {
    console.error('获取用户提示词失败:', error);
    return errorResponse(res, `获取用户提示词失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['GET'],
  requireAuth: true
}); 