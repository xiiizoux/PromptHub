/**
 * 分类API路由 - 完全解耦版本
 * 直接使用数据库服务，不依赖MCP服务
 * 
 * GET /api/categories - 获取所有分类
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      console.log('=== 开始获取分类列表 ===');
      
      // 使用数据库服务获取分类
      const categories = await databaseService.getCategories();
      console.log('数据库返回的分类数据类型:', typeof categories);
      console.log('数据库返回的分类数据长度:', categories.length);
      console.log('数据库返回的分类数据:', JSON.stringify(categories, null, 2));
      
      // 检查第一个元素的类型
      if (categories.length > 0) {
        console.log('第一个分类元素类型:', typeof categories[0]);
        console.log('第一个分类元素:', JSON.stringify(categories[0], null, 2));
      }
      
      // 确保返回对象数组，如果是字符串数组则转换
      let finalCategories = categories;
      if (categories.length > 0 && typeof categories[0] === 'string') {
        console.log('检测到字符串数组，转换为对象数组');
        finalCategories = categories.map((name: string, index: number) => ({
          id: undefined,
          name,
          name_en: undefined,
          alias: undefined,
          description: undefined,
          sort_order: index + 1,
          is_active: true
        }));
      }
      
      console.log('=== 准备返回响应 ===');
      console.log('最终返回的数据:', JSON.stringify(finalCategories, null, 2));
      return successResponse(res, finalCategories);
    } catch (error: any) {
      console.error('获取分类列表失败:', error);
      return errorResponse(res, `获取分类列表失败: ${error.message}`);
    }
  }

  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET'],
  requireAuth: false
}); 