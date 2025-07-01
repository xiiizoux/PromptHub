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
    const { type, namesOnly } = req.query;
    logger.info('获取分类列表请求', { type, namesOnly });

    // 根据参数决定返回完整信息还是仅名称
    if (namesOnly === 'true') {
      // 向后兼容：仅返回分类名称
      const categoryNames = await databaseService.getCategoryNames(type as string);
      logger.info('成功获取分类名称', { count: categoryNames.length, type });
      return successResponse(res, categoryNames);
    } else {
      // 返回完整的分类信息（包含icon等字段）
      const categories = await databaseService.getCategories(type as string);
      logger.info('成功获取完整分类数据', { count: categories.length, type });
      return successResponse(res, categories);
    }

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