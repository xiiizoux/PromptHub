import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdapter } from '@/lib/supabase-adapter';

/**
 * 调试API：查看数据库中的用户
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { data: users, error } = await supabaseAdapter.supabase
      .from('users')
      .select('id, email, display_name')
      .limit(10);

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      users: users || []
    });
    
  } catch (error: any) {
    console.error('查询用户失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || '查询用户失败' 
    });
  }
} 