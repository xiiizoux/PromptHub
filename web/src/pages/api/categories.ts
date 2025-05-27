/**
 * 分类API路由
 * GET /api/categories - 获取所有分类
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '../../lib/api-handler';
import { supabaseAdapter } from '../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // 首先尝试从数据库直接获取分类
      const categories = await supabaseAdapter.getCategories();
      
      return successResponse(res, categories);
    } catch (dbError) {
      console.error('从数据库获取分类失败:', dbError);
      
      try {
        // 作为备选方案，尝试从MCP服务获取分类
        const mcpResult = await mcpProxy('/mcp/tools/get_categories/invoke', 'POST', {});
        
        if (mcpResult && mcpResult.content && mcpResult.content.text) {
          // 解析MCP响应
          const result = JSON.parse(mcpResult.content.text);
          return successResponse(res, result.categories || []);
        }
        
        // 如果无法解析MCP响应，返回空数组
        return successResponse(res, []);
      } catch (mcpError) {
        console.error('从MCP获取分类失败:', mcpError);
        return successResponse(res, []);
      }
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET']
});
