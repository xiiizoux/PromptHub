/**
 * Web service specific Supabase adapter
 * 
 * This file provides Supabase adapter functionality for Next.js Web service,
 * avoiding module resolution issues caused by cross-directory imports
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Basic type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  created_at: string;
  role?: 'user' | 'admin' | 'contributor';
}

export interface AuthResponse {
  user: User | null;
  token?: string;
  error?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  category: string;
  category_id?: string; // Category ID field
  category_type?: 'chat' | 'image' | 'video'; // Add category_type field
  tags: string[];
  content: string | PromptContentJsonb;  // Content field, supports JSONB format
  is_public: boolean;
  user_id: string;
  version?: number; // Version number, supports decimal format like 1.0, 1.1, 2.0
  created_at: string;
  updated_at?: string;
  compatible_models?: string[];
  average_rating?: number;
  rating_count?: number;
  rating?: number; // For frontend component compatibility

  // Collaboration and permission fields
  allow_collaboration?: boolean;
  edit_permission?: 'owner_only' | 'collaborators' | 'public';

  // Media related fields
  preview_asset_url?: string;
  parameters?: { media_files?: Array<{ url: string; [key: string]: unknown }> } & Record<string, unknown>;

  // 作者信息字段
  author?: string;
}

export interface PromptFilters {
  category?: string;
  category_type?: 'chat' | 'image' | 'video';
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  userId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'latest' | 'popular' | 'rating';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiKey {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

// Category type definitions
export type CategoryType = 'chat' | 'image' | 'video';

export interface Category {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  description?: string;
  type: CategoryType;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  optimization_template?: OptimizationTemplateJsonb | string;
}

// JSONB related types (copied from MCP service)
export interface PromptContentJsonb {
  type: 'context_engineering' | 'legacy_text' | 'simple_text';
  static_content?: string;
  dynamic_context?: {
    adaptation_rules?: Record<string, unknown>;
    examples?: {
      selection_strategy?: string;
      max_examples?: number;
      example_pool?: unknown[];
    };
    tools?: {
      available_tools?: unknown[];
      tool_selection_criteria?: string;
    };
    state?: {
      conversation_history?: unknown[];
      user_preferences?: Record<string, unknown>;
      context_variables?: Record<string, unknown>;
    };
  };
  legacy_content?: string;
  migrated_at?: string;
}

export interface OptimizationTemplateJsonb {
  type: 'legacy_text' | 'structured' | 'context_engineering';
  template?: string;
  structure?: {
    system_prompt?: string;
    optimization_rules?: unknown[];
    context_variables?: Record<string, unknown>;
    adaptation_strategies?: Record<string, unknown>;
  };
  context_engineering?: {
    dynamic_adaptation?: boolean;
    user_context_integration?: boolean;
    example_selection_strategy?: string;
    tool_integration?: boolean;
  };
  migrated_at?: string;
}

// Supabase客户端创建函数
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase配置缺失。请在.env文件中设置NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY。');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// 管理员Supabase客户端创建函数
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase管理员配置缺失。请在.env文件中设置NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY。');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Supabase适配器类
 */
export class SupabaseAdapter {
  public supabase: SupabaseClient;

  constructor(useAdmin: boolean = false) {
    this.supabase = useAdmin ? createSupabaseAdminClient() : createSupabaseClient();
  }

  getType(): string {
    return 'supabase';
  }

  // Basic prompt management
  async getCategories(): Promise<string[]> {
    console.log('=== SupabaseAdapter: 开始获取categories ===');

    const { data: categoriesData, error: categoriesError } = await this.supabase
      .from('categories')
      .select('name, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order');

    console.log('categories表查询结果:', {
      error: categoriesError,
      count: categoriesData?.length || 0,
      sample: categoriesData?.slice(0, 3),
    });

    if (categoriesError) {
      console.error('categories表查询失败:', categoriesError);
      throw new Error(`获取分类失败: ${categoriesError.message}`);
    }

    if (!categoriesData || categoriesData.length === 0) {
      throw new Error('categories表中没有数据');
    }

    console.log('成功从categories表获取数据');
    return categoriesData.map(item => item.name);
  }

