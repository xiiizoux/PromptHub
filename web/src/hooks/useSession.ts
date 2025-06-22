/**
 * 会话管理 React Hook
 * 提供友好的会话状态管理和自动续期功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionManager, SessionInfo } from '../lib/session-manager';
import { supabase } from '../lib/supabase';

export interface UseSessionOptions {
  autoRenewal?: boolean;
  showWarnings?: boolean;
  onSessionExpired?: () => void;
  onSessionWarning?: (timeLeft: number) => void;
  onSessionRenewed?: () => void;
}

export interface UseSessionReturn {
  session: SessionInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  timeUntilExpiry: number;
  needsRenewal: boolean;
  renewSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateActivity: () => void;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    autoRenewal = true,
    showWarnings = true,
    onSessionExpired,
    onSessionWarning,
    onSessionRenewed
  } = options;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const warningShownRef = useRef(false);

  // 初始化会话
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 检查Supabase会话
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession?.user) {
        // 创建或获取本地会话
        let localSession = sessionIdRef.current 
          ? sessionManager.getSession(sessionIdRef.current)
          : null;

        if (!localSession) {
          localSession = sessionManager.createSession(supabaseSession.user.id);
          sessionIdRef.current = localSession.sessionId;
        }

        setSession(localSession);
        setTimeUntilExpiry(localSession.timeUntilExpiry);

        // 设置会话回调
        setupSessionCallbacks(localSession.sessionId);
      } else {
        setSession(null);
        sessionIdRef.current = null;
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 设置会话回调
  const setupSessionCallbacks = useCallback((sessionId: string) => {
    // 设置续期回调
    sessionManager.setRenewalCallback(sessionId, async () => {
      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        if (supabaseSession) {
          // 刷新Supabase会话
          await supabase.auth.refreshSession();
          onSessionRenewed?.();
        }
      } catch (error) {
        console.error('Failed to renew session:', error);
      }
    });

    // 设置警告回调
    if (showWarnings) {
      sessionManager.setWarningCallback(sessionId, (timeLeft: number) => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          onSessionWarning?.(timeLeft);
          
          // 重置警告标志，允许再次显示
          setTimeout(() => {
            warningShownRef.current = false;
          }, 60000); // 1分钟后可以再次显示警告
        }
      });
    }
  }, [showWarnings, onSessionWarning, onSessionRenewed]);

  // 续期会话
  const renewSession = useCallback(async (): Promise<boolean> => {
    if (!sessionIdRef.current) return false;

    try {
      // 刷新Supabase会话
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;

      // 续期本地会话
      const renewed = sessionManager.renewSession(sessionIdRef.current);
      if (renewed) {
        const updatedSession = sessionManager.getSession(sessionIdRef.current);
        if (updatedSession) {
          setSession(updatedSession);
          setTimeUntilExpiry(updatedSession.timeUntilExpiry);
          onSessionRenewed?.();
        }
      }

      return renewed;
    } catch (error) {
      console.error('Failed to renew session:', error);
      return false;
    }
  }, [onSessionRenewed]);

  // 更新活动时间
  const updateActivity = useCallback(() => {
    if (sessionIdRef.current) {
      const updated = sessionManager.updateActivity(sessionIdRef.current);
      if (updated) {
        const updatedSession = sessionManager.getSession(sessionIdRef.current);
        if (updatedSession) {
          setSession(updatedSession);
          setTimeUntilExpiry(updatedSession.timeUntilExpiry);
        }
      }
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      // 登出Supabase
      await supabase.auth.signOut();
      
      // 清理本地会话
      if (sessionIdRef.current) {
        sessionManager.invalidateSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      
      setSession(null);
      setTimeUntilExpiry(0);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  // 监听Supabase认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, supabaseSession: any) => {
        if (event === 'SIGNED_OUT' || !supabaseSession) {
          if (sessionIdRef.current) {
            sessionManager.invalidateSession(sessionIdRef.current);
            sessionIdRef.current = null;
          }
          setSession(null);
          setTimeUntilExpiry(0);
          onSessionExpired?.();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await initializeSession();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeSession, onSessionExpired]);

  // 初始化
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // 定时更新会话状态
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      if (sessionIdRef.current) {
        const currentSession = sessionManager.getSession(sessionIdRef.current);
        if (currentSession) {
          setSession(currentSession);
          setTimeUntilExpiry(currentSession.timeUntilExpiry);
        } else {
          // 会话已过期
          setSession(null);
          setTimeUntilExpiry(0);
          sessionIdRef.current = null;
          onSessionExpired?.();
        }
      }
    }, 10000); // 每10秒检查一次

    return () => clearInterval(interval);
  }, [session, onSessionExpired]);

  // 自动续期
  useEffect(() => {
    if (!autoRenewal || !session?.needsRenewal) return;

    const autoRenewTimer = setTimeout(() => {
      renewSession();
    }, 1000); // 1秒后自动续期

    return () => clearTimeout(autoRenewTimer);
  }, [autoRenewal, session?.needsRenewal, renewSession]);

  return {
    session,
    isAuthenticated: !!session?.isValid,
    isLoading,
    timeUntilExpiry,
    needsRenewal: session?.needsRenewal || false,
    renewSession,
    logout,
    updateActivity
  };
}
