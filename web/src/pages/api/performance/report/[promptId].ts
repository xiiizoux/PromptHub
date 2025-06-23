import { NextApiRequest, NextApiResponse } from 'next';
import { databaseService } from '../../../../lib/database-service';

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
    console.log(`[API] 生成性能报告，ID: ${promptId}`);

    // 直接使用数据库服务生成性能报告
    const report = await databaseService.generatePerformanceReport(promptId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '无法生成性能报告，可能是提示词不存在或没有足够的数据',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        report: report,
      },
    });
  } catch (error) {
    console.error('获取性能报告错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取性能报告过程中发生错误',
    });
  }
}
