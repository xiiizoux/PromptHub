import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '@/lib/api-handler';
import { withApiAuth } from '@/middleware/withApiAuth';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  // 创建互动（点赞、收藏、分享）
  if (req.method === 'POST') {
    try {
      const { promptId, type } = req.body;
      
      if (!promptId || !type) {
        return errorResponse(res, '缺少必要参数: promptId, type');
      }
      
      if (!['like', 'bookmark', 'share'].includes(type)) {
        return errorResponse(res, '无效的互动类型，允许的值: like, bookmark, share');
      }
      
      const result = await mcpProxy('/social/interact', 'POST', { promptId, type });
      return successResponse(res, result.data, `${type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享'}成功`);
    } catch (error: any) {
      console.error('创建互动失败:', error);
      return errorResponse(res, `创建互动失败: ${error.message}`);
    }
  } 
  
  // 删除互动
  else if (req.method === 'DELETE') {
    try {
      const { promptId, type } = req.body;
      
      if (!promptId || !type) {
        return errorResponse(res, '缺少必要参数: promptId, type');
      }
      
      const result = await mcpProxy('/social/remove-interaction', 'POST', { promptId, type });
      return successResponse(res, result.data, `取消${type === 'like' ? '点赞' : type === 'bookmark' ? '收藏' : '分享'}成功`);
    } catch (error: any) {
      console.error('删除互动失败:', error);
      return errorResponse(res, `删除互动失败: ${error.message}`);
    }
  } 
  
  // 获取互动数据
  else if (req.method === 'GET') {
    try {
      const { promptId, type } = req.query;
      
      if (!promptId) {
        return errorResponse(res, '缺少必要参数: promptId');
      }
      
      const result = await mcpProxy(`/social/interactions/${promptId}${type ? `?type=${type}` : ''}`, 'GET');
      return successResponse(res, result.data);
    } catch (error: any) {
      console.error('获取互动数据失败:', error);
      return errorResponse(res, `获取互动数据失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST', 'DELETE'],
  requireAuth: false // GET可以不需要认证，但在处理函数中会区分
});