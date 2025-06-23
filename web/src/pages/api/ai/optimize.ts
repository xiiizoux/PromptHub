import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, optimizationType = 'general', requirements = '', context = '' } = req.body;
    
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

    // 根据优化类型选择合适的模型和提示词模板
    const model = optimizationType === 'complex' ? 'gpt-4' : 'gpt-4o-mini';
    const optimizationPrompt = buildOptimizationPrompt(prompt, optimizationType, requirements, context);

    // 调用OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(optimizationType)
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        max_tokens: optimizationType === 'complex' ? 2000 : 1000,
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
        optimizationType,
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

// 构建优化提示词
function buildOptimizationPrompt(prompt: string, type: string, requirements: string, context: string): string {
  let basePrompt = `请优化以下AI提示词：

原始提示词：
${prompt}`;

  // 为绘图优化添加特殊指导
  if (type === 'drawing') {
    basePrompt += `

注意：这是一个绘图提示词优化请求，请提供一个高质量的通用优化版本，适合各种AI绘图模型使用。请在使用建议中包含技术参数和不同平台的使用技巧。`;
  }

  const contextSection = context ? `

使用场景：
${context}` : '';
  const requirementsSection = requirements ? `

特殊要求：
${requirements}` : '';
  
  return basePrompt + contextSection + requirementsSection;
}

// 获取系统提示词
function getSystemPrompt(optimizationType: string): string {
  const basePrompt = `你是一个专业的AI提示词优化专家。你的任务是优化用户提供的提示词，使其更加清晰、具体和有效。

核心优化原则：
1. 清晰性：确保指令明确，避免歧义
2. 具体性：提供具体的要求和期望输出格式
3. 完整性：包含必要的上下文和约束条件
4. 结构化：使用清晰的结构和格式
5. 可操作性：确保AI能够理解并执行

请按照以下格式输出：

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个主要改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`;

  const typeSpecificPrompts = {
    creative: `
特别注重创意和灵感激发：
- 增加创意引导语句
- 提供多样化的思考角度
- 鼓励原创性和独特性`,
    
    technical: `
特别注重技术准确性：
- 确保技术术语使用准确
- 提供明确的技术规范
- 包含错误处理和边缘情况`,
    
    business: `
特别注重商业价值：
- 强调ROI和商业目标
- 考虑利益相关者需求
- 包含可衡量的成功指标`,
    
    educational: `
特别注重教学效果：
- 采用循序渐进的结构
- 包含示例和练习
- 考虑不同学习水平`,
    
    complex: `
处理复杂任务优化：
- 分解复杂任务为子任务
- 提供详细的步骤指导
- 考虑多种解决方案路径`,

    drawing: `
特别注重绘画图像生成优化：
- 主体描述：使用具体生动的主体描述，明确姿态、表情、服装等细节
- 风格技法：指定明确的艺术风格（写实、卡通、油画等），添加光影、构图、色彩描述
- 环境背景：详细描述场景、背景元素、时间地点、氛围
- 质量增强：添加质量增强关键词，优化画面构图和视觉效果
- 通用适配：提供一个高质量的通用优化版本，适合各种AI绘图模型使用
- 技术建议：在使用建议中包含技术参数和高级技巧指导`
  };

  return basePrompt + (typeSpecificPrompts[optimizationType as keyof typeof typeSpecificPrompts] || '');
}

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
 