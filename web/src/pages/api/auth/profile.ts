import { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseAdapter } from '@/lib/supabase-adapter';
import { withApiAuth } from '@/middleware/withApiAuth';

/**
 * 处理用户资料更新的API端点
 */
export default withApiAuth(async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) => {
  // 只允许PUT方法
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, email, currentPassword, newPassword } = req.body;
    
    // 验证输入
    if (!username && !email && !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '至少需要提供一个要更新的字段', 
      });
    }

    // 创建适配器实例
    const adapter = new SupabaseAdapter(true); // 使用管理员权限

    // 更新用户资料
    const result = await adapter.updateUserProfile(userId, {
      username,
      email,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({ 
      success: true, 
      message: '用户资料更新成功',
      user: result,
    });
    
  } catch (error: any) {
    console.error('更新用户资料失败:', error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || '更新用户资料失败', 
    });
  }
});
