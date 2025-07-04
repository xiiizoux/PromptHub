/**
 * 标签API路由 - 完全解耦版本
 * 直接使用数据库服务，不依赖MCP服务
 * 
 * GET /api/tags - 获取所有标签
 * GET /api/tags?withStats=true - 获取带使用频率的标签
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { databaseService } from '@/lib/database-service';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      const { withStats } = req.query;
      
      if (withStats === 'true') {
        console.log('获取带统计信息的标签列表');
        // 获取带使用频率的标签
        const tagsWithStats = await databaseService.getTagsWithUsageStats();
        return successResponse(res, tagsWithStats);
      } else {
        console.log('获取标签列表');
        // 使用数据库服务获取标签
        const tags = await databaseService.getTags();
        return successResponse(res, tags);
      }
    } catch (error: any) {
      console.error('获取标签列表失败:', error);
      return errorResponse(res, `获取标签列表失败: ${error.message}`);
    }
  }

  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET'],
  requireAuth: false,
}); 