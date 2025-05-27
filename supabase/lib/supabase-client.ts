import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * 创建Supabase客户端实例
 * 这个模块提供一个统一的入口点来创建Supabase客户端
 * 可以被MCP服务和Web服务共享使用
 */

// 环境变量中的配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

/**
 * 创建并返回一个Supabase客户端实例
 * @param {boolean} useServiceKey 是否使用服务密钥（提供更高权限）
 * @returns {SupabaseClient} Supabase客户端实例
 */
export function createSupabaseClient(useServiceKey: boolean = false): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error('Supabase URL不存在。请确保设置了环境变量SUPABASE_URL或NEXT_PUBLIC_SUPABASE_URL。');
  }

  // 使用服务密钥还是匿名密钥
  const key = useServiceKey && supabaseServiceKey 
    ? supabaseServiceKey 
    : supabaseAnonKey;

  if (!key) {
    throw new Error('Supabase密钥不存在。请确保设置了环境变量SUPABASE_ANON_KEY、NEXT_PUBLIC_SUPABASE_ANON_KEY或SUPABASE_SERVICE_KEY。');
  }

  // 创建并返回客户端
  return createClient(supabaseUrl, key);
}

// 创建默认导出的单例实例（使用匿名密钥）
const supabase = createSupabaseClient(false);
export default supabase;

// 创建使用服务密钥的实例
export const adminSupabase = createSupabaseClient(true);

// 类型导出
export type { SupabaseClient };
