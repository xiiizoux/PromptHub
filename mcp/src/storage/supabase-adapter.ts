import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import crypto from 'crypto';
import logger, { logPerformanceEvent } from '../utils/logger.js';
import { createEnhancedError, ErrorType, ErrorSeverity } from '../shared/error-handler.js';
import {
  Prompt,
  PromptVersion,
  StorageAdapter,
  User,
  AuthResponse,
  PromptFilters,
  PaginatedResponse,
  ApiKey
} from '../types.js';

// 连接池配置
interface ConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  poolSize: number;
}

// 查询缓存
interface QueryCache {
  [key: string]: {
    data: unknown;
    timestamp: number;
    ttl: number;
  };
}

export class SupabaseAdapter implements StorageAdapter {
  private supabase: SupabaseClient;
  private adminSupabase?: SupabaseClient;
  private connectionConfig: ConnectionConfig;
  private queryCache: QueryCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    // 验证配置
    if (!config.supabase?.url || !config.supabase?.anonKey) {
      throw createEnhancedError(
        'Supabase URL and anon key are required for Supabase adapter',
        ErrorType.STORAGE,
        ErrorSeverity.CRITICAL,
        { configKeys: Object.keys(config.supabase || {}) }
      );
    }

    // 连接配置
    this.connectionConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      poolSize: 10
    };

    // 创建客户端连接
    this.supabase = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'mcp-prompt-server'
        }
      }
    });

    // 如果有服务密钥，创建管理员客户端
    if (config.supabase.serviceKey) {
      this.adminSupabase = createClient(config.supabase.url, config.supabase.serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }

    logger.info('Supabase adapter initialized', {
      url: config.supabase.url,
      hasServiceKey: !!config.supabase.serviceKey
    });
  }
  
  /**
   * 获取存储适配器类型
   * @returns 存储适配器类型名称
   */
  getType(): string {
    return 'supabase';
  }

  /**
   * 执行带重试的查询
   */
  private async executeWithRetry<T>(
    operation: () => Promise<{ data: T; error: unknown }>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.connectionConfig.maxRetries; attempt++) {
      try {
        const { data, error } = await operation();

        if (error) {
          lastError = error;

          // 判断是否应该重试
          if (this.shouldRetry(error) && attempt < this.connectionConfig.maxRetries) {
            logger.warn(`Supabase operation failed, retrying (${attempt}/${this.connectionConfig.maxRetries})`, {
              operation: operationName,
              error: (error as Record<string, unknown>).message,
              attempt,
              context
            });

            await this.delay(this.connectionConfig.retryDelay * attempt);
            continue;
          }

          // 记录错误并抛出
          const enhancedError = createEnhancedError(
            `${operationName} failed: ${(error as Record<string, unknown>).message}`,
            this.mapErrorType(error),
            this.mapErrorSeverity(error),
            { ...context, attempt, supabaseError: error }
          );

          const errorObj = error as Record<string, unknown>;
          logger.error('Supabase operation failed', {
            operation: operationName,
            error: errorObj.message,
            code: errorObj.code,
            details: errorObj.details,
            context
          });

          throw enhancedError;
        }

        // 记录性能
        const duration = Date.now() - startTime;
        logPerformanceEvent(operationName, duration, { attempt, context });

        return data;

      } catch (error) {
        lastError = error;

        if (attempt < this.connectionConfig.maxRetries) {
          logger.warn(`Supabase operation exception, retrying (${attempt}/${this.connectionConfig.maxRetries})`, {
            operation: operationName,
            error: (error as Record<string, unknown>).message,
            attempt
          });

          await this.delay(this.connectionConfig.retryDelay * attempt);
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  /**
   * 判断错误是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    // 网络错误、超时错误、临时服务器错误应该重试
    const retryableCodes = ['PGRST301', 'PGRST302', '08000', '08003', '08006'];
    const retryableMessages = ['network', 'timeout', 'connection', 'temporary'];

    if (error && typeof error === 'object' && 'code' in error && 
        retryableCodes.includes(String(error.code))) {
      return true;
    }

    const errorMessage = (error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : String(error)).toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * 映射Supabase错误到内部错误类型
   */
  private mapErrorType(error: unknown): ErrorType {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'PGRST116') {return ErrorType.NOT_FOUND;}
      if (error.code === 'PGRST301') {return ErrorType.AUTHENTICATION;}
      if (error.code === 'PGRST302') {return ErrorType.AUTHORIZATION;}
    }
    if (error && typeof error === 'object' && 'message' in error && 
        String(error.message).includes('network')) {
      return ErrorType.NETWORK;
    }
    return ErrorType.STORAGE;
  }

  /**
   * 映射错误严重程度
   */
  private mapErrorSeverity(error: unknown): ErrorSeverity {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'PGRST116') {return ErrorSeverity.LOW;} // Not found
      if (String(error.code).startsWith('08')) {return ErrorSeverity.HIGH;} // Connection errors
    }
    if (error && typeof error === 'object' && 'message' in error && 
        String(error.message).includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.MEDIUM;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 缓存查询结果
   */
  private getCachedResult<T>(cacheKey: string): T | null {
    const cached = this.queryCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * 设置缓存
   */
  private setCachedResult<T>(cacheKey: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.queryCache[cacheKey] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.queryCache).forEach(key => {
      const cached = this.queryCache[key];
      if (now - cached.timestamp > cached.ttl) {
        delete this.queryCache[key];
      }
    });
  }

  // ========= 基本提示词管理 =========
  
  async getCategories(): Promise<string[]> {
    const cacheKey = 'categories';

    // 检查缓存
    const cached = this.getCachedResult<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从categories表获取分类
    const categoryResult = await this.executeWithRetry(
      async () => await this.supabase
        .from('categories')
        .select('name, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order'),
      'getCategories'
    );

    if (!categoryResult) {
      throw new Error('获取分类失败：数据库查询返回空结果');
    }

    if (categoryResult.length === 0) {
      throw new Error('categories表中没有数据');
    }

    const categories = (categoryResult as Array<{ name?: string }>)
      .map(item => item?.name)
      .filter(name => name && typeof name === 'string' && name.trim()) as string[];

    if (categories.length === 0) {
      throw new Error('categories表中没有有效的分类数据');
    }

    // 缓存结果
    this.setCachedResult(cacheKey, categories);
    return categories;
  }

  /**
   * 获取完整的分类信息（包含类型）
   * @returns 分类完整信息列表
   */
  async getCategoriesWithType(): Promise<import('../types.js').Category[]> {
    const cacheKey = 'categories_with_type';

    // 检查缓存
    const cached = this.getCachedResult<import('../types.js').Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从categories表获取完整分类信息
    const categoryResult = await this.executeWithRetry(
      async () => await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('type, sort_order'),
      'getCategoriesWithType'
    );

    if (!categoryResult) {
      throw new Error('获取分类失败：数据库查询返回空结果');
    }

    const categories = categoryResult as import('../types.js').Category[];

    // 缓存结果
    this.setCachedResult(cacheKey, categories);
    return categories;
  }

  /**
   * 按类型获取分类
   * @param type 分类类型
   * @returns 指定类型的分类列表
   */
  async getCategoriesByType(type: import('../types.js').CategoryType): Promise<import('../types.js').Category[]> {
    const cacheKey = `categories_by_type_${type}`;

    // 检查缓存
    const cached = this.getCachedResult<import('../types.js').Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从categories表获取指定类型的分类
    const categoryResult = await this.executeWithRetry(
      async () => await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('type', type)
        .order('sort_order'),
      'getCategoriesByType'
    );

    if (!categoryResult) {
      throw new Error('获取分类失败：数据库查询返回空结果');
    }

    const categories = categoryResult as import('../types.js').Category[];

    // 缓存结果
    this.setCachedResult(cacheKey, categories);
    return categories;
  }

  /**
   * 按类型获取提示词
   * @param type 分类类型
   * @param userId 用户ID
   * @param includePublic 是否包含公开提示词
   * @param limit 限制数量
   * @returns 指定类型的提示词列表
   */
  async getPromptsByType(
    type: import('../types.js').CategoryType, 
    userId?: string, 
    includePublic: boolean = true, 
    limit: number = 50
  ): Promise<Prompt[]> {
    const cacheKey = `prompts_by_type_${type}_${userId || 'anonymous'}_${includePublic}_${limit}`;

    // 检查缓存
    const cached = this.getCachedResult<Prompt[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 构建查询，使用视图获取带类型信息的提示词
      let query = this.supabase
        .from('prompts_with_category_type')
        .select('*')
        .eq('category_type', type)
        .limit(limit)
        .order('created_at', { ascending: false });

      // 添加权限过滤
      if (userId && includePublic) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (includePublic) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`按类型获取提示词失败: ${error.message}`);
      }

      const prompts = (data || []) as Prompt[];

      // 缓存结果
      this.setCachedResult(cacheKey, prompts, this.CACHE_TTL / 2); // 较短的缓存时间
      return prompts;
    } catch (err) {
      console.error('按类型获取提示词时出错:', err);
      throw err;
    }
  }
  
  /**
   * 获取所有标签
   * @returns 标签列表
   */
  async getTags(): Promise<string[]> {
    const cacheKey = 'tags';

    // 检查缓存
    const cached = this.getCachedResult<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tagResult = await this.executeWithRetry(
        async () => await this.supabase
          .from('prompts')
          .select('tags')
          .not('tags', 'is', null),
        'getTags'
      );
      
      const data = tagResult || [];

      // 提取所有标签并去重，过滤空值
      const allTags = (data as Array<{ tags?: string[] }>)
        .flatMap(item => item?.tags || [])
        .filter(tag => tag && typeof tag === 'string' && tag.trim())
        .map(tag => tag.trim());

      const uniqueTags = Array.from(new Set(allTags)).sort();

      // 缓存结果
      this.setCachedResult(cacheKey, uniqueTags);

      return uniqueTags;
    } catch (error) {
      logger.error('获取标签失败', { error: error.message });
      return [];
    }
  }
  
  async getPromptsByCategory(category: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    // 构建缓存键
    const cacheKey = `prompts_by_category_${category}_${userId || 'anonymous'}_${includePublic}`;

    // 检查缓存（较短的缓存时间，因为数据可能经常变化）
    const cached = this.getCachedResult<Prompt[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 如果没有用户ID且不包括公开内容，直接返回空
      if (!userId && !includePublic) {
        return [];
      }

      const promptResult = await this.executeWithRetry(
        async () => {
          let query = this.supabase
            .from('prompts')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

          // 添加访问控制筛选
          if (userId) {
            if (includePublic) {
              // 用户自己的提示词 + 公开提示词
              query = query.or(`user_id.eq.${userId},is_public.eq.true`);
            } else {
              // 只查询用户自己的提示词
              query = query.eq('user_id', userId);
            }
          } else {
            // 没有用户ID时只返回公开内容
            query = query.eq('is_public', true);
          }

          return await query;
        },
        'getPromptsByCategory',
        { category, userId, includePublic }
      );
      
      const data = promptResult || [];

      // 缓存结果（较短的缓存时间）
      this.setCachedResult(cacheKey, data, 2 * 60 * 1000); // 2分钟缓存

      return data;
    } catch (error) {
      logger.error('按分类获取提示词失败', {
        error: error.message,
        category,
        userId,
        includePublic
      });
      return [];
    }
  }
  
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    try {
      // 默认过滤器设置
      const {
        category,
        category_type,
        tags,
        search,
        isPublic,
        userId,
        page = 1,
        pageSize = 20,
        sortBy = 'latest'
      } = filters || {};

      // 根据是否需要分类类型信息选择查询源
      const fromTable = category_type ? 'prompts_with_category_type' : 'prompts';
      let query = this.supabase.from(fromTable).select('*', { count: 'exact' });

      // 应用筛选条件
      if (category && category !== '全部') {
        query = query.eq('category', category);
      }

      // 新增：按分类类型筛选
      if (category_type) {
        query = query.eq('category_type', category_type);
      }

      if (tags && tags.length > 0) {
        // 标签过滤（匹配任一标签）
        query = query.overlaps('tags', tags);
      }

      if (search) {
        // 搜索条件（名称、描述、标签）
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // 用户权限过滤
      if (userId) {
        // 用户能看到自己的提示词和公开提示词
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        // 未登录用户只能看公开提示词
        query = query.eq('is_public', true);
      }

      // 如果明确指定公开/私有状态
      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic);
        // 如果要查看私有且提供了用户ID，确保只查看自己的
        if (!isPublic && userId) {
          query = query.eq('user_id', userId);
        }
      }

      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 排序方式
      if (sortBy === 'popular') {
        // 假设有一个popularity字段或计算方式
        query = query.order('popularity', { ascending: false });
      } else {
        // 默认按最新排序
        query = query.order('created_at', { ascending: false });
      }

      // 应用分页
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
      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (err) {
      console.error('获取提示词列表时出错:', err);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      };
    }
  }

  async getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null> {
    try {
      // 构建基本查询
      let query = this.supabase.from('prompts').select('*');
      
      // 判断输入是UUID还是名称
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
      
      if (isUuid) {
        query = query.eq('id', nameOrId);
      } else {
        query = query.eq('name', nameOrId);
      }
      
      // 添加访问控制
      if (userId) {
        // 如果有用户ID，可以访问自己的提示词和公开提示词
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        // 如果没有用户ID，只能访问公开提示词
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query.maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (error) {
        console.error(`获取提示词失败: ${error.message}`);
        return null;
      }

      if (!data) {
        return null; // Not found
      }

      return data;
    } catch (err) {
      console.error(`获取提示词时出错:`, err);
      return null;
    }
  }

  /**
   * 验证用户是否存在于数据库中
   */
  private async validateUserExists(userId: string): Promise<void> {
    
    const user = await this.getUser(userId);
    if (!user) {
      console.error(`[SupabaseAdapter] ❌ 用户验证失败: 用户ID ${userId} 在users表中不存在`);
      
      // 详细检查各个表的数据
      try {
        // 1. 检查API密钥表
        const { data: apiKeyData, error: apiKeyError } = await this.supabase
          .from('api_keys')
          .select('user_id, name, created_at')
          .eq('user_id', userId);
        
        console.error('[SupabaseAdapter] API密钥表查询:', {
          data: apiKeyData,
          error: apiKeyError?.message,
          count: apiKeyData?.length || 0
        });
        
        // 2. 检查users表
        const { data: usersData, error: usersError } = await this.supabase
          .from('users')
          .select('id, email, display_name')
          .eq('id', userId);
          
        console.error('[SupabaseAdapter] users表查询:', {
          data: usersData,
          error: usersError?.message,
          count: usersData?.length || 0
        });
        
        // 3. 检查prompts表的外键约束
        const { data: constraintData, error: constraintError } = await this.supabase
          .rpc('check_foreign_key_constraints', {});
          
        console.error('[SupabaseAdapter] 外键约束检查:', {
          data: constraintData,
          error: constraintError?.message
        });
        
      } catch (debugError) {
        console.error('[SupabaseAdapter] 调试查询失败:', debugError);
      }
      
      throw new Error(`用户验证失败: 用户ID ${userId} 在数据库中不存在`);
    }
    
  }

  async createPrompt(prompt: Prompt): Promise<Prompt> {
      try {
        // 确保有用户ID - 改进用户ID验证逻辑
        const finalUserId = prompt.user_id;

        if (!finalUserId) {
          throw new Error('无法确定用户身份，请检查API密钥认证');
        }
        
        const promptData = {
          name: prompt.name,
          description: prompt.description,
          category: prompt.category || '通用',
          tags: prompt.tags || [],
          content: prompt.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: prompt.version ? Number(prompt.version) : 1.0, // 新建提示词默认版本为1.0
          is_public: prompt.is_public !== undefined ? prompt.is_public : true, // 默认公开，便于分享和发现
          allow_collaboration: prompt.allow_collaboration !== undefined ? prompt.allow_collaboration : false, // 默认不允许协作编辑，保护创建者权益
          edit_permission: prompt.edit_permission || 'owner_only', // 默认仅创建者可编辑
          user_id: finalUserId,
          created_by: finalUserId, // 设置创建者ID
          // 新增媒体相关字段
          preview_asset_url: prompt.preview_asset_url || null,
          parameters: prompt.parameters || {},
          category_id: prompt.category_id || null,
          category_type: prompt.category_type || 'chat' // 确保category_type字段被正确传递
        };
        
        // 确保 category_type 是有效的枚举值
        if (promptData.category_type && !['chat', 'image', 'video'].includes(promptData.category_type)) {
          console.warn('[SupabaseAdapter] 无效的 category_type 值:', promptData.category_type, '，重置为 chat');
          promptData.category_type = 'chat';
        }
        
        if (finalUserId) {
          await this.validateUserExists(finalUserId);
        }

        // 根据分类名称查找category_id
        if (!promptData.category_id && promptData.category) {
          try {
            const { data: categoryData } = await this.supabase
              .from('categories')
              .select('id')
              .eq('name', promptData.category)
              .eq('is_active', true)
              .maybeSingle();

            if (categoryData) {
              promptData.category_id = categoryData.id;
            }
          } catch (error) {
            console.warn('[SupabaseAdapter] 查找分类ID失败:', error);
          }
        }

        
        // 创建提示词，使用管理员客户端绕过RLS策略
        const client = this.adminSupabase || this.supabase;

        const { data, error } = await client
          .from('prompts')
          .insert([promptData])
          .select();
  
        if (error) {
          console.error('[SupabaseAdapter] 创建提示词数据库错误:', error);
          throw new Error(`创建提示词失败: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          console.error('[SupabaseAdapter] 创建提示词未返回数据');
          throw new Error('创建提示词失败: 未返回数据');
        }
        
        const createdPrompt = data[0];
        
        // 创建初始版本
        try {
          await this.createPromptVersion({
            prompt_id: createdPrompt.id,
            version: createdPrompt.version || 1.0, // 使用创建的提示词的版本号
            content: prompt.content || '',
            description: prompt.description,
            category: prompt.category || '通用',
            tags: prompt.tags || [],
            user_id: finalUserId
          });
        } catch (versionError) {
          console.warn('[SupabaseAdapter] 创建初始版本失败:', versionError);
          // 版本创建失败不应该影响主要创建流程
        }
        
        return createdPrompt;
      } catch (err) {
        console.error('[SupabaseAdapter] 创建提示词时出错:', err);
        throw err;
      }
    }


  async updatePrompt(nameOrId: string, prompt: Partial<Prompt>, userId?: string): Promise<Prompt> {
    try {
      // 获取当前提示词信息
      const existingPrompt = await this.getPrompt(nameOrId, userId);
      if (!existingPrompt) {
        throw new Error(`提示词未找到: ${nameOrId}`);
      }
      
      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权更新此提示词');
      }
      
      // 准备更新数据
      // 版本号递增 - 编辑时默认+0.1（支持小数版本号）
      const currentVersion = existingPrompt.version || 1.0;
      const newVersion = Math.round((currentVersion + 0.1) * 10) / 10;
      
      const updateData = {
        ...prompt,
        updated_at: new Date().toISOString(),
        version: newVersion
      };

      // 更新提示词
      const { data, error } = await this.supabase
        .from('prompts')
        .update(updateData)
        .eq('id', existingPrompt.id)
        .select();

      if (error) {
        throw new Error(`更新提示词失败: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('更新提示词失败: 未返回数据');
      }
      
      const updatedPrompt = data[0];
      
      // 创建新版本记录
      await this.createPromptVersion({
        prompt_id: updatedPrompt.id,
        version: updatedPrompt.version || 1.0, // 使用更新后的版本号
        content: prompt.content || existingPrompt.content || '',
        description: prompt.description || existingPrompt.description,
        category: prompt.category || existingPrompt.category,
        tags: prompt.tags || existingPrompt.tags,
        user_id: userId || existingPrompt.user_id,
        // 新增媒体相关字段
        preview_asset_url: prompt.preview_asset_url || existingPrompt.preview_asset_url,
        parameters: prompt.parameters || existingPrompt.parameters,
        category_id: prompt.category_id || existingPrompt.category_id
      });
      
      return updatedPrompt;
    } catch (err) {
      console.error('更新提示词时出错:', err);
      throw err;
    }
  }

  /**
   * 从URL中提取文件名
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || '';
    } catch (error) {
      console.error('提取文件名失败:', error);
      return '';
    }
  }

  /**
   * 删除提示词关联的媒体文件
   */
  private async deletePromptMediaFiles(prompt: Record<string, unknown>): Promise<void> {
    if (!prompt || (prompt.category_type !== 'image' && prompt.category_type !== 'video')) {
      return; // 非媒体类型提示词，无需删除文件
    }

    const filesToDelete: string[] = [];

    // 收集需要删除的文件
    // 1. preview_asset_url 中的文件
    if (prompt.preview_asset_url) {
      const filename = this.extractFilenameFromUrl(String(prompt.preview_asset_url));
      if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
        filesToDelete.push(filename);
      }
    }

    // 2. parameters.media_files 中的文件
    const mediaFiles = (prompt.parameters as Record<string, unknown>)?.media_files || [];
    (mediaFiles as Array<Record<string, unknown>>).forEach((file) => {
      if (file.url) {
        const filename = this.extractFilenameFromUrl(String(file.url));
        if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
          filesToDelete.push(filename);
        }
      }
    });

    // 删除重复的文件名
    const uniqueFiles = [...new Set(filesToDelete)];

    // 逐个删除文件
    for (const filename of uniqueFiles) {
      try {
        const deleteResult = await this.deleteAsset(filename);
        if (!deleteResult.success) {
          console.warn(`删除文件失败: ${filename}`, deleteResult.message);
        }
      } catch (error) {
        console.warn(`删除文件时出错: ${filename}`, error);
      }
    }
  }

  async deletePrompt(nameOrId: string, userId?: string): Promise<boolean> {
    try {
      // 获取当前提示词信息以检查权限
      const existingPrompt = await this.getPrompt(nameOrId, userId);
      if (!existingPrompt) {
        throw new Error(`提示词未找到: ${nameOrId}`);
      }

      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权删除此提示词');
      }

      // 先删除关联的媒体文件
      await this.deletePromptMediaFiles(existingPrompt as unknown as Record<string, unknown>);

      // 然后删除提示词记录
      const { error } = await this.supabase
        .from('prompts')
        .delete()
        .eq('id', existingPrompt.id);

      if (error) {
        throw new Error(`删除提示词失败: ${error.message}`);
      }

      return true;
    } catch (err) {
      console.error('删除提示词时出错:', err);
      return false;
    }
  }

  async searchPrompts(query: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    try {
      // 数据清洗和关键词提取
      const cleanQuery = query.trim().toLowerCase();
      const keywords = this.extractSearchKeywords(cleanQuery);
      
      
      // 1. 精确匹配搜索（最高优先级）
      const exactResults = await this.executeExactSearch(cleanQuery, userId, includePublic);
      
      // 2. 关键词分词搜索
      const keywordResults = await this.executeKeywordSearch(keywords, userId, includePublic);
      
      // 3. 模糊匹配搜索（兜底策略）
      const fuzzyResults = await this.executeFuzzySearch(cleanQuery, userId, includePublic);
      
      // 合并和去重
      const allResults = this.mergeSearchResults(exactResults, keywordResults, fuzzyResults);
      
      // 计算相关性评分并排序
      const scoredResults = this.calculateRelevanceScore(allResults, cleanQuery, keywords);
      
      
      return scoredResults;
      
    } catch (err) {
      console.error('搜索提示词时出错:', err);
      return [];
    }
  }
  
  /**
   * 提取搜索关键词
   */
  private extractSearchKeywords(query: string): string[] {
    // 扩展的中英文停用词列表
    const stopWords = [
      // 中文停用词
      '的', '了', '和', '是', '在', '有', '以', '及', '为', '与', '等', '或', '但', '这', '那', 
      '一个', '用于', '可以', '能够', '如何', '什么', '怎么', '哪些', '哪个', '一些', '这些', '那些',
      '我们', '你们', '他们', '我的', '你的', '他的', '她的', '它的',
      // 英文停用词
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ];
    
    // 智能分词：按多种分隔符分割
    const words = query
      .toLowerCase() // 转小写进行处理
      .split(/[\s,，。！？、；：""''（）()[\]【】\-_=+|\\/*&%$#@~`]+/)
      .filter(word => {
        // 过滤条件
        if (word.length === 0) {return false;}
        if (word.length < 2) {return false;} // 至少2个字符
        if (stopWords.includes(word)) {return false;}
        if (/^[0-9]+$/.test(word)) {return false;} // 排除纯数字
        if (/^[^\u4e00-\u9fa5a-zA-Z]+$/.test(word)) {return false;} // 排除纯符号
        return true;
      });
    
    // 保持原始查询在第一位，然后添加去重的关键词
    const uniqueWords = [query.trim()]; // 原始查询始终保留
    
    // 添加分词结果（去重）
    words.forEach(word => {
      if (!uniqueWords.includes(word) && word !== query.trim()) {
        uniqueWords.push(word);
      }
    });
    
    
    // 限制关键词数量以优化性能（原始查询 + 最多9个分词结果）
    return uniqueWords.slice(0, 10);
  }
  
  /**
   * 精确匹配搜索
   */
  private async executeExactSearch(query: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    try {
      
      // 使用新的content字段进行统一搜索
      let dbQuery = this.supabase
        .from('prompts')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,content.ilike.%${query}%`);

      dbQuery = this.applyAccessControl(dbQuery, userId, includePublic);

      const { data: results, error } = await dbQuery.limit(50);

      if (error) {
        console.warn('精确搜索失败:', error.message);
        return [];
      }

      return results || [];
      

    } catch (err) {
      console.warn('精确搜索出错:', err);
      return [];
    }
  }
  
  /**
   * 关键词分词搜索
   */
  private async executeKeywordSearch(keywords: string[], userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    if (keywords.length === 0) {return [];}
    
    try {
      const results = new Set<Prompt>();
      
      // 对每个关键词进行搜索（并行处理前5个关键词）
      const searchPromises = keywords.slice(0, 5).map(async (keyword) => {
        try {
          // 使用content字段进行统一搜索
          let dbQuery = this.supabase
            .from('prompts')
            .select('*')
            .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%,content.ilike.%${keyword}%`);

          dbQuery = this.applyAccessControl(dbQuery, userId, includePublic);

          const { data, error } = await dbQuery.limit(20);

          if (!error && data) {
            data.forEach(prompt => results.add(prompt));
          }

        } catch (err) {
          console.warn(`关键词 "${keyword}" 搜索失败:`, err);
        }
      });
      
      await Promise.all(searchPromises);
      
      return Array.from(results);
    } catch (err) {
      console.warn('关键词搜索出错:', err);
      return [];
    }
  }
  
  /**
   * 模糊匹配搜索
   */
  private async executeFuzzySearch(query: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    try {
      
      // 生成模糊匹配查询
      const fuzzyQuery = query.split('').join('%');
      
      // 使用content字段进行统一模糊搜索
      let dbQuery = this.supabase
        .from('prompts')
        .select('*')
        .or(`name.ilike.%${fuzzyQuery}%,description.ilike.%${fuzzyQuery}%,category.ilike.%${fuzzyQuery}%,content.ilike.%${fuzzyQuery}%`);

      dbQuery = this.applyAccessControl(dbQuery, userId, includePublic);

      const { data, error } = await dbQuery.limit(30);

      if (error) {
        console.warn('模糊搜索失败:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('模糊搜索出错:', err);
      return [];
    }
  }
  
  /**
   * 应用访问控制
   */
  private applyAccessControl(dbQuery: any, userId?: string, includePublic: boolean = true) {
    if (userId) {
      if (includePublic) {
        // 用户自己的提示词 + 公开提示词
        return dbQuery.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        // 只查询用户自己的提示词
        return dbQuery.eq('user_id', userId);
      }
    } else {
      // 没有用户ID时只返回公开内容
      return dbQuery.eq('is_public', true);
    }
  }
  
  /**
   * 合并搜索结果并去重
   */
  private mergeSearchResults(...resultSets: Prompt[][]): Prompt[] {
    const uniqueResults = new Map<string, Prompt>();
    
    resultSets.forEach(results => {
      results.forEach(prompt => {
        const key = `${prompt.id || prompt.name}`;
        if (!uniqueResults.has(key)) {
          uniqueResults.set(key, prompt);
        }
      });
    });
    
    return Array.from(uniqueResults.values());
  }
  
  /**
   * 计算相关性评分并排序
   */
  private calculateRelevanceScore(prompts: Prompt[], originalQuery: string, keywords: string[]): Prompt[] {
    return prompts
      .map(prompt => {
        let score = 0;
        const query = originalQuery.toLowerCase();
        
        // 字段权重定义
        const weights = {
          name: 3.0,        // 标题权重最高
          description: 2.0, // 描述权重中等
          content: 1.5,     // 提示词内容权重中等
          category: 1.0     // 分类权重较低
        };
        
        // 提取content字段文本（处理JSONB格式）
        const contentText = typeof prompt.content === 'string' 
          ? prompt.content 
          : String((prompt.content as unknown as Record<string, unknown>)?.static_content || (prompt.content as unknown as Record<string, unknown>)?.legacy_content || '');

        // 计算各字段匹配分数
        const fields = {
          name: prompt.name || '',
          description: prompt.description || '',
          content: contentText,
          category: prompt.category || ''
        };
        
        Object.entries(fields).forEach(([field, text]) => {
          const fieldText = typeof text === 'string' ? text.toLowerCase() : '';
          const weight = weights[field as keyof typeof weights];
          
          // 1. 精确匹配（最高分）
          if (fieldText.includes(query)) {
            score += weight * 10;
          }
          
          // 2. 关键词匹配
          keywords.forEach(keyword => {
            if (keyword !== query && fieldText.includes(keyword.toLowerCase())) {
              score += weight * 5;
            }
          });
          
          // 3. 位置权重（出现在开头得分更高）
          const position = fieldText.indexOf(query);
          if (position !== -1) {
            const positionBonus = Math.max(0, 2 - position / 10);
            score += weight * positionBonus;
          }
          
          // 4. 关键词密度奖励
          if (fieldText.length > 0) {
            const keywordCount = keywords.filter(kw => fieldText.includes(kw.toLowerCase())).length;
            const density = keywordCount / Math.max(fieldText.length / 100, 1);
            score += weight * density;
          }
        });
        
        // 5. 长度惩罚（避免过长内容稀释关键词密度）
        const totalLength = Object.values(fields).join('').length;
        const lengthPenalty = Math.min(1, 500 / Math.max(totalLength, 100));
        score *= lengthPenalty;
        
        // 6. 公开性奖励（公开提示词略微提升排名）
        if (prompt.is_public) {
          score *= 1.1;
        }
        
        
        return { ...prompt, _score: score };
      })
      .sort((a, b) => (b._score || 0) - (a._score || 0))
      .map(({ _score, ...prompt }) => prompt); // 移除临时评分字段
  }


  // ========= 版本控制相关方法 =========
  
  async getPromptVersions(promptId: string, userId?: string): Promise<PromptVersion[]> {
    try {
      // 获取提示词信息以检查权限
      const prompt = await this.getPrompt(promptId, userId);
      if (!prompt) {
        throw new Error(`提示词未找到: ${promptId}`);
      }
      
      const { data, error } = await this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version', { ascending: false });

      if (error) {
        throw new Error(`获取提示词版本失败: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('获取提示词版本时出错:', err);
      return [];
    }
  }

  async getPromptVersion(promptId: string, version: number, userId?: string): Promise<PromptVersion | null> {
    try {
      // 获取提示词信息以检查权限
      const prompt = await this.getPrompt(promptId, userId);
      if (!prompt) {
        throw new Error(`提示词未找到: ${promptId}`);
      }
      
      const { data, error } = await this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('version', version)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 版本不存在
        }
        throw new Error(`获取提示词版本失败: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('获取提示词版本时出错:', err);
      return null;
    }
  }
  
  async createPromptVersion(promptVersion: PromptVersion): Promise<PromptVersion> {
    try {
      // 获取当前用户
      let userId = promptVersion.user_id;
      if (!userId) {
        const currentUser = await this.getCurrentUser();
        userId = currentUser?.id;
      }
      
      const versionData = {
        prompt_id: promptVersion.prompt_id,
        version: promptVersion.version,
        content: promptVersion.content || '',
        description: promptVersion.description,
        category: promptVersion.category,
        tags: promptVersion.tags,
        user_id: userId,
        created_at: new Date().toISOString(),
        category_id: promptVersion.category_id || null
        // 注意：不保存媒体相关字段 (preview_asset_url, parameters)
        // 媒体文件不支持版本管理，版本回滚时保持当前媒体状态
      };
      
      // 使用管理员客户端绕过RLS策略
      const client = this.adminSupabase || this.supabase;

      const { data, error } = await client
        .from('prompt_versions')
        .insert([versionData])
        .select();

      if (error) {
        throw new Error(`创建提示词版本失败: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('创建提示词版本失败: 未返回数据');
      }
      
      return data[0];
    } catch (err) {
      console.error('创建提示词版本时出错:', err);
      throw err;
    }
  }
  
  async restorePromptVersion(promptId: string, version: number, userId?: string): Promise<Prompt> {
    try {
      // 获取要恢复的版本
      const versionToRestore = await this.getPromptVersion(promptId, version, userId);
      if (!versionToRestore) {
        throw new Error(`未找到版本 ${version} (提示词ID: ${promptId})`);
      }
      
      // 获取当前提示词信息
      const promptData = await this.getPrompt(promptId, userId);
      if (!promptData) {
        throw new Error(`提示词未找到: ${promptId}`);
      }
      
      // 检查权限
      if (userId && promptData.user_id !== userId) {
        throw new Error('无权恢复此提示词版本');
      }
      
      // 更新提示词为历史版本内容
      const updateData = {
        content: versionToRestore.content || '',
        description: versionToRestore.description,
        category: versionToRestore.category,
        tags: versionToRestore.tags,
        updated_at: new Date().toISOString(),
        version: (promptData.version || 1) + 1 // 增加版本号
      };
      
      const { data, error } = await this.supabase
        .from('prompts')
        .update(updateData)
        .eq('id', promptId)
        .select();
    
      if (error) {
        throw new Error(`恢复提示词版本失败: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('恢复提示词版本失败: 未返回数据');
      }
      
      const restoredPrompt = data[0];
      
      // 创建新版本记录
      await this.createPromptVersion({
        prompt_id: promptId,
        version: updateData.version,
        content: versionToRestore.content || '',
        description: versionToRestore.description,
        category: versionToRestore.category,
        tags: versionToRestore.tags,
        user_id: userId || promptData.user_id
      });
      
      return restoredPrompt;
    } catch (err) {
      console.error('恢复提示词版本时出错:', err);
      throw err;
    }
  }
  
  // ========= 导入导出相关方法 =========
  
  async exportPrompts(userId?: string, promptIds?: string[]): Promise<Prompt[]> {
    try {
      let query = this.supabase.from('prompts').select('*');
      
      // 根据用户ID和权限过滤
      if (userId) {
        // 如果提供了用户ID，只导出该用户的提示词
        query = query.eq('user_id', userId);
      } else {
        // 如果没有用户ID，只导出公开提示词
        query = query.eq('is_public', true);
      }
      
      // 如果提供了特定的提示词ID列表，则只导出这些提示词
      if (promptIds && promptIds.length > 0) {
        query = query.in('id', promptIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`导出提示词失败: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('导出提示词时出错:', err);
      return [];
    }
  }
  
  async importPrompts(prompts: Prompt[], userId?: string): Promise<{success: number; failed: number; messages: string[]}> {
    const result = {
      success: 0,
      failed: 0,
      messages: [] as string[]
    };
    
    // 确保有用户ID
    let currentUserId = userId;
    if (!currentUserId) {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        currentUserId = currentUser.id;
      } else {
        throw new Error('无法导入提示词: 未提供用户ID且无当前登录用户');
      }
    }
    
    // 逐个导入提示词
    for (const prompt of prompts) {
      try {
        // 设置用户ID
        prompt.user_id = currentUserId;
        
        // 检查提示词是否已存在
        const existingPrompt = await this.getPrompt(prompt.name, currentUserId);
        
        if (existingPrompt) {
          // 如果存在同名提示词，更新它
          await this.updatePrompt(prompt.name, prompt, currentUserId);
          result.messages.push(`更新了提示词: ${prompt.name}`);
        } else {
          // 创建新的提示词
          await this.createPrompt(prompt);
          result.messages.push(`导入了新提示词: ${prompt.name}`);
        }
        
        result.success++;
      } catch (error) {
        result.failed++;
        result.messages.push(`导入提示词 ${prompt.name} 失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return result;
  }
  
  // ========= 认证相关方法 =========
  
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        throw new Error(`注册失败: ${error.message}`);
      }
      
      if (!data.user) {
        throw new Error('用户注册失败');
      }
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        display_name: (data.user.user_metadata?.display_name as string) || email.split('@')[0],
        created_at: data.user.created_at
      };
      
      return {
        user,
        token: data.session?.access_token || ''
      };
    } catch (err) {
      console.error('注册用户时出错:', err);
      throw err;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(`登录失败: ${error.message}`);
      }
      
      if (!data.user) {
        throw new Error('认证失败');
      }
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        display_name: (data.user.user_metadata?.display_name as string) || email.split('@')[0],
        created_at: data.user.created_at
      };
      
      return {
        user,
        token: data.session?.access_token || ''
      };
    } catch (err) {
      console.error('用户登录时出错:', err);
      throw err;
    }
  }

  async signInWithOAuth(provider: 'google' | 'github' | 'discord', redirectTo?: string): Promise<AuthResponse> {
    try {
      const { data: _data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${process.env.FRONTEND_URL || 'http://localhost:9011'}/auth/callback`,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        }
      });
      
      if (error) {
        throw new Error(`${provider} 登录失败: ${error.message}`);
      }
      
      // OAuth登录会重定向，所以这里不会有用户数据
      return {
        user: null,
        token: ''
      };
    } catch (err) {
      console.error(`${provider} OAuth登录时出错:`, err);
      throw err;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        throw new Error(`退出登录失败: ${error.message}`);
      }
    } catch (err) {
      console.error('退出登录时出错:', err);
      throw err;
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        display_name: (data.user.user_metadata?.display_name as string) || data.user.email?.split('@')[0] || '',
        created_at: data.user.created_at
      };
    } catch (err) {
      console.error('获取当前用户时出错:', err);
      return null;
    }
  }
  
  async verifyToken(token: string): Promise<User | null> {
    try {
      // 设置会话
      const { data, error } = await this.supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
      
      if (error || !data.user) {
        return null;
      }
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        display_name: (data.user.user_metadata?.display_name as string) || data.user.email?.split('@')[0] || '',
        created_at: data.user.created_at
      };
    } catch (err) {
      console.error('验证令牌时出错:', err);
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
    } catch (err) {
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
      logger.debug('开始验证API密钥', { apiKeyPrefix: apiKey.substring(0, 8) + '...' });

      // 计算密钥哈希
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      logger.debug('计算API密钥哈希', { hashPrefix: keyHash.substring(0, 16) + '...' });

      // 使用管理员客户端进行API密钥验证，绕过RLS策略
      const client = this.adminSupabase || this.supabase;



      // 查询有效的API密钥
      const { data, error } = await client
        .from('api_keys')
        .select('user_id, name, expires_at')
        .eq('key_hash', keyHash)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .single();

      if (error) {
        logger.warn('API密钥查询失败', {
          error: error.message,
          code: error.code,
          searchHash: keyHash.substring(0, 16) + '...'
        });
        return null;
      }

      if (!data) {
        logger.warn('未找到匹配的API密钥', { hashPrefix: keyHash.substring(0, 16) + '...' });
        return null;
      }

      logger.debug('找到API密钥记录', {
        userId: data.user_id,
        keyName: data.name,
        expiresAt: data.expires_at
      });

      // 获取用户信息，使用管理员客户端
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('id', data.user_id)
        .single();

      if (userError) {
        logger.warn('用户信息查询失败', {
          error: userError.message,
          code: userError.code,
          userId: data.user_id
        });
        return null;
      }

      if (!userData) {
        logger.warn('未找到用户信息', { userId: data.user_id });
        return null;
      }

      logger.info('API密钥验证成功', {
        userId: userData.id,
        userEmail: userData.email,
        keyName: data.name
      });

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
    } catch (err) {
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
  
  // 获取用户信息
  async getUser(userId: string): Promise<User | null> {
    try {

      // 使用管理员客户端绕过RLS策略
      const client = this.adminSupabase || this.supabase;

      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (error) {
        console.warn('获取用户信息时发生错误:', error);
        return null;
      }

      if (!data) {
        console.warn(`用户 ${userId} 不存在`);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        created_at: data.created_at
      };
    } catch (err) {
      console.error('获取用户信息时出错:', err);
      return null;
    }
  }

  // ========= 文件存储相关方法 =========

  /**
   * 上传资源文件到Supabase Storage
   * @param fileBuffer 文件缓冲区
   * @param filename 文件名
   * @param mimetype MIME类型
   * @param categoryType 分类类型
   * @returns 上传结果
   */
  async uploadAsset(
    fileBuffer: Buffer, 
    filename: string, 
    mimetype: string, 
    categoryType: 'image' | 'video'
  ): Promise<{success: boolean; url?: string; message?: string}> {
    try {
      logger.info('开始上传文件到Supabase Storage', {
        filename,
        mimetype,
        categoryType,
        size: fileBuffer.length
      });

      // 选择存储桶名称
      const bucketName = categoryType === 'image' ? 'images' : 'videos';
      
      // 使用管理员客户端进行上传
      const client = this.adminSupabase || this.supabase;
      
      // 上传文件到Storage
      const { data, error } = await client.storage
        .from(bucketName)
        .upload(filename, fileBuffer, {
          contentType: mimetype,
          upsert: false // 不覆盖已存在的文件
        });

      if (error) {
        logger.error('文件上传失败', { 
          error: error.message, 
          filename,
          bucketName 
        });
        return {
          success: false,
          message: `文件上传失败: ${error.message}`
        };
      }

      if (!data) {
        return {
          success: false,
          message: '文件上传失败: 未返回数据'
        };
      }

      // 获取公开URL
      const { data: urlData } = client.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!urlData.publicUrl) {
        return {
          success: false,
          message: '获取文件URL失败'
        };
      }

      logger.info('文件上传成功', {
        filename,
        url: urlData.publicUrl,
        path: data.path
      });

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      logger.error('上传文件时发生异常', { error, filename });
      return {
        success: false,
        message: `上传文件时发生异常: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取资源文件信息
   * @param filename 文件名
   * @returns 文件信息
   */
  async getAssetInfo(filename: string): Promise<{success: boolean; data?: Record<string, unknown>; message?: string}> {
    try {
      // 确定存储桶（根据文件名前缀）
      const isImage = filename.startsWith('image_');
      const isVideo = filename.startsWith('video_');
      
      if (!isImage && !isVideo) {
        return {
          success: false,
          message: '无法确定文件类型'
        };
      }

      const bucketName = isImage ? 'images' : 'videos';
      const client = this.adminSupabase || this.supabase;

      // 获取文件信息
      const { data, error } = await client.storage
        .from(bucketName)
        .list('', {
          search: filename
        });

      if (error) {
        logger.error('获取文件信息失败', { error: error.message, filename });
        return {
          success: false,
          message: `获取文件信息失败: ${error.message}`
        };
      }

      const fileInfo = data?.find(file => file.name === filename);
      if (!fileInfo) {
        return {
          success: false,
          message: '文件不存在'
        };
      }

      // 获取公开URL
      const { data: urlData } = client.storage
        .from(bucketName)
        .getPublicUrl(filename);

      return {
        success: true,
        data: {
          name: fileInfo.name,
          size: fileInfo.metadata?.size || 0,
          lastModified: fileInfo.updated_at,
          url: urlData.publicUrl,
          contentType: fileInfo.metadata?.mimetype
        }
      };

    } catch (error) {
      logger.error('获取文件信息时发生异常', { error, filename });
      return {
        success: false,
        message: `获取文件信息时发生异常: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除资源文件
   * @param filename 文件名
   * @returns 删除结果
   */
  async deleteAsset(filename: string): Promise<{success: boolean; message?: string}> {
    try {
      // 确定存储桶（根据文件名前缀）
      const isImage = filename.startsWith('image_');
      const isVideo = filename.startsWith('video_');
      
      if (!isImage && !isVideo) {
        return {
          success: false,
          message: '无法确定文件类型'
        };
      }

      const bucketName = isImage ? 'images' : 'videos';
      const client = this.adminSupabase || this.supabase;

      // 删除文件
      const { error } = await client.storage
        .from(bucketName)
        .remove([filename]);

      if (error) {
        logger.error('删除文件失败', { error: error.message, filename });
        return {
          success: false,
          message: `删除文件失败: ${error.message}`
        };
      }

      logger.info('文件删除成功', { filename });
      return {
        success: true
      };

    } catch (error) {
      logger.error('删除文件时发生异常', { error, filename });
      return {
        success: false,
        message: `删除文件时发生异常: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 验证文件URL是否有效
   * @param url 文件URL
   * @returns 验证结果
   */
  async validateAssetUrl(url: string): Promise<boolean> {
    try {
      // 检查URL格式
      if (!url || typeof url !== 'string') {
        return false;
      }

      // 检查是否是Supabase Storage URL
      // 修复：使用实际的bucket名称 images 和 videos
      const supabaseStoragePattern = new RegExp(
        `^${config.supabase.url}/storage/v1/object/public/(images|videos)/`
      );

      if (!supabaseStoragePattern.test(url)) {
        return false;
      }

      // 可以选择发送HEAD请求验证文件是否存在
      // 这里简化处理，仅验证URL格式
      return true;

    } catch (error) {
      logger.error('验证文件URL时发生异常', { error, url });
      return false;
    }
  }
  
}
