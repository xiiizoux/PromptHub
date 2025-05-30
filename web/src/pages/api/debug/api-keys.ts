import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端（使用服务角色密钥以绕过RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 调试API端点，直接使用服务角色获取用户的API密钥
 * 警告：这是一个仅用于调试的端点，生产环境中应该移除
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 从查询参数获取用户ID
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '必须提供用户ID' 
      });
    }
    
    console.log('尝试使用管理员权限获取用户API密钥:', userId);
    
    // 创建管理员客户端以绕过RLS策略
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // 获取该用户的API密钥
    const { data, error } = await adminClient
      .from('api_keys')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('获取API密钥失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: `获取API密钥失败: ${error.message}` 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: data,
      count: data?.length || 0
    });
  } catch (err: any) {
    console.error('处理请求时出错:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || '未知错误' 
    });
  }
}
