import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '@/lib/api-handler';
import { withApiAuth } from '@/middleware/withApiAuth';

// 扩展NextApiRequest接口以包含用户信息
interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

export default apiHandler(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  // 获取话题列表
  if (req.method === 'GET') {
    try {
      const { page, pageSize } = req.query;
      
      let endpoint = '/social/topics';
      if (page) {
        endpoint += `?page=${page}`;
        if (pageSize) {
          endpoint += `&pageSize=${pageSize}`;
        }
      }
      
      const result = await mcpProxy(endpoint, 'GET');
      return successResponse(res, result.data);
    } catch (error: any) {
      console.error('获取话题列表失败:', error);
      return errorResponse(res, `获取话题列表失败: ${error.message}`);
    }
  } 
  
  // 创建新话题
  else if (req.method === 'POST') {
    try {
      const { title, description } = req.body;
      
      if (!title) {
        return errorResponse(res, '缺少必要参数: title');
      }
      
      if (!req.user?.id) {
        return errorResponse(res, '未授权操作', 401);
      }
      
      const result = await mcpProxy('/social/topics', 'POST', { 
        title, 
        description,
        creator_id: req.user.id
      });
      
      return successResponse(res, result.data, '话题创建成功');
    } catch (error: any) {
      console.error('创建话题失败:', error);
      return errorResponse(res, `创建话题失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST'],
  requireAuth: false // GET不需要认证，POST需要在处理中验证
});