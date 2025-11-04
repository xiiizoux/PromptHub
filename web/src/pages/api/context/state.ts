/**
 * Context State API路由
 * 查询Context Engineering状态
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:9010';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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
    const { sessionId, includeHistory, historyLimit } = req.method === 'GET' ? req.query : req.body;

    // 调用MCP服务
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/tools/context_state/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Request-Id': req.headers['x-request-id'] as string || `req_${Date.now()}`,
      },
      body: JSON.stringify({
        sessionId: sessionId || undefined,
        includeHistory: includeHistory === 'true' || includeHistory === true,
        historyLimit: historyLimit ? parseInt(historyLimit as string) : 10,
      }),
    });

    if (!mcpResponse.ok) {
      const errorData = await mcpResponse.json().catch(() => ({ error: 'Unknown error' }));
      return res.status(mcpResponse.status).json({
        success: false,
        error: errorData.error?.message || errorData.error || '获取上下文状态失败',
      });
    }

    const result = await mcpResponse.json();

    if (result.success === false) {
      return res.status(400).json({
        success: false,
        error: result.error?.message || '获取上下文状态失败',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data || result,
    });

  } catch (error: any) {
    console.error('Context State API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '获取上下文状态失败',
    });
  }
}

