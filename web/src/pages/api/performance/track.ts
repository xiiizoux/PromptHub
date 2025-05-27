import { NextApiRequest, NextApiResponse } from 'next';
import { proxyApiRequest } from '../../../lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 验证请求体
    const { prompt_id, version, input_tokens, output_tokens, latency, success } = req.body;
    
    if (!prompt_id) {
      return res.status(400).json({ success: false, message: 'prompt_id是必需的参数' });
    }
    
    // 调用MCP Prompt Server的性能追踪API
    return await proxyApiRequest(req, res, '/performance/track_prompt_usage', {
      method: 'POST',
      transformRequest: (data) => {
        // 确保将数据转换为MCP Prompt Server期望的格式
        return {
          prompt_id: data.prompt_id,
          version: data.version || '1.0',
          input_tokens: data.input_tokens || 0,
          output_tokens: data.output_tokens || 0,
          latency: data.latency || 0,
          success: data.success !== undefined ? data.success : true
        };
      }
    });
  } catch (error) {
    console.error('追踪提示词使用错误:', error);
    return res.status(500).json({ success: false, message: '追踪提示词使用过程中发生错误' });
  }
}
