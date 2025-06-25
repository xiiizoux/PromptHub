/**
 * AI提示词优化服务
 * 参考prompt-optimizer-master项目实现
 */

// 类型定义
export interface OptimizationRequest {
  prompt: string;
  type: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'advanced' | 'drawing' | 'finance';
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
        const template = OPTIMIZATION_TEMPLATES[request.type || 'general'] || OPTIMIZATION_TEMPLATES.general;
        const requirements = request.requirements ? `\n\n特殊要求：${request.requirements}` : '';
        
        const response = await this.callLLM(
          template.system,
          template.user.replace('{prompt}', request.prompt).replace('{requirements}', requirements),
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
          suggestions,
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
        type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance',
        requirements?: string,
        context?: string,
        complexity?: 'simple' | 'medium' | 'complex'
      } = {},
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
            .replace('{requirements}', requirements + context),
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
          analysisScore,
        };
      } catch (error) {
        console.error('智能优化失败:', error);
        throw new Error(`智能优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  
    /**
     * 检测提示词类型
     */
    private async detectPromptType(prompt: string): Promise<'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance'> {
      const keywords = {
        creative: ['创意', '想象', '创作', '设计', '艺术', '故事', '创新', 'creative', 'imagine', 'design', 'art', 'story'],
        technical: ['代码', '编程', '技术', '算法', '系统', '开发', 'code', 'programming', 'algorithm', 'system', 'development'],
        business: ['商业', '营销', '销售', '市场', '策略', '管理', 'business', 'marketing', 'sales', 'strategy', 'management'],
        educational: ['教学', '学习', '教育', '培训', '课程', 'teaching', 'learning', 'education', 'training', 'course'],
        drawing: ['绘图', '绘画', '画', '图像', '图片', '画面', '艺术风格', '构图', '色彩', '光影', 'midjourney', 'stable diffusion', 'dall-e', 'drawing', 'painting', 'image', 'artwork', 'style', 'composition', 'lighting', 'portrait', 'landscape', 'character', 'fantasy', 'realistic', 'cartoon', 'anime', '油画', '水彩', '素描', '卡通', '动漫', '写实', '抽象', '肖像', '风景', '人物', '角色'],
        advanced: ['复杂', '高级', '多步骤', '链式', '推理', '分析', '深度', '系统级', '元指令', '多轮', '嵌套', 'complex', 'advanced', 'multi-step', 'chain', 'reasoning', 'analysis', 'deep', 'meta', 'nested', 'multi-turn'],
        finance: ['金融', '投资', '财务', '股票', '基金', '债券', '风险', '收益', '资产', '负债', '现金流', '估值', '财报', '银行', '保险', '证券', '期货', '外汇', 'finance', 'investment', 'financial', 'stock', 'fund', 'bond', 'risk', 'return', 'asset', 'liability', 'cash flow', 'valuation', 'banking', 'insurance', 'securities', 'forex', 'portfolio', 'ROI', 'ROE', 'IRR', 'DCF', 'CAPM', 'VAR'],
      };
  
      const lowerPrompt = prompt.toLowerCase();
      let maxScore = 0;
      let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance' = 'general';
  
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
  
    /**
     * 批量优化提示词
     */
    async optimizePromptBatch(
      prompts: Array<{
        prompt: string;
        options?: {
          type?: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced';
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
  type: OptimizationRequest['type'] = 'general',
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
 * 智能检测并优化提示词类型
 */
export async function optimizePromptIntelligently(
  prompt: string,
  options: {
    requirements?: string;
    context?: string;
    autoDetectType?: boolean;
  } = {},
): Promise<OptimizationResult | null> {
  try {
    // 如果启用自动检测，先检测提示词类型
    let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance' = 'general';
    
    if (options.autoDetectType !== false) {
      detectedType = detectPromptType(prompt);
    }

    // 使用高级优化API
    const result = await optimizePromptAdvanced(prompt, {
      type: detectedType,
      requirements: options.requirements,
      context: options.context,
      complexity: 'medium',
      includeAnalysis: true,
    });

    if (!result) return null;

    // 转换为 OptimizationResult 格式
    return {
      optimizedPrompt: result.optimized,
      improvements: result.improvements,
      score: calculateScore(result.optimized),
      suggestions: result.techniques || [],
    };
  } catch (error) {
    console.error('智能优化失败:', error);
    return null;
  }
}

/**
 * 检测提示词类型
 */
function detectPromptType(prompt: string): 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance' {
  const keywords = {
    creative: ['创意', '想象', '创作', '设计', '艺术', '故事', '创新', 'creative', 'imagine', 'design', 'art', 'story'],
    technical: ['代码', '编程', '技术', '算法', '系统', '开发', 'code', 'programming', 'algorithm', 'system', 'development'],
    business: ['商业', '营销', '销售', '市场', '策略', '管理', 'business', 'marketing', 'sales', 'strategy', 'management'],
    educational: ['教学', '学习', '教育', '培训', '课程', 'teaching', 'learning', 'education', 'training', 'course'],
    drawing: ['绘图', '绘画', '画', '图像', '图片', '画面', '艺术风格', '构图', '色彩', '光影', 'midjourney', 'stable diffusion', 'dall-e', 'drawing', 'painting', 'image', 'artwork', 'style', 'composition', 'lighting', 'portrait', 'landscape', 'character', 'fantasy', 'realistic', 'cartoon', 'anime', '油画', '水彩', '素描', '卡通', '动漫', '写实', '抽象', '肖像', '风景', '人物', '角色'],
    advanced: ['复杂', '高级', '多步骤', '链式', '推理', '分析', '深度', '系统级', '元指令', '多轮', '嵌套', 'complex', 'advanced', 'multi-step', 'chain', 'reasoning', 'analysis', 'deep', 'meta', 'nested', 'multi-turn'],
    finance: ['金融', '投资', '财务', '股票', '基金', '债券', '风险', '收益', '资产', '负债', '现金流', '估值', '财报', '银行', '保险', '证券', '期货', '外汇', 'finance', 'investment', 'financial', 'stock', 'fund', 'bond', 'risk', 'return', 'asset', 'liability', 'cash flow', 'valuation', 'banking', 'insurance', 'securities', 'forex', 'portfolio', 'ROI', 'ROE', 'IRR', 'DCF', 'CAPM', 'VAR'],
  };

  const lowerPrompt = prompt.toLowerCase();
  let maxScore = 0;
  let detectedType: 'general' | 'creative' | 'technical' | 'business' | 'educational' | 'drawing' | 'advanced' | 'finance' = 'general';

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