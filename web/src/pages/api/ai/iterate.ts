import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalPrompt, currentPrompt, requirements, type } = req.body;
    
    if (!originalPrompt || !currentPrompt || !requirements) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的迭代参数',
      });
    }

    // 检查环境变量
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API未配置，请联系管理员',
      });
    }

    // 构建迭代提示词
    const iterationPrompt = `请根据用户的要求对以下提示词进行迭代优化：

原始提示词：
${originalPrompt}

当前提示词：
${currentPrompt}

迭代要求：
${requirements}

迭代类型：${type}

请根据迭代要求对当前提示词进行改进，直接返回优化后的提示词，不需要解释过程。`;

    // 调用OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: iterationPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API错误:', response.status, errorData);
      return res.status(500).json({
        success: false,
        error: `AI服务暂时不可用: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({
        success: false,
        error: 'AI服务返回了无效的响应',
      });
    }

    const optimizedPrompt = data.choices[0].message.content.trim();
    
    return res.status(200).json({
      success: true,
      data: {
        original: currentPrompt,
        optimized: optimizedPrompt,
        requirements,
        type,
        usage: data.usage,
      },
    });

  } catch (error: any) {
    console.error('AI迭代优化错误:', error);
    return res.status(500).json({
      success: false,
      error: `迭代失败: ${error.message}`,
    });
  }
} 