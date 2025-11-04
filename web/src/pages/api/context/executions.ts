/**
 * Tool Execution Contexts API路由
 * 查询工具执行上下文历史
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    const { toolName, sessionId, contextEnhanced, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('tool_execution_contexts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (toolName) {
      query = query.eq('tool_name', toolName);
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (contextEnhanced !== undefined) {
      query = query.eq('context_enhanced', contextEnhanced === 'true');
    }

    query = query.range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });

  } catch (error: any) {
    console.error('Tool Execution Contexts API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '查询执行历史失败',
    });
  }
}

