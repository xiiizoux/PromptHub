/**
 * API密钥管理路由
 * GET /api/auth/api-keys - 获取用户API密钥列表
 * POST /api/auth/api-keys - 创建新API密钥
 * DELETE /api/auth/api-keys/:id - 删除特定API密钥
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, ErrorCode } from '../../../lib/api-handler';
import supabaseAdapter from '../../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 确保用户已认证
  if (!userId) {
    console.error('API密钥操作未授权:', req.method, req.url);
    return errorResponse(res, '未授权', ErrorCode.UNAUTHORIZED);
  }

  console.log('用户认证成功，正在处理API密钥请求:', userId, req.method);

  // 获取用户API密钥列表
  if (req.method === 'GET') {
    try {
      console.log('获取API密钥列表, userId:', userId);
      const apiKeys = await supabaseAdapter.listApiKeys(userId);
      console.log('获取到API密钥数量:', apiKeys.length);
      return successResponse(res, apiKeys);
    } catch (error: any) {
      console.error('获取API密钥失败:', error);
      return errorResponse(res, `获取API密钥失败: ${error.message}`, ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 创建新API密钥
  if (req.method === 'POST') {
    try {
      // 兼容两种参数命名风格
      const { name, expiresInDays, expires_in_days } = req.body;
      const expiryDays = expiresInDays || expires_in_days || 30; // 默认30天
      
      console.log('创建API密钥请求:', { name, expiryDays });
      
      if (!name) {
        return errorResponse(res, 'API密钥名称是必需的', ErrorCode.BAD_REQUEST);
      }
      
      const newApiKey = await supabaseAdapter.generateApiKey(userId, name, expiryDays);
      console.log('API密钥创建成功:', newApiKey.id);
      
      // 确保响应结构与前端期望的一致
      return res.status(200).json({
        success: true,
        data: newApiKey,
        message: '创建API密钥成功'
      });
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
