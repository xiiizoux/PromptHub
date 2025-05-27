import { NextApiRequest, NextApiResponse } from 'next';
import { proxyApiRequest } from '../../../lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 验证请求体
    const { usage_id, rating, comments } = req.body;
    
    if (!usage_id || rating === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'usage_id和rating是必需的参数' 
      });
    }
    
    // 调用MCP Prompt Server的提交反馈API
    return await proxyApiRequest(req, res, '/performance/submit_prompt_feedback', {
      method: 'POST',
      transformRequest: (data) => {
        // 确保将数据转换为MCP Prompt Server期望的格式
        return {
          usage_id: data.usage_id,
          rating: data.rating,
          comments: data.comments || ''
        };
      }
    });
  } catch (error) {
    console.error('提交提示词反馈错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '提交提示词反馈过程中发生错误' 
    });
  }
}
