import { BaseMCPTool } from '../shared/base-tool';
import type { ToolDescription, ToolParameter, ToolContext, ToolResult } from '../types';

// 优化模板类型
interface OptimizationTemplate {
  system: string;
  user: string;
}

// 优化参数接口
interface PromptOptimizationParams {
  content: string;
  optimization_type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'analysis' | 'iteration';
  requirements?: string;
  context?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  include_analysis?: boolean;
  language?: 'zh' | 'en';
  // 迭代优化专用参数
  original_prompt?: string;
  current_prompt?: string;
  iteration_type?: string;
}

// 优化结果接口
interface OptimizationResult {
  optimization_type: string;
  original_prompt: string;
  optimized_prompt?: string;
  analysis?: string;
  improvement_points: string[];
  usage_suggestions: string[];
  optimization_template: OptimizationTemplate;
  quality_score?: {
    clarity: number;
    specificity: number;
    completeness: number;
    structure: number;
    operability: number;
    overall: number;
  };
  techniques?: string[];
  guide?: string[];
  parameters?: string;
  complexity: string;
}

/**
 * 提示词优化MCP工具
 * 为第三方AI客户端提供结构化的提示词优化指导
 */
export class PromptOptimizerMCPTool extends BaseMCPTool {
  readonly name = 'prompt_optimizer';
  readonly description = '🎯 提示词优化器 - 为第三方AI客户端提供结构化的提示词优化指导和分析';

  // 优化模板库（从Web版本移植并优化）
  private readonly OPTIMIZATION_TEMPLATES: Record<string, OptimizationTemplate> = {
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

{requirements}`,
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

特殊要求：{requirements}`,
    },

