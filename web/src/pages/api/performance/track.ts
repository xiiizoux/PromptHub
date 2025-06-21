import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '../../../lib/database-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 验证请求体
    const {
      prompt_id,
      prompt_version,
      model,
      input_tokens,
      output_tokens,
      latency_ms,
      user_id,
      session_id,
      client_metadata
    } = req.body;

    if (!prompt_id) {
      return res.status(400).json({ success: false, message: 'prompt_id是必需的参数' });
    }

    if (!model) {
      return res.status(400).json({ success: false, message: 'model是必需的参数' });
    }

    if (input_tokens === undefined || output_tokens === undefined || latency_ms === undefined) {
      return res.status(400).json({
        success: false,
        message: 'input_tokens, output_tokens, latency_ms是必需的参数'
      });
    }

    console.log(`[API] 记录提示词使用，ID: ${prompt_id}`);

    // 直接使用数据库服务记录使用数据
    const usageId = await databaseService.trackPromptUsage({
      prompt_id,
      prompt_version: prompt_version || 1,
      model,
      input_tokens: parseInt(input_tokens) || 0,
      output_tokens: parseInt(output_tokens) || 0,
      latency_ms: parseInt(latency_ms) || 0,
      user_id,
      session_id,
      client_metadata
    });

    if (!usageId) {
      return res.status(500).json({
        success: false,
        message: '记录使用数据失败'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        usageId: usageId
      }
    });
  } catch (error) {
    console.error('追踪提示词使用错误:', error);
    return res.status(500).json({
      success: false,
      message: '追踪提示词使用过程中发生错误'
    });
  }
}
