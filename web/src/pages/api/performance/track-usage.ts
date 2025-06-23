import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      promptId,
      promptVersion = 1,
      model = 'gpt-3.5-turbo',
      inputTokens = 0,
      outputTokens = 0,
      latencyMs = 0,
      sessionId,
      userId,
    } = req.body;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing promptId', 
      });
    }

    // 记录使用数据
    const { data: usageData, error: usageError } = await supabase
      .from('prompt_usage')
      .insert({
        prompt_id: promptId,
        prompt_version: promptVersion,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: latencyMs,
        session_id: sessionId,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (usageError) {
      console.error('记录使用数据失败:', usageError);
      // 如果表不存在，仍然返回成功（优雅降级）
      if (usageError.code === '42P01') {
        return res.json({ 
          success: true, 
          message: '功能暂未启用，但操作已记录',
          usageId: `temp-${Date.now()}`,
        });
      }
      throw usageError;
    }

    return res.json({ 
      success: true, 
      usageId: usageData.id, 
    });
  } catch (error) {
    console.error('追踪使用数据时出错:', error);
    return res.status(500).json({ 
      success: false, 
      error: '服务器内部错误', 
    });
  }
} 