import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      prompt, 
      optimizationType = 'general',
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

    // 根据复杂度和类型选择模型
    const model = complexity === 'complex' ? 'gpt-4' : 'gpt-4o-mini';
    
    // 构建高级优化提示词
    const systemPrompt = buildAdvancedSystemPrompt(optimizationType, complexity);
    const userPrompt = buildAdvancedUserPrompt(prompt, requirements, context, optimizationType);

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: complexity === 'complex' ? 3000 : 2000,
        temperature: optimizationType === 'creative' ? 0.8 : 0.7,
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
        optimizationType,
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

function buildAdvancedSystemPrompt(type: string, complexity: string): string {
  const basePrompt = `你是一个高级AI提示词优化专家，拥有深厚的提示工程经验。你将提供专业级别的提示词优化服务。

优化等级：${complexity}
优化类型：${type}

核心优化原则：
1. 精确性：每个词都有其存在的价值
2. 结构化：采用最优的信息架构
3. 可扩展性：考虑未来的扩展可能
4. 用户体验：确保使用者容易理解和操作
5. 效果最大化：追求最佳的AI响应质量

请按照以下结构输出：

### 🎯 优化后的提示词
[提供经过专业优化的提示词]

### 📊 优化分析
[分析原始提示词的问题和改进策略]

### ✨ 关键改进点
[列出3-5个最重要的改进点]

### 🔧 高级技巧
[提供提示工程的高级技巧和最佳实践]

### 📋 使用指南
[详细的使用说明和注意事项]

### 🎛️ 参数建议
[推荐的模型参数设置]`;

  const typeSpecific = {
    creative: `
特别优化重点：
- 激发创意思维的语言模式
- 多维度创意引导框架
- 情感共鸣和想象力激发
- 开放性与约束性的平衡`,
    
    technical: `
特别优化重点：
- 技术规范和标准的精确表达
- 错误处理和边界条件考虑
- 代码质量和最佳实践集成
- 可测试和可维护的输出要求`,
    
    business: `
特别优化重点：
- 商业目标和KPI的明确定义
- 利益相关者需求的全面考虑
- ROI和成本效益的量化表达
- 可执行的行动计划框架`,
    
    educational: `
特别优化重点：
- 循序渐进的知识建构
- 多样化的学习活动设计
- 不同学习风格的适配
- 评估和反馈机制的嵌入`,
    
    complex: `
特别优化重点：
- 复杂任务的分解和串联
- 多阶段处理流程的设计
- 异常情况和回退策略
- 质量控制和验证机制`,
  };

  return basePrompt + (typeSpecific[type as keyof typeof typeSpecific] || '');
}

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
  if (!section) return [];
  
  return section
    .split('\n')
    .map(line => line.replace(/^[\s\-\*\d\.]*/, '').trim())
    .filter(Boolean);
}