/**
 * 标签API路由
 * GET /api/tags - 获取所有标签
 * 通过Next.js API Routes调用数据库
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '../../lib/api-handler';
import { supabaseAdapter } from '../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // 从数据库获取标签
      const tags = await supabaseAdapter.getTags();
      
      return successResponse(res, tags);
    } catch (error) {
      console.error('从数据库获取标签失败:', error);
      return errorResponse(res, '获取标签失败');
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET']
}); 