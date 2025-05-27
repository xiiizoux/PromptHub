/**
 * 用户登录API路由
 * POST /api/auth/signin
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import supabaseAdapter from '../../../lib/supabase-adapter';
import { UserApi } from '@/types/api';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return errorResponse(res, `不支持的方法: ${req.method}`, ErrorCode.BAD_REQUEST);
  }
  
  try {
    const { email, password } = req.body as UserApi.SignInRequest;
    
    // 验证请求数据
    if (!email || !password) {
      return errorResponse(res, '邮箱和密码是必填项', ErrorCode.BAD_REQUEST);
    }
    
    // 调用Supabase适配器进行登录
    const authResult = await supabaseAdapter.signIn(email, password);
    
    if (!authResult.user) {
      return errorResponse(res, '邮箱或密码不正确', ErrorCode.UNAUTHORIZED);
    }
    
    // 返回用户信息和令牌
    return successResponse(res, {
      user: authResult.user,
      token: authResult.token || ''
    }, '登录成功');
  } catch (error: any) {
    console.error('登录失败:', error);
    return errorResponse(res, `登录失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}, {
  allowedMethods: ['POST']
});
