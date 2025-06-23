import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '@/lib/api-handler';
import supabaseAdapter from '@/lib/supabase-adapter';
import { logger } from '@/lib/error-handler';
import { InputValidator, VALIDATION_PRESETS } from '@/lib/input-validator';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { email, password, username } = req.body;

    // 使用新的验证系统
    const validationRules = [
      VALIDATION_PRESETS.email,
      VALIDATION_PRESETS.password,
      { ...VALIDATION_PRESETS.username, required: false }, // 用户名可选
    ];

    const validation = InputValidator.validate(req.body, validationRules);
    if (!validation.isValid) {
      logger.warn('注册输入验证失败', {
        errors: validation.errors,
        email: email?.substring(0, 3) + '***', // 只记录邮箱前缀用于调试
      });
      return errorResponse(res, validation.errors.join('; '), ErrorCode.BAD_REQUEST);
    }

    // 使用清理后的数据进行注册
    const sanitizedData = validation.sanitizedData!;
    const result = await supabaseAdapter.signUp(
      sanitizedData.email,
      sanitizedData.password,
      sanitizedData.username,
    );

    if (!result.user) {
      return errorResponse(res, '注册失败，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR);
    }

    logger.info('用户注册成功', {
      userId: result.user.id,
      email: email.substring(0, 3) + '***',
    });

    return successResponse(res, {
      user: {
        id: result.user.id,
        email: result.user.email,
        username: username,
      },
      message: '注册成功，请检查邮箱进行验证',
    });

  } catch (error: any) {
    logger.error('注册过程中发生错误', error);

    // 处理常见的Supabase错误
    if (error.message?.includes('already registered')) {
      return errorResponse(res, '该邮箱已被注册', ErrorCode.BAD_REQUEST);
    }

    return errorResponse(res, '注册过程中发生错误，请稍后重试', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
});
