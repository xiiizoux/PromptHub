/**
 * 分类API路由 - 直接查询版本
 * 
 * GET /api/categories - 获取所有分类
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';
import { logger } from '@/lib/error-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    logger.info('获取分类列表请求');

    // 使用数据库服务获取分类
    const categories = await databaseService.getCategories();

    logger.info('成功获取分类数据', { count: categories.length });
    return successResponse(res, categories);

  } catch (error: any) {
    logger.error('获取分类列表失败', error);

    // 根据错误类型返回不同的错误码
    if (error.message?.includes('配置')) {
      return errorResponse(res, '服务配置错误', ErrorCode.INTERNAL_SERVER_ERROR);
    }
    if (error.message?.includes('连接')) {
      return errorResponse(res, '数据库连接失败', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return errorResponse(res, '获取分类列表失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['GET'],
  requireAuth: false,
  enableCache: true,
  cacheTTL: 300, // 缓存5分钟
});