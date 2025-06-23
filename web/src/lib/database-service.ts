/**
 * Web服务数据库服务层
 * 
 * 为Web服务提供完整的数据库访问功能，完全独立于MCP服务
 * 使用Supabase作为数据库访问层
 */

import { SupabaseAdapter, Prompt, PromptFilters, PaginatedResponse, User } from './supabase-adapter';
import type { PromptTemplate, TemplateCategory } from '@/types';

// 扩展的提示词详情接口
export interface PromptDetails extends Prompt {
  content?: string;
  input_variables?: string[];
  compatible_models?: string[];
  allow_collaboration?: boolean;
  edit_permission?: 'owner_only' | 'collaborators' | 'public';
  author?: string;
}

// 移除社交功能相关接口 - MCP服务专注于提示词管理

export interface Interaction {
  id: string;
  user_id: string;
  prompt_id: string;
  type: 'like' | 'dislike' | 'bookmark' | 'share';
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
}

export interface Post {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
}

/**
 * Web服务数据库服务类
 * 提供完整的业务数据访问功能
 */
export class DatabaseService {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter(true); // 使用管理员权限以便查询用户信息
  }

  // ===== 提示词管理 =====

  /**
   * 获取所有分类（返回完整对象数组）
   * 只从categories表获取数据，确保数据的一致性和完整性
   */
  async getCategories(): Promise<string[]> {
    try {
      console.log('=== 开始获取categories表数据 ===');
  
      // 首先检查categories表是否存在并获取数据
      const { data: categoriesData, error: categoriesError } = await this.adapter.supabase
        .from('categories')
        .select('id, name, name_en, alias, description, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order');
  
      console.log('数据库查询结果:', {
        error: categoriesError,
        errorCode: categoriesError?.code,
        errorMessage: categoriesError?.message,
        dataLength: categoriesData?.length || 0,
        data: categoriesData?.slice(0, 3) // 只显示前3个用于调试
      });
  
      // 如果查询成功且有数据，返回字符串数组
      if (!categoriesError && categoriesData && categoriesData.length > 0) {
        console.log('成功从categories表获取数据，数量:', categoriesData.length);
        const categoryNames = categoriesData.map(c => c.name);
        console.log('返回的分类名称:', categoryNames);
        return categoryNames;
      }
  
      // 如果categories表查询失败或没有数据，返回默认的字符串分类数组
      console.log('categories表查询失败或无数据，使用默认分类');
      if (categoriesError) {
        console.error('数据库错误详情:', {
          code: categoriesError.code,
          message: categoriesError.message,
          details: categoriesError.details,
          hint: categoriesError.hint
        });
      }
  
      return this.getDefaultCategoryNames();
  
    } catch (error) {
      console.error('获取分类失败:', error);
      console.log('发生异常，返回默认分类');
      return this.getDefaultCategoryNames();
    }
  }


  /**
   * 获取默认的20个预设分类
   * 当数据库中没有分类数据时使用
   */
  private getDefaultCategoryNames(): string[] {
    const defaultCategoryNames = [
      '通用', '学术', '职业', '文案', '设计', 
      '教育', '情感', '娱乐', '游戏', '生活',
      '商业', '办公', '编程', '翻译', '绘画',
      '视频', '播客', '音乐', '健康', '科技'
    ];
  
    console.log('使用默认分类名称，数量:', defaultCategoryNames.length);
    return defaultCategoryNames;
  }
  
  /**
   * 获取默认的20个预设分类对象（保留原有方法用于其他用途）
   * 当数据库中没有分类数据时使用
   */
  private getDefaultCategories(): any[] {
    const defaultCategories = [
      { id: '1', name: '通用', name_en: 'General', sort_order: 1, is_active: true },
      { id: '2', name: '学术', name_en: 'Academic', sort_order: 2, is_active: true },
      { id: '3', name: '职业', name_en: 'Professional', sort_order: 3, is_active: true },
      { id: '4', name: '文案', name_en: 'Copywriting', sort_order: 4, is_active: true },
      { id: '5', name: '设计', name_en: 'Design', sort_order: 5, is_active: true },
      { id: '6', name: '教育', name_en: 'Education', sort_order: 6, is_active: true },
      { id: '7', name: '情感', name_en: 'Emotional', sort_order: 7, is_active: true },
      { id: '8', name: '娱乐', name_en: 'Entertainment', sort_order: 8, is_active: true },
      { id: '9', name: '游戏', name_en: 'Gaming', sort_order: 9, is_active: true },
      { id: '10', name: '生活', name_en: 'Lifestyle', sort_order: 10, is_active: true },
      { id: '11', name: '商业', name_en: 'Business', sort_order: 11, is_active: true },
      { id: '12', name: '办公', name_en: 'Office', sort_order: 12, is_active: true },
      { id: '13', name: '编程', name_en: 'Programming', sort_order: 13, is_active: true },
      { id: '14', name: '翻译', name_en: 'Translation', sort_order: 14, is_active: true },
      { id: '15', name: '绘画', name_en: 'Drawing', sort_order: 15, is_active: true },
      { id: '16', name: '视频', name_en: 'Video', sort_order: 16, is_active: true },
      { id: '17', name: '播客', name_en: 'Podcast', sort_order: 17, is_active: true },
      { id: '18', name: '音乐', name_en: 'Music', sort_order: 18, is_active: true },
      { id: '19', name: '健康', name_en: 'Health', sort_order: 19, is_active: true },
      { id: '20', name: '科技', name_en: 'Technology', sort_order: 20, is_active: true }
    ];
  
    console.log('使用默认分类，数量:', defaultCategories.length);
    return defaultCategories;
  }


  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    return await this.adapter.getTags();
  }

  /**
   * 获取带使用频率的标签统计
   */
  async getTagsWithUsageStats(): Promise<Array<{tag: string, count: number}>> {
    return await this.adapter.getTagsWithUsageStats();
  }

  /**
   * 获取提示词列表
   */
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    return await this.adapter.getPrompts(filters);
  }

  /**
   * 根据名称或ID获取提示词详情
   * 支持通过UUID或名称查找提示词
   */
  async getPromptByName(nameOrId: string, userId?: string): Promise<PromptDetails | null> {
    try {
      console.log(`[DatabaseService] 开始获取提示词，标识符: ${nameOrId}, 用户ID: ${userId}`);

      // 检测是否为UUID格式
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
      console.log(`[DatabaseService] 标识符类型: ${isUuid ? 'UUID' : 'Name'}`);

      // 首先获取提示词基本信息
      const prompt = await this.adapter.getPrompt(nameOrId, userId);
      if (!prompt) {
        console.log(`[DatabaseService] 未找到提示词，标识符: ${nameOrId}`);
        return null;
      }

      console.log(`[DatabaseService] 找到提示词: ${prompt.name} (ID: ${prompt.id})`);

      // 然后获取作者信息
      let authorName = '未知用户';
      const authorUserId = prompt.user_id; // 只使用 user_id

      if (authorUserId) {
        try {
          console.log(`[DatabaseService] 开始获取用户信息，用户ID: ${authorUserId}`);
          const { data: userData, error: userError } = await this.adapter.supabase
            .from('users')
            .select('display_name, email')
            .eq('id', authorUserId)
            .maybeSingle(); // 使用 maybeSingle() 而不是 single()，避免在没有记录时抛出错误

          if (userError) {
            console.warn('获取用户信息时发生错误:', userError);
          } else if (userData) {
            if (userData.display_name) {
              authorName = userData.display_name;
              console.log(`[DatabaseService] 成功获取用户信息: ${authorName}`);
            } else if (userData.email) {
              // 如果没有 display_name，使用 email 的前缀作为备用
              authorName = userData.email.split('@')[0];
              console.log(`[DatabaseService] 使用邮箱前缀作为用户名: ${authorName}`);
            } else {
              console.warn(`[DatabaseService] 用户 ${authorUserId} 存在但没有 display_name 或 email`);
            }
          } else {
            console.warn(`[DatabaseService] 用户 ${authorUserId} 不存在`);
          }
        } catch (userErr) {
          console.warn('获取用户信息失败，使用默认作者名:', userErr);
        }
      } else {
        console.warn('[DatabaseService] 提示词没有 user_id 字段');
      }

      // 处理内容提取
      let content = '';
      if (prompt.messages && Array.isArray(prompt.messages) && prompt.messages.length > 0) {
        const firstMessage = prompt.messages[0];
        if (typeof firstMessage.content === 'string') {
          content = firstMessage.content;
        } else if (typeof firstMessage.content === 'object' && firstMessage.content?.text) {
          content = firstMessage.content.text;
        }
      }

      // 转换为PromptDetails格式
      const promptDetails: PromptDetails = {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description || '',
        category: prompt.category || '通用',
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        messages: prompt.messages || [],
        is_public: Boolean(prompt.is_public),
        user_id: prompt.user_id,
        version: prompt.version || 1,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        
        // 扩展字段
        content: content,
        input_variables: this.extractInputVariables(content),
        compatible_models: prompt.compatible_models || [], // 保持数据原始性，不添加假的默认值
        allow_collaboration: Boolean(prompt.is_public), // 基于是否公开来设置
        edit_permission: 'owner_only' as const, // 修复：改为前端期望的值
        author: authorName
      };

      console.log('getPromptByName - 最终处理的数据:', {
        name: promptDetails.name,
        category: promptDetails.category,
        tags: promptDetails.tags,
        input_variables: promptDetails.input_variables,
        edit_permission: promptDetails.edit_permission,
        author: promptDetails.author,
        user_id: promptDetails.user_id,
        contentLength: content.length
      });

      console.log('getPromptByName - 详细调试信息:', {
        prompt_user_id: prompt.user_id,
        // prompt_created_by 属性不存在，已移除
        final_author: authorName,
        prompt_is_public: prompt.is_public
      });

      return promptDetails;
    } catch (error) {
      console.error('获取提示词详情失败:', error);
      return null;
    }
  }

  /**
   * 创建新提示词
   */
  async createPrompt(promptData: Partial<PromptDetails>): Promise<Prompt> {
    // 转换PromptDetails为Prompt格式
    const prompt: Partial<Prompt> = {
      name: promptData.name,
      description: promptData.description,
      category: promptData.category,
      tags: promptData.tags,
      messages: promptData.content ? [{
        role: 'system',
        content: promptData.content
      }] : promptData.messages,
      is_public: promptData.is_public,
      user_id: promptData.user_id,
      version: promptData.version ? Number(promptData.version) : 1.0, // 新建提示词默认版本为1.0
      compatible_models: promptData.compatible_models // 添加兼容模型字段
    };

    return await this.adapter.createPrompt(prompt);
  }

  /**
   * 更新提示词
   */
  async updatePrompt(name: string, promptData: Partial<PromptDetails>, userId?: string): Promise<Prompt> {
    try {
      // 首先获取现有提示词
      const existingPrompt = await this.adapter.getPrompt(name, userId);
      if (!existingPrompt) {
        throw new Error('提示词不存在');
      }

      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权限修改此提示词');
      }

      // 转换更新数据
      const updateData: any = {};
      
      if (promptData.name !== undefined) updateData.name = promptData.name;
      if (promptData.description !== undefined) updateData.description = promptData.description;
      if (promptData.category !== undefined) updateData.category = promptData.category;
      if (promptData.tags !== undefined) updateData.tags = promptData.tags;
      if (promptData.is_public !== undefined) updateData.is_public = promptData.is_public;
      if (promptData.compatible_models !== undefined) updateData.compatible_models = promptData.compatible_models;
      
      // 处理content字段，转换为messages格式
      if (promptData.content !== undefined) {
        updateData.messages = [{
          role: 'system',
          content: promptData.content
        }];
      }

      // 版本号处理 - 编辑时默认+0.1（支持小数版本号）
      const currentVersion = existingPrompt.version || 1.0;
      updateData.version = Math.round((currentVersion + 0.1) * 10) / 10;
      updateData.updated_at = new Date().toISOString();

      // 执行更新
      const { data, error } = await this.adapter.supabase
        .from('prompts')
        .update(updateData)
        .eq('id', existingPrompt.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`更新提示词失败: ${error.message}`);
      }

      return data as Prompt;
    } catch (error) {
      console.error('更新提示词失败:', error);
      throw error;
    }
  }

  /**
   * 删除提示词
   */
  async deletePrompt(name: string, userId?: string): Promise<boolean> {
    try {
      const existingPrompt = await this.adapter.getPrompt(name, userId);
      if (!existingPrompt) {
        throw new Error('提示词不存在');
      }

      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权限删除此提示词');
      }

      const { error } = await this.adapter.supabase
        .from('prompts')
        .delete()
        .eq('id', existingPrompt.id);

      return !error;
    } catch (error) {
      console.error('删除提示词失败:', error);
      throw error;
    }
  }

  // ===== 基础功能 =====
  // 移除社交功能，MCP服务专注于提示词管理

  /**
   * 获取评论列表
   */
  async getComments(promptId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Comment>> {
    try {
      const offset = (page - 1) * pageSize;

      const { data, error, count } = await this.adapter.supabase
        .from('comments')
        .select(`
          *,
          user:users(username, display_name)
        `, { count: 'exact' })
        .eq('prompt_id', promptId)
        .is('parent_id', null) // 只获取顶级评论
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`获取评论失败: ${error.message}`);
      }

      // 获取回复
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const replies = await this.getCommentReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return {
        data: commentsWithReplies as Comment[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论回复
   */
  async getCommentReplies(commentId: string): Promise<Comment[]> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('comments')
        .select(`
          *,
          user:users(username, display_name)
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`获取回复失败: ${error.message}`);
      }

      return data as Comment[];
    } catch (error) {
      console.error('获取回复失败:', error);
      return [];
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.adapter.supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('删除评论失败:', error);
      return false;
    }
  }

  // ===== 模板相关方法 =====

  async getTemplates(filters?: {
    category?: string;
    subcategory?: string;
    difficulty?: string;
    featured?: boolean;
    premium?: boolean;
    official?: boolean;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PromptTemplate[]> {
    try {
      let query = this.adapter.supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_active', filters?.is_active ?? true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured);
      }

      if (filters?.premium !== undefined) {
        query = query.eq('is_premium', filters.premium);
      }

      if (filters?.official !== undefined) {
        query = query.eq('is_official', filters.official);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters?.limit || 10)) - 1);
      }

      query = query.order('sort_order', { ascending: true })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('获取模板失败:', error);
        throw new Error('获取模板失败');
      }

      if (!data || data.length === 0) {
        return [];
      }

      // 获取所有分类信息
      const categories = await this.getTemplateCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name, cat]));

      return data.map(template => this.transformTemplateData(template, categoryMap.get(template.category)));
    } catch (error) {
      console.error('获取模板失败:', error);
      return [];
    }
  }

  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('获取模板详情失败:', error);
        return null;
      }

      if (!data) return null;

      // 获取分类信息
      const categories = await this.getTemplateCategories();
      const categoryInfo = categories.find(cat => cat.name === data.category);

      return this.transformTemplateData(data, categoryInfo);
    } catch (error) {
      console.error('获取模板详情失败:', error);
      return null;
    }
  }

  async getTemplateCategories(): Promise<TemplateCategory[]> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('获取模板分类失败:', error);
        throw new Error('获取模板分类失败');
      }

      return data || [];
    } catch (error) {
      console.error('获取模板分类失败:', error);
      return [];
    }
  }

  async incrementTemplateUsage(templateId: string, userId?: string): Promise<void> {
    try {
      // 增加使用次数
      await this.adapter.supabase
        .rpc('increment_template_usage', { template_id: templateId });

      // 记录使用统计
      if (userId) {
        await this.adapter.supabase
          .from('template_usage_stats')
          .insert({
            template_id: templateId,
            user_id: userId,
            used_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('更新模板使用统计失败:', error);
    }
  }

  async rateTemplate(templateId: string, userId: string, rating: number, comment?: string): Promise<void> {
    try {
      await this.adapter.supabase
        .from('template_ratings')
        .upsert({
          template_id: templateId,
          user_id: userId,
          rating,
          comment,
          updated_at: new Date().toISOString()
        });

      // 更新模板平均评分
      await this.updateTemplateRating(templateId);
    } catch (error) {
      console.error('评分模板失败:', error);
      throw new Error('评分模板失败');
    }
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      if (error || !data || data.length === 0) return;

      const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;

      await this.adapter.supabase
        .from('prompt_templates')
        .update({ rating: Number(averageRating.toFixed(2)) })
        .eq('id', templateId);
    } catch (error) {
      console.error('更新模板评分失败:', error);
    }
  }

  private transformTemplateData(data: any, categoryInfo?: TemplateCategory): PromptTemplate {
    return {
      id: data.id,
      name: data.name,
      title: data.title,
      description: data.description,
      content: data.content,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags || [],
      difficulty: data.difficulty,
      variables: data.variables || [],
      fields: data.fields || [],
      author: data.author,
      likes: data.likes || 0,
      usage_count: data.usage_count || 0,
      rating: data.rating || 0,
      estimated_time: data.estimated_time,
      language: data.language || 'zh-CN',
      is_featured: data.is_featured || false,
      is_premium: data.is_premium || false,
      is_official: data.is_official || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category_info: categoryInfo ? {
        name: categoryInfo.name,
        display_name: categoryInfo.display_name,
        icon: categoryInfo.icon,
        color: categoryInfo.color
      } : undefined
    };
  }

  // ===== 性能分析方法 =====

  /**
   * 获取提示词性能数据
   */
  async getPromptPerformance(promptId: string): Promise<any> {
    try {
      console.log(`[DatabaseService] 获取提示词性能数据，ID: ${promptId}`);

      // 获取性能汇总数据
      const { data: performanceData, error: performanceError } = await this.adapter.supabase
        .from('prompt_performance')
        .select('*')
        .eq('prompt_id', promptId);

      if (performanceError) {
        console.error('获取性能数据失败:', performanceError);
        return null;
      }

      // 如果没有性能数据，返回默认值
      if (!performanceData || performanceData.length === 0) {
        console.log('没有找到性能数据，返回默认值');
        return {
          prompt_id: promptId,
          total_usage: 0,
          success_rate: 0,
          average_rating: 0,
          feedback_count: 0,
          average_latency: 0,
          token_stats: {
            total_input: 0,
            total_output: 0,
            input_avg: 0,
            output_avg: 0
          },
          version_distribution: {}
        };
      }

      // 聚合所有版本的数据
      const totalUsage = performanceData.reduce((sum, p) => sum + (p.usage_count || 0), 0);
      const totalFeedback = performanceData.reduce((sum, p) => sum + (p.feedback_count || 0), 0);
      const avgRating = totalFeedback > 0
        ? performanceData.reduce((sum, p) => sum + ((p.avg_rating || 0) * (p.feedback_count || 0)), 0) / totalFeedback
        : 0;
      const avgLatency = totalUsage > 0
        ? performanceData.reduce((sum, p) => sum + ((p.avg_latency_ms || 0) * (p.usage_count || 0)), 0) / totalUsage
        : 0;
      const totalInputTokens = performanceData.reduce((sum, p) => sum + ((p.avg_input_tokens || 0) * (p.usage_count || 0)), 0);
      const totalOutputTokens = performanceData.reduce((sum, p) => sum + ((p.avg_output_tokens || 0) * (p.usage_count || 0)), 0);

      // 版本分布
      const versionDistribution: Record<string, number> = {};
      performanceData.forEach(p => {
        const version = p.prompt_version?.toString() || '1';
        versionDistribution[version] = p.usage_count || 0;
      });

      const result = {
        prompt_id: promptId,
        total_usage: totalUsage,
        success_rate: 1.0, // 默认成功率，可以根据实际需求调整
        average_rating: Math.round(avgRating * 100) / 100,
        feedback_count: totalFeedback,
        average_latency: Math.round(avgLatency),
        token_stats: {
          total_input: totalInputTokens,
          total_output: totalOutputTokens,
          input_avg: totalUsage > 0 ? Math.round(totalInputTokens / totalUsage) : 0,
          output_avg: totalUsage > 0 ? Math.round(totalOutputTokens / totalUsage) : 0
        },
        version_distribution: versionDistribution
      };

      console.log(`[DatabaseService] 性能数据聚合完成:`, result);
      return result;
    } catch (error) {
      console.error('获取提示词性能数据失败:', error);
      return null;
    }
  }

  /**
   * 生成性能报告
   */
  async generatePerformanceReport(promptId: string): Promise<any> {
    try {
      console.log(`[DatabaseService] 生成性能报告，ID: ${promptId}`);

      // 获取提示词基本信息
      const prompt = await this.adapter.getPrompt(promptId);
      if (!prompt) {
        console.log('提示词不存在');
        return null;
      }

      // 获取性能数据
      const performanceData = await this.getPromptPerformance(promptId);
      if (!performanceData) {
        console.log('无法获取性能数据');
        return null;
      }

      // 获取最近的使用记录
      const { data: recentUsage, error: usageError } = await this.adapter.supabase
        .from('prompt_usage')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (usageError) {
        console.warn('获取最近使用记录失败:', usageError);
      }

      // 获取反馈主题
      const { data: feedbackData, error: feedbackError } = await this.adapter.supabase
        .from('prompt_feedback')
        .select('feedback_text, rating, categories')
        .in('usage_id', (recentUsage || []).map(u => u.id))
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.warn('获取反馈数据失败:', feedbackError);
      }

      // 生成优化建议
      const suggestions = this.generateOptimizationSuggestions(performanceData, recentUsage || []);

      const report = {
        prompt: {
          id: prompt.id,
          name: prompt.name,
          description: prompt.description,
          category: prompt.category,
          version: prompt.version
        },
        currentVersion: prompt.version,
        performance: {
          totalUsageCount: performanceData.total_usage,
          averageRating: performanceData.average_rating,
          averageLatency: performanceData.average_latency,
          totalTokens: performanceData.token_stats.total_input + performanceData.token_stats.total_output,
          estimatedCost: this.calculateEstimatedCost(performanceData.token_stats)
        },
        versionComparison: [performanceData], // 简化版本比较
        recentUsage: recentUsage || [],
        feedbackThemes: this.analyzeFeedbackThemes(feedbackData || []),
        optimizationSuggestions: suggestions
      };

      console.log(`[DatabaseService] 性能报告生成完成`);
      return report;
    } catch (error) {
      console.error('生成性能报告失败:', error);
      return null;
    }
  }

  /**
   * 记录提示词使用
   */
  async trackPromptUsage(usageData: {
    prompt_id: string;
    prompt_version?: number;
    model: string;
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    user_id?: string;
    session_id?: string;
    client_metadata?: any;
  }): Promise<string | null> {
    try {
      console.log(`[DatabaseService] 记录提示词使用:`, usageData);

      const { data, error } = await this.adapter.supabase
        .from('prompt_usage')
        .insert([{
          prompt_id: usageData.prompt_id,
          prompt_version: usageData.prompt_version || 1,
          user_id: usageData.user_id,
          session_id: usageData.session_id || this.generateSessionId(),
          model: usageData.model,
          input_tokens: usageData.input_tokens,
          output_tokens: usageData.output_tokens,
          latency_ms: usageData.latency_ms,
          client_metadata: usageData.client_metadata || {}
        }])
        .select('id')
        .single();

      if (error) {
        console.error('记录使用数据失败:', error);
        return null;
      }

      console.log(`[DatabaseService] 使用记录已保存，ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('记录提示词使用失败:', error);
      return null;
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(promptId: string, timeRange: string = '7d'): Promise<any> {
    try {
      console.log(`[DatabaseService] 获取性能指标，ID: ${promptId}, 时间范围: ${timeRange}`);

      // 计算时间范围
      const now = new Date();
      const daysAgo = this.parseTimeRange(timeRange);
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // 获取时间范围内的使用数据
      const { data: usageData, error: usageError } = await this.adapter.supabase
        .from('prompt_usage')
        .select('*')
        .eq('prompt_id', promptId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (usageError) {
        console.error('获取使用数据失败:', usageError);
        throw new Error('获取使用数据失败');
      }

      // 获取反馈数据
      const usageIds = (usageData || []).map(u => u.id);
      const { data: feedbackData, error: feedbackError } = await this.adapter.supabase
        .from('prompt_feedback')
        .select('*')
        .in('usage_id', usageIds);

      if (feedbackError) {
        console.warn('获取反馈数据失败:', feedbackError);
      }

      // 计算指标
      const metrics = this.calculateMetrics(usageData || [], feedbackData || [], timeRange);

      console.log(`[DatabaseService] 性能指标计算完成`);
      return metrics;
    } catch (error) {
      console.error('获取性能指标失败:', error);
      throw error;
    }
  }

  // ===== 辅助方法 =====

  /**
   * 根据用户ID获取用户名
   */
  private async getUsernameById(userId: string): Promise<string> {
    try {
      console.log(`[DatabaseService] 获取用户名，用户ID: ${userId}`);
      const { data, error } = await this.adapter.supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (error) {
        console.warn('获取用户名时发生错误:', error);
        return '未知用户';
      }

      if (!data || !data.display_name) {
        console.warn(`用户 ${userId} 不存在或没有 display_name`);
        return '未知用户';
      }

      console.log(`[DatabaseService] 成功获取用户名: ${data.display_name}`);
      return data.display_name;
    } catch (error) {
      console.warn('获取用户名失败:', error);
      return '未知用户';
    }
  }

  /**
   * 从提示词内容中提取输入变量
   */
  private extractInputVariables(content: string): string[] {
    if (!content) return [];

    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return Array.from(new Set(
      matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
    )).filter(variable => variable.length > 0);
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 解析时间范围
   */
  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/^(\d+)([hdwm])$/);
    if (!match) return 7; // 默认7天

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h': return value / 24; // 小时转天
      case 'd': return value;      // 天
      case 'w': return value * 7;  // 周转天
      case 'm': return value * 30; // 月转天（近似）
      default: return 7;
    }
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(usageData: any[], feedbackData: any[], timeRange: string): any {
    const totalUsage = usageData.length;
    const avgResponseTime = totalUsage > 0
      ? usageData.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / totalUsage / 1000
      : 0;

    const avgTokens = totalUsage > 0
      ? usageData.reduce((sum, u) => sum + (u.input_tokens || 0) + (u.output_tokens || 0), 0) / totalUsage
      : 0;

    const avgRating = feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackData.length
      : 0;

    // 生成时间序列数据
    const timeSeriesData = this.generateTimeSeriesData(usageData, timeRange);

    return {
      overall_score: this.calculateOverallScore(avgResponseTime, avgRating, totalUsage),
      avg_response_time: Math.round(avgResponseTime * 100) / 100,
      response_time_trend: 'stable',
      response_time_change: 0,
      success_rate: 1.0, // 假设所有请求都成功
      success_rate_trend: 'stable',
      success_rate_change: 0,
      avg_tokens: Math.round(avgTokens),
      token_usage_trend: 'stable',
      user_satisfaction: Math.round(avgRating * 100) / 100,
      satisfaction_trend: 'stable',
      satisfaction_count: feedbackData.length,
      time_series: timeSeriesData,
      usage_distribution: {
        labels: ['今日', '昨日', '本周', '本月'],
        values: [totalUsage, 0, totalUsage, totalUsage] // 简化数据
      }
    };
  }

  /**
   * 生成时间序列数据
   */
  private generateTimeSeriesData(usageData: any[], timeRange: string): any {
    const days = this.parseTimeRange(timeRange);
    const labels: string[] = [];
    const responseTimes: number[] = [];
    const usageCounts: number[] = [];

    // 生成日期标签
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toISOString().split('T')[0]);

      // 计算该日的数据
      const dayData = usageData.filter(u => {
        const usageDate = new Date(u.created_at).toISOString().split('T')[0];
        return usageDate === labels[labels.length - 1];
      });

      usageCounts.push(dayData.length);
      responseTimes.push(
        dayData.length > 0
          ? dayData.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / dayData.length / 1000
          : 0
      );
    }

    return {
      labels,
      response_times: responseTimes,
      usage_counts: usageCounts
    };
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(avgResponseTime: number, avgRating: number, totalUsage: number): number {
    // 简化的评分算法
    let score = 50; // 基础分

    // 响应时间评分 (越快越好)
    if (avgResponseTime < 1) score += 20;
    else if (avgResponseTime < 3) score += 10;
    else if (avgResponseTime > 10) score -= 20;

    // 用户评分
    if (avgRating > 0) {
      score += (avgRating - 3) * 10; // 3分为中性，高于3分加分，低于3分扣分
    }

    // 使用量评分
    if (totalUsage > 100) score += 10;
    else if (totalUsage > 10) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(performanceData: any, recentUsage: any[]): any[] {
    const suggestions = [];

    // 基于响应时间的建议
    if (performanceData.average_latency > 5000) {
      suggestions.push({
        title: '优化响应时间',
        description: '当前平均响应时间较长，建议优化提示词长度或模型选择',
        priority: 'high',
        expected_improvement: '减少30-50%响应时间',
        implementation_effort: 'medium'
      });
    }

    // 基于评分的建议
    if (performanceData.average_rating < 3.5 && performanceData.feedback_count > 5) {
      suggestions.push({
        title: '提升用户满意度',
        description: '用户评分偏低，建议优化提示词内容和结构',
        priority: 'high',
        expected_improvement: '提升用户满意度20-30%',
        implementation_effort: 'high'
      });
    }

    // 基于使用量的建议
    if (performanceData.total_usage < 10) {
      suggestions.push({
        title: '增加使用推广',
        description: '使用量较低，建议增加推广或改进提示词描述',
        priority: 'medium',
        expected_improvement: '增加50%使用量',
        implementation_effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * 分析反馈主题
   */
  private analyzeFeedbackThemes(feedbackData: any[]): string[] {
    const themes = [];

    if (feedbackData.length === 0) {
      return ['暂无用户反馈'];
    }

    const positiveCount = feedbackData.filter(f => f.rating >= 4).length;
    const negativeCount = feedbackData.filter(f => f.rating <= 2).length;

    if (positiveCount > negativeCount) {
      themes.push('用户整体满意度较高');
    } else if (negativeCount > positiveCount) {
      themes.push('需要改进用户体验');
    } else {
      themes.push('用户反馈较为中性');
    }

    // 分析反馈文本中的关键词（简化版）
    const allFeedback = feedbackData
      .map(f => f.feedback_text)
      .filter(text => text && text.length > 0)
      .join(' ');

    if (allFeedback.includes('快') || allFeedback.includes('速度')) {
      themes.push('用户关注响应速度');
    }
    if (allFeedback.includes('准确') || allFeedback.includes('正确')) {
      themes.push('用户关注准确性');
    }
    if (allFeedback.includes('有用') || allFeedback.includes('帮助')) {
      themes.push('用户认为内容有帮助');
    }

    return themes.length > 0 ? themes : ['暂无明显反馈主题'];
  }

  /**
   * 计算预估成本
   */
  private calculateEstimatedCost(tokenStats: any): number {
    // 简化的成本计算，基于token数量
    // 假设每1000个token成本为$0.002 (GPT-3.5-turbo价格)
    const totalTokens = tokenStats.total_input + tokenStats.total_output;
    return Math.round(totalTokens * 0.002 / 1000 * 100) / 100; // 保留两位小数
  }
}

// 创建服务实例
export const databaseService = new DatabaseService();

// 默认导出
export default databaseService; 
