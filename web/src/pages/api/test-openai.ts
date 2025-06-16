import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查环境变量
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'NEXT_PUBLIC_OPENAI_API_KEY 未配置',
        config: {
          hasApiKey: false,
          baseURL: baseURL || 'undefined'
        }
      });
    }

    // 测试API连接
    const response = await fetch(`${baseURL || 'https://api.openai.com/v1'}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: `API连接失败: ${response.status} ${response.statusText}`,
        config: {
          hasApiKey: true,
          baseURL: baseURL || 'https://api.openai.com/v1',
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'OpenAI API配置正常',
      config: {
        hasApiKey: true,
        baseURL: baseURL || 'https://api.openai.com/v1',
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        modelsCount: data.data?.length || 0
      }
    });

  } catch (error: any) {
    console.error('测试OpenAI API失败:', error);
    return res.status(500).json({
      success: false,
      error: `测试失败: ${error.message}`,
      config: {
        hasApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1'
      }
    });
  }
} 