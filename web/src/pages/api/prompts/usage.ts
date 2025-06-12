import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId } = req.body;
    const {
      model,
      input_tokens,
      output_tokens,
      latency_ms,
      session_id,
      client_metadata
    } = req.body;

    // 获取API密钥进行验证
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: '需要API密钥' });
    }

    // 这里可以添加API密钥验证逻辑
    // 暂时简单处理，后续可以添加用户验证

    // 生成session_id（如果没有提供）
    const finalSessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 记录使用数据
    const { error: insertError } = await supabase
      .from('prompt_usage')
      .insert({
        prompt_id: promptId,
        prompt_version: 1, // 默认版本，后续可以从提示词表获取
        user_id: null, // 暂时为null，后续添加用户系统后更新
        session_id: finalSessionId,
        model: model || 'unknown',
        input_tokens: input_tokens || 0,
        output_tokens: output_tokens || 0,
        latency_ms: latency_ms || 0,
        client_metadata: client_metadata || {}
      });

    if (insertError) {
      throw insertError;
    }

    res.status(200).json({ 
      success: true, 
      message: '使用记录已保存',
      session_id: finalSessionId
    });
  } catch (error: any) {
    console.error('记录使用数据失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
} 