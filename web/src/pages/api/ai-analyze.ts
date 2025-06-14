import { NextApiRequest, NextApiResponse } from 'next';
import { aiAnalyzer, AIAnalysisResult } from '../../lib/ai-analyzer';
import { getTags } from '../../lib/api';

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

    // 获取系统中已有的标签（用于智能合并）
    let existingTags: string[] = [];
    try {
      existingTags = await getTags();
    } catch (error) {
      console.warn('获取已有标签失败，将使用默认标签', error);
      existingTags = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', '初学者', '高级', '长文本', '结构化输出', '翻译', '润色'];
    }

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
        
        // 添加调试日志
        console.log('🚀 API full_analyze 调试 (增量分析):');
        console.log('- 内容长度:', content.length);
        console.log('- 当前版本:', fullAnalysisCurrentVersion);
        console.log('- 是否新提示词:', fullAnalysisIsNewPrompt);
        console.log('- 已有版本:', fullAnalysisExistingVersions);
        console.log('- 原始内容长度:', originalContent?.length || 0);
        console.log('- 现有分类:', existingCategory);
        console.log('- 现有标签:', promptExistingTags);
        console.log('- 现有模型:', existingModels);
        
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
        
        console.log('🎯 API返回结果 (增量分析):', {
          version: fullResult.version,
          compatibleModels: fullResult.compatibleModels,
          variables: fullResult.variables,
          category: fullResult.category,
          tags: fullResult.tags
        });
        
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