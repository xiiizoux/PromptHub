import { NextApiRequest, NextApiResponse } from 'next';
import { getPromptDetails } from '@/lib/api';
import { qualityAnalyzer } from '@/services/qualityAnalyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  const { promptId } = req.query;

  if (!promptId || typeof promptId !== 'string') {
    return res.status(400).json({
      success: false,
      message: '必须提供有效的提示词ID'
    });
  }

  try {
    // 获取提示词详情
    const prompt = await getPromptDetails(promptId);
    
    // 进行质量分析
    const qualityAnalysis = await qualityAnalyzer.analyzePromptQuality(prompt);

    return res.json({
      success: true,
      data: qualityAnalysis
    });
  } catch (error) {
    console.error('质量分析失败:', error);
    return res.status(500).json({
      success: false,
      message: '质量分析过程中发生错误'
    });
  }
} 