    technical: {
      system: `你是一个技术导向的提示词优化专家。专注于提升技术任务的准确性和可执行性。

技术优化重点：
1. 精确性：使用准确的技术术语和规范
2. 结构化：采用清晰的逻辑结构
3. 可验证：包含可衡量的输出标准
4. 错误处理：考虑边缘情况和异常处理
5. 最佳实践：遵循行业标准和最佳实践

请将提示词优化为技术任务友好的版本。`,
      
      user: `请将以下提示词优化为技术导向的版本：

{prompt}

技术要求：{requirements}`,
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

商业要求：{requirements}`,
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

教学要求：{requirements}`,
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

请提供一个通用的高质量优化版本，适合各种AI绘图模型使用。`,
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
  };

  getToolDefinition(): ToolDescription {
    return {
      name: this.name,
      description: this.description,
      schema_version: 'v1',
      parameters: {
        content: {
          type: 'string',
          description: '要优化的提示词内容',
          required: true,
        } as ToolParameter,

        optimization_type: {
          type: 'string',
          description: '优化类型：general(通用)|creative(创意)|technical(技术)|business(商务)|educational(教育)|drawing(绘图)|analysis(分析)|iteration(迭代)',
          required: false,
        } as ToolParameter,

        requirements: {
          type: 'string',
          description: '特殊要求或约束条件',
          required: false,
        } as ToolParameter,

        context: {
          type: 'string',
          description: '使用场景和上下文信息',
          required: false,
        } as ToolParameter,

        complexity: {
          type: 'string',
          description: '复杂度级别：simple|medium|complex',
          required: false,
        } as ToolParameter,

        include_analysis: {
          type: 'boolean',
          description: '是否包含详细分析',
          required: false,
        } as ToolParameter,

        language: {
          type: 'string',
          description: '优化语言：zh(中文)|en(英文)，默认中文',
          required: false,
        } as ToolParameter,

        // 迭代优化专用参数
        original_prompt: {
          type: 'string',
          description: '原始提示词（用于迭代优化）',
          required: false,
        } as ToolParameter,

        current_prompt: {
          type: 'string',
          description: '当前提示词（用于迭代优化）',
          required: false,
        } as ToolParameter,

        iteration_type: {
          type: 'string',
          description: '迭代类型（用于迭代优化）',
          required: false,
        } as ToolParameter,
      },
    };
  }

  async execute(params: PromptOptimizationParams, context: ToolContext): Promise<ToolResult> {
    this.validateParams(params, ['content']);

    const startTime = performance.now();
    
    try {
      this.logExecution('提示词优化开始', context, {
        optimizationType: params.optimization_type || 'general',
        contentLength: params.content.length,
        hasRequirements: !!params.requirements,
        includeAnalysis: params.include_analysis || false
      });

      // 获取优化类型
      const optimizationType = params.optimization_type || 'general';
      
      // 验证优化类型
      if (!this.OPTIMIZATION_TEMPLATES[optimizationType]) {
        return {
          success: false,
          message: `不支持的优化类型: ${optimizationType}。支持的类型: general, creative, technical, business, educational, drawing, analysis, iteration`
        };
      }

      // 构建优化结果
      const result = await this.buildOptimizationResult(params, optimizationType);

      this.logExecution('提示词优化完成', context, {
        optimizationType: result.optimization_type,
        hasOptimizedPrompt: !!result.optimized_prompt,
        improvementCount: result.improvement_points.length,
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      return {
        success: true,
        data: result,
        message: `✅ 提示词优化指导已生成！类型：${optimizationType}${params.include_analysis ? '（包含详细分析）' : ''}`
      };

    } catch (error) {
      console.error('[PromptOptimizerMCP] 优化失败:', error);
      return {
        success: false,
        message: `提示词优化失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 构建优化结果
   */
  private async buildOptimizationResult(
    params: PromptOptimizationParams, 
    optimizationType: string
  ): Promise<OptimizationResult> {
    const template = this.OPTIMIZATION_TEMPLATES[optimizationType];
    
    // 构建基础结果
    const result: OptimizationResult = {
      optimization_type: optimizationType,
      original_prompt: params.content,
      improvement_points: this.generateImprovementPoints(params, optimizationType),
      usage_suggestions: this.generateUsageSuggestions(params, optimizationType),
      optimization_template: template,
      complexity: params.complexity || 'medium'
    };

    // 为迭代类型处理特殊参数
    if (optimizationType === 'iteration') {
      if (params.original_prompt) {
        result.optimization_template = {
          ...template,
          user: template.user
            .replace('{originalPrompt}', params.original_prompt)
            .replace('{currentPrompt}', params.current_prompt || params.content)
            .replace('{requirements}', params.requirements || '')
            .replace('{type}', params.iteration_type || 'general')
        };
      }
    } else {
      // 普通优化类型的模板参数替换
      result.optimization_template = {
        ...template,
        user: template.user
          .replace('{prompt}', params.content)
          .replace('{requirements}', params.requirements ? `\n\n特殊要求：${params.requirements}` : '')
      };
    }

    // 如果需要分析，添加质量评分
    if (params.include_analysis || optimizationType === 'analysis') {
      result.quality_score = this.generateQualityScore(params.content);
      result.analysis = this.generateAnalysisText(params.content, result.quality_score);
    }

    // 为绘图类型添加额外信息
    if (optimizationType === 'drawing') {
      result.techniques = this.generateDrawingTechniques();
      result.guide = this.generateDrawingGuide();
      result.parameters = this.generateDrawingParameters();
    }

    return result;
  }

  /**
   * 生成改进建议
   */
  private generateImprovementPoints(params: PromptOptimizationParams, type: string): string[] {
    const content = params.content.toLowerCase();
    const points: string[] = [];

    // 基于类型的通用改进点
    const typeBasedPoints = {
      general: [
        '使用更具体和明确的指令',
        '添加预期输出格式说明',
        '包含必要的上下文信息',
        '设置清晰的约束条件'
      ],
      creative: [
        '增加激发想象力的描述性语言',
        '加入情感色彩和氛围描述',
        '提供多角度思考的引导',
        '保留创意发挥的灵活空间'
      ],
      technical: [
        '使用准确的技术术语',
        '添加具体的技术规范要求',
        '包含错误处理和边缘情况',
        '提供可验证的输出标准'
      ],
      business: [
        '明确业务目标和成功指标',
        '考虑ROI和商业价值',
        '包含利益相关者需求',
        '确保方案可执行性'
      ],
      educational: [
        '采用循序渐进的学习结构',
        '增加示例和练习内容',
        '加强互动性和参与度',
        '包含学习效果评估'
      ],
      drawing: [
        '优化主体和场景的具体描述',
        '添加艺术风格和技法说明',
        '包含构图和视觉效果要求',
        '增加质量增强关键词'
      ],
      analysis: [
        '提供多维度分析框架',
        '包含量化评估标准',
        '添加具体的改进建议',
        '确保分析的客观性'
      ]
    };

    // 获取类型特定的改进点
    const basePoints = typeBasedPoints[type as keyof typeof typeBasedPoints] || typeBasedPoints.general;
    points.push(...basePoints.slice(0, 3));

    // 基于内容长度的改进点
    if (params.content.length < 50) {
      points.push('增加更多详细描述和要求');
    } else if (params.content.length > 500) {
      points.push('优化结构，提高可读性');
    }

    // 基于内容特征的改进点
    if (!content.includes('格式') && !content.includes('format')) {
      points.push('添加输出格式要求');
    }

    return [...new Set(points)].slice(0, 5);
  }

  /**
   * 生成使用建议
   */
  private generateUsageSuggestions(params: PromptOptimizationParams, type: string): string[] {
    const suggestions: string[] = [];

    const typeSuggestions = {
      general: [
        '在具体任务中测试优化后的提示词',
        '根据AI反馈进一步调整参数',
        '保持提示词的简洁性和清晰性'
      ],
      creative: [
        '鼓励AI产生多个创意选项',
        '适当调整创意限制条件',
        '结合具体场景进行创意引导'
      ],
      technical: [
        '在开发环境中先行测试',
        '注意版本兼容性和依赖关系',
        '建立代码审查和质量检查流程'
      ],
      business: [
        '定期评估商业效果和ROI',
        '收集用户反馈和使用数据',
        '适应市场变化调整策略'
      ],
      educational: [
        '根据学习者反馈调整难度',
        '提供多样化的学习路径',
        '建立学习进度跟踪机制'
      ],
      drawing: [
        '针对不同AI模型调整关键词',
        '保存高质量的生成结果作为参考',
        '建立个人风格的提示词库'
      ]
    };

    const baseTypeSuggestions = typeSuggestions[type as keyof typeof typeSuggestions] || typeSuggestions.general;
    suggestions.push(...baseTypeSuggestions);

    // 通用建议
    suggestions.push('定期迭代和改进提示词');
    suggestions.push('记录使用效果以便后续优化');

    return suggestions.slice(0, 4);
  }

  /**
   * 生成质量评分
   */
  private generateQualityScore(content: string): {
    clarity: number;
    specificity: number;
    completeness: number;
    structure: number;
    operability: number;
    overall: number;
  } {
    const contentLower = content.toLowerCase();
    
    // 清晰性评分（基于指令明确性）
    let clarity = 5;
    if (content.includes('请') || content.includes('帮')) clarity += 1;
    if (content.includes('需要') || content.includes('要求')) clarity += 1;
    if (content.length > 20) clarity += 1;
    if (!content.includes('...') && !content.includes('等等')) clarity += 1;

    // 具体性评分（基于具体要求）
    let specificity = 5;
    if (contentLower.includes('格式') || contentLower.includes('format')) specificity += 1;
    if (contentLower.includes('步骤') || contentLower.includes('step')) specificity += 1;
    if (content.match(/\d+/)) specificity += 1; // 包含数字
    if (content.includes('：') || content.includes(':')) specificity += 1;

    // 完整性评分（基于信息完整性）
    let completeness = 5;
    if (content.length > 100) completeness += 1;
    if (contentLower.includes('背景') || contentLower.includes('context')) completeness += 1;
    if (contentLower.includes('目标') || contentLower.includes('goal')) completeness += 1;
    if (contentLower.includes('限制') || contentLower.includes('constraint')) completeness += 1;

    // 结构性评分（基于组织结构）
    let structure = 5;
    if (content.includes('\n')) structure += 1;
    if (content.includes('1.') || content.includes('一、')) structure += 1;
    if (content.includes('###') || content.includes('#')) structure += 1;
    if (content.includes('- ') || content.includes('* ')) structure += 1;

    // 可操作性评分（基于执行难度）
    let operability = 5;
    if (content.length < 200) operability += 1; // 不过于复杂
    if (!contentLower.includes('可能') && !contentLower.includes('也许')) operability += 1; // 避免模糊性
    if (contentLower.includes('具体') || contentLower.includes('明确')) operability += 1;
    if (content.split('?').length <= 2) operability += 1; // 避免过多问题

    // 限制最大值
    clarity = Math.min(clarity, 10);
    specificity = Math.min(specificity, 10);
    completeness = Math.min(completeness, 10);
    structure = Math.min(structure, 10);
    operability = Math.min(operability, 10);

    const overall = Number(((clarity + specificity + completeness + structure + operability) / 5).toFixed(1));

    return {
      clarity,
      specificity,
      completeness,
      structure,
      operability,
      overall
    };
  }

  /**
   * 生成分析文本
   */
  private generateAnalysisText(content: string, score: any): string {
    const analysis = [];
    
    analysis.push(`**清晰性 (${score.clarity}/10)**: ${score.clarity >= 7 ? '指令相对明确' : '指令需要更加明确'}`);
    analysis.push(`**具体性 (${score.specificity}/10)**: ${score.specificity >= 7 ? '要求比较具体' : '需要更具体的要求描述'}`);
    analysis.push(`**完整性 (${score.completeness}/10)**: ${score.completeness >= 7 ? '信息相对完整' : '缺少必要的上下文信息'}`);
    analysis.push(`**结构性 (${score.structure}/10)**: ${score.structure >= 7 ? '结构较为合理' : '建议优化内容结构'}`);
    analysis.push(`**可操作性 (${score.operability}/10)**: ${score.operability >= 7 ? 'AI较容易理解执行' : '需要简化或明确操作要求'}`);
    
    return analysis.join('\n');
  }

  /**
   * 生成绘图技巧
   */
  private generateDrawingTechniques(): string[] {
    return [
      '使用具体的艺术风格关键词',
      '添加光影和构图描述',
      '指定画面质量增强词',
      '使用情感色彩描述',
      '添加细节和纹理说明'
    ];
  }

  /**
   * 生成绘图指南
   */
  private generateDrawingGuide(): string[] {
    return [
      '主体在前，背景在后的描述顺序',
      '使用英文关键词提高识别率',
      '避免过于复杂的复合场景',
      '根据AI模型特点调整关键词',
      '保存成功的提示词模板'
    ];
  }

  /**
   * 生成绘图参数建议
   */
  private generateDrawingParameters(): string {
    return 'high quality, detailed, professional, 8k resolution, masterpiece';
  }
}

// 导出工具实例
export const promptOptimizerMCPTool = new PromptOptimizerMCPTool();

// 导出工具定义
export const promptOptimizerMCPToolDef = promptOptimizerMCPTool.getToolDefinition();

// 导出处理函数
export const handlePromptOptimization = (params: PromptOptimizationParams, context: ToolContext) => 
  promptOptimizerMCPTool.execute(params, context);