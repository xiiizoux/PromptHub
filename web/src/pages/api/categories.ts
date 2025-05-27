/**
 * 分类API路由
 * GET /api/categories - 获取所有分类
 * 专门调用数据库的类别表
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '../../lib/api-handler';
import { supabaseAdapter } from '../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // 直接从数据库的专门类别表获取分类
      const categories = await supabaseAdapter.getCategories();
      
      return successResponse(res, categories);
    } catch (error) {
      console.error('从数据库获取分类失败:', error);
      return errorResponse(res, '获取分类失败');
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET']
}); 