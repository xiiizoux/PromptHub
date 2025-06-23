import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdapter } from '@/lib/supabase-adapter';

/**
 * 获取提示词数量的API端点
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 只允许GET方法
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { author } = req.query;
    
    if (!author || typeof author !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '缺少author参数', 
      });
    }

    // 首先根据用户名查找用户ID，尝试多个字段
    let userData = null;
    
    // 尝试通过display_name查找
    const result1 = await supabaseAdapter.supabase
      .from('users')
      .select('id')
      .eq('display_name', author)
      .maybeSingle();
    
    if (result1.data) {
      userData = result1.data;
    } else {
      // 如果display_name没找到，尝试通过email前缀查找
      const result2 = await supabaseAdapter.supabase
        .from('users')
        .select('id, email')
        .like('email', `${author}%`)
        .maybeSingle();
      
      if (result2.data) {
        userData = result2.data;
      } else {
        // 最后尝试模糊匹配display_name
        const result3 = await supabaseAdapter.supabase
          .from('users')
          .select('id')
          .ilike('display_name', `%${author}%`)
          .maybeSingle();
        
        if (result3.data) {
          userData = result3.data;
        }
      }
    }

    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在', 
      });
    }

    // 获取用户的提示词数量
    const result = await supabaseAdapter.getPrompts({
      userId: userData.id,
      isPublic: false, // 获取用户所有的提示词（包括私有的）
      pageSize: 1000, // 设置一个大的页面大小来获取总数
    });

    return res.status(200).json({ 
      success: true, 
      count: result.total,
    });
    
  } catch (error: any) {
    console.error('获取提示词数量失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || '获取提示词数量失败', 
    });
  }
} 