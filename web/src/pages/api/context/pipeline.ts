/**
 * Context Pipeline API路由
 * 管理Context Engineering流水线
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:9010';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 认证检查
    const supabase = createServerSupabaseClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const { action, pipelineName, pipelineConfig } = req.method === 'GET' ? req.query : req.body;

    // 构建MCP请求参数
    const mcpParams: any = {
      action: action || (req.method === 'GET' ? 'list' : req.method === 'POST' ? 'register' : req.method === 'PUT' ? 'update' : 'delete'),
    };

    if (pipelineName) {
      mcpParams.pipelineName = pipelineName;
    }
    if (pipelineConfig) {
      mcpParams.pipelineConfig = pipelineConfig;
    }

    // 调用MCP服务
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/tools/context_pipeline/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Request-Id': req.headers['x-request-id'] as string || `req_${Date.now()}`,
      },
      body: JSON.stringify(mcpParams),
    });

    if (!mcpResponse.ok) {
      const errorData = await mcpResponse.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(mcpResponse.status).json({
        success: false,
        error: errorData.error?.message || errorData.error || '流水线操作失败',
      });
    }

    const result = await mcpResponse.json();

    if (result.success === false) {
      return res.status(400).json({
        success: false,
        error: result.error?.message || '流水线操作失败',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data || result,
    });

  } catch (error: any) {
    console.error('Context Pipeline API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '流水线操作失败',
    });
  }
}

