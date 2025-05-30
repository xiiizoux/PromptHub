import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 认证刷新组件 - 用于自动刷新认证状态并保持会话有效
 * 这是一个独立的组件，不影响现有代码
 */
const AuthRefresher = () => {
  useEffect(() => {
    // 初始化时尝试刷新会话
    const refreshSession = async () => {
      try {
        console.log('尝试刷新认证会话...');
        
        // 获取当前会话
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log('当前有活跃会话，尝试刷新令牌');
          
          // 尝试刷新令牌
          const { data: refreshData, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('刷新会话时出错:', error);
          } else if (refreshData?.session) {
            console.log('会话刷新成功，有效期至:', new Date(refreshData.session.expires_at));
            
            // 确保localStorage中有正确的会话数据
            if (typeof window !== 'undefined') {
              // 这个操作通常由supabase客户端自动完成，但为确保起见
              localStorage.setItem('prompthub-auth-token', JSON.stringify(refreshData.session));
            }
          }
        } else {
          console.log('没有活跃会话，需要重新登录');
        }
      } catch (err) {
        console.error('刷新认证会话时出错:', err);
      }
    };
    
    // 立即执行一次刷新
    refreshSession();
    
    // 设置定期刷新 (每30分钟)
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // 这是一个无UI组件，不渲染任何内容
  return null;
};

export default AuthRefresher;
