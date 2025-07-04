/**
 * AI工具API代理路由 - 代理到独立的MCP服务器
 * 
 * GET /api/ai-tools - 获取可用AI工具列表
 * POST /api/ai-tools - 调用指定AI工具
 * 
 * 注意：此路由作为Web服务器到MCP服务器的代理桥梁
 * MCP服务器运行在独立端口(9010)，Web服务器通过此路由代理请求
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '../../../lib/api-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse, userId?: string) => {
  // 获取可用工具列表
  if (req.method === 'GET') {
    try {
      const result = await mcpProxy('/tools', 'GET');
      return successResponse(res, result.tools || []);
    } catch (error) {
      console.error('获取AI工具列表失败:', error);
      return errorResponse(res, '获取AI工具列表失败');
    }
  }
  
  // 调用特定工具
  if (req.method === 'POST') {
    try {
      const { name, arguments: args } = req.body;
      
      if (!name) {
        return errorResponse(res, '缺少必须的参数: name');
      }
      
      // Context Engineering 相关工具需要用户身份
      const requiresUserAuth = ['context_engineering', 'context_state', 'context_config', 'context_pipeline'].includes(name);
      
      if (requiresUserAuth && !userId) {
        return errorResponse(res, 'Context Engineering 工具需要用户身份验证', 401);
      }
      
      // 获取用户的认证信息
      const userApiKey = req.headers['x-api-key'] as string;
      const authHeader = req.headers.authorization;
      
      // 调用MCP工具，传递用户认证信息
      const result = await mcpProxy(`/tools/${name}/invoke`, 'POST', args || {}, {
        userApiKey,
        authHeader,
        userId
      });
      
      // 将MCP响应格式转换为API响应格式
      const responseData = {
        content: result.content || { type: 'text', text: '' },
      };
      
      return successResponse(res, responseData);
    } catch (error: any) {
      console.error('调用AI工具失败:', error);
      return errorResponse(res, `调用AI工具失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST'],
  // Context Engineering 工具需要认证
  requireAuth: true,
});
