import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '@/lib/api-handler';
import { withApiAuth } from '@/middleware/withApiAuth';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return errorResponse(res, '缺少必要参数: userId');
      }
      
      const result = await mcpProxy('/social/follow', 'POST', { userId });
      return successResponse(res, result.data, '关注成功');
    } catch (error: any) {
      console.error('关注用户失败:', error);
      return errorResponse(res, `关注用户失败: ${error.message}`);
    }
  } else if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return errorResponse(res, '缺少必要参数: userId');
      }
      
      const result = await mcpProxy('/social/unfollow', 'POST', { userId });
      return successResponse(res, result.data, '取消关注成功');
    }
    catch (error: any) {
      console.error('取消关注用户失败:', error);
      return errorResponse(res, `取消关注用户失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['POST', 'DELETE'],
  requireAuth: true
});