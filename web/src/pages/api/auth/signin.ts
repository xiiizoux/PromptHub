/**
 * 用户登录API路由
 * POST /api/auth/signin
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import supabaseAdapter from '../../../lib/supabase-adapter';
import { UserApi } from '@/types/api';
import { InputValidator, VALIDATION_PRESETS, DataSanitizer } from '@/lib/input-validator';
import { logger } from '@/lib/error-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // 使用验证系统
    const validationRules = [
      { field: 'email', required: true, type: 'string' as const, maxLength: 255 },
      { field: 'password', required: true, type: 'string' as const, minLength: 1, maxLength: 128 },
    ];

    const validation = InputValidator.validate(req.body, validationRules);
    if (!validation.isValid) {
      logger.warn('登录输入验证失败', {
        errors: validation.errors,
        email: req.body.email?.substring(0, 3) + '***',
      });
      return errorResponse(res, validation.errors.join('; '), ErrorCode.BAD_REQUEST);
    }

    const { email, password } = validation.sanitizedData!;
    
    // 调用Supabase适配器进行登录
    const authResult = await supabaseAdapter.signIn(email, password);
    
    if (!authResult.user) {
      return errorResponse(res, '邮箱或密码不正确', ErrorCode.UNAUTHORIZED);
    }
    
    // 返回用户信息和令牌
    return successResponse(res, {
      user: authResult.user,
      token: authResult.token || '',
    }, '登录成功');
  } catch (error: any) {
    console.error('登录失败:', error);
    return errorResponse(res, `登录失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST'],
});
