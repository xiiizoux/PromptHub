import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '../../../lib/database-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // 获取提示词ID
  const { promptId } = req.query;

  if (!promptId || typeof promptId !== 'string') {
    return res.status(400).json({
      success: false,
      message: '必须提供有效的提示词ID',
    });
  }

  try {
    console.log(`[API] 获取提示词性能数据，ID: ${promptId}`);

    // 直接使用数据库服务获取性能数据
    const performanceData = await databaseService.getPromptPerformance(promptId);

    if (!performanceData) {
      return res.status(404).json({
        success: false,
        message: '未找到提示词性能数据',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        performance: performanceData,
      },
    });
  } catch (error) {
    console.error('获取提示词性能数据错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取提示词性能数据过程中发生错误',
    });
  }
}
