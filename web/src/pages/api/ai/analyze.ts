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

    // 构建分析提示词
    const analysisPrompt = `请分析以下提示词的质量，并给出评分：

提示词：
${prompt}

请从以下维度进行评分（1-10分）：
1. 清晰性：指令是否明确清晰
2. 具体性：要求是否具体详细
3. 完整性：是否包含必要信息
4. 整体质量：综合评价

请以JSON格式返回评分结果：
{
  "clarity": 数字,
  "specificity": 数字,
  "completeness": 数字,
  "overall": 数字,
  "analysis": "简要分析说明"
}`;

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
            content: analysisPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
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

    const analysisResult = data.choices[0].message.content.trim();
    
    // 尝试解析JSON结果
    let score;
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        score = {
          clarity: parsed.clarity || 5,
          specificity: parsed.specificity || 5,
          completeness: parsed.completeness || 5,
          overall: parsed.overall || 5
        };
      } else {
        // 如果无法解析，使用默认评分
        score = {
          clarity: 6,
          specificity: 6,
          completeness: 6,
          overall: 6
        };
      }
    } catch (parseError) {
      console.warn('无法解析AI分析结果，使用默认评分');
      score = {
        clarity: 6,
        specificity: 6,
        completeness: 6,
        overall: 6
      };
    }
    
    return res.status(200).json({
      success: true,
      data: {
        prompt,
        score,
        analysis: analysisResult,
        usage: data.usage
      }
    });

  } catch (error: any) {
    console.error('AI分析错误:', error);
    return res.status(500).json({
      success: false,
      error: `分析失败: ${error.message}`
    });
  }
} 