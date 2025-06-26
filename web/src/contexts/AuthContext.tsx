import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

// 定义认证上下文的类型
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading: boolean; // 添加loading属性作为isLoading的别名
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // 添加别名，与logout相同
  getToken: () => Promise<string | null>; // 获取当前用户的访问令牌
  checkAuth: () => Promise<boolean>;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage操作函数
const USER_STORAGE_KEY = 'prompthub-user';

const saveUserToStorage = (user: User): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.warn('保存用户信息到localStorage失败:', error);
  }
};

const getUserFromStorage = (): User | null => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        return user;
      }
    }
  } catch (error) {
    console.warn('从localStorage读取用户信息失败:', error);
  }
  return null;
};

const clearUserFromStorage = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('清理localStorage中的用户信息失败:', error);
  }
};

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mounted = useRef(true);
  const authInitialized = useRef(false);

  // 确保用户数据在数据库中 - 使用useCallback确保引用稳定
  const ensureUserInDatabase = useCallback(async (authUser: any) => {
    if (!mounted.current) return;
    
    try {
      // 检查用户是否已存在于users表
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('检查用户存在性失败:', fetchError);
        return;
      }

      // 如果用户不存在，创建用户记录
      if (!existingUser) {
        const emailUsername = authUser.email.split('@')[0];
        const providedUsername = authUser.user_metadata?.username || 
                               authUser.user_metadata?.preferred_username ||
                               authUser.user_metadata?.name ||
                               emailUsername;
        
        const displayName = authUser.user_metadata?.display_name || 
                           authUser.user_metadata?.full_name || 
                           authUser.user_metadata?.name ||
                           providedUsername ||
                           emailUsername;

        const userData = {
          id: authUser.id,
          email: authUser.email,
          username: providedUsername,
          display_name: displayName,
          role: 'user',
          created_at: authUser.created_at,
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(userData);

        if (insertError) {
          console.error('创建用户记录失败:', insertError);
        }
      }

      // 更新本地用户状态
      let finalUserData = existingUser;
      
      if (!existingUser) {
        const { data: newUserData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        finalUserData = newUserData;
      }

      finalUserData = finalUserData || {
        id: authUser.id,
        email: authUser.email,
        username: authUser.email.split('@')[0],
        display_name: authUser.user_metadata?.display_name || 
                     authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name ||
                     authUser.email.split('@')[0],
        role: 'user',
        created_at: authUser.created_at || new Date().toISOString(),
      };

      const appUser: User = {
        id: finalUserData.id,
        username: finalUserData.username || finalUserData.display_name || '用户',
        email: finalUserData.email,
        display_name: finalUserData.display_name,
        role: finalUserData.role as 'user' | 'admin' | 'contributor',
        created_at: finalUserData.created_at,
      };

      if (mounted.current) {
        setUser(appUser);
        setIsAuthenticated(true);
        setError(null);
        // 保存用户信息到localStorage
        saveUserToStorage(appUser);
      }
    } catch (err) {
      console.error('确保用户数据同步失败:', err);
    }
  }, []);

  // 快速恢复认证状态（从localStorage）
  const quickRestoreAuth = useCallback((): boolean => {
    try {
      const storedUser = getUserFromStorage();
      if (storedUser && mounted.current) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setError(null);
        return true;
      }
    } catch (error) {
      console.warn('快速恢复认证状态失败:', error);
    }
    return false;
  }, []);

  // 简化的认证检查函数
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        clearUserFromStorage();
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      const appUser: User = {
        id: session.user.id,
        username: session.user.user_metadata?.display_name ||
                 session.user.user_metadata?.username ||
                 session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        display_name: session.user.user_metadata?.display_name ||
                     session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split('@')[0] || 'User',
        role: 'user',
        created_at: session.user.created_at || new Date().toISOString(),
      };

      setUser(appUser);
      setIsAuthenticated(true);
      setError(null);
      // 更新localStorage中的用户信息
      saveUserToStorage(appUser);
      return true;
    } catch (err: any) {
      console.error('认证检查失败:', err);
      clearUserFromStorage();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // 初始化认证状态 - 修复时序问题
  useEffect(() => {
    let authSubscription: any = null;

    const initAuth = async () => {
      if (typeof window === 'undefined' || authInitialized.current) return;

      authInitialized.current = true;

      try {
        // 首先尝试快速恢复状态
        const quickRestored = quickRestoreAuth();

        // 立即验证Supabase session，不使用setTimeout
        const authResult = await checkAuth();

        // 只有在认证检查完成后才结束loading状态
        setIsLoading(false);

        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          if (!mounted.current) return;

          if (event === 'SIGNED_IN' && session?.user) {
            // 异步确保用户在数据库中，不阻塞认证流程
            ensureUserInDatabase(session.user).catch(error => {
              console.error('确保用户在数据库中失败:', error);
            });
          } else if (event === 'SIGNED_OUT') {
            clearUserFromStorage();
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('认证初始化失败:', error);
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [checkAuth, ensureUserInDatabase, quickRestoreAuth]);

  // 登录函数
  const login = useCallback(async (email: string, password: string, remember = false): Promise<void> => {
    if (!mounted.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        await ensureUserInDatabase(data.user);
      }
    } catch (err: any) {
      console.error('登录失败:', err);
      if (mounted.current) {
        setError(err.message || '登录失败');
      }
      throw err;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [ensureUserInDatabase]);

  // 其他函数简化实现
  const register = useCallback(async (username: string, email: string, password: string): Promise<void> => {
    // 简化注册逻辑
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    
    if (error) {
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    
    if (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // 执行Supabase登出
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase登出失败:', error);
        throw error;
      }

      // 立即更新本地状态并清理localStorage
      clearUserFromStorage();
      if (mounted.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
      }
    } catch (err: any) {
      console.error('登出失败:', err);
      // 即使登出失败，也清理本地状态
      clearUserFromStorage();
      if (mounted.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError('登出时发生错误，但已清理本地状态');
      }
      throw err;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [mounted]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<void> => {
    if (!user) return;
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);
    
    if (error) {
      throw error;
    }
    
    const updatedUser = user ? { ...user, ...data } : null;
    setUser(updatedUser);
    if (updatedUser) {
      saveUserToStorage(updatedUser);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    loading: isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    signOut: logout,
    getToken,
    checkAuth,
    isAuthenticated,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const withAuth = <P extends object>(Component: React.ComponentType<P>): React.FC<P> => {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
      // 如果还在加载认证状态，不做任何操作
      if (isLoading) return;

      // 如果未登录且未在重定向中，重定向到登录页面
      if (!user && !redirecting) {
        setRedirecting(true);
        // 安全地获取当前URL，避免SSR问题
        const currentUrl = typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : router.asPath;
        const redirectUrl = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        router.replace(redirectUrl);
      }
    }, [user, isLoading, router, redirecting]);

    // 显示加载状态
    if (isLoading || (!user && !redirecting)) {
      return (
        <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-gradient-to-tr from-neon-pink/20 to-neon-purple/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center">
            <div className="relative mx-auto mb-8">
              <div className="w-16 h-16 border-4 border-neon-cyan/30 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-neon-cyan rounded-full animate-pulse"></div>
              </div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-neon-purple/20 rounded-full animate-ping"></div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold gradient-text">
                {isLoading ? '验证身份中' : '正在跳转到登录页面'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isLoading ? '正在连接到服务器...' : '请稍候...'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 如果正在重定向，显示重定向状态
    if (redirecting) {
      return (
        <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
            <p className="text-gray-400">正在跳转到登录页面...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  return AuthComponent;
};
