import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

  // 初始化时检查认证状态
  useEffect(() => {
    let authSubscription: any = null;
    
    const initAuth = async () => {
      try {
        // 只在客户端执行认证检查
        if (typeof window !== 'undefined' && mounted.current && !authInitialized.current) {
          console.log('初始化认证状态检查...');
          authInitialized.current = true;
          
          // 立即检查当前认证状态，不延迟
          await checkAuth();
          
          // 监听认证状态变化
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (!mounted.current) return;
            
            console.log('认证状态变化:', { event, hasSession: !!session, userId: session?.user?.id });
            
            try {
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                  console.log('处理登录或令牌刷新');
                  await ensureUserInDatabase(session.user);
                } else {
                  console.warn('登录事件但没有用户会话');
                }
              } else if (event === 'SIGNED_OUT') {
                console.log('处理登出事件');
                if (mounted.current) {
                  setUser(null);
                  setIsAuthenticated(false);
                  setError(null);
                  
                  // 清除可能存在的错误token
                  try {
                    localStorage.removeItem('prompthub-auth-token');
                  } catch (e) {
                    console.warn('清除localStorage失败:', e);
                  }
                }
              } else if (event === 'USER_UPDATED') {
                console.log('用户信息更新事件');
                // 用户信息更新，但不需要清除认证状态
              } else {
                console.log('其他认证事件:', event);
              }
            } catch (err) {
              console.error('处理认证状态变化时出错:', err);
              // 只在登出事件时清除认证状态
              if (event === 'SIGNED_OUT' && mounted.current) {
                setUser(null);
                setIsAuthenticated(false);
                setError(null);
              }
            }
          });

          authSubscription = subscription;
        } else {
          console.log('服务器端或已初始化，跳过认证初始化');
        }
      } catch (error) {
        console.error('认证初始化失败:', error);
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
          setError('认证初始化失败');
        }
      } finally {
        // 确保loading状态被设置为false
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
  }, []);

  // 确保用户数据在数据库中
  const ensureUserInDatabase = async (authUser: any) => {
    if (!mounted.current) return;
    
    try {
      // 检查用户是否已存在于users表
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 表示未找到记录
        console.error('检查用户存在性失败:', fetchError);
        return;
      }

      // 如果用户不存在，创建用户记录
      if (!existingUser) {
        const userData = {
          id: authUser.id,
          email: authUser.email,
          display_name: authUser.user_metadata?.display_name || 
                       authUser.user_metadata?.full_name || 
                       authUser.user_metadata?.username || 
                       'User',
          role: 'user',
          created_at: authUser.created_at
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
      const finalUserData = existingUser || {
        id: authUser.id,
        email: authUser.email,
        display_name: authUser.user_metadata?.display_name || 
                     authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.username || 
                     'User',
        role: 'user',
        created_at: authUser.created_at || new Date().toISOString()
      };

      const appUser: User = {
        id: finalUserData.id,
        username: finalUserData.display_name,
        email: finalUserData.email,
        role: finalUserData.role || 'user',
        created_at: finalUserData.created_at || new Date().toISOString()
      };

      if (mounted.current) {
        setUser(appUser);
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err) {
      console.error('确保用户数据同步失败:', err);
    }
  };

  // 检查用户认证状态
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('开始认证检查...');
      
      // 确保只在客户端运行
      if (typeof window === 'undefined') {
        console.log('服务器端，跳过认证检查');
        return false;
      }
      
      // 获取当前会话状态，添加超时处理
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('会话检查超时')), 10000)
      );
      
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
        return false;
      }
      
      if (!session || !session.user) {
        console.log('无有效会话或用户');
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
        return false;
      }
      
      console.log('找到会话，用户ID:', session.user.id);
      
      // 检查会话是否过期
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('会话已过期，尝试刷新...');
        
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.error('刷新会话失败:', refreshError);
            if (mounted.current) {
              setUser(null);
              setIsAuthenticated(false);
            }
            return false;
          }
          
          console.log('会话刷新成功');
          // 使用刷新后的会话继续
        } catch (refreshErr) {
          console.error('刷新会话异常:', refreshErr);
          if (mounted.current) {
            setUser(null);
            setIsAuthenticated(false);
          }
          return false;
        }
      }
      
      // 获取用户信息，添加超时处理
      const userPromise = supabase.auth.getUser();
      const userTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('用户信息获取超时')), 5000)
      );
      
      const { data: { user: supaUser }, error: userError } = await Promise.race([
        userPromise,
        userTimeoutPromise
      ]) as any;
      
      if (userError || !supaUser) {
        console.error('获取用户信息失败:', userError);
        if (mounted.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
        return false;
      }
      
      console.log('Supabase用户信息:', supaUser.id, supaUser.email);
      
      // 尝试从数据库获取完整的用户信息
      let userData = null;
      try {
        const { data, error: userDbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaUser.id)
          .single();
        
        if (userDbError) {
          console.warn('从数据库查询用户失败:', userDbError.message, userDbError.code);
          // 如果是因为用户不存在，尝试确保用户在数据库中
          if (userDbError.code === 'PGRST116') {
            console.log('用户不存在于数据库，尝试创建...');
            await ensureUserInDatabase(supaUser);
            // 重新查询
            const { data: retryData, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('id', supaUser.id)
              .single();
            
            if (!retryError && retryData) {
              userData = retryData;
              console.log('用户创建成功并查询到数据');
            }
          }
        } else {
          userData = data;
        }
      } catch (dbErr) {
        console.error('数据库查询异常:', dbErr);
      }
      
      // 构建用户对象 - 只使用Supabase Auth的用户信息确保一致性
      const displayName = supaUser.user_metadata?.display_name || 
                         supaUser.user_metadata?.full_name || 
                         supaUser.user_metadata?.username || 
                         'User';
      
      const appUser: User = {
        id: supaUser.id || '',
        username: displayName,
        email: supaUser.email || '',
        role: (userData?.role as 'user' | 'admin' | 'contributor') || 'user',
        created_at: userData?.created_at || supaUser.created_at || new Date().toISOString()
      };
      
      console.log('设置用户状态:', appUser);
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
        if (err.message.includes('超时')) {
          setError('网络连接超时，请检查网络后重试');
        }
      }
      return false;
    }
  };

  // 登录
  const login = async (email: string, password: string, remember = false): Promise<void> => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用Supabase进行邮箱密码登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user && data.session) {
        console.log('登录成功，用户ID:', data.user.id);
        
        // 等待用户数据同步完成
        await ensureUserInDatabase(data.user);
        
        console.log('登录流程完成');
      } else {
        throw new Error('登录失败：未能获取用户信息或会话');
      }
    } catch (err: any) {
      console.error('登录失败:', err);
      const errorMessage = err.message || '登录失败，请检查您的凭据';
      if (mounted.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  // 注册
  const register = async (username: string, email: string, password: string): Promise<void> => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用Supabase创建新用户
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username,
            display_name: username
          }
        }
      });
      
      if (error) {
        throw error;
      }

      // 如果用户立即确认（比如在开发模式下），同步数据到users表
      if (data.user && data.user.email_confirmed_at) {
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: email,
              display_name: username,
              role: 'user',
              created_at: data.user.created_at || new Date().toISOString()
            });
            
          if (insertError && insertError.code !== '23505') { // 23505 是重复键错误
            console.error('创建用户记录失败:', insertError);
          } else {
            console.log('用户记录创建成功');
          }
        } catch (insertErr) {
          console.error('插入用户数据时出错:', insertErr);
        }
      }
      
      console.log('注册成功，等待邮箱验证');
      return;
    } catch (err: any) {
      console.error('注册失败:', err);
      const errorMessage = err.message || '注册失败，请稍后再试';
      if (mounted.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Google OAuth登录
  const loginWithGoogle = async (): Promise<void> => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用Supabase进行Google OAuth登录
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Google OAuth重定向已启动');
      // OAuth重定向会自动处理，所以这里不需要进一步处理
      // 用户数据同步将在onAuthStateChange回调中处理
    } catch (err: any) {
      console.error('Google登录失败:', err);
      const errorMessage = err.message || 'Google登录失败，请稍后再试';
      if (mounted.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    
    try {
      console.log('用户主动登出...');
      
      // 先清除本地状态
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // 使用Supabase登出
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase登出失败:', error);
        // 即使Supabase登出失败，也不要抛出错误，因为本地状态已经清除
      } else {
        console.log('Supabase登出成功');
      }
      
      // 清理本地存储
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('prompthub-auth-token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          // 清理所有supabase相关的keys
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('auth-token')) {
              localStorage.removeItem(key);
            }
          });
        }
      } catch (storageErr) {
        console.warn('清理localStorage失败:', storageErr);
      }
      
      console.log('登出流程完成');
    } catch (err: any) {
      console.error('登出过程出错:', err);
      
      // 即使出错，也要确保本地状态被清除
      if (mounted.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  // 获取当前用户的访问令牌 - 增强版
  const getToken = async (): Promise<string | null> => {
    try {
      // 仅在客户端执行
      if (typeof window === 'undefined') {
        return null;
      }

      // 添加超时处理
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('获取令牌超时')), 5000)
      );
      
      const { data, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        console.error('获取会话失败:', error);
        return null;
      }
      
      const session = data?.session;

      // 如果没有有效会话，返回null
      if (!session) {
        console.warn('无法获取用户会话');
        return null;
      }
      
      // 检查令牌是否即将过期（提前5分钟检查）
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // 5分钟 = 300秒
        console.log('令牌即将过期，尝试刷新...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('刷新令牌失败:', refreshError);
            return session.access_token; // 返回原令牌
          }
          
          if (refreshData.session) {
            console.log('令牌刷新成功');
            return refreshData.session.access_token;
          }
        } catch (refreshErr) {
          console.error('刷新令牌异常:', refreshErr);
        }
      }

      // 返回访问令牌
      return session.access_token;
    } catch (err: any) {
      console.error('获取令牌时出错:', err);
      return null;
    }
  };

  const value = {
    user,
    isLoading,
    loading: isLoading, // 添加loading属性作为isLoading的别名
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    signOut: logout, // 添加别名，与logout相同
    getToken,
    checkAuth,
    isAuthenticated,
    updateProfile: async (data: Partial<User>) => {
      if (!mounted.current || !user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 更新用户数据
        const updatedUser: User = { ...user, ...data };
        
        // 更新Supabase
        const { data: supaData, error: supaError } = await supabase
          .from('users')
          .update(updatedUser)
          .eq('id', updatedUser.id);
        
        if (supaError) {
          throw supaError;
        }
        
        // 更新本地状态
        if (mounted.current) {
          setUser(updatedUser);
          setIsAuthenticated(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('更新用户信息失败:', err);
        const errorMessage = err.message || '更新用户信息失败，请稍后再试';
        if (mounted.current) {
          setError(errorMessage);
        }
        throw new Error(errorMessage);
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义Hook，用于访问认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 保护路由的高阶组件 - 增强版
export const withAuth = <P extends object>(Component: React.ComponentType<P>): React.FC<P> => {
  const AuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      setMounted(true);
      
      // 设置一个兜底超时，防止无限等待
      timeoutRef.current = setTimeout(() => {
        if (!isAuthenticated && !redirecting) {
          console.warn('认证检查超时，强制重定向到登录页');
          setRedirecting(true);
          
          if (typeof window !== 'undefined') {
            const currentUrl = window.location.pathname + window.location.search;
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
          }
        }
      }, 15000); // 15秒超时
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [isAuthenticated, redirecting]);

    useEffect(() => {
      // 只在客户端挂载完成后执行路由重定向
      if (mounted && !isLoading && !isAuthenticated && !redirecting) {
        setRedirecting(true);
        
        // 清除超时定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // 使用Next.js动态导入router避免SSR问题
        import('next/router').then(({ default: Router }) => {
          const currentUrl = window.location.pathname + window.location.search;
          Router.push(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
        }).catch(() => {
          // 如果Next.js路由器失败，回退到原生方法
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        });
      }
    }, [mounted, isAuthenticated, isLoading, redirecting]);

    // 在服务器端渲染时，返回null避免内容闪烁
    if (typeof window === 'undefined') {
      return null;
    }

    // 组件未挂载或正在重定向时，返回null避免闪烁
    if (!mounted || redirecting) {
      return null;
    }

    // 正在加载认证状态时，显示加载界面
    if (isLoading) {
      return (
        <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">正在验证身份...</p>
          </div>
        </div>
      );
    }

    // 如果已认证，渲染组件
    if (isAuthenticated) {
      return <Component {...props} />;
    }

    // 其他情况显示加载状态
    return (
      <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">正在跳转到登录页...</p>
        </div>
      </div>
    );
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return AuthComponent;
};
