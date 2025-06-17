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
    this.adapter = new SupabaseAdapter(true); // 使用管理员权限
  }

  // ===== 提示词管理 =====

  /**
   * 获取所有分类（返回完整对象数组）
   */
  async getCategories(): Promise<any[]> {
    try {
      console.log('=== 开始获取categories表数据 ===');
      
      // 先尝试从专用的categories表获取完整对象，去除is_active过滤条件
      const { data: categoriesData, error: categoriesError } = await this.adapter.supabase
        .from('categories')
        .select('id, name, name_en, alias, description, sort_order, is_active')
        .order('sort_order');

      console.log('数据库查询结果:', {
        error: categoriesError,
        dataLength: categoriesData?.length || 0,
        data: categoriesData
      });

      if (!categoriesError && categoriesData && categoriesData.length > 0) {
        console.log('成功从categories表获取数据，数量:', categoriesData.length);
        console.log('返回的分类:', categoriesData.map(c => c.name));
        return categoriesData;
      }

      console.log('categories表查询失败或无数据，尝试备用方案');

      // 如果categories表查询失败，从prompts表中提取现有分类
      const { data: promptsData, error: promptsError } = await this.adapter.supabase
        .from('prompts')
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (!promptsError && promptsData) {
        const existingCategories = Array.from(new Set(
          promptsData.map(item => item.category).filter(Boolean)
        ));
        if (existingCategories.length > 0) {
          console.log('从prompts表提取的分类:', existingCategories);
          // 返回对象数组格式
          return existingCategories.map((name, idx) => ({
            id: undefined,
            name,
            name_en: undefined,
            alias: undefined,
            description: undefined,
            sort_order: idx + 100,
            is_active: true
          }));
        }
      }

      // 所有方案都失败时，抛出错误
      console.log('所有获取分类的方案都失败');
      throw new Error('无法从数据库获取分类数据');
      
    } catch (error) {
      console.error('获取分类失败:', error);
      // 直接抛出错误，不使用备用机制
      throw new Error(`获取分类失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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
   * 根据名称获取提示词详情
   */
  async getPromptByName(name: string, userId?: string): Promise<PromptDetails | null> {
    try {
      // 首先获取提示词基本信息
      const prompt = await this.adapter.getPrompt(name, userId);
      if (!prompt) {
        console.log(`提示词 ${name} 不存在或无权限访问`);
        return null;
      }

      // 然后获取作者信息
      let authorName = '未知用户';
      if (prompt.user_id) {
        try {
          const { data: userData, error: userError } = await this.adapter.supabase
            .from('users')
            .select('display_name, email')
            .eq('id', prompt.user_id)
            .single();

          if (!userError && userData) {
            authorName = userData.display_name || userData.email?.split('@')[0] || '未知用户';
          }
        } catch (userErr) {
          console.warn('获取用户信息失败，使用默认作者名:', userErr);
        }
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
        compatible_models: prompt.compatible_models || ['gpt-4', 'gpt-3.5-turbo', 'claude-3'], // 从数据库读取，否则使用默认兼容模型
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
        contentLength: content.length
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

  // ===== 辅助方法 =====

  /**
   * 根据用户ID获取用户名
   */
  private async getUsernameById(userId: string): Promise<string> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('users')
        .select('username, display_name')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return '未知用户';
      }

      return data.display_name || data.username || '未知用户';
    } catch (error) {
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
}

// 创建服务实例
export const databaseService = new DatabaseService();

// 默认导出
export default databaseService; 
