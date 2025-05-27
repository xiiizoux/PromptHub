import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/api-utils';

// 获取当前认证用户信息的API处理程序
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 在实际应用中，这里应该从令牌中解析用户信息或从数据库获取
    // 由于withAuth中间件已经将用户信息添加到请求对象中，我们可以直接返回
    const user = (req as any).user;
    
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({ success: false, message: '获取用户信息过程中发生错误' });
  }
}

// 使用身份验证中间件包装处理程序
export default withAuth(handler);
