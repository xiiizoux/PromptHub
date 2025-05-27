/**
 * 增强版Supabase适配器
 * 
 * 整合所有扩展，提供完整的API功能支持
 */

import supabaseAdapter, { adminSupabaseAdapter, SupabaseAdapter } from './supabase-adapter.js';
import { extendSupabaseAdapter } from './supabase-adapter-extensions.js';
import { extendAuthAdapter } from './auth-extensions.js';
import { extendSearchAdapter } from './search-extensions.js';

/**
 * 应用所有扩展到适配器
 * @param adapter 基础适配器
 * @returns 增强的适配器
 */
function applyAllExtensions(adapter: SupabaseAdapter): any {
  // 链式应用所有扩展
  let enhancedAdapter = extendSupabaseAdapter(adapter);
  enhancedAdapter = extendAuthAdapter(enhancedAdapter);
  enhancedAdapter = extendSearchAdapter(enhancedAdapter);
  
  return enhancedAdapter;
}

// 应用扩展到默认适配器
const enhancedAdapter = applyAllExtensions(supabaseAdapter);

// 应用扩展到管理员适配器
const enhancedAdminAdapter = applyAllExtensions(adminSupabaseAdapter);

// 导出增强的适配器
export default enhancedAdapter;
export { enhancedAdminAdapter };

// 重新导出类型
export * from './types.js';
