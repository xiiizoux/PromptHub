import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';
import { logger } from '@/lib/error-handler';

/**
 * 恢复归档提示词API
 * POST /api/prompts/restore
 * Body: { promptId: string }
 */
export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  if (req.method !== 'POST') {
    return errorResponse(res, '不支持的请求方法', ErrorCode.BAD_REQUEST);
  }

  if (!userId) {
    return errorResponse(res, '需要登录才能恢复提示词', ErrorCode.UNAUTHORIZED);
  }

  const { promptId } = req.body;

  if (!promptId || typeof promptId !== 'string') {
    return errorResponse(res, '请提供有效的提示词ID', ErrorCode.BAD_REQUEST);
  }

  try {
    // 使用数据库服务恢复提示词
    const restoreResult = await databaseService.restoreArchivedPrompt(promptId, userId);

    if (!restoreResult.success) {
      return errorResponse(res, restoreResult.message || '恢复提示词失败', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    logger.info('提示词恢复成功', { 
      promptId, 
      userId,
      restoreType: restoreResult.type, 
    });

    return successResponse(res, {
      message: '提示词恢复成功',
      type: restoreResult.type,
      details: restoreResult.details,
      promptId: promptId,
    });
  } catch (error: any) {
    logger.error('恢复提示词失败', error, { promptId, userId });

    if (error.message?.includes('不存在')) {
      return errorResponse(res, '未找到可恢复的归档提示词', ErrorCode.NOT_FOUND);
    }
    if (error.message?.includes('无权限')) {
      return errorResponse(res, '无权限恢复此提示词', ErrorCode.FORBIDDEN);
    }

    return errorResponse(res, '恢复提示词失败: ' + (error.message || '未知错误'), ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: true,
});