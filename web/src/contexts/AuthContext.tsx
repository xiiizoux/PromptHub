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
        } else {
          console.log('用户记录创建成功:', userData);
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
      }
    } catch (err) {
      console.error('确保用户数据同步失败:', err);
    }
  }, []);

  // 简化的认证检查函数
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('开始认证检查...');
      
      if (typeof window === 'undefined') {
        return false;
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        console.log('无有效会话');
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
        return false;
      }
      
      const appUser: User = {
        id: session.user.id,
        username: session.user.user_metadata?.display_name || 
                 session.user.user_metadata?.username || 
                 session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: 'user',
        created_at: session.user.created_at || new Date().toISOString(),
      };
      
      if (mounted.current) {
        setUser(appUser);
        setIsAuthenticated(true);
        setError(null);
      }
      return true;
    } catch (err: any) {
      console.error('认证检查失败:', err);
      if (mounted.current) {
        setUser(null);
        setIsAuthenticated(false);
      }
      return false;
    }
  }, []);

  // 初始化认证状态 - 简化逻辑
  useEffect(() => {
    let authSubscription: any = null;
    
    const initAuth = async () => {
      if (typeof window === 'undefined' || authInitialized.current) return;
      
      authInitialized.current = true;
      console.log('初始化认证状态检查...');
      
      try {
        await checkAuth();
        
        // 监听认证状态变化
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          if (!mounted.current) return;
          
          console.log('认证状态变化:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await ensureUserInDatabase(session.user);
          } else if (event === 'SIGNED_OUT') {
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
        }
      } finally {
        if (mounted.current) {
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
  }, [checkAuth, ensureUserInDatabase]);

  // 登录函数
  const login = useCallback(async (email: string, password: string, remember = false): Promise<void> => {
    if (!mounted.current) return;
    
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
      console.log('开始登出...');
      setIsLoading(true);

      // 执行Supabase登出
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase登出失败:', error);
        throw error;
      }

      // 立即更新本地状态
      if (mounted.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
      }

      console.log('登出成功');
    } catch (err: any) {
      console.error('登出失败:', err);
      // 即使登出失败，也清理本地状态
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
    
    setUser(prev => prev ? { ...prev, ...data } : null);
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
                 const { user, isLoading } = useAuth();
                 const router = useRouter();
             
                 useEffect(() => {
                   // 如果还在加载认证状态，不做任何操作
                   if (isLoading) return;
             
                   // 如果未登录，重定向到登录页面
                   if (!user) {
                     const currentUrl = window.location.pathname + window.location.search;
                     const redirectUrl = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
                     router.replace(redirectUrl);
                   }
                 }, [user, isLoading, router]);
             
                 if (isLoading) {
                   return (
                     <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
                       <div className="flex flex-col items-center space-y-4">
                         <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                         <p className="text-gray-400">正在验证身份...</p>
                       </div>
                     </div>
                   );
                 }
             
                 if (!user) {
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
;
