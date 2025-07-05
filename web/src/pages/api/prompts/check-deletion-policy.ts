import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';
import { logger } from '@/lib/error-handler';

/**
 * 检查提示词删除策略API
 * POST /api/prompts/check-deletion-policy
 * Body: { promptId: string }
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  if (req.method !== 'POST') {
    return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
  }

  if (!userId) {
    return errorResponse(res, '需要登录才能检查删除策略', ErrorCode.UNAUTHORIZED);
  }

  const { promptId } = req.body;

  if (!promptId || typeof promptId !== 'string') {
    return errorResponse(res, '请提供有效的提示词ID', ErrorCode.BAD_REQUEST);
  }

  try {
    // 使用数据库服务检查删除策略
    const policyResult = await databaseService.checkDeletionPolicy(promptId, userId);

    logger.info('删除策略检查完成', { 
      promptId, 
      userId,
      canDelete: policyResult.canDelete,
      mustArchive: policyResult.mustArchive,
      contextUsersCount: policyResult.contextUsersCount
    });

    return successResponse(res, {
      canDelete: policyResult.canDelete,
      mustArchive: policyResult.mustArchive,
      reason: policyResult.reason,
      contextUsersCount: policyResult.contextUsersCount,
      promptId: promptId
    });
  } catch (error: any) {
    logger.error('检查删除策略失败', error, { promptId, userId });

    if (error.message?.includes('不存在')) {
      return errorResponse(res, '未找到指定的提示词', ErrorCode.NOT_FOUND);
    }
    if (error.message?.includes('无权限')) {
      return errorResponse(res, '无权限操作此提示词', ErrorCode.FORBIDDEN);
    }

    return errorResponse(res, '检查删除策略失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
});