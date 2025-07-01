import crypto from 'crypto';
import { createSupabaseClient, adminSupabase, SupabaseClient } from './supabase-client.js';
import {
  Prompt,
  PromptVersion,
  User,
  AuthResponse,
  PromptFilters,
  PaginatedResponse,
  ApiKey
} from './types.js';

/**
 * Supabase适配器 - 提供对Supabase数据的访问
 * 这个适配器可以被MCP服务和Web服务共享使用
 */
export class SupabaseAdapter {
  private supabase: SupabaseClient;
  
  /**
   * 创建一个新的Supabase适配器实例
   * @param useAdmin 是否使用管理员权限（服务密钥）
   */
  constructor(useAdmin: boolean = false) {
    this.supabase = useAdmin ? adminSupabase : createSupabaseClient(false);
  }

  /**
   * 获取适配器类型
   * @returns 适配器类型名称
   */
  getType(): string {
    return 'supabase';
  }

  // ========= 基本提示词管理 =========
  
  /**
   * 获取所有分类
   * @returns 分类列表
   */
  async getCategories(): Promise<string[]> {
    // 从categories表获取分类
    const { data, error } = await this.supabase
      .from('categories')
      .select('name, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('获取分类失败:', error);
      throw new Error(`获取分类失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('categories表中没有数据');
    }

    // 提取分类名称
    const categories = data.map(item => item.name).filter(Boolean);
    return categories as string[];
  }
  
  /**
   * 获取所有标签
   * @returns 标签列表
   */
  async getTags(): Promise<string[]> {
    try {
      // 获取所有提示词的标签
      const { data, error } = await this.supabase
        .from('prompts')
        .select('tags');

      if (error) {
        console.error('获取标签失败:', error);
        return [];
      }

      // 提取所有标签并去重
      const allTags = data.flatMap(item => item.tags || []);
      const uniqueTags = Array.from(new Set(allTags.filter(Boolean)));
      return uniqueTags.sort() as string[]; // 按字母顺序排序
    } catch (err) {
      console.error('获取标签时出错:', err);
      return [];
    }
  }
  
  /**
   * 按分类获取提示词
   * @param category 分类名称
   * @param userId 用户ID（可选）
   * @param includePublic 是否包含公开提示词
   * @returns 提示词列表
   */
  async getPromptsByCategory(category: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      // 如果提供了用户ID，添加访问控制筛选
      if (userId) {
        if (includePublic) {
          // 用户自己的提示词 + 公开提示词
          query = query.or(`user_id.eq.${userId},is_public.eq.true`);
        } else {
          // 只查询用户自己的提示词
          query = query.eq('user_id', userId);
        }
      } else if (!includePublic) {
        // 如果没有用户ID且不包括公开内容，返回空
        return [];
      } else {
        // 没有用户ID时只返回公开内容
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('按分类获取提示词失败:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('按分类获取提示词时出错:', err);
      return [];
    }
  }
  
  /**
   * 获取提示词列表
   * @param filters 过滤条件
   * @returns 分页后的提示词列表
   */
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    try {
      // 默认过滤器设置
      const {
        category,
        category_type,
        tags,
        search,
        isPublic = true,
        userId,
        page = 1,
        pageSize = 20,
        sortBy = 'latest'
      } = filters || {};

      // 构建基本查询
      let query = this.supabase.from('prompts').select('*', { count: 'exact' });

      // 应用筛选条件
      if (category && category !== '全部') {
        query = query.eq('category', category);
      }

      if (category_type) {
        query = query.eq('category_type', category_type);
      }

      if (tags && tags.length > 0) {
        // 标签过滤（匹配任一标签）
        query = query.overlaps('tags', tags);
      }

      if (search) {
        // 搜索名称或描述
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 访问控制
      if (userId) {
        if (isPublic) {
          // 用户自己的提示词 + 公开提示词
          query = query.or(`user_id.eq.${userId},is_public.eq.true`);
        } else {
          // 只查询用户自己的提示词
          query = query.eq('user_id', userId);
        }
      } else if (!isPublic) {
        // 如果没有用户ID且不包括公开内容，返回空
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      } else {
        // 没有用户ID时只返回公开内容
        query = query.eq('is_public', true);
      }

      // 应用排序
      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        // 假设我们有usage_count字段表示使用次数
        query = query.order('usage_count', { ascending: false });
      } else if (sortBy === 'rating') {
        // 假设我们有rating字段表示评分
        query = query.order('rating', { ascending: false });
      }

      // 应用分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // 执行查询
      const { data, error, count } = await query;

      if (error) {
        console.error('获取提示词列表失败:', error);
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // 计算总页数
      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (err) {
      console.error('获取提示词列表时出错:', err);
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
        totalPages: 0
      };
    }
  }
  
  /**
   * 根据名称或ID获取单个提示词
   * @param nameOrId 提示词名称或ID
   * @param userId 用户ID（可选）
   * @returns 提示词对象或null
   */
  async getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null> {
    try {
      // 优先尝试按ID查询
      let query = this.supabase
        .from('prompts')
        .select('*');
        
      // 尝试判断是否为UUID格式
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
      
      if (isUuid) {
        query = query.eq('id', nameOrId);
      } else {
        query = query.eq('name', nameOrId);
      }
      
      // 如果提供了用户ID，添加访问控制筛选
      if (userId) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        // 没有用户ID时只返回公开内容
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`获取提示词 ${nameOrId} 失败:`, error);
        return null;
      }

      return data || null;
    } catch (err) {
      console.error(`获取提示词 ${nameOrId} 时出错:`, err);
      return null;
    }
  }
  
  /**
   * 搜索提示词
   * @param query 搜索关键词
   * @param userId 用户ID（可选）
   * @param includePublic 是否包含公开提示词
   * @returns 提示词列表
   */
  async searchPrompts(query: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
      try {
        // 构建搜索模式 - 搜索标题、描述、分类、标签和内容
        const searchPattern = `%${query}%`;

        // 创建基本查询 - 搜索所有相关字段（使用新的content字段）
        let dbQuery = this.supabase
          .from('prompts')
          .select('*')
          .or([
            `name.ilike.${searchPattern}`,
            `description.ilike.${searchPattern}`,
            `category.ilike.${searchPattern}`,
            `tags::text.ilike.${searchPattern}`,
            `content.ilike.${searchPattern}`
          ].join(','));
        
        // 添加访问控制
        if (userId) {
          if (includePublic) {
            // 用户自己的提示词 + 公开提示词
            dbQuery = dbQuery.or(`user_id.eq.${userId},is_public.eq.true`);
          } else {
            // 只查询用户自己的提示词
            dbQuery = dbQuery.eq('user_id', userId);
          }
        } else {
          // 没有用户ID时只返回公开内容
          dbQuery = dbQuery.eq('is_public', true);
        }
        
        // 按相关性排序：优先显示标题匹配的结果
        dbQuery = dbQuery.order('name', { ascending: true });
        
        const { data, error } = await dbQuery;
  
        if (error) {
          console.error(`搜索提示词失败: ${error.message}`);
          return [];
        }
  
        return data || [];
      } catch (err) {
        console.error('搜索提示词时出错:', err);
        return [];
      }
    }

  
  // ========= 用户认证 =========
  
  /**
   * 注册新用户
   * @param email 邮箱
   * @param password 密码
   * @param displayName 显示名称
   * @returns 认证响应
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      // 1. 使用Supabase Auth注册用户
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (authError) {
        return { user: null, error: authError.message };
      }
      
      if (!authData.user || !authData.user.id) {
        return { user: null, error: '注册成功，但未能获取用户信息' };
      }
      
      // 2. 创建用户记录在users表中
      const { error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          display_name: displayName || email.split('@')[0]
        });
        
      if (userError) {
        console.error('创建用户记录失败:', userError);
        // 注意: 即使这一步失败，用户仍然被创建在Auth系统中
      }
      
      // 3. 返回用户信息
      return {
        user: {
          id: authData.user.id,
          email: email,
          display_name: displayName || email.split('@')[0],
          created_at: new Date().toISOString()
        },
        token: authData.session?.access_token
      };
    } catch (err: any) {
      console.error('注册用户时出错:', err);
      return { user: null, error: err.message || '注册失败' };
    }
  }
  
  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   * @returns 认证响应
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { user: null, error: error.message };
      }
      
      if (!data.user) {
        return { user: null, error: '登录成功，但未能获取用户信息' };
      }
      
      // 获取用户的额外信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (userError) {
        console.warn('获取用户额外信息时发生错误:', userError);
      }
        
      // 返回用户信息
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          display_name: userData?.display_name || email.split('@')[0],
          created_at: data.user.created_at
        },
        token: data.session?.access_token
      };
    } catch (err: any) {
      console.error('用户登录时出错:', err);
      return { user: null, error: err.message || '登录失败' };
    }
  }
  
  /**
   * 用户登出
   */
  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (err) {
      console.error('用户登出时出错:', err);
    }
  }
  
  /**
   * 获取当前登录用户
   * @returns 用户对象或null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      // 获取用户的额外信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (userError) {
        console.warn('获取用户额外信息时发生错误:', userError);
      }
        
      return {
        id: data.user.id,
        email: data.user.email || '',
        display_name: userData?.display_name || data.user.email?.split('@')[0] || '',
        created_at: data.user.created_at
      };
    } catch (err) {
      console.error('获取当前用户时出错:', err);
      return null;
    }
  }
  
  // ========= API密钥管理 =========
  
  /**
   * 生成新的API密钥
   * @param userId 用户ID
   * @param name 密钥名称
   * @param expiresInDays 过期天数，0表示永不过期
   * @returns 生成的API密钥（只会返回一次）
   */
  async generateApiKey(userId: string, name: string, expiresInDays?: number): Promise<string> {
    try {
      // 生成随机API密钥
      const apiKey = crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // 计算过期时间
      let expiresAt: string | null = null;
      if (expiresInDays && expiresInDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + expiresInDays);
        expiresAt = date.toISOString();
      }
      
      // 存储API密钥哈希
      const { error } = await this.supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          expires_at: expiresAt
        });
        
      if (error) {
        throw new Error(`创建API密钥失败: ${error.message}`);
      }
      
      // 返回原始API密钥（只在生成时显示一次）
      return apiKey;
    } catch (err: any) {
      console.error('生成API密钥时出错:', err);
      throw err;
    }
  }
  
  /**
   * 验证API密钥并返回关联的用户
   * @param apiKey API密钥
   * @returns 关联的用户或null
   */
  async verifyApiKey(apiKey: string): Promise<User | null> {
    try {
      // 计算密钥哈希
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // 查询有效的API密钥
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('user_id')
        .eq('key_hash', keyHash)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .single();
        
      if (error || !data) {
        return null;
      }
      
      // 获取用户信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user_id)
        .single();
        
      if (userError || !userData) {
        return null;
      }
      
      return {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        created_at: userData.created_at
      };
    } catch (err) {
      console.error('验证API密钥时出错:', err);
      return null;
    }
  }
  
  /**
   * 更新API密钥的最后使用时间
   * @param apiKey API密钥
   */
  async updateApiKeyLastUsed(apiKey: string): Promise<void> {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      await this.supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash);
    } catch (err) {
      console.error('更新API密钥最后使用时间时出错:', err);
    }
  }
  
  /**
   * 获取用户的API密钥列表
   * @param userId 用户ID
   * @returns API密钥列表
   */
  async listApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('id, name, created_at, last_used_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`获取API密钥列表失败: ${error.message}`);
      }
      
      return (data || []).map(key => ({
        ...key,
        user_id: userId
      }));
    } catch (err: any) {
      console.error('获取API密钥列表时出错:', err);
      return [];
    }
  }
  
  /**
   * 删除API密钥
   * @param userId 用户ID
   * @param keyId 密钥ID
   * @returns 是否删除成功
   */
  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId);
        
      return !error;
    } catch (err) {
      console.error('删除API密钥时出错:', err);
      return false;
    }
  }
}

// 导出一个默认实例
const supabaseAdapter = new SupabaseAdapter();
export default supabaseAdapter;

// 导出一个管理员权限实例
export const adminSupabaseAdapter = new SupabaseAdapter(true);
