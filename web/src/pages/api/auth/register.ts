import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  // 对于实际项目，这里应该调用真实的注册API
  // 由于MCP Prompt Server可能没有内置的用户注册系统，这里模拟注册过程
  try {
    const { username, email, password } = req.body;

    // 基本验证
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请提供所有必需的字段' });
    }

    // 在实际应用中，这里应该检查用户名和电子邮件是否已存在，并将用户信息保存到数据库
    // 这里仅做简单模拟
    if (email === 'admin@example.com') {
      return res.status(400).json({ success: false, message: '该电子邮件已被注册' });
    }

    // 返回成功响应
    return res.status(201).json({
      success: true,
      message: '注册成功，请登录',
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ success: false, message: '注册过程中发生错误' });
  }
}
