import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../lib/api-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  console.log('测试认证端点被调用');
  console.log('用户ID:', userId);
  console.log('请求头:', req.headers);
  
  return successResponse(res, {
    authenticated: !!userId,
    userId: userId,
    message: userId ? '认证成功' : '认证失败'
  });
}, {
  allowedMethods: ['GET'],
  requireAuth: true
}); 