/**
 * 标签API路由
 * GET /api/tags - 获取所有标签
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, successResponse, errorResponse, mcpProxy } from '../../lib/api-handler';
import { supabaseAdapter } from '../../lib/supabase-adapter';

export default apiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // 首先尝试从数据库直接获取标签
      const tags = await supabaseAdapter.getTags();
      
      return successResponse(res, tags);
    } catch (dbError) {
      console.error('从数据库获取标签失败:', dbError);
      
      try {
        // 作为备选方案，尝试从MCP服务获取标签
        const mcpResult = await mcpProxy('/mcp/tools/get_tags/invoke', 'POST', {});
        
        if (mcpResult && mcpResult.content && mcpResult.content.text) {
          // 解析MCP响应
          const result = JSON.parse(mcpResult.content.text);
          return successResponse(res, result.tags || []);
        }
        
        // 如果无法解析MCP响应，返回空数组
        return successResponse(res, []);
      } catch (mcpError) {
        console.error('从MCP获取标签失败:', mcpError);
        return successResponse(res, []);
      }
    }
  }
  
  return errorResponse(res, `不支持的方法: ${req.method}`);
}, {
  allowedMethods: ['GET']
});
