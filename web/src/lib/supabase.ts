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
      },
      global: {
        headers: {
          'x-application-name': 'PromptHub'
        },
      },
    }
  );
  
  return supabaseInstance;
};

// 导出单例Supabase客户端
export const supabase = getSupabaseClient();

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
