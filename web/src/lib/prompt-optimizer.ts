/**
 * AI提示词优化服务
 * 重构版本：使用数据库动态分类替代硬编码模板
 */

import { promptCategoryMatcher } from '@/services/promptCategoryMatcher';
import { CategoryInfo } from '@/services/categoryService';

// 类型定义
export interface OptimizationRequest {
  prompt: string;
  category?: CategoryInfo; // 可选指定分类，否则使用智能匹配
  language?: 'zh' | 'en';
  requirements?: string;
  context?: string;
  complexity?: 'simple' | 'medium' | 'complex';
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
  category?: CategoryInfo; // 使用的分类信息
  confidence?: number; // 分类匹配置信度
}

export interface IterationRequest {
  originalPrompt: string;
  currentPrompt: string;
  requirements: string;
  type: 'refine' | 'expand' | 'simplify';
}

// 硬编码模板已移除，现在使用数据库中的动态分类模板
// 保留迭代和分析模板，因为它们不依赖于特定分类
const OPTIMIZATION_TEMPLATES = {
  iteration: {
    system: `你是一个AI提示词迭代优化专家。基于用户的反馈和新要求，对现有提示词进行精准改进。

    迭代优化原则：
    1. 保持原有意图的基础上进行改进
    2. 针对具体问题进行精准优化
    3. 平衡复杂度和实用性
    4. 确保向后兼容性
    5. 注重用户体验和易用性

    请根据用户的迭代要求，对提示词进行精准改进。`,

    user: `原始提示词：
    {originalPrompt}

    当前提示词：
    {currentPrompt}

    迭代要求：
    {requirements}

    迭代类型：{type}

    请根据以上信息对提示词进行迭代优化。`,
  },

  analysis: {
    system: `你是一个提示词质量分析专家。请对提示词进行全面分析，并给出评分和改进建议。

    分析维度：
    1. 清晰性 (1-10分)：指令是否明确清晰
    2. 具体性 (1-10分)：要求是否具体详细
    3. 完整性 (1-10分)：是否包含必要信息
    4. 结构性 (1-10分)：结构是否合理
    5. 可操作性 (1-10分)：AI是否容易理解执行

    请提供详细的分析报告和改进建议。

    输出格式：
    ### 质量评分
    {
      "clarity": 8,
      "specificity": 7,
      "completeness": 6,
      "structure": 8,
      "operability": 7,
      "overall": 7.2
    }

    ### 详细分析
    [各维度的详细分析]

    ### 改进建议
    [具体的改进建议]`,

    user: `请分析以下提示词的质量：

    {prompt}`,
  },
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
   * 优化提示词 - 使用动态分类模板
   */
  async optimizePrompt(request: OptimizationRequest): Promise<OptimizationResult> {
      try {
        let category: CategoryInfo | undefined;
        let confidence = 0;

        // 获取分类和优化模板
        if (request.category) {
          // 使用指定分类
          category = request.category;
          confidence = 1.0;
        } else {
          // 智能匹配分类
          const matchResult = await promptCategoryMatcher.matchCategory(request.prompt);
          category = matchResult.category;
          confidence = matchResult.confidence;
        }

        // 获取优化模板
        const templateResult = await promptCategoryMatcher.getOptimizationTemplate(
          request.prompt,
        );

        if (!templateResult || !templateResult.template) {
          throw new Error('无法获取优化模板');
        }

        // 构建优化请求
        const requirements = request.requirements ? `\n\n特殊要求：${request.requirements}` : '';
        const context = request.context ? `\n\n使用场景：${request.context}` : '';

        const userPrompt = `请优化以下提示词：

${request.prompt}

${requirements}${context}`;

        const response = await this.callLLM(templateResult.template, userPrompt);

        // 解析响应
        const optimizedPrompt = this.extractOptimizedPrompt(response);
        const improvements = this.extractImprovements(response);
        const score = calculateScore(optimizedPrompt);
        const suggestions = generateSuggestions(request.prompt);

        return {
          optimizedPrompt,
          improvements,
          score,
          suggestions,
          category,
          confidence,
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
        template.user.replace('{prompt}', prompt),
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
            overall: analysis.overall || calculateScore(prompt).overall,
          };
        }
      } catch (_parseError) {
        console.warn('无法解析AI分析结果，使用默认评分');
      }

      // 回退到默认评分
      return calculateScore(prompt);
    } catch (error) {
        console.error('分析失败:', error);
        throw new Error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
    /**
     * 智能优化提示词 - 使用动态分类匹配
     */
    async optimizePromptIntelligently(
      prompt: string,
      options: {
        category?: CategoryInfo,
        requirements?: string,
        context?: string,
        complexity?: 'simple' | 'medium' | 'complex'
      } = {},
    ): Promise<OptimizationResult & { analysisScore: OptimizationResult['score'] }> {
      try {
        // 首先分析提示词质量
        const analysisScore = await this.analyzePrompt(prompt);

        // 使用新的优化方法
        const optimizationResult = await this.optimizePrompt({
          prompt,
          category: options.category,
          requirements: options.requirements,
          context: options.context,
          complexity: options.complexity,
        });

        return {
          ...optimizationResult,
          analysisScore,
        };
      } catch (error) {
        console.error('智能优化失败:', error);
        throw new Error(`智能优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  
    // detectPromptType函数已移除，现在使用promptCategoryMatcher服务
  
    /**
     * 批量优化提示词
     */
    async optimizePromptBatch(
      prompts: Array<{
        prompt: string;
        options?: {
          category?: CategoryInfo;
          requirements?: string;
          context?: string;
          complexity?: 'simple' | 'medium' | 'complex';
        };
      }>,
    ): Promise<Array<OptimizationResult & { analysisScore: OptimizationResult['score'] }>> {
      const results = [];

      for (const { prompt, options } of prompts) {
        try {
          const result = await this.optimizePromptIntelligently(prompt, options || {});
          results.push(result);

          // 添加延迟以避免API限流
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`批量优化失败 - 提示词: ${prompt.substring(0, 50)}...`, error);
          results.push({
            optimizedPrompt: prompt, // 失败时返回原始提示词
            improvements: [`优化失败: ${error instanceof Error ? error.message : '未知错误'}`],
            score: calculateScore(prompt),
            suggestions: [],
            analysisScore: calculateScore(prompt),
          });
        }
      }

      return results;
    }
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
      // 修复API调用 - 使用正确的参数格式
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt, // 传递用户提示词
          optimizationType: 'general', // 默认优化类型
          requirements: '', // 可以从系统提示词中提取需求
          context: systemPrompt, // 将系统提示词作为上下文
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success || !data.data?.optimized) {
        throw new Error('Invalid response from optimization API');
      }
  
      return data.data.optimized;
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
    // 简化环境检查 - 直接创建优化器实例，让API层处理配置检查
    // 前端不需要直接检查API key，这应该由后端API处理
    return new PromptOptimizer({
      apiKey: '', // 通过API端点处理，不需要直接传递
      baseURL: '', // 使用相对路径调用
    });
  } catch (error) {
    console.error('创建优化器失败:', error);
    return null;
  }
}



export async function optimizePrompt(
  prompt: string,
  requirements?: string,
  _type?: string, // 保留参数但不再使用，现在使用智能匹配
): Promise<OptimizationResult | null> {
  try {
    const response = await fetch('/api/ai/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        requirements: requirements || '',
        context: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`优化失败: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '优化失败');
    }

    return {
      optimizedPrompt: data.data.optimized,
      improvements: data.data.improvements || [],
      score: calculateScore(data.data.optimized),
      suggestions: data.data.suggestions || [],
      category: data.data.category,
      confidence: data.data.confidence,
    };
  } catch (error) {
    console.error('优化提示词失败:', error);
    return null;
  }
}

