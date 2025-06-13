/**
 * 分类API路由 - 直接查询版本
 * 
 * GET /api/categories - 获取所有分类
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { createClient } from '@supabase/supabase-js';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      console.log('=== 开始获取分类列表 ===');
      
      // 直接使用环境变量创建Supabase客户端
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return errorResponse(res, 'Supabase配置缺失');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 直接查询categories表，获取所有分类
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, name_en, icon, description, sort_order, is_active')
        .order('sort_order');

      console.log('数据库查询结果:', {
        error: categoriesError,
        dataLength: categoriesData?.length || 0
      });

      if (!categoriesError && categoriesData && categoriesData.length > 0) {
        console.log('成功获取分类数据，数量:', categoriesData.length);
        console.log('分类列表:', categoriesData.map(c => c.name));
        return successResponse(res, categoriesData);
      }

      // 如果查询失败，返回错误
      console.error('获取分类失败:', categoriesError);
      return errorResponse(res, `获取分类失败: ${categoriesError?.message || '未知错误'}`);
      
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