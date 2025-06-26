import { BaseMCPTool } from '../../shared/base-tool.js';
import type { ToolDescription, ToolParameter } from '../../types.js';
import type { ToolContext, ToolResult } from '../../shared/base-tool.js';

// 优化模板类型
interface OptimizationTemplate {
  system: string;
  user: string;
}

// 优化参数接口
import { MODEL_TAGS, getModelTagsByType, ModelType } from '../../constants/ai-models.js';

interface PromptOptimizationParams {
  content: string;
  optimization_type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'analysis' | 'iteration' | 'advanced' | 'finance';
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
      system: `🧠 通用优化模板（Universal Prompt Enhancement）
你是一位专业的提示词工程专家，专精于信息表达清晰化与语言结构优化。请协助我对以下提示词进行多维度优化，使其更清晰、具体、结构合理且便于模型执行。
优化方向包括：
1. 明确性：理清模糊措辞，使意图清晰易懂；
2. 具体性：补充背景、上下文、对象和预期输出的细节；
3. 结构性：调整语言组织逻辑，使提示更具条理与层级；
4. 实用性：确保提示能被AI准确执行，避免歧义或过度开放。
输出结构建议包括优化后提示词 + 优化说明摘要，便于理解优化思路。

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
      system: `🎨 创意优化模板（Creative Prompt Enhancement）
你是一位资深创意写作与艺术表达专家，擅长激发AI的想象力与情感输出能力。请将以下提示词升级为更具表现力、想象力与情境感染力的创意提示。
优化方向包括：
1. 创意元素：添加故事背景、虚构设定或视觉隐喻；
2. 生动语言：使用形象化、感官化、有节奏的语言；
3. 情感色彩：强化提示中的情绪基调（如温柔/狂野/孤独/希望）；
4. 风格指令：可加入如"赛博朋克""黑色幽默""治愈系"等创作风格引导。
可用于小说创作、品牌文案、歌词写作、广告灵感等AI生成任务。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
      
