import { useEffect, useRef } from 'react';
import { supabase, clearAuthState, isSessionValid } from '@/lib/supabase';

/**
 * 认证刷新组件 - 用于自动刷新认证状态并保持会话有效
 * 增强版本，包含错误处理和状态清理
 */
const AuthRefresher = () => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // 初始化时尝试刷新会话
    const refreshSession = async () => {
      if (!mountedRef.current) return;
      
      try {
        console.log('检查并刷新认证会话...');
        
        // 首先检查会话是否有效
        const sessionValid = await isSessionValid();
        
        if (!sessionValid) {
          console.log('会话无效或已过期，清理状态');
          clearAuthState();
          return;
        }
        
        // 获取当前会话
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('获取会话时出错:', sessionError);
          
          // 如果是认证错误，清理状态
          if (sessionError.message.includes('Invalid') || 
              sessionError.message.includes('Expired') ||
              sessionError.message.includes('JWT')) {
            console.log('检测到认证错误，清理状态');
            clearAuthState();
            
            // 如果当前不在登录页面，可能需要重定向
            if (typeof window !== 'undefined' && 
                !window.location.pathname.includes('/auth/login')) {
              console.log('非登录页面检测到认证错误，可能需要重新登录');
            }
          }
          return;
        }
        
        if (sessionData?.session) {
          console.log('当前有活跃会话');
          
          // 检查会话是否即将过期（提前10分钟刷新）
          const expiresAt = sessionData.session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = (expiresAt || 0) - now;
          
          if (timeUntilExpiry < 600) { // 10分钟 = 600秒
            console.log('会话即将过期，尝试刷新...');
            
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('刷新会话时出错:', refreshError);
                
                // 如果刷新失败，清理状态
                if (refreshError.message.includes('Invalid') || 
                    refreshError.message.includes('refresh_token')) {
                  console.log('刷新令牌无效，清理状态');
                  clearAuthState();
                }
              } else if (refreshData?.session) {
                console.log('会话刷新成功，有效期至:', new Date((refreshData.session.expires_at || 0) * 1000));
              }
            } catch (refreshErr) {
              console.error('刷新会话异常:', refreshErr);
              clearAuthState();
            }
          } else {
            console.log(`会话有效，剩余时间: ${Math.floor(timeUntilExpiry / 60)} 分钟`);
          }
        } else {
          console.log('没有活跃会话');
        }
      } catch (err) {
        console.error('刷新认证会话时出错:', err);
        
        // 如果是网络错误或其他严重错误，清理状态
        if (err instanceof Error && 
            (err.message.includes('Network') || 
             err.message.includes('Failed to fetch') ||
             err.message.includes('timeout'))) {
          console.log('网络错误，跳过状态清理');
        } else {
          console.log('未知错误，清理状态');
          clearAuthState();
        }
      }
    };
    
    // 立即执行一次刷新
    refreshSession();
    
    // 设置定期刷新 (每15分钟检查一次)
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        refreshSession();
      }
    }, 15 * 60 * 1000);
    
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // 监听页面可见性变化，当页面重新变为可见时刷新会话
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log('页面重新可见，检查认证状态');
        // 延迟一点再检查，确保网络连接稳定
        setTimeout(async () => {
          if (mountedRef.current) {
            try {
              const sessionValid = await isSessionValid();
              if (!sessionValid) {
                console.log('页面重新可见时发现会话无效，清理状态');
                clearAuthState();
              }
            } catch (err) {
              console.error('检查会话有效性失败:', err);
            }
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 这是一个无UI组件，不渲染任何内容
  return null;
};

export default AuthRefresher;
