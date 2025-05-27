/**
 * Supabase共享模块索引文件
 * 提供方便的导入入口点
 */

// 重新导出所有类型
export * from './lib/types.js';

// 重新导出Supabase客户端
export { 
  default as supabase,
  adminSupabase,
  createSupabaseClient
} from './lib/supabase-client.js';

// 重新导出Supabase适配器
export { 
  default as supabaseAdapter,
  adminSupabaseAdapter,
  SupabaseAdapter
} from './lib/supabase-adapter.js';

// 导入适配器扩展
import { extendSupabaseAdapter } from './lib/supabase-adapter-extensions.js';
import supabaseAdapterInstance from './lib/supabase-adapter.js';

// 创建并导出扩展后的适配器
export const extendedSupabaseAdapter = extendSupabaseAdapter(supabaseAdapterInstance);
