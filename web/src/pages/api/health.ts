/**
 * 健康检查API端点
 * 用于网络连接测试
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 返回简单的健康状态
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '系统运行正常'
  });
} 