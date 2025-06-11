/**
 * 提示词详情API路由 - 完全解耦版本
 * 直接使用数据库服务，不依赖MCP服务
 * 
 * GET /api/prompts/[name] - 获取提示词详情
 * PUT /api/prompts/[name] - 更新提示词
 * DELETE /api/prompts/[name] - 删除提示词
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { databaseService, PromptDetails } from '@/lib/database-service';
import { withApiAuth } from '@/middleware/withApiAuth';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;
  
  if (typeof name !== 'string') {
    return errorResponse(res, '无效的提示词名称');
  }

  if (req.method === 'GET') {
    try {
      // 获取提示词详情，不需要认证
      const prompt = await databaseService.getPromptByName(name);
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          message: '提示词不存在'
        });
      }

      return successResponse(res, prompt);
    } catch (error: any) {
      console.error('获取提示词详情失败:', error);
      return errorResponse(res, `获取提示词详情失败: ${error.message}`);
    }
  }

  if (req.method === 'PUT') {
    // 更新提示词需要认证
    return withApiAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
      try {
        const promptData: Partial<PromptDetails> = req.body;
        
        console.log('更新提示词:', { name, userId, fields: Object.keys(promptData) });

        // 使用数据库服务更新提示词
        const updatedPrompt = await databaseService.updatePrompt(name, promptData, userId);

        return successResponse(res, updatedPrompt);
      } catch (error: any) {
        console.error('更新提示词失败:', error);
        if (error.message.includes('不存在')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        if (error.message.includes('无权限')) {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
        return errorResponse(res, `更新提示词失败: ${error.message}`);
      }
    })(req, res);
  }

  if (req.method === 'DELETE') {
    // 删除提示词需要认证
    return withApiAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
      try {
        console.log('删除提示词:', { name, userId });

        // 使用数据库服务删除提示词
        const success = await databaseService.deletePrompt(name, userId);

        if (!success) {
          return errorResponse(res, '删除提示词失败');
        }

        return successResponse(res, { message: '提示词删除成功' });
      } catch (error: any) {
        console.error('删除提示词失败:', error);
        if (error.message.includes('不存在')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        if (error.message.includes('无权限')) {
          return res.status(403).json({
            success: false,
            message: error.message
          });
        }
        return errorResponse(res, `删除提示词失败: ${error.message}`);
      }
    })(req, res);
  }

  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'PUT', 'DELETE'],
  requireAuth: false // GET请求不需要认证，PUT和DELETE在内部处理认证
});
