import { NextApiRequest, NextApiResponse } from 'next';
import { proxyApiRequest } from '../../../lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // 对于实际项目，应该调用实际的登录API端点
  // 由于MCP Prompt Server可能没有内置的用户认证系统，这里模拟登录过程
  try {
    const { email, password } = req.body;

    // 简单的验证
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请提供电子邮件和密码' });
    }

    // 模拟认证
    // 在实际环境中，这里应该验证用户凭据并从数据库获取用户信息
    const mockUser = {
      id: '1',
      username: email.split('@')[0],
      email,
      role: 'user',
      created_at: new Date().toISOString()
    };

    // 生成模拟令牌
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    // 返回成功响应
    return res.status(200).json({
      success: true,
      message: '登录成功',
      user: mockUser,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ success: false, message: '登录过程中发生错误' });
  }
}
