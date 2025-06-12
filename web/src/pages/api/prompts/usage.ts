import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { promptId, model, input_tokens, output_tokens, latency_ms, session_id, client_metadata } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空' 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '需要登录才能记录使用历史' 
      });
    }

    // 获取提示词信息
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('name, version')
      .eq('id', promptId)
      .single();

    if (promptError) {
      return res.status(404).json({ 
        success: false, 
        error: '未找到指定的提示词' 
      });
    }

    // 记录使用历史
    const { data: usage, error: usageError } = await supabase
      .from('prompt_usage_history')
      .insert({
        prompt_id: promptId,
        prompt_name: prompt.name,
        prompt_version: prompt.version || 1,
        user_id: userId,
        model: model || null,
        input_tokens: input_tokens || null,
        output_tokens: output_tokens || null,
        latency_ms: latency_ms || null,
        session_id: session_id || null,
        client_metadata: client_metadata || null,
        action: 'use',
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (usageError) throw usageError;

    // 更新提示词使用次数
    await supabase.rpc('increment_usage_count', { prompt_id: promptId });

    res.status(200).json({
      success: true,
      message: '使用历史记录成功',
      usage_id: usage.id
    });
  } catch (error: any) {
    console.error('记录使用历史失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '记录使用历史失败' 
    });
  }
} 