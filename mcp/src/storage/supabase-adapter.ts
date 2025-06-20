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
    data: any;
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
    operation: () => Promise<{ data: T; error: any }>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= this.connectionConfig.maxRetries; attempt++) {
      try {
        const { data, error } = await operation();

        if (error) {
          lastError = error;

          // 判断是否应该重试
          if (this.shouldRetry(error) && attempt < this.connectionConfig.maxRetries) {
            logger.warn(`Supabase operation failed, retrying (${attempt}/${this.connectionConfig.maxRetries})`, {
              operation: operationName,
              error: error.message,
              attempt,
              context
            });

            await this.delay(this.connectionConfig.retryDelay * attempt);
            continue;
          }

          // 记录错误并抛出
          const enhancedError = createEnhancedError(
            `${operationName} failed: ${error.message}`,
            this.mapErrorType(error),
            this.mapErrorSeverity(error),
            { ...context, attempt, supabaseError: error }
          );

          logger.error('Supabase operation failed', {
            operation: operationName,
            error: error.message,
            code: error.code,
            details: error.details,
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
            error: error.message,
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
  private shouldRetry(error: any): boolean {
    // 网络错误、超时错误、临时服务器错误应该重试
    const retryableCodes = ['PGRST301', 'PGRST302', '08000', '08003', '08006'];
    const retryableMessages = ['network', 'timeout', 'connection', 'temporary'];

    if (retryableCodes.includes(error.code)) {
      return true;
    }

    const errorMessage = (error.message || '').toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * 映射Supabase错误到内部错误类型
   */
  private mapErrorType(error: any): ErrorType {
    if (error.code === 'PGRST116') return ErrorType.NOT_FOUND;
    if (error.code === 'PGRST301') return ErrorType.AUTHENTICATION;
    if (error.code === 'PGRST302') return ErrorType.AUTHORIZATION;
    if (error.message?.includes('network')) return ErrorType.NETWORK;
    return ErrorType.STORAGE;
  }

  /**
   * 映射错误严重程度
   */
  private mapErrorSeverity(error: any): ErrorSeverity {
    if (error.code === 'PGRST116') return ErrorSeverity.LOW; // Not found
    if (error.code?.startsWith('08')) return ErrorSeverity.HIGH; // Connection errors
    if (error.message?.includes('timeout')) return ErrorSeverity.MEDIUM;
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
      return cached.data;
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

    try {
      const data = await this.executeWithRetry(
        () => this.supabase
          .from('prompts')
          .select('category')
          .not('category', 'is', null)
          .order('category'),
        'getCategories'
      );

      // 提取唯一分类并过滤空值
      const categories = Array.from(new Set(
        data
          .map(item => item.category)
          .filter(category => category && category.trim())
      )).sort();

      // 缓存结果
      this.setCachedResult(cacheKey, categories);

      return categories;
    } catch (error) {
      logger.error('获取分类失败', { error: error.message });
      return [];
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
      const data = await this.executeWithRetry(
        () => this.supabase
          .from('prompts')
          .select('tags')
          .not('tags', 'is', null),
        'getTags'
      );

      // 提取所有标签并去重，过滤空值
      const allTags = data
        .flatMap(item => item.tags || [])
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

      const data = await this.executeWithRetry(
        () => {
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

          return query;
        },
        'getPromptsByCategory',
        { category, userId, includePublic }
      );

      const result = data || [];

      // 缓存结果（较短的缓存时间）
      this.setCachedResult(cacheKey, result, 2 * 60 * 1000); // 2分钟缓存

      return result;
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
        tags,
        search,
        isPublic,
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

  async createPrompt(prompt: Prompt): Promise<Prompt> {
    try {
      // 确保有用户ID
      if (!prompt.user_id) {
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          prompt.user_id = currentUser.id;
        } else {
          // 使用系统用户ID作为默认值
          const systemUserId = '00000000-0000-5000-8000-000000000001';
          prompt.user_id = systemUserId;
          console.log('使用系统用户ID创建提示词:', systemUserId);
        }
      }
      
      const promptData = {
        name: prompt.name,
        description: prompt.description,
        category: prompt.category || '通用',
        tags: prompt.tags || [],
        messages: prompt.messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: prompt.version ? Number(prompt.version) : 1.0, // 新建提示词默认版本为1.0
        is_public: prompt.is_public !== undefined ? prompt.is_public : true, // 默认公开，便于分享和发现
        allow_collaboration: prompt.allow_collaboration !== undefined ? prompt.allow_collaboration : false, // 默认不允许协作编辑，保护创建者权益
        edit_permission: prompt.edit_permission || 'owner_only', // 默认仅创建者可编辑
        user_id: prompt.user_id
      };
      
      // 创建提示词 - 如果是系统用户，使用管理员客户端绕过RLS
      const isSystemUser = prompt.user_id === '00000000-0000-5000-8000-000000000001';
      const client = isSystemUser && this.adminSupabase ? this.adminSupabase : this.supabase;

      const { data, error } = await client
        .from('prompts')
        .insert([promptData])
        .select();

      if (error) {
        throw new Error(`创建提示词失败: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('创建提示词失败: 未返回数据');
      }
      
      const createdPrompt = data[0];
      
      // 创建初始版本
      await this.createPromptVersion({
        prompt_id: createdPrompt.id,
        version: createdPrompt.version || 1.0, // 使用创建的提示词的版本号
        messages: prompt.messages,
        description: prompt.description,
        category: prompt.category || '通用',
        tags: prompt.tags || [],
        user_id: prompt.user_id
      });
      
      return createdPrompt;
    } catch (err) {
      console.error('创建提示词时出错:', err);
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
      if (userId && existingPrompt.user_id !== userId && existingPrompt.user_id !== 'system-user') {
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
        messages: prompt.messages || existingPrompt.messages,
        description: prompt.description || existingPrompt.description,
        category: prompt.category || existingPrompt.category,
        tags: prompt.tags || existingPrompt.tags,
        user_id: userId || existingPrompt.user_id
      });
      
      return updatedPrompt;
    } catch (err) {
      console.error('更新提示词时出错:', err);
      throw err;
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
      if (userId && existingPrompt.user_id !== userId && existingPrompt.user_id !== 'system-user') {
        throw new Error('无权删除此提示词');
      }
      
      // 删除提示词
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
      // 创建基本查询
      let dbQuery = this.supabase
        .from('prompts')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
      
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
        messages: promptVersion.messages,
        description: promptVersion.description,
        category: promptVersion.category,
        tags: promptVersion.tags,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      // 如果是系统用户，使用管理员客户端绕过RLS
      const isSystemUser = userId === '00000000-0000-5000-8000-000000000001';
      const client = isSystemUser && this.adminSupabase ? this.adminSupabase : this.supabase;

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
      if (userId && promptData.user_id !== userId && promptData.user_id !== 'system-user') {
        throw new Error('无权恢复此提示词版本');
      }
      
      // 更新提示词为历史版本内容
      const updateData = {
        messages: versionToRestore.messages,
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
        messages: versionToRestore.messages,
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
      const { data, error } = await this.supabase.auth.signInWithOAuth({
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
      console.log(`[MCP Adapter] 获取用户信息，用户ID: ${userId}`);
      const { data, error } = await this.supabase
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

      console.log(`[MCP Adapter] 成功获取用户信息: ${data.display_name || data.email}`);
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
  
}
