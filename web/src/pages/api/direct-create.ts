import type { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';
import { logger } from '@/lib/error-handler';
import { InputValidator, VALIDATION_PRESETS } from '@/lib/input-validator';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  try {
    // 使用新的验证系统
    const validationRules = [
      VALIDATION_PRESETS.promptName,
      VALIDATION_PRESETS.promptDescription,
      VALIDATION_PRESETS.promptCategory,
      { ...VALIDATION_PRESETS.promptTags, required: false },
      { field: 'messages', required: true, type: 'array' as const, minLength: 1 },
      { ...VALIDATION_PRESETS.userId, field: 'user_id', required: false },
      { ...VALIDATION_PRESETS.isPublic, required: false }
    ];

    const validation = InputValidator.validate(req.body, validationRules);
    if (!validation.isValid) {
      logger.warn('创建提示词输入验证失败', {
        errors: validation.errors,
        userId
      });
      return errorResponse(res, validation.errors.join('; '), ErrorCode.BAD_REQUEST);
    }

    // 使用清理后的数据
    const sanitizedData = validation.sanitizedData!;
    const {
      name,
      description,
      category,
      tags,
      messages,
      is_public,
      user_id
    } = sanitizedData;

    // 使用提供的user_id或当前认证用户的ID
    const finalUserId = user_id || userId;

    if (!finalUserId) {
      return errorResponse(res, '需要提供用户ID或进行身份认证', ErrorCode.UNAUTHORIZED);
    }

    // 准备提示词数据
    const promptData = {
      name,
      description,
      category,
      tags: tags || [],
      messages,
      is_public: is_public !== undefined ? is_public : true,
      user_id: finalUserId,
      version: 1
    };

    // 使用数据库服务创建提示词
    const newPrompt = await databaseService.createPrompt(promptData);

    logger.info('提示词创建成功', {
      promptId: newPrompt.id,
      name: newPrompt.name,
      userId: finalUserId
    });

    return successResponse(res, { prompt: newPrompt });

  } catch (error: any) {
    logger.error('创建提示词失败', error, { userId });

    if (error.message?.includes('已存在')) {
      return errorResponse(res, '提示词名称已存在', ErrorCode.BAD_REQUEST);
    }
    if (error.message?.includes('权限')) {
      return errorResponse(res, '权限不足', ErrorCode.FORBIDDEN);
    }

    return errorResponse(res, '创建提示词失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
  requireAuth: false // 允许通过user_id参数或认证两种方式
});
