import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

// 定义认证上下文的类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // 添加别名，与logout相同
  getToken: () => Promise<string | null>; // 获取当前用户的访问令牌
  checkAuth: () => Promise<boolean>;
  isAuthenticated: boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // 初始化时检查认证状态
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setLoading(false);
    };

    initAuth();
  }, []);

  // 检查用户认证状态
  const checkAuth = async (): Promise<boolean> => {
    try {
      // 获取当前会话状态
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      // 获取用户信息
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      
      if (supaUser) {
        // 从数据库获取完整的用户信息
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supaUser.id)
          .single();
        
        const appUser: User = {
          id: supaUser.id,
          username: userData?.display_name || supaUser.email?.split('@')[0] || '',
          email: supaUser.email || '',
          role: userData?.role || 'user',
          created_at: supaUser.created_at || new Date().toISOString()
        };
        
        setUser(appUser);
        setIsAuthenticated(true);
        return true;
      } else {
        // 用户会话无效
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error('认证检查失败:', err);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  // 登录
  const login = async (email: string, password: string, remember = false): Promise<void> => {
    setLoading(true);
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
      
      if (data.user) {
        // 从数据库获取完整的用户信息
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        const appUser: User = {
          id: data.user.id,
          username: userData?.display_name || data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          role: userData?.role || 'user',
          created_at: data.user.created_at || new Date().toISOString()
        };
        
        setUser(appUser);
        setIsAuthenticated(true);
      } else {
        throw new Error('登录失败：未能获取用户信息');
      }
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err.message || '登录失败，请检查您的凭据');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (username: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用Supabase创建新用户
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // 注册成功，但可能需要邮箱验证
      return;
    } catch (err: any) {
      console.error('注册失败:', err);
      setError(err.message || '注册失败，请稍后再试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      // 使用Supabase登出
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // 清除应用状态
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('登出失败:', err);
      setError(err.message || '登出失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前用户的访问令牌
  const getToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (err) {
      console.error('获取令牌失败:', err);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    signOut: logout, // 添加别名，与logout相同
    getToken,
    checkAuth,
    isAuthenticated
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

// 保护路由的高阶组件
export const withAuth = <P extends object>(Component: React.ComponentType<P>): React.FC<P> => {
  const AuthComponent: React.FC<P> = (props) => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // 如果认证状态已加载完成且用户未认证，则重定向到登录页面
      if (!loading && !isAuthenticated) {
        router.replace(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      }
    }, [isAuthenticated, loading, router]);

    // 在加载中或未认证时显示加载界面
    if (loading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">正在验证身份...</p>
          </div>
        </div>
      );
    }

    // 认证通过，渲染原始组件
    return <Component {...props} />;
  };

  // 设置组件显示名称
  const displayName = Component.displayName || Component.name || 'Component';
  AuthComponent.displayName = `withAuth(${displayName})`;

  return AuthComponent;
};
