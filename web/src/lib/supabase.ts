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
        // 添加会话超时设置
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'PromptHub',
        },
      },
      // 添加请求超时
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
export const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // 清理所有相关的localStorage项
    const keysToRemove = [
      'prompthub-auth-token',
      'auth_token',
      'user',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 清理所有supabase相关的keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('认证状态已清理');
  } catch (e) {
    console.warn('清理认证状态失败:', e);
  }
};

// 工具函数：检查会话是否有效
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // 检查是否过期
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    return expiresAt > now;
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
