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

        const analysisPrompt = `请分析以下提示词的质量，并给出评分：

提示词：
${content}

请从以下维度进行评分（1-10分）：
1. 清晰性：指令是否明确清晰
2. 具体性：要求是否具体详细
3. 完整性：是否包含必要信息
4. 整体质量：综合评价

请以JSON格式返回评分结果：
{
  "clarity": 数字,
  "specificity": 数字,
  "completeness": 数字,
  "overall": 数字,
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
            max_tokens: 500,
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
        
        let score;
        try {
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            score = {
              clarity: parsed.clarity || 5,
              specificity: parsed.specificity || 5,
              completeness: parsed.completeness || 5,
              overall: parsed.overall || 5
            };
          } else {
            score = { clarity: 6, specificity: 6, completeness: 6, overall: 6 };
          }
        } catch (parseError) {
          console.warn('无法解析AI分析结果，使用默认评分');
          score = { clarity: 6, specificity: 6, completeness: 6, overall: 6 };
        }
        
        return res.status(200).json({
          success: true,
          data: {
            prompt: content,
            score,
            analysis: analysisResult,
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
} 