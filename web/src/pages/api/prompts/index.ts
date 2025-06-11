/**
 * 提示词API路由 - 完全解耦版本
 * 直接使用数据库服务，不依赖MCP服务
 * 
 * GET /api/prompts - 获取提示词列表
 * POST /api/prompts - 创建新提示词
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { databaseService, PromptDetails } from '@/lib/database-service';
import { withApiAuth } from '@/middleware/withApiAuth';

interface PromptsQuery {
  category?: string;
  tags?: string | string[];
  search?: string;
  page?: string;
  pageSize?: string;
  sortBy?: 'latest' | 'popular' | 'rating';
  isPublic?: string;
}

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      const query = req.query as PromptsQuery;
      
      // 解析查询参数
      const filters = {
        category: query.category,
        tags: Array.isArray(query.tags) ? query.tags : query.tags ? [query.tags] : undefined,
        search: query.search,
        page: query.page ? parseInt(query.page) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
        sortBy: query.sortBy || 'latest' as const,
        isPublic: query.isPublic !== 'false' // 默认只显示公开的提示词
      };

      console.log('获取提示词列表，过滤条件:', filters);

      // 使用数据库服务获取提示词列表
      const result = await databaseService.getPrompts(filters);

      return successResponse(res, result);
    } catch (error: any) {
      console.error('获取提示词列表失败:', error);
      return errorResponse(res, `获取提示词列表失败: ${error.message}`);
    }
  }

  if (req.method === 'POST') {
    // 创建提示词需要认证，使用withApiAuth包装处理函数
    return withApiAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
      try {
        const promptData: Partial<PromptDetails> = req.body;
        
        // 验证必填字段
        if (!promptData.name) {
          return errorResponse(res, '提示词名称是必填的');
        }

        // 设置用户ID
        promptData.user_id = userId;

        console.log('创建新提示词:', { name: promptData.name, userId });

        // 使用数据库服务创建提示词
        const newPrompt = await databaseService.createPrompt(promptData);

        return successResponse(res, newPrompt);
      } catch (error: any) {
        console.error('创建提示词失败:', error);
        return errorResponse(res, `创建提示词失败: ${error.message}`);
      }
    })(req, res);
  }

  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST'],
  requireAuth: false // GET请求不需要认证，POST请求在内部处理认证
});
