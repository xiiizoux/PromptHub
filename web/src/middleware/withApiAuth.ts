import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * API路由的认证中间件
 * 验证请求是否来自已认证的用户
 */
export function withApiAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 获取授权头
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: '未提供认证令牌' 
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // 验证令牌
      const supabase = getSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ 
          success: false, 
          message: '令牌无效或已过期' 
        });
      }
      
      // 将用户ID添加到请求对象中，供后续处理程序使用
      (req as any).userId = user.id;
      
      // 调用实际的处理程序
      return handler(req, res, user.id);
      
    } catch (error) {
      console.error('认证中间件错误:', error);
      return res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  };
}
