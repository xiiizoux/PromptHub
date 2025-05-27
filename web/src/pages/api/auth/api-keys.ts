/**
 * API密钥管理路由
 * GET /api/auth/api-keys - 获取用户API密钥列表
 * POST /api/auth/api-keys - 创建新API密钥
 * DELETE /api/auth/api-keys/:id - 删除特定API密钥
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import { extendedSupabaseAdapter as supabaseAdapter } from '../../../../../supabase';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 确保用户已认证
  if (!userId) {
    return errorResponse(res, '未授权', ErrorCode.UNAUTHORIZED);
  }

  // 获取用户API密钥列表
  if (req.method === 'GET') {
    try {
      const apiKeys = await supabaseAdapter.getUserApiKeys(userId);
      return successResponse(res, apiKeys);
    } catch (error: any) {
      console.error('获取API密钥失败:', error);
      return errorResponse(res, `获取API密钥失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 创建新API密钥
  if (req.method === 'POST') {
    try {
      const { name, expiresAt } = req.body;
      
      if (!name) {
        return errorResponse(res, 'API密钥名称是必需的', ErrorCode.BAD_REQUEST);
      }
      
      const apiKey = await supabaseAdapter.createApiKey(userId, name, expiresAt);
      return successResponse(res, apiKey, '创建API密钥成功');
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
      return successResponse(res, { deleted: true }, '删除API密钥成功');
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
