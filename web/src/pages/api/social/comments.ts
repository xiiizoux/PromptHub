import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '@/lib/api-handler';
import { withApiAuth } from '@/middleware/withApiAuth';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  // 创建评论
  if (req.method === 'POST') {
    try {
      const { promptId, content, parentId } = req.body;
      
      if (!promptId || !content) {
        return errorResponse(res, '缺少必要参数: promptId, content');
      }
      
      const result = await mcpProxy('/social/comments', 'POST', { promptId, content, parentId });
      return successResponse(res, result.data, '评论发表成功');
    } catch (error: any) {
      console.error('创建评论失败:', error);
      return errorResponse(res, `创建评论失败: ${error.message}`);
    }
  } 
  
  // 获取评论
  else if (req.method === 'GET') {
    try {
      const { promptId, page, pageSize } = req.query;
      
      if (!promptId) {
        return errorResponse(res, '缺少必要参数: promptId');
      }
      
      let endpoint = `/social/comments/${promptId}`;
      if (page) {
        endpoint += `?page=${page}`;
        if (pageSize) {
          endpoint += `&pageSize=${pageSize}`;
        }
      }
      
      const result = await mcpProxy(endpoint, 'GET');
      return successResponse(res, result.data);
    } catch (error: any) {
      console.error('获取评论失败:', error);
      return errorResponse(res, `获取评论失败: ${error.message}`);
    }
  }
  
  // 删除评论 (需要认证并验证权限)
  else if (req.method === 'DELETE') {
    try {
      const { commentId } = req.body;
      
      if (!commentId) {
        return errorResponse(res, '缺少必要参数: commentId');
      }
      
      // 调用MCP服务删除评论
      // 注意：这个端点需要在MCP服务中实现
      const result = await mcpProxy('/social/comments/delete', 'POST', { commentId });
      return successResponse(res, result.data, '评论删除成功');
    } catch (error: any) {
      console.error('删除评论失败:', error);
      return errorResponse(res, `删除评论失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST', 'DELETE'],
  requireAuth: false // GET不需要认证，POST和DELETE需要在处理中验证
});