/**
 * 个人页面API密钥管理路由
 * GET /api/profile/api-keys - 获取用户API密钥列表
 * POST /api/profile/api-keys - 创建新API密钥
 * DELETE /api/profile/api-keys - 删除特定API密钥
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import supabaseAdapter from '../../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 确保用户已认证
  if (!userId) {
    return errorResponse(res, '未授权', ErrorCode.UNAUTHORIZED);
  }

  // 获取用户API密钥列表
  if (req.method === 'GET') {
    try {
      const keys = await supabaseAdapter.listApiKeys(userId);
      return successResponse(res, { keys });
    } catch (error: any) {
      console.error('获取API密钥失败:', error);
      return errorResponse(res, `获取API密钥失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 创建新API密钥
  if (req.method === 'POST') {
    try {
      const { name, expires_in_days } = req.body;
      
      if (!name) {
        return errorResponse(res, 'API密钥名称是必需的', ErrorCode.BAD_REQUEST);
      }
      
      const key = await supabaseAdapter.generateApiKey(userId, name, expires_in_days);
      return successResponse(res, { key });
    } catch (error: any) {
      console.error('创建API密钥失败:', error);
      return errorResponse(res, `创建API密钥失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 删除API密钥
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return errorResponse(res, 'API密钥ID是必需的', ErrorCode.BAD_REQUEST);
      }
      
      await supabaseAdapter.deleteApiKey(userId, id);
      return successResponse(res, { deleted: true });
    } catch (error: any) {
      console.error('删除API密钥失败:', error);
      return errorResponse(res, `删除API密钥失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  return errorResponse(res, `不支持的方法: ${req.method}`, ErrorCode.BAD_REQUEST);
}, {
  allowedMethods: ['GET', 'POST', 'DELETE'],
  requireAuth: true
}); 