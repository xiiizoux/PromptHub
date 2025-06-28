import { useEffect, useRef, useState } from 'react';
import { supabase, clearAuthState, isSessionValid } from '@/lib/supabase';

/**
 * 智能认证刷新组件 - 用于自动刷新认证状态并保持会话有效
 * 重新设计版本，更加谨慎和智能地处理认证状态
 */
const AuthRefresher = () => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const failureCountRef = useRef(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 智能会话检查函数
    const checkSession = async (isInitialCheck = false) => {
      if (!mountedRef.current) return;

      try {
        if (isInitialCheck) {
          console.log('初始化认证状态检查...');
          // 初始检查时等待更长时间确保Supabase完全初始化
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('定期检查认证会话...');
        }

        // 首先直接从Supabase获取会话，不依赖isSessionValid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('获取会话时出错:', sessionError);
          failureCountRef.current++;

          // 只有在连续多次失败且是严重错误时才清理状态
          if (failureCountRef.current >= 3 &&
              (sessionError.message.includes('Invalid') ||
               sessionError.message.includes('Expired') ||
               sessionError.message.includes('JWT'))) {
            console.log('连续多次认证失败，清理状态');
            clearAuthState();
            failureCountRef.current = 0;
          }
          return;
        }

        if (!session) {
          // 没有会话，但不立即清理状态，可能是正常的未登录状态
          console.log('当前没有活跃会话');
          failureCountRef.current = 0;
          return;
        }

        // 有会话，重置失败计数
        failureCountRef.current = 0;
        console.log('会话检查通过，用户已认证');

        // 检查会话是否即将过期（提前10分钟刷新）
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiresAt || 0) - now;

        if (timeUntilExpiry < 600) { // 10分钟 = 600秒
          console.log('会话即将过期，尝试刷新...');

          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error('刷新会话时出错:', refreshError);
              failureCountRef.current++;

              // 只有在连续多次刷新失败时才清理状态
              if (failureCountRef.current >= 2 &&
                  (refreshError.message.includes('Invalid') ||
                   refreshError.message.includes('refresh_token'))) {
                console.log('刷新令牌连续失败，清理状态');
                clearAuthState();
                failureCountRef.current = 0;
              }
            } else if (refreshData?.session) {
              console.log('会话刷新成功，有效期至:', new Date((refreshData.session.expires_at || 0) * 1000));
              failureCountRef.current = 0;
            }
          } catch (refreshErr) {
            console.error('刷新会话异常:', refreshErr);
            failureCountRef.current++;

            // 只有在连续多次异常时才清理状态
            if (failureCountRef.current >= 3) {
              console.log('刷新会话连续异常，清理状态');
              clearAuthState();
              failureCountRef.current = 0;
            }
          }
        } else {
          console.log(`会话有效，剩余时间: ${Math.floor(timeUntilExpiry / 60)} 分钟`);
        }
      } catch (err) {
        console.error('检查认证会话时出错:', err);
        failureCountRef.current++;

        // 区分网络错误和认证错误
        if (err instanceof Error &&
            (err.message.includes('Network') ||
             err.message.includes('Failed to fetch') ||
             err.message.includes('timeout'))) {
          console.log('网络错误，跳过状态清理');
        } else {
          // 只有在连续多次未知错误时才清理状态
          if (failureCountRef.current >= 5) {
            console.log('连续多次未知错误，清理状态');
            clearAuthState();
            failureCountRef.current = 0;
          }
        }
      }
    };

    // 初始化检查
    const initializeAuth = async () => {
      if (!mountedRef.current) return;

      // 等待组件完全挂载和Supabase初始化
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (mountedRef.current) {
        await checkSession(true);
        setIsInitialized(true);

        // 设置定期检查 (每15分钟检查一次)
        refreshIntervalRef.current = setInterval(() => {
          if (mountedRef.current) {
            checkSession(false);
          }
        }, 15 * 60 * 1000);
      }
    };

    initializeAuth();
    
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // 监听页面可见性变化，当页面重新变为可见时检查会话
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current && isInitialized) {
        console.log('页面重新可见，检查认证状态');
        // 延迟一点再检查，确保网络连接稳定
        setTimeout(() => {
          if (mountedRef.current) {
            refreshAuth(false);
          }
        }, 2000);
      }
    };

    // 只有在初始化完成后才监听可见性变化
    if (isInitialized) {
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isInitialized]);
  
  // 这是一个无UI组件，不渲染任何内容
  return null;
};

export default AuthRefresher;