      user: `请将以下提示词优化为创意导向的版本：

{prompt}

特殊要求：{requirements}`,
    },

    technical: {
      system: `💻 技术优化模板（Technical Prompt Enhancement）
你是一位经验丰富的开发顾问与AI技术提示设计专家，擅长为语言模型生成结构良好、可执行的代码输出提示。请将以下提示词优化为适合用于编程任务的技术提示，确保生成内容具备规范性、完整性与工程可落地性。
优化方向包括：
1. 技术标准：指明所用编程语言、框架、规范；
2. 输入输出定义：说明输入数据结构与期望输出格式；
3. 错误处理机制：提示添加边界检查与异常处理代码；
4. 最佳实践建议：引导使用模块化、注释清晰、性能优化等策略。
输出建议附带说明文档格式或使用示例格式，便于开发者快速上手。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
      
      user: `请将以下提示词优化为技术导向的版本：

{prompt}

技术要求：{requirements}`,
    },

    business: {
      system: `💼 商业优化模板（Business-Oriented Prompt Enhancement）
你是一位AI商业分析师，具有企业战略、市场研究与商业建模经验。请将下列提示词优化为可用于生成商业战略、数据分析、市场洞察或产品定位方案的专业提示。
优化方向包括：
1. 商业目标明晰：明确业务背景、角色视角（如CEO/市场主管）；
2. KPI & ROI导向：说明期望的关键指标与商业价值体现方式；
3. 数据驱动逻辑：要求分析数据类型、渠道、预测模型等维度；
4. 用户/市场视角：引导模型考虑消费者行为与市场趋势。
特别适用于：商业计划书撰写、市场进入策略、竞品分析、用户调研建模等场景。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
      
      user: `请将以下提示词优化为商业导向的版本：

{prompt}

商业要求：{requirements}`,
    },

    educational: {
      system: `📚 教育优化模板（Educational Prompt Enhancement）
你是一位教育设计专家，擅长构建结构化、引导性强的教学提示词，适用于不同年龄层与知识领域。请对以下提示词进行优化，使其更有利于生成系统性学习内容、互动型教学对话、分阶段知识传授等结果。
优化方向包括：
1. 学习阶段定义：明确学习者年龄、背景或认知层级；
2. 知识模块设计：分层构建学习路径，符合"从易到难"原则；
3. 互动形式融入：加入提问、练习、案例、小测试等互动要素；
4. 反馈与评估机制：提示模型输出学习成果的检测方式或错误反馈。
适用于：AI 教师角色模拟、课程内容设计、知识点讲解、考试出题等任务。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
      
      user: `请将以下提示词优化为教育导向的版本：

{prompt}

教学要求：{requirements}`,
    },

    drawing: {
      system: `🎨 绘图优化模板（Image Generation Prompt Enhancement）
你是一位AI视觉艺术设计师，熟悉 Midjourney / DALL·E / Stable Diffusion 等图像生成模型的语义喜好与细节控制点。请将下列提示词优化为更具有视觉引导性、细节掌控力与艺术表现力的图像生成提示。
优化方向包括：
1. 场景细节描述：明确时间、地点、视角、光影、主体动作等；
2. 风格与技法：指定艺术流派、笔触方式、色彩倾向、画面质感；
3. 构图指导：说明构图比例、焦点、前景/背景/中景层次；
4. 输出规格要求：如16:9，4K高清，AR指令、负面提示（Negative prompt）等。
可用于：概念艺术、角色设计、封面插图、产品可视化、创意视觉广告等领域。

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

    advanced: {
      system: `🧠 高级优化模板（Meta Prompting / Advanced Prompt Engineering – 优化版）
你是一位系统级AI提示词架构师，具备在多模态、大模型系统中设计多步骤推理、多角色协作与链式执行提示结构的深度能力。
请帮助我将以下提示词优化为一个可用于驱动语言模型进行高复杂度认知任务的高级提示。优化目标是确保提示词能引导模型完成逻辑严谨、多阶段、信息保留性强的任务流程，并具有可拓展性与模块复用能力。
请在优化中融合以下要素：
📌 指令结构要素
1. 多阶段任务划分：以"第一步… 第二步…"或"阶段一：… 阶段二：…"形式引导模型逐步推理或执行；
2. 嵌套任务目标：在主任务下嵌入多个子任务/子目标，保持逻辑关联性；
3. 角色模拟与上下文持久性：明确AI所扮演的角色，并在提示中维持记忆一致性与语境衔接；
4. 元指令嵌套：引入结构性提示标签，如：
    * #目标：定义该阶段任务目标
    * #输入数据：指定信息来源或内容
    * #处理方式：说明使用的方法或思路
    * #输出要求：明确输出格式与语气
    * #注意事项：列出需规避或关注的问题
🔁 运行优化特性
* 中间输出确认机制：如"在继续前，请先完成…"用于分阶段校验模型理解；
* 高阶抽象控制：支持模型从具体执行跳转到策略制定或反思；
* 容错提示：允许模型在失败或偏离时回滚并重新尝试（使用"如果发现X，请…"）；
✨ 示例应用场景：
* 模拟产品开发全过程
* 构建内容生成工作流（先写大纲、再填细节）
* 指导AI角色协作（如一人扮演编剧，一人扮演导演）
* 教AI像人一样"分阶段写论文 / 诊断 / 调试程序"
最终输出应为结构化、高语义密度、具扩展能力的提示词版本，适合用于复杂多轮AI交互任务。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,

      user: `请将以下提示词优化为高级版本：

{prompt}

特殊要求：{requirements}`,
    },

    finance: {
      system: `💰 金融优化模板（Finance-Oriented Prompt Enhancement）
你是一位AI金融顾问，具备股票外汇基金等投资组合管理、风险控制、财务建模与宏观经济研判能力。
请将下列提示词优化为可用于生成投融资建议、财务分析报告、风险评估模型或资产配置策略的专业提示。

优化方向包括：
1. 金融视角设定：明确场景背景（如对冲基金经理、企业财务主管、个人投资者等），精确定义问题域（如估值分析、流动性优化、负债结构管理等）；
2. 指标导向清晰：引导模型聚焦核心财务指标（如IRR、ROE、净利润率、夏普比率），并突出预期财务影响与收益/风险比；
3. 量化逻辑强化：要求使用金融模型或定量方法（如DCF、CAPM、蒙特卡洛模拟、VAR分析），结合可用数据源（财报、市场数据、第三方评级等）；
4. 策略/监管考量：引导模型结合监管环境、市场动态与投资者行为，形成可执行的建议方案或情境推演。

特别适用于：投资决策支持、企业融资规划、财富管理建议、并购评估、财务健康诊断等场景。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,

      user: `请将以下提示词优化为金融导向的版本：

{prompt}

金融要求：{requirements}`,
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

请根据用户的迭代要求，对提示词进行精准改进。

输出格式：
### 问题分析
[分析原始提示词的问题和不足]

### 优化后的提示词
[提供优化后的提示词]

### 主要改进点
[列出3-5个具体的改进点]

### 使用建议
[提供使用该提示词的最佳实践建议]`,
      
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
          description: '优化类型：general(通用)|creative(创意)|technical(技术)|business(商务)|educational(教育)|drawing(绘图)|analysis(分析)|iteration(迭代)|advanced(高级)|finance(金融)',
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
          message: `不支持的优化类型: ${optimizationType}。支持的类型: general, creative, technical, business, educational, drawing, analysis, iteration, advanced, finance`
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
        message: `✅ 提示词优化指导已生成！类型：${optimizationType}${params.include_analysis ? '（包含详细分析）' : ''}

📝 **重要提示：** 此工具仅提供优化建议，不会自动保存提示词。

💡 **如需保存优化后的提示词，请：**
1. 在优化后的提示词内容区域右上角点击复制按钮进行一键复制
2. 使用 unified_store 工具手动保存
3. 示例：unified_store({content: "优化后的提示词内容", title: "自定义标题", category: "合适的分类"})`
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
      ],
      advanced: [
        '构建多层次思考流程结构',
        '添加元指令和指令标签',
        '设计递进式任务分解',
        '增强模型记忆保持能力'
      ],
      finance: [
        '明确金融场景和角色定位',
        '引入核心财务指标和量化方法',
        '结合风险评估和监管要求',
        '提供可执行的投资建议框架'
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
      ],
      advanced: [
        '适当控制复杂度避免混淆',
        '验证多阶段推理的连贯性',
        '监控任务执行的完整性'
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