export async function iteratePrompt(
  originalPrompt: string,
  currentPrompt: string,
  requirements: string,
  type: IterationRequest['type'] = 'refine',
): Promise<string | null> {
  try {
    const optimizer = await createPromptOptimizer();
    if (!optimizer) {
      console.warn('优化器未初始化，使用默认处理');
      // 如果优化器创建失败，返回当前提示词
      return currentPrompt;
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        action: 'analyze_quality',
      }),
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

/**
 * 高级智能优化 - 使用新的高级优化API
 */
export async function optimizePromptAdvanced(
  prompt: string,
  options: {
    type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced',
    requirements?: string,
    context?: string,
    complexity?: 'simple' | 'medium' | 'complex',
    includeAnalysis?: boolean
  } = {},
): Promise<{
  original: string;
  optimized: string;
  analysis?: string;
  improvements: string[];
  techniques?: string[];
  guide?: string[];
  parameters?: string;
  optimizationType: string;
  complexity: string;
} | null> {
  try {
    const response = await fetch('/api/ai/optimize-advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        optimizationType: options.type || 'general',
        requirements: options.requirements || '',
        context: options.context || '',
        complexity: options.complexity || 'medium',
        includeAnalysis: options.includeAnalysis || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `API call failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid response from advanced optimization API');
    }

    return data.data;
  } catch (error) {
    console.error('高级优化失败:', error);
    return null;
  }
}

/**
 * 批量优化提示词
 */
export async function optimizePromptBatch(
  prompts: Array<{
    prompt: string;
    type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced';
    requirements?: string;
  }>,
): Promise<Array<OptimizationResult | null>> {
  const results = [];
  
  for (const item of prompts) {
    try {
      const result = await optimizePrompt(item.prompt, item.requirements, item.type);
      results.push(result);
      
      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`批量优化失败 - 提示词: ${item.prompt.substring(0, 50)}...`, error);
      results.push(null);
    }
  }
  
  return results;
}

/**
 * 智能检测并优化提示词类型 - 现在使用动态分类系统
 */
export async function optimizePromptIntelligently(
  prompt: string,
  options: {
    requirements?: string;
    context?: string;
    autoDetectType?: boolean; // 保留参数但不再使用
  } = {},
): Promise<OptimizationResult | null> {
  try {
    // 直接使用新的优化API，它内置了智能分类匹配
    return await optimizePrompt(prompt, options.requirements);
  } catch (error) {
    console.error('智能优化失败:', error);
    return null;
  }
}

// detectPromptType函数已移除，现在使用promptCategoryMatcher服务