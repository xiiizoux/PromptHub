/**
 * AI提示词优化服务
 * 参考prompt-optimizer-master项目实现
 */

// 类型定义
export interface OptimizationRequest {
  prompt: string;
  type: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'advanced' | 'drawing';
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
          system: `你是一个专业的AI提示词优化专家。你的任务是优化用户提供的提示词，使其更加清晰、具体和有效。
      
      优化原则：
      1. 清晰性：确保指令明确，避免歧义
      2. 具体性：提供具体的要求和期望输出格式
      3. 完整性：包含必要的上下文和约束条件
      4. 结构化：使用清晰的结构和格式
      5. 可操作性：确保AI能够理解并执行
      
      请分析用户的提示词，识别其问题和改进点，然后提供优化后的版本。
      
      输出格式：
      ### 问题分析
      [分析原始提示词的问题和不足]
      
      ### 优化后的提示词
      [提供优化后的提示词]
      
      ### 主要改进点
      [列出3-5个具体的改进点]
      
      ### 使用建议
      [提供使用该提示词的最佳实践建议]`,
          
          user: `请优化以下提示词：
      
      {prompt}
      
      {requirements}`
        },
      
        creative: {
          system: `你是一个专业的创意提示词优化专家。专注于激发AI的创意潜能和想象力。
      
      创意优化重点：
      1. 激发想象力：使用启发性语言和开放式问题
      2. 多角度思考：鼓励从不同维度和视角思考
      3. 原创性：强调独特性和创新性
      4. 情感共鸣：加入情感元素和感性描述
      5. 灵活性：留有创意发挥的空间
      
      请将提示词优化为更具创意激发性的版本。`,
          
          user: `请将以下提示词优化为创意导向的版本：
      
      {prompt}
      
      特殊要求：{requirements}`
        },
      
        technical: {
          system: `你是一个技术导向的提示词优化专家。专注于提升技术任务的准确性和可执行性。
      
      技术优化重点：
      1. 精确性：使用准确的技术術語和规范
      2. 结构化：采用清晰的逻辑结构
      3. 可验证：包含可衡量的输出标准
      4. 错误处理：考虑边缘情况和异常处理
      5. 最佳实践：遵循行业标准和最佳实践
      
      请将提示词优化为技术任务友好的版本。`,
          
          user: `请将以下提示词优化为技术导向的版本：
      
      {prompt}
      
      技术要求：{requirements}`
        },
      
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
      
      请根据以上信息对提示词进行迭代优化。`
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
      
      {prompt}`
        },
      
        business: {
          system: `你是一个商业导向的提示词优化专家。专注于提升商业价值和实用性。
      
      商业优化重点：
      1. 目标导向：明确商业目标和成功指标
      2. ROI考量：考虑投入产出比
      3. 利益相关者：考虑各方利益和需求
      4. 可衡量性：包含可量化的评估标准
      5. 执行性：确保方案可落地执行
      
      请将提示词优化为商业导向的版本。`,
          
          user: `请将以下提示词优化为商业导向的版本：
      
      {prompt}
      
      商业要求：{requirements}`
        },
      
        educational: {
          system: `你是一个教育导向的提示词优化专家。专注于提升学习效果和教学质量。
      
      教育优化重点：
      1. 循序渐进：采用渐进式学习结构
      2. 示例丰富：包含充足的示例和练习
      3. 互动性：鼓励思考和讨论
      4. 适配性：考虑不同学习水平
      5. 评估反馈：包含学习评估机制
      
      请将提示词优化为教育导向的版本。`,
          
          user: `请将以下提示词优化为教育导向的版本：
      
      {prompt}
      
      教学要求：{requirements}`
        },

        drawing: {
                  system: `你是一个专业的AI绘图提示词优化专家，专门优化用于图像生成模型（如Midjourney、Stable Diffusion、DALL-E等）的提示词。
        
              绘图提示词优化原则：
              1. **主体描述优化**：
                 - 使用具体而生动的主体描述
                 - 明确主体的姿态、表情、服装等细节
                 - 考虑主体与环境的关系
        
              2. **风格与技法**：
                 - 指定明确的艺术风格（如写实、卡通、油画等）
                 - 添加艺术技法描述（光影、构图、色彩等）
                 - 引用知名艺术家风格（如有需要）
        
              3. **环境与背景**：
                 - 详细描述场景和背景元素
                 - 指定时间、地点、氛围
                 - 考虑景深和空间关系
        
              4. **质量增强**：
                 - 添加质量增强关键词
                 - 优化画面构图和视觉效果
                 - 考虑不同AI模型的特点
        
              请分析原始提示词，识别其绘图意图，然后提供一个通用且高质量的优化版本。
        
              输出格式：
              ### 问题分析
              [分析原始提示词的绘图意图和不足]
              
              ### 优化后的提示词
              [提供一个通用的高质量优化提示词]
              
              ### 主要改进点
              [列出3-5个具体的改进点]
              
              ### 使用建议
              [提供使用该提示词的最佳实践建议]`,
        
                  user: `请优化以下绘图提示词：
        
              {prompt}
        
              特殊要求：{requirements}
        
              请提供一个通用的高质量优化版本，适合各种AI绘图模型使用。`
                }

      };
