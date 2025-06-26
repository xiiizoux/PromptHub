import { createClient } from '@supabase/supabase-js';

// 检查环境变量
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// 创建单一实例的Supabase客户端以避免多个实例警告
let supabaseInstance: any = null;

// 获取Supabase客户端的函数，确保只创建一个实例
const getSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // 解决在服务器端渲染时localStorage不可用的问题
  const isServer = typeof window === 'undefined';
  
  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: isServer ? undefined : localStorage,
        storageKey: 'prompthub-auth-token',
        flowType: 'pkce',
        // 改进会话管理设置
        debug: process.env.NODE_ENV === 'development',
      },
      global: {
        headers: {
          'x-application-name': 'PromptHub',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  );
  
  // 添加全局错误监听器
  if (!isServer) {
    supabaseInstance.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Supabase Auth State Change:', event, !!session);
      
      // 处理认证错误
      if (event === 'SIGNED_OUT') {
        // 清理可能残留的会话数据
        try {
          localStorage.removeItem('prompthub-auth-token');
          // 清理其他可能的Supabase session keys
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('auth-token')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn('清理localStorage失败:', e);
        }
      }
    });
  }
  
  return supabaseInstance;
};

// 导出单例Supabase客户端
export const supabase = getSupabaseClient();

// 工具函数：安全地清理认证状态
export const clearAuthState = async () => {
  if (typeof window === 'undefined') return;

  try {
    console.log('开始清理认证状态...');

    // 首先尝试正常登出
    try {
      await supabase.auth.signOut();
      console.log('正常登出成功');
    } catch (signOutError) {
      console.warn('正常登出失败，继续清理本地状态:', signOutError);
    }

    // 清理localStorage中的认证相关数据
    const keysToRemove = [
      'prompthub-auth-token',
      'auth_token',
      'user',
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 清理所有supabase相关的keys（更谨慎的方式）
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    });

    console.log('认证状态清理完成');
  } catch (e) {
    console.warn('清理认证状态失败:', e);
  }
};

// 工具函数：检查会话是否有效
export const isSessionValid = async (): Promise<boolean> => {
  try {
    // 确保只在客户端运行
    if (typeof window === 'undefined') {
      return false;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('获取会话时出错:', error);
      return false;
    }

    if (!session) {
      return false;
    }

    // 检查是否过期（提前5分钟判断为即将过期）
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    return timeUntilExpiry > 300; // 5分钟缓冲时间
  } catch (e) {
    console.error('检查会话有效性失败:', e);
    return false;
  }
};

// 类型定义
export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    role?: string;
  };
};
