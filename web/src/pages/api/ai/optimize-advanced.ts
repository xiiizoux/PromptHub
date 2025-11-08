import { NextApiRequest, NextApiResponse } from 'next';
import { promptCategoryMatcher } from '@/services/promptCategoryMatcher';
import { logger } from '@/lib/error-handler';
import { extractTemplateFromJsonb, isJsonbTemplate } from '@/lib/jsonb-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      requirements = '',
      context = '',
      complexity = 'medium',
      includeAnalysis = false,
    } = req.body;

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

    // 使用智能分类匹配获取优化模板
    logger.info('开始高级智能分类匹配', { prompt: prompt.substring(0, 100) });
    const templateResult = await promptCategoryMatcher.getOptimizationTemplate(prompt);

    // 根据复杂度选择模型
    const model = complexity === 'complex' ? 'gpt-4' : 'gpt-4o-mini';

    // 构建优化提示词
    const optimizationTemplate = templateResult.template;
    const requirementsText = requirements ? `\n\n特殊要求：${requirements}` : '';
    const contextText = context ? `\n\n使用场景：${context}` : '';
    const complexityText = complexity === 'complex' ? '\n\n请提供更深入和详细的优化建议。' : '';

    const userPrompt = optimizationTemplate
      .replace('{prompt}', prompt)
      .replace('{requirements}', requirementsText + contextText + complexityText);

    // 如果需要分析，先进行质量分析
    let analysis = null;
    if (includeAnalysis) {
      analysis = await performQualityAnalysis(prompt, apiKey, baseURL);
    }

    // 执行优化
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        max_tokens: complexity === 'complex' ? 3000 : 2000,
        temperature: templateResult.category.type === 'chat' && templateResult.category.name.includes('创意') ? 0.8 : 0.7,
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
    const result = parseAdvancedOptimizationResult(optimizedContent);
    
    return res.status(200).json({
      success: true,
      data: {
        original: prompt,
        ...result,
        category: templateResult.category,
        confidence: templateResult.confidence,
        complexity,
        analysis,
        usage: data.usage,
      },
    });

  } catch (error: any) {
    console.error('高级AI优化器错误:', error);
    return res.status(500).json({
      success: false,
      error: `优化失败: ${error.message}`,
    });
  }
}

// 这些函数已被智能分类匹配服务替代，保留用于解析响应和质量分析

function buildAdvancedUserPrompt(prompt: string, requirements: string, context: string, type: string): string {
  return `请对以下提示词进行${type}类型的高级优化：

【原始提示词】
${prompt}

${requirements ? `【特殊要求】\n${requirements}\n\n` : ''}
${context ? `【使用场景】\n${context}\n\n` : ''}

请提供全面的优化方案和专业分析。`;
}

async function performQualityAnalysis(prompt: string, apiKey: string, baseURL: string) {
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `请分析以下提示词的质量，从清晰性、具体性、完整性、结构性四个维度打分(1-10分)，并以JSON格式返回：

${prompt}

返回格式：
{
  "clarity": 分数,
  "specificity": 分数,
  "completeness": 分数,
  "structure": 分数,
  "overall": 总分,
  "comments": "简要评价"
}`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      try {
        return JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.error('质量分析失败:', error);
  }
  return null;
}

function parseAdvancedOptimizationResult(content: string) {
  const sections = {
    optimized: extractSection(content, '🎯 优化后的提示词'),
    analysis: extractSection(content, '📊 优化分析'),
    improvements: extractListSection(content, '✨ 关键改进点'),
    techniques: extractListSection(content, '🔧 高级技巧'),
    guide: extractListSection(content, '📋 使用指南'),
    parameters: extractSection(content, '🎛️ 参数建议'),
  };

  return {
    optimized: sections.optimized || content,
    analysis: sections.analysis || '',
    improvements: sections.improvements || [],
    techniques: sections.techniques || [],
    guide: sections.guide || [],
    parameters: sections.parameters || '',
  };
}

function extractSection(content: string, sectionTitle: string): string {
  const regex = new RegExp(`### ${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([\\s\\S]*?)(?:\\n### |$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function extractListSection(content: string, sectionTitle: string): string[] {
  const section = extractSection(content, sectionTitle);
  if (!section) {return [];}
  
  return section
    .split('\n')
    .map(line => line.replace(/^[\s\-*\d.]*/, '').trim())
    .filter(Boolean);
}