import { NextApiRequest, NextApiResponse } from 'next';
import { promptCategoryMatcher } from '@/services/promptCategoryMatcher';
import { logger } from '@/lib/error-handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, requirements = '', context = '', manualCategory } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的提示词内容',
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

    let templateResult;
    let isManualSelection = false;

    // 如果用户手动选择了分类，使用手动选择的分类
    if (manualCategory && manualCategory.optimization_template) {
      logger.info('使用手动选择的分类', {
        categoryName: manualCategory.name,
        categoryId: manualCategory.id
      });

      templateResult = {
        template: manualCategory.optimization_template,
        category: {
          id: manualCategory.id,
          name: manualCategory.name,
        },
        confidence: 1.0, // 手动选择的置信度为100%
      };
      isManualSelection = true;
    } else {
      // 使用智能分类匹配获取优化模板
      logger.info('开始智能分类匹配', { prompt: prompt.substring(0, 100) });
      templateResult = await promptCategoryMatcher.getOptimizationTemplate(prompt);
    }

    // 构建优化提示词
    const optimizationTemplate = templateResult.template;
    const requirementsText = requirements ? `\n\n特殊要求：${requirements}` : '';
    const contextText = context ? `\n\n使用场景：${context}` : '';
    const optimizationPrompt = optimizationTemplate
      .replace('{prompt}', prompt)
      .replace('{requirements}', requirementsText + contextText);

    // 选择模型
    const model = 'gpt-4o-mini';

    // 调用OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: optimizationPrompt,
          },
        ],
        max_tokens: 1500,
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

    const optimizedContent = data.choices[0].message.content.trim();
    const optimizedPrompt = extractOptimizedPrompt(optimizedContent);
    const improvements = extractImprovements(optimizedContent);
    const suggestions = extractSuggestions(optimizedContent);
    
    return res.status(200).json({
      success: true,
      data: {
        original: prompt,
        optimized: optimizedPrompt,
        improvements,
        suggestions,
        category: templateResult.category,
        confidence: templateResult.confidence,
        usage: data.usage,
      },
    });

  } catch (error: any) {
    console.error('AI优化器错误:', error);
    return res.status(500).json({
      success: false,
      error: `优化失败: ${error.message}`,
    });
  }
}

// 这些函数已被智能分类匹配服务替代，保留用于解析响应

// 提取优化后的提示词
function extractOptimizedPrompt(content: string): string {
  // 首先尝试匹配标准格式
  const standardMatch = content.match(/### 优化后的提示词\s*([\s\S]*?)\s*(?:###|$)/);

  // 如果是绘图优化，尝试提取通用优化版本
  const drawingMatch = content.match(/### 通用优化版本\s*([\s\S]*?)\s*(?:###|$)/);

  if (drawingMatch) {
    return drawingMatch[1].trim();
  }

  if (standardMatch) {
    return standardMatch[1].trim();
  }

  // 如果没有匹配到特定格式，返回完整内容
  return content.trim();
}

// 提取改进点
function extractImprovements(content: string): string[] {
  const improvements: string[] = [];
  
  // 标准格式的改进点
  const standardMatch = content.match(/### 主要改进点\s*([\s\S]*?)\s*(?:###|$)/);
  if (standardMatch) {
    const standardImprovements = standardMatch[1].trim()
      .split('\n')
      .map(line => line.replace(/^[\s\-\*\d\.]*/, '').trim())
      .filter(Boolean);
    improvements.push(...standardImprovements);
  }
  
  // 绘图优化的技术参数建议
  const technicalMatch = content.match(/### 技术参数建议\s*([\s\S]*?)\s*(?:###|$)/);
  if (technicalMatch) {
    improvements.push('📐 技术参数建议: ' + technicalMatch[1].trim().replace(/\n/g, ' | '));
  }
  
  // 绘图优化的高级技巧
  const advancedMatch = content.match(/### 高级技巧\s*([\s\S]*?)\s*(?:###|$)/);
  if (advancedMatch) {
    improvements.push('🚀 高级技巧: ' + advancedMatch[1].trim().replace(/\n/g, ' | '));
  }
  
  return improvements;
}

// 提取使用建议
function extractSuggestions(content: string): string[] {
  const match = content.match(/### 使用建议\s*([\s\S]*?)\s*(?:###|$)/);
  if (!match) return [];
  
  return match[1].trim()
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\d\.]*/, '').trim())
    .filter(Boolean);
}
 