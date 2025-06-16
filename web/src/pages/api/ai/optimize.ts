import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的提示词内容'
      });
    }

    // 检查环境变量
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API未配置，请联系管理员'
      });
    }

    // 构建优化提示词
    const optimizationPrompt = `请帮我优化以下AI提示词，使其更加清晰、具体和有效：

原始提示词：
${prompt}

请从以下几个方面进行优化：
1. 明确性：使指令更加清晰明确
2. 具体性：添加具体的要求和约束
3. 结构性：改善提示词的逻辑结构
4. 完整性：确保包含所有必要信息

请直接返回优化后的提示词，不需要解释过程。`;

    // 调用OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API错误:', response.status, errorData);
      return res.status(500).json({
        success: false,
        error: `AI服务暂时不可用: ${response.status} ${response.statusText}`
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({
        success: false,
        error: 'AI服务返回了无效的响应'
      });
    }

    const optimizedPrompt = data.choices[0].message.content.trim();
    
    return res.status(200).json({
      success: true,
      data: {
        original: prompt,
        optimized: optimizedPrompt,
        usage: data.usage
      }
    });

  } catch (error: any) {
    console.error('AI优化器错误:', error);
    return res.status(500).json({
      success: false,
      error: `优化失败: ${error.message}`
    });
  }
} 