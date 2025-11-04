/**
 * Context Config API路由
 * 管理Context Engineering配置
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
    const { action, configType, configData, configId } = req.method === 'GET' ? req.query : req.body;

    // 构建MCP请求参数
    const mcpParams: any = {
      action: action || (req.method === 'GET' ? 'list' : req.method === 'POST' ? 'set' : req.method === 'PUT' ? 'update' : 'delete'),
      configType: configType || 'preferences',
    };

    if (configData) {
      mcpParams.configData = configData;
    }
    if (configId) {
      mcpParams.configId = configId;
    }

    // 调用MCP服务
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/tools/context_config/invoke`, {
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
        error: errorData.error?.message || errorData.error || '配置操作失败',
      });
    }

    const result = await mcpResponse.json();

    if (result.success === false) {
      return res.status(400).json({
        success: false,
        error: result.error?.message || '配置操作失败',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data || result,
    });

  } catch (error: any) {
    console.error('Context Config API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '配置操作失败',
    });
  }
}

