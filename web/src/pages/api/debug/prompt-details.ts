import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端（使用服务角色密钥以绕过RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 调试API端点，直接使用服务角色获取提示词详情
 * 警告：这是一个仅用于调试的端点，生产环境中应该移除
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 从查询参数获取提示词名称或ID
    const { id, name, userId } = req.query;
    
    if ((!id && !name) || (id && typeof id !== 'string') || (name && typeof name !== 'string')) {
      return res.status(400).json({ 
        success: false, 
        message: '必须提供有效的提示词ID或名称' 
      });
    }
    
    console.log('调试API: 尝试获取提示词详情:', { id, name, userId });
    
    // 创建管理员客户端以绕过RLS策略
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // 构建查询
    let query = adminClient.from('prompts').select('*');
    
    if (id) {
      query = query.eq('id', id);
    } else if (name) {
      query = query.eq('name', name);
    }
    
    // 如果提供了用户ID，确保只返回该用户的提示词或公开提示词
    if (userId && typeof userId === 'string') {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }
    
    const { data, error } = await query.maybeSingle();
      
    if (error) {
      console.error('获取提示词详情失败:', error);
      return res.status(500).json({ 
        success: false, 
        message: `获取提示词详情失败: ${error.message}` 
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: '未找到提示词'
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: data
    });
  } catch (err: any) {
    console.error('处理请求时出错:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || '未知错误' 
    });
  }
}
