import { NextApiRequest, NextApiResponse } from 'next';
import { aiAnalyzer, AIAnalysisResult } from '@/lib/ai-analyzer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { content: reqContent, prompt: reqPrompt, action, config } = req.body;
    const content = reqContent || reqPrompt;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '请提供有效的提示词内容' });
    }

    // 使用默认标签（避免在服务器端API路由中调用其他API）
    const existingTags: string[] = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色', '分析', '创作', '编程', '学术', '商业', '教育'];

    // 根据action执行不同的分析功能
    switch (action) {
      case 'full_analyze':
        // 完整分析 - 传递已有标签和版本信息，支持增量分析
        const { 
          currentVersion: fullAnalysisCurrentVersion, 
          isNewPrompt: fullAnalysisIsNewPrompt = false, 
          existingVersions: fullAnalysisExistingVersions = [],
          originalContent,
          existingCategory,
          existingTags: promptExistingTags,
          existingModels
        } = req.body;
        
        // 增强配置，包含现有参数信息
        const enhancedConfig = {
          ...config,
          incrementalAnalysis: !fullAnalysisIsNewPrompt,
          originalContent: originalContent || '',
          existingCategory: existingCategory || '',
          existingTags: promptExistingTags || [],
          existingModels: existingModels || []
        };
        
        const fullResult = await aiAnalyzer.analyzePrompt(
          content, 
          enhancedConfig, 
          existingTags, 
          fullAnalysisCurrentVersion, 
          fullAnalysisIsNewPrompt, 
          fullAnalysisExistingVersions
        );
        
        return res.status(200).json({ success: true, data: fullResult });

      case 'quick_classify':
        // 快速分类
        const category = await aiAnalyzer.quickClassify(content);
        return res.status(200).json({ success: true, data: { category } });

      case 'extract_tags':
        // 提取标签 - 传递已有标签进行智能合并
        const tags = await aiAnalyzer.extractTags(content, existingTags);
        return res.status(200).json({ success: true, data: { tags } });

      case 'suggest_version':
        // 建议版本号
        const { existingVersions = [], currentVersion, isNewPrompt = false } = req.body;
        const version = aiAnalyzer.suggestVersion(content, existingVersions, currentVersion, isNewPrompt);
        return res.status(200).json({ success: true, data: { version } });

      case 'analyze_quality': {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        const baseURL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1';

        if (!apiKey) {
          return res.status(500).json({
            success: false,
            error: 'OpenAI API未配置，请联系管理员'
          });
        }

        const analysisPrompt = `请作为专业的AI提示词质量评估专家，对以下提示词进行深度质量分析：

提示词：
${content}

请从以下维度进行评分（1-10分）：

1. **清晰性（clarity）**：指令是否明确清晰，用户能否准确理解要求
   - 语言表达的准确性
   - 指令的明确程度
   - 避免歧义的程度

2. **具体性（specificity）**：要求是否具体详细，是否提供了足够的上下文
   - 任务描述的详细程度
   - 预期输出的明确程度
   - 约束条件的完整性

3. **完整性（completeness）**：是否包含必要信息，逻辑是否完整
   - 关键信息的覆盖度
   - 逻辑结构的完整性
   - 缺失要素的识别

4. **可执行性（actionability）**：AI模型能否理解并执行这个任务
   - 任务的可操作性
   - 技术实现的可行性
   - 复杂度的合理性

5. **结构性（structure）**：提示词的组织是否合理，结构是否清晰
   - 信息组织的合理性
   - 层次结构的清晰度
   - 格式的规范性

6. **创新性（creativity）**：提示词设计是否有创意，能否激发高质量输出
   - 方法的新颖性
   - 创意激发的潜力
   - 独特性和原创性

7. **适用性（applicability）**：提示词的实际应用价值和通用性
   - 实际应用场景的广度
   - 用户需求的匹配度
   - 实用价值的高低

8. **整体质量（overall）**：综合评价提示词的整体水平

请同时提供：
- **优势分析**：这个提示词做得好的地方
- **改进建议**：具体的优化建议（3-5个）
- **适用场景**：最适合的使用场景
- **风险提示**：可能存在的问题或风险

请以JSON格式返回评分结果：
{
  "clarity": 数字,
  "specificity": 数字,
  "completeness": 数字,
  "actionability": 数字,
  "structure": 数字,
  "creativity": 数字,
  "applicability": 数字,
  "overall": 数字,
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进建议1", "改进建议2", "改进建议3"],
  "useCases": ["适用场景1", "适用场景2"],
  "risks": ["风险提示1", "风险提示2"],
  "analysis": "简要分析说明"
}`;

        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
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

        const analysisResult = data.choices[0].message.content.trim();
        
        let analysisData;
        try {
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            analysisData = {
              scores: {
                clarity: parsed.clarity || 5,
                specificity: parsed.specificity || 5,
                completeness: parsed.completeness || 5,
                actionability: parsed.actionability || 5,
                structure: parsed.structure || 5,
                creativity: parsed.creativity || 5,
                applicability: parsed.applicability || 5,
                overall: parsed.overall || 5
              },
              strengths: parsed.strengths || [],
              improvements: parsed.improvements || [],
              useCases: parsed.useCases || [],
              risks: parsed.risks || [],
              analysis: parsed.analysis || ''
            };
          } else {
            // 降级处理：如果无法解析JSON，提供基础评分
            analysisData = {
              scores: { clarity: 6, specificity: 6, completeness: 6, actionability: 6, structure: 6, creativity: 6, applicability: 6, overall: 6 },
              strengths: ['基础功能完整'],
              improvements: ['建议提供更详细的指令', '考虑增加具体示例'],
              useCases: ['通用场景'],
              risks: ['可能存在理解歧义'],
              analysis: '分析结果解析失败，使用默认评估'
            };
          }
        } catch (parseError) {
          console.warn('无法解析AI分析结果，使用降级评分');
          analysisData = {
            scores: { clarity: 6, specificity: 6, completeness: 6, actionability: 6, structure: 6, creativity: 6, applicability: 6, overall: 6 },
            strengths: ['基础功能完整'],
            improvements: ['建议提供更详细的指令', '考虑增加具体示例'],
            useCases: ['通用场景'],
            risks: ['可能存在理解歧义'],
            analysis: '分析结果解析失败，使用默认评估'
          };
        }
        
        return res.status(200).json({
          success: true,
          data: {
            prompt: content,
            analysis: analysisData,
            rawAnalysis: analysisResult,
            usage: data.usage
          }
        });
      }

      case 'extract_variables':
        // 提取变量（无需API调用的本地操作）
        const matches = content.match(/\{\{([^}]+)\}\}/g);
        const uniqueVars = new Set(matches ? 
          matches.map((match: string) => match.replace(/^\{\{|\}\}$/g, '').trim()) : []);
        const variables = Array.from(uniqueVars).filter((variable: string) => variable.length > 0);
        return res.status(200).json({ success: true, data: { variables } });

      case 'health_check':
        // API健康检查
        const healthStatus = await aiAnalyzer.checkHealth();
        return res.status(200).json({ success: true, data: healthStatus });

      case 'get_config':
        // 获取配置信息
        const configInfo = aiAnalyzer.getConfig();
        return res.status(200).json({ success: true, data: configInfo });

      case 'get_existing_tags':
        // 获取系统中已有的标签
        return res.status(200).json({ success: true, data: { tags: existingTags } });

      default:
        return res.status(400).json({ error: '不支持的分析操作类型' });
    }

  } catch (error: any) {
    console.error('AI分析失败:', error);
    
    // 返回友好的错误信息
    const errorMessage = error.message?.includes('API key') 
      ? 'AI分析服务未配置，请联系管理员' 
      : 'AI分析服务暂时不可用，请稍后重试';

    return res.status(500).json({ 
      error: errorMessage,
      fallback: true 
    });
  }
}

// 导出配置，允许较大的请求体
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};