;

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
        // 根据类型选择合适的模板
        // 对于advanced类型，使用general模板；drawing类型使用专门的drawing模板
        const templateType = request.type === 'advanced' ? 'general' : (request.type || 'general');
      const template = OPTIMIZATION_TEMPLATES[templateType as keyof typeof OPTIMIZATION_TEMPLATES] || OPTIMIZATION_TEMPLATES.general;
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
  
    /**
     * 智能优化提示词 - 基于类型自动选择最佳优化策略
     */
    async optimizePromptIntelligently(
      prompt: string, 
      options: {
        type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing',
        requirements?: string,
        context?: string,
        complexity?: 'simple' | 'medium' | 'complex'
      } = {}
    ): Promise<OptimizationResult & { analysisScore: OptimizationResult['score'] }> {
      try {
        // 首先分析提示词类型和复杂度
        const analysisScore = await this.analyzePrompt(prompt);
        const detectedType = await this.detectPromptType(prompt);
        
        // 选择最佳优化类型
        const optimizationType = options.type || detectedType;
        const template = OPTIMIZATION_TEMPLATES[optimizationType] || OPTIMIZATION_TEMPLATES.general;
        
        // 构建优化请求
        const requirements = options.requirements ? `\n\n特殊要求：${options.requirements}` : '';
        const context = options.context ? `\n\n使用场景：${options.context}` : '';
        
        const response = await this.callLLM(
          template.system,
          template.user
            .replace('{prompt}', prompt)
            .replace('{requirements}', requirements + context)
        );
  
        // 解析响应
        const optimizedPrompt = this.extractOptimizedPrompt(response);
        const improvements = this.extractImprovements(response);
        const score = calculateScore(optimizedPrompt);
        const suggestions = generateSuggestions(prompt);
  
        return {
          optimizedPrompt,
          improvements,
          score,
          suggestions,
          analysisScore
        };
      } catch (error) {
        console.error('智能优化失败:', error);
        throw new Error(`智能优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  
    /**
     * 检测提示词类型
     */
    private async detectPromptType(prompt: string): Promise<'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing'> {
      const keywords = {
        creative: ['创意', '想象', '创作', '设计', '艺术', '故事', '创新', 'creative', 'imagine', 'design', 'art', 'story'],
        technical: ['代码', '编程', '技术', '算法', '系统', '开发', 'code', 'programming', 'algorithm', 'system', 'development'],
        business: ['商业', '营销', '销售', '市场', '策略', '管理', 'business', 'marketing', 'sales', 'strategy', 'management'],
        educational: ['教学', '学习', '教育', '培训', '课程', 'teaching', 'learning', 'education', 'training', 'course'],
        drawing: ['绘图', '绘画', '画', '图像', '图片', '画面', '艺术风格', '构图', '色彩', '光影', 'midjourney', 'stable diffusion', 'dall-e', 'drawing', 'painting', 'image', 'artwork', 'style', 'composition', 'lighting', 'portrait', 'landscape', 'character', 'fantasy', 'realistic', 'cartoon', 'anime', '油画', '水彩', '素描', '卡通', '动漫', '写实', '抽象', '肖像', '风景', '人物', '角色']
      };
  
      const lowerPrompt = prompt.toLowerCase();
      let maxScore = 0;
      let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' = 'general';
  
      Object.entries(keywords).forEach(([type, words]: [string, string[]]) => {
        const score = words.reduce((count, word) => {
          return count + (lowerPrompt.includes(word.toLowerCase()) ? 1 : 0);
        }, 0);
        
        if (score > maxScore) {
          maxScore = score;
          detectedType = type as 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing';
        }
      });
  
      return detectedType;
    }
  
    /**
     * 批量优化提示词
     */
    async optimizePromptBatch(
      prompts: Array<{
        prompt: string;
        options?: {
          type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing';
          requirements?: string;
          context?: string;
          complexity?: 'simple' | 'medium' | 'complex';
        };
      }>
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
            analysisScore: calculateScore(prompt)
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userPrompt, // 传递用户提示词
          optimizationType: 'general', // 默认优化类型
          requirements: '', // 可以从系统提示词中提取需求
          context: systemPrompt // 将系统提示词作为上下文
        })
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
      baseURL: '' // 使用相对路径调用
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        action: 'analyze_quality'
      })
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
    type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing',
    requirements?: string,
    context?: string,
    complexity?: 'simple' | 'medium' | 'complex',
    includeAnalysis?: boolean
  } = {}
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        optimizationType: options.type || 'general',
        requirements: options.requirements || '',
        context: options.context || '',
        complexity: options.complexity || 'medium',
        includeAnalysis: options.includeAnalysis || false
      })
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
    type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing';
    requirements?: string;
  }>
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
 * 智能检测并优化提示词类型
 */
export async function optimizePromptIntelligently(
  prompt: string,
  options: {
    requirements?: string;
    context?: string;
    autoDetectType?: boolean;
  } = {}
): Promise<OptimizationResult | null> {
  try {
    // 如果启用自动检测，先检测提示词类型
    let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' = 'general';
    
    if (options.autoDetectType !== false) {
      detectedType = detectPromptType(prompt);
    }

    // 使用高级优化API
    const result = await optimizePromptAdvanced(prompt, {
      type: detectedType,
      requirements: options.requirements,
      context: options.context,
      complexity: 'medium',
      includeAnalysis: true
    });

    if (!result) return null;

    // 转换为 OptimizationResult 格式
    return {
      optimizedPrompt: result.optimized,
      improvements: result.improvements,
      score: calculateScore(result.optimized),
      suggestions: result.techniques || []
    };
  } catch (error) {
    console.error('智能优化失败:', error);
    return null;
  }
}

/**
 * 检测提示词类型
 */
function detectPromptType(prompt: string): 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' {
  const keywords = {
    creative: ['创意', '想象', '创作', '设计', '艺术', '故事', '创新', 'creative', 'imagine', 'design', 'art', 'story'],
    technical: ['代码', '编程', '技术', '算法', '系统', '开发', 'code', 'programming', 'algorithm', 'system', 'development'],
    business: ['商业', '营销', '销售', '市场', '策略', '管理', 'business', 'marketing', 'sales', 'strategy', 'management'],
    educational: ['教学', '学习', '教育', '培训', '课程', 'teaching', 'learning', 'education', 'training', 'course'],
    drawing: ['绘图', '绘画', '画', '图像', '图片', '画面', '艺术风格', '构图', '色彩', '光影', 'midjourney', 'stable diffusion', 'dall-e', 'drawing', 'painting', 'image', 'artwork', 'style', 'composition', 'lighting', 'portrait', 'landscape', 'character', 'fantasy', 'realistic', 'cartoon', 'anime', '油画', '水彩', '素描', '卡通', '动漫', '写实', '抽象', '肖像', '风景', '人物', '角色']
  };

  const lowerPrompt = prompt.toLowerCase();
  let maxScore = 0;
  let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' = 'general';

  Object.entries(keywords).forEach(([type, words]: [string, string[]]) => {
    const score = words.reduce((count, word) => {
      return count + (lowerPrompt.includes(word.toLowerCase()) ? 1 : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as typeof detectedType;
    }
  });

  return detectedType;
} 