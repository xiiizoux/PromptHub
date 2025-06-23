/**
 * MCP工具API代理路由
 * 
 * GET /api/mcp/tools - 获取可用工具列表
 * POST /api/mcp/tools - 调用指定工具
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '../../../../lib/api-handler';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  // 获取可用工具列表
  if (req.method === 'GET') {
    try {
      const result = await mcpProxy('/tools', 'GET');
      return successResponse(res, result.tools || []);
    } catch (error) {
      console.error('获取MCP工具列表失败:', error);
      return errorResponse(res, '获取MCP工具列表失败');
    }
  }
  
  // 调用特定工具
  if (req.method === 'POST') {
    try {
      const { name, arguments: args } = req.body;
      
      if (!name) {
        return errorResponse(res, '缺少必须的参数: name');
      }
      
      // 调用MCP工具
      const result = await mcpProxy(`/tools/${name}/invoke`, 'POST', args || {});
      
      // 将MCP响应格式转换为API响应格式
      const responseData = {
        content: result.content || { type: 'text', text: '' },
      };
      
      return successResponse(res, responseData);
    } catch (error: any) {
      console.error('调用MCP工具失败:', error);
      return errorResponse(res, `调用MCP工具失败: ${error.message}`);
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET', 'POST'],
  // 可以选择是否需要认证
  requireAuth: false,
});
