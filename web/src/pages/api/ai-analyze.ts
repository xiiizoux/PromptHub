import { NextApiRequest, NextApiResponse } from 'next';
import { aiAnalyzer, AIAnalysisResult } from '../../lib/ai-analyzer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { content, action, config } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '请提供有效的提示词内容' });
    }

    // 根据action执行不同的分析功能
    switch (action) {
      case 'full_analyze':
        // 完整分析
        const fullResult = await aiAnalyzer.analyzePrompt(content, config);
        return res.status(200).json({ success: true, data: fullResult });

      case 'quick_classify':
        // 快速分类
        const category = await aiAnalyzer.quickClassify(content);
        return res.status(200).json({ success: true, data: { category } });

      case 'extract_tags':
        // 提取标签
        const tags = await aiAnalyzer.extractTags(content);
        return res.status(200).json({ success: true, data: { tags } });

      case 'suggest_version':
        // 建议版本号
        const { existingVersions = [] } = req.body;
        const version = aiAnalyzer.suggestVersion(content, existingVersions);
        return res.status(200).json({ success: true, data: { version } });

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