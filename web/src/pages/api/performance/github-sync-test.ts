/**
 * GitHub同步测试文件
 * 用于验证GitHub是否能正常显示新文件
 * 如果这个文件在GitHub上能正常显示，说明同步没有问题
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    message: 'GitHub同步测试成功',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}
