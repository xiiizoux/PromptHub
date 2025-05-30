import { createClient } from '@supabase/supabase-js';

// 使用与API服务器相同的Supabase配置
// Next.js要求客户端环境变量以NEXT_PUBLIC_开头

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 检查必需的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase配置缺失。请在.env文件中设置NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY变量。');
}

// 创建Supabase客户端，并启用会话持久化
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 启用本地存储持久化会话
    persistSession: true,
    // 使用localStorage存储会话
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // 自动刷新会话
    autoRefreshToken: true,
    // 每小时检测会话状态
    detectSessionInUrl: true
  }
});

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
