import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { apiHandler, successResponse, errorResponse } from '@/lib/api-handler';

// 获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 处理删除提示词请求
async function deletePromptHandler(req: NextApiRequest, res: NextApiResponse) {

  // 获取提示词ID
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: '必须提供有效的提示词ID',
    });
  }

  try {
    // 获取用户ID，从请求对象的user属性获取（由api-handler添加）
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权，请登录后再删除提示词',
      });
    }
    
    console.log(`尝试删除提示词 - ID:${id}, 用户ID:${userId}`);
    
    // 创建管理员客户端以绕过RLS策略
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // 执行删除操作，确保只能删除自己的提示词
    const { error, count } = await adminClient
      .from('prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('删除提示词错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '删除提示词失败',
        error: error.message,
      });
    }
    
    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到提示词或您没有权限删除该提示词',
      });
    }

    return res.status(200).json({
      success: true,
      message: '提示词删除成功',
    });
  } catch (error) {
    console.error('删除提示词错误:', error);
    return res.status(500).json({ 
      success: false, 
      message: '删除提示词过程中发生错误', 
    });
  }
}

// 使用API处理器包装我们的处理函数
export default apiHandler(deletePromptHandler, {
  requireAuth: true,
  allowedMethods: ['DELETE'],
});
