/**
 * AI提示词优化服务
 * 参考prompt-optimizer-master项目实现
 */

// 类型定义
export interface OptimizationRequest {
  prompt: string;
  type: 'general' | 'specific' | 'creative' | 'analytical';
  language?: 'zh' | 'en';
  requirements?: string;
}

export interface OptimizationResult {
  optimizedPrompt: string;
  improvements: string[];
  score: {
    clarity: number;
    specificity: number;
    completeness: number;
    overall: number;
  };
  suggestions: string[];
}

export interface IterationRequest {
  originalPrompt: string;
  currentPrompt: string;
  requirements: string;
  type: 'refine' | 'expand' | 'simplify';
}

// 优化模板
const OPTIMIZATION_TEMPLATES = {
  general: {
    system: `你是一个专业的AI提示词优化师。你的任务是优化用户提供的提示词，使其更加清晰、具体和有效。

优化原则：
1. 清晰性：确保指令明确，避免歧义
2. 具体性：提供具体的要求和期望输出格式
3. 完整性：包含必要的上下文和约束条件
4. 结构化：使用清晰的结构和格式
5. 可操作性：确保AI能够理解并执行

请分析用户的提示词，指出其问题和改进点，然后提供优化后的版本。

输出格式：
### 原始提示词分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 改进说明
[说明具体的改进点和原因]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
    
    user: `请优化以下提示词：

{prompt}

{requirements}`
  },

  iteration: {
    system: `你是一个AI提示词迭代优化专家。基于用户的反馈和新要求，对现有提示词进行迭代改进。

迭代原则：
1. 保持原有意图的基础上进行改进
2. 针对具体问题进行精准优化
3. 平衡复杂度和实用性
4. 确保向后兼容性

请根据用户的迭代要求，对提示词进行精准改进。`,
    
    user: `原始提示词：
{originalPrompt}

当前提示词：
{currentPrompt}

迭代要求：
{requirements}

迭代类型：{type}

请根据以上信息对提示词进行迭代优化。`
  },

  analysis: {
    system: `你是一个提示词质量分析专家。请对提示词进行全面分析，并给出评分和改进建议。

分析维度：
1. 清晰性 (1-10分)：指令是否明确清晰
2. 具体性 (1-10分)：要求是否具体详细
3. 完整性 (1-10分)：是否包含必要信息
4. 结构性 (1-10分)：结构是否合理

请提供JSON格式的分析结果。`,
    
    user: `请分析以下提示词的质量：

{prompt}`
  }
};

// 评分函数
function calculateScore(prompt: string): OptimizationResult['score'] {
  const length = prompt.length;
  const hasStructure = /[\n\r]/.test(prompt) || prompt.includes('：') || prompt.includes(':');
  const hasSpecificRequirements = /要求|格式|输出|结构|步骤/.test(prompt);
  const hasContext = /背景|上下文|场景|目标/.test(prompt);
  
  const clarity = Math.min(10, 3 + (hasStructure ? 3 : 0) + (length > 50 ? 2 : 0) + (length > 100 ? 2 : 0));
  const specificity = Math.min(10, 2 + (hasSpecificRequirements ? 4 : 0) + (length > 100 ? 2 : 0) + (length > 200 ? 2 : 0));
  const completeness = Math.min(10, 3 + (hasContext ? 3 : 0) + (hasSpecificRequirements ? 2 : 0) + (hasStructure ? 2 : 0));
  const overall = Math.round((clarity + specificity + completeness) / 3 * 10) / 10;

  return { clarity, specificity, completeness, overall };
}

// 生成改进建议
function generateSuggestions(prompt: string): string[] {
  const suggestions: string[] = [];
  
  if (prompt.length < 50) {
    suggestions.push('提示词过于简短，建议增加更多细节和要求');
  }
  
  if (!/[\n\r]/.test(prompt) && !prompt.includes('：') && !prompt.includes(':')) {
    suggestions.push('建议使用结构化格式，提高可读性');
  }
  
  if (!/要求|格式|输出|结构|步骤/.test(prompt)) {
    suggestions.push('建议明确输出格式和具体要求');
  }
  
  if (!/背景|上下文|场景|目标/.test(prompt)) {
    suggestions.push('建议提供相关背景信息和使用场景');
  }
  
  if (!/例如|示例|比如/.test(prompt)) {
    suggestions.push('建议提供具体示例，帮助AI更好理解');
  }
  
  return suggestions;
}

// 主要优化服务类
export class PromptOptimizer {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model?: string;
  }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-3.5-turbo';
  }

  /**
   * 优化提示词
   */
  async optimizePrompt(request: OptimizationRequest): Promise<OptimizationResult> {
    try {
      const template = OPTIMIZATION_TEMPLATES.general;
      const requirements = request.requirements ? `\n\n特殊要求：${request.requirements}` : '';
      
      const response = await this.callLLM(
        template.system,
        template.user.replace('{prompt}', request.prompt).replace('{requirements}', requirements)
      );

      // 解析响应
      const optimizedPrompt = this.extractOptimizedPrompt(response);
      const improvements = this.extractImprovements(response);
      const score = calculateScore(optimizedPrompt);
      const suggestions = generateSuggestions(request.prompt);

      return {
        optimizedPrompt,
        improvements,
        score,
        suggestions
      };
    } catch (error) {
      console.error('提示词优化失败:', error);
      throw new Error(`优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 迭代优化提示词
   */
  async iteratePrompt(request: IterationRequest): Promise<string> {
    try {
      const template = OPTIMIZATION_TEMPLATES.iteration;
      
      const userPrompt = template.user
        .replace('{originalPrompt}', request.originalPrompt)
        .replace('{currentPrompt}', request.currentPrompt)
        .replace('{requirements}', request.requirements)
        .replace('{type}', request.type);

      const response = await this.callLLM(template.system, userPrompt);
      
      return this.extractOptimizedPrompt(response);
    } catch (error) {
      console.error('迭代优化失败:', error);
      throw new Error(`迭代失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 分析提示词质量
   */
  async analyzePrompt(prompt: string): Promise<OptimizationResult['score']> {
    try {
      const template = OPTIMIZATION_TEMPLATES.analysis;
      
      const response = await this.callLLM(
        template.system,
        template.user.replace('{prompt}', prompt)
      );

      // 尝试解析JSON格式的分析结果
      try {
        const analysisMatch = response.match(/\{[\s\S]*\}/);
        if (analysisMatch) {
          const analysis = JSON.parse(analysisMatch[0]);
          return {
            clarity: analysis.clarity || calculateScore(prompt).clarity,
            specificity: analysis.specificity || calculateScore(prompt).specificity,
            completeness: analysis.completeness || calculateScore(prompt).completeness,
            overall: analysis.overall || calculateScore(prompt).overall
          };
        }
      } catch (parseError) {
        console.warn('无法解析AI分析结果，使用默认评分');
      }

      // 回退到默认评分
      return calculateScore(prompt);
    } catch (error) {
        console.error('分析失败:', error);
        throw new Error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'LLM API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private extractOptimizedPrompt(response: string): string {
    const match = response.match(/### 优化后的提示词\s*([\s\S]*?)\s*(?:###|$)/);
    return match ? match[1].trim() : response.trim();
  }

  private extractImprovements(response: string): string[] {
    const match = response.match(/### 改进说明\s*([\s\S]*?)\s*(?:###|$)/);
    if (!match) return [];
    
    return match[1].trim().split('\n').map(line => line.replace(/^\s*[-*]?\s*/, '')).filter(Boolean);
  }
}

export async function createPromptOptimizer(): Promise<PromptOptimizer | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    
    const session = await response.json();
    if (!session.accessToken) return null;

    return new PromptOptimizer({
      apiKey: session.accessToken,
      baseURL: '/api/mcp' 
    });
  } catch (error) {
    console.error('创建优化器失败:', error);
    return null;
  }
}

export async function optimizePrompt(
  prompt: string, 
  requirements?: string,
  type: OptimizationRequest['type'] = 'general'
): Promise<OptimizationResult | null> {
  try {
    const optimizer = await createPromptOptimizer();
    if (!optimizer) {
      throw new Error('无法初始化优化器');
    }
    return await optimizer.optimizePrompt({ prompt, requirements, type });
  } catch (error) {
    console.error('优化提示词失败:', error);
    return null;
  }
}

export async function iteratePrompt(
  originalPrompt: string,
  currentPrompt: string,
  requirements: string,
  type: IterationRequest['type'] = 'refine'
): Promise<string | null> {
  try {
    const optimizer = await createPromptOptimizer();
    if (!optimizer) {
      throw new Error('无法初始化优化器');
    }
    return await optimizer.iteratePrompt({ originalPrompt, currentPrompt, requirements, type });
  } catch (error) {
    console.error('迭代提示词失败:', error);
    return null;
  }
}

export async function analyzePrompt(prompt: string): Promise<OptimizationResult['score'] | null> {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      console.error('分析API调用失败:', response.status, response.statusText);
      // 返回基于本地计算的默认值
      return calculateScore(prompt);
    }

    const result = await response.json();
    
    if (result.success && result.data.score) {
      return result.data.score;
    } else {
      console.warn('分析API返回数据格式不正确，使用本地计算:', result);
      return calculateScore(prompt);
    }

  } catch (error) {
    console.error('分析提示词时发生错误:', error);
    // 发生错误时，返回基于本地计算的默认值
    return calculateScore(prompt);
  }
} 