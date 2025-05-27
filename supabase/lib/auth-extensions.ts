/**
 * Supabase适配器认证扩展
 * 
 * 为Supabase适配器添加认证和令牌验证相关方法
 */

import { SupabaseAdapter } from './supabase-adapter.js';
import { User } from './types.js';

/**
 * 扩展Supabase适配器，添加认证相关方法
 */
export function extendAuthAdapter(adapter: SupabaseAdapter): any {
  // 创建一个新的对象，将所有现有方法复制过来
  const extendedAdapter = Object.create(adapter);
  
  /**
   * 验证令牌并返回用户信息
   * @param token JWT令牌
   * @returns 用户信息或null
   */
  extendedAdapter.verifyToken = async function(token: string): Promise<User | null> {
    try {
      // 设置会话令牌
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('验证令牌失败:', error);
        return null;
      }
      
      // 获取用户详细信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError || !userData) {
        console.error('获取用户信息失败:', userError);
        return null;
      }
      
      return {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        created_at: userData.created_at
      };
    } catch (err) {
      console.error('验证令牌时出错:', err);
      return null;
    }
  };
  
  /**
   * 创建新的API密钥
   * @param userId 用户ID
   * @param name 密钥名称
   * @param expiresAt 过期时间(ISO日期字符串)
   * @returns API密钥对象
   */
  extendedAdapter.createApiKey = async function(userId: string, name: string, expiresAt?: string) {
    try {
      // 生成API密钥
      const apiKey = await this.generateApiKey(userId, name, expiresAt ? this.calculateExpiryDays(expiresAt) : 0);
      
      // 获取刚创建的密钥记录
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('id, name, created_at, last_used_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        throw new Error(`获取创建的API密钥失败: ${error.message}`);
      }
      
      // 返回带原始密钥的结果
      return {
        ...data,
        key: apiKey,
        user_id: userId
      };
    } catch (err: any) {
      console.error('创建API密钥时出错:', err);
      throw err;
    }
  };
  
  /**
   * 计算过期天数
   * @param expiresAt ISO日期字符串
   * @returns 从当前时间到过期时间的天数
   */
  extendedAdapter.calculateExpiryDays = function(expiresAt: string): number {
    if (!expiresAt) return 0;
    
    const expiryDate = new Date(expiresAt);
    const currentDate = new Date();
    
    // 计算天数差异
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays); // 最少1天
  };
  
  /**
   * 获取用户API密钥
   * 重命名现有的listApiKeys方法，保持命名一致性
   */
  extendedAdapter.getUserApiKeys = async function(userId: string) {
    return this.listApiKeys(userId);
  };
  
  return extendedAdapter;
}