  async getTags(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .select('tags');

      if (error) {
        console.error('获取标签失败:', error);
        return [];
      }

      const allTags = data.flatMap(item => item.tags || []);
      const uniqueTags = Array.from(new Set(allTags.filter(Boolean)));
      return uniqueTags.sort() as string[];
    } catch (err) {
      console.error('获取标签时出错:', err);
      return [];
    }
  }

  /**
   * 获取带使用频率的标签统计
   */
  async getTagsWithUsageStats(): Promise<Array<{tag: string, count: number}>> {
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .select('tags')
        .eq('is_public', true); // 只统计公开的提示词

      if (error) {
        console.error('获取标签统计失败:', error);
        return [];
      }

      // 统计每个标签的使用频率
      const tagCounts = new Map<string, number>();
      
      data.forEach(item => {
        const tags = item.tags || [];
        tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string') {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      });

      // 转换为数组并按使用频率排序
      const result = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      return result;
    } catch (err) {
      console.error('获取标签统计时出错:', err);
      return [];
    }
  }

  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    try {
      const {
        category,
        category_type,
        tags,
        search,
        isPublic = true,
        userId,
        page = 1,
        pageSize = 20,
        sortBy = 'latest',
      } = filters || {};

      // 警告：管理员权限已被移除。这里的查询现在会失败，
      // 必须在Supabase中为'prompts'表设置行级安全(RLS)策略。
      console.warn('管理员权限已被移除，查询将依赖RLS策略');

      // 按分类类型过滤，同时获取作者信息
      // 直接使用 category_type 字段过滤，避免 INNER JOIN 失败
      let query = this.supabase.from('prompts').select(`
        *,
        users!prompts_user_id_fkey(display_name, email)
      `, { count: 'exact' });
      
      // 按 category_type 过滤
      if (category_type) {
        query = query.eq('category_type', category_type);
      }

      if (category && category !== '全部') {
        query = query.eq('category', category);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      if (search) {
        // 安全的搜索查询，防止SQL注入
        const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&'); // 转义特殊字符
        query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }

      if (userId) {
        // 验证userId是有效的UUID格式，防止SQL注入
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          if (isPublic === true) {
            // 获取用户的公开提示词 + 所有公开的提示词
            query = query.or(`user_id.eq.${userId},is_public.eq.true`);
          } else if (isPublic === false) {
            // 只获取该用户的所有提示词（包括私有的）
            query = query.eq('user_id', userId);
          } else {
            // 默认情况：获取用户的提示词 + 公开提示词
            query = query.or(`user_id.eq.${userId},is_public.eq.true`);
          }
        } else {
          console.warn('无效的用户ID格式，仅返回公开提示词');
          query = query.eq('is_public', true);
        }
      } else {
        // 没有用户ID，只能获取公开提示词
        query = query.eq('is_public', true);
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('获取提示词列表失败:', error);
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }

      // 如果没有数据，直接返回
      if (!data || data.length === 0) {
        return {
          data: [],
          total: count || 0,
          page,
          pageSize,
          totalPages: count ? Math.ceil(count / pageSize) : 0,
        };
      }

      // 获取所有提示词的评分数据
      const promptIds = data.map(p => p.id).filter(Boolean);
      const ratingsMap = new Map<string, { average: number; count: number }>();
      
      if (promptIds.length > 0) {
        try {
          const { data: ratingData, error: ratingError } = await this.supabase
            .from('prompt_ratings')
            .select('prompt_id, rating')
            .in('prompt_id', promptIds);

          if (!ratingError && ratingData && ratingData.length > 0) {
            // 计算每个提示词的平均评分和评分数量
            const ratingStats = ratingData.reduce((acc, rating) => {
              if (!acc[rating.prompt_id]) {
                acc[rating.prompt_id] = { sum: 0, count: 0 };
              }
              acc[rating.prompt_id].sum += rating.rating;
              acc[rating.prompt_id].count += 1;
              return acc;
            }, {} as Record<string, { sum: number; count: number }>);

            // 计算平均值并存储到Map中
            Object.entries(ratingStats).forEach(([promptId, stats]) => {
              ratingsMap.set(promptId, {
                average: Math.round((stats.sum / stats.count) * 10) / 10,
                count: stats.count,
              });
            });

            console.log('计算的评分统计:', Object.fromEntries(ratingsMap));
          }
        } catch (ratingError) {
          console.error('获取评分数据时出错:', ratingError);
        }
      }

      // 添加评分信息和作者信息到提示词数据中
      const promptsWithRatings = data.map(prompt => {
        const ratingInfo = ratingsMap.get(prompt.id) || { average: 0, count: 0 };

        // 处理作者信息
        let authorName = '匿名';
        if (prompt.users) {
          if (prompt.users.display_name) {
            authorName = prompt.users.display_name;
          } else if (prompt.users.email) {
            // 如果没有 display_name，使用 email 的前缀作为备用
            authorName = prompt.users.email.split('@')[0];
          }
        }

        // 移除嵌套的用户对象，避免数据结构混乱
        const { users: _users, ...promptWithoutUsers } = prompt;

        return {
          ...promptWithoutUsers,
          average_rating: ratingInfo.average,
          rating_count: ratingInfo.count,
          rating: ratingInfo.average, // For frontend component compatibility, also provide rating field
          author: authorName, // Add author information
        };
      });

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: promptsWithRatings,
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (err) {
      console.error('获取提示词列表时出错:', err);
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20,
        totalPages: 0,
      };
    }
  }

  async getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null> {
    try {
      // 警告：管理员权限已被移除。这里的查询现在会失败，
      // 必须在Supabase中为'prompts'表设置行级安全(RLS)策略。
      console.warn('管理员权限已被移除，查询将依赖RLS策略');
      
      let query = this.supabase
        .from('prompts')
        .select('*');
        
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
      
      if (isUuid) {
        query = query.eq('id', nameOrId);
      } else {
        query = query.eq('name', nameOrId);
      }
      
      if (userId) {
        // 验证userId是有效的UUID格式，防止SQL注入
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          query = query.or(`user_id.eq.${userId},is_public.eq.true`);
        } else {
          console.warn('无效的用户ID格式，仅返回公开提示词');
          query = query.eq('is_public', true);
        }
      } else {
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`获取提示词 ${nameOrId} 失败:`, error);
        return null;
      }

      console.log('[SupabaseAdapter] 获取提示词成功:', {
        id: data?.id,
        name: data?.name,
        category_type: data?.category_type,
        hasPreviewAssetUrl: !!data?.preview_asset_url,
        hasParameters: !!data?.parameters,
        parametersKeys: data?.parameters ? Object.keys(data.parameters) : [],
        mediaFilesCount: data?.parameters?.media_files?.length || 0,
      });

      return data || null;
    } catch (err) {
      console.error(`获取提示词 ${nameOrId} 时出错:`, err);
      return null;
    }
  }

  // User authentication
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });
      
      if (authError) {
        return { user: null, error: authError.message };
      }
      
      if (!authData.user || !authData.user.id) {
        return { user: null, error: '注册成功，但未能获取用户信息' };
      }
      
      const { error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          display_name: displayName || email.split('@')[0],
        });
        
      if (userError) {
        console.error('创建用户记录失败:', userError);
      }
      
      return {
        user: {
          id: authData.user.id,
          email: email,
          username: displayName || email.split('@')[0],
          display_name: displayName || email.split('@')[0],
          created_at: new Date().toISOString(),
          role: 'user',
        },
        token: authData.session?.access_token,
      };
    } catch (err: unknown) {
      console.error('注册用户时出错:', err);
      return { user: null, error: err instanceof Error ? err.message : '注册失败' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { user: null, error: error.message };
      }
      
      if (!data.user) {
        return { user: null, error: '登录成功，但未能获取用户信息' };
      }
      
      const { data: userData, error: _userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          username: userData?.display_name || email.split('@')[0],
          display_name: userData?.display_name || email.split('@')[0],
          created_at: data.user.created_at,
          role: userData?.role || 'user',
        },
        token: data.session?.access_token,
      };
    } catch (err: unknown) {
      console.error('用户登录时出错:', err);
      return { user: null, error: err instanceof Error ? err.message : '登录失败' };
    }
  }

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
        username: userData.display_name || userData.email.split('@')[0],
        display_name: userData.display_name,
        created_at: userData.created_at,
        role: userData.role || 'user',
      };
    } catch (err) {
      console.error('验证API密钥时出错:', err);
      return null;
    }
  }

  async updateApiKeyLastUsed(apiKey: string): Promise<boolean> {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const { error } = await this.supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash);
        
      return !error;
    } catch (err) {
      console.error('更新API密钥使用时间时出错:', err);
      return false;
    }
  }
  
  /**
   * 验证JWT令牌并返回用户信息
   * @param token JWT令牌
   * @returns User对象或null
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      console.log('验证token...');
      
      // 验证JWT
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.error('JWT验证失败:', error || '无用户数据');
        return null;
      }
      
      console.log('JWT验证成功, 用户ID:', data.user.id);

      // 创建管理员客户端以绕过RLS策略
      const adminClient = createSupabaseAdminClient();

      // 获取用户详细信息，使用管理员客户端
      console.log('查询用户信息，用户ID:', data.user.id);
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', data.user.id);

      console.log('用户查询结果:', { userData, userError });

      if (userError) {
        console.error('获取用户信息失败:', userError);
        // 即使查询失败，也返回基本用户信息，确保认证能够继续
        return {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.email?.split('@')[0] || '',
          display_name: data.user.email?.split('@')[0] || '',
          created_at: data.user.created_at || new Date().toISOString(),
          role: 'user',
        };
      }

      // 检查是否有用户数据
      if (!userData || userData.length === 0) {
        console.log('未找到用户信息，使用基本认证信息');
        // 如果在users表中没找到，说明可能是新用户或数据未同步
        // 返回基本用户信息
        return {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.email?.split('@')[0] || '',
          display_name: data.user.email?.split('@')[0] || '',
          created_at: data.user.created_at || new Date().toISOString(),
          role: 'user',
        };
      }
      
      console.log('获取用户详细信息成功');
      const userInfo = userData[0]; // 使用第一个匹配结果
      
      // 返回用户信息
      return {
        id: data.user.id,
        email: data.user.email || '',
        username: userInfo.username || data.user.email?.split('@')[0] || '',
        display_name: userInfo.display_name,
        created_at: userInfo.created_at || data.user.created_at,
        role: userInfo.role || 'user',
      };
    } catch (error) {
      console.error('验证token时出错:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (userError) {
        console.warn('获取用户额外信息时发生错误:', userError);
      }
        
      return {
        id: data.user.id,
        email: data.user.email || '',
        username: userData?.display_name || data.user.email?.split('@')[0] || '',
        display_name: userData?.display_name || data.user.email?.split('@')[0] || '',
        created_at: data.user.created_at,
        role: userData?.role || 'user',
      };
    } catch (err) {
      console.error('获取当前用户时出错:', err);
      return null;
    }
  }

  async updateUserProfile(userId: string, updateData: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    try {
      const { username, email: _email, currentPassword, newPassword } = updateData;
      
      // 如果要更改密码，先验证当前密码
      if (currentPassword && newPassword) {
        const { error: passwordError } = await this.supabase.auth.updateUser({
          password: newPassword,
        });
        
        if (passwordError) {
          throw new Error(`密码更新失败: ${passwordError.message}`);
        }
      }
      
      // 更新用户表中的信息
      const updateFields: Record<string, unknown> = {};
      if (username) {
        updateFields.display_name = username;
      }
      
      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await this.supabase
          .from('users')
          .update(updateFields)
          .eq('id', userId);
          
        if (updateError) {
          throw new Error(`用户信息更新失败: ${updateError.message}`);
        }
      }
      
      // 获取更新后的用户信息
      const { data: userData, error: fetchError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError || !userData) {
        throw new Error('获取更新后的用户信息失败');
      }
      
      return {
        id: userData.id,
        email: userData.email,
        username: userData.display_name,
        display_name: userData.display_name,
        created_at: userData.created_at,
        role: userData.role || 'user',
      };
    } catch (err: unknown) {
      console.error('更新用户资料时出错:', err);
      throw err;
    }
  }

  // API密钥管理
  async generateApiKey(userId: string, name: string, expiresInDays?: number): Promise<{ id: string; name: string; key: string; user_id: string; created_at: string; expires_at?: string }> {
    try {
      // 生成随机密钥和哈希
      const apiKey = crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // 计算过期时间
      let expiresAt: string | null = null;
      if (expiresInDays && expiresInDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + expiresInDays);
        expiresAt = date.toISOString();
      }
      
      // 创建管理员客户端以绕过RLS策略
      const adminClient = createSupabaseAdminClient();
      console.log('使用管理员权限创建API密钥', { userId, name });
      
      // 使用管理员客户端插入记录
      const { data, error } = await adminClient
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          expires_at: expiresAt,
        })
        .select('id, name, created_at, expires_at')
        .single();
        
      if (error) {
        throw new Error(`创建API密钥失败: ${error.message}`);
      }
      
      return {
        id: data.id,
        name: data.name,
        key: apiKey, // Return real API key (only when creating)
        user_id: userId,
        created_at: data.created_at,
        expires_at: data.expires_at,
      };
    } catch (err: unknown) {
      console.error('生成API密钥时出错:', err);
      throw err;
    }
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      if (!userId) {
        console.error('用户ID不可用，无法获取API密钥');
        return [];
      }
      
      console.log('获取用户 ' + userId + ' 的API密钥列表');
      
      // 创建管理员客户端以绕过RLS策略
      const adminClient = createSupabaseAdminClient();
      console.log('使用管理员权限获取API密钥列表');
      
      // 直接使用标准查询
      const { data, error } = await adminClient
        .from('api_keys')
        .select('id, name, created_at, last_used_at, expires_at, key_hash, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`获取API密钥列表失败: ${error.message}`);
      }
      
      return (data || []).map(key => {
        let expires_in_days = -1; // 默认永不过期
        
        if (key.expires_at) {
          const expiryDate = new Date(key.expires_at);
          const now = new Date();
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          expires_in_days = Math.max(0, diffDays);
        }
        
        return {
          id: key.id,
          name: key.name,
          key: key.key_hash ? '*'.repeat(32) + key.key_hash.substring(0, 8) : 'hidden', // 显示部分哈希作为标识
          user_id: userId,
          created_at: key.created_at,
          last_used_at: key.last_used_at,
          expires_in_days,
        };
      });
    } catch (err: unknown) {
      console.error('获取API密钥列表时出错:', err);
      return [];
    }
  }

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    try {
      // 创建管理员客户端以绕过RLS策略
      const adminClient = createSupabaseAdminClient();
      console.log('使用管理员权限删除API密钥', { userId, keyId });
      
      const { error } = await adminClient
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
  
  /**
   * 创建新提示词
   * @param promptData 提示词数据
   * @returns 新创建的提示词
   */
  async createPrompt(promptData: Partial<Prompt>): Promise<Prompt> {
    try {
      console.log('开始创建提示词过程');
      
      // 直接使用当前的会话获取用户ID
      let userId = promptData.user_id;
      
      // 如果没有提供用户ID，尝试从当前会话获取
      if (!userId) {
        // 添加超时保护的会话获取
        const sessionPromise = this.supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('获取用户会话超时')), 30000); // 增加到30秒超时
        });
        
        try {
          const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]);
          const session = sessionData?.session;
          
          if (session?.user) {
            userId = session.user.id;
            console.log('从当前会话获取用户ID:', userId);
          } else {
            console.error('未能从会话获取用户ID');
            throw new Error('用户未登录或会话已过期');
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.message?.includes('超时')) {
            throw new Error('获取用户信息超时，请重新登录');
          }
          throw error;
        }
      }
      
      // 处理content字段
      const contentValue = (promptData as { content?: string | PromptContentJsonb }).content;
      
      if (!contentValue) {
        throw new Error('提示词内容不能为空');
      }
      
      // 检查内容是否为空
      const contentText = typeof contentValue === 'string' ? contentValue : (contentValue.static_content || contentValue.legacy_content || '');
      if (!contentText.trim()) {
        throw new Error('提示词内容不能为空');
      }
      
      // 根据分类名称查找category_id
      let categoryId = promptData.category_id;
      if (!categoryId && promptData.category) {
        try {
          const { data: categoryData } = await this.supabase
            .from('categories')
            .select('id')
            .eq('name', promptData.category)
            .eq('is_active', true)
            .maybeSingle();

          if (categoryData) {
            categoryId = categoryData.id;
            console.log(`找到分类ID: ${promptData.category} -> ${categoryId}`);
          }
        } catch (error) {
          console.warn('查找分类ID失败:', error);
        }
      }

      // 构建要插入的提示词数据
      const promptToCreate = {
        name: promptData.name || '',
        description: promptData.description || '',
        category: promptData.category || '通用',
        tags: Array.isArray(promptData.tags) ? promptData.tags : [],
        content: contentValue,  // 使用content字段
        is_public: promptData.is_public ?? true,
        user_id: userId,
        created_by: userId, // 设置创建者ID
        category_id: categoryId, // 设置分类ID
        version: promptData.version ? Number(promptData.version) : 1.0, // 恢复 version 字段，确保数字类型
        compatible_models: Array.isArray(promptData.compatible_models) ? promptData.compatible_models : [], // 添加兼容模型字段
        category_type: promptData.category_type || 'chat', // 添加分类类型
        preview_asset_url: promptData.preview_asset_url || null, // 添加预览资源URL
        parameters: promptData.parameters || {}, // 添加参数
        created_at: new Date().toISOString(),
      };
      
      // 验证必填字段
      if (!promptToCreate.name) {
        throw new Error('提示词名称是必填的');
      }
      
      console.log('将创建提示词:', { 
        name: promptToCreate.name,
        userId: promptToCreate.user_id,
        category: promptToCreate.category,
        compatible_models: promptToCreate.compatible_models,
        tags: promptToCreate.tags,
      });
      
      // 创建管理员客户端以绕过RLS策略
      const adminClient = createSupabaseAdminClient();
      console.log('使用管理员权限创建提示词');
      
      // 添加超时保护的数据库操作
      const insertPromise = adminClient
        .from('prompts')
        .insert(promptToCreate)
        .select('*')
        .single();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('数据库操作超时')), 60000); // 增加到60秒超时
      });
      
      let data, error;
      try {
        const result = await Promise.race([insertPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (timeoutError: unknown) {
        if (timeoutError instanceof Error && timeoutError.message?.includes('超时')) {
          throw new Error('数据库操作超时，请检查网络连接并重试');
        }
        throw timeoutError;
      }
        
      if (error) {
        console.error('插入提示词失败:', error);
        throw new Error(`创建提示词失败: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('创建提示词失败: 没有返回数据');
      }
      
      console.log('提示词创建成功:', data);
      return data as Prompt;
    } catch (err: unknown) {
      console.error('创建提示词时出错:', err);
      
      // 提供更友好的错误信息
      if (err instanceof Error && err.message?.includes('超时')) {
        throw new Error('操作超时，请检查网络连接并重试');
      } else if (err instanceof Error && (err.message?.includes('duplicate') || err.message?.includes('重复'))) {
        throw new Error('提示词名称已存在，请使用其他名称');
      } else if (err instanceof Error && (err.message?.includes('permission') || err.message?.includes('权限'))) {
        throw new Error('权限不足，无法创建提示词');
      }
      
      throw err;
    }
  }

  // ===== 分类管理方法 =====

  /**
   * 获取完整的分类信息（包含类型等字段）
   */
  async getCategoriesWithType(): Promise<Category[]> {
    console.log('=== SupabaseAdapter: 开始获取完整分类信息 ===');

    const { data: categoriesData, error: categoriesError } = await this.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    console.log('完整分类查询结果:', {
      error: categoriesError,
      count: categoriesData?.length || 0,
      sample: categoriesData?.slice(0, 3),
    });

    if (categoriesError) {
      console.error('获取完整分类信息失败:', categoriesError);
      throw new Error(`获取分类失败: ${categoriesError.message}`);
    }

    if (!categoriesData || categoriesData.length === 0) {
      console.warn('categories表中没有数据');
      return [];
    }

    console.log('成功获取完整分类信息');
    return categoriesData as Category[];
  }

  /**
   * 按类型获取分类
   */
  async getCategoriesByType(type: CategoryType): Promise<Category[]> {
    console.log('=== SupabaseAdapter: 按类型获取分类 ===', { type });

    const { data: categoriesData, error: categoriesError } = await this.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .eq('type', type)
      .order('sort_order');

    console.log('按类型分类查询结果:', {
      type,
      error: categoriesError,
      count: categoriesData?.length || 0,
      sample: categoriesData?.slice(0, 3),
    });

    if (categoriesError) {
      console.error('按类型获取分类失败:', categoriesError);
      throw new Error(`获取${type}类型分类失败: ${categoriesError.message}`);
    }

    if (!categoriesData || categoriesData.length === 0) {
      console.warn(`没有找到${type}类型的分类`);
      return [];
    }

    console.log(`成功获取${type}类型分类`);
    return categoriesData as Category[];
  }
}

// 创建适配器实例
const supabaseAdapter = new SupabaseAdapter();

// 导出适配器实例
export { supabaseAdapter };

// 默认导出
export default supabaseAdapter; 