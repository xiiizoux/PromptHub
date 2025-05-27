import { NextApiRequest, NextApiResponse } from 'next';
import { proxyApiRequest } from '../../../lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // 获取提示词ID
  const { promptId } = req.query;
  
  if (!promptId || typeof promptId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: '必须提供有效的提示词ID' 
    });
  }

  try {
    // 调用MCP Prompt Server的获取提示词性能API
    return await proxyApiRequest(req, res, `/performance/get_prompt_performance`, {
      method: 'GET',
      transformRequest: (data) => {
        return {
          prompt_id: promptId
        };
      }
    });
  } catch (error) {
    console.error('获取提示词性能数据错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取提示词性能数据过程中发生错误' 
    });
  }
}
